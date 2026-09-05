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
  <div className="flex flex-col gap-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors cursor-pointer">
    <div className="flex items-center justify-between">
      <span className="inline-flex items-center gap-1 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 px-2 py-0.5 text-[10px] font-mono text-zinc-700 dark:text-zinc-300">
        {tip.icon} {tip.category}
      </span>
      <button className="text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
        <CiBookmark size={16} />
      </button>
    </div>
    <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-snug">{tip.title}</h3>
    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2">{tip.excerpt}</p>
    <div className="flex items-center justify-between mt-auto pt-2 border-t border-zinc-100 dark:border-zinc-800/80 font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
      <span>{tip.author}</span>
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
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#09090B] px-4 py-6 md:px-6 lg:px-8 text-zinc-900 dark:text-zinc-100 transition-colors">
      <div className="mx-auto max-w-7xl flex flex-col gap-5">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-1 border-b border-zinc-200 dark:border-zinc-800/80">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Engineering Career Playbooks</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">High-signal interview guides, resume optimization, and compensation frameworks</p>
          </div>
        </div>

        {/* ── Stats Row (Strict Monochromatic) ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {STATS.map((s, i) => (
            <div key={i} className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 transition-colors hover:border-zinc-300 dark:hover:border-zinc-700">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold font-mono text-zinc-950 dark:text-zinc-50">{s.value}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/60">{s.badge}</span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-snug">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Main Grid ── */}
        <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[2fr,1fr]">

          {/* ── Left Column ── */}
          <div className="flex flex-col gap-5">

            {/* Featured Article */}
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-mono font-medium text-emerald-600 dark:text-emerald-400">
                  ⭐ {FEATURED.tag}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-500 dark:text-zinc-400 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5">
                  {FEATURED.category}
                </span>
              </div>
              <h2 className="text-base font-bold text-zinc-950 dark:text-zinc-50 leading-snug mb-2">{FEATURED.title}</h2>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">{FEATURED.excerpt}</p>
              <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <div className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">{FEATURED.author}</span> · {FEATURED.date} · {FEATURED.readTime}
                </div>
                <button className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 px-3.5 py-1.5 text-xs font-medium text-white transition-colors">
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
                  className={`rounded-md px-3 py-1 text-xs font-mono transition-colors ${
                    activeCategory === cat
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-semibold"
                      : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700"
                  }`}
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
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  <BsLightningCharge size={12} />
                </span>
                <h3 className="text-xs font-bold uppercase font-mono text-zinc-900 dark:text-zinc-100">Telemetry Principles</h3>
              </div>
              <div className="space-y-2.5">
                {QUICK_TIPS.map((q, i) => (
                  <div key={q.id} className="flex gap-2.5 rounded-md border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/50 p-2.5">
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-zinc-200 dark:bg-zinc-800 text-[10px] font-mono font-bold text-zinc-700 dark:text-zinc-300 flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">{q.tip}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Newsletter / Briefing */}
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
              <h3 className="text-xs font-bold uppercase font-mono text-zinc-900 dark:text-zinc-100 mb-1">Weekly Engineering Dispatch</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3 leading-relaxed">
                Curated market signals, algorithmic compensation breakdowns, and hiring benchmarks.
              </p>
              <input
                type="email"
                placeholder="developer@company.com"
                className="w-full px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 mb-2"
              />
              <button className="w-full rounded-md bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 py-2 text-xs font-medium text-white transition-colors">
                Subscribe to Dispatch
              </button>
            </div>

            {/* Topics */}
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
              <h3 className="text-xs font-bold uppercase font-mono text-zinc-900 dark:text-zinc-100 mb-3">Topic Index</h3>
              <div className="flex flex-wrap gap-1.5">
                {["Resume Architecture", "Total Comp", "Distributed Systems", "System Design Loops", "Career Velocity", "Referral Protocol", "Contracting", "Engineering Leadership"].map((topic) => (
                  <button
                    key={topic}
                    className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 px-2.5 py-1 text-[11px] font-mono text-zinc-600 dark:text-zinc-300 hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
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


