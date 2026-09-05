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
          designation: profile?.designation,
          summary:     profile?.summary,
          skills:      profile?.skills,
          experience:  profile?.experience,
          education:   profile?.education,
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
      <div
        className="relative w-full max-w-2xl rounded-lg border shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{
          backgroundColor: "var(--nt-bg-card)",
          borderColor: "var(--nt-border)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b flex-shrink-0" style={{ borderColor: "var(--nt-border)" }}>
          <div className="flex items-center gap-2.5">
            <div
              className="h-7 w-7 rounded-md border flex items-center justify-center"
              style={{
                backgroundColor: "var(--nt-bg-secondary)",
                borderColor: "var(--nt-border)",
                color: "var(--nt-text-primary)",
              }}
            >
              <HiDocumentText size={14} />
            </div>
            <div>
              <p className="text-xs font-semibold" style={{ color: "var(--nt-text-primary)" }}>Cover Letter Generator</p>
              <p className="text-[10px] font-mono" style={{ color: "var(--nt-text-muted)" }}>{job.jobTitle || job.job_title} · {job.companyName || job.company_name}</p>
            </div>
          </div>
          {!loading && (
            <button onClick={onClose} className="transition-colors" style={{ color: "var(--nt-text-muted)" }}>
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
                  <span key={i} className="h-2 w-2 rounded-full animate-bounce" style={{ backgroundColor: "var(--nt-accent-sage)", animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
              <p className="text-xs font-mono" style={{ color: "var(--nt-text-muted)" }}>Synthesizing personalized cover letter...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
              <p className="text-xs text-red-500 font-medium">{error}</p>
              <button
                onClick={generate}
                className="rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors"
                style={{
                  backgroundColor: "var(--nt-accent-gold)",
                  color: "var(--nt-btn-cta-text)",
                }}
              >
                Retry Generation
              </button>
            </div>
          ) : (
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              className="w-full h-80 text-xs font-mono leading-relaxed resize-none border rounded-md p-4 focus:outline-none"
              style={{
                backgroundColor: "var(--nt-bg-card-alt)",
                borderColor: "var(--nt-border)",
                color: "var(--nt-text-primary)",
              }}
            />
          )}
        </div>

        {/* Footer */}
        {!loading && !error && coverLetter && (
          <div
            className="flex items-center justify-between px-5 py-3 border-t flex-shrink-0"
            style={{
              backgroundColor: "var(--nt-bg-card-alt)",
              borderColor: "var(--nt-border)",
            }}
          >
            <button
              onClick={generate}
              className="text-xs transition-colors font-mono"
              style={{ color: "var(--nt-text-secondary)" }}
            >
              ↺ Regenerate
            </button>
            <button
              onClick={copy}
              className="inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors"
              style={{
                backgroundColor: "var(--nt-accent-gold)",
                color: "var(--nt-btn-cta-text)",
              }}
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
