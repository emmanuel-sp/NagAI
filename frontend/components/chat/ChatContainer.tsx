import React from "react";
import styles from "@/styles/chat.module.css";

type Props = {
  children: React.ReactNode;
};

const ChatContainer: React.FC<Props> = ({ children }) => (
  <div className={styles.chatContainer}>{children}</div>
);

export default ChatContainer;
