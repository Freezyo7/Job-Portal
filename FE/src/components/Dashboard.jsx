import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashCards from "./DashbordComponents/DashCards";
import ApplicationStatausChart from "./DashbordComponents/ApplicationStatausChart";
import ComparisionChart from "./DashbordComponents/ComparisionChart";
import api from "../lib/api";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ── Heatmap (same logic as MyApplication) ────────────────────────────────────
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
  if (count === 0)    return "bg-slate-100";
  if (count === 1)    return "bg-[#c7d2fe]";
  if (count === 2)    return "bg-[#818cf8]";
  if (count <= 4)     return "bg-[#6366f1]";
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
      <div className="flex gap-1.5">{[0,1,2].map(i=><span key={i} className="h-2 w-2 rounded-full bg-[#4f46e5] animate-bounce" style={{animationDelay:`${i*0.15}s`}}/>)}</div>
    </div>
  );
  return (
    <div className="overflow-x-auto">
      <div className="inline-flex flex-col gap-1 min-w-max">
        <div className="flex gap-[3px] pl-8">
          {weeks.map((_,wi)=>{const ml=monthLabels.find(m=>m.weekIndex===wi);return<div key={wi} className="w-3 text-[9px] text-slate-400 text-center">{ml?.label??""}</div>;})}
        </div>
        {[0,1,2,3,4,5,6].map(day=>(
          <div key={day} className="flex items-center gap-[3px]">
            <span className="w-7 text-[9px] text-slate-400 text-right pr-1">{day%2===1?WEEK_DAYS[day]:""}</span>
            {weeks.map((week,wi)=>{const cell=week[day];if(!cell)return<div key={wi} className="w-3 h-3 rounded-[2px] bg-transparent"/>;return<div key={wi} title={cell.inYear?`${cell.date}: ${cell.count} applied`:""} className={`w-3 h-3 rounded-[2px] transition-transform hover:scale-125 cursor-default ${heatColor(cell.count)}`}/>;})}</div>
        ))}
        <div className="flex items-center gap-1 justify-end pt-1">
          <span className="text-[9px] text-slate-400">Less</span>
          {["bg-slate-100","bg-[#c7d2fe]","bg-[#818cf8]","bg-[#6366f1]","bg-[#4338ca]"].map(c=><div key={c} className={`w-3 h-3 rounded-[2px] ${c}`}/>)}
          <span className="text-[9px] text-slate-400">More</span>
        </div>
      </div>
    </div>
  );
};

// ── Streak cards ──────────────────────────────────────────────────────────────
const StreakCards = ({ stats }) => {
  if (!stats) return null;
  const cards = [
    { label: "Current Streak", value: `${stats.current_streak} days`, sub: "Keep it going!", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100" },
    { label: "Longest Streak", value: `${stats.longest_streak} days`, sub: "Personal best",  color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
    { label: "This Week",      value: stats.applied_this_week,        sub: "Mon – Sun",       color: "text-emerald-600",bg: "bg-emerald-50",border: "border-emerald-100"},
    { label: "This Month",     value: stats.applied_this_month,       sub: "Calendar month",  color: "text-sky-600",    bg: "bg-sky-50",    border: "border-sky-100"    },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map(({ label, value, sub, color, bg, border }) => (
        <div key={label} className={`rounded-2xl border-2 ${border} ${bg} px-4 py-3`}>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          <p className="text-xs font-medium text-slate-700 mt-0.5">{label}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>
        </div>
      ))}
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
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

  // DashCards expects status counts — Django has no status field, so every app is "Applied"
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
    <div className="min-h-screen bg-gradient-to-br from-[#f3f4ff] via-[#f6f7ff] to-[#e9f0ff] flex items-center justify-center">
      <div className="flex gap-1.5">{[0,1,2].map(i=><span key={i} className="h-2.5 w-2.5 rounded-full bg-[#4f46e5] animate-bounce" style={{animationDelay:`${i*0.15}s`}}/>)}</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-[#f3f4ff] via-[#f6f7ff] to-[#e9f0ff] px-4 py-6 md:px-8 lg:px-6 lg:py-5">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-3xl border-2 border-slate-200/80 bg-white/70 p-8 text-center shadow-xl">
          <p className="text-base font-semibold text-slate-800">{error}</p>
          {error.includes("log in") && (
            <button onClick={() => navigate("/login")} className="mt-4 rounded-2xl bg-[#4f46e5] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#4338ca] transition-colors">
              Go to Login
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f3f4ff] via-[#f6f7ff] to-[#e9f0ff] px-4 py-6 md:px-8 lg:px-6 lg:py-5 text-slate-900">
      <div className="mx-auto max-w-6xl flex flex-col gap-6">

        <DashCards statusCounts={statusCounts} totalApplications={stats?.total_applied ?? applications.length} />

        {/* Streak cards */}
        <StreakCards stats={stats} />

        {/* Activity heatmap */}
        <div className="rounded-3xl border-2 border-slate-200/80 bg-white/60 backdrop-blur-sm shadow-lg shadow-slate-200/60 p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-800">Application Activity — {currentYear}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">GitHub-style contribution calendar</p>
          </div>
          <ActivityHeatmap year={currentYear} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

export default Dashboard;