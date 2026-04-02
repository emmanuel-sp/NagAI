import { Suspense } from "react";
import ChatContainer from "@/components/chat/ChatContainer";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <LoadingSpinner
          message="Preparing chat..."
          hint="Setting up the conversation view."
        />
      }
    >
      <ChatContainer />
    </Suspense>
  );
}
