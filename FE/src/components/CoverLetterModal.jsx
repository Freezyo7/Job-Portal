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
      // Fetch user profile first
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

  // Auto-generate on open
  React.useEffect(() => { generate(); }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={loading ? undefined : onClose} />
      <div className="relative w-full max-w-2xl rounded-3xl border-2 border-slate-200/80 bg-white shadow-2xl shadow-slate-300/50 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Accent bar */}
        <div className="h-1.5 w-full bg-[linear-gradient(135deg,#03001e,#7303c0,#ec38bc,#fdeff9)] flex-shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-[#eef2ff] flex items-center justify-center">
              <HiDocumentText size={16} className="text-[#4f46e5]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Cover Letter</p>
              <p className="text-[11px] text-slate-400">{job.jobTitle || job.job_title} · {job.companyName || job.company_name}</p>
            </div>
          </div>
          {!loading && (
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
              <HiX size={18} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <div className="flex gap-1.5">
                {[0,1,2].map((i) => (
                  <span key={i} className="h-2 w-2 rounded-full bg-[#4f46e5] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
              <p className="text-xs text-slate-400">Generating your cover letter...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
              <p className="text-sm text-red-400 font-medium">⚠ {error}</p>
              <button onClick={generate} className="rounded-2xl bg-[#4f46e5] px-4 py-2 text-xs font-medium text-white hover:bg-[#4338ca] transition-colors">
                Try Again
              </button>
            </div>
          ) : (
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              className="w-full h-80 text-xs text-slate-700 leading-relaxed resize-none border border-slate-200 rounded-2xl p-4 focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/10"
            />
          )}
        </div>

        {/* Footer */}
        {!loading && !error && coverLetter && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 flex-shrink-0">
            <button onClick={generate} className="text-xs text-slate-400 hover:text-[#4f46e5] transition-colors">
              ↺ Regenerate
            </button>
            <button
              onClick={copy}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-[#4f46e5] px-4 py-2 text-xs font-medium text-white hover:bg-[#4338ca] transition-colors"
            >
              {copied ? <><HiCheck size={13} /> Copied!</> : "Copy to Clipboard"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoverLetterModal;
