import { motion, useReducedMotion } from "framer-motion";
import { Quote, Sparkles } from "lucide-react";
import type { ChatMessage } from "@/types/api";
import { Markdown } from "@/components/ui/markdown";
import { cn } from "@/lib/utils";

function formatMessageTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const reduceMotion = useReducedMotion();
  const isUser = message.role === "user";
  const time = formatMessageTime(message.created_at);

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 7 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={cn("flex w-full gap-3", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && (
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary/15 bg-primary-soft text-primary">
          <Sparkles className="h-3.5 w-3.5" strokeWidth={1.8} />
        </span>
      )}

      <div className={cn("min-w-0", isUser ? "max-w-[85%] sm:max-w-[75%]" : "max-w-full flex-1")}>
        <div
          data-role={message.role}
          className={cn(
            "rounded-xl border px-4 py-3.5 text-sm leading-relaxed shadow-[0_1px_1px_rgb(0_0_0_/_0.02)]",
            isUser
              ? "rounded-br-sm border-chat-user/20 bg-chat-user text-chat-user-foreground"
              : "rounded-bl-sm border-ink-100 bg-chat-assistant text-chat-assistant-foreground",
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <Markdown content={message.content} className="text-[0.875rem]" />
          )}

          {message.cited_chunk_ids.length > 0 && (
            <div
              className={cn(
                "mt-3 flex items-center gap-1.5 border-t pt-2.5 font-mono text-[0.56rem] uppercase tracking-[0.08em]",
                isUser
                  ? "border-primary-foreground/15 text-primary-foreground/70"
                  : "border-ink-100 text-ink-400",
              )}
            >
              <Quote className="h-3 w-3 shrink-0" />
              Grounded in {message.cited_chunk_ids.length} clause
              {message.cited_chunk_ids.length === 1 ? "" : "s"} from this contract
            </div>
          )}
        </div>

        <div
          className={cn(
            "mt-1.5 flex items-center gap-2 px-1 font-mono text-[0.55rem] uppercase tracking-[0.1em] text-ink-400",
            isUser ? "justify-end" : "justify-start",
          )}
        >
          <span>{isUser ? "You" : "Contract assistant"}</span>
          {time && <span className="text-ink-200">·</span>}
          {time && <time dateTime={message.created_at}>{time}</time>}
        </div>
      </div>
    </motion.div>
  );
}

export function ChatTypingIndicator({ text }: { text?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex w-full gap-3" role="status" aria-live="polite">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary/15 bg-primary-soft text-primary">
        <Sparkles className="h-3.5 w-3.5" strokeWidth={1.8} />
      </span>
      <div className="rounded-xl rounded-bl-sm border border-ink-100 bg-chat-assistant px-4 py-3">
        {text ? (
          <div>
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-chat-assistant-foreground">
              {text}
              {!reduceMotion && <span className="ml-0.5 inline-block h-3.5 w-1 animate-pulse bg-accent align-middle" />}
            </p>
            <span className="sr-only">Assistant is still responding</span>
          </div>
        ) : (
          <div className="flex h-5 items-center gap-1.5">
            {[0, 1, 2].map((index) => (
              <motion.span
                key={index}
                className="h-1.5 w-1.5 rounded-full bg-ink-400"
                animate={reduceMotion ? undefined : { y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
                transition={{
                  duration: 1.1,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: index * 0.14,
                }}
              />
            ))}
            <span className="ml-1 font-mono text-[0.55rem] uppercase tracking-[0.1em] text-ink-400">
              Reading the contract
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
