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
      <section className="space-y-4 rounded-3xl bg-[#f5f3ff]/40 p-5 border-2 border-slate-200 shadow-lg shadow-slate-200/70 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-light text-slate-900 md:text-lg">
              Interview Summary
            </h2>
            <p className="mt-1 text-xs font-light text-slate-500 md:text-[13px]">
              Complete an interview to see your AI-generated summary here.
            </p>
          </div>
        </div>
        <div className="mt-2 rounded-2xl bg-[#f5f3ff] px-4 py-6 text-center text-xs text-slate-400 md:text-[13px]">
          No interview completed yet.
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-3xl bg-[#f5f3ff]/40 p-5 border-2 border-slate-200 shadow-lg shadow-slate-200/70 md:p-6">
      {/* Title & metadata row */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-light text-slate-900 md:text-lg">
            Interview Summary – {jobInfo?.job_title}
          </h2>
          <p className="mt-1 text-xs font-light text-slate-500 md:text-[13px]">
            AI-assisted interview summary for {jobInfo?.company_name}
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-light text-slate-700 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Completed · {formattedTime}
        </div>
      </div>

      {/* Meta chips */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-light md:text-[13px]">
        {formattedDate && (
          <MetaChip icon={<CiCalendarDate size={15} />}>{formattedDate}</MetaChip>
        )}
        <MetaChip icon={<CiShoppingTag size={15} />}>
          {jobInfo?.job_title || "Interview"}
        </MetaChip>
        <MetaChip icon={<RiAdminLine size={15} />}>
          {jobInfo?.company_name || "Company"}
        </MetaChip>
        <MetaChip icon={<CiUser size={15} />}>
          {jobInfo?.location || "Location"}
        </MetaChip>
      </div>

      {/* AI summary */}
      <div className="mt-2 rounded-2xl bg-[#f5f3ff] px-4 py-3 text-xs text-slate-700 md:text-[13px]">
        <div className="mb-1.5 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#4f46e5] text-[11px] font-semibold text-white">
            AI
          </span>
          <span className="text-[18px] font-light text-slate-900">
            AI Summary of Interview
          </span>
        </div>
        <p className="leading-relaxed">{summary}</p>
      </div>
    </section>
  );
};

export default InterviewSummary;
