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

const CompanyLogo = ({ logo, name, className, fallbackClassName }) => {
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
      />
    );
  }

  return (
    <div className={fallbackClassName}>
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
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#09090B] px-4 py-6 md:px-6 lg:px-8 text-zinc-900 dark:text-zinc-100 transition-colors">
      <div className="mx-auto max-w-7xl flex flex-col gap-5 lg:grid lg:grid-cols-[1fr,1.4fr]">

        {/* ── Left: Company List ── */}
        <div className="flex flex-col overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">

          {/* Header */}
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Companies Index</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {filtered.length} {filtered.length === 1 ? "organization" : "organizations"} · {jobs.length} total active roles
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 px-2.5 py-1 text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300">
                <BsBuilding size={11} /> Index
              </span>
            </div>
            <div className="relative">
              <CiSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search organizations..."
                className="w-full pl-8 pr-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5 max-h-[75vh]">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="flex gap-1.5">
                  {[0,1,2].map((i) => (
                    <span key={i} className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            ) : loadError ? (
              <div className="flex flex-col items-center justify-center h-40 px-6 text-center text-zinc-500 dark:text-zinc-400">
                <HiX size={28} className="mb-2 text-red-500" />
                <p className="text-xs">{loadError}</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-zinc-400 dark:text-zinc-500">
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
                    className={`w-full flex items-center gap-3 rounded-md border p-3 text-left transition-colors ${
                      active
                        ? "border-emerald-500/60 bg-emerald-500/5 dark:bg-emerald-500/10"
                        : "border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700"
                    }`}
                  >
                    <CompanyLogo
                      logo={company.jobs[0]?.companyLogo}
                      name={company.name}
                      className="h-9 w-9 rounded-md object-cover border border-zinc-200 dark:border-zinc-800 flex-shrink-0"
                      fallbackClassName="h-9 w-9 rounded-md flex-shrink-0 flex items-center justify-center text-xs font-mono font-bold bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">{company.name}</p>
                      <p className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 mt-0.5">
                        {company.jobs.length} {company.jobs.length === 1 ? "position" : "positions"}
                      </p>
                      <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        <CiLocationOn size={11} />{company.jobs[0]?.jobGeo}
                      </span>
                    </div>
                    {active && <HiArrowRight size={13} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Right: Company Detail ── */}
        <div key={selectedCompany?.name} className="flex flex-col overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          {selectedCompany ? (
            <>
              {/* Banner */}
              <div className="relative h-20 flex-shrink-0 bg-zinc-900 dark:bg-zinc-950 border-b border-zinc-800">
                <div className="absolute -bottom-5 left-5">
                  <CompanyLogo
                    logo={selectedCompany.jobs[0]?.companyLogo}
                    name={selectedCompany.name}
                    className="h-11 w-11 rounded-md border-2 border-white dark:border-zinc-900 bg-white dark:bg-zinc-900 object-cover shadow-sm"
                    fallbackClassName="h-11 w-11 rounded-md border-2 border-white dark:border-zinc-900 bg-zinc-800 text-zinc-100 shadow-sm flex items-center justify-center font-mono text-xs font-bold"
                  />
                </div>
              </div>

              {/* Company info */}
              <div className="px-5 pt-8 pb-3.5 border-b border-zinc-200 dark:border-zinc-800">
                <h2 className="text-base font-bold text-zinc-950 dark:text-zinc-50">{selectedCompany.name}</h2>
                <div className="flex items-center gap-2 mt-2 flex-wrap font-mono text-[10px]">
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 font-semibold text-emerald-600 dark:text-emerald-400">
                    <BsBriefcase size={10} />
                    {selectedCompany.jobs.length} open {selectedCompany.jobs.length === 1 ? "role" : "roles"}
                  </span>
                  <span className="inline-flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
                    <CiLocationOn size={12} />{selectedCompany.jobs[0]?.jobGeo}
                  </span>
                </div>
              </div>

              {/* Jobs list OR Job detail */}
              {selectedJob ? (
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  <button
                    onClick={() => setSelectedJob(null)}
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    <HiArrowRight size={12} className="rotate-180" /> Back to open roles
                  </button>

                  <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <CompanyLogo
                        logo={selectedJob.companyLogo}
                        name={selectedJob.companyName}
                        className="h-10 w-10 rounded-md object-cover border border-zinc-200 dark:border-zinc-800 flex-shrink-0"
                        fallbackClassName="h-10 w-10 rounded-md flex-shrink-0 flex items-center justify-center font-mono text-xs font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-zinc-950 dark:text-zinc-50">{selectedJob.jobTitle}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{selectedJob.companyName}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3 font-mono text-[10px]">
                      <span className="inline-flex items-center gap-1 text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded px-2 py-0.5 border border-zinc-200 dark:border-zinc-700/60">
                        <CiLocationOn size={11} />{selectedJob.jobGeo}
                      </span>
                      <span className="rounded px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/60">
                        {selectedJob.jobType}
                      </span>
                      {selectedJob.domain && (
                        <span className="rounded px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/60">
                          {selectedJob.domain}
                        </span>
                      )}
                      {selectedJob.jobLevel && (
                        <span className="rounded px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/60">
                          {selectedJob.jobLevel}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
                      {selectedJob.postedDate && (
                        <span>Posted: {selectedJob.postedDate}</span>
                      )}
                      {selectedJob.applicants && (
                        <span>{selectedJob.applicants} applicants</span>
                      )}
                    </div>
                  </div>

                  {selectedJob.jobDescription && (
                    <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 p-4">
                      <p className="text-[11px] font-mono uppercase font-semibold text-zinc-500 dark:text-zinc-400 mb-2">Job Description</p>
                      <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">{selectedJob.jobDescription}</p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <button
                      onClick={() => setCoverLetterJob(selectedJob)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 py-2.5 text-xs font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      ✉ Generate Cover Letter
                    </button>
                    <button
                      onClick={() => handleApplyClick(selectedJob)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-md bg-emerald-600 dark:bg-emerald-500 py-2.5 text-xs font-medium text-white hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors"
                    >
                      Apply Now <HiArrowRight size={13} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[calc(100vh-18rem)]">
                  <p className="text-[11px] font-mono uppercase font-semibold text-zinc-500 dark:text-zinc-400 mb-1">Open Positions</p>
                  {selectedCompany.jobs.map((job) => (
                    <div
                      key={job.id}
                      onClick={() => setSelectedJob(job)}
                      className="flex items-center gap-3 rounded-md border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors cursor-pointer"
                    >
                      <CompanyLogo
                        logo={job.companyLogo}
                        name={job.companyName}
                        className="h-9 w-9 rounded-md object-cover border border-zinc-200 dark:border-zinc-800 flex-shrink-0"
                        fallbackClassName="h-9 w-9 rounded-md flex-shrink-0 flex items-center justify-center font-mono text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">{job.jobTitle}</p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap font-mono text-[10px]">
                          <span className="inline-flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
                            <CiLocationOn size={11} />{job.jobGeo}
                          </span>
                          {job.domain && (
                            <span className="rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 px-1.5 py-0.5 text-zinc-600 dark:text-zinc-400">
                              {job.domain}
                            </span>
                          )}
                          <span className="rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 px-1.5 py-0.5 text-zinc-600 dark:text-zinc-400">
                            {job.jobType}
                          </span>
                        </div>
                      </div>
                      <HiArrowRight size={13} className="text-zinc-400 dark:text-zinc-600 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400 dark:text-zinc-500 gap-2 py-16">
              <div className="h-12 w-12 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center">
                <BsBuilding size={20} className="text-zinc-400" />
              </div>
              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Select an organization to view roles</p>
            </div>
          )}
        </div>

      </div>

      {/* ── Confirmation Modal ── */}
      {pendingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={applyStatus === "loading" ? undefined : closeModal} />
          <div className="relative w-full max-w-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden">
            <div className="p-5">
              {applyStatus !== "loading" && (
                <button onClick={closeModal} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
                  <HiX size={16} />
                </button>
              )}
              <div className="flex items-center gap-3 mb-4">
                <CompanyLogo
                  logo={pendingJob.companyLogo}
                  name={pendingJob.companyName}
                  className="h-9 w-9 rounded-md object-cover border border-zinc-200 dark:border-zinc-800 flex-shrink-0"
                  fallbackClassName="h-9 w-9 rounded-md flex-shrink-0 flex items-center justify-center font-mono text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">{pendingJob.jobTitle}</p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{pendingJob.companyName}</p>
                </div>
              </div>

              {!applyStatus && (
                <>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Confirm Application Status</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">We opened the external portal. Confirm if you completed submission to track this job.</p>
                  <div className="flex gap-2">
                    <button onClick={handleConfirmApply} className="flex-1 flex items-center justify-center gap-1.5 rounded-md bg-emerald-600 dark:bg-emerald-500 py-2 text-xs font-medium text-white hover:bg-emerald-700 transition-colors">
                      <HiCheck size={13} /> Yes, I Applied
                    </button>
                    <button onClick={closeModal} className="flex-1 rounded-md border border-zinc-200 dark:border-zinc-800 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                      Not Yet
                    </button>
                  </div>
                </>
              )}

              {applyStatus === "loading" && (
                <div className="flex flex-col items-center py-4 gap-2.5">
                  <div className="flex gap-1.5">
                    {[0,1,2].map((i) => <span key={i} className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                  </div>
                  <p className="text-xs text-zinc-400 font-mono">Syncing application...</p>
                </div>
              )}

              {applyStatus === "success" && (
                <div className="flex flex-col items-center py-3 gap-2.5 text-center">
                  <div className="h-10 w-10 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <HiCheck size={20} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Application Tracked!</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Added to your applications. Good luck!</p>
                  <button onClick={closeModal} className="mt-1 rounded-md bg-emerald-600 dark:bg-emerald-500 px-5 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition-colors">Done</button>
                </div>
              )}

              {applyStatus === "duplicate" && (
                <div className="flex flex-col items-center py-3 gap-2.5 text-center">
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Already Tracked</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">You've already applied to this job.</p>
                  <button onClick={closeModal} className="mt-1 rounded-md border border-zinc-200 dark:border-zinc-800 px-5 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">Got it</button>
                </div>
              )}

              {applyStatus === "error" && (
                <div className="flex flex-col items-center py-3 gap-2.5 text-center">
                  <p className="text-xs font-semibold text-red-500">Failed to Save</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Something went wrong. Please try again.</p>
                  <button onClick={closeModal} className="mt-1 rounded-md border border-zinc-200 dark:border-zinc-800 px-5 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">Close</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Cover Letter Modal ── */}
      {coverLetterJob && (
        <CoverLetterModal job={coverLetterJob} onClose={() => setCoverLetterJob(null)} />
      )}
    </div>
  );
};

export default Companies;


