import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  FiArrowRight, 
  FiCheckCircle, 
  FiLayers, 
  FiActivity, 
  FiPieChart, 
  FiSearch, 
  FiBriefcase, 
  FiZap, 
  FiCompass, 
  FiTrendingUp, 
  FiShield, 
  FiStar,
  FiChevronRight,
  FiPlay
} from "react-icons/fi";
import { 
  SiLinkedin, 
  SiGlassdoor, 
  SiIndeed, 
  SiYcombinator 
} from "react-icons/si";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useAuth } from "../lib/useAuth";

const STATUS_DATA = [
  { name: "Applied", value: 14, color: "#5B42F3" },
  { name: "Under Review", value: 8, color: "#FF9F43" },
  { name: "Shortlisted", value: 5, color: "#10B981" },
  { name: "Offer Received", value: 2, color: "#6366F1" },
];

// Simulated static contribution map for the preview
const SAMPLE_HEATMAP = [
  [0, 1, 2, 0, 1, 3, 2],
  [1, 2, 4, 1, 2, 3, 1],
  [0, 1, 3, 2, 4, 2, 0],
  [2, 3, 1, 4, 2, 5, 3],
  [1, 2, 3, 2, 1, 4, 2],
  [3, 4, 2, 5, 3, 2, 1],
  [2, 1, 4, 3, 2, 4, 3],
  [1, 3, 2, 1, 4, 3, 2],
  [2, 4, 3, 5, 2, 1, 4],
  [3, 2, 4, 2, 3, 5, 2],
  [1, 3, 2, 4, 1, 2, 3],
  [2, 4, 5, 3, 2, 4, 1],
];

function getHeatColor(count) {
  if (count === 0) return "bg-slate-100";
  if (count === 1) return "bg-[#ddd6fe]";
  if (count === 2) return "bg-[#a78bfa]";
  if (count === 3) return "bg-[#8b5cf6]";
  if (count === 4) return "bg-[#7c3aed]";
  return "bg-[#5B42F3]";
}

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const sampleJobs = [
    {
      id: 1,
      role: "Senior Full Stack Engineer",
      company: "Stripe",
      location: "San Francisco, CA (Hybrid)",
      source: "LinkedIn",
      sourceColor: "text-[#0A66C2] bg-[#0A66C2]/10 border-[#0A66C2]/20",
      salary: "$165k – $210k",
      match: "98% Match",
      badge: "Updated Today",
    },
    {
      id: 2,
      role: "Staff Frontend Architect",
      company: "Vercel",
      location: "Remote",
      source: "Y Combinator",
      sourceColor: "text-[#FF6600] bg-[#FF6600]/10 border-[#FF6600]/20",
      salary: "$180k – $230k",
      match: "94% Match",
      badge: "New Posting",
    },
    {
      id: 3,
      role: "Backend Python Engineer",
      company: "Linear",
      location: "New York, NY (Remote)",
      source: "Greenhouse",
      sourceColor: "text-[#00B259] bg-[#00B259]/10 border-[#00B259]/20",
      salary: "$150k – $190k",
      match: "91% Match",
      badge: "2 Apps Tracked",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F4F6FC] via-[#F8F9FE] to-[#FFFFFF] text-[#1F2937] font-sans antialiased overflow-x-hidden selection:bg-[#5B42F3]/20 selection:text-[#5B42F3]">
      
      {/* ── Top Navigation Bar ───────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#F8F9FE]/85 backdrop-blur-md border-b border-[#E5E7EB]/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-[#5B42F3] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#5B42F3]/25 group-hover:scale-105 transition-transform">
              <span className="text-white font-black text-2xl tracking-tighter">C</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-[#1F2937] group-hover:text-[#5B42F3] transition-colors">
                Career Hub
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#5B42F3]">
                Smart Dashboard
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-[#5B42F3] transition-colors">
              Features
            </a>
            <a href="#showcase" className="text-sm font-medium text-slate-600 hover:text-[#5B42F3] transition-colors">
              How it Works
            </a>
            <a href="#streaks" className="text-sm font-medium text-slate-600 hover:text-[#5B42F3] transition-colors">
              Streak Tracker
            </a>
            <a href="#analytics" className="text-sm font-medium text-slate-600 hover:text-[#5B42F3] transition-colors">
              Pipeline Analytics
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {user ? (
              <button
                onClick={() => navigate("/dashboard")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5B42F3] hover:bg-[#4d36d8] text-white font-semibold text-sm shadow-md shadow-[#5B42F3]/25 hover:shadow-lg hover:shadow-[#5B42F3]/35 transition-all transform hover:-translate-y-0.5"
              >
                Go to Dashboard
                <FiArrowRight className="text-base" />
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-[#5B42F3] bg-[#F5F3FF] border border-[#DDD6FE] hover:bg-[#EDE9FE] transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#5B42F3] hover:bg-[#4d36d8] shadow-md shadow-[#5B42F3]/25 hover:shadow-lg hover:shadow-[#5B42F3]/35 transition-all transform hover:-translate-y-0.5"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-[#5B42F3]/15 to-[#8B5CF6]/10 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#FF9F43]/10 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-[#10B981]/10 blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-[#E5E7EB] shadow-sm mb-8">
            <span className="flex h-2 w-2 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-xs font-semibold text-slate-700">
              Aggregating 1,000+ New Tech Roles Daily
            </span>
            <span className="text-xs text-[#5B42F3] font-bold">✨ Career Hub 2.0</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#1F2937] max-w-4xl mx-auto leading-[1.15]">
            All Your Job Applications in{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5B42F3] via-[#7C3AED] to-[#EC4899]">
              One Smart Dashboard
            </span>
          </h1>

          {/* Sub-headline */}
          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto font-normal leading-relaxed">
            Discover top tech opportunities aggregated across leading platforms, track your application streaks, and organize your job search effortlessly.
          </p>

          {/* Call to Action Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#5B42F3] hover:bg-[#4d36d8] text-white font-bold text-base shadow-xl shadow-[#5B42F3]/30 hover:shadow-2xl hover:shadow-[#5B42F3]/40 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2.5"
            >
              Get Started Free
              <FiArrowRight className="text-lg" />
            </Link>
            
            <a
              href="#showcase"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-base border border-[#E5E7EB] shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2.5"
            >
              <FiPlay className="text-[#5B42F3] fill-[#5B42F3] text-sm" />
              Explore Demo
            </a>
          </div>

          {/* Quick trust metrics */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <FiCheckCircle className="text-[#10B981]" /> Free forever tier
            </span>
            <span className="flex items-center gap-1.5">
              <FiCheckCircle className="text-[#10B981]" /> Multi-platform sync
            </span>
            <span className="flex items-center gap-1.5">
              <FiCheckCircle className="text-[#10B981]" /> No credit card required
            </span>
          </div>
        </div>

        {/* ── Visual Showcase: Hub-and-Spoke Flow Diagram ──────────────────── */}
        <div id="showcase" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 md:mt-24 relative z-10">
          
          <div className="text-center mb-10">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#5B42F3] mb-2">
              Automated Job Aggregation
            </h2>
            <p className="text-2xl font-bold text-[#1F2937]">
              Unified Multi-Source Intelligence
            </p>
          </div>

          {/* Hub and Spoke Architecture Canvas */}
          <div className="relative rounded-3xl border border-[#E5E7EB] bg-white/90 backdrop-blur-xl p-6 sm:p-10 shadow-2xl shadow-slate-200/80 overflow-hidden">
            
            {/* Grid Pattern Background */}
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Left Spoke: Source Platforms */}
              <div className="lg:col-span-3 flex flex-col gap-3.5">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                  Connected Sources
                </div>
                
                {/* LinkedIn Card */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-[#0A66C2]/40 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-[#0A66C2]/10 flex items-center justify-center text-[#0A66C2]">
                      <SiLinkedin className="text-lg" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">LinkedIn</div>
                      <div className="text-[10px] text-slate-400">Direct tech roles</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#0A66C2] bg-[#0A66C2]/10 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </div>

                {/* Y Combinator Card */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-[#FF6600]/40 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-[#FF6600]/10 flex items-center justify-center text-[#FF6600]">
                      <SiYcombinator className="text-lg" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">Y Combinator</div>
                      <div className="text-[10px] text-slate-400">High-growth startups</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#FF6600] bg-[#FF6600]/10 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </div>

                {/* Indeed Card */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-[#2164f3]/40 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-[#2164f3]/10 flex items-center justify-center text-[#2164f3]">
                      <SiIndeed className="text-lg" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">Indeed & Zip</div>
                      <div className="text-[10px] text-slate-400">Enterprise listings</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#2164f3] bg-[#2164f3]/10 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </div>
              </div>

              {/* Center Hub: Live Dashboard Feed Preview */}
              <div className="lg:col-span-6 flex flex-col">
                <div className="rounded-2xl border-2 border-[#5B42F3]/25 bg-gradient-to-b from-white to-[#F8F9FE] p-5 shadow-xl shadow-[#5B42F3]/10 relative">
                  
                  {/* Central Hub Top Bar */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-400" />
                      <div className="h-3 w-3 rounded-full bg-amber-400" />
                      <div className="h-3 w-3 rounded-full bg-emerald-400" />
                      <span className="ml-2 text-xs font-bold text-slate-700">Career Hub Unified Feed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#5B42F3] bg-[#5B42F3]/10 px-2.5 py-1 rounded-lg">
                        <FiZap className="text-xs" /> Real-time Aggregation
                      </span>
                    </div>
                  </div>

                  {/* Search / Filter Simulation */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-500">
                      <FiSearch className="text-slate-400" />
                      <span>Software Engineer, Remote...</span>
                    </div>
                    <div className="text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-sm">
                      Filter
                    </div>
                  </div>

                  {/* Aggregated Cards Feed */}
                  <div className="space-y-2.5">
                    {sampleJobs.map((job) => (
                      <div
                        key={job.id}
                        className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm hover:border-[#5B42F3]/50 hover:shadow-md transition-all text-left"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{job.role}</h4>
                            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                              {job.company} • <span className="text-slate-400">{job.location}</span>
                            </p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${job.sourceColor}`}>
                            {job.source}
                          </span>
                        </div>

                        <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-slate-700">{job.salary}</span>
                            <span className="text-[10px] font-semibold text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-full">
                              {job.match}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-[#5B42F3] bg-[#5B42F3]/10 px-2 py-0.5 rounded-md">
                            {job.badge}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Status Indicator */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#10B981] animate-ping" />
                      All streams active
                    </span>
                    <span className="font-semibold text-[#5B42F3]">32 New Opportunities Today</span>
                  </div>
                </div>
              </div>

              {/* Right Spoke: ATS & Career Portals */}
              <div className="lg:col-span-3 flex flex-col gap-3.5">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                  ATS & Direct Boards
                </div>

                {/* Greenhouse Card */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-[#00B259]/40 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-[#00B259]/10 flex items-center justify-center text-[#00B259]">
                      <FiBriefcase className="text-lg" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">Greenhouse</div>
                      <div className="text-[10px] text-slate-400">Direct ATS pipelines</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#00B259] bg-[#00B259]/10 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </div>

                {/* Lever Card */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-[#333333]/40 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800">
                      <FiLayers className="text-lg" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">Lever & Ashby</div>
                      <div className="text-[10px] text-slate-400">Fast application sync</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </div>

                {/* Glassdoor Card */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-[#0CAA41]/40 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-[#0CAA41]/10 flex items-center justify-center text-[#0CAA41]">
                      <SiGlassdoor className="text-lg" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">Glassdoor</div>
                      <div className="text-[10px] text-slate-400">Company insights</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#0CAA41] bg-[#0CAA41]/10 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ── Core Value Props Grid (3-Column Layout) ───────────────────────── */}
      <section id="features" className="py-20 md:py-28 bg-white border-t border-[#E5E7EB] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#5B42F3] mb-3">
              Built for Modern Job Seekers
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-[#1F2937] tracking-tight">
              Everything You Need to Land Your Next Role
            </h3>
            <p className="mt-4 text-base sm:text-lg text-slate-600">
              Transform the chaos of multiple browser tabs into an organized, high-momentum job search engine.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Column 1: Unified Job Discovery */}
            <div className="rounded-3xl border border-[#E5E7EB] bg-gradient-to-b from-[#F8F9FE] to-white p-7 shadow-lg shadow-slate-100/80 hover:shadow-xl hover:border-[#5B42F3]/40 transition-all flex flex-col justify-between group">
              <div>
                {/* Visual Header */}
                <div className="h-44 rounded-2xl bg-white border border-slate-200/80 p-4 shadow-sm mb-6 flex flex-col justify-center relative overflow-hidden group-hover:border-[#5B42F3]/30 transition-all">
                  <div className="absolute -top-10 -right-10 w-28 h-28 bg-[#5B42F3]/10 rounded-full blur-xl" />
                  
                  {/* Stacking preview */}
                  <div className="space-y-2 relative z-10">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-lg bg-[#0A66C2]/10 flex items-center justify-center text-[#0A66C2] text-xs font-bold">in</div>
                        <span className="font-semibold text-slate-800 text-[11px]">Staff React Dev</span>
                      </div>
                      <span className="text-[10px] font-bold text-[#10B981] bg-emerald-50 px-1.5 py-0.5 rounded">99%</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 text-xs shadow-sm transform translate-x-1">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-lg bg-[#FF6600]/10 flex items-center justify-center text-[#FF6600] text-xs font-bold">Y</div>
                        <span className="font-semibold text-slate-800 text-[11px]">AI Platform Eng</span>
                      </div>
                      <span className="text-[10px] font-bold text-[#5B42F3] bg-purple-50 px-1.5 py-0.5 rounded">New</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs opacity-75">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-lg bg-[#00B259]/10 flex items-center justify-center text-[#00B259] text-xs font-bold">GH</div>
                        <span className="font-semibold text-slate-800 text-[11px]">Lead Backend Dev</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">Auto</span>
                    </div>
                  </div>
                </div>

                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#5B42F3]/10 text-[#5B42F3] mb-4">
                  <FiCompass className="text-xl" />
                </div>

                <h4 className="text-xl font-bold text-[#1F2937]">
                  1. Unified Job Discovery
                </h4>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                  Real-time opportunities gathered across major platforms so you never miss a posting. One single inbox for tech, startup, and enterprise openings.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center text-xs font-bold text-[#5B42F3] group-hover:translate-x-1 transition-transform">
                Explore aggregated listings <FiChevronRight className="ml-1" />
              </div>
            </div>

            {/* Column 2: Application & Streak Tracking */}
            <div id="streaks" className="rounded-3xl border border-[#E5E7EB] bg-gradient-to-b from-[#F8F9FE] to-white p-7 shadow-lg shadow-slate-100/80 hover:shadow-xl hover:border-[#5B42F3]/40 transition-all flex flex-col justify-between group">
              <div>
                {/* Visual Header: GitHub-style Heatmap preview */}
                <div className="h-44 rounded-2xl bg-white border border-slate-200/80 p-4 shadow-sm mb-6 flex flex-col justify-between relative overflow-hidden group-hover:border-[#5B42F3]/30 transition-all">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="text-orange-500 font-bold">🔥 14 Days</span> Current Streak
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Daily Momentum</span>
                  </div>

                  {/* Interactive Contribution Grid */}
                  <div className="flex gap-1.5 justify-center py-2">
                    {SAMPLE_HEATMAP.map((col, cIdx) => (
                      <div key={cIdx} className="flex flex-col gap-1.5">
                        {col.slice(0, 5).map((val, rIdx) => (
                          <div
                            key={rIdx}
                            title={`${val} applications`}
                            className={`h-2.5 w-2.5 rounded-[3px] transition-transform hover:scale-150 cursor-pointer ${getHeatColor(val)}`}
                          />
                        ))}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                    <span>Mon – Sun tracker</span>
                    <div className="flex items-center gap-1">
                      <span>Less</span>
                      <span className="h-2 w-2 rounded-sm bg-slate-100" />
                      <span className="h-2 w-2 rounded-sm bg-[#ddd6fe]" />
                      <span className="h-2 w-2 rounded-sm bg-[#8b5cf6]" />
                      <span className="h-2 w-2 rounded-sm bg-[#5B42F3]" />
                      <span>More</span>
                    </div>
                  </div>
                </div>

                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF9F43]/15 text-[#FF9F43] mb-4">
                  <FiActivity className="text-xl" />
                </div>

                <h4 className="text-xl font-bold text-[#1F2937]">
                  2. Application & Streak Tracking
                </h4>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                  Keep your momentum high with daily streak trackers and visual activity logs. Build unstoppable consistency with GitHub-style heatmaps.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center text-xs font-bold text-[#5B42F3] group-hover:translate-x-1 transition-transform">
                View streak mechanics <FiChevronRight className="ml-1" />
              </div>
            </div>

            {/* Column 3: Pipeline Analytics */}
            <div id="analytics" className="rounded-3xl border border-[#E5E7EB] bg-gradient-to-b from-[#F8F9FE] to-white p-7 shadow-lg shadow-slate-100/80 hover:shadow-xl hover:border-[#5B42F3]/40 transition-all flex flex-col justify-between group">
              <div>
                {/* Visual Header: Recharts Donut Breakdown */}
                <div className="h-44 rounded-2xl bg-white border border-slate-200/80 p-3 shadow-sm mb-6 flex items-center justify-center relative overflow-hidden group-hover:border-[#5B42F3]/30 transition-all">
                  <div className="w-full h-full flex items-center justify-center relative">
                    <ResponsiveContainer width="100%" height={140}>
                      <PieChart>
                        <Pie
                          data={STATUS_DATA}
                          cx="50%"
                          cy="50%"
                          innerRadius={36}
                          outerRadius={58}
                          paddingAngle={4}
                          cornerRadius={4}
                          dataKey="value"
                        >
                          {STATUS_DATA.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 shadow-md text-xs">
                                  <span className="font-semibold text-slate-800">{payload[0].name}: </span>
                                  <span className="font-bold text-[#5B42F3]">{payload[0].value}</span>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute text-center pointer-events-none">
                      <div className="text-base font-extrabold text-[#1F2937]">29</div>
                      <div className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Total</div>
                    </div>
                  </div>
                </div>

                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#10B981]/15 text-[#10B981] mb-4">
                  <FiPieChart className="text-xl" />
                </div>

                <h4 className="text-xl font-bold text-[#1F2937]">
                  3. Pipeline Analytics
                </h4>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                  Track every stage—from submission to offer—with automated pipeline metrics. Spot bottlenecks and optimize your conversion rates easily.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center text-xs font-bold text-[#5B42F3] group-hover:translate-x-1 transition-transform">
                Explore pipeline breakdown <FiChevronRight className="ml-1" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── High-Converting CTA Banner ───────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-[#1F2937] via-[#111827] to-[#0F172A] text-white relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-[#5B42F3]/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -top-20 w-96 h-96 bg-[#8B5CF6]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-medium text-slate-300 mb-6">
            <FiZap className="text-[#FF9F43]" /> Ready to accelerate your career?
          </div>

          <h3 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Stop searching across 10 tabs. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A78BFA] via-[#C084FC] to-[#F472B6]">
              Start landing interviews.
            </span>
          </h3>

          <p className="mt-5 text-slate-300 text-base sm:text-lg max-w-2xl mx-auto">
            Join thousands of developers and professionals tracking applications, preserving streaks, and reaching their dream offers.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#5B42F3] hover:bg-[#4d36d8] text-white font-bold text-base shadow-lg shadow-[#5B42F3]/40 hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              Create Free Account
              <FiArrowRight className="text-lg" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold text-base border border-white/20 backdrop-blur-sm transition-all"
            >
              Sign In to Existing Account
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-[#E5E7EB] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-[#5B42F3] to-[#8B5CF6] flex items-center justify-center shadow-md shadow-[#5B42F3]/25">
              <span className="text-white font-black text-base">C</span>
            </div>
            <span className="text-base font-bold text-[#1F2937]">Career Hub</span>
            <span className="text-xs text-slate-400">© {new Date().getFullYear()} Career Hub. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-500 font-medium">
            <a href="#features" className="hover:text-[#5B42F3] transition-colors">Features</a>
            <a href="#showcase" className="hover:text-[#5B42F3] transition-colors">Aggregation Flow</a>
            <Link to="/login" className="hover:text-[#5B42F3] transition-colors">Log In</Link>
            <Link to="/signup" className="hover:text-[#5B42F3] transition-colors">Sign Up</Link>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
