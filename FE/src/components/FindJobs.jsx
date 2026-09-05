import React, { useEffect, useState } from "react";
import { CiLocationOn, CiCalendarDate, CiSearch } from "react-icons/ci";
import { BsBriefcase, BsPeople, BsClock } from "react-icons/bs";
import { HiArrowRight, HiCheck, HiX } from "react-icons/hi";
import api from "../lib/api";
import CoverLetterModal from "./CoverLetterModal";
import { getInitials } from "../lib/jobLogos";
import { normalizeJob, unwrapList, sourceLabel } from "../lib/normalizeJob";
import { timeAgo } from "../lib/timeAgo";

const LogoOrInitials = ({ logo, name, size = "h-10 w-10" }) => {
  const [failedLogo, setFailedLogo] = useState("");

  if (logo && failedLogo !== logo) {
    return (
      <img
        src={logo}
        alt={name}
        loading="lazy"
        decoding="async"
        onError={() => setFailedLogo(logo)}
        className={`${size} rounded-md object-cover border border-zinc-200 dark:border-zinc-800 flex-shrink-0`}
      />
    );
  }
  return (
    <div className={`${size} rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-mono font-bold text-xs flex items-center justify-center flex-shrink-0`}>
      {getInitials(name)}
    </div>
  );
};

const DetailChip = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3">
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex-shrink-0">
      {icon}
    </span>
    <div>
      <p className="text-[10px] uppercase font-mono text-zinc-400 dark:text-zinc-500">{label}</p>
      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{value}</p>
    </div>
  </div>
);

const FindJobs = () => {
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading]         = useState(true);
  const [loadError, setLoadError]     = useState("");
  const [totalCount, setTotalCount]   = useState(0);
  const [nextUrl, setNextUrl]         = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pendingJob, setPendingJob]   = useState(null);
  const [applyStatus, setApplyStatus] = useState(null);
  const [coverLetterJob, setCoverLetterJob] = useState(null);

  const [stats, setStats] = useState(null);
  const [sourceFilter, setSourceFilter]         = useState("");
  const [remoteOnly, setRemoteOnly]             = useState(false);
  const [fetchedTodayOnly, setFetchedTodayOnly] = useState(false);

  useEffect(() => {
    api.get("/jobs/stats/")
      .then((res) => setStats(res.data))
      .catch(() => setStats(null));
  }, []);

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

  const closeModal = () => {
    setPendingJob(null);
    setApplyStatus(null);
  };

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
    api.get(nextUrl)
      .then((res) => {
        setFilteredJobs((prev) => [...prev, ...unwrapList(res.data).map(normalizeJob)]);
        setNextUrl(res.data?.next ?? null);
      })
      .catch(() => setLoadError("Could not load more jobs."))
      .finally(() => setLoadingMore(false));
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#09090B] px-4 py-6 md:px-6 lg:px-8 text-zinc-900 dark:text-zinc-100 transition-colors">
      <div className="mx-auto max-w-7xl flex flex-col gap-5 lg:grid lg:grid-cols-[1fr,1.35fr]">

        {/* ── Left: Job List ── */}
        <div className="flex flex-col overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">

          {/* Header */}
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Market Postings</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Showing {filteredJobs.length} of {totalCount} {totalCount === 1 ? "listing" : "listings"}
                </p>
              </div>
              {stats && (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {stats.fetched_today} fetched today
                </span>
              )}
            </div>

            {/* Search */}
            <div className="relative">
              <CiSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search by title, company, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Source pills */}
            {stats && (
              <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-0.5">
                <button
                  type="button"
                  onClick={() => setSourceFilter("")}
                  className={`flex-shrink-0 rounded-md px-2.5 py-1 text-[11px] font-mono transition-colors ${
                    sourceFilter === "" 
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-medium" 
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
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
                      className={`flex-shrink-0 rounded-md px-2.5 py-1 text-[11px] font-mono transition-colors ${
                        sourceFilter === src 
                          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-medium" 
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      }`}
                    >
                      {sourceLabel(src)} ({count})
                    </button>
                  ))}
              </div>
            )}

            {/* Quick toggles */}
            <div className="flex items-center gap-4 mt-3">
              <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remoteOnly}
                  onChange={(e) => setRemoteOnly(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-zinc-300 dark:border-zinc-700 text-emerald-600 focus:ring-emerald-500 bg-zinc-50 dark:bg-zinc-950"
                />
                Remote only
              </label>
              <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={fetchedTodayOnly}
                  onChange={(e) => setFetchedTodayOnly(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-zinc-300 dark:border-zinc-700 text-emerald-600 focus:ring-emerald-500 bg-zinc-50 dark:bg-zinc-950"
                />
                Fetched today only
              </label>
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
            ) : filteredJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-zinc-400 dark:text-zinc-500">
                <CiSearch size={32} className="mb-2 opacity-40" />
                <p className="text-xs font-semibold">No listings found</p>
                <p className="text-[11px] mt-0.5">Try altering filters or search criteria</p>
              </div>
            ) : (
              filteredJobs.map((job) => {
                const active = selectedJob?.id === job.id;
                return (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className={`flex items-center gap-3 rounded-md border p-3 cursor-pointer transition-colors ${
                      active
                        ? "border-emerald-500/60 bg-emerald-500/5 dark:bg-emerald-500/10"
                        : "border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700"
                    }`}
                  >
                    <LogoOrInitials logo={job.companyLogo} name={job.companyName} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">{job.jobTitle}</p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{job.companyName}</p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap font-mono text-[10px]">
                        <span className="inline-flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
                          <CiLocationOn size={11} />{job.jobGeo}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/60">
                          {job.jobType}
                        </span>
                        {job.sourceLabel && (
                          <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60 font-semibold">
                            {job.sourceLabel}
                          </span>
                        )}
                        {job.isRemote && (
                          <span className="rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 font-semibold">
                            Remote
                          </span>
                        )}
                        {job.fetchedAt && (
                          <span className="inline-flex items-center gap-1 text-zinc-400 dark:text-zinc-500">
                            <BsClock size={9} />{timeAgo(job.fetchedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                    {active && (
                      <HiArrowRight size={13} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    )}
                  </div>
                );
              })
            )}

            {!loading && nextUrl && (
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 py-2 text-xs font-medium text-zinc-800 dark:text-zinc-200 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-60"
              >
                {loadingMore
                  ? "Loading..."
                  : `Load more (${totalCount - filteredJobs.length} remaining)`}
              </button>
            )}
          </div>
        </div>

        {/* ── Right: Job Detail ── */}
        <div className="flex flex-col overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          {selectedJob ? (
            <>
              {/* Sleek industrial banner */}
              <div className="relative h-20 flex-shrink-0 bg-zinc-900 dark:bg-zinc-950 border-b border-zinc-800">
                <div className="absolute -bottom-6 left-5">
                  <LogoOrInitials logo={selectedJob.companyLogo} name={selectedJob.companyName} size="h-12 w-12" />
                </div>
                {selectedJob.sourceLabel && (
                  <span className="absolute top-3 right-4 font-mono text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-200">
                    {selectedJob.sourceLabel}
                  </span>
                )}
              </div>

              {/* Title row */}
              <div className="px-5 pt-8 pb-3.5 border-b border-zinc-200 dark:border-zinc-800">
                <h2 className="text-base font-bold text-zinc-950 dark:text-zinc-50">{selectedJob.jobTitle}</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{selectedJob.companyName}</p>
                <div className="flex flex-wrap gap-1.5 mt-2.5 font-mono text-[10px]">
                  {selectedJob.domain && (
                    <span className="rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 text-zinc-700 dark:text-zinc-300">
                      {selectedJob.domain}
                    </span>
                  )}
                  <span className="rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 text-zinc-700 dark:text-zinc-300">
                    {selectedJob.jobType}
                  </span>
                  <span className="rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 text-zinc-700 dark:text-zinc-300">
                    {selectedJob.jobLevel}
                  </span>
                  {selectedJob.isRemote && (
                    <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 font-semibold text-emerald-600 dark:text-emerald-400">
                      Remote
                    </span>
                  )}
                </div>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[calc(100vh-18rem)]">

                {/* Detail chips */}
                <div className="grid grid-cols-2 gap-2">
                  <DetailChip icon={<CiLocationOn size={15} />}  label="Location"  value={selectedJob.jobGeo} />
                  <DetailChip icon={<BsBriefcase size={13} />}   label="Type"      value={selectedJob.jobType} />
                  {selectedJob.fetchedAt && (
                    <DetailChip icon={<BsClock size={12} />} label="Fetched" value={timeAgo(selectedJob.fetchedAt)} />
                  )}
                  {selectedJob.postedDate && (
                    <DetailChip icon={<CiCalendarDate size={15} />} label="Posted" value={selectedJob.postedDate} />
                  )}
                  {selectedJob.applicants && (
                    <DetailChip icon={<BsPeople size={13} />} label="Applicants" value={selectedJob.applicants} />
                  )}
                </div>

                {/* Description */}
                {selectedJob.jobDescription && (
                  <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 p-4">
                    <h3 className="text-[11px] font-mono uppercase font-semibold text-zinc-500 dark:text-zinc-400 mb-2">Job Specification</h3>
                    <div
                      className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed max-w-none prose prose-xs dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: selectedJob.jobDescription }}
                    />
                  </div>
                )}

                {/* Actions */}
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
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400 dark:text-zinc-500 gap-2 py-16">
              <div className="h-12 w-12 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center">
                <BsBriefcase size={20} className="text-zinc-400" />
              </div>
              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Select a posting to inspect details</p>
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
                <LogoOrInitials logo={pendingJob.companyLogo} name={pendingJob.companyName} size="h-9 w-9" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">{pendingJob.jobTitle}</p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{pendingJob.companyName}</p>
                </div>
              </div>

              {!applyStatus && (
                <>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Confirm Application Status</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
                    We opened the job page in a new tab. Confirm if you completed submission to log this in your activity telemetry.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleConfirmApply}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-md bg-emerald-600 dark:bg-emerald-500 py-2 text-xs font-medium text-white hover:bg-emerald-700 transition-colors"
                    >
                      <HiCheck size={13} /> Yes, I Applied
                    </button>
                    <button
                      onClick={closeModal}
                      className="flex-1 rounded-md border border-zinc-200 dark:border-zinc-800 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      Not Yet
                    </button>
                  </div>
                </>
              )}

              {applyStatus === "loading" && (
                <div className="flex flex-col items-center py-4 gap-2.5">
                  <div className="flex gap-1.5">
                    {[0,1,2].map((i) => (
                      <span key={i} className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                  <p className="text-xs text-zinc-400 font-mono">Syncing application...</p>
                </div>
              )}

              {applyStatus === "success" && (
                <div className="flex flex-col items-center py-3 gap-2.5 text-center">
                  <div className="h-10 w-10 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <HiCheck size={20} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Application Tracked</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Successfully synced to your telemetry board.</p>
                  <button onClick={closeModal} className="mt-1 rounded-md bg-emerald-600 dark:bg-emerald-500 px-5 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition-colors">
                    Done
                  </button>
                </div>
              )}

              {applyStatus === "duplicate" && (
                <div className="flex flex-col items-center py-3 gap-2.5 text-center">
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Already Tracked</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">This posting is already registered in your application history.</p>
                  <button onClick={closeModal} className="mt-1 rounded-md border border-zinc-200 dark:border-zinc-800 px-5 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                    Close
                  </button>
                </div>
              )}

              {applyStatus === "error" && (
                <div className="flex flex-col items-center py-3 gap-2.5 text-center">
                  <p className="text-xs font-semibold text-red-500">Failed to Save</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Could not record submission status. Please try again.</p>
                  <button onClick={closeModal} className="mt-1 rounded-md border border-zinc-200 dark:border-zinc-800 px-5 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
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


