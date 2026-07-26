export type StatusKey =
  | "completed"
  | "partial"
  | "processing"
  | "pending"
  | "failed";

export interface StatusColor {
  dot: string;
  text: string;
  bg: string;
  pillBg: string;
  pillText: string;
  /** Actual hex value — needed for SVG stroke/fill where Tailwind classes don't apply. */
  hex: string;
}

export type StatusColorMap = {
  [K in StatusKey]: StatusColor;
};

/**
 * Single source of truth for status colors across the dashboard (donut, KPI
 * cards, progress segments, table badges). Every component should read from
 * here rather than hard-coding its own shade — previously the donut, the
 * progress bar and the KPI cards each picked a different blue for "partial".
 */
export const STATUS_COLORS: StatusColorMap = {
  completed: {
    dot: "bg-leaf",
    text: "text-leaf",
    bg: "bg-leaf",
    pillBg: "bg-leaf-soft",
    pillText: "text-leaf",
    hex: "#168b72",
  },
  partial: {
    dot: "bg-peacock/60",
    text: "text-peacock-deep",
    bg: "bg-peacock/60",
    pillBg: "bg-peacock-soft",
    pillText: "text-peacock-deep",
    hex: "#7dd3ef",
  },
  processing: {
    dot: "bg-peacock",
    text: "text-peacock-deep",
    bg: "bg-peacock",
    pillBg: "bg-peacock-soft",
    pillText: "text-peacock-deep",
    hex: "#079ed2",
  },
  pending: {
    dot: "bg-turmeric",
    text: "text-amber-800",
    bg: "bg-turmeric",
    pillBg: "bg-amber-100/70",
    pillText: "text-amber-800",
    hex: "#f5c44e",
  },
  failed: {
    dot: "bg-rose-500",
    text: "text-rose-700",
    bg: "bg-rose-500",
    pillBg: "bg-rose-100/70",
    pillText: "text-rose-800",
    hex: "#e65b8d",
  },
};

/** Maps the raw document status values returned by the API onto the canonical StatusKey palette above. */
export const DOCUMENT_STATUS_TO_KEY: Record<string, StatusKey> = {
  COMPLETED: "completed",
  PENDING: "pending",
  INPROGRESS: "processing",
  FAILED: "failed",
};

/** Subtle page-level wash — sections themselves are plain white cards so they read distinctly against it. */
export const PAGE_WASH =
  "bg-gradient-to-br from-saffron-soft/50 via-white to-peacock-soft/40";

/** Fixed, ordered categorical palette for "by content type" breakdowns — cycled by sorted index, never by name hash, so colors stay stable and legible. */
export const CONTENT_TYPE_PALETTE = [
  { bar: "bg-peacock", chip: "bg-peacock-soft text-peacock-deep" },
  { bar: "bg-saffron", chip: "bg-saffron-soft text-saffron-deep" },
  { bar: "bg-leaf", chip: "bg-leaf-soft text-leaf" },
  { bar: "bg-turmeric", chip: "bg-amber-100/70 text-amber-800" },
  { bar: "bg-primary", chip: "bg-indigo-50 text-primary" },
  { bar: "bg-rose-400", chip: "bg-rose-100/70 text-rose-700" },
] as const;
