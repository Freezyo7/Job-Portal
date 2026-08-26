import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PersonalInfoForm from "./ProfileComponents/PersonalInfoForm";
import { CiLocationOn } from "react-icons/ci";
import { BsBriefcase, BsBook } from "react-icons/bs";
import api from "../lib/api";

const ACCENT_COLORS = ["bg-teal-500","bg-purple-500","bg-[#4f46e5]","bg-indigo-400","bg-rose-500","bg-amber-500","bg-sky-500"];

const getInitials = (str = "") =>
  str.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");

const formatPeriod = (item) => {
  const start = item.startDate || "";
  const end = item.current ? "Present" : (item.endDate || "");
  return [start, end].filter(Boolean).join(" – ");
};

const ContactLink = ({ href, children }) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    className="break-all hover:text-[#4f46e5] transition-colors underline underline-offset-2"
  >
    {children}
  </a>
);

const Profile = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get("/auth/profile")
      .then(res => {
        const safeUser = res.data && typeof res.data === "object" ? res.data : null;
        setUserData(safeUser);
      })
      .catch(err => {
        if (err.response?.status === 401) navigate("/login");
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  // Called by PersonalInfoForm whenever any section is saved
  const handleProfileUpdate = (updated) => {
    setUserData((prev) => {
      if (!prev) return prev;

      if (updated?.profile || updated?.username || updated?.email) {
        return {
          ...prev,
          username: updated.username ?? prev.username,
          email: updated.email ?? prev.email,
          profile: updated.profile ?? prev.profile,
        };
      }

      return { ...prev, profile: { ...prev.profile, ...updated } };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f3f4ff] via-[#f6f7ff] to-[#e9f0ff] flex items-center justify-center">
        <div className="flex gap-1.5">
          {[0,1,2].map(i => (
            <span key={i} className="h-2.5 w-2.5 rounded-full bg-[#4f46e5] animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    );
  }

  const profile = userData?.profile || {};
  const experiences = profile.experience || [];
  const educations  = profile.education  || [];
  const skills      = profile.skills     || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f3f4ff] via-[#f6f7ff] to-[#e9f0ff] px-4 py-6 md:px-8 lg:px-6 lg:py-5 text-slate-900">
      <div className="mx-auto max-w-6xl flex flex-col gap-6 lg:grid lg:grid-cols-[1fr,2fr]">

        {/* ── Left: Profile Sidebar ── */}
        <aside className="flex flex-col overflow-hidden rounded-3xl border-2 border-slate-200/80 bg-white/60 backdrop-blur-sm shadow-2xl shadow-slate-300/50">

          {/* Banner + Avatar */}
          <div className="relative h-28 flex-shrink-0 bg-[linear-gradient(135deg,#03001e,#7303c0,#ec38bc,#fdeff9)]">
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
              <div className="h-16 w-16 rounded-2xl border-4 border-white shadow-lg bg-[#eef2ff] flex items-center justify-center text-xl font-bold text-[#4f46e5]">
                {getInitials(userData?.username || "U")}
              </div>
            </div>
          </div>

          {/* Name / role */}
          <div className="mt-10 px-5 pb-4 text-center border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900">{userData?.username || "—"}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{profile.designation || "Add your designation"}</p>
            {(profile.city || profile.country) && (
              <span className="inline-flex items-center gap-1 mt-2 text-[11px] text-slate-400">
                <CiLocationOn size={13} />
                {[profile.city, profile.country].filter(Boolean).join(", ")}
              </span>
            )}
          </div>

          {/* Scrollable sections */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">

            {/* Experience */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BsBriefcase size={13} className="text-[#4f46e5]" />
                <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Experience</h3>
              </div>
              {experiences.length === 0
                ? <p className="text-[11px] text-slate-400">No experience added yet.</p>
                : (
                  <div className="space-y-3">
                    {experiences.map((e, i) => (
                      <div key={e._id} className="flex gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                        <div className={`h-9 w-9 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-[11px] font-bold ${ACCENT_COLORS[i % ACCENT_COLORS.length]}`}>
                          {getInitials(e.company)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">{e.title}</p>
                          <p className="text-[11px] text-slate-500 truncate">{e.company} · {e.type}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{formatPeriod(e)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            </div>

            {/* Education */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BsBook size={13} className="text-[#4f46e5]" />
                <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Education</h3>
              </div>
              {educations.length === 0
                ? <p className="text-[11px] text-slate-400">No education added yet.</p>
                : (
                  <div className="space-y-3">
                    {educations.map((e, i) => (
                      <div key={e._id} className="flex gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                        <div className={`h-9 w-9 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-[11px] font-bold ${ACCENT_COLORS[(i + 2) % ACCENT_COLORS.length]}`}>
                          {getInitials(e.institution)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">{e.degree}</p>
                          <p className="text-[11px] text-slate-500 truncate">{e.institution}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{formatPeriod(e)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            </div>

            {/* Skills */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="h-3 w-3 rounded-full bg-[#4f46e5]" />
                <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Skills</h3>
              </div>
              {skills.length === 0
                ? <p className="text-[11px] text-slate-400">No skills added yet.</p>
                : (
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((s, i) => (
                      <span key={i} className="rounded-full bg-[#eef2ff] px-2.5 py-1 text-[11px] font-medium text-[#4f46e5]">
                        {s}
                      </span>
                    ))}
                  </div>
                )
              }
            </div>

            {/* Contact */}
            {(profile.phone || profile.contactEmail || profile.linkedin || profile.github || profile.portfolio) && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="h-3 w-3 rounded-full bg-emerald-500" />
                  <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Contact</h3>
                </div>
                <div className="space-y-2 text-[11px] text-slate-500">
                  {profile.phone && <p>{profile.phone}</p>}
                  {profile.contactEmail && <p className="break-all">{profile.contactEmail}</p>}
                  {profile.linkedin && <ContactLink href={profile.linkedin}>{profile.linkedin}</ContactLink>}
                  {profile.github && <ContactLink href={profile.github}>{profile.github}</ContactLink>}
                  {profile.portfolio && <ContactLink href={profile.portfolio}>{profile.portfolio}</ContactLink>}
                </div>
              </div>
            )}

            {/* Summary */}
            {profile.summary && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="h-3 w-3 rounded-full bg-amber-500" />
                  <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Summary</h3>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">{profile.summary}</p>
              </div>
            )}

          </div>
        </aside>

        {/* ── Right: Forms ── */}
        <div className="overflow-y-auto max-h-[calc(100vh-6rem)]">
          <PersonalInfoForm
            profileData={profile}
            username={userData?.username || ""}
            email={userData?.email || ""}
            onProfileUpdate={handleProfileUpdate}
          />
        </div>

      </div>
    </div>
  );
};

export default Profile;
