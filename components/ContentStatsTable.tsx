"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { ContentStat } from "@/lib/types/document.types";
import {
  CARD_GRADIENTS,
  getOrbColors,
  getOrbSize,
} from "@/lib/dashboardTheme";

interface ContentStatsTableProps {
  contentStats: ContentStat[];
}

const FLOAT_KEYFRAMES = [
  "animate-[floatA_4s_ease-in-out_infinite]",
  "animate-[floatB_4.5s_ease-in-out_infinite]",
  "animate-[floatC_5s_ease-in-out_infinite]",
  "animate-[floatD_4.2s_ease-in-out_infinite]",
];

const ContentStatsTable: React.FC<ContentStatsTableProps> = ({
  contentStats = [],
}) => {
  const active = useMemo(
    () => contentStats.filter((s) => (s.totalDocuments || 0) > 0),
    [contentStats]
  );

  const maxDocs = useMemo(
    () => active.reduce((m, s) => Math.max(m, s.totalDocuments || 0), 0),
    [active]
  );

  if (active.length === 0) {
    return (
      <div
        className={`rounded-2xl border border-white/70 backdrop-blur-sm p-6 text-center ${CARD_GRADIENTS.soft}`}
      >
        <p className="text-sm text-slate-600 m-0">
          No content statistics available yet.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-white/70 backdrop-blur-sm p-5 ${CARD_GRADIENTS.soft}`}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-[15px] font-medium m-0 text-slate-900">
          By content type
        </p>
        <p className="text-[11px] text-slate-500 m-0">
          
        </p>
      </div>

      <div className="flex flex-wrap gap-5 py-2">
        {active.map((stat, i) => {
          const size = getOrbSize(stat.totalDocuments || 0, maxDocs);
          const colors = getOrbColors(stat.contentType || `type-${i}`);
          const float = FLOAT_KEYFRAMES[i % FLOAT_KEYFRAMES.length];

          const total = stat.totalDocuments || 0;
          const completed = stat.completedCount || 0;
          const partial = stat.partiallyCompleted || 0;
          const processing = stat.processingCount || 0;
          const pending = stat.pendingCount || 0;
          const failed = stat.failedCount || 0;

          const seg = (n: number) =>
            total > 0 ? `${(n / total) * 100}%` : "0%";

          return (
            <motion.div
              key={stat.contentType || i}
              className={`flex flex-col items-center gap-3 min-w-[120px] ${float}`}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.4,
                delay: 0.06 * i,
                ease: "easeOut",
              }}
            >
              <motion.div
                className={`relative rounded-full flex items-center justify-center cursor-default ${colors.grad} ${colors.halo}`}
                style={{ width: size, height: size }}
                whileHover={{ scale: 1.08 }}
                transition={{ duration: 0.18 }}
                title={`${stat.contentType}: ${total} doc${total === 1 ? "" : "s"}`}
              >
                <span
                  className={`font-medium tabular-nums leading-none tracking-tight ${colors.text}`}
                  style={{ fontSize: Math.max(14, size / 3.5) }}
                >
                  {total}
                </span>
              </motion.div>

              <span className="text-sm font-medium text-slate-700 text-center px-1">
                {stat.contentType || "Unknown"}
              </span>

              {/* Mini status distribution bar */}
              <div className="flex h-[1] w-20 rounded-sm overflow-hidden bg-white/40">
                <div className="h-full bg-teal-600" style={{ width: seg(completed) }} />
                <div className="h-full bg-teal-300" style={{ width: seg(partial) }} />
                <div className="h-full bg-blue-400" style={{ width: seg(processing) }} />
                <div className="h-full bg-amber-500" style={{ width: seg(pending) }} />
                <div className="h-full bg-red-500" style={{ width: seg(failed) }} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-white/60 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-teal-600" /> Completed</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-teal-300" /> Partial</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Processing</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Pending</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Failed</span>
      </div>
    </div>
  );
};

export default ContentStatsTable;