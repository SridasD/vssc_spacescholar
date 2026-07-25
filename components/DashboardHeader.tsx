"use client";

import React from "react";
import { motion } from "framer-motion";

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  userName?: string;
  /** e.g. "17 documents tracked · last sync 2 min ago" */
  context?: string;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatToday(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  subtitle,
  userName,
  context,
}) => {
  return (
    <div className="relative flex items-center justify-between mb-6 z-10">
      <motion.div
        className="flex items-center gap-3.5"
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Orbit motif — three rings, one orbiting planet, glowing teal core */}
           <div className="relative w-14 h-14" aria-hidden="true">
            <div className="absolute inset-0 border border-teal-200 rounded-full" />
          <div className="absolute inset-1.5 border border-teal-300 rounded-full" />
          <div className="absolute inset-3 border border-teal-400 rounded-full" />
          <div className="absolute inset-0 motion-safe:animate-[spin_6s_linear_infinite]">
            <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-teal-600 shadow-[0_0_6px_rgba(13,148,136,0.6)]" />
          </div>
          <div className="absolute inset-[22px] rounded-full bg-gradient-to-br from-teal-300 to-teal-700 shadow-[0_0_14px_rgba(13,148,136,0.5)] motion-safe:animate-[floatA_3s_ease-in-out_infinite]" />
        </div>

        <div>
          <p className="text-[20px] font-medium tracking-tight text-slate-900 m-0">
            {title}
          </p>
          <p className="text-xs text-slate-500 m-0 mt-0.5 tracking-wide">
            {context ?? subtitle}
          </p>
        </div>
      </motion.div>

      <motion.div
        className="text-right"
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {userName && (
          <p className="text-[15px] font-medium text-slate-900 m-0">
            {getGreeting()}, {userName}
          </p>
        )}
        <p className="text-[11px] text-slate-500 m-0 mt-0.5">{formatToday()}</p>
      </motion.div>
    </div>
  );
};

export default DashboardHeader;