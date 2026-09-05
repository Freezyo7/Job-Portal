import React, { useMemo, useState, useEffect } from "react";
import { CiLocationOn, CiSearch } from "react-icons/ci";
import { BsBriefcase, BsBuilding } from "react-icons/bs";
import { HiArrowRight, HiCheck, HiX } from "react-icons/hi";
import api from "../lib/api";
import { getInitials } from "../lib/jobLogos";
import { normalizeJob, unwrapList } from "../lib/normalizeJob";
import CoverLetterModal from "./CoverLetterModal";

const groupByCompany = (jobs) => {
  const map = new Map();
  jobs.forEach((job) => {
    const name = job.companyName;
    if (!map.has(name)) map.set(name, { name, jobs: [] });
    map.get(name).jobs.push(job);
  });
  return Array.from(map.values()).sort((a, b) => b.jobs.length - a.jobs.length);
};

const CompanyLogo = ({ logo, name, className, fallbackClassName, style, fallbackStyle }) => {
  const [failedLogo, setFailedLogo] = useState("");

  useEffect(() => { setFailedLogo(""); }, [logo]);

  if (logo && failedLogo !== logo) {
    return (
      <img
        src={logo}
        alt={name}
        loading="lazy"
        decoding="async"
        onError={() => setFailedLogo(logo)}
        className={className}
        style={style}
      />
    );
  }

  return (
    <div className={fallbackClassName} style={fallbackStyle}>
      {getInitials(name)}
    </div>
  );
};

const Companies = () => {
  const [jobs, setJobs]                   = useState([]);
  const [loading, setLoading]             = useState(true);
  const [loadError, setLoadError]         = useState("");
  const [search, setSearch]               = useState("");
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedJob, setSelectedJob]     = useState(null);
  const [pendingJob, setPendingJob]       = useState(null);
  const [applyStatus, setApplyStatus]     = useState(null);
  const [coverLetterJob, setCoverLetterJob] = useState(null);

  const handleApplyClick = (job) => {
    window.open(job.applyUrl, "_blank", "noopener,noreferrer");
    setPendingJob(job);
    setApplyStatus(null);
  };

  const handleConfirmApply = async () => {
    if (!pendingJob) return;
    setApplyStatus("loading");
    try {
      const res = await api.post("/applications/", { job_id: pendingJob.id });
      setApplyStatus(res.data.already_applied ? "duplicate" : "success");
    } catch (err) {
      setApplyStatus(err.response?.status === 401 ? "success" : "error");
    }
  };

  const closeModal = () => { setPendingJob(null); setApplyStatus(null); };

  useEffect(() => {
    let cancelled = false;

    const fetchAllJobs = async () => {
      try {
        const collected = [];
        let url = "/jobs/";
        let params = { page_size: 100 };

        while (url) {
          const res = await api.get(url, { params });
          collected.push(...unwrapList(res.data));
          url = res.data?.next ?? null;
          params = undefined;
        }

        if (cancelled) return;
        const normalized = collected.map(normalizeJob);
        setJobs(normalized);
        setSelectedCompany(groupByCompany(normalized)[0] ?? null);
        setLoadError(normalized.length ? "" : "No jobs found. Run the scrapers to load listings.");
      } catch (err) {
        if (cancelled) return;
        setJobs([]);
        setSelectedCompany(null);
        setLoadError(
          err.response?.status === 401
            ? "Your session expired. Please log in again."
            : "Could not load jobs. Is the Django server running on port 8000?"
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAllJobs();
    return () => { cancelled = true; };
  }, []);

  const companies = useMemo(() => groupByCompany(jobs), [jobs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? companies.filter((c) => c.name.toLowerCase().includes(q)) : companies;
  }, [companies, search]);

  return (
    <div className="min-h-screen px-4 py-6 md:px-6 lg:px-8 transition-colors" style={{ backgroundColor: "var(--nt-bg-primary)", color: "var(--nt-text-primary)" }}>
      <div className="mx-auto max-w-7xl flex flex-col gap-5 lg:grid lg:grid-cols-[1fr,1.4fr]">

        {/* ── Left: Company List ── */}
        <div
          className="flex flex-col overflow-hidden rounded-lg border"
          style={{
            backgroundColor: "var(--nt-bg-card)",
            borderColor: "var(--nt-border)",
            boxShadow: "var(--nt-shadow-sm)",
          }}
        >

          {/* Header */}
          <div className="p-4 border-b" style={{ borderColor: "var(--nt-border)" }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-bold tracking-tight" style={{ color: "var(--nt-text-primary)" }}>Companies Index</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--nt-text-secondary)" }}>
                  {filtered.length} {filtered.length === 1 ? "organization" : "organizations"} · {jobs.length} total active roles
                </p>
              </div>
              <span
                className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-mono font-medium"
                style={{
                  backgroundColor: "var(--nt-bg-secondary)",
                  borderColor: "var(--nt-border)",
                  color: "var(--nt-text-primary)",
                }}
              >
                <BsBuilding size={11} /> Index
              </span>
            </div>
            <div className="relative">
              <CiSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--nt-text-muted)" }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search organizations..."
                className="w-full pl-8 pr-3 py-2 rounded-md border text-xs focus:outline-none transition-colors"
                style={{
                  backgroundColor: "var(--nt-bg-card-alt)",
                  borderColor: "var(--nt-border)",
                  color: "var(--nt-text-primary)",
                }}
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5 max-h-[75vh]">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="flex gap-1.5">
                  {[0,1,2].map((i) => (
                    <span key={i} className="h-2 w-2 rounded-full animate-bounce" style={{ backgroundColor: "var(--nt-accent-sage)", animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            ) : loadError ? (
              <div className="flex flex-col items-center justify-center h-40 px-6 text-center" style={{ color: "var(--nt-text-muted)" }}>
                <HiX size={28} className="mb-2 text-red-500" />
                <p className="text-xs">{loadError}</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40" style={{ color: "var(--nt-text-muted)" }}>
                <CiSearch size={32} className="mb-2 opacity-40" />
                <p className="text-xs font-semibold">No companies found</p>
              </div>
            ) : (
              filtered.map((company) => {
                const active = selectedCompany?.name === company.name;
                return (
                  <button
                    key={company.name}
                    onClick={() => { setSelectedCompany(company); setSelectedJob(null); }}
                    className="w-full flex items-center gap-3 rounded-md border p-3 text-left transition-colors"
                    style={
                      active
                        ? {
                            backgroundColor: "var(--nt-bg-card-alt)",
                            borderColor: "var(--nt-accent-sage)",
                            borderLeftWidth: "3px",
                          }
                        : {
                            backgroundColor: "var(--nt-bg-card)",
                            borderColor: "var(--nt-border)",
                          }
                    }
                  >
                    <CompanyLogo
                      logo={company.jobs[0]?.companyLogo}
                      name={company.name}
                      className="h-9 w-9 rounded-md object-cover border flex-shrink-0"
                      style={{ borderColor: "var(--nt-border)" }}
                      fallbackClassName="h-9 w-9 rounded-md flex-shrink-0 flex items-center justify-center text-xs font-mono font-bold border"
                      fallbackStyle={{
                        backgroundColor: "var(--nt-bg-card-alt)",
                        borderColor: "var(--nt-border)",
                        color: "var(--nt-text-primary)",
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: "var(--nt-text-primary)" }}>{company.name}</p>
                      <p className="text-[11px] font-mono mt-0.5" style={{ color: "var(--nt-text-muted)" }}>
                        {company.jobs.length} {company.jobs.length === 1 ? "position" : "positions"}
                      </p>
                      <span className="inline-flex items-center gap-1 text-[10px] mt-0.5" style={{ color: "var(--nt-text-secondary)" }}>
                        <CiLocationOn size={11} />{company.jobs[0]?.jobGeo}
                      </span>
                    </div>
                    {active && <HiArrowRight size={13} style={{ color: "var(--nt-accent-sage)" }} className="flex-shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Right: Company Detail ── */}
        <div
          key={selectedCompany?.name}
          className="flex flex-col overflow-hidden rounded-lg border"
          style={{
            backgroundColor: "var(--nt-bg-card)",
            borderColor: "var(--nt-border)",
            boxShadow: "var(--nt-shadow-sm)",
          }}
        >
          {selectedCompany ? (
            <>
              {/* Banner */}
              <div
                className="relative h-20 flex-shrink-0 border-b"
                style={{
                  backgroundColor: "var(--nt-bg-secondary)",
                  borderColor: "var(--nt-border)",
                }}
              >
                <div className="absolute -bottom-5 left-5">
                  <CompanyLogo
                    logo={selectedCompany.jobs[0]?.companyLogo}
                    name={selectedCompany.name}
                    className="h-11 w-11 rounded-md border-2 object-cover shadow-sm"
                    style={{ borderColor: "var(--nt-border)", backgroundColor: "var(--nt-bg-card)" }}
                    fallbackClassName="h-11 w-11 rounded-md border-2 shadow-sm flex items-center justify-center font-mono text-xs font-bold"
                    fallbackStyle={{
                      backgroundColor: "var(--nt-bg-card-alt)",
                      borderColor: "var(--nt-border)",
                      color: "var(--nt-text-primary)",
                    }}
                  />
                </div>
              </div>

              {/* Company info */}
              <div className="px-5 pt-8 pb-3.5 border-b" style={{ borderColor: "var(--nt-border)" }}>
                <h2 className="text-base font-bold" style={{ color: "var(--nt-text-primary)" }}>{selectedCompany.name}</h2>
                <div className="flex items-center gap-2 mt-2 flex-wrap font-mono text-[10px]">
                  <span
                    className="inline-flex items-center gap-1 rounded border px-2 py-0.5 font-semibold"
                    style={{
                      backgroundColor: "rgba(111, 175, 123, 0.15)",
                      borderColor: "rgba(111, 175, 123, 0.3)",
                      color: "var(--nt-accent-sage)",
                    }}
                  >
                    <BsBriefcase size={10} />
                    {selectedCompany.jobs.length} open {selectedCompany.jobs.length === 1 ? "role" : "roles"}
                  </span>
                  <span className="inline-flex items-center gap-1" style={{ color: "var(--nt-text-muted)" }}>
                    <CiLocationOn size={12} />{selectedCompany.jobs[0]?.jobGeo}
                  </span>
                </div>
              </div>

              {/* Jobs list OR Job detail */}
              {selectedJob ? (
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  <button
                    onClick={() => setSelectedJob(null)}
                    className="inline-flex items-center gap-1.5 text-xs font-mono hover:underline"
                    style={{ color: "var(--nt-accent-sage)" }}
                  >
                    <HiArrowRight size={12} className="rotate-180" /> Back to open roles
                  </button>

                  <div
                    className="rounded-md border p-4"
                    style={{
                      backgroundColor: "var(--nt-bg-card-alt)",
                      borderColor: "var(--nt-border)",
                    }}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold" style={{ color: "var(--nt-text-primary)" }}>{selectedJob.jobTitle}</h3>
                        <p className="text-xs" style={{ color: "var(--nt-text-secondary)" }}>{selectedJob.companyName}</p>
                      </div>
                    </div>
                    {selectedJob.jobDescription && (
                      <div
                        className="text-xs leading-relaxed max-w-none mb-4"
                        style={{ color: "var(--nt-text-primary)" }}
                        dangerouslySetInnerHTML={{ __html: selectedJob.jobDescription }}
                      />
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCoverLetterJob(selectedJob)}
                        className="flex-1 rounded-md border py-2 text-xs font-medium transition-colors"
                        style={{
                          backgroundColor: "var(--nt-btn-sec-bg)",
                          borderColor: "var(--nt-border)",
                          color: "var(--nt-text-primary)",
                        }}
                      >
                        ✉ Cover Letter
                      </button>
                      <button
                        onClick={() => handleApplyClick(selectedJob)}
                        className="flex-1 rounded-md py-2 text-xs font-medium transition-colors"
                        style={{
                          backgroundColor: "var(--nt-accent-gold)",
                          color: "var(--nt-btn-cta-text)",
                        }}
                      >
                        Apply Now
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[calc(100vh-16rem)]">
                  <h3 className="text-[11px] font-mono uppercase font-semibold px-1 mb-2" style={{ color: "var(--nt-text-muted)" }}>
                    Active Openings ({selectedCompany.jobs.length})
                  </h3>
                  {selectedCompany.jobs.map((job) => (
                    <div
                      key={job.id}
                      onClick={() => setSelectedJob(job)}
                      className="flex items-center justify-between rounded-md border p-3 cursor-pointer transition-colors"
                      style={{
                        backgroundColor: "var(--nt-bg-card-alt)",
                        borderColor: "var(--nt-border)",
                      }}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate" style={{ color: "var(--nt-text-primary)" }}>{job.jobTitle}</p>
                        <div className="flex items-center gap-2 mt-1 font-mono text-[10px]" style={{ color: "var(--nt-text-muted)" }}>
                          <span>{job.jobGeo}</span>
                          <span>·</span>
                          <span>{job.jobType}</span>
                          {job.isRemote && <span style={{ color: "var(--nt-accent-sage)" }}>· Remote</span>}
                        </div>
                      </div>
                      <HiArrowRight size={13} style={{ color: "var(--nt-accent-sage)" }} className="flex-shrink-0 ml-2" />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-2 py-16" style={{ color: "var(--nt-text-muted)" }}>
              <div
                className="h-12 w-12 rounded-md border flex items-center justify-center"
                style={{
                  backgroundColor: "var(--nt-bg-card-alt)",
                  borderColor: "var(--nt-border)",
                }}
              >
                <BsBuilding size={20} style={{ color: "var(--nt-text-muted)" }} />
              </div>
              <p className="text-xs font-medium" style={{ color: "var(--nt-text-secondary)" }}>Select an organization to inspect active roles</p>
            </div>
          )}
        </div>

      </div>

      {/* Confirmation modal */}
      {pendingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={applyStatus === "loading" ? undefined : closeModal} />
          <div
            className="relative w-full max-w-sm rounded-lg border shadow-xl p-5"
            style={{
              backgroundColor: "var(--nt-bg-card)",
              borderColor: "var(--nt-border)",
            }}
          >
            {applyStatus !== "loading" && (
              <button onClick={closeModal} className="absolute top-4 right-4" style={{ color: "var(--nt-text-muted)" }}>
                <HiX size={16} />
              </button>
            )}
            <p className="text-xs font-semibold mb-1" style={{ color: "var(--nt-text-primary)" }}>Confirm Application</p>
            <p className="text-xs mb-4" style={{ color: "var(--nt-text-secondary)" }}>Did you complete submission on {pendingJob.companyName}?</p>
            <div className="flex gap-2">
              <button
                onClick={handleConfirmApply}
                className="flex-1 rounded-md py-2 text-xs font-medium transition-colors"
                style={{
                  backgroundColor: "var(--nt-accent-gold)",
                  color: "var(--nt-btn-cta-text)",
                }}
              >
                Yes, I Applied
              </button>
              <button
                onClick={closeModal}
                className="flex-1 rounded-md border py-2 text-xs font-medium transition-colors"
                style={{
                  backgroundColor: "var(--nt-btn-sec-bg)",
                  borderColor: "var(--nt-border)",
                  color: "var(--nt-text-primary)",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cover Letter Modal */}
      {coverLetterJob && (
        <CoverLetterModal job={coverLetterJob} onClose={() => setCoverLetterJob(null)} />
      )}
    </div>
  );
};

export default Companies;
