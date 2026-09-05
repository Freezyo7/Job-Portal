import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PersonalInfoForm from "./ProfileComponents/PersonalInfoForm";
import { CiLocationOn } from "react-icons/ci";
import { BsBriefcase, BsBook } from "react-icons/bs";
import api from "../lib/api";

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
    className="break-all font-mono hover:underline"
    style={{ color: "var(--nt-accent-sage)" }}
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--nt-bg-primary)" }}>
        <div className="flex gap-1.5">
          {[0,1,2].map(i => (
            <span key={i} className="h-2 w-2 rounded-full animate-bounce"
              style={{ backgroundColor: "var(--nt-accent-sage)", animationDelay: `${i * 0.15}s` }} />
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
    <div className="min-h-screen px-4 py-6 md:px-6 lg:px-8 transition-colors" style={{ backgroundColor: "var(--nt-bg-primary)", color: "var(--nt-text-primary)" }}>
      <div className="mx-auto max-w-7xl flex flex-col gap-5 lg:grid lg:grid-cols-[1fr,2fr]">

        {/* ── Left: Profile Sidebar ── */}
        <aside
          className="flex flex-col overflow-hidden rounded-lg border"
          style={{
            backgroundColor: "var(--nt-bg-card)",
            borderColor: "var(--nt-border)",
            boxShadow: "var(--nt-shadow-sm)",
          }}
        >

          {/* Banner + Avatar */}
          <div
            className="relative h-20 flex-shrink-0 border-b"
            style={{
              backgroundColor: "var(--nt-bg-secondary)",
              borderColor: "var(--nt-border)",
            }}
          >
            <div className="absolute -bottom-6 left-5">
              <div
                className="h-12 w-12 rounded-md border-2 shadow-sm flex items-center justify-center font-mono text-sm font-bold"
                style={{
                  backgroundColor: "var(--nt-bg-card-alt)",
                  borderColor: "var(--nt-border)",
                  color: "var(--nt-text-primary)",
                }}
              >
                {getInitials(userData?.username || "U")}
              </div>
            </div>
          </div>

          {/* Name / role */}
          <div className="mt-8 px-5 pb-3.5 border-b" style={{ borderColor: "var(--nt-border)" }}>
            <h2 className="text-base font-bold" style={{ color: "var(--nt-text-primary)" }}>{userData?.username || "—"}</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--nt-text-secondary)" }}>{profile.designation || "Add designation"}</p>
            {(profile.city || profile.country) && (
              <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-mono" style={{ color: "var(--nt-text-muted)" }}>
                <CiLocationOn size={12} />
                {[profile.city, profile.country].filter(Boolean).join(", ")}
              </span>
            )}
          </div>

          {/* Scrollable sections */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">

            {/* Experience */}
            <div>
              <div className="flex items-center gap-1.5 mb-2.5">
                <BsBriefcase size={12} style={{ color: "var(--nt-accent-sage)" }} />
                <h3 className="text-[11px] font-mono uppercase font-semibold" style={{ color: "var(--nt-text-muted)" }}>Experience</h3>
              </div>
              {experiences.length === 0
                ? <p className="text-xs" style={{ color: "var(--nt-text-muted)" }}>No experience records attached.</p>
                : (
                  <div className="space-y-2">
                    {experiences.map((e) => (
                      <div
                        key={e._id}
                        className="flex gap-2.5 rounded-md border p-2.5"
                        style={{
                          backgroundColor: "var(--nt-bg-card-alt)",
                          borderColor: "var(--nt-border)",
                        }}
                      >
                        <div
                          className="h-8 w-8 rounded border flex-shrink-0 flex items-center justify-center font-mono text-[10px] font-bold"
                          style={{
                            backgroundColor: "var(--nt-bg-secondary)",
                            borderColor: "var(--nt-border)",
                            color: "var(--nt-text-primary)",
                          }}
                        >
                          {getInitials(e.company)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate" style={{ color: "var(--nt-text-primary)" }}>{e.title}</p>
                          <p className="text-[11px] truncate" style={{ color: "var(--nt-text-secondary)" }}>{e.company} · {e.type}</p>
                          <p className="text-[10px] font-mono mt-0.5" style={{ color: "var(--nt-text-muted)" }}>{formatPeriod(e)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            </div>

            {/* Education */}
            <div>
              <div className="flex items-center gap-1.5 mb-2.5">
                <BsBook size={12} style={{ color: "var(--nt-accent-gold)" }} />
                <h3 className="text-[11px] font-mono uppercase font-semibold" style={{ color: "var(--nt-text-muted)" }}>Education</h3>
              </div>
              {educations.length === 0
                ? <p className="text-xs" style={{ color: "var(--nt-text-muted)" }}>No education records attached.</p>
                : (
                  <div className="space-y-2">
                    {educations.map((e) => (
                      <div
                        key={e._id}
                        className="flex gap-2.5 rounded-md border p-2.5"
                        style={{
                          backgroundColor: "var(--nt-bg-card-alt)",
                          borderColor: "var(--nt-border)",
                        }}
                      >
                        <div
                          className="h-8 w-8 rounded border flex-shrink-0 flex items-center justify-center font-mono text-[10px] font-bold"
                          style={{
                            backgroundColor: "var(--nt-bg-secondary)",
                            borderColor: "var(--nt-border)",
                            color: "var(--nt-text-primary)",
                          }}
                        >
                          {getInitials(e.institution)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate" style={{ color: "var(--nt-text-primary)" }}>{e.degree}</p>
                          <p className="text-[11px] truncate" style={{ color: "var(--nt-text-secondary)" }}>{e.institution}</p>
                          <p className="text-[10px] font-mono mt-0.5" style={{ color: "var(--nt-text-muted)" }}>{formatPeriod(e)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            </div>

            {/* Skills */}
            <div>
              <div className="flex items-center gap-1.5 mb-2.5">
                <h3 className="text-[11px] font-mono uppercase font-semibold" style={{ color: "var(--nt-text-muted)" }}>Skills & Tooling</h3>
              </div>
              {skills.length === 0
                ? <p className="text-xs" style={{ color: "var(--nt-text-muted)" }}>No skills registered.</p>
                : (
                  <div className="flex flex-wrap gap-1">
                    {skills.map((s, i) => (
                      <span
                        key={i}
                        className="rounded border px-2 py-0.5 text-[10px] font-mono"
                        style={{
                          backgroundColor: "var(--nt-bg-secondary)",
                          borderColor: "var(--nt-border)",
                          color: "var(--nt-text-primary)",
                        }}
                      >
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
                <div className="flex items-center gap-1.5 mb-2.5">
                  <h3 className="text-[11px] font-mono uppercase font-semibold" style={{ color: "var(--nt-text-muted)" }}>Contact Endpoints</h3>
                </div>
                <div className="space-y-1.5 text-xs font-mono" style={{ color: "var(--nt-text-secondary)" }}>
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
                <div className="flex items-center gap-1.5 mb-2.5">
                  <h3 className="text-[11px] font-mono uppercase font-semibold" style={{ color: "var(--nt-text-muted)" }}>Summary</h3>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "var(--nt-text-secondary)" }}>{profile.summary}</p>
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
