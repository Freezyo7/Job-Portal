import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  BsBriefcase, BsLinkedin, BsEnvelope, BsPersonPlus, BsX, BsCheck2,
  BsCalendar3,
} from "react-icons/bs";
import { HiX } from "react-icons/hi";
import api from "../lib/api";
import { resolveLogoUrl, toDisplayLogoUrl } from "../lib/jobLogos";

// ── Platform badge (Brand Identity Preserved) ──────────────────────────────
const PLATFORM_CONFIG = {
  naukri:   { label: "Naukri",   bg: "rgba(0, 117, 227, 0.12)", text: "#0075E3", border: "rgba(0, 117, 227, 0.3)" },
  foundit:  { label: "Foundit",  bg: "rgba(110, 0, 255, 0.12)", text: "#8A2BE2", border: "rgba(110, 0, 255, 0.3)" },
  hirist:   { label: "Hirist",   bg: "rgba(0, 168, 150, 0.12)", text: "#00A896", border: "rgba(0, 168, 150, 0.3)" },
  unstop:   { label: "Unstop",   bg: "rgba(28, 73, 128, 0.12)", text: "#2A6BB8", border: "rgba(28, 73, 128, 0.3)" },
  linkedin: { label: "LinkedIn", bg: "rgba(10, 102, 194, 0.12)", text: "#0A66C2", border: "rgba(10, 102, 194, 0.3)" },
  indeed:   { label: "Indeed",   bg: "rgba(33, 100, 243, 0.12)", text: "#2164F3", border: "rgba(33, 100, 243, 0.3)" },
};

const PlatformBadge = ({ source }) => {
  const cfg = PLATFORM_CONFIG[source?.toLowerCase()] ?? {
    label: source ?? "Other",
    bg: "var(--nt-bg-secondary)",
    text: "var(--nt-text-secondary)",
    border: "var(--nt-border)",
  };
  return (
    <span
      className="inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-mono font-medium"
      style={{ backgroundColor: cfg.bg, color: cfg.text, borderColor: cfg.border }}
    >
      {cfg.label}
    </span>
  );
};

// ── Logo / initials ───────────────────────────────────────────────────────────
const LogoOrInitials = ({ logo, name }) => {
  const [failed, setFailed] = useState("");
  const initials = (name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  if (logo && failed !== logo) {
    return (
      <img
        src={logo}
        alt={name}
        loading="lazy"
        onError={() => setFailed(logo)}
        className="h-10 w-10 rounded-md object-cover border flex-shrink-0"
        style={{ borderColor: "var(--nt-border)" }}
      />
    );
  }
  return (
    <div
      className="h-10 w-10 rounded-md border flex items-center justify-center flex-shrink-0 font-mono text-xs font-bold"
      style={{
        backgroundColor: "var(--nt-bg-card-alt)",
        borderColor: "var(--nt-border)",
        color: "var(--nt-text-primary)",
      }}
    >
      {initials}
    </div>
  );
};

// ── Contact Edit Modal ────────────────────────────────────────────────────────
const ContactModal = ({ application, onClose, onSaved }) => {
  const [form, setForm] = useState({
    contact_name:     application.contact_name     || "",
    contact_email:    application.contact_email    || "",
    contact_linkedin: application.contact_linkedin || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await api.patch(`/applications/${application.id}/`, form);
      onSaved(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save contact info.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4">
      <div
        className="w-full max-w-md rounded-lg border p-5 flex flex-col gap-4 shadow-xl"
        style={{
          backgroundColor: "var(--nt-bg-card)",
          borderColor: "var(--nt-border)",
        }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold" style={{ color: "var(--nt-text-primary)" }}>Add Recruiter / Contact</h3>
          <button onClick={onClose} style={{ color: "var(--nt-text-muted)" }}><HiX size={18} /></button>
        </div>
        <p className="text-xs" style={{ color: "var(--nt-text-secondary)" }}>
          Attach recruiter or referral info for <strong style={{ color: "var(--nt-text-primary)" }}>{application.job.title}</strong> at <strong style={{ color: "var(--nt-text-primary)" }}>{application.job.company}</strong>.
        </p>
        {[
          { id: "contact_name",     label: "Name",         placeholder: "Jane Recruiter",             type: "text"  },
          { id: "contact_email",    label: "Email",        placeholder: "recruiter@company.com",       type: "email" },
          { id: "contact_linkedin", label: "LinkedIn URL", placeholder: "https://linkedin.com/in/...", type: "url"   },
        ].map(({ id, label, placeholder, type }) => (
          <div key={id}>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--nt-text-secondary)" }}>{label}</label>
            <input
              type={type} value={form[id]} placeholder={placeholder}
              onChange={e => setForm(f => ({ ...f, [id]: e.target.value }))}
              className="w-full px-3 py-2 rounded-md border text-xs focus:outline-none"
              style={{
                backgroundColor: "var(--nt-bg-card-alt)",
                borderColor: "var(--nt-border)",
                color: "var(--nt-text-primary)",
              }}
            />
          </div>
        ))}
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex gap-2 justify-end pt-1">
          <button
            onClick={onClose}
            className="rounded-md border px-3.5 py-1.5 text-xs transition-colors"
            style={{
              backgroundColor: "var(--nt-btn-sec-bg)",
              borderColor: "var(--nt-border)",
              color: "var(--nt-text-primary)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-md px-4 py-1.5 text-xs font-medium transition-colors disabled:opacity-60"
            style={{
              backgroundColor: "var(--nt-accent-gold)",
              color: "var(--nt-btn-cta-text)",
            }}
          >
            {saving ? <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <BsCheck2 size={13} />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Activity Heatmap (Nature Palette) ─────────────────────────────────────────
const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function buildHeatmapGrid(activityData, year) {
  const countByDate = {};
  activityData.forEach(({ date, count }) => { countByDate[date] = count; });
  const jan1 = new Date(year, 0, 1);
  const dec31 = new Date(year, 11, 31);
  const startDate = new Date(jan1);
  startDate.setDate(jan1.getDate() - jan1.getDay());
  const weeks = [];
  let week = [];
  let cur = new Date(startDate);
  const monthLabels = [];
  while (cur <= dec31 || week.length > 0) {
    if (cur.getDay() === 0 && week.length === 7) { weeks.push(week); week = []; }
    if (cur > dec31 && week.length === 0) break;
    const iso = cur.toISOString().slice(0, 10);
    const inYear = cur.getFullYear() === year;
    week.push({ date: iso, count: inYear ? (countByDate[iso] || 0) : null, inYear });
    if (cur.getDate() === 1 && inYear) monthLabels.push({ weekIndex: weeks.length, label: MONTHS_SHORT[cur.getMonth()] });
    cur.setDate(cur.getDate() + 1);
  }
  if (week.length > 0) weeks.push(week);
  return { weeks, monthLabels };
}

function heatColorStyle(count) {
  if (count === null) return { backgroundColor: "transparent" };
  if (count === 0)    return { backgroundColor: "var(--nt-bg-card-alt)", border: "1px solid var(--nt-border)" };
  if (count === 1)    return { backgroundColor: "rgba(111, 175, 123, 0.35)", border: "1px solid var(--nt-accent-sage)" };
  if (count === 2)    return { backgroundColor: "rgba(111, 175, 123, 0.6)" };
  if (count <= 4)     return { backgroundColor: "var(--nt-accent-sage)" };
  return { backgroundColor: "var(--nt-accent-gold)" };
}

const ActivityHeatmap = ({ year }) => {
  const [activity, setActivity] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/applications/activity/?year=${year}`)
      .then(res => setActivity(Array.isArray(res.data) ? res.data : []))
      .catch(() => setActivity([]))
      .finally(() => setLoading(false));
  }, [year]);

  const { weeks, monthLabels } = buildHeatmapGrid(activity, year);

  if (loading) return (
    <div className="flex items-center justify-center h-24">
      <div className="flex gap-1.5">{[0,1,2].map(i => <span key={i} className="h-2 w-2 rounded-full animate-bounce" style={{ backgroundColor: "var(--nt-accent-sage)", animationDelay:`${i*0.15}s` }} />)}</div>
    </div>
  );

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex flex-col gap-1 min-w-max">
        <div className="flex gap-[3px] pl-8">
          {weeks.map((_, wi) => {
            const ml = monthLabels.find(m => m.weekIndex === wi);
            return <div key={wi} className="w-3 text-[9px] font-mono text-center" style={{ color: "var(--nt-text-muted)" }}>{ml?.label ?? ""}</div>;
          })}
        </div>
        {[0,1,2,3,4,5,6].map(day => (
          <div key={day} className="flex items-center gap-[3px]">
            <span className="w-7 text-[9px] font-mono text-right pr-1" style={{ color: "var(--nt-text-muted)" }}>{day % 2 === 1 ? WEEK_DAYS[day] : ""}</span>
            {weeks.map((week, wi) => {
              const cell = week[day];
              if (!cell) return <div key={wi} className="w-3 h-3 rounded-[2px] bg-transparent" />;
              return (
                <div
                  key={wi}
                  title={cell.inYear ? `${cell.date}: ${cell.count} applied` : ""}
                  style={heatColorStyle(cell.count)}
                  className="w-3 h-3 rounded-[2px] transition-transform hover:scale-125 cursor-default"
                />
              );
            })}
          </div>
        ))}
        <div className="flex items-center gap-1 justify-end pt-1">
          <span className="text-[9px] font-mono" style={{ color: "var(--nt-text-muted)" }}>Less</span>
          {[0, 1, 2, 3, 5].map((cnt, idx) => (
            <div key={idx} style={heatColorStyle(cnt)} className="w-3 h-3 rounded-[2px]" />
          ))}
          <span className="text-[9px] font-mono" style={{ color: "var(--nt-text-muted)" }}>More</span>
        </div>
      </div>
    </div>
  );
};

// ── Stats bar ────────────────────────────────────────────────────────────────
const StatsBar = ({ stats }) => {
  if (!stats) return null;
  const items = [
    { label: "Total Applications", value: stats.total_applied,        badge: "All" },
    { label: "Current Streak",     value: `${stats.current_streak}d`, badge: "Active" },
    { label: "Longest Streak",     value: `${stats.longest_streak}d`, badge: "Best" },
    { label: "This Week",          value: stats.applied_this_week,    badge: "7d" },
    { label: "This Month",         value: stats.applied_this_month,   badge: "30d" },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {items.map(({ label, value, badge }) => (
        <div
          key={label}
          className="rounded-lg border p-3.5 transition-colors"
          style={{
            backgroundColor: "var(--nt-bg-card)",
            borderColor: "var(--nt-border)",
            boxShadow: "var(--nt-shadow-sm)",
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium" style={{ color: "var(--nt-text-secondary)" }}>{label}</span>
            <span
              className="text-[10px] font-mono px-1.5 py-0.5 rounded border"
              style={{
                backgroundColor: "var(--nt-bg-secondary)",
                borderColor: "var(--nt-border)",
                color: "var(--nt-accent-gold)",
              }}
            >
              {badge}
            </span>
          </div>
          <p className="text-xl font-bold font-mono tracking-tight mt-1" style={{ color: "var(--nt-text-primary)" }}>{value}</p>
        </div>
      ))}
    </div>
  );
};

// ── Empty state ───────────────────────────────────────────────────────────────
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
    <div
      className="inline-flex h-12 w-12 items-center justify-center rounded-lg border"
      style={{
        backgroundColor: "var(--nt-bg-card-alt)",
        borderColor: "var(--nt-border)",
        color: "var(--nt-text-muted)",
      }}
    >
      <BsBriefcase size={20} />
    </div>
    <p className="text-sm font-semibold" style={{ color: "var(--nt-text-primary)" }}>No applications tracked</p>
    <p className="text-xs max-w-xs" style={{ color: "var(--nt-text-secondary)" }}>Apply to jobs to monitor recruitment telemetry here.</p>
    <Link
      to="/find-jobs"
      className="mt-2 rounded-md px-4 py-2 text-xs font-medium transition-colors"
      style={{
        backgroundColor: "var(--nt-accent-gold)",
        color: "var(--nt-btn-cta-text)",
      }}
    >
      Browse Jobs
    </Link>
  </div>
);

// ── Job row ───────────────────────────────────────────────────────────────────
const JobRow = ({ application, onContactEdit, onDelete }) => {
  const { job, applied_at, contact_name, contact_email, contact_linkedin } = application;
  const logo = toDisplayLogoUrl(resolveLogoUrl({ company_logo: job.company_logo, source: job.source, company: job.company }));
  const hasContact = contact_name || contact_email || contact_linkedin;

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-md border p-3.5 transition-colors"
      style={{
        backgroundColor: "var(--nt-bg-card)",
        borderColor: "var(--nt-border)",
      }}
    >
      <LogoOrInitials logo={logo} name={job.company} />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-0.5">
          <p className="text-xs font-semibold truncate" style={{ color: "var(--nt-text-primary)" }}>{job.title}</p>
          <PlatformBadge source={job.source} />
        </div>
        <p className="text-[11px]" style={{ color: "var(--nt-text-secondary)" }}>{job.company}{job.location ? ` · ${job.location}` : ""}</p>
        <p className="text-[10px] font-mono mt-0.5" style={{ color: "var(--nt-text-muted)" }}>
          Applied {new Date(applied_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </p>
      </div>
      <div className="flex-shrink-0 min-w-[140px]">
        {hasContact ? (
          <div className="flex flex-col gap-1">
            {contact_name && <p className="text-xs font-medium" style={{ color: "var(--nt-text-primary)" }}>{contact_name}</p>}
            <div className="flex items-center gap-1.5">
              {contact_email && (
                <a
                  href={`mailto:${contact_email}`}
                  title={contact_email}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md border transition-colors"
                  style={{
                    backgroundColor: "var(--nt-bg-secondary)",
                    borderColor: "var(--nt-border)",
                    color: "var(--nt-text-secondary)",
                  }}
                >
                  <BsEnvelope size={11} />
                </a>
              )}
              {contact_linkedin && (
                <a
                  href={contact_linkedin}
                  target="_blank"
                  rel="noreferrer"
                  title="LinkedIn"
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md border transition-colors"
                  style={{
                    backgroundColor: "var(--nt-bg-secondary)",
                    borderColor: "var(--nt-border)",
                    color: "#0A66C2",
                  }}
                >
                  <BsLinkedin size={11} />
                </a>
              )}
              <button
                onClick={() => onContactEdit(application)}
                title="Edit contact"
                className="inline-flex h-6 w-6 items-center justify-center rounded-md border transition-colors text-[10px]"
                style={{
                  backgroundColor: "var(--nt-bg-secondary)",
                  borderColor: "var(--nt-border)",
                  color: "var(--nt-text-muted)",
                }}
              >
                ✎
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => onContactEdit(application)}
            className="inline-flex items-center gap-1 rounded-md border border-dashed px-2.5 py-1 text-[10px] transition-colors"
            style={{
              borderColor: "var(--nt-border)",
              color: "var(--nt-text-secondary)",
            }}
          >
            <BsPersonPlus size={11} /> Add Contact
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {(job.apply_url || job.url) && (
          <a
            href={job.apply_url || job.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors"
            style={{
              backgroundColor: "rgba(111, 175, 123, 0.15)",
              borderColor: "rgba(111, 175, 123, 0.3)",
              color: "var(--nt-accent-sage)",
            }}
          >
            View Job
          </a>
        )}
        <button
          onClick={() => onDelete(application.id)}
          className="inline-flex h-6 w-6 items-center justify-center rounded-md border transition-colors hover:text-red-500"
          style={{
            borderColor: "var(--nt-border)",
            color: "var(--nt-text-muted)",
          }}
        >
          <BsX size={14} />
        </button>
      </div>
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
const MyApplication = () => {
  const [applications, setApplications] = useState([]);
  const [stats, setStats]               = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [contactApp, setContactApp]     = useState(null);
  const currentYear = new Date().getFullYear();

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all([api.get("/applications/"), api.get("/applications/stats/")])
      .then(([appsRes, statsRes]) => {
        setApplications(Array.isArray(appsRes.data) ? appsRes.data : []);
        setStats(statsRes.data);
      })
      .catch(err => {
        if (err.response?.status === 401) setError("Please log in to see your applications.");
        else setError("Failed to load applications.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleContactSaved = (updated) =>
    setApplications(prev => prev.map(a => a.id === updated.id ? updated : a));

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this application from your tracker?")) return;
    try {
      await api.delete(`/applications/${id}/`);
      setApplications(prev => prev.filter(a => a.id !== id));
      setStats(prev => prev ? { ...prev, total_applied: (prev.total_applied || 1) - 1 } : prev);
    } catch {
      alert("Failed to delete. Please try again.");
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 md:px-6 lg:px-8 transition-colors" style={{ backgroundColor: "var(--nt-bg-primary)", color: "var(--nt-text-primary)" }}>
      <div className="mx-auto max-w-7xl flex flex-col gap-5">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-1 border-b" style={{ borderColor: "var(--nt-border)" }}>
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--nt-text-primary)" }}>Applications Directory</h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--nt-text-secondary)" }}>Track, update and inspect submission status across platforms</p>
          </div>
        </div>

        {stats && <StatsBar stats={stats} />}

        <div
          className="rounded-lg border p-5"
          style={{
            backgroundColor: "var(--nt-bg-card)",
            borderColor: "var(--nt-border)",
            boxShadow: "var(--nt-shadow-sm)",
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <span
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border"
              style={{
                backgroundColor: "var(--nt-bg-secondary)",
                borderColor: "var(--nt-border)",
                color: "var(--nt-accent-sage)",
              }}
            >
              <BsCalendar3 size={13} />
            </span>
            <div>
              <h3 className="text-sm font-semibold" style={{ color: "var(--nt-text-primary)" }}>Application Activity — {currentYear}</h3>
              <p className="text-xs" style={{ color: "var(--nt-text-secondary)" }}>Daily frequency calendar</p>
            </div>
          </div>
          <ActivityHeatmap year={currentYear} />
        </div>

        <div
          className="rounded-lg border overflow-hidden"
          style={{
            backgroundColor: "var(--nt-bg-card)",
            borderColor: "var(--nt-border)",
            boxShadow: "var(--nt-shadow-sm)",
          }}
        >
          <div
            className="flex items-center justify-between px-5 py-3.5 border-b"
            style={{
              backgroundColor: "var(--nt-bg-card-alt)",
              borderColor: "var(--nt-border)",
            }}
          >
            <h2 className="text-sm font-semibold" style={{ color: "var(--nt-text-primary)" }}>Active Records</h2>
            <span
              className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-xs font-mono font-medium"
              style={{
                backgroundColor: "rgba(111, 175, 123, 0.15)",
                borderColor: "rgba(111, 175, 123, 0.3)",
                color: "var(--nt-accent-sage)",
              }}
            >
              <BsBriefcase size={11} />
              {applications.length} {applications.length === 1 ? "Job" : "Jobs"}
            </span>
          </div>

          <div className="flex flex-col gap-2 p-4 max-h-[70vh] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="flex gap-1.5">{[0,1,2].map(i => <span key={i} className="h-2 w-2 rounded-full animate-bounce" style={{ backgroundColor: "var(--nt-accent-sage)", animationDelay:`${i*0.15}s` }} />)}</div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2 text-center">
                <p className="text-xs" style={{ color: "var(--nt-text-muted)" }}>{error}</p>
                {error.includes("log in") && (
                  <Link
                    to="/login"
                    className="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: "var(--nt-accent-gold)",
                      color: "var(--nt-btn-cta-text)",
                    }}
                  >
                    Sign In
                  </Link>
                )}
              </div>
            ) : applications.length === 0 ? (
              <EmptyState />
            ) : (
              applications.map(a => (
                <JobRow key={a.id} application={a} onContactEdit={setContactApp} onDelete={handleDelete} />
              ))
            )}
          </div>
        </div>
      </div>

      {contactApp && (
        <ContactModal
          application={contactApp}
          onClose={() => setContactApp(null)}
          onSaved={handleContactSaved}
        />
      )}
    </div>
  );
};

export default MyApplication;