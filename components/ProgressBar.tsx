"use client";

import React from "react";
import { motion } from "framer-motion";
import { CARD_GRADIENTS } from "@/lib/dashboardTheme";

interface ProgressBarProps {
  stats: {
    totalDocumentCount: number;
    totalCompleted: number;
    totalPartiallyCompleted: number;
    totalProcessing: number;
    totalPending: number;
    totalFailed: number;
    overallCompletionRate: number;
  };
}

const ProgressBar: React.FC<ProgressBarProps> = ({ stats }) => {
  const pct = (v: number) =>
    stats.totalDocumentCount > 0 ? (v / stats.totalDocumentCount) * 100 : 0;

  const segments = [
    { value: pct(stats.totalCompleted), bg: "bg-teal-600" },
    { value: pct(stats.totalPartiallyCompleted), bg: "bg-teal-300" },
    { value: pct(stats.totalProcessing), bg: "bg-blue-400" },
    { value: pct(stats.totalPending), bg: "bg-amber-500" },
    { value: pct(stats.totalFailed), bg: "bg-red-500" },
  ];

  return (
    <div
      className={`rounded-2xl border border-white/70 backdrop-blur-sm p-5 ${CARD_GRADIENTS.soft}`}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-[15px] font-medium m-0 text-slate-900">
          Overall progress
        </p>
        <p className="text-[13px] font-medium m-0 text-teal-700 tabular-nums">
          {Math.round(stats.overallCompletionRate)}% complete
        </p>
      </div>
      <div className="h-3 w-full bg-white/50 rounded-full overflow-hidden flex">
        {segments.map((s, i) => (
          <motion.div
            key={i}
            className={`h-full ${s.bg}`}
            initial={{ width: 0 }}
            animate={{ width: `${s.value}%` }}
            transition={{ duration: 0.8, delay: 0.15 * i, ease: "easeOut" }}
          />
        ))}
      </div>
    </div>
  );
};

export default ProgressBar;