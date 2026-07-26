"use client";

import React from "react";
import { motion } from "framer-motion";
import CountUp from "./CountUp";
import { STATUS_COLORS, StatusKey } from "@/lib/dashboardTheme";

interface KpiCardProps {
  title: string;
  value: number;
  /** Which canonical status this KPI represents — drives the rail/dot/icon color. "neutral" for a plain total. */
  tone: StatusKey | "neutral";
  icon?: React.ReactNode;
  /** Trailing action hint (e.g. "View →"). Only rendered when onClick is provided. */
  hint?: string;
  onClick?: () => void;
  className?: string;
}

const NEUTRAL = {
  dot: "bg-primary",
  text: "text-primary",
  pillBg: "bg-indigo-50",
  pillText: "text-primary",
  hex: "#332d7d",
};

function hexToRgba(hex: string, alpha: number) {
  const m = hex.replace("#", "");
  const r = parseInt(m.substring(0, 2), 16);
  const g = parseInt(m.substring(2, 4), 16);
  const b = parseInt(m.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  tone,
  icon,
  hint,
  onClick,
  className = "",
}) => {
  const colors = tone === "neutral" ? NEUTRAL : STATUS_COLORS[tone];
  const Comp = onClick ? motion.button : motion.div;
  const glow = hexToRgba(colors.hex, 0.16);

  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`group relative w-full text-left rounded-2xl border border-border bg-white p-5 overflow-hidden
                  shadow-sm transition-all duration-300
                  ${onClick ? "cursor-pointer" : ""}
                  ${className}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      whileHover={{ y: -3 }}
      onMouseEnter={(e: React.MouseEvent<HTMLElement>) => {
        e.currentTarget.style.boxShadow = `0 14px 28px -12px ${glow}`;
        e.currentTarget.style.borderColor = hexToRgba(colors.hex, 0.35);
      }}
      onMouseLeave={(e: React.MouseEvent<HTMLElement>) => {
        e.currentTarget.style.boxShadow = "";
        e.currentTarget.style.borderColor = "";
      }}
    >
      {/* top accent bar */}
      <span
        className="absolute left-0 right-0 top-0 h-[3px] rounded-t-2xl"
        style={{ background: `linear-gradient(90deg, ${colors.hex}, ${hexToRgba(colors.hex, 0.25)})` }}
        aria-hidden
      />

      {/* soft glow orb */}
      <span
        className="absolute -right-14 -bottom-16 w-[170px] h-[170px] rounded-full blur-[2px] transition-transform duration-500 group-hover:scale-[1.18] pointer-events-none"
        style={{ background: `radial-gradient(circle, ${hexToRgba(colors.hex, 0.16)}, transparent 70%)` }}
        aria-hidden
      />

      {/* oversized watermark icon */}
      {icon && (
        <span
          className="absolute -right-3 -bottom-3 opacity-[0.07] scale-[2.6] transition-transform duration-500 group-hover:scale-[2.8] pointer-events-none"
          style={{ color: colors.hex }}
          aria-hidden
        >
          {icon}
        </span>
      )}

      <div className="relative flex items-center justify-between gap-2">
        <span
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-110"
          style={{
            background: `linear-gradient(135deg, ${hexToRgba(colors.hex, 0.16)}, ${hexToRgba(colors.hex, 0.06)})`,
            color: colors.hex,
          }}
        >
          {icon ?? <span className={`w-2 h-2 rounded-full ${colors.dot}`} />}
        </span>
        {hint && onClick && (
          <span
            className="text-xs font-semibold opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0"
            style={{ color: colors.hex }}
          >
            {hint}
          </span>
        )}
      </div>

      <p className="relative mt-3.5 text-[13px] font-medium text-muted-foreground m-0">{title}</p>
      <p className="relative mt-1 text-4xl font-extrabold leading-none tracking-tight text-foreground m-0 tabular-nums">
        <CountUp value={value} />
      </p>
    </Comp>
  );
};

export default KpiCard;
