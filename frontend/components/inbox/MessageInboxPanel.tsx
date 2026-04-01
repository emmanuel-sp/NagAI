"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  fetchInbox,
  fetchAgentMessageDetail,
  fetchDigestMessage,
} from "@/services/inboxService";
import { parseUtcDate } from "@/lib/dates";
import { InboxItem, InboxMessageDetail } from "@/types/inbox";
import { IoClose, IoChevronRight, IoBell, IoMail } from "@/components/icons";
import styles from "./MessageInboxPanel.module.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

function formatDate(raw: string): string {
  if (!raw) return "";
  try {
    const d = parseUtcDate(raw);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return raw;
  }
}

export default function MessageInboxPanel({ isOpen, onClose }: Props) {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<InboxMessageDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetchInbox(p, 5);
      setItems((prev) => (p === 0 ? res.items : [...prev, ...res.items]));
      setHasMore(res.hasMore);
      setPage(p);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setItems([]);
      setDetail(null);
      setPage(0);
      load(0);
    }
  }, [isOpen, load]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (detail) setDetail(null);
        else onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, detail, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [isOpen]);

  const openDetail = async (item: InboxItem) => {
    setDetailLoading(true);
    setDetail(null);
    try {
      const d =
        item.type === "agent"
          ? await fetchAgentMessageDetail(item.id)
          : await fetchDigestMessage(item.id);
      setDetail(d);
    } finally {
      setDetailLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  return createPortal(
    <>
      {isOpen && <div className={styles.backdrop} onClick={onClose} />}
      <div
        ref={panelRef}
        className={`${styles.panel} ${isOpen ? styles.panelOpen : ""}`}
        aria-label="Message inbox"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className={styles.header}>
          {detail ? (
            <button
              className={styles.backBtn}
              onClick={() => setDetail(null)}
              aria-label="Back to inbox"
            >
              <IoChevronRight size={14} style={{ transform: "rotate(180deg)" }} />
              <span>Inbox</span>
            </button>
          ) : (
            <div className={styles.headerTitle}>
              <IoBell size={15} />
              <span>Messages</span>
            </div>
          )}
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close inbox">
            <IoClose size={16} />
          </button>
        </div>

        {/* Detail view */}
        {detail ? (
          <div className={styles.detailView}>
            <div className={styles.detailMeta}>
              <span className={`${styles.typeBadge} ${styles[`typeBadge_${detail.type}`]}`}>
                {detail.type === "agent" ? "Nag" : "Digest"}
              </span>
              <span className={styles.detailLabel}>{detail.label}</span>
              <span className={styles.detailDate}>{formatDate(detail.sentAt)}</span>
            </div>
            <h3 className={styles.detailSubject}>{detail.subject}</h3>
            <div
              className={styles.detailBody}
              dangerouslySetInnerHTML={{ __html: detail.content ?? "" }}
            />
          </div>
        ) : detailLoading ? (
          <div className={styles.loadingCenter}>
            <span className={styles.spinner} />
          </div>
        ) : (
          /* List view */
          <div className={styles.list}>
            {loading && items.length === 0 ? (
              <div className={styles.loadingCenter}>
                <span className={styles.spinner} />
              </div>
            ) : items.length === 0 ? (
              <div className={styles.empty}>
                <IoMail size={32} className={styles.emptyIcon} />
                <p>No messages yet</p>
                <span>Agent nags and digests will appear here once sent.</span>
              </div>
            ) : (
              <>
                {items.map((item) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    className={styles.messageRow}
                    onClick={() => openDetail(item)}
                  >
                    <span
                      className={`${styles.typeDot} ${styles[`typeDot_${item.type}`]}`}
                      aria-label={item.type === "agent" ? "Nag message" : "Digest"}
                    />
                    <span className={styles.messageContent}>
                      <span className={styles.messageTop}>
                        <span className={styles.messageSubject}>{item.subject}</span>
                        <span className={styles.messageDate}>{formatDate(item.sentAt)}</span>
                      </span>
                      <span className={styles.messageMeta}>
                        <span className={`${styles.typeBadge} ${styles[`typeBadge_${item.type}`]}`}>
                          {item.type === "agent" ? "Nag" : "Digest"}
                        </span>
                        <span className={styles.messageLabel}>{item.label}</span>
                      </span>
                      <span className={styles.messagePreview}>{item.preview}</span>
                    </span>
                    <IoChevronRight size={13} className={styles.rowChevron} />
                  </button>
                ))}

                {hasMore && (
                  <button
                    className={styles.loadMoreBtn}
                    onClick={() => load(page + 1)}
                    disabled={loading}
                  >
                    {loading ? <span className={styles.spinnerSmall} /> : "Load more"}
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </>,
    document.body
  );
}
