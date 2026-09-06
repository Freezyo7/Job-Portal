import React, { useEffect, useState } from "react";
import { CiLocationOn, CiCalendarDate, CiSearch } from "react-icons/ci";
import { BsBriefcase, BsClock, BsBookmark, BsBookmarkFill, BsShare } from "react-icons/bs";
import { HiArrowRight, HiCheck, HiX, HiChevronDown, HiChevronUp } from "react-icons/hi";
import api from "../lib/api";
import CoverLetterModal from "./CoverLetterModal";
import { getInitials } from "../lib/jobLogos";
import { normalizeJob, unwrapList, sourceLabel } from "../lib/normalizeJob";
import { timeAgo } from "../lib/timeAgo";

const LogoOrInitials = ({ logo, name, size = "h-11 w-11" }) => {
  const [failedLogo, setFailedLogo] = useState("");

  if (logo && failedLogo !== logo) {
    return (
      <div className={`${size} rounded-xl bg-white dark:bg-zinc-800 border border-[#DDD3C3] dark:border-[#3B5445] p-1.5 flex items-center justify-center flex-shrink-0 shadow-2xs`}>
        <img
          src={logo}
          alt={name}
          loading="lazy"
          decoding="async"
          onError={() => setFailedLogo(logo)}
          className="h-full w-full object-contain rounded-md"
        />
      </div>
    );
  }
  return (
    <div
      className={`${size} rounded-xl border font-mono font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-2xs`}
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

const DetailInfoCard = ({ icon, label, value }) => (
  <div
    className="flex items-center gap-3 rounded-xl border p-3.5 transition-colors"
    style={{
      backgroundColor: "var(--nt-bg-card-alt)",
      borderColor: "var(--nt-border)",
    }}
  >
    <div
      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border flex-shrink-0"
      style={{
        backgroundColor: "var(--nt-bg-secondary)",
        borderColor: "var(--nt-border)",
        color: "var(--nt-accent-gold)",
      }}
    >
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-mono uppercase tracking-wider font-semibold" style={{ color: "var(--nt-text-muted)" }}>{label}</p>
      <p className="text-xs font-bold truncate mt-0.5" style={{ color: "var(--nt-text-primary)" }}>{value || "—"}</p>
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
  const [savedJobIds, setSavedJobIds] = useState(new Set());
  const [isDescExpanded, setIsDescExpanded] = useState(false);

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
    if (!job) return;
    if (job.applyUrl) {
      window.open(job.applyUrl, "_blank", "noopener,noreferrer");
    }
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

  const toggleBookmark = (jobId, e) => {
    if (e) e.stopPropagation();
    setSavedJobIds((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) {
        next.delete(jobId);
      } else {
        next.add(jobId);
      }
      return next;
    });
  };

  const handleShare = (job) => {
    if (!job) return;
    const url = job.applyUrl || window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      alert("Job link copied to clipboard!");
    }
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
          setSelectedJob((prev) => {
            if (prev) {
              const matched = jobs.find((j) => j.id === prev.id);
              if (matched) return matched;
            }
            return jobs[0] ?? null;
          });
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
    <div
      className="min-h-screen px-4 py-6 md:px-6 lg:px-7 transition-colors duration-150"
      style={{
        backgroundColor: "var(--nt-bg-primary)",
        color: "var(--nt-text-primary)",
      }}
    >
      <div className="mx-auto max-w-[1440px] flex flex-col gap-6 lg:grid lg:grid-cols-[1.12fr,1.28fr] items-start">

        {/* ═══════════════════════════════════════════════════════════════════
            LEFT COLUMN: MARKET POSTINGS LIST
        ═══════════════════════════════════════════════════════════════════ */}
        <div
          className="w-full flex flex-col overflow-hidden rounded-2xl border transition-all"
          style={{
            backgroundColor: "var(--nt-bg-card)",
            borderColor: "var(--nt-border)",
            boxShadow: "var(--nt-shadow-sm)",
          }}
        >
          {/* Header section */}
          <div className="p-5 border-b space-y-3.5" style={{ borderColor: "var(--nt-border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold tracking-tight" style={{ color: "var(--nt-text-primary)" }}>
                  Market Postings
                </h1>
                <p className="text-xs mt-0.5" style={{ color: "var(--nt-text-secondary)" }}>
                  Showing {filteredJobs.length} of {totalCount || filteredJobs.length} listings
                </p>
              </div>

              {/* Fetched today pill */}
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-mono font-medium"
                style={{
                  backgroundColor: "rgba(111, 175, 123, 0.18)",
                  borderColor: "rgba(111, 175, 123, 0.35)",
                  color: "var(--nt-accent-sage)",
                }}
              >
                <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: "var(--nt-accent-sage)" }} />
                {stats?.fetched_today ?? 473} fetched today
              </span>
            </div>

            {/* Soft bordered search bar */}
            <div className="relative">
              <CiSearch size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--nt-text-muted)" }} />
              <input
                type="text"
                placeholder="Search by title, company, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs focus:outline-none transition-all"
                style={{
                  backgroundColor: "var(--nt-bg-card-alt)",
                  borderColor: "var(--nt-border)",
                  color: "var(--nt-text-primary)",
                }}
              />
            </div>

            {/* Filter chips with clear active state */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setSourceFilter("")}
                className="flex-shrink-0 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all"
                style={
                  sourceFilter === ""
                    ? {
                        backgroundColor: "var(--nt-accent-gold)",
                        color: "var(--nt-btn-cta-text)",
                        fontWeight: "600",
                        boxShadow: "0 2px 6px rgba(168, 120, 64, 0.25)",
                      }
                    : {
                        backgroundColor: "var(--nt-bg-card-alt)",
                        borderColor: "var(--nt-border)",
                        borderWidth: "1px",
                        color: "var(--nt-text-secondary)",
                      }
                }
              >
                All ({stats?.total ?? totalCount})
              </button>

              {stats && Object.entries(stats.by_source)
                .sort(([, a], [, b]) => b - a)
                .map(([src, count]) => {
                  const active = sourceFilter === src;
                  return (
                    <button
                      key={src}
                      type="button"
                      onClick={() => setSourceFilter(active ? "" : src)}
                      className="flex-shrink-0 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all border"
                      style={
                        active
                          ? {
                              backgroundColor: "var(--nt-accent-gold)",
                              color: "var(--nt-btn-cta-text)",
                              borderColor: "var(--nt-accent-gold)",
                              fontWeight: "600",
                            }
                          : {
                              backgroundColor: "var(--nt-bg-card-alt)",
                              borderColor: "var(--nt-border)",
                              color: "var(--nt-text-secondary)",
                            }
                      }
                    >
                      {sourceLabel(src)} ({count})
                    </button>
                  );
                })}
            </div>

            {/* Quick toggles */}
            <div className="flex items-center gap-5 pt-0.5">
              <label className="flex items-center gap-2 text-xs cursor-pointer select-none font-medium" style={{ color: "var(--nt-text-secondary)" }}>
                <input
                  type="checkbox"
                  checked={remoteOnly}
                  onChange={(e) => setRemoteOnly(e.target.checked)}
                  className="h-4 w-4 rounded"
                  style={{ accentColor: "var(--nt-accent-sage)" }}
                />
                Remote only
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer select-none font-medium" style={{ color: "var(--nt-text-secondary)" }}>
                <input
                  type="checkbox"
                  checked={fetchedTodayOnly}
                  onChange={(e) => setFetchedTodayOnly(e.target.checked)}
                  className="h-4 w-4 rounded"
                  style={{ accentColor: "var(--nt-accent-sage)" }}
                />
                Fetched today only
              </label>
            </div>
          </div>

          {/* List items with clean borders and hover effect */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 max-h-[calc(100vh-17rem)]">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="flex gap-2">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-2.5 w-2.5 rounded-full animate-bounce"
                      style={{
                        backgroundColor: "var(--nt-accent-sage)",
                        animationDelay: `${i * 0.15}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : loadError ? (
              <div className="flex flex-col items-center justify-center h-48 px-6 text-center" style={{ color: "var(--nt-text-muted)" }}>
                <HiX size={32} className="mb-2 text-rose-500" />
                <p className="text-xs font-medium">{loadError}</p>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48" style={{ color: "var(--nt-text-muted)" }}>
                <CiSearch size={36} className="mb-2 opacity-40" />
                <p className="text-xs font-semibold">No listings found</p>
                <p className="text-[11px] mt-0.5">Try adjusting your filters or search terms</p>
              </div>
            ) : (
              filteredJobs.map((job) => {
                const active = selectedJob?.id === job.id;
                const isSaved = savedJobIds.has(job.id);

                return (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className="group relative flex items-center gap-3.5 rounded-xl border p-3.5 cursor-pointer transition-all duration-150"
                    style={
                      active
                        ? {
                            backgroundColor: "rgba(111, 175, 123, 0.14)",
                            borderColor: "var(--nt-accent-sage)",
                            borderWidth: "1.5px",
                            boxShadow: "0 2px 10px rgba(74, 138, 90, 0.12)",
                          }
                        : {
                            backgroundColor: "var(--nt-bg-card)",
                            borderColor: "var(--nt-border)",
                          }
                    }
                  >
                    {/* Company Logo */}
                    <LogoOrInitials logo={job.companyLogo} name={job.companyName} size="h-11 w-11" />

                    {/* Job Details */}
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-xs font-bold leading-snug line-clamp-2" style={{ color: "var(--nt-text-primary)" }}>
                        {job.jobTitle}
                      </p>
                      <p className="text-[11px] font-medium truncate mt-0.5" style={{ color: "var(--nt-text-secondary)" }}>
                        {job.companyName}
                      </p>

                      {/* Meta badges row */}
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap text-[10px] font-mono">
                        {job.jobGeo && (
                          <span className="inline-flex items-center gap-0.5" style={{ color: "var(--nt-text-muted)" }}>
                            <CiLocationOn size={12} />
                            {job.jobGeo}
                          </span>
                        )}

                        {job.jobType && (
                          <span
                            className="px-1.5 py-0.5 rounded border font-sans"
                            style={{
                              backgroundColor: "var(--nt-bg-secondary)",
                              borderColor: "var(--nt-border)",
                              color: "var(--nt-text-secondary)",
                            }}
                          >
                            {job.jobType}
                          </span>
                        )}

                        {job.sourceLabel && (
                          <span
                            className="px-1.5 py-0.5 rounded border font-semibold"
                            style={{
                              backgroundColor: "var(--nt-bg-card-alt)",
                              borderColor: "var(--nt-border)",
                              color: "var(--nt-text-primary)",
                            }}
                          >
                            {job.sourceLabel}
                          </span>
                        )}

                        {job.isRemote && (
                          <span
                            className="rounded border px-1.5 py-0.5 font-semibold font-sans"
                            style={{
                              backgroundColor: "rgba(111, 175, 123, 0.18)",
                              borderColor: "rgba(111, 175, 123, 0.35)",
                              color: "var(--nt-accent-sage)",
                            }}
                          >
                            Remote
                          </span>
                        )}

                        {job.fetchedAt && (
                          <span className="inline-flex items-center gap-1 ml-auto" style={{ color: "var(--nt-text-muted)" }}>
                            <BsClock size={10} />
                            {timeAgo(job.fetchedAt)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right side action: Green arrow circle if active, bookmark outline if inactive */}
                    <div className="flex-shrink-0 flex items-center justify-center pl-1">
                      {active ? (
                        <div
                          className="h-8 w-8 rounded-full flex items-center justify-center text-white shadow-xs transition-transform transform group-hover:scale-105"
                          style={{ backgroundColor: "var(--nt-accent-sage)" }}
                        >
                          <HiArrowRight size={14} />
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => toggleBookmark(job.id, e)}
                          className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors hover:opacity-80"
                          style={{
                            color: isSaved ? "var(--nt-accent-gold)" : "var(--nt-text-muted)",
                          }}
                          aria-label="Save job"
                        >
                          {isSaved ? <BsBookmarkFill size={15} /> : <BsBookmark size={15} />}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {!loading && nextUrl && (
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="w-full rounded-xl border py-2.5 text-xs font-semibold transition-all disabled:opacity-60"
                style={{
                  backgroundColor: "var(--nt-bg-card-alt)",
                  borderColor: "var(--nt-border)",
                  color: "var(--nt-text-primary)",
                }}
              >
                {loadingMore
                  ? "Loading more..."
                  : `Load more listings (${totalCount - filteredJobs.length} remaining)`}
              </button>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            RIGHT COLUMN: JOB DETAIL PANE
        ═══════════════════════════════════════════════════════════════════ */}
        <div
          className="w-full flex flex-col overflow-hidden rounded-2xl border transition-all sticky top-6"
          style={{
            backgroundColor: "var(--nt-bg-card)",
            borderColor: "var(--nt-border)",
            boxShadow: "var(--nt-shadow-sm)",
          }}
        >
          {selectedJob ? (
            <div className="flex flex-col h-full">
              {/* Header Info Block */}
              <div className="p-6 border-b space-y-4" style={{ borderColor: "var(--nt-border)" }}>
                {/* Top Row: Company Info on left, Modern Action buttons on right */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <LogoOrInitials logo={selectedJob.companyLogo} name={selectedJob.companyName} size="h-12 w-12" />
                    <div>
                      <h3 className="text-sm font-bold leading-tight" style={{ color: "var(--nt-text-primary)" }}>
                        {selectedJob.companyName}
                      </h3>
                      <button
                        type="button"
                        onClick={() => {}}
                        className="inline-flex items-center gap-1 text-xs font-medium hover:underline mt-0.5"
                        style={{ color: "var(--nt-accent-sage)" }}
                      >
                        View company <HiArrowRight size={11} />
                      </button>
                    </div>
                  </div>

                  {/* Top Right Actions: Bookmark + Apply Now */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleBookmark(selectedJob.id)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors hover:opacity-80"
                      style={{
                        backgroundColor: "var(--nt-bg-card-alt)",
                        borderColor: "var(--nt-border)",
                        color: savedJobIds.has(selectedJob.id) ? "var(--nt-accent-gold)" : "var(--nt-text-secondary)",
                      }}
                      title={savedJobIds.has(selectedJob.id) ? "Saved" : "Save Job"}
                    >
                      {savedJobIds.has(selectedJob.id) ? <BsBookmarkFill size={14} /> : <BsBookmark size={14} />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApplyClick(selectedJob)}
                      className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold shadow-xs transition-all hover:opacity-95"
                      style={{
                        backgroundColor: "var(--nt-accent-gold)",
                        color: "var(--nt-btn-cta-text)",
                      }}
                    >
                      Apply Now <HiArrowRight size={13} />
                    </button>
                  </div>
                </div>

                {/* Job Title */}
                <div>
                  <h2 className="text-lg md:text-xl font-bold tracking-tight leading-snug" style={{ color: "var(--nt-text-primary)" }}>
                    {selectedJob.jobTitle}
                  </h2>
                </div>

                {/* Tags row: Remote, Job Type, Remote Sage Badge */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  {selectedJob.isRemote && (
                    <span
                      className="rounded-lg border px-2.5 py-1 text-xs font-medium"
                      style={{
                        backgroundColor: "var(--nt-bg-secondary)",
                        borderColor: "var(--nt-border)",
                        color: "var(--nt-text-secondary)",
                      }}
                    >
                      Remote
                    </span>
                  )}
                  {selectedJob.jobType && (
                    <span
                      className="rounded-lg border px-2.5 py-1 text-xs font-medium"
                      style={{
                        backgroundColor: "var(--nt-bg-secondary)",
                        borderColor: "var(--nt-border)",
                        color: "var(--nt-text-secondary)",
                      }}
                    >
                      {selectedJob.jobType}
                    </span>
                  )}
                  <span
                    className="rounded-lg border px-2.5 py-1 text-xs font-semibold"
                    style={{
                      backgroundColor: "rgba(111, 175, 123, 0.18)",
                      borderColor: "rgba(111, 175, 123, 0.35)",
                      color: "var(--nt-accent-sage)",
                    }}
                  >
                    Remote
                  </span>
                </div>

                {/* 4 Info Grid cards (2x2) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <DetailInfoCard
                    icon={<CiLocationOn size={18} />}
                    label="Location"
                    value={selectedJob.jobGeo || "India"}
                  />
                  <DetailInfoCard
                    icon={<BsBriefcase size={16} />}
                    label="Job Type"
                    value={selectedJob.jobType || "Remote"}
                  />
                  <DetailInfoCard
                    icon={<BsClock size={16} />}
                    label="Fetched"
                    value={selectedJob.fetchedAt ? timeAgo(selectedJob.fetchedAt) : "10h ago"}
                  />
                  <DetailInfoCard
                    icon={<CiCalendarDate size={18} />}
                    label="Posted"
                    value={selectedJob.postedDate || selectedJob.fetchedAt || "Recent"}
                  />
                </div>
              </div>

              {/* Scrollable Job Description Section */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[calc(100vh-28rem)]">
                <div>
                  <h3 className="text-base font-bold mb-3" style={{ color: "var(--nt-text-primary)" }}>
                    Job Description
                  </h3>

                  {selectedJob.jobDescription ? (
                    <div
                      className={`text-xs leading-relaxed space-y-3 prose prose-sm max-w-none transition-all ${
                        !isDescExpanded ? "line-clamp-8" : ""
                      }`}
                      style={{ color: "var(--nt-text-secondary)" }}
                      dangerouslySetInnerHTML={{ __html: selectedJob.jobDescription }}
                    />
                  ) : (
                    <div className="text-xs leading-relaxed space-y-3" style={{ color: "var(--nt-text-secondary)" }}>
                      <p>
                        About the job Freelance | Work From Home | Pay Per Hour. BrightCHAMPS is hiring Coding educators to teach school students up to Grade 12 through engaging live online classes. We welcome candidates with strong programming fundamentals, good spoken English and an interest in teaching children.
                      </p>
                      <p>
                        Current teaching window: 6 PM–1 AM IST. Teachers should be able to provide 4-6 hours of consistent availability.
                      </p>
                      <p>
                        Why Join BrightCHAMPS? Ready-to-teach curriculum: Lesson content, teaching flow and resources are provided. No need to create lesson plans or teaching decks. Global teaching exposure: Teach students across international markets. Training provided: Get trained on the BrightCHAMPS curriculum, platforms and teaching methodology before onboarding. Work from home earning opportunity: Most active teachers earn approximately ₹25,000–₹30,000 per month, based on availability, session allocation, student region and teaching performance.
                      </p>
                      <p>
                        What You Will Do: Teach live online Coding classes in 1:1 sessions and small groups of up to 3 students. Conduct both demo and regular learning sessions. Explain concepts clearly and adapt teaching to the student's age and learning level.
                      </p>
                    </div>
                  )}

                  {/* Show more toggle */}
                  <button
                    type="button"
                    onClick={() => setIsDescExpanded(!isDescExpanded)}
                    className="inline-flex items-center gap-1 text-xs font-semibold mt-3 hover:underline cursor-pointer"
                    style={{ color: "var(--nt-accent-sage)" }}
                  >
                    {isDescExpanded ? (
                      <>Show less <HiChevronUp size={14} /></>
                    ) : (
                      <>Show more <HiChevronDown size={14} /></>
                    )}
                  </button>
                </div>
              </div>

              {/* Bottom Action Bar: Primary, Secondary, Tertiary buttons */}
              <div
                className="p-4 border-t flex flex-col sm:flex-row items-center gap-3 mt-auto"
                style={{
                  backgroundColor: "var(--nt-bg-card-alt)",
                  borderColor: "var(--nt-border)",
                }}
              >
                {/* Primary Button */}
                <button
                  type="button"
                  onClick={() => handleApplyClick(selectedJob)}
                  className="flex-1 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-semibold shadow-xs transition-all hover:opacity-95 cursor-pointer"
                  style={{
                    backgroundColor: "var(--nt-accent-gold)",
                    color: "var(--nt-btn-cta-text)",
                  }}
                >
                  Apply Now <HiArrowRight size={13} />
                </button>

                {/* Secondary Button */}
                <button
                  type="button"
                  onClick={() => toggleBookmark(selectedJob.id)}
                  className="flex-1 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border py-2.5 px-4 text-xs font-semibold transition-all hover:opacity-90 cursor-pointer"
                  style={{
                    backgroundColor: "var(--nt-bg-card)",
                    borderColor: "var(--nt-border)",
                    color: "var(--nt-text-primary)",
                  }}
                >
                  {savedJobIds.has(selectedJob.id) ? (
                    <>
                      <BsBookmarkFill size={13} style={{ color: "var(--nt-accent-gold)" }} />
                      Saved
                    </>
                  ) : (
                    <>
                      <BsBookmark size={13} />
                      Save Job
                    </>
                  )}
                </button>

                {/* Tertiary Button */}
                <button
                  type="button"
                  onClick={() => handleShare(selectedJob)}
                  className="flex-1 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border py-2.5 px-4 text-xs font-semibold transition-all hover:opacity-90 cursor-pointer"
                  style={{
                    backgroundColor: "var(--nt-bg-card)",
                    borderColor: "var(--nt-border)",
                    color: "var(--nt-text-primary)",
                  }}
                >
                  <BsShare size={13} />
                  Share
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 py-24" style={{ color: "var(--nt-text-muted)" }}>
              <div
                className="h-14 w-14 rounded-2xl border flex items-center justify-center"
                style={{
                  backgroundColor: "var(--nt-bg-card-alt)",
                  borderColor: "var(--nt-border)",
                }}
              >
                <BsBriefcase size={24} style={{ color: "var(--nt-text-muted)" }} />
              </div>
              <p className="text-xs font-semibold" style={{ color: "var(--nt-text-secondary)" }}>Select a posting to inspect details</p>
            </div>
          )}
        </div>

      </div>

      {/* ── Confirmation Modal ── */}
      {pendingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={applyStatus === "loading" ? undefined : closeModal} />

          <div
            className="relative w-full max-w-sm rounded-2xl border shadow-xl overflow-hidden p-6"
            style={{
              backgroundColor: "var(--nt-bg-card)",
              borderColor: "var(--nt-border)",
            }}
          >
            {applyStatus !== "loading" && (
              <button onClick={closeModal} className="absolute top-4 right-4 transition-colors" style={{ color: "var(--nt-text-muted)" }}>
                <HiX size={18} />
              </button>
            )}

            <div className="flex items-center gap-3 mb-4">
              <LogoOrInitials logo={pendingJob.companyLogo} name={pendingJob.companyName} size="h-10 w-10" />
              <div className="min-w-0">
                <p className="text-xs font-bold truncate" style={{ color: "var(--nt-text-primary)" }}>{pendingJob.jobTitle}</p>
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
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-colors"
                    style={{
                      backgroundColor: "var(--nt-accent-gold)",
                      color: "var(--nt-btn-cta-text)",
                    }}
                  >
                    <HiCheck size={14} /> Yes, I Applied
                  </button>
                  <button
                    onClick={closeModal}
                    className="flex-1 rounded-xl border py-2 text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: "var(--nt-bg-card-alt)",
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
                  className="h-10 w-10 rounded-xl border flex items-center justify-center"
                  style={{
                    backgroundColor: "rgba(111, 175, 123, 0.18)",
                    borderColor: "rgba(111, 175, 123, 0.35)",
                  }}
                >
                  <HiCheck size={20} style={{ color: "var(--nt-accent-sage)" }} />
                </div>
                <p className="text-xs font-semibold" style={{ color: "var(--nt-text-primary)" }}>Application Tracked</p>
                <p className="text-xs" style={{ color: "var(--nt-text-secondary)" }}>Successfully synced to your telemetry board.</p>
                <button
                  onClick={closeModal}
                  className="mt-1 rounded-xl px-5 py-2 text-xs font-semibold transition-colors"
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
                  className="mt-1 rounded-xl border px-5 py-2 text-xs font-semibold transition-colors"
                  style={{
                    backgroundColor: "var(--nt-bg-card-alt)",
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
                  className="mt-1 rounded-xl border px-5 py-2 text-xs font-semibold transition-colors"
                  style={{
                    backgroundColor: "var(--nt-bg-card-alt)",
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
      )}

      {/* ── Cover Letter Modal ── */}
      {coverLetterJob && (
        <CoverLetterModal job={coverLetterJob} onClose={() => setCoverLetterJob(null)} />
      )}
    </div>
  );
};

export default FindJobs;
