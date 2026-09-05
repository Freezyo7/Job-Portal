import React, { useState } from "react";
import { HiX, HiCheck, HiDocumentText } from "react-icons/hi";
import api from "../lib/api";

const CoverLetterModal = ({ job, onClose }) => {
  const [coverLetter, setCoverLetter] = useState("");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [copied, setCopied]           = useState(false);

  const generate = async () => {
    setLoading(true);
    setError("");
    setCoverLetter("");
    try {
      const profileRes = await api.get("/auth/profile");
      const { username, profile } = profileRes.data;

      const res = await api.post("/interview/cover-letter", {
        jobInfo: {
          job_title:       job.jobTitle    || job.job_title,
          company_name:    job.companyName || job.company_name,
          job_description: job.jobDescription || job.job_description || "",
        },
        userProfile: {
          username,
          designation: profile.designation,
          summary:     profile.summary,
          skills:      profile.skills,
          experience:  profile.experience,
          education:   profile.education,
        },
      });
      setCoverLetter(res.data.coverLetter);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to generate. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  React.useEffect(() => { generate(); }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={loading ? undefined : onClose} />
      <div className="relative w-full max-w-2xl rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center">
              <HiDocumentText size={14} className="text-zinc-700 dark:text-zinc-300" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Cover Letter Generator</p>
              <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">{job.jobTitle || job.job_title} · {job.companyName || job.company_name}</p>
            </div>
          </div>
          {!loading && (
            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
              <HiX size={16} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <div className="flex gap-1.5">
                {[0,1,2].map((i) => (
                  <span key={i} className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
              <p className="text-xs font-mono text-zinc-400">Synthesizing personalized cover letter...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
              <p className="text-xs text-red-500 font-medium">{error}</p>
              <button onClick={generate} className="rounded-md bg-emerald-600 dark:bg-emerald-500 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition-colors">
                Retry Generation
              </button>
            </div>
          ) : (
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              className="w-full h-80 text-xs font-mono text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-950 leading-relaxed resize-none border border-zinc-200 dark:border-zinc-800 rounded-md p-4 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          )}
        </div>

        {/* Footer */}
        {!loading && !error && coverLetter && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-200 dark:border-zinc-800 flex-shrink-0 bg-zinc-50/50 dark:bg-zinc-900/50">
            <button onClick={generate} className="text-xs text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-mono">
              ↺ Regenerate
            </button>
            <button
              onClick={copy}
              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 dark:bg-emerald-500 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition-colors"
            >
              {copied ? <><HiCheck size={13} /> Copied</> : "Copy to Clipboard"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoverLetterModal;


