"use client";

import { motion } from "framer-motion";
import CountUp from "./CountUp";

interface StatusDonutProps {
  total: number;
  completed: number;
  partial: number;
  processing: number;
  pending: number;
  failed: number;
  completionRate: number;
}

const SEG_COLORS = {
  completed: "#0D9488",
  partial: "#5EEAD4",
  processing: "#60A5FA",
  pending: "#F59E0B",
  failed: "#EF4444",
};

export default function StatusDonut({
  total,
  completed,
  partial,
  processing,
  pending,
  failed,
  completionRate,
}: StatusDonutProps) {
  const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0);

  const completedPct = pct(completed);
  const partialPct = pct(partial);
  const processingPct = pct(processing);
  const pendingPct = pct(pending);
  const failedPct = pct(failed);

  // Cumulative offsets (segments stack starting from the top, going clockwise).
  let acc = 0;
  const offsetCompleted = -acc;
  acc += completedPct;
  const offsetPartial = -acc;
  acc += partialPct;
  const offsetProcessing = -acc;
  acc += processingPct;
  const offsetPending = -acc;
  acc += pendingPct;
  const offsetFailed = -acc;

  const segments = [
    { val: completedPct, off: offsetCompleted, color: SEG_COLORS.completed },
    { val: partialPct, off: offsetPartial, color: SEG_COLORS.partial },
    { val: processingPct, off: offsetProcessing, color: SEG_COLORS.processing },
    { val: pendingPct, off: offsetPending, color: SEG_COLORS.pending },
    { val: failedPct, off: offsetFailed, color: SEG_COLORS.failed },
  ];

  return (
<div className="relative w-[210px] h-[210px] flex-shrink-0">
        <svg viewBox="0 0 42 42" className="w-full h-full -rotate-90">
        {/* Track */}
        <circle
          cx="21"
          cy="21"
          r="15.9"
          fill="none"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="3.5"
        />
        {/* Segments */}
        {segments.map((s, i) => (
          <motion.circle
            key={i}
            cx="21"
            cy="21"
            r="15.9"
            fill="none"
            stroke={s.color}
            strokeWidth="3.5"
            strokeDasharray={`0 100`}
            strokeDashoffset={s.off}
            initial={{ strokeDasharray: "0 100" }}
            animate={{ strokeDasharray: `${s.val} ${100 - s.val}` }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.1 * i }}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-[58px] font-medium leading-none tracking-tight text-teal-700 m-0">
          <CountUp value={Math.round(completionRate)} suffix="%" />
        </p>
        <p className="mt-1 text-[12px] uppercase tracking-widest text-slate-500 font-medium">
          complete
        </p>
      </div>
    </div>
  );
}