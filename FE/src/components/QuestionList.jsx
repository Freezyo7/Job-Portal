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
      const msg = err.response?.data?.error || "Failed to generate questions. Please try again.";
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
        // Each entry: { jobId: { ...SavedJob }, appliedAt, status }
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
    <aside className="flex h-full flex-col overflow-hidden rounded-3xl bg-transparent border-2 shadow-2xl shadow-slate-300/70">
      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 pt-4">
        <Tab active={activeTab === "jobs"} onClick={() => setActiveTab("jobs")}>
          Applied Jobs
        </Tab>
        <Tab active={activeTab === "questions"} onClick={() => setActiveTab("questions")}>
          Question List
        </Tab>
      </div>

      {/* Applied Jobs Tab */}
      {activeTab === "jobs" && (
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center h-24">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="h-2 w-2 rounded-full bg-[#4f46e5] animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center px-4">
              <p className="text-xs text-slate-400">No applied jobs found.</p>
              <p className="text-[11px] text-slate-300 mt-1">Apply to jobs first to start an interview.</p>
            </div>
          ) : (
            jobs.map((job) => (
              <div
                key={job.id}
                onClick={() => handleJobClick(job)}
                className={`flex items-center gap-3 rounded-2xl border p-3 cursor-pointer transition-all text-xs md:text-[13px] ${
                  selectedJob?.id === job.id
                    ? "border-[#4f46e5] bg-[#eef2ff] shadow-md"
                    : "border-slate-100 bg-white shadow-sm hover:border-[#4f46e5]/40 hover:bg-[#f5f3ff]/50"
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
                    className="h-9 w-9 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                  />
                ) : null}
                <div
                  className="h-9 w-9 rounded-xl bg-[#eef2ff] flex-shrink-0 items-center justify-center text-[11px] font-bold text-[#4f46e5]"
                  style={{ display: job.company_logo ? "none" : "flex" }}
                >
                  {getInitials(job.company_name)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 truncate">{job.job_title}</p>
                  <p className="text-slate-500 truncate">{job.company_name}</p>
                  {job.location && <p className="text-slate-400 truncate">{job.location}</p>}
                </div>

                {selectedJob?.id === job.id && (
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#4f46e5] text-[10px] text-white flex-shrink-0">
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
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {aiLoading ? (
            <div className="flex flex-col items-center justify-center h-32 gap-3">
              <div className="flex gap-1.5">
                {[0,1,2].map((i) => (
                  <span key={i} className="h-2 w-2 rounded-full bg-[#4f46e5] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
              <p className="text-xs text-slate-400">Generating practice questions...</p>
            </div>
          ) : aiError ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2 text-center px-4">
              <p className="text-xs text-red-400 font-medium">⚠ {aiError}</p>
              <p className="text-[11px] text-slate-400">The AI quota may be exceeded. Try again in a minute.</p>
            </div>
          ) : aiQuestions.length > 0 ? (
            <>
              {selectedJob && (
                <p className="text-[11px] text-slate-400 mb-2">
                  Practice questions for <span className="font-semibold text-[#4f46e5]">{selectedJob.job_title}</span> at {selectedJob.company_name}
                </p>
              )}
              {aiQuestions.map((q, i) => (
                <div key={i} className="flex gap-3 rounded-2xl border border-slate-100 bg-white p-3 text-xs shadow-sm md:text-[13px]">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#eef2ff] text-[11px] font-semibold text-[#4f46e5] flex-shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <p className="leading-snug text-slate-800">{q}</p>
                </div>
              ))}
            </>
          ) : questions.length > 0 ? (
            questions.map((q) => (
              <div key={q.id} className="flex gap-3 rounded-2xl border border-slate-100 bg-white p-3 text-xs shadow-sm md:text-[13px]">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#eef2ff] text-[11px] font-semibold text-[#4f46e5]">
                  {q.id}
                </div>
                <div className="flex flex-1 items-start justify-between gap-2">
                  <p className="leading-snug text-slate-800">{q.title}</p>
                  {q.answered && (
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-[11px] text-emerald-600">✓</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 text-center mt-6">
              Click a job to generate practice questions.
            </p>
          )}
        </div>
      )}
    </aside>
  );
};

export default QuestionList;
