import React, { useEffect, useRef } from "react";
import { Message } from "@/types/chat";
import styles from "@/styles/chat.module.css";

interface Props {
  messages: Message[];
}

/**
 * Formats a timestamp to HH:MM format
 */
const formatMessageTime = (date: Date): string => {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const MessageList: React.FC<Props> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className={styles.messagesContainer}>
      {messages.map((message) => (
        <div
          key={message.id}
          className={`${styles.messageRow} ${
            message.type === "user" ? styles.messageUser : styles.messageAi
          }`}
        >
          <div className={styles.messageBubble}>
            <div>{message.content}</div>
            <span className={styles.messageTime}>
              {formatMessageTime(message.timestamp)}
            </span>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
