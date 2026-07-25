"use client";

import React from "react";
import { motion } from "framer-motion";
import CountUp from "./CountUp";

type KpiVariant = "hero" | "compact" | "flat";

interface KpiCardProps {
  title: string;
  value: number | string;
  variant?: KpiVariant;
  /** Tailwind gradient classes for background — see CARD_GRADIENTS */
  gradient: string;
  /** Tailwind text color for the title label */
  labelClass?: string;
  /** Tailwind text color for the value */
  valueClass?: string;
  /** Status dot color (e.g. "bg-amber-500"). Optional. */
  dotClass?: string;
  /** Pulse the dot? */
  pulseDot?: boolean;
  /** Trailing hint text (e.g. "→ retry") */
  hint?: string;
  /** Extra class on the outer card */
  className?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  variant = "compact",
  gradient,
  labelClass = "text-slate-700",
  valueClass = "text-slate-900",
  dotClass,
  pulseDot = false,
  hint,
  className = "",
}) => {
  const isNumeric = typeof value === "number";

  const padding = variant === "hero" ? "p-7" : "p-6";
  const valueSize =
    variant === "hero" ? "text-6xl" : variant === "compact" ? "text-5xl" : "text-5xl";

  return (
    <motion.div
      className={`relative rounded-2xl border border-white/70 backdrop-blur-sm ${gradient} ${padding} ${className}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ y: -2, transition: { duration: 0.18 } }}
    >
      <div className="flex items-center justify-between">
        <p
          className={`text-sm font-semibold uppercase tracking-widest m-0 ${labelClass}`}
        >
          {title}
        </p>
        {dotClass && (
          <span
            className={`inline-block w-3 h-3 rounded-full ${dotClass} ${
              pulseDot ? "animate-pulse" : ""
            }`}
            aria-hidden="true"
          />
        )}
      </div>
      <div className="flex items-baseline justify-between mt-2">
        <p
          className={`${valueSize} font-bold leading-none tracking-tight m-0 ${valueClass}`}
        >
          {isNumeric ? <CountUp value={value as number} /> : value}
        </p>
        {hint && (
          <span className="text-xs font-semibold text-red-700">{hint}</span>
        )}
      </div>
    </motion.div>
  );
};

export default KpiCard;