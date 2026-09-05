import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  BsBriefcase, BsLinkedin, BsEnvelope, BsPersonPlus, BsX, BsCheck2,
  BsCalendar3,
} from "react-icons/bs";
import { HiX } from "react-icons/hi";
import api from "../lib/api";
import { resolveLogoUrl, toDisplayLogoUrl } from "../lib/jobLogos";

// ── Platform badge (Clean Monochromatic / Zinc) ──────────────────────────────
const PLATFORM_CONFIG = {
  naukri:   { label: "Naukri",   bg: "bg-zinc-100 dark:bg-zinc-800", text: "text-zinc-700 dark:text-zinc-300", border: "border-zinc-200 dark:border-zinc-700" },
  foundit:  { label: "Foundit",  bg: "bg-zinc-100 dark:bg-zinc-800", text: "text-zinc-700 dark:text-zinc-300", border: "border-zinc-200 dark:border-zinc-700" },
  hirist:   { label: "Hirist",   bg: "bg-zinc-100 dark:bg-zinc-800", text: "text-zinc-700 dark:text-zinc-300", border: "border-zinc-200 dark:border-zinc-700" },
  unstop:   { label: "Unstop",   bg: "bg-zinc-100 dark:bg-zinc-800", text: "text-zinc-700 dark:text-zinc-300", border: "border-zinc-200 dark:border-zinc-700" },
  linkedin: { label: "LinkedIn", bg: "bg-zinc-100 dark:bg-zinc-800", text: "text-zinc-700 dark:text-zinc-300", border: "border-zinc-200 dark:border-zinc-700" },
  indeed:   { label: "Indeed",   bg: "bg-zinc-100 dark:bg-zinc-800", text: "text-zinc-700 dark:text-zinc-300", border: "border-zinc-200 dark:border-zinc-700" },
};

const PlatformBadge = ({ source }) => {
  const cfg = PLATFORM_CONFIG[source?.toLowerCase()] ?? {
    label: source ?? "Other", bg: "bg-zinc-100 dark:bg-zinc-800", text: "text-zinc-600 dark:text-zinc-400", border: "border-zinc-200 dark:border-zinc-700",
  };
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-mono font-medium ${cfg.bg} ${cfg.text} ${cfg.border}`}>
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
      <img src={logo} alt={name} loading="lazy" onError={() => setFailed(logo)}
        className="h-10 w-10 rounded-md object-cover border border-zinc-200 dark:border-zinc-800 flex-shrink-0" />
    );
  }
  return (
    <div className="h-10 w-10 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-100 flex items-center justify-center flex-shrink-0 font-mono text-xs font-bold">
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
      <div className="w-full max-w-md rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 flex flex-col gap-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Add Recruiter / Contact</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"><HiX size={18} /></button>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Attach recruiter or referral info for <strong className="text-zinc-800 dark:text-zinc-200">{application.job.title}</strong> at <strong className="text-zinc-800 dark:text-zinc-200">{application.job.company}</strong>.
        </p>
        {[
          { id: "contact_name",     label: "Name",         placeholder: "Jane Recruiter",             type: "text"  },
          { id: "contact_email",    label: "Email",        placeholder: "recruiter@company.com",       type: "email" },
          { id: "contact_linkedin", label: "LinkedIn URL", placeholder: "https://linkedin.com/in/...", type: "url"   },
        ].map(({ id, label, placeholder, type }) => (
          <div key={id}>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">{label}</label>
            <input
              type={type} value={form[id]} placeholder={placeholder}
              onChange={e => setForm(f => ({ ...f, [id]: e.target.value }))}
              className="w-full px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        ))}
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex gap-2 justify-end pt-1">
          <button onClick={onClose} className="rounded-md border border-zinc-200 dark:border-zinc-800 px-3.5 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 dark:bg-emerald-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors disabled:opacity-60">
            {saving ? <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <BsCheck2 size={13} />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Activity Heatmap (GitHub style - Zinc & Emerald) ─────────────────────────
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

function heatColor(count) {
  if (count === null) return "bg-transparent";
  if (count === 0) return "bg-zinc-100 dark:bg-zinc-800/80";
  if (count === 1) return "bg-emerald-200 dark:bg-emerald-950 border border-emerald-500/20";
  if (count === 2) return "bg-emerald-400 dark:bg-emerald-800";
  if (count <= 4) return "bg-emerald-500 dark:bg-emerald-600";
  return "bg-emerald-600 dark:bg-emerald-500";
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
      <div className="flex gap-1.5">{[0,1,2].map(i => <span key={i} className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce" style={{animationDelay:`${i*0.15}s`}} />)}</div>
    </div>
  );

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex flex-col gap-1 min-w-max">
        <div className="flex gap-[3px] pl-8">
          {weeks.map((_, wi) => {
            const ml = monthLabels.find(m => m.weekIndex === wi);
            return <div key={wi} className="w-3 text-[9px] font-mono text-zinc-400 dark:text-zinc-500 text-center">{ml?.label ?? ""}</div>;
          })}
        </div>
        {[0,1,2,3,4,5,6].map(day => (
          <div key={day} className="flex items-center gap-[3px]">
            <span className="w-7 text-[9px] font-mono text-zinc-400 dark:text-zinc-500 text-right pr-1">{day % 2 === 1 ? WEEK_DAYS[day] : ""}</span>
            {weeks.map((week, wi) => {
              const cell = week[day];
              if (!cell) return <div key={wi} className="w-3 h-3 rounded-[2px] bg-transparent" />;
              return (
                <div key={wi} title={cell.inYear ? `${cell.date}: ${cell.count} applied` : ""}
                  className={`w-3 h-3 rounded-[2px] transition-transform hover:scale-125 cursor-default ${heatColor(cell.count)}`} />
              );
            })}
          </div>
        ))}
        <div className="flex items-center gap-1 justify-end pt-1">
          <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-500">Less</span>
          {["bg-zinc-100 dark:bg-zinc-800/80","bg-emerald-200 dark:bg-emerald-950","bg-emerald-400 dark:bg-emerald-800","bg-emerald-500 dark:bg-emerald-600","bg-emerald-600 dark:bg-emerald-500"].map(c => (
            <div key={c} className={`w-3 h-3 rounded-[2px] ${c}`} />
          ))}
          <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-500">More</span>
        </div>
      </div>
    </div>
  );
};

// ── Stats bar (Strict Monochromatic Theme 2) ─────────────────────────────────
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
        <div key={label} className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5 transition-colors hover:border-zinc-300 dark:hover:border-zinc-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{label}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/60">{badge}</span>
          </div>
          <p className="text-xl font-bold font-mono tracking-tight text-zinc-950 dark:text-zinc-50 mt-1">{value}</p>
        </div>
      ))}
    </div>
  );
};

// ── Empty state ───────────────────────────────────────────────────────────────
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
    <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
      <BsBriefcase size={20} />
    </div>
    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">No applications tracked</p>
    <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs">Apply to jobs to monitor recruitment telemetry here.</p>
    <Link to="/find-jobs" className="mt-2 rounded-md bg-emerald-600 dark:bg-emerald-500 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors">
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
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-md border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-3.5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
      <LogoOrInitials logo={logo} name={job.company} />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-0.5">
          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">{job.title}</p>
          <PlatformBadge source={job.source} />
        </div>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{job.company}{job.location ? ` · ${job.location}` : ""}</p>
        <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 mt-0.5">
          Applied {new Date(applied_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </p>
      </div>
      <div className="flex-shrink-0 min-w-[140px]">
        {hasContact ? (
          <div className="flex flex-col gap-1">
            {contact_name && <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{contact_name}</p>}
            <div className="flex items-center gap-1.5">
              {contact_email && (
                <a href={`mailto:${contact_email}`} title={contact_email}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  <BsEnvelope size={11} />
                </a>
              )}
              {contact_linkedin && (
                <a href={contact_linkedin} target="_blank" rel="noreferrer" title="LinkedIn"
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  <BsLinkedin size={11} />
                </a>
              )}
              <button onClick={() => onContactEdit(application)} title="Edit contact"
                className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-[10px]">
                ✎
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => onContactEdit(application)}
            className="inline-flex items-center gap-1 rounded-md border border-dashed border-zinc-300 dark:border-zinc-700 px-2.5 py-1 text-[10px] text-zinc-500 dark:text-zinc-400 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
            <BsPersonPlus size={11} /> Add Contact
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {(job.apply_url || job.url) && (
          <a href={job.apply_url || job.url} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors">
            View Job
          </a>
        )}
        <button onClick={() => onDelete(application.id)}
          className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-red-500 hover:border-red-300 dark:hover:border-red-900/60 transition-colors">
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
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#09090B] px-4 py-6 md:px-6 lg:px-8 text-zinc-900 dark:text-zinc-100 transition-colors">
      <div className="mx-auto max-w-7xl flex flex-col gap-5">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-1 border-b border-zinc-200 dark:border-zinc-800/80">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Applications Directory</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Track, update and inspect submission status across platforms</p>
          </div>
        </div>

        {stats && <StatsBar stats={stats} />}

        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              <BsCalendar3 size={13} />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Application Activity — {currentYear}</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Daily frequency calendar</p>
            </div>
          </div>
          <ActivityHeatmap year={currentYear} />
        </div>

        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Active Records</h2>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400">
              <BsBriefcase size={11} />
              {applications.length} {applications.length === 1 ? "Job" : "Jobs"}
            </span>
          </div>

          <div className="flex flex-col gap-2 p-4 max-h-[70vh] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="flex gap-1.5">{[0,1,2].map(i => <span key={i} className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce" style={{animationDelay:`${i*0.15}s`}} />)}</div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2 text-center">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{error}</p>
                {error.includes("log in") && (
                  <Link to="/login" className="rounded-md bg-emerald-600 dark:bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition-colors">Sign In</Link>
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