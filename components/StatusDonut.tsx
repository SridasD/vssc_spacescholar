"use client";

import { motion } from "framer-motion";
import CountUp from "./CountUp";
import { STATUS_COLORS } from "@/lib/dashboardTheme";

interface StatusDonutProps {
  total: number;
  completed: number;
  partial: number;
  processing: number;
  pending: number;
  failed: number;
  completionRate: number;
}

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

  const raw = [
    { key: "completed" as const, label: "Completed", n: completed },
    { key: "partial" as const, label: "Partial", n: partial },
    { key: "processing" as const, label: "Processing", n: processing },
    { key: "pending" as const, label: "Pending", n: pending },
    { key: "failed" as const, label: "Failed", n: failed },
  ];

  // Cumulative offsets (segments stack starting from the top, going clockwise).
  let acc = 0;
  const segments = raw.map((s) => {
    const val = pct(s.n);
    const off = -acc;
    acc += val;
    return { ...s, val, off, color: STATUS_COLORS[s.key].hex };
  });

  return (
    <div className="relative w-[210px] h-[210px] flex-shrink-0">
      <svg viewBox="0 0 42 42" className="w-full h-full -rotate-90">
        {/* Track */}
        <circle cx="21" cy="21" r="15.9" fill="none" stroke="rgba(15,23,42,0.06)" strokeWidth="3.5" />
        {/* Segments */}
        {segments.map((s) => (
          <motion.circle
            key={s.key}
            cx="21"
            cy="21"
            r="15.9"
            fill="none"
            stroke={s.color}
            strokeWidth="3.5"
            strokeDasharray={`0 100`}
            strokeDashoffset={s.off}
            strokeLinecap={s.val > 0 && s.val < 100 ? "butt" : undefined}
            initial={{ strokeDasharray: "0 100" }}
            animate={{ strokeDasharray: `${s.val} ${100 - s.val}` }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.1 * raw.indexOf(s) }}
          >
            <title>{`${s.label}: ${s.n} (${Math.round(s.val)}%)`}</title>
          </motion.circle>
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <p className="text-[52px] font-medium leading-none tracking-tight text-primary m-0">
          <CountUp value={Math.round(completionRate)} suffix="%" />
        </p>
        <p className="mt-1 text-[12px] uppercase tracking-widest text-muted-foreground font-medium">
          complete
        </p>
        <p className="mt-1.5 text-[11px] text-muted-foreground/80">
          of {total} document{total === 1 ? "" : "s"}
        </p>
      </div>
    </div>
  );
}
