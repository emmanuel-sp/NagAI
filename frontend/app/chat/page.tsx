import { Suspense } from "react";
import ChatContainer from "@/components/chat/ChatContainer";

export default function ChatPage() {
  return (
    <Suspense>
      <ChatContainer />
    </Suspense>
  );
}
