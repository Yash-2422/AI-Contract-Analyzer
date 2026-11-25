import { useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  apiClient,
  getAccessTokenForRequest,
  refreshAccessTokenForRequest,
} from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

interface UseChatStreamResult {
  streamedText: string;
  isStreaming: boolean;
  error: string | null;
  sendStreamingMessage: (sessionId: string, content: string) => Promise<void>;
}

export function useChatStream(): UseChatStreamResult {
  const [streamedText, setStreamedText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  // Guards against a stale response still writing to state after a newer
  // call started - only the latest call's writes are allowed through.
  const requestIdRef = useRef(0);

  const sendStreamingMessage = useCallback(
    async (sessionId: string, content: string) => {
      const thisRequestId = ++requestIdRef.current;
      setStreamedText("");
      setError(null);
      setIsStreaming(true);

      try {
        const baseURL = apiClient.defaults.baseURL ?? "/api/v1";

        async function requestStream(token: string | null) {
          return fetch(`${baseURL}/chat/sessions/${sessionId}/messages/stream`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            credentials: "include",
            body: JSON.stringify({ content }),
          });
        }

        let response = await requestStream(await getAccessTokenForRequest());

        // A stream request can outlive the access token in a long-lived tab.
        // Refresh once using the same rotating-token flow and retry before
        // surfacing an error.
        if (response.status === 401) {
          const refreshedToken = await refreshAccessTokenForRequest();
          response = await requestStream(refreshedToken);
        }

        if (!response.ok || !response.body) {
          throw new Error(
            response.status === 401
              ? "Your session expired. Sign in again to continue."
              : `The assistant couldn't respond (${response.status}).`,
          );
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (thisRequestId !== requestIdRef.current) return; // superseded

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? ""; // keep any incomplete trailing event

          for (const line of lines) {
            const dataLine = line
              .split("\n")
              .find((part) => part.startsWith("data: "));
            if (!dataLine) continue;

            const payload = dataLine.slice("data: ".length);
            try {
              const parsed = JSON.parse(payload) as { token?: string };
              if (parsed.token) {
                setStreamedText((previous) => previous + parsed.token);
              }
            } catch {
              // Ignore malformed keep-alive/done events without a token field.
            }
          }
        }
      } catch (err) {
        if (thisRequestId === requestIdRef.current) {
          setError(
            err instanceof Error
              ? err.message
              : "The assistant couldn't respond. Please try again.",
          );
        }
      } finally {
        if (thisRequestId === requestIdRef.current) {
          setIsStreaming(false);
          // Refresh the persisted history + dashboard counts now that the
          // backend has saved the final assistant message.
          queryClient.invalidateQueries({ queryKey: queryKeys.chatMessages(sessionId) });
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
        }
      }
    },
    [queryClient],
  );

  return { streamedText, isStreaming, error, sendStreamingMessage };
}
