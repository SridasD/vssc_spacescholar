

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
}

export type StatusColorMap = {
  [K in StatusKey]: StatusColor;
};

export const STATUS_COLORS: StatusColorMap = {
  completed: {
    dot: "bg-teal-600",
    text: "text-teal-700",
    bg: "bg-teal-500",
    pillBg: "bg-teal-100/70",
    pillText: "text-teal-800",
  },
  partial: {
    dot: "bg-teal-300",
    text: "text-teal-700",
    bg: "bg-teal-300",
    pillBg: "bg-teal-100/70",
    pillText: "text-teal-800",
  },
  processing: {
    dot: "bg-blue-400",
    text: "text-blue-800",
    bg: "bg-blue-400",
    pillBg: "bg-blue-100/70",
    pillText: "text-blue-800",
  },
  pending: {
    dot: "bg-amber-500",
    text: "text-amber-800",
    bg: "bg-amber-500",
    pillBg: "bg-amber-100/70",
    pillText: "text-amber-800",
  },
  failed: {
    dot: "bg-red-500",
    text: "text-red-800",
    bg: "bg-red-500",
    pillBg: "bg-red-100/70",
    pillText: "text-red-800",
  },
};


export const CARD_GRADIENTS = {
  teal:     "bg-gradient-to-br from-teal-300 via-teal-200 to-cyan-100",
  amber:    "bg-gradient-to-br from-amber-300 via-amber-200 to-yellow-100",
  blue:     "bg-gradient-to-br from-blue-300 via-blue-200 to-indigo-100",
  rose:     "bg-gradient-to-br from-rose-300 via-pink-200 to-pink-100",
  mint:     "bg-gradient-to-br from-emerald-300 via-emerald-200 to-teal-100",
  lavender: "bg-gradient-to-br from-violet-300 via-purple-200 to-purple-100",
  cream:    "bg-gradient-to-br from-amber-200 via-yellow-100 to-stone-100",
  soft:     "bg-gradient-to-br from-stone-100 via-stone-50 to-stone-200",
} as const;

export const PAGE_GRADIENT =
  "bg-gradient-to-br from-teal-50 via-amber-50 to-pink-50";

const ORB_PALETTE = [
  {
    grad: "bg-gradient-to-br from-teal-300 to-teal-600",
    halo: "shadow-[0_0_18px_rgba(13,148,136,0.35)]",
    text: "text-white",
  },
  {
    grad: "bg-gradient-to-br from-rose-200 to-rose-400",
    halo: "shadow-[0_0_14px_rgba(248,113,113,0.30)]",
    text: "text-white",
  },
  {
    grad: "bg-gradient-to-br from-violet-200 to-violet-400",
    halo: "shadow-[0_0_14px_rgba(167,139,250,0.30)]",
    text: "text-white",
  },
  {
    grad: "bg-gradient-to-br from-orange-200 to-orange-400",
    halo: "shadow-[0_0_12px_rgba(251,146,60,0.30)]",
    text: "text-white",
  },
  {
    grad: "bg-gradient-to-br from-amber-200 to-amber-400",
    halo: "shadow-[0_0_12px_rgba(251,191,36,0.30)]",
    text: "text-amber-900",
  },
  {
    grad: "bg-gradient-to-br from-sky-200 to-sky-400",
    halo: "shadow-[0_0_12px_rgba(56,189,248,0.30)]",
    text: "text-white",
  },
];

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function getOrbColors(name: string) {
  return ORB_PALETTE[hashCode(name) % ORB_PALETTE.length];
}

export function getOrbSize(value: number, max: number): number {
  const minPx = 60;
  const maxPx = 110;
  if (max <= 0) return minPx;
  const ratio = Math.min(1, value / max);
  return Math.round(minPx + (maxPx - minPx) * ratio);
}