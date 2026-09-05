import React from "react";
import { MetaChip } from "./InterviewUICommon";
import { CiCalendarDate, CiShoppingTag, CiUser } from "react-icons/ci";
import { RiAdminLine } from "react-icons/ri";

const InterviewSummary = ({ summaryData }) => {
  const { summary, jobInfo, endedAt } = summaryData || {};

  const formattedDate = endedAt
    ? new Date(endedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const formattedTime = endedAt
    ? new Date(endedAt).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  // Placeholder state — shown before any interview is completed
  if (!summaryData) {
    return (
      <section className="space-y-3 rounded-lg bg-white dark:bg-zinc-900 p-5 border border-zinc-200 dark:border-zinc-800 shadow-none">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Interview Assessment Telemetry
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Complete an interactive audio session to generate evaluation summary.
          </p>
        </div>
        <div className="rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 px-4 py-6 text-center text-xs font-mono text-zinc-400 dark:text-zinc-500">
          STATUS: NO_EVALUATION_RECORDED
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-lg bg-white dark:bg-zinc-900 p-5 border border-zinc-200 dark:border-zinc-800 shadow-none">
      {/* Title & metadata row */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3.5">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Evaluation Telemetry – {jobInfo?.job_title}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            AI synthesized performance breakdown for {jobInfo?.company_name}
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-xs font-mono text-emerald-600 dark:text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          COMPLETED · {formattedTime}
        </div>
      </div>

      {/* Meta chips */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {formattedDate && (
          <MetaChip icon={<CiCalendarDate size={14} />}>{formattedDate}</MetaChip>
        )}
        <MetaChip icon={<CiShoppingTag size={14} />}>
          {jobInfo?.job_title || "Interview"}
        </MetaChip>
        <MetaChip icon={<RiAdminLine size={14} />}>
          {jobInfo?.company_name || "Company"}
        </MetaChip>
        <MetaChip icon={<CiUser size={14} />}>
          {jobInfo?.location || "Location"}
        </MetaChip>
      </div>

      {/* AI summary */}
      <div className="rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 p-4 text-xs text-zinc-700 dark:text-zinc-300">
        <div className="mb-2 flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-emerald-600 text-[10px] font-mono font-bold text-white">
            AI
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
            Session Synthesis
          </span>
        </div>
        <p className="leading-relaxed whitespace-pre-line text-zinc-700 dark:text-zinc-300 font-sans">{summary}</p>
      </div>
    </section>
  );
};

export default InterviewSummary;


