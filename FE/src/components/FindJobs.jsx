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
        className={`${size} rounded-md object-cover border flex-shrink-0`}
        style={{ borderColor: "var(--nt-border)" }}
      />
    );
  }
  return (
    <div
      className={`${size} rounded-md border font-mono font-bold text-xs flex items-center justify-center flex-shrink-0`}
      style={{
        backgroundColor: "var(--nt-bg-card-alt)",
        borderColor: "var(--nt-border)",
        color: "var(--nt-text-primary)",
      }}
    >
      {getInitials(name)}
    </div>
  );
};

const DetailChip = ({ icon, label, value }) => (
  <div
    className="flex items-center gap-3 rounded-md border p-3"
    style={{
      backgroundColor: "var(--nt-bg-card-alt)",
      borderColor: "var(--nt-border)",
    }}
  >
    <span
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border flex-shrink-0"
      style={{
        backgroundColor: "var(--nt-bg-secondary)",
        borderColor: "var(--nt-border)",
        color: "var(--nt-text-primary)",
      }}
    >
      {icon}
    </span>
    <div>
      <p className="text-[10px] uppercase font-mono" style={{ color: "var(--nt-text-muted)" }}>{label}</p>
      <p className="text-xs font-semibold" style={{ color: "var(--nt-text-primary)" }}>{value}</p>
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
    <div className="min-h-screen px-4 py-6 md:px-6 lg:px-8 transition-colors" style={{ backgroundColor: "var(--nt-bg-primary)", color: "var(--nt-text-primary)" }}>
      <div className="mx-auto max-w-7xl flex flex-col gap-5 lg:grid lg:grid-cols-[1fr,1.35fr]">

        {/* ── Left: Job List ── */}
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
                <h2 className="text-base font-bold tracking-tight" style={{ color: "var(--nt-text-primary)" }}>Market Postings</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--nt-text-secondary)" }}>
                  Showing {filteredJobs.length} of {totalCount} {totalCount === 1 ? "listing" : "listings"}
                </p>
              </div>
              {stats && (
                <span
                  className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-mono font-medium"
                  style={{
                    backgroundColor: "rgba(111, 175, 123, 0.15)",
                    borderColor: "rgba(111, 175, 123, 0.3)",
                    color: "var(--nt-accent-sage)",
                  }}
                >
                  <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: "var(--nt-accent-sage)" }} />
                  {stats.fetched_today} fetched today
                </span>
              )}
            </div>

            {/* Search */}
            <div className="relative">
              <CiSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--nt-text-muted)" }} />
              <input
                type="text"
                placeholder="Search by title, company, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-md border text-xs focus:outline-none transition-colors"
                style={{
                  backgroundColor: "var(--nt-bg-card-alt)",
                  borderColor: "var(--nt-border)",
                  color: "var(--nt-text-primary)",
                }}
              />
            </div>

            {/* Source pills */}
            {stats && (
              <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-0.5">
                <button
                  type="button"
                  onClick={() => setSourceFilter("")}
                  className="flex-shrink-0 rounded-md px-2.5 py-1 text-[11px] font-mono transition-colors"
                  style={
                    sourceFilter === ""
                      ? {
                          backgroundColor: "var(--nt-accent-gold)",
                          color: "var(--nt-btn-cta-text)",
                          fontWeight: "600",
                        }
                      : {
                          backgroundColor: "var(--nt-bg-secondary)",
                          color: "var(--nt-text-secondary)",
                          border: "1px solid var(--nt-border)",
                        }
                  }
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
                      className="flex-shrink-0 rounded-md px-2.5 py-1 text-[11px] font-mono transition-colors"
                      style={
                        sourceFilter === src
                          ? {
                              backgroundColor: "var(--nt-accent-gold)",
                              color: "var(--nt-btn-cta-text)",
                              fontWeight: "600",
                            }
                          : {
                              backgroundColor: "var(--nt-bg-secondary)",
                              color: "var(--nt-text-secondary)",
                              border: "1px solid var(--nt-border)",
                            }
                      }
                    >
                      {sourceLabel(src)} ({count})
                    </button>
                  ))}
              </div>
            )}

            {/* Quick toggles */}
            <div className="flex items-center gap-4 mt-3">
              <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none" style={{ color: "var(--nt-text-secondary)" }}>
                <input
                  type="checkbox"
                  checked={remoteOnly}
                  onChange={(e) => setRemoteOnly(e.target.checked)}
                  className="h-3.5 w-3.5 rounded"
                  style={{ accentColor: "var(--nt-accent-sage)" }}
                />
                Remote only
              </label>
              <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none" style={{ color: "var(--nt-text-secondary)" }}>
                <input
                  type="checkbox"
                  checked={fetchedTodayOnly}
                  onChange={(e) => setFetchedTodayOnly(e.target.checked)}
                  className="h-3.5 w-3.5 rounded"
                  style={{ accentColor: "var(--nt-accent-sage)" }}
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
                    <span key={i} className="h-2 w-2 rounded-full animate-bounce" style={{ backgroundColor: "var(--nt-accent-sage)", animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            ) : loadError ? (
              <div className="flex flex-col items-center justify-center h-40 px-6 text-center" style={{ color: "var(--nt-text-muted)" }}>
                <HiX size={28} className="mb-2 text-red-500" />
                <p className="text-xs">{loadError}</p>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40" style={{ color: "var(--nt-text-muted)" }}>
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
                    className="flex items-center gap-3 rounded-md border p-3 cursor-pointer transition-colors"
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
                    <LogoOrInitials logo={job.companyLogo} name={job.companyName} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: "var(--nt-text-primary)" }}>{job.jobTitle}</p>
                      <p className="text-[11px] truncate" style={{ color: "var(--nt-text-secondary)" }}>{job.companyName}</p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap font-mono text-[10px]">
                        <span className="inline-flex items-center gap-1" style={{ color: "var(--nt-text-muted)" }}>
                          <CiLocationOn size={11} />{job.jobGeo}
                        </span>
                        <span
                          className="px-1.5 py-0.5 rounded border"
                          style={{
                            backgroundColor: "var(--nt-bg-secondary)",
                            borderColor: "var(--nt-border)",
                            color: "var(--nt-text-secondary)",
                          }}
                        >
                          {job.jobType}
                        </span>
                        {job.sourceLabel && (
                          <span
                            className="px-1.5 py-0.5 rounded border font-semibold"
                            style={{
                              backgroundColor: "var(--nt-bg-secondary)",
                              borderColor: "var(--nt-border)",
                              color: "var(--nt-text-primary)",
                            }}
                          >
                            {job.sourceLabel}
                          </span>
                        )}
                        {job.isRemote && (
                          <span
                            className="rounded border px-1.5 py-0.5 font-semibold"
                            style={{
                              backgroundColor: "rgba(111, 175, 123, 0.15)",
                              borderColor: "rgba(111, 175, 123, 0.3)",
                              color: "var(--nt-accent-sage)",
                            }}
                          >
                            Remote
                          </span>
                        )}
                        {job.fetchedAt && (
                          <span className="inline-flex items-center gap-1" style={{ color: "var(--nt-text-muted)" }}>
                            <BsClock size={9} />{timeAgo(job.fetchedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                    {active && (
                      <HiArrowRight size={13} style={{ color: "var(--nt-accent-sage)" }} className="flex-shrink-0" />
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
                className="w-full rounded-md border py-2 text-xs font-medium transition-colors disabled:opacity-60"
                style={{
                  backgroundColor: "var(--nt-bg-card-alt)",
                  borderColor: "var(--nt-border)",
                  color: "var(--nt-text-primary)",
                }}
              >
                {loadingMore
                  ? "Loading..."
                  : `Load more (${totalCount - filteredJobs.length} remaining)`}
              </button>
            )}
          </div>
        </div>

        {/* ── Right: Job Detail ── */}
        <div
          className="flex flex-col overflow-hidden rounded-lg border"
          style={{
            backgroundColor: "var(--nt-bg-card)",
            borderColor: "var(--nt-border)",
            boxShadow: "var(--nt-shadow-sm)",
          }}
        >
          {selectedJob ? (
            <>
              {/* Nature header banner */}
              <div
                className="relative h-20 flex-shrink-0 border-b"
                style={{
                  backgroundColor: "var(--nt-bg-secondary)",
                  borderColor: "var(--nt-border)",
                }}
              >
                <div className="absolute -bottom-6 left-5">
                  <LogoOrInitials logo={selectedJob.companyLogo} name={selectedJob.companyName} size="h-12 w-12" />
                </div>
                {selectedJob.sourceLabel && (
                  <span
                    className="absolute top-3 right-4 font-mono text-[10px] uppercase font-semibold px-2 py-0.5 rounded border"
                    style={{
                      backgroundColor: "var(--nt-bg-card)",
                      borderColor: "var(--nt-border)",
                      color: "var(--nt-text-primary)",
                    }}
                  >
                    {selectedJob.sourceLabel}
                  </span>
                )}
              </div>

              {/* Title row */}
              <div className="px-5 pt-8 pb-3.5 border-b" style={{ borderColor: "var(--nt-border)" }}>
                <h2 className="text-base font-bold" style={{ color: "var(--nt-text-primary)" }}>{selectedJob.jobTitle}</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--nt-text-secondary)" }}>{selectedJob.companyName}</p>
                <div className="flex flex-wrap gap-1.5 mt-2.5 font-mono text-[10px]">
                  {selectedJob.domain && (
                    <span
                      className="rounded border px-2 py-0.5"
                      style={{
                        backgroundColor: "var(--nt-bg-card-alt)",
                        borderColor: "var(--nt-border)",
                        color: "var(--nt-text-primary)",
                      }}
                    >
                      {selectedJob.domain}
                    </span>
                  )}
                  <span
                    className="rounded border px-2 py-0.5"
                    style={{
                      backgroundColor: "var(--nt-bg-card-alt)",
                      borderColor: "var(--nt-border)",
                      color: "var(--nt-text-primary)",
                    }}
                  >
                    {selectedJob.jobType}
                  </span>
                  <span
                    className="rounded border px-2 py-0.5"
                    style={{
                      backgroundColor: "var(--nt-bg-card-alt)",
                      borderColor: "var(--nt-border)",
                      color: "var(--nt-text-primary)",
                    }}
                  >
                    {selectedJob.jobLevel}
                  </span>
                  {selectedJob.isRemote && (
                    <span
                      className="rounded border px-2 py-0.5 font-semibold"
                      style={{
                        backgroundColor: "rgba(111, 175, 123, 0.15)",
                        borderColor: "rgba(111, 175, 123, 0.3)",
                        color: "var(--nt-accent-sage)",
                      }}
                    >
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
                  <div
                    className="rounded-md border p-4"
                    style={{
                      backgroundColor: "var(--nt-bg-card-alt)",
                      borderColor: "var(--nt-border)",
                    }}
                  >
                    <h3 className="text-[11px] font-mono uppercase font-semibold mb-2" style={{ color: "var(--nt-text-muted)" }}>Job Specification</h3>
                    <div
                      className="text-xs leading-relaxed max-w-none"
                      style={{ color: "var(--nt-text-primary)" }}
                      dangerouslySetInnerHTML={{ __html: selectedJob.jobDescription }}
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <button
                    onClick={() => setCoverLetterJob(selectedJob)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-md border py-2.5 text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: "var(--nt-btn-sec-bg)",
                      borderColor: "var(--nt-border)",
                      color: "var(--nt-text-primary)",
                    }}
                  >
                    ✉ Generate Cover Letter
                  </button>

                  <button
                    onClick={() => handleApplyClick(selectedJob)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-md py-2.5 text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: "var(--nt-accent-gold)",
                      color: "var(--nt-btn-cta-text)",
                    }}
                  >
                    Apply Now <HiArrowRight size={13} />
                  </button>
                </div>
              </div>
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
                <BsBriefcase size={20} style={{ color: "var(--nt-text-muted)" }} />
              </div>
              <p className="text-xs font-medium" style={{ color: "var(--nt-text-secondary)" }}>Select a posting to inspect details</p>
            </div>
          )}
        </div>

      </div>

      {/* ── Confirmation Modal ── */}
      {pendingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={applyStatus === "loading" ? undefined : closeModal} />

          <div
            className="relative w-full max-w-sm rounded-lg border shadow-xl overflow-hidden"
            style={{
              backgroundColor: "var(--nt-bg-card)",
              borderColor: "var(--nt-border)",
            }}
          >
            <div className="p-5">
              {applyStatus !== "loading" && (
                <button onClick={closeModal} className="absolute top-4 right-4 transition-colors" style={{ color: "var(--nt-text-muted)" }}>
                  <HiX size={16} />
                </button>
              )}

              <div className="flex items-center gap-3 mb-4">
                <LogoOrInitials logo={pendingJob.companyLogo} name={pendingJob.companyName} size="h-9 w-9" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: "var(--nt-text-primary)" }}>{pendingJob.jobTitle}</p>
                  <p className="text-[11px] truncate" style={{ color: "var(--nt-text-secondary)" }}>{pendingJob.companyName}</p>
                </div>
              </div>

              {!applyStatus && (
                <>
                  <p className="text-xs font-semibold mb-1" style={{ color: "var(--nt-text-primary)" }}>Confirm Application Status</p>
                  <p className="text-xs mb-4 leading-relaxed" style={{ color: "var(--nt-text-secondary)" }}>
                    We opened the job page in a new tab. Confirm if you completed submission to log this in your activity telemetry.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleConfirmApply}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium transition-colors"
                      style={{
                        backgroundColor: "var(--nt-accent-gold)",
                        color: "var(--nt-btn-cta-text)",
                      }}
                    >
                      <HiCheck size={13} /> Yes, I Applied
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
                      Not Yet
                    </button>
                  </div>
                </>
              )}

              {applyStatus === "loading" && (
                <div className="flex flex-col items-center py-4 gap-2.5">
                  <div className="flex gap-1.5">
                    {[0,1,2].map((i) => (
                      <span key={i} className="h-2 w-2 rounded-full animate-bounce" style={{ backgroundColor: "var(--nt-accent-sage)", animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                  <p className="text-xs font-mono" style={{ color: "var(--nt-text-muted)" }}>Syncing application...</p>
                </div>
              )}

              {applyStatus === "success" && (
                <div className="flex flex-col items-center py-3 gap-2.5 text-center">
                  <div
                    className="h-10 w-10 rounded-md border flex items-center justify-center"
                    style={{
                      backgroundColor: "rgba(111, 175, 123, 0.15)",
                      borderColor: "rgba(111, 175, 123, 0.3)",
                    }}
                  >
                    <HiCheck size={20} style={{ color: "var(--nt-accent-sage)" }} />
                  </div>
                  <p className="text-xs font-semibold" style={{ color: "var(--nt-text-primary)" }}>Application Tracked</p>
                  <p className="text-xs" style={{ color: "var(--nt-text-secondary)" }}>Successfully synced to your telemetry board.</p>
                  <button
                    onClick={closeModal}
                    className="mt-1 rounded-md px-5 py-1.5 text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: "var(--nt-accent-gold)",
                      color: "var(--nt-btn-cta-text)",
                    }}
                  >
                    Done
                  </button>
                </div>
              )}

              {applyStatus === "duplicate" && (
                <div className="flex flex-col items-center py-3 gap-2.5 text-center">
                  <p className="text-xs font-semibold" style={{ color: "var(--nt-text-primary)" }}>Already Tracked</p>
                  <p className="text-xs" style={{ color: "var(--nt-text-secondary)" }}>This posting is already registered in your application history.</p>
                  <button
                    onClick={closeModal}
                    className="mt-1 rounded-md border px-5 py-1.5 text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: "var(--nt-btn-sec-bg)",
                      borderColor: "var(--nt-border)",
                      color: "var(--nt-text-primary)",
                    }}
                  >
                    Close
                  </button>
                </div>
              )}

              {applyStatus === "error" && (
                <div className="flex flex-col items-center py-3 gap-2.5 text-center">
                  <p className="text-xs font-semibold text-red-500">Failed to Save</p>
                  <p className="text-xs" style={{ color: "var(--nt-text-secondary)" }}>Could not record submission status. Please try again.</p>
                  <button
                    onClick={closeModal}
                    className="mt-1 rounded-md border px-5 py-1.5 text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: "var(--nt-btn-sec-bg)",
                      borderColor: "var(--nt-border)",
                      color: "var(--nt-text-primary)",
                    }}
                  >
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
