export type InboxItemType = "agent" | "digest";

export interface InboxItem {
  id: number;
  type: InboxItemType;
  subject: string;
  preview: string;
  label: string;
  sentAt: string;
}

export interface InboxPage {
  items: InboxItem[];
  hasMore: boolean;
  page: number;
  size: number;
}

export interface InboxMessageDetail {
  id: number;
  type: InboxItemType;
  subject: string;
  content: string;
  label: string;
  sentAt: string;
}
