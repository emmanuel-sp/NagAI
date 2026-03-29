import { apiRequest } from "@/lib/api";
import { InboxPage, InboxMessageDetail } from "@/types/inbox";

export async function fetchInbox(page = 0, size = 5): Promise<InboxPage> {
  return await apiRequest<InboxPage>(`/inbox?page=${page}&size=${size}`);
}

export async function fetchDigestMessage(sentDigestId: number): Promise<InboxMessageDetail> {
  const res = await apiRequest<{
    sentDigestId: number;
    subject: string;
    content: string;
    digestName: string;
    sentAt: string;
  }>(`/inbox/digest/${sentDigestId}`);
  return {
    id: res.sentDigestId,
    type: "digest",
    subject: res.subject,
    content: res.content,
    label: res.digestName,
    sentAt: res.sentAt,
  };
}

export async function fetchAgentMessageDetail(sentMessageId: number): Promise<InboxMessageDetail> {
  const res = await apiRequest<{
    sentMessageId: number;
    subject: string;
    content: string;
    contextName: string;
    sentAt: string;
  }>(`/chat/agent-message/${sentMessageId}`);
  return {
    id: res.sentMessageId,
    type: "agent",
    subject: res.subject,
    content: res.content,
    label: res.contextName,
    sentAt: res.sentAt,
  };
}
