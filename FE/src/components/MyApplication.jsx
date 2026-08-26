import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  BsBriefcase, BsLinkedin, BsEnvelope, BsPersonPlus, BsX, BsCheck2,
  BsCalendar3,
} from "react-icons/bs";
import { HiX } from "react-icons/hi";
import api from "../lib/api";
import { resolveLogoUrl, toDisplayLogoUrl } from "../lib/jobLogos";

// ── Platform badge ────────────────────────────────────────────────────────────
const PLATFORM_CONFIG = {
  naukri:   { label: "Naukri",   bg: "bg-orange-50",  text: "text-orange-600",  border: "border-orange-200" },
  foundit:  { label: "Foundit",  bg: "bg-blue-50",    text: "text-blue-600",    border: "border-blue-200"   },
  hirist:   { label: "Hirist",   bg: "bg-violet-50",  text: "text-violet-600",  border: "border-violet-200" },
  unstop:   { label: "Unstop",   bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200"},
  linkedin: { label: "LinkedIn", bg: "bg-sky-50",     text: "text-sky-600",     border: "border-sky-200"    },
  indeed:   { label: "Indeed",   bg: "bg-indigo-50",  text: "text-indigo-600",  border: "border-indigo-200" },
};

const PlatformBadge = ({ source }) => {
  const cfg = PLATFORM_CONFIG[source?.toLowerCase()] ?? {
    label: source ?? "Other", bg: "bg-slate-50", text: "text-slate-500", border: "border-slate-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide ${cfg.bg} ${cfg.text} ${cfg.border}`}>
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
        className="h-11 w-11 rounded-xl object-cover border border-slate-100 flex-shrink-0" />
    );
  }
  return (
    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-bold text-white">{initials}</span>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-3xl border-2 border-slate-200/80 bg-white shadow-2xl p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">Add Recruiter / Contact</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><HiX size={18} /></button>
        </div>
        <p className="text-[11px] text-slate-400">
          Attach recruiter or referral info for <strong className="text-slate-600">{application.job.title}</strong> at <strong className="text-slate-600">{application.job.company}</strong>.
        </p>
        {[
          { id: "contact_name",     label: "Name",         placeholder: "Jane Recruiter",             type: "text"  },
          { id: "contact_email",    label: "Email",        placeholder: "recruiter@company.com",       type: "email" },
          { id: "contact_linkedin", label: "LinkedIn URL", placeholder: "https://linkedin.com/in/...", type: "url"   },
        ].map(({ id, label, placeholder, type }) => (
          <div key={id}>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
            <input
              type={type} value={form[id]} placeholder={placeholder}
              onChange={e => setForm(f => ({ ...f, [id]: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-white/80 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/10 transition-all"
            />
          </div>
        ))}
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex gap-3 justify-end pt-1">
          <button onClick={onClose} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#4f46e5] px-5 py-2 text-sm font-medium text-white hover:bg-[#4338ca] transition-colors disabled:opacity-60">
            {saving ? <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <BsCheck2 size={14} />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Activity Heatmap (GitHub style) ──────────────────────────────────────────
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
  if (count === 0) return "bg-slate-100";
  if (count === 1) return "bg-[#c7d2fe]";
  if (count === 2) return "bg-[#818cf8]";
  if (count <= 4) return "bg-[#6366f1]";
  return "bg-[#4338ca]";
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
      <div className="flex gap-1.5">{[0,1,2].map(i => <span key={i} className="h-2 w-2 rounded-full bg-[#4f46e5] animate-bounce" style={{animationDelay:`${i*0.15}s`}} />)}</div>
    </div>
  );

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex flex-col gap-1 min-w-max">
        <div className="flex gap-[3px] pl-8">
          {weeks.map((_, wi) => {
            const ml = monthLabels.find(m => m.weekIndex === wi);
            return <div key={wi} className="w-3 text-[9px] text-slate-400 text-center">{ml?.label ?? ""}</div>;
          })}
        </div>
        {[0,1,2,3,4,5,6].map(day => (
          <div key={day} className="flex items-center gap-[3px]">
            <span className="w-7 text-[9px] text-slate-400 text-right pr-1">{day % 2 === 1 ? WEEK_DAYS[day] : ""}</span>
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
          <span className="text-[9px] text-slate-400">Less</span>
          {["bg-slate-100","bg-[#c7d2fe]","bg-[#818cf8]","bg-[#6366f1]","bg-[#4338ca]"].map(c => (
            <div key={c} className={`w-3 h-3 rounded-[2px] ${c}`} />
          ))}
          <span className="text-[9px] text-slate-400">More</span>
        </div>
      </div>
    </div>
  );
};

// ── Stats bar ─────────────────────────────────────────────────────────────────
const StatsBar = ({ stats }) => {
  if (!stats) return null;
  const items = [
    { label: "Total",       value: stats.total_applied,     color: "text-[#4f46e5]",   bg: "bg-[#eef2ff]"   },
    { label: "Streak",      value: `${stats.current_streak}d`, color: "text-orange-600", bg: "bg-orange-50"  },
    { label: "Best Streak", value: `${stats.longest_streak}d`, color: "text-purple-600", bg: "bg-purple-50"  },
    { label: "This Week",   value: stats.applied_this_week,  color: "text-emerald-600", bg: "bg-emerald-50"  },
    { label: "This Month",  value: stats.applied_this_month, color: "text-sky-600",     bg: "bg-sky-50"      },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(({ label, value, color, bg }) => (
        <div key={label} className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 ${bg}`}>
          <span className={`text-xl font-bold ${color}`}>{value}</span>
          <span className="text-[11px] text-slate-500">{label}</span>
        </div>
      ))}
    </div>
  );
};

// ── Empty state ───────────────────────────────────────────────────────────────
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
    <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-[#eef2ff]">
      <BsBriefcase size={28} className="text-[#4f46e5]" />
    </div>
    <p className="text-sm font-medium text-slate-700">No applications yet</p>
    <p className="text-xs text-slate-400 max-w-xs">Browse jobs and confirm applications to see them here.</p>
    <Link to="/find-jobs" className="mt-1 rounded-full bg-[#4f46e5] px-5 py-2 text-xs font-medium text-white hover:bg-[#4338ca] transition-colors">
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
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md hover:border-[#4f46e5]/20 transition-all duration-200">
      <LogoOrInitials logo={logo} name={job.company} />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-0.5">
          <p className="text-sm font-semibold text-slate-800 truncate">{job.title}</p>
          <PlatformBadge source={job.source} />
        </div>
        <p className="text-xs text-slate-500">{job.company}{job.location ? ` · ${job.location}` : ""}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Applied {new Date(applied_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </p>
      </div>
      <div className="flex-shrink-0 min-w-[140px]">
        {hasContact ? (
          <div className="flex flex-col gap-1">
            {contact_name && <p className="text-xs font-medium text-slate-700">{contact_name}</p>}
            <div className="flex items-center gap-2">
              {contact_email && (
                <a href={`mailto:${contact_email}`} title={contact_email}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-[#eef2ff] hover:text-[#4f46e5] transition-colors">
                  <BsEnvelope size={11} />
                </a>
              )}
              {contact_linkedin && (
                <a href={contact_linkedin} target="_blank" rel="noreferrer" title="LinkedIn"
                  className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-sky-50 hover:text-sky-600 transition-colors">
                  <BsLinkedin size={11} />
                </a>
              )}
              <button onClick={() => onContactEdit(application)} title="Edit contact"
                className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-400 hover:bg-[#eef2ff] hover:text-[#4f46e5] transition-colors text-[10px]">
                ✎
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => onContactEdit(application)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-200 px-3 py-1.5 text-[11px] text-slate-400 hover:border-[#4f46e5]/40 hover:text-[#4f46e5] transition-colors">
            <BsPersonPlus size={11} /> Add Contact
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {(job.apply_url || job.url) && (
          <a href={job.apply_url || job.url} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#eef2ff] px-3 py-1.5 text-[11px] font-medium text-[#4f46e5] hover:bg-[#4f46e5] hover:text-white transition-colors">
            View
          </a>
        )}
        <button onClick={() => onDelete(application.id)}
          className="inline-flex h-7 w-7 items-center justify-center rounded-xl border border-red-100 text-red-400 hover:bg-red-50 hover:border-red-200 transition-colors">
          <BsX size={16} />
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
    <div className="min-h-screen bg-gradient-to-br from-[#f3f4ff] via-[#f6f7ff] to-[#e9f0ff] px-4 py-6 md:px-8 lg:px-6 lg:py-5 text-slate-900">
      <div className="mx-auto max-w-6xl flex flex-col gap-6">

        <div>
          <h1 className="text-lg font-semibold text-slate-900">My Applications</h1>
          <p className="text-xs text-slate-400 mt-0.5">Track all your job applications in one place.</p>
        </div>

        {stats && <StatsBar stats={stats} />}

        <div className="rounded-3xl border-2 border-slate-200/80 bg-white/60 backdrop-blur-sm shadow-lg shadow-slate-200/60 p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#eef2ff] text-[#4f46e5]">
              <BsCalendar3 size={14} />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Activity — {currentYear}</h3>
              <p className="text-[11px] text-slate-400">Applications per day</p>
            </div>
          </div>
          <ActivityHeatmap year={currentYear} />
        </div>

        <div className="rounded-3xl border-2 border-slate-200/80 bg-white/60 backdrop-blur-sm shadow-2xl shadow-slate-300/50 overflow-hidden">
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900">Applied Jobs</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-medium text-[#4f46e5]">
              <BsBriefcase size={12} />
              {applications.length} {applications.length === 1 ? "Job" : "Jobs"}
            </span>
          </div>

          <div className="flex flex-col gap-2 px-5 py-4 max-h-[70vh] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="flex gap-1.5">{[0,1,2].map(i => <span key={i} className="h-2 w-2 rounded-full bg-[#4f46e5] animate-bounce" style={{animationDelay:`${i*0.15}s`}} />)}</div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2 text-center">
                <p className="text-sm text-slate-500">{error}</p>
                {error.includes("log in") && (
                  <Link to="/login" className="rounded-full bg-[#4f46e5] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#4338ca] transition-colors">Sign In</Link>
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