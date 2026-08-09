import type { StatusCheck, StatusService, StatusState } from "@/lib/types";

/** How many squares a row shows. Matches the mock on the original brief. */
export const HISTORY_LENGTH = 17;

/** Anything slower than this counts as degraded rather than up. */
export const DEGRADED_AFTER_MS = 2_500;

/** Give up on a check here — a hung endpoint is a down endpoint. */
export const CHECK_TIMEOUT_MS = 8_000;

/** Open reports needed before a service escalates to "investigating". */
export const REPORT_THRESHOLD = 2;

export const STATE_SQUARE: Record<StatusState, string> = {
  up: "🟩",
  degraded: "🟧",
  investigating: "🟧",
  down: "🟥",
};

/** Used for slots with no check recorded yet, so rows stay the same width. */
export const UNKNOWN_SQUARE = "⬜";

export const STATE_LABEL: Record<StatusState, string> = {
  up: "working",
  degraded: "degraded",
  investigating: "investigating",
  down: "down",
};

/** Tailwind text colours, kept next to the labels so the two never drift. */
export const STATE_CLASS: Record<StatusState, string> = {
  up: "text-emerald-400",
  degraded: "text-amber-400",
  investigating: "text-amber-400",
  down: "text-red-400",
};

const STATE_RANK: Record<StatusState, number> = {
  up: 0,
  degraded: 1,
  investigating: 2,
  down: 3,
};

/** The worst state in a list — what a group heading summarises to. */
export function worstState(states: StatusState[]): StatusState {
  return states.reduce<StatusState>(
    (worst, state) => (STATE_RANK[state] > STATE_RANK[worst] ? state : worst),
    "up"
  );
}

export type StatusRow = {
  service: StatusService;
  /** Oldest → newest, exactly HISTORY_LENGTH entries, padded with nulls. */
  history: (StatusState | null)[];
};

export type StatusGroup = {
  key: string;
  label: string;
  url: string | null;
  rows: StatusRow[];
  state: StatusState;
};

/**
 * Builds the oldest→newest history strip for a service.
 *
 * `checks` may hold more (or fewer) than HISTORY_LENGTH entries and is
 * expected newest-first, the order the query returns. Short histories are
 * padded on the left so a service added yesterday doesn't render a stubby row
 * next to one that's been checked for months.
 */
export function buildHistory(checks: StatusCheck[]): (StatusState | null)[] {
  const recent = checks.slice(0, HISTORY_LENGTH).reverse().map((check) => check.state);
  const padding: null[] = Array(Math.max(0, HISTORY_LENGTH - recent.length)).fill(null);
  return [...padding, ...recent];
}

/** Groups services into the domain headings the page renders, in stored order. */
export function groupServices(services: StatusService[], checksByService: Map<string, StatusCheck[]>) {
  const groups = new Map<string, StatusGroup>();

  for (const service of services) {
    let group = groups.get(service.group_key);
    if (!group) {
      group = {
        key: service.group_key,
        label: service.group_label,
        url: service.group_url,
        rows: [],
        state: "up",
      };
      groups.set(service.group_key, group);
    }
    group.rows.push({
      service,
      history: buildHistory(checksByService.get(service.id) ?? []),
    });
  }

  for (const group of groups.values()) {
    group.state = worstState(group.rows.map((row) => row.service.state));
  }

  return [...groups.values()];
}

/**
 * The services the page falls back to when Supabase isn't configured, so
 * /status renders something honest (every row unknown) instead of an error.
 * Kept in step with the seed at the bottom of migration 0010.
 */
export const FALLBACK_SERVICES: Pick<
  StatusService,
  "id" | "group_key" | "group_label" | "group_url" | "name"
>[] = [
  {
    id: "fallback-site",
    group_key: "blobbyofficial",
    group_label: "blobbyofficial.com",
    group_url: "https://blobbyofficial.com",
    name: "Site",
  },
  {
    id: "fallback-previews",
    group_key: "blobbyofficial",
    group_label: "blobbyofficial.com",
    group_url: "https://blobbyofficial.com",
    name: "Video previews",
  },
  {
    id: "fallback-contact",
    group_key: "blobbyofficial",
    group_label: "blobbyofficial.com",
    group_url: "https://blobbyofficial.com",
    name: "Contact",
  },
];
