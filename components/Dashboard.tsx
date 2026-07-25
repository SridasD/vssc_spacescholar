"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import KpiCard from "@/components/KpiCard";
import StatusDonut from "@/components/StatusDonut";
import ProgressBar from "@/components/ProgressBar";
import ContentStatsTable from "@/components/ContentStatsTable";
import DocumentTable from "@/components/DocumentTable";
import Footer from "@/components/Footer";
import { ContentStat } from "@/lib/types/document.types";
import {
  CARD_GRADIENTS,
  PAGE_GRADIENT,
  STATUS_COLORS,
} from "@/lib/dashboardTheme";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalDocumentCount: 0,
    totalPending: 0,
    totalProcessing: 0,
    totalPartiallyCompleted: 0,
    totalCompleted: 0,
    totalFailed: 0,
    overallCompletionRate: 0,
    overallFailureRate: 0,
  });
  const [contentStats, setContentStats] = useState<ContentStat[]>([]);

  const toTitleCase = (str: string) =>
    str.replace(
      /\w\S*/g,
      (txt) =>
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/documents");
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
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="mt-8 space-y-3.5">
      <div className={`relative rounded-3xl p-6 sm:p-8 overflow-hidden ${PAGE_GRADIENT}`}>
        {/* Decorative sparkles */}
        <span className="absolute top-7 right-20 w-1 h-1 rounded-full bg-peacock opacity-40" />
        <span className="absolute top-14 right-56 w-[3px] h-[3px] rounded-full bg-peacock opacity-30" />
        <span className="absolute top-20 right-80 w-[3px] h-[3px] rounded-full bg-turmeric opacity-50" />
        <span className="absolute top-40 right-8 w-1 h-1 rounded-full bg-peacock opacity-35" />

        {/* HERO ROW: donut + actionable KPI stack */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-5 mb-5">
          {/* Donut card */}
          <motion.div
            className={`relative rounded-2xl border border-white/70 backdrop-blur-sm p-7 ${CARD_GRADIENTS.teal}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground m-0">
                Pipeline status
              </p>

            </div>

            <div className="flex items-center gap-7">
              <StatusDonut
                total={stats.totalDocumentCount}
                completed={stats.totalCompleted}
                partial={stats.totalPartiallyCompleted}
                processing={stats.totalProcessing}
                pending={stats.totalPending}
                failed={stats.totalFailed}
                completionRate={stats.overallCompletionRate}
              />
              <div className="flex-1 flex flex-col gap-3 text-[15px]">
                <LegendRow label="Completed" value={stats.totalCompleted} dot={STATUS_COLORS.completed.dot} />
                <LegendRow label="Partial" value={stats.totalPartiallyCompleted} dot={STATUS_COLORS.partial.dot} />
                <LegendRow label="Processing" value={stats.totalProcessing} dot={STATUS_COLORS.processing.dot} />
                <LegendRow label="Pending" value={stats.totalPending} dot={STATUS_COLORS.pending.dot} />
                <LegendRow label="Failed" value={stats.totalFailed} dot={STATUS_COLORS.failed.dot} pulse />
              </div>
            </div>
          </motion.div>

          {/* Actionable KPI stack */}
          <div className="grid grid-rows-3 gap-4">
            <KpiCard
              title="Pending"
              value={stats.totalPending}
              gradient={CARD_GRADIENTS.amber}
              labelClass="text-amber-800"
              valueClass="text-amber-900"
              dotClass="bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
            />
            <KpiCard
              title="Processing"
              value={stats.totalProcessing}
              gradient={CARD_GRADIENTS.blue}
              labelClass="text-blue-800"
              valueClass="text-blue-900"
              dotClass="bg-blue-400"
            />
            <KpiCard
              title="Failed"
              value={stats.totalFailed}
              gradient={CARD_GRADIENTS.rose}
              labelClass="text-red-700"
              valueClass="text-red-800"
              dotClass="bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
              pulseDot
              hint={stats.totalFailed > 0 ? "→ retry" : undefined}
            />
          </div>
        </div>

        {/* SECONDARY KPI strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <KpiCard
            title="Total documents"
            value={stats.totalDocumentCount}
            gradient={CARD_GRADIENTS.cream}
            labelClass="text-muted-foreground"
          />
          <KpiCard
            title="Completed"
            value={stats.totalCompleted}
            gradient={CARD_GRADIENTS.mint}
            labelClass="text-emerald-800"
            valueClass="text-emerald-900"
          />
          <KpiCard
            title="Partially completed"
            value={stats.totalPartiallyCompleted}
            gradient={CARD_GRADIENTS.lavender}
            labelClass="text-indigo-800"
            valueClass="text-indigo-900"
          />
        </div>

        {/* PROGRESS BAR */}
        <div className="mb-5">
          <ProgressBar stats={stats} />
        </div>

        {/* CONTENT TYPE ORBS */}
        <div className="mb-5">
          <ContentStatsTable contentStats={contentStats} />
        </div>
      </div>

      {/* RECENT UPLOADS */}
      <div className={`rounded-3xl p-5 sm:p-6 ${PAGE_GRADIENT}`}>
        <motion.h3
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-[22px] font-medium tracking-tight text-foreground mb-5"
        >
          Latest uploads
        </motion.h3>
        <DocumentTable limit={10} />
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