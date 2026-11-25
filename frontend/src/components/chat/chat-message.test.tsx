import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChatMessageBubble } from "@/components/chat/chat-message";
import type { ChatMessage } from "@/types/api";

const assistantMessage: ChatMessage = {
  id: "message-1",
  role: "assistant",
  content: "The agreement renews automatically.\n\n- **90 days' notice** required",
  cited_chunk_ids: ["chunk-1", "chunk-2"],
  created_at: "2026-01-01T10:00:00Z",
};

const userMessage: ChatMessage = {
  id: "message-2",
  role: "user",
  content: "What is the renewal notice period?",
  cited_chunk_ids: [],
  created_at: "2026-01-01T09:59:00Z",
};

describe("ChatMessageBubble", () => {
  it("uses theme-aware assistant tokens rather than a hard-coded white background", () => {
    const { container } = render(<ChatMessageBubble message={assistantMessage} />);
    const bubble = container.querySelector('[data-role="assistant"]');

    expect(bubble).not.toBeNull();
    expect(bubble?.className).toContain("bg-chat-assistant");
    expect(bubble?.className).toContain("text-chat-assistant-foreground");
    expect(bubble?.className).not.toContain("bg-white");
    expect(screen.getByText("90 days' notice")).toBeInTheDocument();
    expect(screen.getByText(/Grounded in 2 clauses/)).toBeInTheDocument();
  });

  it("visually distinguishes user and assistant messages with separate tokens", () => {
    const { container } = render(
      <>
        <ChatMessageBubble message={assistantMessage} />
        <ChatMessageBubble message={userMessage} />
      </>,
    );

    const assistant = container.querySelector('[data-role="assistant"]');
    const user = container.querySelector('[data-role="user"]');

    expect(assistant?.className).toContain("bg-chat-assistant");
    expect(user?.className).toContain("bg-chat-user");
    expect(user?.className).toContain("text-chat-user-foreground");
    expect(assistant?.className).not.toEqual(user?.className);
  });

  it("wraps long user messages instead of allowing horizontal overflow", () => {
    const longMessage: ChatMessage = {
      ...userMessage,
      content: "A".repeat(500),
    };
    const { container } = render(<ChatMessageBubble message={longMessage} />);

    const text = screen.getByText(/^A+$/);
    expect(text.className).toContain("break-words");
    expect(text.className).toContain("whitespace-pre-wrap");
    expect(container.querySelector('[data-role="user"]')?.className).toContain("max-w");
  });
});
