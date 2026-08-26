import React, { useState } from "react";
import { CiCalendarDate, CiBookmark, CiClock2 } from "react-icons/ci";
import { BsLightningCharge, BsBriefcase, BsPeople, BsGraphUpArrow } from "react-icons/bs";
import { HiArrowRight } from "react-icons/hi";

// ── Dummy Data ─────────────────────────────────────────────────────────────

const CATEGORIES = ["All", "Resume", "Interviews", "Networking", "Career Growth", "Salary"];

const FEATURED = {
  id: "f1",
  category: "Interviews",
  title: "How to Answer 'Tell Me About Yourself' Like a Pro",
  excerpt: "This single question opens almost every interview — yet most candidates fumble it. Learn the 3-part framework that top candidates use to make a memorable first impression.",
  author: "Sarah Mitchell",
  date: "Jul 10, 2025",
  readTime: "6 min read",
  tag: "Most Read",
  tagColor: "bg-[#eef2ff] text-[#4f46e5]",
};

const TIPS = [
  {
    id: "t1", category: "Resume",
    title: "7 Resume Mistakes That Get You Rejected Instantly",
    excerpt: "Recruiters spend an average of 7 seconds on a resume. Make sure yours doesn't have any of these common deal-breakers.",
    author: "James Okafor", date: "Jul 8, 2025", readTime: "5 min read",
    icon: <BsBriefcase size={16} />, color: "bg-emerald-50 text-emerald-700",
  },
  {
    id: "t2", category: "Networking",
    title: "LinkedIn Outreach Templates That Actually Get Replies",
    excerpt: "Cold messages get ignored 90% of the time. Here are 5 proven templates that feel personal and get responses from hiring managers.",
    author: "Priya Nair", date: "Jul 6, 2025", readTime: "4 min read",
    icon: <BsPeople size={16} />, color: "bg-amber-50 text-amber-700",
  },
  {
    id: "t3", category: "Salary",
    title: "How to Negotiate Your Salary Without Losing the Offer",
    excerpt: "Most people leave money on the table because they're afraid to negotiate. This step-by-step guide shows you exactly what to say.",
    author: "David Chen", date: "Jul 4, 2025", readTime: "7 min read",
    icon: <BsGraphUpArrow size={16} />, color: "bg-rose-50 text-rose-600",
  },
  {
    id: "t4", category: "Career Growth",
    title: "The 90-Day Plan to Get Promoted at Your New Job",
    excerpt: "Starting a new role? The first 90 days set the tone for your entire tenure. Here's how to make them count.",
    author: "Aisha Patel", date: "Jul 2, 2025", readTime: "8 min read",
    icon: <BsLightningCharge size={16} />, color: "bg-[#eef2ff] text-[#4f46e5]",
  },
  {
    id: "t5", category: "Interviews",
    title: "STAR Method: The Only Framework You Need for Behavioural Questions",
    excerpt: "Situation, Task, Action, Result — master this structure and you'll never be caught off guard by a behavioural question again.",
    author: "Sarah Mitchell", date: "Jun 30, 2025", readTime: "5 min read",
    icon: <BsBriefcase size={16} />, color: "bg-sky-50 text-sky-700",
  },
  {
    id: "t6", category: "Resume",
    title: "ATS-Proof Your Resume: A Complete Checklist",
    excerpt: "Over 75% of resumes are rejected by ATS before a human ever sees them. Use this checklist to make sure yours gets through.",
    author: "James Okafor", date: "Jun 28, 2025", readTime: "6 min read",
    icon: <BsBriefcase size={16} />, color: "bg-purple-50 text-purple-700",
  },
];

const QUICK_TIPS = [
  { id: "q1", tip: "Tailor your resume keywords to each job description — ATS systems scan for exact matches." },
  { id: "q2", tip: "Follow up within 24 hours after every interview with a personalised thank-you email." },
  { id: "q3", tip: "Quantify your achievements — numbers make your impact 40% more memorable to recruiters." },
  { id: "q4", tip: "Research the company's recent news before any interview to show genuine interest." },
  { id: "q5", tip: "Ask for the salary range before disclosing your expectations — it gives you leverage." },
];

const STATS = [
  { value: "85%", label: "of jobs are filled through networking", color: "bg-[#eef2ff] text-[#4f46e5]" },
  { value: "7s",  label: "average recruiter time on a resume",    color: "bg-amber-50 text-amber-700"   },
  { value: "20%", label: "higher salary with negotiation",        color: "bg-emerald-50 text-emerald-700"},
  { value: "3×",  label: "more interviews with a tailored resume",color: "bg-rose-50 text-rose-600"     },
];

// ── Sub-components ─────────────────────────────────────────────────────────

const TipCard = ({ tip }) => (
  <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md hover:border-[#4f46e5]/20 transition-all duration-200 cursor-pointer">
    <div className="flex items-center justify-between">
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${tip.color}`}>
        {tip.icon} {tip.category}
      </span>
      <button className="text-slate-300 hover:text-[#4f46e5] transition-colors">
        <CiBookmark size={18} />
      </button>
    </div>
    <h3 className="text-sm font-semibold text-slate-800 leading-snug">{tip.title}</h3>
    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{tip.excerpt}</p>
    <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50">
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 rounded-full bg-[#eef2ff] flex items-center justify-center text-[10px] font-bold text-[#4f46e5]">
          {tip.author.split(" ").map(w => w[0]).join("")}
        </div>
        <span className="text-[11px] text-slate-400">{tip.author}</span>
      </div>
      <div className="flex items-center gap-2 text-[11px] text-slate-400">
        <span className="flex items-center gap-1"><CiCalendarDate size={13} />{tip.date}</span>
        <span className="flex items-center gap-1"><CiClock2 size={13} />{tip.readTime}</span>
      </div>
    </div>
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────

const CareerTips = () => {
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = activeCategory === "All"
    ? TIPS
    : TIPS.filter(t => t.category === activeCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f3f4ff] via-[#f6f7ff] to-[#e9f0ff] px-4 py-6 md:px-8 lg:px-6 lg:py-5 text-slate-900">
      <div className="mx-auto max-w-6xl flex flex-col gap-6">

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((s, i) => (
            <div key={i} className={`rounded-3xl border-2 border-slate-100 p-4 shadow-lg shadow-slate-200/60 ${s.color}`}>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-[11px] font-medium mt-1 opacity-80 leading-snug">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Main Grid ── */}
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[2fr,1fr]">

          {/* ── Left Column ── */}
          <div className="flex flex-col gap-5">

            {/* Featured Article */}
            <div className="rounded-3xl border-2 border-slate-200/80 bg-white/60 backdrop-blur-sm shadow-xl shadow-slate-200/60 overflow-hidden">
              <div className="h-3 w-full bg-[linear-gradient(135deg,#03001e,#7303c0,#ec38bc,#fdeff9)]" />
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${FEATURED.tagColor}`}>
                    ⭐ {FEATURED.tag}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 rounded-full bg-slate-50 border border-slate-100 px-2.5 py-1">
                    {FEATURED.category}
                  </span>
                </div>
                <h2 className="text-lg font-semibold text-slate-900 leading-snug mb-2">{FEATURED.title}</h2>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">{FEATURED.excerpt}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-[#eef2ff] flex items-center justify-center text-[11px] font-bold text-[#4f46e5]">
                      {FEATURED.author.split(" ").map(w => w[0]).join("")}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-700">{FEATURED.author}</p>
                      <p className="text-[11px] text-slate-400">{FEATURED.date} · {FEATURED.readTime}</p>
                    </div>
                  </div>
                  <button className="inline-flex items-center gap-1.5 rounded-full bg-[#4f46e5] px-4 py-2 text-xs font-medium text-white hover:bg-[#4338ca] transition-colors shadow-sm">
                    Read Article <HiArrowRight size={12} />
                  </button>
                </div>
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                    activeCategory === cat
                      ? "bg-[#4f46e5] text-white shadow-sm"
                      : "bg-white/70 border border-slate-200 text-slate-600 hover:border-[#4f46e5]/40 hover:text-[#4f46e5]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Tips Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered.map((tip) => <TipCard key={tip.id} tip={tip} />)}
            </div>
          </div>

          {/* ── Right Column ── */}
          <div className="flex flex-col gap-5">

            {/* Quick Tips */}
            <div className="rounded-3xl border-2 border-slate-200/80 bg-white/60 backdrop-blur-sm shadow-xl shadow-slate-200/60 p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-[#eef2ff] text-[#4f46e5]">
                  <BsLightningCharge size={14} />
                </span>
                <h3 className="text-sm font-semibold text-slate-800">Quick Tips</h3>
              </div>
              <div className="space-y-3">
                {QUICK_TIPS.map((q, i) => (
                  <div key={q.id} className="flex gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#eef2ff] text-[10px] font-bold text-[#4f46e5] flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-xs text-slate-600 leading-relaxed">{q.tip}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Newsletter CTA */}
            <div className="rounded-3xl overflow-hidden border-2 border-slate-200/80 shadow-xl shadow-slate-200/60">
              <div className="h-2 bg-[linear-gradient(135deg,#03001e,#7303c0,#ec38bc,#fdeff9)]" />
              <div className="bg-white/60 backdrop-blur-sm p-5">
                <h3 className="text-sm font-semibold text-slate-800 mb-1">Weekly Career Digest</h3>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Get the best career tips, job market insights, and interview prep delivered to your inbox every Monday.
                </p>
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-white/80 text-xs text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/10 transition-all mb-2.5"
                />
                <button className="w-full rounded-2xl bg-[#4f46e5] py-2.5 text-xs font-medium text-white hover:bg-[#4338ca] transition-colors shadow-sm">
                  Subscribe — It's Free
                </button>
              </div>
            </div>

            {/* Popular Topics */}
            <div className="rounded-3xl border-2 border-slate-200/80 bg-white/60 backdrop-blur-sm shadow-xl shadow-slate-200/60 p-5">
              <h3 className="text-sm font-semibold text-slate-800 mb-4">Popular Topics</h3>
              <div className="flex flex-wrap gap-2">
                {["Resume Writing", "Salary Negotiation", "Remote Work", "Tech Interviews", "Career Switch", "LinkedIn", "Freelancing", "Leadership", "Work-Life Balance", "AI & Jobs"].map((topic) => (
                  <button
                    key={topic}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600 hover:border-[#4f46e5]/40 hover:text-[#4f46e5] hover:bg-[#eef2ff] transition-all"
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
