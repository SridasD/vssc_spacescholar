"use client";

import Link from "next/link";
import { FileSpreadsheet, FileCheck2, ArrowRight } from "lucide-react";

interface MetadataWorkflowStepsProps {
  current: 1 | 2;
}

const STEPS = [
  {
    n: 1 as const,
    href: "/metadata-splitter",
    title: "Split large files",
    desc: "Files over 1,000 rows are split into a ZIP of CSVs.",
    icon: FileSpreadsheet,
  },
  {
    n: 2 as const,
    href: "/metadata-uploader",
    title: "Upload & review",
    desc: "Validate your CSV and submit it for processing.",
    icon: FileCheck2,
  },
];

/** Shown at the top of both metadata pages so users always know where they are in the 2-step workflow and can jump to the other step. */
export default function MetadataWorkflowSteps({ current }: MetadataWorkflowStepsProps) {
  return (
    <div className="mb-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2.5">
        Metadata upload workflow
      </p>
      <div className="flex items-center gap-3">
        {STEPS.map((step, i) => {
          const isCurrent = step.n === current;
          const Icon = step.icon;
          return (
            <div key={step.n} className="flex items-center gap-3 flex-1 min-w-0">
              <Link
                href={step.href}
                className={`flex items-center gap-3 flex-1 min-w-0 px-3.5 py-2.5 rounded-xl border transition-colors ${
                  isCurrent
                    ? "border-primary/40 bg-primary/5"
                    : "border-border bg-white hover:bg-muted"
                }`}
              >
                <span
                  className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    isCurrent ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step.n}
                </span>
                <span className="min-w-0">
                  <span className={`flex items-center gap-1.5 text-sm font-semibold truncate ${isCurrent ? "text-primary" : "text-foreground"}`}>
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    {step.title}
                  </span>
                  <span className="block text-xs text-muted-foreground truncate">{step.desc}</span>
                </span>
              </Link>
              {i < STEPS.length - 1 && (
                <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0 hidden sm:block" aria-hidden />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
