"use client";

import React, { useMemo } from "react";
import { ContentStat } from "@/lib/types/document.types";
import { CONTENT_TYPE_PALETTE, STATUS_COLORS } from "@/lib/dashboardTheme";

interface ContentTypeBreakdownProps {
  contentStats: ContentStat[];
}

const ContentTypeBreakdown: React.FC<ContentTypeBreakdownProps> = ({
  contentStats = [],
}) => {
  const sorted = useMemo(
    () =>
      contentStats
        .filter((s) => (s.totalDocuments || 0) > 0)
        .sort((a, b) => (b.totalDocuments || 0) - (a.totalDocuments || 0)),
    [contentStats]
  );

  const maxDocs = useMemo(
    () => sorted.reduce((m, s) => Math.max(m, s.totalDocuments || 0), 0),
    [sorted]
  );

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6 m-0">
        No content statistics available yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {sorted.map((stat, i) => {
        const total = stat.totalDocuments || 0;
        const widthPct = maxDocs > 0 ? (total / maxDocs) * 100 : 0;
        const palette = CONTENT_TYPE_PALETTE[i % CONTENT_TYPE_PALETTE.length];

        const seg = (n: number) => (total > 0 ? `${(n / total) * 100}%` : "0%");

        return (
          <div key={stat.contentType || i}>
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${palette.chip} truncate`}>
                  {stat.contentType || "Unknown"}
                </span>
              </div>
              <span className="text-sm font-semibold text-foreground tabular-nums flex-shrink-0">
                {total}
              </span>
            </div>

            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full ${palette.bar} transition-[width] duration-700 ease-out motion-reduce:transition-none`}
                style={{ width: `${widthPct}%` }}
              />
            </div>

            {/* Status mix within this content type */}
            <div className="mt-1.5 flex h-1 w-full rounded-full overflow-hidden bg-muted/60" title="Status mix">
              <div className={STATUS_COLORS.completed.bg} style={{ width: seg(stat.completedCount || 0) }} />
              <div className={STATUS_COLORS.partial.bg} style={{ width: seg(stat.partiallyCompleted || 0) }} />
              <div className={STATUS_COLORS.processing.bg} style={{ width: seg(stat.processingCount || 0) }} />
              <div className={STATUS_COLORS.pending.bg} style={{ width: seg(stat.pendingCount || 0) }} />
              <div className={STATUS_COLORS.failed.bg} style={{ width: seg(stat.failedCount || 0) }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ContentTypeBreakdown;
