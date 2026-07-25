

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
    dot: "bg-leaf",
    text: "text-leaf",
    bg: "bg-leaf",
    pillBg: "bg-leaf-soft",
    pillText: "text-leaf",
  },
  partial: {
    dot: "bg-peacock/60",
    text: "text-peacock-deep",
    bg: "bg-peacock/60",
    pillBg: "bg-peacock-soft",
    pillText: "text-peacock-deep",
  },
  processing: {
    dot: "bg-peacock",
    text: "text-peacock-deep",
    bg: "bg-peacock",
    pillBg: "bg-peacock-soft",
    pillText: "text-peacock-deep",
  },
  pending: {
    dot: "bg-turmeric",
    text: "text-amber-800",
    bg: "bg-turmeric",
    pillBg: "bg-amber-100/70",
    pillText: "text-amber-800",
  },
  failed: {
    dot: "bg-rose-500",
    text: "text-rose-700",
    bg: "bg-rose-500",
    pillBg: "bg-rose-100/70",
    pillText: "text-rose-800",
  },
};


export const CARD_GRADIENTS = {
  teal:     "bg-gradient-to-br from-sky-300 via-sky-200 to-cyan-100",
  amber:    "bg-gradient-to-br from-amber-300 via-amber-200 to-yellow-100",
  blue:     "bg-gradient-to-br from-indigo-300 via-indigo-200 to-blue-100",
  rose:     "bg-gradient-to-br from-rose-300 via-pink-200 to-pink-100",
  mint:     "bg-gradient-to-br from-emerald-300 via-emerald-200 to-teal-100",
  lavender: "bg-gradient-to-br from-indigo-300 via-violet-200 to-purple-100",
  cream:    "bg-gradient-to-br from-orange-200 via-amber-100 to-stone-100",
  soft:     "bg-gradient-to-br from-stone-100 via-stone-50 to-stone-200",
} as const;

export const PAGE_GRADIENT =
  "bg-gradient-to-br from-indigo-50 via-orange-50 to-sky-50";

const ORB_PALETTE = [
  {
    grad: "bg-gradient-to-br from-sky-300 to-sky-600",
    halo: "shadow-[0_0_18px_rgba(7,158,210,0.35)]",
    text: "text-white",
  },
  {
    grad: "bg-gradient-to-br from-rose-200 to-rose-400",
    halo: "shadow-[0_0_14px_rgba(248,113,113,0.30)]",
    text: "text-white",
  },
  {
    grad: "bg-gradient-to-br from-indigo-300 to-indigo-500",
    halo: "shadow-[0_0_14px_rgba(51,45,125,0.30)]",
    text: "text-white",
  },
  {
    grad: "bg-gradient-to-br from-orange-200 to-orange-400",
    halo: "shadow-[0_0_12px_rgba(244,122,31,0.30)]",
    text: "text-white",
  },
  {
    grad: "bg-gradient-to-br from-amber-200 to-amber-400",
    halo: "shadow-[0_0_12px_rgba(245,196,78,0.30)]",
    text: "text-amber-900",
  },
  {
    grad: "bg-gradient-to-br from-emerald-300 to-emerald-500",
    halo: "shadow-[0_0_12px_rgba(22,139,114,0.30)]",
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