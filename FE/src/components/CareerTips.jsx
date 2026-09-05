import React, { useState } from "react";
import { CiCalendarDate, CiBookmark, CiClock2 } from "react-icons/ci";
import { BsLightningCharge, BsBriefcase, BsPeople, BsGraphUpArrow } from "react-icons/bs";
import { HiArrowRight } from "react-icons/hi";

const CATEGORIES = ["All", "Resume", "Interviews", "Networking", "Career Growth", "Salary"];

const FEATURED = {
  id: "f1",
  category: "Interviews",
  title: "Engineering the Interview: Framework for 'Tell Me About Yourself'",
  excerpt: "This single question opens almost every technical interview. Learn the 3-part structured framework top engineers use to establish credibility and project leadership.",
  author: "Sarah Mitchell",
  date: "Jul 10, 2025",
  readTime: "6 min read",
  tag: "Featured Guide",
};

const TIPS = [
  {
    id: "t1", category: "Resume",
    title: "7 Resume Anti-Patterns That Trigger Instant Rejection",
    excerpt: "Engineering recruiters spend under 10 seconds on an initial scan. Eliminate generic buzzwords, unquantified bullets, and outdated formatting.",
    author: "James Okafor", date: "Jul 8, 2025", readTime: "5 min read",
    icon: <BsBriefcase size={14} />,
  },
  {
    id: "t2", category: "Networking",
    title: "Direct Outreach Frameworks With Verified High Response Rates",
    excerpt: "Cold messages without context fail. Here are structured 3-line templates engineered to connect directly with engineering hiring managers.",
    author: "Priya Nair", date: "Jul 6, 2025", readTime: "4 min read",
    icon: <BsPeople size={14} />,
  },
  {
    id: "t3", category: "Salary",
    title: "Total Compensation Negotiation Without Offer Risk",
    excerpt: "Understand equity vesting, sign-on bands, and base compensation floors. Learn the exact negotiation scripts backed by market data.",
    author: "David Chen", date: "Jul 4, 2025", readTime: "7 min read",
    icon: <BsGraphUpArrow size={14} />,
  },
  {
    id: "t4", category: "Career Growth",
    title: "The 90-Day Execution Roadmap for New Engineering Hires",
    excerpt: "The first 90 days define your team trajectory. Focus on codebase velocity, unblocking peers, and establishing ownership early.",
    author: "Aisha Patel", date: "Jul 2, 2025", readTime: "8 min read",
    icon: <BsLightningCharge size={14} />,
  },
  {
    id: "t5", category: "Interviews",
    title: "STAR Matrix for Complex Behavioral Systems Scenarios",
    excerpt: "Structure conflict, architecture tradeoffs, and project failures into concise, high-signal narratives for principal panel loops.",
    author: "Sarah Mitchell", date: "Jun 30, 2025", readTime: "5 min read",
    icon: <BsBriefcase size={14} />,
  },
  {
    id: "t6", category: "Resume",
    title: "ATS Ingestion & Keyword Parsing Architecture",
    excerpt: "How modern ATS parsers interpret semantic schemas, skill vectors, and bullet metrics. Maximize machine read rate effortlessly.",
    author: "James Okafor", date: "Jun 28, 2025", readTime: "6 min read",
    icon: <BsBriefcase size={14} />,
  },
];

const QUICK_TIPS = [
  { id: "q1", tip: "Align resume keyword tokens directly with requirements in the job description." },
  { id: "q2", tip: "Send a structured technical follow-up note within 24 hours of panel completion." },
  { id: "q3", tip: "Quantify impact with hard metrics (e.g. latency reduced by 40%, revenue +$2M)." },
  { id: "q4", tip: "Inspect company GitHub repos, blogs, or quarterly filings prior to architectural rounds." },
  { id: "q5", tip: "Anchor compensation talks around total verified market compensation data bands." },
];

const STATS = [
  { value: "85%", label: "Roles filled via direct referral", badge: "Referrals" },
  { value: "7s",  label: "Average recruiter initial scan",  badge: "Scan Time" },
  { value: "20%", label: "Average increase via negotiation",badge: "Comp Delta" },
  { value: "3.2×",label: "Response rate with tailored CV",  badge: "Conversion" },
];

const TipCard = ({ tip }) => (
  <div
    className="flex flex-col gap-2.5 rounded-lg border p-4 transition-colors cursor-pointer"
    style={{
      backgroundColor: "var(--nt-bg-card)",
      borderColor: "var(--nt-border)",
      boxShadow: "var(--nt-shadow-sm)",
    }}
  >
    <div className="flex items-center justify-between">
      <span
        className="inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-mono"
        style={{
          backgroundColor: "var(--nt-bg-secondary)",
          borderColor: "var(--nt-border)",
          color: "var(--nt-text-primary)",
        }}
      >
        {tip.icon} {tip.category}
      </span>
      <button className="transition-colors" style={{ color: "var(--nt-text-muted)" }}>
        <CiBookmark size={16} />
      </button>
    </div>
    <h3 className="text-xs font-bold leading-snug" style={{ color: "var(--nt-text-primary)" }}>{tip.title}</h3>
    <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "var(--nt-text-secondary)" }}>{tip.excerpt}</p>
    <div className="flex items-center justify-between mt-auto pt-2 border-t font-mono text-[10px]" style={{ borderColor: "var(--nt-border)", color: "var(--nt-text-muted)" }}>
      <span style={{ color: "var(--nt-text-secondary)" }}>{tip.author}</span>
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1"><CiCalendarDate size={11} />{tip.date}</span>
        <span className="flex items-center gap-1"><CiClock2 size={11} />{tip.readTime}</span>
      </div>
    </div>
  </div>
);

const CareerTips = () => {
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = activeCategory === "All"
    ? TIPS
    : TIPS.filter(t => t.category === activeCategory);

  return (
    <div className="min-h-screen px-4 py-6 md:px-6 lg:px-8 transition-colors" style={{ backgroundColor: "var(--nt-bg-primary)", color: "var(--nt-text-primary)" }}>
      <div className="mx-auto max-w-7xl flex flex-col gap-5">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-1 border-b" style={{ borderColor: "var(--nt-border)" }}>
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--nt-text-primary)" }}>Engineering Career Playbooks</h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--nt-text-secondary)" }}>High-signal interview guides, resume optimization, and compensation frameworks</p>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {STATS.map((s, i) => (
            <div
              key={i}
              className="rounded-lg border p-4 transition-colors"
              style={{
                backgroundColor: "var(--nt-bg-card)",
                borderColor: "var(--nt-border)",
                boxShadow: "var(--nt-shadow-sm)",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold font-mono" style={{ color: "var(--nt-text-primary)" }}>{s.value}</span>
                <span
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded border"
                  style={{
                    backgroundColor: "var(--nt-bg-secondary)",
                    borderColor: "var(--nt-border)",
                    color: "var(--nt-accent-gold)",
                  }}
                >
                  {s.badge}
                </span>
              </div>
              <p className="text-xs mt-1 leading-snug" style={{ color: "var(--nt-text-secondary)" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Main Grid ── */}
        <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[2fr,1fr]">

          {/* ── Left Column ── */}
          <div className="flex flex-col gap-5">

            {/* Featured Article */}
            <div
              className="rounded-lg border p-5 overflow-hidden"
              style={{
                backgroundColor: "var(--nt-bg-card)",
                borderColor: "var(--nt-border)",
                boxShadow: "var(--nt-shadow-sm)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className="inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-mono font-medium"
                  style={{
                    backgroundColor: "rgba(201, 169, 110, 0.15)",
                    borderColor: "rgba(201, 169, 110, 0.3)",
                    color: "var(--nt-accent-gold)",
                  }}
                >
                  ⭐ {FEATURED.tag}
                </span>
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-mono rounded border px-2 py-0.5"
                  style={{
                    backgroundColor: "var(--nt-bg-secondary)",
                    borderColor: "var(--nt-border)",
                    color: "var(--nt-text-secondary)",
                  }}
                >
                  {FEATURED.category}
                </span>
              </div>
              <h2 className="text-base font-bold leading-snug mb-2" style={{ color: "var(--nt-text-primary)" }}>{FEATURED.title}</h2>
              <p className="text-xs leading-relaxed mb-4" style={{ color: "var(--nt-text-secondary)" }}>{FEATURED.excerpt}</p>
              <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: "var(--nt-border)" }}>
                <div className="font-mono text-[10px]" style={{ color: "var(--nt-text-muted)" }}>
                  <span className="font-medium" style={{ color: "var(--nt-text-primary)" }}>{FEATURED.author}</span> · {FEATURED.date} · {FEATURED.readTime}
                </div>
                <button
                  className="inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: "var(--nt-accent-gold)",
                    color: "var(--nt-btn-cta-text)",
                  }}
                >
                  Read Guide <HiArrowRight size={12} />
                </button>
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="rounded-md px-3 py-1 text-xs font-mono transition-colors"
                  style={
                    activeCategory === cat
                      ? {
                          backgroundColor: "var(--nt-accent-gold)",
                          color: "var(--nt-btn-cta-text)",
                          fontWeight: "600",
                        }
                      : {
                          backgroundColor: "var(--nt-bg-card)",
                          borderColor: "var(--nt-border)",
                          borderWidth: "1px",
                          color: "var(--nt-text-secondary)",
                        }
                  }
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Tips Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filtered.map((tip) => <TipCard key={tip.id} tip={tip} />)}
            </div>
          </div>

          {/* ── Right Column ── */}
          <div className="flex flex-col gap-4">

            {/* Quick Tips */}
            <div
              className="rounded-lg border p-4"
              style={{
                backgroundColor: "var(--nt-bg-card)",
                borderColor: "var(--nt-border)",
                boxShadow: "var(--nt-shadow-sm)",
              }}
            >
              <div className="flex items-center gap-2 mb-3 pb-2 border-b" style={{ borderColor: "var(--nt-border)" }}>
                <span
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md border"
                  style={{
                    backgroundColor: "var(--nt-bg-secondary)",
                    borderColor: "var(--nt-border)",
                    color: "var(--nt-accent-gold)",
                  }}
                >
                  <BsLightningCharge size={12} />
                </span>
                <h3 className="text-xs font-bold uppercase font-mono" style={{ color: "var(--nt-text-primary)" }}>Telemetry Principles</h3>
              </div>
              <div className="space-y-2.5">
                {QUICK_TIPS.map((q, i) => (
                  <div
                    key={q.id}
                    className="flex gap-2.5 rounded-md border p-2.5"
                    style={{
                      backgroundColor: "var(--nt-bg-card-alt)",
                      borderColor: "var(--nt-border)",
                    }}
                  >
                    <span
                      className="inline-flex h-4 w-4 items-center justify-center rounded text-[10px] font-mono font-bold flex-shrink-0 mt-0.5"
                      style={{
                        backgroundColor: "var(--nt-bg-secondary)",
                        color: "var(--nt-text-primary)",
                      }}
                    >
                      {i + 1}
                    </span>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--nt-text-secondary)" }}>{q.tip}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Newsletter / Briefing */}
            <div
              className="rounded-lg border p-4"
              style={{
                backgroundColor: "var(--nt-bg-card)",
                borderColor: "var(--nt-border)",
                boxShadow: "var(--nt-shadow-sm)",
              }}
            >
              <h3 className="text-xs font-bold uppercase font-mono mb-1" style={{ color: "var(--nt-text-primary)" }}>Weekly Engineering Dispatch</h3>
              <p className="text-xs mb-3 leading-relaxed" style={{ color: "var(--nt-text-secondary)" }}>
                Curated market signals, algorithmic compensation breakdowns, and hiring benchmarks.
              </p>
              <input
                type="email"
                placeholder="developer@company.com"
                className="w-full px-3 py-2 rounded-md border text-xs focus:outline-none mb-2"
                style={{
                  backgroundColor: "var(--nt-bg-card-alt)",
                  borderColor: "var(--nt-border)",
                  color: "var(--nt-text-primary)",
                }}
              />
              <button
                className="w-full rounded-md py-2 text-xs font-medium transition-colors"
                style={{
                  backgroundColor: "var(--nt-accent-gold)",
                  color: "var(--nt-btn-cta-text)",
                }}
              >
                Subscribe to Dispatch
              </button>
            </div>

            {/* Topics */}
            <div
              className="rounded-lg border p-4"
              style={{
                backgroundColor: "var(--nt-bg-card)",
                borderColor: "var(--nt-border)",
                boxShadow: "var(--nt-shadow-sm)",
              }}
            >
              <h3 className="text-xs font-bold uppercase font-mono mb-3" style={{ color: "var(--nt-text-primary)" }}>Topic Index</h3>
              <div className="flex flex-wrap gap-1.5">
                {["Resume Architecture", "Total Comp", "Distributed Systems", "System Design Loops", "Career Velocity", "Referral Protocol", "Contracting", "Engineering Leadership"].map((topic) => (
                  <button
                    key={topic}
                    className="rounded-md border px-2.5 py-1 text-[11px] font-mono transition-colors"
                    style={{
                      backgroundColor: "var(--nt-bg-secondary)",
                      borderColor: "var(--nt-border)",
                      color: "var(--nt-text-secondary)",
                    }}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerTips;
