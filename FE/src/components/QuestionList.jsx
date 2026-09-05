import React, { useState, useEffect } from "react";
import { Tab } from "./InterviewUICommon";
import api from "../lib/api";
import { getInitials, resolveLogoUrl, toDisplayLogoUrl } from "../lib/jobLogos";

const QuestionList = ({ questions = [], onJobSelect, selectedJob }) => {
  const [activeTab, setActiveTab] = useState("jobs");
  const [jobs, setJobs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [aiQuestions, setAiQuestions] = useState([]);
  const [aiLoading, setAiLoading]     = useState(false);
  const [aiError, setAiError]         = useState("");

  const handleJobClick = async (job) => {
    onJobSelect(job);
    setActiveTab("questions");
    setAiQuestions([]);
    setAiError("");
    setAiLoading(true);
    try {
      const res = await api.post("/interview/questions", {
        jobInfo: {
          job_title:       job.job_title,
          company_name:    job.company_name,
          job_description: job.job_description || "",
        },
      });
      setAiQuestions(res.data.questions || []);
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to generate questions. Please retry.";
      setAiError(msg);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    api
      .get("/apply/my-applications")
      .then((res) => {
        const entries = Array.isArray(res.data) ? res.data : [];
        const normalized = entries
          .filter((a) => a.jobId)
          .map((a) => ({
            id:          a.jobId._id,
            job_title:   a.jobId.job_title,
            company_name:a.jobId.company_name,
            company_logo:toDisplayLogoUrl(resolveLogoUrl(a.jobId)),
            location:    a.jobId.job_location,
            status:      a.status,
          }));
        setJobs(normalized);
      })
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <aside
      className="flex h-full flex-col overflow-hidden rounded-lg border shadow-none"
      style={{
        backgroundColor: "var(--nt-bg-card)",
        borderColor: "var(--nt-border)",
        boxShadow: "var(--nt-shadow-sm)",
      }}
    >
      {/* Tabs */}
      <div className="flex items-center gap-2 border-b px-4 pt-3.5" style={{ borderColor: "var(--nt-border)" }}>
        <Tab active={activeTab === "jobs"} onClick={() => setActiveTab("jobs")}>
          Applied Roles ({jobs.length})
        </Tab>
        <Tab active={activeTab === "questions"} onClick={() => setActiveTab("questions")}>
          Question Telemetry
        </Tab>
      </div>

      {/* Applied Jobs Tab */}
      {activeTab === "jobs" && (
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center h-24">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="h-1.5 w-1.5 rounded-full animate-pulse"
                    style={{ backgroundColor: "var(--nt-accent-sage)", animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center px-4">
              <p className="text-xs font-mono" style={{ color: "var(--nt-text-muted)" }}>NO APPLIED POSITIONS FOUND</p>
              <p className="text-[11px] mt-1" style={{ color: "var(--nt-text-muted)" }}>Submit applications first to calibrate interview engine.</p>
            </div>
          ) : (
            jobs.map((job) => (
              <div
                key={job.id}
                onClick={() => handleJobClick(job)}
                className="flex items-center gap-3 rounded-md border p-2.5 cursor-pointer transition-all text-xs"
                style={
                  selectedJob?.id === job.id
                    ? {
                        backgroundColor: "var(--nt-bg-card-alt)",
                        borderColor: "var(--nt-accent-sage)",
                        borderLeftWidth: "3px",
                      }
                    : {
                        backgroundColor: "var(--nt-bg-card-alt)",
                        borderColor: "var(--nt-border)",
                      }
                }
              >
                {/* Logo or initials */}
                {job.company_logo ? (
                  <img
                    src={job.company_logo}
                    alt={job.company_name}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
                    className="h-8 w-8 rounded object-cover border flex-shrink-0"
                    style={{ borderColor: "var(--nt-border)" }}
                  />
                ) : null}
                <div
                  className="h-8 w-8 rounded flex-shrink-0 items-center justify-center text-[10px] font-mono font-bold border"
                  style={{
                    display: job.company_logo ? "none" : "flex",
                    backgroundColor: "var(--nt-bg-secondary)",
                    borderColor: "var(--nt-border)",
                    color: "var(--nt-text-primary)",
                  }}
                >
                  {getInitials(job.company_name)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate" style={{ color: "var(--nt-text-primary)" }}>{job.job_title}</p>
                  <p className="truncate text-[11px]" style={{ color: "var(--nt-text-secondary)" }}>{job.company_name}</p>
                </div>

                {selectedJob?.id === job.id && (
                  <span
                    className="inline-flex h-4 w-4 items-center justify-center rounded text-[10px] font-mono text-white flex-shrink-0"
                    style={{ backgroundColor: "var(--nt-accent-sage)" }}
                  >
                    ✓
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Question List Tab */}
      {activeTab === "questions" && (
        <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
          {aiLoading ? (
            <div className="flex flex-col items-center justify-center h-32 gap-3">
              <div className="flex gap-1.5">
                {[0,1,2].map((i) => (
                  <span key={i} className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: "var(--nt-accent-sage)", animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
              <p className="text-xs font-mono" style={{ color: "var(--nt-text-muted)" }}>GENERATING ASSESSMENT PROMPTS...</p>
            </div>
          ) : aiError ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2 text-center px-4">
              <p className="text-xs text-rose-500 font-medium">⚠ {aiError}</p>
              <p className="text-[11px]" style={{ color: "var(--nt-text-muted)" }}>Telemetry quota exceeded or network timed out.</p>
            </div>
          ) : aiQuestions.length > 0 ? (
            <>
              {selectedJob && (
                <div className="border-b pb-2 mb-2" style={{ borderColor: "var(--nt-border)" }}>
                  <p className="text-[11px]" style={{ color: "var(--nt-text-secondary)" }}>
                    Prompt suite for <span className="font-semibold" style={{ color: "var(--nt-text-primary)" }}>{selectedJob.job_title}</span> ({selectedJob.company_name})
                  </p>
                </div>
              )}
              {aiQuestions.map((q, i) => (
                <div
                  key={i}
                  className="flex gap-2.5 rounded-md border p-2.5 text-xs"
                  style={{
                    backgroundColor: "var(--nt-bg-card-alt)",
                    borderColor: "var(--nt-border)",
                  }}
                >
                  <div
                    className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-mono font-semibold flex-shrink-0"
                    style={{
                      backgroundColor: "var(--nt-bg-secondary)",
                      color: "var(--nt-text-primary)",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <p className="leading-snug" style={{ color: "var(--nt-text-primary)" }}>{q}</p>
                </div>
              ))}
            </>
          ) : questions.length > 0 ? (
            questions.map((q) => (
              <div
                key={q.id}
                className="flex gap-2.5 rounded-md border p-2.5 text-xs"
                style={{
                  backgroundColor: "var(--nt-bg-card-alt)",
                  borderColor: "var(--nt-border)",
                }}
              >
                <div
                  className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-mono font-semibold flex-shrink-0"
                  style={{
                    backgroundColor: "var(--nt-bg-secondary)",
                    color: "var(--nt-text-primary)",
                  }}
                >
                  {q.id}
                </div>
                <div className="flex flex-1 items-start justify-between gap-2">
                  <p className="leading-snug" style={{ color: "var(--nt-text-primary)" }}>{q.title}</p>
                  {q.answered && (
                    <span
                      className="inline-flex h-4 w-4 items-center justify-center rounded text-[10px] font-mono"
                      style={{
                        backgroundColor: "rgba(111, 175, 123, 0.15)",
                        color: "var(--nt-accent-sage)",
                      }}
                    >
                      ✓
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-center mt-6" style={{ color: "var(--nt-text-muted)" }}>
              Select a position from the list to populate questions.
            </p>
          )}
        </div>
      )}
    </aside>
  );
};

export default QuestionList;
