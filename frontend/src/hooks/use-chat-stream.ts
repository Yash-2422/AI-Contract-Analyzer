import { useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth-store";
import { apiClient } from "@/lib/api-client";
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
  // call started (e.g. user sends a second message before the first
  // stream finishes) - only the latest call's writes are allowed through.
  const requestIdRef = useRef(0);

  const sendStreamingMessage = useCallback(
    async (sessionId: string, content: string) => {
      const thisRequestId = ++requestIdRef.current;
      setStreamedText("");
      setError(null);
      setIsStreaming(true);

      try {
        const baseURL = apiClient.defaults.baseURL ?? "/api/v1";
        const accessToken = useAuthStore.getState().accessToken;

        const response = await fetch(`${baseURL}/chat/sessions/${sessionId}/messages/stream`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          credentials: "include",
          body: JSON.stringify({ content }),
        });

        if (!response.ok || !response.body) {
          throw new Error(`Stream request failed: ${response.status}`);
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
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice("data: ".length);
            try {
              const parsed = JSON.parse(payload) as { token?: string };
              if (parsed.token) {
                setStreamedText((prev) => prev + parsed.token);
              }
            } catch {
              // Ignore malformed keep-alive/done events without a token field.
            }
          }
        }
      } catch (err) {
        if (thisRequestId === requestIdRef.current) {
          setError(err instanceof Error ? err.message : "Something went wrong.");
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