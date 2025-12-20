import React from "react";
import { startOfWeek, startOfYear } from "date-fns";
import { ChatSession } from "@/types/chat";
import styles from "@/styles/chat.module.css";

interface Props {
  sessions: ChatSession[];
  activeSessionId?: string;
  onSelectSession: (id: string) => void;
}

interface GroupedSessions {
  [key: string]: ChatSession[];
}

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Groups chat sessions by relative time periods
 */
const groupSessionsByTime = (sessions: ChatSession[]): GroupedSessions => {
  const now = new Date();
  const thisWeek = startOfWeek(now);
  const lastWeek = new Date(thisWeek.getTime() - ONE_WEEK_MS);
  const thisYear = startOfYear(now);

  const groups: GroupedSessions = {
    "This week": [],
    "Last week": [],
    "This year": [],
    "Older": [],
  };

  sessions.forEach((session) => {
    const sessionDate = new Date(session.date);

    if (sessionDate >= thisWeek) {
      groups["This week"].push(session);
    } else if (sessionDate >= lastWeek) {
      groups["Last week"].push(session);
    } else if (sessionDate >= thisYear) {
      groups["This year"].push(session);
    } else {
      groups["Older"].push(session);
    }
  });

  // Filter out empty groups
  Object.keys(groups).forEach((key) => {
    if (groups[key].length === 0) {
      delete groups[key];
    }
  });

  return groups;
};

const ChatSidebar: React.FC<Props> = ({
  sessions,
  activeSessionId,
  onSelectSession,
}) => {
  const groupedSessions = groupSessionsByTime(sessions);

  return (
    <aside className={styles.chatSidebar}>
      <div className={styles.sidebarHeader}>Chat History</div>
      <div className={styles.historyList}>
        {Object.entries(groupedSessions).map(([groupLabel, groupSessions]) => (
          <div key={groupLabel}>
            <div className={styles.historyDate}>{groupLabel}</div>
            {groupSessions.map((session) => (
              <div
                key={session.id}
                className={`${styles.historyItem} ${
                  session.id === activeSessionId ? styles.active : ""
                }`}
                onClick={() => onSelectSession(session.id)}
              >
                {session.label}
              </div>
            ))}
          </div>
        ))}
      </div>
    </aside>
  );
};

export default ChatSidebar;
