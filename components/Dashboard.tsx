"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FileStack, CheckCircle2, RefreshCw, Clock, AlertTriangle, LayoutGrid, UploadCloud, AlertCircle } from "lucide-react";
import KpiCard from "@/components/KpiCard";
import StatusDonut from "@/components/StatusDonut";
import ContentTypeBreakdown from "@/components/ContentTypeBreakdown";
import DocumentTable, { FocusSignal } from "@/components/DocumentTable";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ContentStat } from "@/lib/types/document.types";
import { PAGE_WASH, STATUS_COLORS } from "@/lib/dashboardTheme";

interface Stats {
  totalDocumentCount: number;
  totalPending: number;
  totalProcessing: number;
  totalPartiallyCompleted: number;
  totalCompleted: number;
  totalFailed: number;
  overallCompletionRate: number;
  overallFailureRate: number;
}

const EMPTY_STATS: Stats = {
  totalDocumentCount: 0,
  totalPending: 0,
  totalProcessing: 0,
  totalPartiallyCompleted: 0,
  totalCompleted: 0,
  totalFailed: 0,
  overallCompletionRate: 0,
  overallFailureRate: 0,
};

const toTitleCase = (str: string) =>
  str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [contentStats, setContentStats] = useState<ContentStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [focusSignal, setFocusSignal] = useState<FocusSignal | null>(null);

  const uploadsRef = useRef<HTMLDivElement>(null);

  const fetchStats = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/documents", { signal });
      if (!response.ok) throw new Error("Failed to fetch stats");
      const data = await response.json();

      setStats({
        totalDocumentCount: parseInt(data.overallStats.total_document_count),
        totalPending: parseInt(data.overallStats.total_pending),
        totalProcessing: parseInt(data.overallStats.total_processing),
        totalPartiallyCompleted: parseInt(data.overallStats.total_partially_completed),
        totalCompleted: parseInt(data.overallStats.total_completed),
        totalFailed: parseInt(data.overallStats.total_failed),
        overallCompletionRate: parseFloat(data.overallStats.overall_completion_rate),
        overallFailureRate: parseFloat(data.overallStats.overall_failure_rate),
      });

      setContentStats(
        data.contentStats.map((stat: any) => ({
          contentType: toTitleCase(stat.content_type),
          totalDocuments: parseInt(stat.total_documents),
          pendingCount: parseInt(stat.pending_count),
          processingCount: parseInt(stat.processing_count),
          completedCount: parseInt(stat.completed_count),
          failedCount: parseInt(stat.failed_count),
          percentageCompleted: parseFloat(stat.percentage_completed),
          partiallyCompleted: parseFloat(stat.partially_completed),
        }))
      );
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      console.error("Error fetching stats:", err);
      setError("Couldn't load dashboard statistics.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchStats(controller.signal);
    return () => controller.abort();
  }, [fetchStats]);

  const jumpToFailed = () => {
    setFocusSignal({ status: "FAILED", nonce: Date.now() });
    uploadsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className={`mt-8 space-y-5 -mx-5 px-5 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12 py-6 rounded-3xl ${PAGE_WASH}`}>
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <span className="inline-flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </span>
          <button
            onClick={() => fetchStats()}
            className="font-semibold underline underline-offset-2 hover:text-rose-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* ============ KPI ROW ============ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[104px] rounded-xl" />
          ))
        ) : (
          <>
            <KpiCard title="Total documents" value={stats.totalDocumentCount} tone="neutral" icon={<FileStack className="w-4 h-4" />} />
            <KpiCard title="Completed" value={stats.totalCompleted} tone="completed" icon={<CheckCircle2 className="w-4 h-4" />} />
            <KpiCard title="Processing" value={stats.totalProcessing} tone="processing" icon={<RefreshCw className="w-4 h-4" />} />
            <KpiCard title="Pending" value={stats.totalPending} tone="pending" icon={<Clock className="w-4 h-4" />} />
            <KpiCard
              title="Failed"
              value={stats.totalFailed}
              tone="failed"
              icon={<AlertTriangle className="w-4 h-4" />}
              hint={stats.totalFailed > 0 ? "View →" : undefined}
              onClick={stats.totalFailed > 0 ? jumpToFailed : undefined}
            />
          </>
        )}
      </div>

      {/* ============ PIPELINE STATUS + BY CONTENT TYPE — side by side so wide screens don't leave each card half-empty ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-5 items-stretch">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-primary" />
              Pipeline status
            </CardTitle>
          </CardHeader>
          <CardContent className="h-full flex items-center justify-center">
            {isLoading ? (
              <div className="flex items-center gap-8 w-full max-w-md">
                <Skeleton className="w-[210px] h-[210px] rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-5 w-full" />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-10">
                <StatusDonut
                  total={stats.totalDocumentCount}
                  completed={stats.totalCompleted}
                  partial={stats.totalPartiallyCompleted}
                  processing={stats.totalProcessing}
                  pending={stats.totalPending}
                  failed={stats.totalFailed}
                  completionRate={stats.overallCompletionRate}
                />
                <div className="w-full sm:w-60 flex flex-col gap-2.5 text-[15px]">
                  <LegendRow label="Completed" value={stats.totalCompleted} dot={STATUS_COLORS.completed.dot} />
                  <LegendRow label="Partial" value={stats.totalPartiallyCompleted} dot={STATUS_COLORS.partial.dot} />
                  <LegendRow label="Processing" value={stats.totalProcessing} dot={STATUS_COLORS.processing.dot} />
                  <LegendRow label="Pending" value={stats.totalPending} dot={STATUS_COLORS.pending.dot} />
                  <LegendRow label="Failed" value={stats.totalFailed} dot={STATUS_COLORS.failed.dot} pulse={stats.totalFailed > 0} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileStack className="w-4 h-4 text-primary" />
              By content type
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full" />
                ))}
              </div>
            ) : (
              <ContentTypeBreakdown contentStats={contentStats} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* ============ RECENT UPLOADS ============ */}
      <div ref={uploadsRef}>
        <Card className="border-border scroll-mt-6">
          <CardHeader className="pb-2">
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-primary" />
                Latest uploads
              </CardTitle>
            </motion.div>
          </CardHeader>
          <CardContent>
            <DocumentTable limit={10} focusSignal={focusSignal} />
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

interface LegendRowProps {
  label: string;
  value: number;
  dot: string;
  pulse?: boolean;
}

const LegendRow: React.FC<LegendRowProps> = ({ label, value, dot, pulse }) => (
  <div className="flex justify-between items-center text-foreground/80">
    <span className="inline-flex items-center gap-2.5 font-medium">
      <span className={`w-2.5 h-2.5 rounded-full ${dot} ${pulse ? "animate-pulse" : ""}`} />
      {label}
    </span>
    <span className="font-bold tabular-nums text-lg text-foreground">{value}</span>
  </div>
);

export default Dashboard;
