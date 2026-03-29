"use client";

import { RefObject } from "react";
import { ChatMessage } from "@/types/chat";
import ActionCard from "./ActionCard";
import QuizCard from "./QuizCard";
import styles from "./chat.module.css";

interface MessageListProps {
  messages: ChatMessage[];
  sending: boolean;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  userInitials: string;
  onSuggestionStatusChange: (
    messageId: number,
    suggestionId: string,
    status: "accepted" | "rejected"
  ) => void;
  onDataRefresh: () => void;
  onQuizSelect: (messageId: number, suggestionId: string, answer: string) => void;
}

export default function MessageList({
  messages,
  sending,
  messagesEndRef,
  userInitials,
  onSuggestionStatusChange,
  onDataRefresh,
  onQuizSelect,
}: MessageListProps) {
  return (
    <div className={styles.messagesArea}>
      {messages.map((msg) => (
        <div
          key={msg.messageId}
          className={`${styles.messageRow} ${
            msg.role === "user"
              ? styles.messageRowUser
              : styles.messageRowAssistant
          }`}
        >
          {msg.role === "user" && (
            <div className={`${styles.messageAvatar} ${styles.avatarUser}`}>
              {userInitials}
            </div>
          )}
          <div
            className={`${styles.messageBubble} ${
              msg.role === "user"
                ? styles.messageUser
                : styles.messageAssistant
            }`}
          >
            {msg.role === "assistant" ? (
              <>
                <MarkdownContent content={msg.content} />
                {msg.suggestions?.map((s) =>
                  s.type === "quiz" ? (
                    <QuizCard
                      key={s.suggestionId}
                      suggestion={s}
                      onSelect={(answer) =>
                        onQuizSelect(msg.messageId, s.suggestionId, answer)
                      }
                      disabled={sending}
                    />
                  ) : (
                    <ActionCard
                      key={s.suggestionId}
                      suggestion={s}
                      messageId={msg.messageId}
                      onStatusChange={(suggestionId, status) =>
                        onSuggestionStatusChange(msg.messageId, suggestionId, status)
                      }
                      onDataRefresh={onDataRefresh}
                    />
                  )
                )}
              </>
            ) : (
              msg.content
            )}
          </div>
        </div>
      ))}

      {sending && (
        <div className={styles.typingRow}>
          <div className={styles.typingIndicator}>
            <span className={styles.typingDot} />
            <span className={styles.typingDot} />
            <span className={styles.typingDot} />
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}

function MarkdownContent({ content }: { content: string }) {
  // Process fenced code blocks first
  let processed = content.replace(
    /```(?:\w*)\n([\s\S]*?)```/g,
    (_, code) => `<pre><code>${code.replace(/</g, "&lt;").replace(/>/g, "&gt;").trimEnd()}</code></pre>`
  );

  // Inline code
  processed = processed.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Bold
  processed = processed.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

  // Italic (single * or _)
  processed = processed.replace(/(?<!\w)\*([^*]+)\*(?!\w)/g, "<em>$1</em>");
  processed = processed.replace(/(?<!\w)_([^_]+)_(?!\w)/g, "<em>$1</em>");

  // Links
  processed = processed.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // Split into blocks and process
  const html = processed
    .split("\n\n")
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";

      // Preserve pre blocks
      if (trimmed.startsWith("<pre>")) return trimmed;

      // Headings
      if (trimmed.startsWith("### "))
        return `<h4>${trimmed.slice(4)}</h4>`;
      if (trimmed.startsWith("## "))
        return `<h3>${trimmed.slice(3)}</h3>`;

      // Unordered list
      const lines = trimmed.split("\n");
      const isList = lines.every(
        (l) => l.trim().startsWith("- ") || l.trim().startsWith("* ")
      );

      if (isList) {
        const items = lines
          .map((l) => `<li>${l.trim().replace(/^[-*]\s/, "")}</li>`)
          .join("");
        return `<ul>${items}</ul>`;
      }

      // Ordered list
      const isNumbered = lines.every((l) => /^\d+\.\s/.test(l.trim()));
      if (isNumbered) {
        const items = lines
          .map((l) => `<li>${l.trim().replace(/^\d+\.\s/, "")}</li>`)
          .join("");
        return `<ol>${items}</ol>`;
      }

      return `<p>${trimmed.replace(/\n/g, "<br/>")}</p>`;
    })
    .join("");

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
