import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashCards from "./DashbordComponents/DashCards";
import ApplicationStatausChart from "./DashbordComponents/ApplicationStatausChart";
import ComparisionChart from "./DashbordComponents/ComparisionChart";
import api from "../lib/api";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ── Heatmap (Warm Nature Palette) ───────────────────────────────────────────
const WEEK_DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
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
      <div className="flex gap-1.5">{[0,1,2].map(i=><span key={i} className="h-2 w-2 rounded-full animate-bounce" style={{backgroundColor: "var(--nt-accent-sage)", animationDelay:`${i*0.15}s`}}/>)}</div>
    </div>
  );
  return (
    <div className="overflow-x-auto">
      <div className="inline-flex flex-col gap-1 min-w-max">
        <div className="flex gap-[3px] pl-8">
          {weeks.map((_,wi)=>{const ml=monthLabels.find(m=>m.weekIndex===wi);return<div key={wi} className="w-3 text-[9px] font-mono text-center" style={{ color: "var(--nt-text-muted)" }}>{ml?.label??""}</div>;})}
        </div>
        {[0,1,2,3,4,5,6].map(day=>(
          <div key={day} className="flex items-center gap-[3px]">
            <span className="w-7 text-[9px] font-mono text-right pr-1" style={{ color: "var(--nt-text-muted)" }}>{day%2===1?WEEK_DAYS[day]:""}</span>
            {weeks.map((week,wi)=>{const cell=week[day];if(!cell)return<div key={wi} className="w-3 h-3 rounded-[2px] bg-transparent"/>;return<div key={wi} title={cell.inYear?`${cell.date}: ${cell.count} applied`:""} style={heatColorStyle(cell.count)} className="w-3 h-3 rounded-[2px] transition-transform hover:scale-125 cursor-default"/>;})}</div>
        ))}
        <div className="flex items-center gap-1 justify-end pt-1">
          <span className="text-[9px] font-mono" style={{ color: "var(--nt-text-muted)" }}>Less</span>
          {[0, 1, 2, 3, 5].map((cnt, idx) => <div key={idx} style={heatColorStyle(cnt)} className="w-3 h-3 rounded-[2px]" />)}
          <span className="text-[9px] font-mono" style={{ color: "var(--nt-text-muted)" }}>More</span>
        </div>
      </div>
    </div>
  );
};

// ── Streak cards (Nature Palette) ───────────────────────────────────────────
const StreakCards = ({ stats }) => {
  if (!stats) return null;
  const cards = [
    { label: "Current Streak", value: `${stats.current_streak} days`, sub: "Consecutive activity", badge: "Active" },
    { label: "Longest Streak", value: `${stats.longest_streak} days`, sub: "Personal record", badge: "Best" },
    { label: "This Week",      value: stats.applied_this_week,        sub: "Mon – Sun submissions", badge: "7d" },
    { label: "This Month",     value: stats.applied_this_month,       sub: "Calendar month submissions", badge: "30d" },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map(({ label, value, sub, badge }) => (
        <div
          key={label}
          className="rounded-lg border px-4 py-3 transition-colors"
          style={{
            backgroundColor: "var(--nt-bg-card)",
            borderColor: "var(--nt-border)",
            boxShadow: "var(--nt-shadow-sm)",
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium" style={{ color: "var(--nt-text-secondary)" }}>{label}</span>
            <span
              className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border"
              style={{
                backgroundColor: "var(--nt-bg-secondary)",
                color: "var(--nt-accent-gold)",
                borderColor: "var(--nt-border)",
              }}
            >
              {badge}
            </span>
          </div>
          <p className="text-2xl font-bold font-mono tracking-tight mt-1" style={{ color: "var(--nt-text-primary)" }}>{value}</p>
          <p className="text-[10px] mt-0.5" style={{ color: "var(--nt-text-muted)" }}>{sub}</p>
        </div>
      ))}
    </div>
  );
};

// ── Main Dashboard ────────────────────────────────────────────────────────────
const Dashboard = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [stats, setStats]               = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    Promise.all([
      api.get("/applications/"),
      api.get("/applications/stats/"),
    ])
      .then(([appsRes, statsRes]) => {
        setApplications(Array.isArray(appsRes.data) ? appsRes.data : []);
        setStats(statsRes.data);
      })
      .catch(err => {
        if (err.response?.status === 401) { setError("Please log in to see your dashboard."); return; }
        setError("Failed to load dashboard data.");
      })
      .finally(() => setLoading(false));
  }, []);

  const statusCounts = useMemo(() => ({
    Applied: applications.length,
    "Under Review": 0,
    Shortlisted: 0,
    Rejected: 0,
    "Offer Received": 0,
  }), [applications]);

  const monthlyApplications = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const counts = new Array(12).fill(0);
    applications.forEach(app => {
      const d = new Date(app.applied_at);
      if (!isNaN(d.getTime()) && d.getFullYear() === currentYear) counts[d.getMonth()]++;
    });
    return counts.map((count, i) => ({ name: MONTHS[i], Applications: count }));
  }, [applications]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--nt-bg-primary)" }}>
      <div className="flex gap-1.5">{[0,1,2].map(i=><span key={i} className="h-2 w-2 rounded-full animate-bounce" style={{backgroundColor: "var(--nt-accent-sage)", animationDelay:`${i*0.15}s`}}/>)}</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen px-4 py-6 md:px-8 lg:px-6 lg:py-5" style={{ backgroundColor: "var(--nt-bg-primary)" }}>
      <div className="mx-auto max-w-4xl">
        <div
          className="rounded-lg border p-8 text-center"
          style={{
            backgroundColor: "var(--nt-bg-card)",
            borderColor: "var(--nt-border)",
          }}
        >
          <p className="text-sm font-semibold" style={{ color: "var(--nt-text-primary)" }}>{error}</p>
          {error.includes("log in") && (
            <button
              onClick={() => navigate("/login")}
              className="mt-4 rounded-md px-4 py-2 text-xs font-medium transition-colors"
              style={{
                backgroundColor: "var(--nt-accent-gold)",
                color: "var(--nt-btn-cta-text)",
              }}
            >
              Go to Login
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen px-4 py-6 md:px-6 lg:px-8 transition-colors" style={{ backgroundColor: "var(--nt-bg-primary)", color: "var(--nt-text-primary)" }}>
      <div className="mx-auto max-w-7xl flex flex-col gap-5">

        {/* Header summary info */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-1 border-b" style={{ borderColor: "var(--nt-border)" }}>
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--nt-text-primary)" }}>Telemetry & Activity</h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--nt-text-secondary)" }}>High-density application tracking and pipeline metrics</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono border"
              style={{
                backgroundColor: "rgba(111, 175, 123, 0.15)",
                borderColor: "rgba(111, 175, 123, 0.3)",
                color: "var(--nt-accent-sage)",
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: "var(--nt-accent-sage)" }} />
              Live Sync
            </span>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <DashCards statusCounts={statusCounts} totalApplications={stats?.total_applied ?? applications.length} />

        {/* 4 Streak Cards */}
        <StreakCards stats={stats} />

        {/* Activity heatmap */}
        <div
          className="rounded-lg border p-5"
          style={{
            backgroundColor: "var(--nt-bg-card)",
            borderColor: "var(--nt-border)",
            boxShadow: "var(--nt-shadow-sm)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: "var(--nt-text-primary)" }}>Application Velocity Heatmap — {currentYear}</h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--nt-text-secondary)" }}>Daily application distribution</p>
            </div>
            <span className="text-xs font-mono" style={{ color: "var(--nt-text-muted)" }}>{yearActivityTotal(applications, currentYear)} submissions</span>
          </div>
          <ActivityHeatmap year={currentYear} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-1">
            <ApplicationStatausChart statusCounts={statusCounts} totalApplications={applications.length} />
          </div>
          <div className="lg:col-span-2">
            <ComparisionChart chartData={monthlyApplications} />
          </div>
        </div>

      </div>
    </div>
  );
};

function yearActivityTotal(applications, year) {
  if (!Array.isArray(applications)) return 0;
  return applications.filter(app => {
    const d = new Date(app.applied_at);
    return !isNaN(d.getTime()) && d.getFullYear() === year;
  }).length;
}

export default Dashboard;