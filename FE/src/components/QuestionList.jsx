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
    <aside className="flex h-full flex-col overflow-hidden rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-none">
      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 px-4 pt-3.5">
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
                  <span key={i} className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center px-4">
              <p className="text-xs font-mono text-zinc-400 dark:text-zinc-500">NO APPLIED POSITIONS FOUND</p>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-600 mt-1">Submit applications first to calibrate interview engine.</p>
            </div>
          ) : (
            jobs.map((job) => (
              <div
                key={job.id}
                onClick={() => handleJobClick(job)}
                className={`flex items-center gap-3 rounded-md border p-2.5 cursor-pointer transition-all text-xs ${
                  selectedJob?.id === job.id
                    ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100 shadow-none"
                    : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/60 hover:border-zinc-300 dark:hover:border-zinc-700"
                }`}
              >
                {/* Logo or initials */}
                {job.company_logo ? (
                  <img
                    src={job.company_logo}
                    alt={job.company_name}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
                    className="h-8 w-8 rounded object-cover border border-zinc-200 dark:border-zinc-700 flex-shrink-0"
                  />
                ) : null}
                <div
                  className="h-8 w-8 rounded bg-zinc-100 dark:bg-zinc-800 flex-shrink-0 items-center justify-center text-[10px] font-mono font-bold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60"
                  style={{ display: job.company_logo ? "none" : "flex" }}
                >
                  {getInitials(job.company_name)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{job.job_title}</p>
                  <p className="text-zinc-500 dark:text-zinc-400 truncate text-[11px]">{job.company_name}</p>
                </div>

                {selectedJob?.id === job.id && (
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-emerald-600 text-[10px] font-mono text-white flex-shrink-0">
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
                  <span key={i} className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
              <p className="text-xs font-mono text-zinc-500">GENERATING ASSESSMENT PROMPTS...</p>
            </div>
          ) : aiError ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2 text-center px-4">
              <p className="text-xs text-rose-500 font-medium">⚠ {aiError}</p>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500">Telemetry quota exceeded or network timed out.</p>
            </div>
          ) : aiQuestions.length > 0 ? (
            <>
              {selectedJob && (
                <div className="border-b border-zinc-200 dark:border-zinc-800 pb-2 mb-2">
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Prompt suite for <span className="font-semibold text-zinc-900 dark:text-zinc-100">{selectedJob.job_title}</span> ({selectedJob.company_name})
                  </p>
                </div>
              )}
              {aiQuestions.map((q, i) => (
                <div key={i} className="flex gap-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/60 p-2.5 text-xs">
                  <div className="flex h-5 w-5 items-center justify-center rounded bg-zinc-200 dark:bg-zinc-800 text-[10px] font-mono font-semibold text-zinc-700 dark:text-zinc-300 flex-shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <p className="leading-snug text-zinc-800 dark:text-zinc-200">{q}</p>
                </div>
              ))}
            </>
          ) : questions.length > 0 ? (
            questions.map((q) => (
              <div key={q.id} className="flex gap-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/60 p-2.5 text-xs">
                <div className="flex h-5 w-5 items-center justify-center rounded bg-zinc-200 dark:bg-zinc-800 text-[10px] font-mono font-semibold text-zinc-700 dark:text-zinc-300 flex-shrink-0">
                  {q.id}
                </div>
                <div className="flex flex-1 items-start justify-between gap-2">
                  <p className="leading-snug text-zinc-800 dark:text-zinc-200">{q.title}</p>
                  {q.answered && (
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-emerald-500/10 text-[10px] font-mono text-emerald-600 dark:text-emerald-400">✓</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center mt-6">
              Select a position from the list to populate questions.
            </p>
          )}
        </div>
      )}
    </aside>
  );
};

export default QuestionList;


