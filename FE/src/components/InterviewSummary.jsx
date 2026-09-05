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
      <section
        className="space-y-3 rounded-lg p-5 border shadow-none"
        style={{
          backgroundColor: "var(--nt-bg-card)",
          borderColor: "var(--nt-border)",
          boxShadow: "var(--nt-shadow-sm)",
        }}
      >
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold" style={{ color: "var(--nt-text-primary)" }}>
            Interview Assessment Telemetry
          </h2>
          <p className="text-xs" style={{ color: "var(--nt-text-secondary)" }}>
            Complete an interactive audio session to generate evaluation summary.
          </p>
        </div>
        <div
          className="rounded-md border px-4 py-6 text-center text-xs font-mono"
          style={{
            backgroundColor: "var(--nt-bg-card-alt)",
            borderColor: "var(--nt-border)",
            color: "var(--nt-text-muted)",
          }}
        >
          STATUS: NO_EVALUATION_RECORDED
        </div>
      </section>
    );
  }

  return (
    <section
      className="space-y-4 rounded-lg p-5 border shadow-none"
      style={{
        backgroundColor: "var(--nt-bg-card)",
        borderColor: "var(--nt-border)",
        boxShadow: "var(--nt-shadow-sm)",
      }}
    >
      {/* Title & metadata row */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b pb-3.5" style={{ borderColor: "var(--nt-border)" }}>
        <div>
          <h2 className="text-sm font-semibold" style={{ color: "var(--nt-text-primary)" }}>
            Evaluation Telemetry – {jobInfo?.job_title}
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--nt-text-secondary)" }}>
            AI synthesized performance breakdown for {jobInfo?.company_name}
          </p>
        </div>
        <div
          className="inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-mono font-medium"
          style={{
            backgroundColor: "rgba(111, 175, 123, 0.15)",
            borderColor: "rgba(111, 175, 123, 0.3)",
            color: "var(--nt-accent-sage)",
          }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "var(--nt-accent-sage)" }} />
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
      <div
        className="rounded-md border p-4 text-xs"
        style={{
          backgroundColor: "var(--nt-bg-card-alt)",
          borderColor: "var(--nt-border)",
          color: "var(--nt-text-primary)",
        }}
      >
        <div className="mb-2 flex items-center gap-2">
          <span
            className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-mono font-bold text-white"
            style={{ backgroundColor: "var(--nt-accent-sage)" }}
          >
            AI
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--nt-text-primary)" }}>
            Session Synthesis
          </span>
        </div>
        <p className="leading-relaxed whitespace-pre-line font-sans" style={{ color: "var(--nt-text-primary)" }}>{summary}</p>
      </div>
    </section>
  );
};

export default InterviewSummary;
