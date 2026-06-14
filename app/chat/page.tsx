import { Suspense } from "react";
import { ChatPageClient } from "./chat-page-client";

export default function ChatPage() {
  return (
    <Suspense>
      <ChatPageClient />
    </Suspense>
  );
}
