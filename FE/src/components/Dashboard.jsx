import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashCards from "./DashbordComponents/DashCards";
import ApplicationStatausChart from "./DashbordComponents/ApplicationStatausChart";
import ComparisionChart from "./DashbordComponents/ComparisionChart";
import api from "../lib/api";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ── Heatmap (Theme 2 Zinc & Emerald) ─────────────────────────────────────────
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

function heatColor(count) {
  if (count === null) return "bg-transparent";
  if (count === 0)    return "bg-zinc-100 dark:bg-zinc-800/80";
  if (count === 1)    return "bg-emerald-200 dark:bg-emerald-950 border border-emerald-500/20";
  if (count === 2)    return "bg-emerald-400 dark:bg-emerald-800";
  if (count <= 4)     return "bg-emerald-500 dark:bg-emerald-600";
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
      <div className="flex gap-1.5">{[0,1,2].map(i=><span key={i} className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce" style={{animationDelay:`${i*0.15}s`}}/>)}</div>
    </div>
  );
  return (
    <div className="overflow-x-auto">
      <div className="inline-flex flex-col gap-1 min-w-max">
        <div className="flex gap-[3px] pl-8">
          {weeks.map((_,wi)=>{const ml=monthLabels.find(m=>m.weekIndex===wi);return<div key={wi} className="w-3 text-[9px] font-mono text-zinc-400 dark:text-zinc-500 text-center">{ml?.label??""}</div>;})}
        </div>
        {[0,1,2,3,4,5,6].map(day=>(
          <div key={day} className="flex items-center gap-[3px]">
            <span className="w-7 text-[9px] font-mono text-zinc-400 dark:text-zinc-500 text-right pr-1">{day%2===1?WEEK_DAYS[day]:""}</span>
            {weeks.map((week,wi)=>{const cell=week[day];if(!cell)return<div key={wi} className="w-3 h-3 rounded-[2px] bg-transparent"/>;return<div key={wi} title={cell.inYear?`${cell.date}: ${cell.count} applied`:""} className={`w-3 h-3 rounded-[2px] transition-transform hover:scale-125 cursor-default ${heatColor(cell.count)}`}/>;})}</div>
        ))}
        <div className="flex items-center gap-1 justify-end pt-1">
          <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-500">Less</span>
          {["bg-zinc-100 dark:bg-zinc-800/80","bg-emerald-200 dark:bg-emerald-950","bg-emerald-400 dark:bg-emerald-800","bg-emerald-500 dark:bg-emerald-600","bg-emerald-600 dark:bg-emerald-500"].map(c=><div key={c} className={`w-3 h-3 rounded-[2px] ${c}`}/>)}
          <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-500">More</span>
        </div>
      </div>
    </div>
  );
};

// ── Streak cards (Strict Monochromatic Theme 2) ─────────────────────────────
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
        <div key={label} className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 transition-colors hover:border-zinc-300 dark:hover:border-zinc-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{label}</span>
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/60">{badge}</span>
          </div>
          <p className="text-2xl font-bold font-mono tracking-tight text-zinc-950 dark:text-zinc-50 mt-1">{value}</p>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">{sub}</p>
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
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#09090B] flex items-center justify-center">
      <div className="flex gap-1.5">{[0,1,2].map(i=><span key={i} className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce" style={{animationDelay:`${i*0.15}s`}}/>)}</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#09090B] px-4 py-6 md:px-8 lg:px-6 lg:py-5">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center">
          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{error}</p>
          {error.includes("log in") && (
            <button onClick={() => navigate("/login")} className="mt-4 rounded-md bg-emerald-600 dark:bg-emerald-500 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors">
              Go to Login
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#09090B] px-4 py-6 md:px-6 lg:px-8 text-zinc-900 dark:text-zinc-100 transition-colors">
      <div className="mx-auto max-w-7xl flex flex-col gap-5">

        {/* Header summary info */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-1 border-b border-zinc-200 dark:border-zinc-800/80">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Telemetry & Activity</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">High-density application tracking and pipeline metrics</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync
            </span>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <DashCards statusCounts={statusCounts} totalApplications={stats?.total_applied ?? applications.length} />

        {/* 4 Streak Cards (strictly monochromatic) */}
        <StreakCards stats={stats} />

        {/* Activity heatmap */}
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Application Velocity Heatmap — {currentYear}</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Daily application distribution</p>
            </div>
            <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500">{yearActivityTotal(applications, currentYear)} submissions</span>
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