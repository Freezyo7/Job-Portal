import React, { useEffect, useState } from "react";
import { CiLocationOn, CiCalendarDate, CiSearch } from "react-icons/ci";
import { BsBriefcase, BsPeople, BsClock } from "react-icons/bs";
import { HiArrowRight, HiCheck, HiX } from "react-icons/hi";
import api from "../lib/api";
import CoverLetterModal from "./CoverLetterModal";
import { getInitials } from "../lib/jobLogos";
import { normalizeJob, unwrapList, sourceLabel } from "../lib/normalizeJob";
import { timeAgo } from "../lib/timeAgo";

// Stable per-source color instead of the round-robin tagColors used for
// job-type chips — so the same platform always reads the same color.
const sourceColors = {
  naukri: "bg-sky-50 text-sky-700",
  foundit: "bg-violet-50 text-violet-700",
  hirist: "bg-rose-50 text-rose-600",
  unstop: "bg-amber-50 text-amber-700",
  linkedin: "bg-blue-50 text-blue-700",
  instahyre: "bg-emerald-50 text-emerald-700",
  indeed: "bg-indigo-50 text-indigo-700",
};
const sourceColor = (source) => sourceColors[source] || "bg-slate-100 text-slate-600";


const tagColors = [
  "bg-[#eef2ff] text-[#4f46e5]",
  "bg-emerald-50 text-emerald-700",
  "bg-amber-50 text-amber-700",
  "bg-rose-50 text-rose-600",
  "bg-sky-50 text-sky-700",
];

const LogoOrInitials = ({ logo, name, size = "h-12 w-12" }) => {
  const [failedLogo, setFailedLogo] = useState("");

  if (logo && failedLogo !== logo) {
    return (
      <img
        src={logo}
        alt={name}
        loading="lazy"
        decoding="async"
        onError={() => setFailedLogo(logo)}
        className={`${size} rounded-2xl object-cover border border-slate-100 flex-shrink-0`}
      />
    );
  }
  return (
    <div className={`${size} rounded-2xl bg-[#eef2ff] flex items-center justify-center text-[#4f46e5] font-bold text-sm flex-shrink-0`}>
      {getInitials(name)}
    </div>
  );
};

const DetailChip = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef2ff] text-[#4f46e5] flex-shrink-0">
      {icon}
    </span>
    <div>
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className="text-xs font-semibold text-slate-800">{value}</p>
    </div>
  </div>
);

const FindJobs = () => {
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading]         = useState(true);
  const [loadError, setLoadError]     = useState("");
  // Server-side pagination: total across the whole DB, plus the URL of the
  // next page (null when we've loaded everything).
  const [totalCount, setTotalCount]   = useState(0);
  const [nextUrl, setNextUrl]         = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  // Confirmation modal state
  const [pendingJob, setPendingJob]   = useState(null);
  const [applyStatus, setApplyStatus] = useState(null);
  const [coverLetterJob, setCoverLetterJob] = useState(null);

  // Source pills + live counts. { total, by_source: {naukri: 113, ...}, fetched_today }
  const [stats, setStats] = useState(null);
  const [sourceFilter, setSourceFilter]         = useState("");    // "" = All
  const [remoteOnly, setRemoteOnly]             = useState(false);
  const [fetchedTodayOnly, setFetchedTodayOnly] = useState(false);

  // Counts are DB-wide and don't depend on the currently active filters —
  // fetched once, same pattern as any other "unread counts" style badge.
  useEffect(() => {
    api.get("/jobs/stats/")
      .then((res) => setStats(res.data))
      .catch(() => setStats(null));
  }, []);

  // Opens the external URL then shows the confirmation modal
  const handleApplyClick = (job) => {
    // Send the user where they can actually apply, not just read the posting.
    window.open(job.applyUrl, "_blank", "noopener,noreferrer");
    setPendingJob(job);
    setApplyStatus(null);
  };

  // User confirms they applied — record it against the Django Application model
  const handleConfirmApply = async () => {
    if (!pendingJob) return;
    setApplyStatus("loading");
    try {
      const res = await api.post("/applications/", { job_id: pendingJob.id });
      setApplyStatus(res.data.already_applied ? "duplicate" : "success");
    } catch (err) {
      // 401 = not logged in, still show success-like message for demo
      setApplyStatus(err.response?.status === 401 ? "success" : "error");
    }
  };

  const closeModal = () => {
    setPendingJob(null);
    setApplyStatus(null);
  };

  // Search runs on the server so it covers every job in the database, not
  // just the page already loaded. Debounced so typing doesn't fire a request
  // per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (sourceFilter) params.source = sourceFilter;
      if (remoteOnly) params.is_remote = true;
      if (fetchedTodayOnly) params.fetched_today = true;

      api.get("/jobs/", { params })
        .then((res) => {
          const jobs = unwrapList(res.data).map(normalizeJob);
          setFilteredJobs(jobs);
          setSelectedJob(jobs[0] ?? null);
          setTotalCount(res.data?.count ?? jobs.length);
          setNextUrl(res.data?.next ?? null);
          setLoadError(
            jobs.length
              ? ""
              : searchQuery.trim() || sourceFilter || remoteOnly || fetchedTodayOnly
                ? ""
                : "No jobs found. Run the scrapers to load listings."
          );
        })
        .catch((err) => {
          // Surface the failure instead of silently showing demo data — a
          // fallback here once disguised "not logged in" as "here are jobs".
          setFilteredJobs([]);
          setSelectedJob(null);
          setTotalCount(0);
          setNextUrl(null);
          setLoadError(
            err.response?.status === 401
              ? "Your session expired. Please log in again."
              : "Could not load jobs. Is the Django server running on port 8000?"
          );
        })
        .finally(() => setLoading(false));
    }, searchQuery ? 350 : 0);

    return () => clearTimeout(timer);
  }, [searchQuery, sourceFilter, remoteOnly, fetchedTodayOnly]);

  const handleLoadMore = () => {
    if (!nextUrl || loadingMore) return;
    setLoadingMore(true);
    // `next` is an absolute URL from DRF; axios' baseURL is ignored for those.
    api.get(nextUrl)
      .then((res) => {
        setFilteredJobs((prev) => [...prev, ...unwrapList(res.data).map(normalizeJob)]);
        setNextUrl(res.data?.next ?? null);
      })
      .catch(() => setLoadError("Could not load more jobs."))
      .finally(() => setLoadingMore(false));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f3f4ff] via-[#f6f7ff] to-[#e9f0ff] px-4 py-6 md:px-8 lg:px-6 lg:py-5 text-slate-900">
      <div className="mx-auto max-w-6xl flex flex-col gap-6 lg:grid lg:grid-cols-[1fr,1.4fr]">

        {/* ── Left: Job List ── */}
        <div className="flex flex-col overflow-hidden rounded-3xl border-2 border-slate-200/80 bg-white/60 backdrop-blur-sm shadow-2xl shadow-slate-300/50">

          {/* Header */}
          <div className="px-5 pt-5 pb-4 border-b border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Find Jobs</h2>
                <p className="text-xs font-light text-slate-400 mt-0.5">
                  {/* totalCount is the DB-wide match count, not just what's loaded. */}
                  Showing {filteredJobs.length} of {totalCount}{" "}
                  {totalCount === 1 ? "job" : "jobs"}
                </p>
              </div>
              {stats && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  {stats.fetched_today} fetched today
                </span>
              )}
            </div>
            {/* Search */}
            <div className="relative">
              <CiSearch size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by title, company or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white/80 text-xs text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/10 transition-all"
              />
            </div>

            {/* Source pills */}
            {stats && (
              <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-0.5">
                <button
                  type="button"
                  onClick={() => setSourceFilter("")}
                  className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors ${
                    sourceFilter === "" ? "bg-[#4f46e5] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  All ({stats.total})
                </button>
                {Object.entries(stats.by_source)
                  .sort(([, a], [, b]) => b - a)
                  .map(([src, count]) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => setSourceFilter(sourceFilter === src ? "" : src)}
                      className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors ${
                        sourceFilter === src ? "bg-[#4f46e5] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {sourceLabel(src)} ({count})
                    </button>
                  ))}
              </div>
            )}

            {/* Quick toggles */}
            <div className="flex items-center gap-4 mt-3">
              <label className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remoteOnly}
                  onChange={(e) => setRemoteOnly(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-[#4f46e5] focus:ring-[#4f46e5]/30"
                />
                Remote only
              </label>
              <label className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={fetchedTodayOnly}
                  onChange={(e) => setFetchedTodayOnly(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-[#4f46e5] focus:ring-[#4f46e5]/30"
                />
                Fetched today only
              </label>
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
            ) : filteredJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                <CiSearch size={36} className="mb-2 opacity-40" />
                <p className="text-sm">No jobs found</p>
                <p className="text-xs mt-0.5">Try a different search</p>
              </div>
            ) : (
              filteredJobs.map((job, i) => {
                const active = selectedJob?.id === job.id;
                return (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className={`flex items-center gap-3 rounded-2xl border p-3.5 cursor-pointer transition-all duration-200 ${
                      active
                        ? "border-[#4f46e5] bg-[#eef2ff] shadow-md"
                        : "border-slate-100 bg-white shadow-sm hover:border-[#4f46e5]/30 hover:shadow-md"
                    }`}
                  >
                    <LogoOrInitials logo={job.companyLogo} name={job.companyName} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{job.jobTitle}</p>
                      <p className="text-[11px] text-slate-500 truncate">{job.companyName}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                          <CiLocationOn size={11} />{job.jobGeo}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${tagColors[i % tagColors.length]}`}>
                          {job.jobType}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {job.sourceLabel && (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${sourceColor(job.source)}`}>
                            {job.sourceLabel}
                          </span>
                        )}
                        {job.isRemote && (
                          <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-medium text-teal-700">
                            Remote
                          </span>
                        )}
                        {job.fetchedAt && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                            <BsClock size={9} />{timeAgo(job.fetchedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                    {active && (
                      <HiArrowRight size={14} className="text-[#4f46e5] flex-shrink-0" />
                    )}
                  </div>
                );
              })
            )}

            {/* DRF returns a `next` URL while more pages remain. */}
            {!loading && nextUrl && (
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="w-full rounded-2xl border border-slate-200 bg-white/80 py-2.5 text-xs font-medium text-[#4f46e5] transition-colors hover:bg-[#eef2ff] disabled:opacity-60"
              >
                {loadingMore
                  ? "Loading..."
                  : `Load more (${totalCount - filteredJobs.length} remaining)`}
              </button>
            )}
          </div>
        </div>

        {/* ── Right: Job Detail ── */}
        <div className="flex flex-col overflow-hidden rounded-3xl border-2 border-slate-200/80 bg-white/60 backdrop-blur-sm shadow-2xl shadow-slate-300/50">
          {selectedJob ? (
            <>
              {/* Banner + logo */}
              <div className="relative h-28 flex-shrink-0 bg-[linear-gradient(135deg,#03001e,#7303c0,#ec38bc,#fdeff9)]">
                <div className="absolute -bottom-7 left-6">
                  <LogoOrInitials logo={selectedJob.companyLogo} name={selectedJob.companyName} size="h-14 w-14" />
                </div>
                {selectedJob.sourceLabel && (
                  <span className={`absolute top-3 right-3 rounded-full px-2.5 py-1 text-[11px] font-medium shadow-sm ${sourceColor(selectedJob.source)}`}>
                    {selectedJob.sourceLabel}
                  </span>
                )}
              </div>

              {/* Title row */}
              <div className="px-6 pt-10 pb-4 border-b border-slate-100">
                <h2 className="text-base font-semibold text-slate-900">{selectedJob.jobTitle}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{selectedJob.companyName}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedJob.domain && (
                    <span className="rounded-full bg-[#eef2ff] px-2.5 py-1 text-[11px] font-medium text-[#4f46e5]">
                      {selectedJob.domain}
                    </span>
                  )}
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                    {selectedJob.jobType}
                  </span>
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
                    {selectedJob.jobLevel}
                  </span>
                  {selectedJob.isRemote && (
                    <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-medium text-teal-700">
                      Remote
                    </span>
                  )}
                </div>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5 max-h-[calc(100vh-18rem)]">

                {/* Detail chips */}
                <div className="grid grid-cols-2 gap-2">
                  <DetailChip icon={<CiLocationOn size={16} />}  label="Location"  value={selectedJob.jobGeo} />
                  <DetailChip icon={<BsBriefcase size={14} />}   label="Job Type"  value={selectedJob.jobType} />
                  {selectedJob.fetchedAt && (
                    <DetailChip icon={<BsClock size={13} />} label="Fetched" value={timeAgo(selectedJob.fetchedAt)} />
                  )}
                  {selectedJob.postedDate && (
                    <DetailChip icon={<CiCalendarDate size={16} />} label="Posted" value={selectedJob.postedDate} />
                  )}
                  {selectedJob.applicants && (
                    <DetailChip icon={<BsPeople size={14} />} label="Applicants" value={selectedJob.applicants} />
                  )}
                </div>

                {/* Description */}
                {selectedJob.jobDescription && (
                  <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                    <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">About this role</h3>
                    <div
                      className="text-xs text-slate-600 leading-relaxed prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: selectedJob.jobDescription }}
                    />
                  </div>
                )}

                {/* Cover Letter */}
                <button
                  onClick={() => setCoverLetterJob(selectedJob)}
                  className="flex items-center justify-center gap-2 w-full rounded-2xl border border-[#4f46e5] py-3 text-sm font-medium text-[#4f46e5] hover:bg-[#eef2ff] transition-colors"
                >
                  ✉ Generate Cover Letter
                </button>

                {/* Apply */}
                <button
                  onClick={() => handleApplyClick(selectedJob)}
                  className="flex items-center justify-center gap-2 w-full rounded-2xl bg-[#4f46e5] py-3 text-sm font-medium text-white shadow hover:bg-[#4338ca] transition-colors"
                >
                  Apply Now <HiArrowRight size={15} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
              <div className="h-16 w-16 rounded-2xl bg-[#eef2ff] flex items-center justify-center">
                <BsBriefcase size={28} className="text-[#4f46e5] opacity-50" />
              </div>
              <p className="text-sm font-medium text-slate-500">Select a job to view details</p>
            </div>
          )}
        </div>

      </div>

      {/* ── Confirmation Modal ── */}
      {pendingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={applyStatus === "loading" ? undefined : closeModal} />

          {/* Modal card */}
          <div className="relative w-full max-w-sm rounded-3xl border-2 border-slate-200/80 bg-white shadow-2xl shadow-slate-300/50 overflow-hidden">
            {/* Accent bar */}
            <div className="h-1.5 w-full bg-[linear-gradient(135deg,#03001e,#7303c0,#ec38bc,#fdeff9)]" />

            <div className="p-6">
              {/* Close */}
              {applyStatus !== "loading" && (
                <button onClick={closeModal} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors">
                  <HiX size={18} />
                </button>
              )}

              {/* Job info */}
              <div className="flex items-center gap-3 mb-5">
                <LogoOrInitials logo={pendingJob.companyLogo} name={pendingJob.companyName} size="h-11 w-11" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{pendingJob.jobTitle}</p>
                  <p className="text-xs text-slate-500 truncate">{pendingJob.companyName}</p>
                </div>
              </div>

              {/* States */}
              {!applyStatus && (
                <>
                  <p className="text-sm font-medium text-slate-800 mb-1">Did you complete your application?</p>
                  <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                    We opened the job page in a new tab. Let us know if you submitted your application so we can track it for you.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleConfirmApply}
                      className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-[#4f46e5] py-2.5 text-sm font-medium text-white hover:bg-[#4338ca] transition-colors shadow-sm"
                    >
                      <HiCheck size={15} /> Yes, I Applied
                    </button>
                    <button
                      onClick={closeModal}
                      className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 py-2.5 text-sm font-medium text-slate-600 hover:bg-white transition-colors"
                    >
                      Not Yet
                    </button>
                  </div>
                </>
              )}

              {applyStatus === "loading" && (
                <div className="flex flex-col items-center py-4 gap-3">
                  <div className="flex gap-1.5">
                    {[0,1,2].map((i) => (
                      <span key={i} className="h-2 w-2 rounded-full bg-[#4f46e5] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
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
                  <p className="text-xs text-slate-400">This job has been added to your applications. Good luck! 🎉</p>
                  <button onClick={closeModal} className="mt-1 rounded-2xl bg-[#4f46e5] px-6 py-2 text-xs font-medium text-white hover:bg-[#4338ca] transition-colors">
                    Done
                  </button>
                </div>
              )}

              {applyStatus === "duplicate" && (
                <div className="flex flex-col items-center py-4 gap-3 text-center">
                  <div className="h-12 w-12 rounded-2xl bg-[#eef2ff] flex items-center justify-center">
                    <HiCheck size={24} className="text-[#4f46e5]" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">Already Tracked</p>
                  <p className="text-xs text-slate-400">You've already applied to this job. It's in your applications.</p>
                  <button onClick={closeModal} className="mt-1 rounded-2xl bg-slate-100 px-6 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors">
                    Got it
                  </button>
                </div>
              )}

              {applyStatus === "error" && (
                <div className="flex flex-col items-center py-4 gap-3 text-center">
                  <div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center">
                    <HiX size={24} className="text-red-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">Couldn't Save</p>
                  <p className="text-xs text-slate-400">Something went wrong. Please try again.</p>
                  <button onClick={closeModal} className="mt-1 rounded-2xl bg-slate-100 px-6 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors">
                    Close
                  </button>
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

export default FindJobs;
