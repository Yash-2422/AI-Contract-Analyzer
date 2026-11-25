import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  Loader2,
  MessageSquarePlus,
  MessageSquareText,
  Plus,
  SendHorizonal,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip } from "@/components/ui/tooltip";
import { ChatMessageBubble, ChatTypingIndicator } from "@/components/chat/chat-message";
import { useChatMessages, useChatSessions, useCreateChatSession } from "@/hooks/use-chat";
import { useChatStream } from "@/hooks/use-chat-stream";
import { getErrorMessage } from "@/lib/errors";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/api";

const STARTER_PROMPTS = [
  "What are the termination terms?",
  "Summarize the payment obligations.",
  "Is there an auto-renewal clause?",
  "What obligations survive termination?",
];

export function ChatTab({ contractId }: { contractId: string }) {
  const queryClient = useQueryClient();
  const { data: sessions, isLoading: sessionsLoading, isError: sessionsError } =
    useChatSessions(contractId);
  const createSession = useCreateChatSession(contractId);
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const shouldAutoScroll = useRef(true);

  const sessionId = activeSessionId ?? sessions?.[0]?.id;
  const { data: messages, isLoading: messagesLoading } = useChatMessages(sessionId);
  const { streamedText, isStreaming, error, sendStreamingMessage } = useChatStream();

  const activeSession = sessions?.find((session) => session.id === sessionId);
  const visibleMessages = messages ?? [];

  useEffect(() => {
    shouldAutoScroll.current = true;
  }, [sessionId]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element || !shouldAutoScroll.current) return;
    element.scrollTo({
      top: element.scrollHeight,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }, [isStreaming, messages, streamedText]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 152)}px`;
  }, [input]);

  function handleScroll() {
    const element = scrollRef.current;
    if (!element) return;
    const distanceFromBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight;
    shouldAutoScroll.current = distanceFromBottom < 96;
  }

  async function handleStartSession() {
    try {
      const session = await createSession.mutateAsync();
      setActiveSessionId(session.id);
      requestAnimationFrame(() => textareaRef.current?.focus());
    } catch {
      // The error is rendered beneath the start card.
    }
  }

  function handleSend() {
    const content = input.trim();
    if (!content || !sessionId || isStreaming) return;

    const optimisticMessage: ChatMessage = {
      id: `local-${Date.now()}`,
      role: "user",
      content,
      cited_chunk_ids: [],
      created_at: new Date().toISOString(),
    };
    queryClient.setQueryData<ChatMessage[]>(queryKeys.chatMessages(sessionId), (previous) => [
      ...(previous ?? []),
      optimisticMessage,
    ]);

    setInput("");
    shouldAutoScroll.current = true;
    requestAnimationFrame(() => textareaRef.current?.focus());
    void sendStreamingMessage(sessionId, content);
  }

  if (sessionsLoading) {
    return (
      <div className="rounded-xl border border-ink-100 bg-surface p-6 shadow-card">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="mt-6 h-40 w-full" />
        <Skeleton className="mt-4 h-12 w-full" />
      </div>
    );
  }

  if (sessionsError) {
    return (
      <Alert tone="error">
        We couldn't load the conversations for this contract. Refresh the page to try again.
      </Alert>
    );
  }

  if (!sessionId) {
    return (
      <div className="overflow-hidden rounded-xl border border-ink-100 bg-surface shadow-card">
        <div className="grid gap-8 p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
          <div>
            <p className="rule-label">Grounded conversation</p>
            <h2 className="mt-2 max-w-md font-display text-3xl leading-tight tracking-[-0.02em] text-ink-900">
              Ask this contract
              <br />
              <span className="italic text-primary">a direct question.</span>
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-400">
              Answers are drawn only from this document and carry page-level citations.
              If the contract doesn't address something, the assistant will say so.
            </p>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[0.58rem] uppercase tracking-[0.1em] text-ink-400">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-brass" /> Page citations
              </span>
              <span className="flex items-center gap-1.5">
                <MessageSquareText className="h-3 w-3 text-primary" /> Persistent history
              </span>
            </div>
            {createSession.isError && (
              <Alert tone="error" className="mt-4">
                {getErrorMessage(createSession.error, "We couldn't start a conversation.")}
              </Alert>
            )}
          </div>
          <Button size="lg" onClick={handleStartSession} disabled={createSession.isPending}>
            {createSession.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Starting…
              </>
            ) : (
              <>
                <MessageSquarePlus className="h-4 w-4" />
                Start a conversation
              </>
            )}
          </Button>
        </div>
        <div className="border-t border-ink-100 bg-paper/40 px-6 py-3 font-mono text-[0.56rem] uppercase tracking-[0.1em] text-ink-400 sm:px-8">
          Private to your workspace · Answers are not legal advice
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[65vh] min-h-[30rem] max-h-[46rem] flex-col overflow-hidden rounded-xl border border-ink-100 bg-surface shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-primary-soft text-primary">
            <MessageSquareText className="h-4 w-4" strokeWidth={1.8} />
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[0.55rem] uppercase tracking-[0.12em] text-ink-400">
              Conversation
            </p>
            <p className="max-w-[14rem] truncate text-xs font-medium text-ink-900">
              {activeSession?.title ?? "New conversation"}
            </p>
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-2">
          {sessions && sessions.length > 1 && (
            <Select
              value={sessionId}
              onChange={(event) => setActiveSessionId(event.target.value)}
              disabled={isStreaming}
              aria-label="Choose conversation"
              className="h-8 w-[10.5rem] text-xs"
            >
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.title}
                </option>
              ))}
            </Select>
          )}
          <Tooltip content="New conversation">
            <Button
              size="icon"
              variant="outline"
              onClick={handleStartSession}
              disabled={createSession.isPending || isStreaming}
              aria-label="New conversation"
              className="h-8 w-8"
            >
              {createSession.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
            </Button>
          </Tooltip>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-paper/25 px-4 py-5 sm:px-6"
      >
        {messagesLoading && (
          <div className="space-y-4">
            <Skeleton className="h-16 w-3/4 rounded-xl" />
            <Skeleton className="ml-auto h-12 w-2/3 rounded-xl" />
            <Skeleton className="h-20 w-4/5 rounded-xl" />
          </div>
        )}

        {!messagesLoading && visibleMessages.length === 0 && !isStreaming && (
          <div className="flex h-full min-h-[18rem] flex-col items-center justify-center px-2 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-brass/25 bg-brass/10 text-brass">
              <Sparkles className="h-5 w-5" strokeWidth={1.7} />
            </span>
            <h3 className="mt-4 font-display text-xl text-ink-900">A direct line to the document.</h3>
            <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-ink-400">
              Start with one of these, or ask your own question. Every answer cites the
              pages it used.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => {
                    setInput(prompt);
                    requestAnimationFrame(() => textareaRef.current?.focus());
                  }}
                  className="rounded-full border border-ink-200 bg-surface px-3 py-1.5 text-[0.6875rem] text-ink-600 transition-colors hover:border-primary/30 hover:bg-primary-soft/50 hover:text-ink-900"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {visibleMessages.map((message) => (
          <ChatMessageBubble key={message.id} message={message} />
        ))}

        {isStreaming && <ChatTypingIndicator text={streamedText || undefined} />}
      </div>

      {error && (
        <div className="border-t border-risk-600/15 bg-risk-50/70 px-4 py-2.5 sm:px-5">
          <p className="text-xs text-risk-600">
            {error} Your message is saved; you can try sending again.
          </p>
        </div>
      )}

      <div className="border-t border-ink-100 bg-surface p-3 sm:p-4">
        <div className="flex items-end gap-2 rounded-xl border border-ink-200 bg-paper/40 p-1.5 transition-[border-color,box-shadow] focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask about payment terms, termination, confidentiality…"
            rows={1}
            aria-label="Message the contract"
            disabled={isStreaming}
            className="max-h-[9.5rem] min-h-[2.5rem] resize-none border-0 bg-transparent px-2 py-2 text-sm shadow-none focus-visible:border-0 focus-visible:ring-0 disabled:opacity-60"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={isStreaming || !input.trim()}
            aria-label="Send message"
            className={cn("mb-0.5 h-9 w-9 rounded-lg transition-transform", input.trim() && "hover:-translate-y-0.5")}
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <SendHorizonal className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-1 font-mono text-[0.55rem] uppercase tracking-[0.08em] text-ink-400">
          <span>Enter to send · Shift + Enter for a new line</span>
          <span className="flex items-center gap-1.5">
            <ArrowDown className="h-3 w-3" />
            Grounded in this document
          </span>
        </div>
      </div>
    </div>
  );
}
