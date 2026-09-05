import React from "react";
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
  FiChevronRight,
  FiTerminal,
} from "react-icons/fi";
import {
  SiLinkedin,
  SiGlassdoor,
  SiIndeed,
  SiYcombinator,
} from "react-icons/si";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useAuth } from "../lib/useAuth";
import ThemeToggle from "./ThemeToggle";

// ── Palette is defined as CSS vars in main.css (:root / html.dark) ─────────
// Light  → warm parchment / cream / sage / earthy gold
// Dark   → deep forest / muted teal / brown / warm gold
// ──────────────────────────────────────────────────────────────────────────

const STATUS_DATA = [
  { name: "Applied",        value: 14, color: "#6FAF7B" },
  { name: "Under Review",   value: 8,  color: "#4A8070" },
  { name: "Shortlisted",    value: 5,  color: "#C9A96E" },
  { name: "Offer Received", value: 2,  color: "#A07848" },
];

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

// Heat colours use inline style so they respond to the var tokens at runtime
function getHeatStyle(count) {
  const opacities = [0.15, 0.3, 0.48, 0.65, 0.82, 1];
  return {
    backgroundColor: `rgba(111,175,123,${opacities[Math.min(count, 5)]})`,
    borderRadius: "2px",
  };
}

// ── Shared inline-style helpers ───────────────────────────────────────────
const V = {
  bgPrimary:   { backgroundColor: "var(--nt-bg-primary)" },
  bgSecondary: { backgroundColor: "var(--nt-bg-secondary)" },
  bgCard:      { backgroundColor: "var(--nt-bg-card)" },
  bgCardAlt:   { backgroundColor: "var(--nt-bg-card-alt)" },
  border:      { borderColor: "var(--nt-border)" },
  textPrimary: { color: "var(--nt-text-primary)" },
  textSecondary:{ color: "var(--nt-text-secondary)" },
  textMuted:   { color: "var(--nt-text-muted)" },
  accentSage:  { color: "var(--nt-accent-sage)" },
  accentGold:  { color: "var(--nt-accent-gold)" },
};

const cardStyle = {
  backgroundColor: "var(--nt-bg-card)",
  borderColor: "var(--nt-border)",
  boxShadow: "0 2px 16px 0 rgba(0,0,0,0.12)",
};

const insetStyle = {
  backgroundColor: "var(--nt-bg-secondary)",
  borderColor: "var(--nt-border)",
};

const inputRowStyle = {
  backgroundColor: "var(--nt-bg-card-alt)",
  borderColor: "var(--nt-border)",
};

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
      sourceBg: "rgba(10,102,194,0.15)",
      sourceBorder: "rgba(10,102,194,0.30)",
      sourceText: "#3B82C4",
    },
    {
      id: 2,
      role: "Staff Frontend Architect",
      company: "Vercel",
      location: "Remote",
      source: "Y Combinator",
      sourceBg: "rgba(255,102,0,0.15)",
      sourceBorder: "rgba(255,102,0,0.30)",
      sourceText: "#D4622A",
    },
    {
      id: 3,
      role: "Backend Python Engineer",
      company: "Linear",
      location: "New York, NY (Remote)",
      source: "Greenhouse",
      sourceBg: "rgba(36,180,126,0.15)",
      sourceBorder: "rgba(36,180,126,0.30)",
      sourceText: "#1A9068",
    },
  ];

  return (
    <div
      className="min-h-screen font-sans antialiased overflow-x-hidden transition-colors duration-150"
      style={{ backgroundColor: "var(--nt-bg-primary)", color: "var(--nt-text-primary)" }}
    >
      {/* ── Top Navigation Bar ───────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 backdrop-blur-md border-b transition-all"
        style={{
          backgroundColor: "var(--nt-bg-primary)",
          borderColor: "var(--nt-border)",
          boxShadow: "0 1px 12px 0 rgba(0,0,0,0.15)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div
              className="h-8 w-8 rounded-md border flex items-center justify-center"
              style={{ backgroundColor: "var(--nt-bg-card-alt)", borderColor: "var(--nt-border)" }}
            >
              <span className="font-mono font-bold text-sm" style={V.accentGold}>JB</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight" style={V.textPrimary}>
                Career Hub
              </span>
              <span className="text-[10px] uppercase font-mono tracking-widest" style={V.accentSage}>
                INDUSTRIAL_V2
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-xs font-medium transition-colors" style={V.textSecondary}
              onMouseEnter={e => e.target.style.color = "var(--nt-text-primary)"}
              onMouseLeave={e => e.target.style.color = "var(--nt-text-secondary)"}>
              Platform Features
            </a>
            <a href="#showcase" className="text-xs font-medium transition-colors" style={V.textSecondary}
              onMouseEnter={e => e.target.style.color = "var(--nt-text-primary)"}
              onMouseLeave={e => e.target.style.color = "var(--nt-text-secondary)"}>
              Architecture
            </a>
            <a href="#streaks" className="text-xs font-medium transition-colors" style={V.textSecondary}
              onMouseEnter={e => e.target.style.color = "var(--nt-text-primary)"}
              onMouseLeave={e => e.target.style.color = "var(--nt-text-secondary)"}>
              Telemetry Tracking
            </a>
            <a href="#analytics" className="text-xs font-medium transition-colors" style={V.textSecondary}
              onMouseEnter={e => e.target.style.color = "var(--nt-text-primary)"}
              onMouseLeave={e => e.target.style.color = "var(--nt-text-secondary)"}>
              Pipeline Analytics
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <ThemeToggle variant="button" />
            {user ? (
              <button
                onClick={() => navigate("/dashboard")}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md font-semibold text-xs transition-colors"
                style={{ backgroundColor: "var(--nt-accent-sage)", color: "var(--nt-btn-cta-text)" }}
              >
                Dashboard <FiArrowRight className="text-xs" />
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors"
                  style={{ backgroundColor: "var(--nt-btn-sec-bg)", borderColor: "var(--nt-border)", color: "var(--nt-text-secondary)" }}
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors"
                  style={{ backgroundColor: "var(--nt-accent-gold)", color: "var(--nt-btn-cta-text)" }}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section
        className="relative pt-14 pb-16 md:pt-20 md:pb-24 border-b"
        style={{ borderColor: "var(--nt-border)", backgroundColor: "var(--nt-bg-secondary)" }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">

          {/* Top Pill Badge */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-md border mb-6 font-mono text-[11px]"
            style={{ backgroundColor: "var(--nt-bg-card-alt)", borderColor: "var(--nt-border)" }}
          >
            <span className="flex h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: "var(--nt-accent-sage)" }} />
            <span style={V.textSecondary}>MULTI-PLATFORM TELEMETRY INGESTION</span>
            <span className="font-bold" style={V.accentGold}>1,000+ ROLES/DAY</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight max-w-3xl mx-auto leading-tight" style={V.textPrimary}>
            High-Density Engineering Pipeline &amp; Job Application Telemetry
          </h1>

          {/* Sub-headline */}
          <p className="mt-4 text-sm sm:text-base max-w-2xl mx-auto font-normal leading-relaxed" style={V.textSecondary}>
            Consolidate distributed job postings across LinkedIn, Y Combinator, and direct ATS boards into a precision-engineered developer tracking terminal.
          </p>

          {/* Call to Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/signup"
              className="w-full sm:w-auto px-5 py-2.5 rounded-md font-semibold text-xs transition-colors flex items-center justify-center gap-2"
              style={{ backgroundColor: "var(--nt-accent-gold)", color: "var(--nt-btn-cta-text)" }}
            >
              Initialize Workspace <FiArrowRight className="text-xs" />
            </Link>
            <a
              href="#showcase"
              className="w-full sm:w-auto px-5 py-2.5 rounded-md font-semibold text-xs border transition-colors flex items-center justify-center gap-2 font-mono"
              style={{ backgroundColor: "var(--nt-btn-sec-bg)", borderColor: "var(--nt-border)", color: "var(--nt-text-secondary)" }}
            >
              <FiTerminal className="text-xs" style={V.accentSage} />
              Inspect Pipeline Architecture
            </a>
          </div>

          {/* Quick trust metrics */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-5 text-xs font-mono" style={V.textMuted}>
            <span className="flex items-center gap-1.5"><FiCheckCircle style={V.accentSage} /> ZERO COST</span>
            <span className="flex items-center gap-1.5"><FiCheckCircle style={V.accentSage} /> AUTOMATED SYNC</span>
            <span className="flex items-center gap-1.5"><FiCheckCircle style={V.accentSage} /> NO TRACKING SCRIPTS</span>
          </div>
        </div>

        {/* ── Visual Showcase: Hub-and-Spoke ─────────────────────────────── */}
        <div id="showcase" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-14 relative z-10">
          <div className="text-center mb-6">
            <h2 className="text-[11px] font-mono font-bold uppercase tracking-wider mb-1" style={V.accentSage}>
              SYSTEM INTEGRATION
            </h2>
            <p className="text-lg font-semibold" style={V.textPrimary}>Aggregated Ingestion Feeds</p>
          </div>

          {/* Canvas */}
          <div
            className="relative rounded-lg border p-5 sm:p-7 overflow-hidden"
            style={{ backgroundColor: "var(--nt-bg-card)", borderColor: "var(--nt-border)", boxShadow: "0 4px 32px 0 rgba(0,0,0,0.15)" }}
          >
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">

              {/* Left Spoke */}
              <div className="lg:col-span-3 flex flex-col gap-2.5">
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider px-1" style={V.textMuted}>INGESTION SOURCES</div>

                {/* LinkedIn */}
                <div className="flex items-center justify-between p-2.5 rounded-md border" style={inputRowStyle}>
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded flex items-center justify-center" style={{ background: "rgba(10,102,194,0.18)", border: "1px solid rgba(10,102,194,0.35)", color: "#0A66C2" }}>
                      <SiLinkedin className="text-sm" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold" style={V.textPrimary}>LinkedIn</div>
                      <div className="text-[10px] font-mono" style={V.textMuted}>Tech Roles</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border" style={{ color: "var(--nt-accent-sage)", backgroundColor: "rgba(111,175,123,0.12)", borderColor: "rgba(111,175,123,0.25)" }}>LIVE</span>
                </div>

                {/* Y Combinator */}
                <div className="flex items-center justify-between p-2.5 rounded-md border" style={inputRowStyle}>
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded flex items-center justify-center" style={{ background: "rgba(255,102,0,0.18)", border: "1px solid rgba(255,102,0,0.35)", color: "#FF6600" }}>
                      <SiYcombinator className="text-sm" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold" style={V.textPrimary}>Y Combinator</div>
                      <div className="text-[10px] font-mono" style={V.textMuted}>Seed &amp; Series A</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border" style={{ color: "var(--nt-accent-sage)", backgroundColor: "rgba(111,175,123,0.12)", borderColor: "rgba(111,175,123,0.25)" }}>LIVE</span>
                </div>

                {/* Indeed */}
                <div className="flex items-center justify-between p-2.5 rounded-md border" style={inputRowStyle}>
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded flex items-center justify-center" style={{ background: "rgba(123,104,238,0.18)", border: "1px solid rgba(123,104,238,0.35)", color: "#7B68EE" }}>
                      <SiIndeed className="text-sm" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold" style={V.textPrimary}>Indeed &amp; Zip</div>
                      <div className="text-[10px] font-mono" style={V.textMuted}>Enterprise</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border" style={{ color: "var(--nt-accent-sage)", backgroundColor: "rgba(111,175,123,0.12)", borderColor: "rgba(111,175,123,0.25)" }}>LIVE</span>
                </div>
              </div>

              {/* Center Hub */}
              <div className="lg:col-span-6 flex flex-col">
                <div className="rounded-md border p-4 relative" style={{ backgroundColor: "var(--nt-bg-card-alt)", borderColor: "var(--nt-border)", boxShadow: "0 2px 16px 0 rgba(0,0,0,0.10)" }}>
                  <div className="flex items-center justify-between border-b pb-2.5 mb-3" style={{ borderColor: "var(--nt-border)" }}>
                    <span className="text-xs font-mono font-semibold" style={V.textPrimary}>FEED_MONITOR</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded border" style={{ color: "var(--nt-accent-sage)", backgroundColor: "rgba(111,175,123,0.12)", borderColor: "rgba(111,175,123,0.25)" }}>
                      <FiZap className="text-xs" /> REALTIME
                    </span>
                  </div>

                  {/* Search simulation */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 flex items-center gap-2 border rounded px-2.5 py-1 text-xs" style={{ backgroundColor: "var(--nt-bg-secondary)", borderColor: "var(--nt-border)", color: "var(--nt-text-muted)" }}>
                      <FiSearch style={V.textMuted} />
                      <span className="font-mono text-[11px]">Software Engineer, Remote...</span>
                    </div>
                  </div>

                  {/* Job Cards */}
                  <div className="space-y-2">
                    {sampleJobs.map((job) => (
                      <div key={job.id} className="rounded border p-2.5 text-left" style={cardStyle}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-xs font-semibold line-clamp-1" style={V.textPrimary}>{job.role}</h4>
                            <p className="text-[11px] font-mono" style={V.textMuted}>{job.company} • {job.location}</p>
                          </div>
                          <span
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded border flex-shrink-0"
                            style={{ color: job.sourceText, backgroundColor: job.sourceBg, borderColor: job.sourceBorder }}
                          >
                            {job.source}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between pt-1.5 border-t text-[11px] font-mono" style={{ borderColor: "var(--nt-border)" }}>
                          <span className="font-semibold" style={V.textSecondary}>{job.salary}</span>
                          <span className="font-semibold px-1.5 py-0.5 rounded" style={{ color: "var(--nt-accent-gold)", backgroundColor: "rgba(201,169,110,0.15)" }}>{job.match}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Status bar */}
                  <div className="mt-3 pt-2.5 border-t flex items-center justify-between text-[11px] font-mono" style={{ borderColor: "var(--nt-border)", color: "var(--nt-text-muted)" }}>
                    <span className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: "var(--nt-accent-sage)" }} />
                      STREAMS_ACTIVE
                    </span>
                    <span className="font-semibold" style={V.accentGold}>+32 DETECTED TODAY</span>
                  </div>
                </div>
              </div>

              {/* Right Spoke */}
              <div className="lg:col-span-3 flex flex-col gap-2.5">
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider px-1" style={V.textMuted}>DIRECT ATS PIPELINES</div>

                {/* Greenhouse */}
                <div className="flex items-center justify-between p-2.5 rounded-md border" style={inputRowStyle}>
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded flex items-center justify-center" style={{ background: "rgba(36,180,126,0.18)", border: "1px solid rgba(36,180,126,0.35)", color: "#24B47E" }}>
                      <FiBriefcase className="text-sm" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold" style={V.textPrimary}>Greenhouse</div>
                      <div className="text-[10px] font-mono" style={V.textMuted}>Direct ATS</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border" style={{ color: "var(--nt-accent-sage)", backgroundColor: "rgba(111,175,123,0.12)", borderColor: "rgba(111,175,123,0.25)" }}>LIVE</span>
                </div>

                {/* Lever */}
                <div className="flex items-center justify-between p-2.5 rounded-md border" style={inputRowStyle}>
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded flex items-center justify-center" style={{ background: "rgba(224,123,160,0.18)", border: "1px solid rgba(224,123,160,0.35)", color: "#E07BA0" }}>
                      <FiLayers className="text-sm" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold" style={V.textPrimary}>Lever / Ashby</div>
                      <div className="text-[10px] font-mono" style={V.textMuted}>Fast Sync</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border" style={{ color: "var(--nt-accent-sage)", backgroundColor: "rgba(111,175,123,0.12)", borderColor: "rgba(111,175,123,0.25)" }}>LIVE</span>
                </div>

                {/* Glassdoor */}
                <div className="flex items-center justify-between p-2.5 rounded-md border" style={inputRowStyle}>
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded flex items-center justify-center" style={{ background: "rgba(76,175,130,0.18)", border: "1px solid rgba(76,175,130,0.35)", color: "#4CAF82" }}>
                      <SiGlassdoor className="text-sm" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold" style={V.textPrimary}>Glassdoor</div>
                      <div className="text-[10px] font-mono" style={V.textMuted}>Reviews &amp; Org</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border" style={{ color: "var(--nt-accent-sage)", backgroundColor: "rgba(111,175,123,0.12)", borderColor: "rgba(111,175,123,0.25)" }}>LIVE</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ── Core Value Props Grid ─────────────────────────────────────────── */}
      <section id="features" className="py-16 md:py-20 border-b relative" style={{ borderColor: "var(--nt-border)", backgroundColor: "var(--nt-bg-primary)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-[11px] font-mono font-bold uppercase tracking-wider mb-2" style={V.accentSage}>CORE MODULES</h2>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight" style={V.textPrimary}>
              Engineered for Precision &amp; High Consistency
            </h3>
            <p className="mt-2.5 text-xs sm:text-sm" style={V.textSecondary}>
              Replace fragmented bookmarks and chaotic spreadsheets with structured pipeline telemetry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* Card 1: Unified Market Feed */}
            <div className="rounded-lg border p-5 flex flex-col justify-between" style={cardStyle}>
              <div>
                <div className="h-36 rounded-md border p-3 mb-4 flex flex-col justify-center" style={insetStyle}>
                  <div className="space-y-1.5 font-mono text-[11px]">
                    {[
                      { label: "Staff React Dev",  val: "99%",  valStyle: V.accentSage },
                      { label: "AI Platform Eng",  val: "NEW",  valStyle: V.accentGold },
                      { label: "Lead Backend Dev", val: "AUTO", valStyle: V.textMuted, dim: true },
                    ].map(({ label, val, valStyle, dim }) => (
                      <div key={label} className={`flex items-center justify-between p-1.5 rounded border${dim ? " opacity-70" : ""}`} style={inputRowStyle}>
                        <span style={V.textSecondary}>{label}</span>
                        <span className="font-bold" style={valStyle}>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Sky blue compass icon */}
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-md mb-3" style={{ background: "rgba(82,175,220,0.18)", border: "1px solid rgba(82,175,220,0.35)", color: "#52AFDC" }}>
                  <FiCompass size={16} />
                </div>
                <h4 className="text-sm font-semibold" style={V.textPrimary}>1. Unified Market Feed</h4>
                <p className="mt-1.5 text-xs leading-relaxed" style={V.textSecondary}>
                  Real-time opportunities collected across major platforms. One clean inbox for engineering, data, and infrastructure roles.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t flex items-center text-xs font-semibold" style={{ borderColor: "var(--nt-border)", color: "var(--nt-accent-sage)" }}>
                Explore postings <FiChevronRight className="ml-1" />
              </div>
            </div>

            {/* Card 2: Streak Telemetry */}
            <div id="streaks" className="rounded-lg border p-5 flex flex-col justify-between" style={cardStyle}>
              <div>
                <div className="h-36 rounded-md border p-3 mb-4 flex flex-col justify-between" style={insetStyle}>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold" style={V.textPrimary}>🔥 14 DAYS STREAK</span>
                    <span className="text-[10px]" style={V.textMuted}>DAILY COMMIT</span>
                  </div>
                  <div className="flex gap-1 justify-center py-1">
                    {SAMPLE_HEATMAP.map((col, cIdx) => (
                      <div key={cIdx} className="flex flex-col gap-1">
                        {col.slice(0, 5).map((val, rIdx) => (
                          <div key={rIdx} className="h-2 w-2" style={getHeatStyle(val)} />
                        ))}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono" style={V.textMuted}>
                    <span>M-S</span>
                    <div className="flex items-center gap-1">
                      <span>LESS</span>
                      <span className="h-1.5 w-1.5 rounded-sm" style={{ backgroundColor: "var(--nt-border)" }} />
                      <span className="h-1.5 w-1.5 rounded-sm" style={{ backgroundColor: "var(--nt-accent-sage)" }} />
                      <span>MORE</span>
                    </div>
                  </div>
                </div>
                {/* Coral activity icon */}
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-md mb-3" style={{ background: "rgba(224,123,100,0.18)", border: "1px solid rgba(224,123,100,0.35)", color: "#E07B64" }}>
                  <FiActivity size={16} />
                </div>
                <h4 className="text-sm font-semibold" style={V.textPrimary}>2. Streak Telemetry</h4>
                <p className="mt-1.5 text-xs leading-relaxed" style={V.textSecondary}>
                  Maintain consistency with GitHub-style contribution calendars and daily momentum tracking.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t flex items-center text-xs font-semibold" style={{ borderColor: "var(--nt-border)", color: "var(--nt-accent-sage)" }}>
                View telemetry <FiChevronRight className="ml-1" />
              </div>
            </div>

            {/* Card 3: Stage Breakdown */}
            <div id="analytics" className="rounded-lg border p-5 flex flex-col justify-between" style={cardStyle}>
              <div>
                <div className="h-36 rounded-md border p-2 mb-4 flex items-center justify-center relative" style={insetStyle}>
                  <ResponsiveContainer width="100%" height={120}>
                    <PieChart>
                      <Pie data={STATUS_DATA} cx="50%" cy="50%" innerRadius={30} outerRadius={48} paddingAngle={3} dataKey="value">
                        {STATUS_DATA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="rounded border px-2 py-1 text-[10px] font-mono" style={{ backgroundColor: "var(--nt-bg-card)", borderColor: "var(--nt-border)" }}>
                                <span style={V.textSecondary}>{payload[0].name}: </span>
                                <span className="font-bold" style={V.accentGold}>{payload[0].value}</span>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute text-center pointer-events-none">
                    <div className="text-xs font-mono font-bold" style={V.textPrimary}>29</div>
                    <div className="text-[8px] font-mono uppercase" style={V.textMuted}>TOTAL</div>
                  </div>
                </div>
                {/* Gold pie icon */}
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-md mb-3" style={{ background: "rgba(201,169,110,0.18)", border: "1px solid rgba(201,169,110,0.35)", color: "var(--nt-accent-gold)" }}>
                  <FiPieChart size={16} />
                </div>
                <h4 className="text-sm font-semibold" style={V.textPrimary}>3. Stage Breakdown</h4>
                <p className="mt-1.5 text-xs leading-relaxed" style={V.textSecondary}>
                  Monitor submission to offer conversion rates without neon distraction or pastel fluff.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t flex items-center text-xs font-semibold" style={{ borderColor: "var(--nt-border)", color: "var(--nt-accent-sage)" }}>
                View charts <FiChevronRight className="ml-1" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────────────────── */}
      <section className="py-14 border-b" style={{ borderColor: "var(--nt-border)", backgroundColor: "var(--nt-bg-cta-section)" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded border text-[11px] font-mono mb-4" style={{ backgroundColor: "var(--nt-bg-card-alt)", borderColor: "var(--nt-border)", color: "var(--nt-text-secondary)" }}>
            <FiZap style={V.accentGold} /> INDUSTRIAL PRECISION DASHBOARD
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold tracking-tight" style={V.textPrimary}>
            Structure your application workflow like a production pipeline.
          </h3>
          <p className="mt-3 text-xs sm:text-sm max-w-xl mx-auto" style={V.textSecondary}>
            Join engineers using Career Hub to maintain daily momentum and execute structured interview preparation.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/signup"
              className="w-full sm:w-auto px-5 py-2.5 rounded-md font-semibold text-xs transition-colors flex items-center justify-center gap-2"
              style={{ backgroundColor: "var(--nt-accent-gold)", color: "var(--nt-btn-cta-text)" }}
            >
              Initialize Free Account <FiArrowRight className="text-xs" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-5 py-2.5 rounded-md font-semibold text-xs border transition-colors"
              style={{ backgroundColor: "var(--nt-btn-sec-bg)", borderColor: "var(--nt-border)", color: "var(--nt-text-secondary)" }}
            >
              Sign In Existing Session
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="py-8 border-t" style={{ borderColor: "var(--nt-border)", backgroundColor: "var(--nt-bg-primary)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 rounded border flex items-center justify-center" style={{ backgroundColor: "var(--nt-bg-card-alt)", borderColor: "var(--nt-border)" }}>
              <span className="font-mono font-bold text-[10px]" style={V.accentGold}>JB</span>
            </div>
            <span className="text-xs font-semibold" style={V.textPrimary}>Career Hub</span>
            <span className="text-[11px] font-mono" style={V.textMuted}>© {new Date().getFullYear()} INDUSTRIAL TERMINAL</span>
          </div>
          <div className="flex items-center gap-5 text-xs" style={V.textMuted}>
            <a href="#features" className="transition-colors hover:opacity-80">Features</a>
            <a href="#showcase" className="transition-colors hover:opacity-80">Architecture</a>
            <Link to="/login" className="transition-colors hover:opacity-80">Log In</Link>
            <Link to="/signup" className="transition-colors hover:opacity-80">Sign Up</Link>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;

