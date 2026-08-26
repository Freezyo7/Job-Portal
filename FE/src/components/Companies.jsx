import React, { useMemo, useState, useEffect } from "react";
import { CiLocationOn, CiSearch } from "react-icons/ci";
import { BsBriefcase, BsBuilding } from "react-icons/bs";
import { HiArrowRight, HiCheck, HiX } from "react-icons/hi";
import api from "../lib/api";
import { getInitials } from "../lib/jobLogos";
import { normalizeJob, unwrapList } from "../lib/normalizeJob";
import CoverLetterModal from "./CoverLetterModal";


const ACCENT_COLORS = [
  "bg-[#eef2ff] text-[#4f46e5]",
  "bg-emerald-50 text-emerald-700",
  "bg-amber-50 text-amber-700",
  "bg-rose-50 text-rose-600",
  "bg-sky-50 text-sky-700",
  "bg-purple-50 text-purple-700",
  "bg-teal-50 text-teal-700",
];

const TYPE_COLORS = {
  "Full-time": "bg-emerald-50 text-emerald-700",
  "Contract":  "bg-amber-50 text-amber-700",
  "Part-time": "bg-sky-50 text-sky-700",
};

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
    // Send the user where they can actually apply, not just read the posting.
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
    // Grouping by company only makes sense over the full dataset, so walk
    // every page rather than showing companies derived from the first 20.
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
          // `next` is absolute and already carries the query string.
          params = undefined;
        }

        if (cancelled) return;
        const normalized = collected.map(normalizeJob);
        setJobs(normalized);
        setSelectedCompany(groupByCompany(normalized)[0] ?? null);
        setLoadError(normalized.length ? "" : "No jobs found. Run the scrapers to load listings.");
      } catch (err) {
        if (cancelled) return;
        // Fail visibly rather than falling back to fake companies.
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
    <div className="min-h-screen bg-gradient-to-br from-[#f3f4ff] via-[#f6f7ff] to-[#e9f0ff] px-4 py-6 md:px-8 lg:px-6 lg:py-5 text-slate-900">
      <div className="mx-auto max-w-6xl flex flex-col gap-6 lg:grid lg:grid-cols-[1fr,1.6fr]">

        {/* ── Left: Company List ── */}
        <div className="flex flex-col overflow-hidden rounded-3xl border-2 border-slate-200/80 bg-white/60 backdrop-blur-sm shadow-2xl shadow-slate-300/50">

          {/* Header */}
          <div className="px-5 pt-5 pb-4 border-b border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Companies</h2>
                <p className="text-xs font-light text-slate-400 mt-0.5">
                  {filtered.length} {filtered.length === 1 ? "company" : "companies"} · {jobs.length} total jobs
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-medium text-[#4f46e5]">
                <BsBuilding size={11} /> Browse
              </span>
            </div>
            <div className="relative">
              <CiSearch size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search companies..."
                className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white/80 text-xs text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/10 transition-all"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 max-h-[75vh]">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="flex gap-1.5">
                  {[0,1,2].map((i) => (
                    <span key={i} className="h-2 w-2 rounded-full bg-[#4f46e5] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            ) : loadError ? (
              <div className="flex flex-col items-center justify-center h-40 px-6 text-center text-slate-500">
                <HiX size={32} className="mb-2 text-red-400" />
                <p className="text-sm font-medium text-slate-700">{loadError}</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                <CiSearch size={32} className="mb-2 opacity-40" />
                <p className="text-sm">No companies found</p>
              </div>
            ) : (
              filtered.map((company, i) => {
                const active = selectedCompany?.name === company.name;
                const colorCls = ACCENT_COLORS[i % ACCENT_COLORS.length];
                return (
                  <button
                    key={company.name}
                    onClick={() => { setSelectedCompany(company); setSelectedJob(null); }}
                    className={`w-full flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all duration-200 ${
                      active
                        ? "border-[#4f46e5] bg-[#eef2ff] shadow-md"
                        : "border-slate-100 bg-white shadow-sm hover:border-[#4f46e5]/30 hover:shadow-md"
                    }`}
                  >
                    <CompanyLogo
                      logo={company.jobs[0]?.companyLogo}
                      name={company.name}
                      className="h-10 w-10 rounded-xl object-cover border border-slate-100 flex-shrink-0"
                      fallbackClassName={`h-10 w-10 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-bold ${colorCls}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{company.name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {company.jobs.length} {company.jobs.length === 1 ? "job" : "jobs"} posted
                      </p>
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                        <CiLocationOn size={11} />{company.jobs[0]?.jobGeo}
                      </span>
                    </div>
                    {active && <HiArrowRight size={14} className="text-[#4f46e5] flex-shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Right: Company Detail ── */}
        <div key={selectedCompany?.name} className="flex flex-col overflow-hidden rounded-3xl border-2 border-slate-200/80 bg-white/60 backdrop-blur-sm shadow-2xl shadow-slate-300/50">
          {selectedCompany ? (
            <>
              {/* Banner */}
              <div className="relative h-24 flex-shrink-0 bg-[linear-gradient(135deg,#03001e,#7303c0,#ec38bc,#fdeff9)]">
                <div className="absolute -bottom-6 left-6">
                  <CompanyLogo
                    logo={selectedCompany.jobs[0]?.companyLogo}
                    name={selectedCompany.name}
                    className="h-12 w-12 rounded-2xl border-4 border-white bg-white object-cover shadow-lg"
                    fallbackClassName={`h-12 w-12 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center text-sm font-bold ${
                      ACCENT_COLORS[companies.findIndex(c => c.name === selectedCompany.name) % ACCENT_COLORS.length]
                    }`}
                  />
                </div>
              </div>

              {/* Company info */}
              <div className="px-6 pt-9 pb-4 border-b border-slate-100">
                <h2 className="text-base font-semibold text-slate-900">{selectedCompany.name}</h2>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef2ff] px-2.5 py-1 text-[11px] font-medium text-[#4f46e5]">
                    <BsBriefcase size={10} />
                    {selectedCompany.jobs.length} open {selectedCompany.jobs.length === 1 ? "role" : "roles"}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                    <CiLocationOn size={13} />{selectedCompany.jobs[0]?.jobGeo}
                  </span>
                </div>
              </div>

              {/* Jobs list OR Job detail */}
              {selectedJob ? (
                <div className="flex-1 overflow-y-auto px-5 py-4">
                  <button
                    onClick={() => setSelectedJob(null)}
                    className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#4f46e5] hover:text-[#4338ca] mb-4"
                  >
                    <HiArrowRight size={12} className="rotate-180" /> Back to positions
                  </button>

                  {/* Job header card */}
                  <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm mb-3">
                    <div className="flex items-start gap-4 mb-4">
                      <CompanyLogo
                        logo={selectedJob.companyLogo}
                        name={selectedJob.companyName}
                        className="h-12 w-12 rounded-xl object-cover border border-slate-100 flex-shrink-0"
                        fallbackClassName={`h-12 w-12 rounded-xl flex-shrink-0 flex items-center justify-center text-sm font-bold ${ACCENT_COLORS[0]}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800">{selectedJob.jobTitle}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{selectedJob.companyName}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-50 rounded-full px-2.5 py-1">
                        <CiLocationOn size={12} />{selectedJob.jobGeo}
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${TYPE_COLORS[selectedJob.jobType] || "bg-slate-100 text-slate-600"}`}>
                        {selectedJob.jobType}
                      </span>
                      {selectedJob.domain && (
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${ACCENT_COLORS[0]}`}>
                          {selectedJob.domain}
                        </span>
                      )}
                      {selectedJob.jobLevel && (
                        <span className="rounded-full px-2.5 py-1 text-[11px] bg-slate-50 text-slate-500">
                          {selectedJob.jobLevel}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {selectedJob.postedDate && (
                        <span className="text-[11px] text-slate-400">Posted: {selectedJob.postedDate}</span>
                      )}
                      {selectedJob.applicants && (
                        <span className="text-[11px] text-slate-400">{selectedJob.applicants} applicants</span>
                      )}
                    </div>
                  </div>

                  {/* Full JD */}
                  {selectedJob.jobDescription && (
                    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm mb-3">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-3">Job Description</p>
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{selectedJob.jobDescription}</p>
                    </div>
                  )}

                  {/* Cover Letter + Apply buttons */}
                  <button
                    onClick={() => setCoverLetterJob(selectedJob)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#4f46e5] px-4 py-2 text-xs font-medium text-[#4f46e5] hover:bg-[#eef2ff] transition-colors mb-2"
                  >
                    ✉ Generate Cover Letter
                  </button>
                  <br />
                  {/* Apply button */}
                  <button
                    onClick={() => handleApplyClick(selectedJob)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#4f46e5] px-4 py-2 text-xs font-medium text-white hover:bg-[#4338ca] transition-colors shadow-sm mb-4"
                  >
                    Apply Now <HiArrowRight size={12} />
                  </button>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5 max-h-[calc(100vh-18rem)]">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-3">Open Positions</p>
                  {selectedCompany.jobs.map((job, i) => (
                    <div
                      key={job.id}
                      onClick={() => setSelectedJob(job)}
                      className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md hover:border-[#4f46e5]/20 transition-all duration-200 cursor-pointer"
                    >
                      <CompanyLogo
                        logo={job.companyLogo}
                        name={job.companyName}
                        className="h-10 w-10 rounded-xl object-cover border border-slate-100 flex-shrink-0"
                        fallbackClassName={`h-10 w-10 rounded-xl flex-shrink-0 flex items-center justify-center text-[11px] font-bold ${
                          ACCENT_COLORS[i % ACCENT_COLORS.length]
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{job.jobTitle}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                            <CiLocationOn size={12} />{job.jobGeo}
                          </span>
                          {job.domain && (
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${ACCENT_COLORS[i % ACCENT_COLORS.length]}`}>
                              {job.domain}
                            </span>
                          )}
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${TYPE_COLORS[job.jobType] || "bg-slate-100 text-slate-600"}`}>
                            {job.jobType}
                          </span>
                        </div>
                      </div>
                      <HiArrowRight size={14} className="text-slate-300 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
              <div className="h-16 w-16 rounded-2xl bg-[#eef2ff] flex items-center justify-center">
                <BsBuilding size={28} className="text-[#4f46e5] opacity-50" />
              </div>
              <p className="text-sm font-medium text-slate-500">Select a company to view roles</p>
            </div>
          )}
        </div>

      </div>
      {/* ── Confirmation Modal ── */}
      {pendingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={applyStatus === "loading" ? undefined : closeModal} />
          <div className="relative w-full max-w-sm rounded-3xl border-2 border-slate-200/80 bg-white shadow-2xl shadow-slate-300/50 overflow-hidden">
            <div className="h-1.5 w-full bg-[linear-gradient(135deg,#03001e,#7303c0,#ec38bc,#fdeff9)]" />
            <div className="p-6">
              {applyStatus !== "loading" && (
                <button onClick={closeModal} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors">
                  <HiX size={18} />
                </button>
              )}
              <div className="flex items-center gap-3 mb-5">
                <CompanyLogo
                  logo={pendingJob.companyLogo}
                  name={pendingJob.companyName}
                  className="h-11 w-11 rounded-xl object-cover border border-slate-100 flex-shrink-0"
                  fallbackClassName="h-11 w-11 rounded-xl flex-shrink-0 flex items-center justify-center text-sm font-bold bg-[#eef2ff] text-[#4f46e5]"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{pendingJob.jobTitle}</p>
                  <p className="text-xs text-slate-500 truncate">{pendingJob.companyName}</p>
                </div>
              </div>

              {!applyStatus && (
                <>
                  <p className="text-sm font-medium text-slate-800 mb-1">Did you complete your application?</p>
                  <p className="text-xs text-slate-400 mb-5 leading-relaxed">We opened the job page in a new tab. Let us know if you submitted so we can track it for you.</p>
                  <div className="flex gap-3">
                    <button onClick={handleConfirmApply} className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-[#4f46e5] py-2.5 text-sm font-medium text-white hover:bg-[#4338ca] transition-colors shadow-sm">
                      <HiCheck size={15} /> Yes, I Applied
                    </button>
                    <button onClick={closeModal} className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 py-2.5 text-sm font-medium text-slate-600 hover:bg-white transition-colors">
                      Not Yet
                    </button>
                  </div>
                </>
              )}

              {applyStatus === "loading" && (
                <div className="flex flex-col items-center py-4 gap-3">
                  <div className="flex gap-1.5">
                    {[0,1,2].map((i) => <span key={i} className="h-2 w-2 rounded-full bg-[#4f46e5] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                  </div>
                  <p className="text-xs text-slate-400">Saving your application...</p>
                </div>
              )}

              {applyStatus === "success" && (
                <div className="flex flex-col items-center py-4 gap-3 text-center">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                    <HiCheck size={24} className="text-emerald-500" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">Application Tracked!</p>
                  <p className="text-xs text-slate-400">Added to your applications. Good luck! 🎉</p>
                  <button onClick={closeModal} className="mt-1 rounded-2xl bg-[#4f46e5] px-6 py-2 text-xs font-medium text-white hover:bg-[#4338ca] transition-colors">Done</button>
                </div>
              )}

              {applyStatus === "duplicate" && (
                <div className="flex flex-col items-center py-4 gap-3 text-center">
                  <div className="h-12 w-12 rounded-2xl bg-[#eef2ff] flex items-center justify-center">
                    <HiCheck size={24} className="text-[#4f46e5]" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">Already Tracked</p>
                  <p className="text-xs text-slate-400">You've already applied to this job.</p>
                  <button onClick={closeModal} className="mt-1 rounded-2xl bg-slate-100 px-6 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors">Got it</button>
                </div>
              )}

              {applyStatus === "error" && (
                <div className="flex flex-col items-center py-4 gap-3 text-center">
                  <div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center">
                    <HiX size={24} className="text-red-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">Couldn't Save</p>
                  <p className="text-xs text-slate-400">Something went wrong. Please try again.</p>
                  <button onClick={closeModal} className="mt-1 rounded-2xl bg-slate-100 px-6 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors">Close</button>
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
