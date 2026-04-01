import { parseUtcDate } from "@/lib/dates";
import type { AgentContext } from "@/types/agent";

const DEPLOY_COOLDOWN_MS = 24 * 60 * 60 * 1000;

function formatStatusTime(dateString: string): string {
  const date = parseUtcDate(dateString);
  if (Number.isNaN(date.getTime())) {
    return "later";
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export type AgentContextStatusTone = "live" | "cooling" | "paused" | "draft";

export interface AgentContextStatus {
  tone: AgentContextStatusTone;
  label: string;
  helperText: string;
  title: string;
}

export function getAgentContextStatus(context: AgentContext | null): AgentContextStatus {
  if (!context) {
    return {
      tone: "draft",
      label: "Draft",
      helperText: "Set up this agent to start receiving email nudges for this goal.",
      title: "Draft",
    };
  }

  if (context.pauseReason === "stale_progress") {
    return {
      tone: "paused",
      label: "Paused",
      helperText: "Paused for inactivity; re-deploy or change the checklist to restart.",
      title: "Paused for inactivity — click to deploy again",
    };
  }

  if (isDeployCooldownActive(context)) {
    const until = formatStatusTime(context.nextMessageAt as string);
    return {
      tone: "cooling",
      label: "Cooling",
      helperText: `Cooling down until ${until} to avoid duplicate deploy emails.`,
      title: `Cooling down until ${until}`,
    };
  }

  if (context.deployed) {
    return {
      tone: "live",
      label: "Live",
      helperText: "Agent is live and sending emails. Stop it any time, or adjust settings and save.",
      title: "Live — click to stop",
    };
  }

  return {
    tone: "draft",
    label: "Draft",
    helperText: "Agent is saved but not active. Deploy it to start receiving email nudges.",
    title: "Draft — click to deploy",
  };
}

function isDeployCooldownActive(context: AgentContext): boolean {
  if (!context.deployed || context.staleCount !== 0 || !context.lastMessageSentAt || !context.nextMessageAt) {
    return false;
  }

  const lastMessageAt = parseUtcDate(context.lastMessageSentAt);
  const nextMessageAt = parseUtcDate(context.nextMessageAt);
  if (Number.isNaN(lastMessageAt.getTime()) || Number.isNaN(nextMessageAt.getTime())) {
    return false;
  }

  const cooldownEndsAt = lastMessageAt.getTime() + DEPLOY_COOLDOWN_MS;
  return nextMessageAt.getTime() > Date.now()
    && Math.abs(nextMessageAt.getTime() - cooldownEndsAt) < 60_000;
}
