import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  useChatMessages,
  useChatSessions,
  useCreateChatSession,
  useSendMessage,
} from "@/hooks/use-chat";
import { getErrorMessage } from "@/lib/errors";

export function ChatTab({ contractId }: { contractId: string }) {
  const { data: sessions } = useChatSessions(contractId);
  const createSession = useCreateChatSession(contractId);
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const sessionId = activeSessionId ?? sessions?.[0]?.id;
  const { data: messages } = useChatMessages(sessionId);
  const sendMessage = useSendMessage(sessionId ?? "");

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function handleStartSession() {
    const session = await createSession.mutateAsync();
    setActiveSessionId(session.id);
  }

  function handleSend() {
    if (!input.trim() || !sessionId) return;
    sendMessage.mutate(input.trim());
    setInput("");
  }

  if (!sessions) {
    return <p className="text-sm text-ink-400">Loading...</p>;
  }

  if (!sessionId) {
    return (
      <div>
        <h3 className="font-display text-lg text-ink-900">Chat with this contract</h3>
        <p className="mt-2 text-sm text-ink-400">
          Ask questions and get answers grounded in this contract's actual text, with page citations.
        </p>
        <Button className="mt-4" onClick={handleStartSession} disabled={createSession.isPending}>
          {createSession.isPending ? "Starting..." : "Start a conversation"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-[500px] flex-col">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto pr-1">
        {messages?.length === 0 && (
          <p className="text-sm text-ink-400">Ask a question about this contract to get started.</p>
        )}
        {messages?.map((message) => (
          <div
            key={message.id}
            className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-lg px-4 py-2.5 text-sm",
                message.role === "user"
                  ? "bg-emerald-600 text-paper"
                  : "border border-ink-100 bg-white text-ink-900",
              )}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              {message.cited_chunk_ids.length > 0 && (
                <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wide text-ink-400">
                  Grounded in {message.cited_chunk_ids.length} clause
                  {message.cited_chunk_ids.length === 1 ? "" : "s"} from this contract
                </p>
              )}
            </div>
          </div>
        ))}
        {sendMessage.isPending && (
          <p className="text-sm text-ink-400">Thinking...</p>
        )}
      </div>

      {sendMessage.isError && (
        <p className="mt-2 text-sm text-risk-600">{getErrorMessage(sendMessage.error)}</p>
      )}

      <div className="mt-3 flex gap-2 border-t border-ink-100 pt-3">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask about payment terms, termination, confidentiality..."
          rows={2}
          className="resize-none"
        />
        <Button onClick={handleSend} disabled={sendMessage.isPending || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}