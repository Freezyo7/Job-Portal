import React, { useEffect, useRef, useState } from "react";
import { MdDeleteOutline, MdCheck, MdClose, MdOutlineUploadFile, MdAutoAwesome } from "react-icons/md";
import { HiCheck } from "react-icons/hi";
import api from "../../lib/api";

const API = "/auth/profile";

const getInitials = (str = "") =>
  str.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");

const Panel = ({ children }) => (
  <div
    className="rounded-lg border p-5"
    style={{
      backgroundColor: "var(--nt-bg-card)",
      borderColor: "var(--nt-border)",
      boxShadow: "var(--nt-shadow-sm)",
    }}
  >
    {children}
  </div>
);

const SectionHeader = ({ title, action }) => (
  <div className="flex items-center justify-between mb-4 pb-2 border-b" style={{ borderColor: "var(--nt-border)" }}>
    <h2 className="text-sm font-bold" style={{ color: "var(--nt-text-primary)" }}>{title}</h2>
    {action}
  </div>
);

const SaveBtn = ({ loading, onClick, label = "Save" }) => (
  <button
    onClick={onClick}
    disabled={loading}
    className="inline-flex items-center gap-1.5 rounded-md px-4 py-1.5 text-xs font-medium transition-colors disabled:opacity-60"
    style={{
      backgroundColor: "var(--nt-accent-gold)",
      color: "var(--nt-btn-cta-text)",
    }}
  >
    {loading
      ? <span className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
      : <HiCheck size={13} />}
    {label}
  </button>
);

const Toast = ({ msg, type }) => (
  <div
    className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-md border px-3.5 py-2 shadow-lg text-xs font-mono"
    style={{
      backgroundColor: "var(--nt-bg-card)",
      borderColor: type === "success" ? "var(--nt-accent-sage)" : "#D9534F",
      color: type === "success" ? "var(--nt-accent-sage)" : "#D9534F",
    }}
  >
    {type === "success" ? <MdCheck size={14} /> : <MdClose size={14} />}
    {msg}
  </div>
);

const PersonalInfoForm = ({ profileData, username, email, onProfileUpdate }) => {
  const p = profileData || {};
  const fileInputRef = useRef(null);

  const inputStyle = {
    backgroundColor: "var(--nt-bg-card-alt)",
    borderColor: "var(--nt-border)",
    color: "var(--nt-text-primary)",
  };

  const labelStyle = {
    color: "var(--nt-text-secondary)",
  };

  // ── Toast ──
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Personal Info ──
  const [personal, setPersonal] = useState({
    designation: p.designation || "",
    phone:       p.phone       || "",
    contactEmail:p.contactEmail|| "",
    country:     p.country     || "",
    city:        p.city        || "",
    fullAddress: p.fullAddress || "",
    dob:         p.dob         || "",
    age:         p.age         || "",
    gender:      p.gender      || "",
    summary:     p.summary     || "",
    linkedin:    p.linkedin    || "",
    github:      p.github      || "",
    portfolio:   p.portfolio   || "",
  });
  const [personalLoading, setPersonalLoading] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(false);

  useEffect(() => {
    setPersonal({
      designation: p.designation || "",
      phone:       p.phone       || "",
      contactEmail:p.contactEmail|| "",
      country:     p.country     || "",
      city:        p.city        || "",
      fullAddress: p.fullAddress || "",
      dob:         p.dob         || "",
      age:         p.age         || "",
      gender:      p.gender      || "",
      summary:     p.summary     || "",
      linkedin:    p.linkedin    || "",
      github:      p.github      || "",
      portfolio:   p.portfolio   || "",
    });
    setExperiences(p.experience || []);
    setEducations(p.education || []);
    setSkills(p.skills || []);
  }, [profileData]);

  const savePersonal = async () => {
    setPersonalLoading(true);
    try {
      const { data } = await api.patch(`${API}/personal/`, personal);
      onProfileUpdate(data.profile);
      showToast("Personal info saved");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save", "error");
    } finally { setPersonalLoading(false); }
  };

  const handleResumeUpload = async () => {
    if (!resumeFile) {
      showToast("Choose a resume file first", "error");
      return;
    }

    const formData = new FormData();
    formData.append("resume", resumeFile);

    setResumeLoading(true);
    try {
      const { data } = await api.post(`${API}/resume/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onProfileUpdate(data);
      setResumeFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      showToast("Resume parsed and profile updated");
    } catch (err) {
      if (err.response?.status === 404) {
        showToast("Resume upload route not found. Restart backend server and try again.", "error");
      } else {
        showToast(err.response?.data?.message || "Failed to parse resume", "error");
      }
    } finally {
      setResumeLoading(false);
    }
  };

  // ── Experience ──
  const [experiences, setExperiences] = useState(p.experience || []);
  const [expForm, setExpForm] = useState({ title: "", company: "", type: "Full-time", startDate: "", endDate: "", current: false });
  const [expLoading, setExpLoading] = useState(false);
  const [showExpForm, setShowExpForm] = useState(false);

  const addExp = async () => {
    if (!expForm.title || !expForm.company) { showToast("Title and company are required", "error"); return; }
    setExpLoading(true);
    try {
      const { data } = await api.post(`${API}/experience/`, expForm);
      setExperiences(data.experience);
      onProfileUpdate({ ...p, experience: data.experience });
      setExpForm({ title: "", company: "", type: "Full-time", startDate: "", endDate: "", current: false });
      setShowExpForm(false);
      showToast("Experience added");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to add", "error");
    } finally { setExpLoading(false); }
  };

  const deleteExp = async (id) => {
    try {
      const { data } = await api.delete(`${API}/experience/${id}/`);
      setExperiences(data.experience);
      onProfileUpdate({ ...p, experience: data.experience });
      showToast("Experience removed");
    } catch { showToast("Failed to delete", "error"); }
  };

  // ── Education ──
  const [educations, setEducations] = useState(p.education || []);
  const [eduForm, setEduForm] = useState({ institution: "", degree: "", field: "", gpa: "", startDate: "", endDate: "", current: false });
  const [eduLoading, setEduLoading] = useState(false);
  const [showEduForm, setShowEduForm] = useState(false);

  const addEdu = async () => {
    if (!eduForm.institution || !eduForm.degree) { showToast("Institution and degree are required", "error"); return; }
    setEduLoading(true);
    try {
      const { data } = await api.post(`${API}/education/`, eduForm);
      setEducations(data.education);
      onProfileUpdate({ ...p, education: data.education });
      setEduForm({ institution: "", degree: "", field: "", gpa: "", startDate: "", endDate: "", current: false });
      setShowEduForm(false);
      showToast("Education added");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to add", "error");
    } finally { setEduLoading(false); }
  };

  const deleteEdu = async (id) => {
    try {
      const { data } = await api.delete(`${API}/education/${id}/`);
      setEducations(data.education);
      onProfileUpdate({ ...p, education: data.education });
      showToast("Education removed");
    } catch { showToast("Failed to delete", "error"); }
  };

  // ── Skills ──
  const [skills, setSkills] = useState(p.skills || []);
  const [skillInput, setSkillInput] = useState("");
  const [skillsLoading, setSkillsLoading] = useState(false);

  const addSkill = () => {
    const s = skillInput.trim();
    if (!s || skills.includes(s)) return;
    setSkills(prev => [...prev, s]);
    setSkillInput("");
  };

  const removeSkill = (s) => setSkills(prev => prev.filter(x => x !== s));

  const saveSkills = async () => {
    setSkillsLoading(true);
    try {
      const { data } = await api.patch(`${API}/skills/`, { skills });
      onProfileUpdate({ ...p, skills: data.skills });
      showToast("Skills saved");
    } catch { showToast("Failed to save skills", "error"); }
    finally { setSkillsLoading(false); }
  };

  const formatPeriod = (exp) => {
    const start = exp.startDate || "";
    const end = exp.current ? "Present" : (exp.endDate || "");
    return [start, end].filter(Boolean).join(" – ");
  };

  return (
    <div className="space-y-4">

      {/* ── Resume Parser ── */}
      <Panel>
        <SectionHeader title="Resume Ingestion" />
        <div
          className="rounded-md border p-4"
          style={{
            backgroundColor: "var(--nt-bg-card-alt)",
            borderColor: "var(--nt-border)",
          }}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <div
                className="inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-mono font-medium"
                style={{
                  backgroundColor: "rgba(111, 175, 123, 0.15)",
                  borderColor: "rgba(111, 175, 123, 0.3)",
                  color: "var(--nt-accent-sage)",
                }}
              >
                <MdAutoAwesome size={12} />
                Parser Pipeline
              </div>
              <h3 className="mt-2 text-sm font-bold" style={{ color: "var(--nt-text-primary)" }}>Ingest CV to populate developer records</h3>
              <p className="mt-0.5 text-xs" style={{ color: "var(--nt-text-secondary)" }}>
                Parses experience, education, skills, and contact metadata into your profile store.
              </p>
              {p.resumeMeta?.fileName && (
                <p className="mt-1.5 text-[10px] font-mono" style={{ color: "var(--nt-text-muted)" }}>
                  Last parsed: {p.resumeMeta.fileName}
                  {p.resumeMeta.parsedAt ? ` on ${new Date(p.resumeMeta.parsedAt).toLocaleString("en-IN")}` : ""}
                </p>
              )}
            </div>

            <div className="w-full max-w-xs space-y-2">
              <label
                className="flex cursor-pointer items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-mono transition-colors"
                style={{
                  backgroundColor: "var(--nt-bg-card)",
                  borderColor: "var(--nt-border)",
                  color: "var(--nt-text-primary)",
                }}
              >
                <MdOutlineUploadFile size={16} style={{ color: "var(--nt-accent-sage)" }} />
                <span className="truncate">{resumeFile ? resumeFile.name : "Select PDF/DOCX"}</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                />
              </label>
              <button
                onClick={handleResumeUpload}
                disabled={resumeLoading}
                className="w-full rounded-md px-3 py-2 text-xs font-medium transition-colors disabled:opacity-60"
                style={{
                  backgroundColor: "var(--nt-accent-gold)",
                  color: "var(--nt-btn-cta-text)",
                }}
              >
                {resumeLoading ? "Parsing..." : "Parse & Auto-Fill"}
              </button>
            </div>
          </div>
        </div>
      </Panel>

      {/* ── Personal Info ── */}
      <Panel>
        <SectionHeader title="Developer Information" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={labelStyle}>Full Name</label>
            <input value={username} disabled className="w-full px-3 py-2 rounded-md border text-xs opacity-60 cursor-not-allowed" style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={labelStyle}>Email Address</label>
            <input value={email} disabled className="w-full px-3 py-2 rounded-md border text-xs opacity-60 cursor-not-allowed" style={inputStyle} />
          </div>
          {[
            { key: "designation", label: "Designation",   type: "text",  placeholder: "Software Engineer"  },
            { key: "phone",       label: "Phone",         type: "tel",   placeholder: "+91 98765 43210"     },
            { key: "contactEmail",label: "Contact Email", type: "email", placeholder: "dev@domain.com"     },
            { key: "age",         label: "Age",           type: "text",  placeholder: "26"                  },
            { key: "country",     label: "Country",       type: "text",  placeholder: "India"               },
            { key: "city",        label: "City",          type: "text",  placeholder: "Bengaluru"           },
            { key: "linkedin",    label: "LinkedIn URL",  type: "text",  placeholder: "https://linkedin.com/in/..." },
            { key: "github",      label: "GitHub URL",    type: "text",  placeholder: "https://github.com/..." },
            { key: "portfolio",   label: "Portfolio URL", type: "text",  placeholder: "https://..." },
            { key: "dob",         label: "Date of Birth", type: "date",  placeholder: ""                    },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-medium mb-1" style={labelStyle}>{f.label}</label>
              <input
                type={f.type}
                value={personal[f.key]}
                placeholder={f.placeholder}
                onChange={e => setPersonal(prev => ({ ...prev, [f.key]: e.target.value }))}
                className="w-full px-3 py-2 rounded-md border text-xs focus:outline-none"
                style={inputStyle}
              />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium mb-1" style={labelStyle}>Gender</label>
            <select
              value={personal.gender}
              onChange={e => setPersonal(prev => ({ ...prev, gender: e.target.value }))}
              className="w-full px-3 py-2 rounded-md border text-xs focus:outline-none"
              style={inputStyle}
            >
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium mb-1" style={labelStyle}>Full Address</label>
            <textarea
              value={personal.fullAddress}
              placeholder="Street address, city, state, postal code"
              onChange={e => setPersonal(prev => ({ ...prev, fullAddress: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 rounded-md border text-xs focus:outline-none"
              style={inputStyle}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium mb-1" style={labelStyle}>Professional Summary</label>
            <textarea
              value={personal.summary}
              placeholder="Concise background summary"
              onChange={e => setPersonal(prev => ({ ...prev, summary: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 rounded-md border text-xs focus:outline-none"
              style={inputStyle}
            />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <SaveBtn loading={personalLoading} onClick={savePersonal} />
        </div>
      </Panel>

      {/* ── Experience ── */}
      <Panel>
        <SectionHeader title="Experience History"
          action={
            <button
              onClick={() => setShowExpForm(v => !v)}
              className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-mono font-medium transition-colors"
              style={{
                backgroundColor: "var(--nt-bg-secondary)",
                borderColor: "var(--nt-border)",
                color: "var(--nt-text-primary)",
              }}
            >
              <span>{showExpForm ? "− Cancel" : "+ Add Experience"}</span>
            </button>
          }
        />

        {experiences.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
            {experiences.map((e) => (
              <div
                key={e._id}
                className="flex items-start gap-2.5 rounded-md border p-3"
                style={{
                  backgroundColor: "var(--nt-bg-card-alt)",
                  borderColor: "var(--nt-border)",
                }}
              >
                <div
                  className="h-8 w-8 rounded border flex-shrink-0 flex items-center justify-center font-mono text-xs font-bold"
                  style={{
                    backgroundColor: "var(--nt-bg-secondary)",
                    borderColor: "var(--nt-border)",
                    color: "var(--nt-text-primary)",
                  }}
                >
                  {getInitials(e.company)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: "var(--nt-text-primary)" }}>{e.title}</p>
                  <p className="text-[11px] truncate" style={{ color: "var(--nt-text-secondary)" }}>{e.company} · {e.type}</p>
                  <p className="text-[10px] font-mono mt-0.5" style={{ color: "var(--nt-text-muted)" }}>{formatPeriod(e)}</p>
                </div>
                <button onClick={() => deleteExp(e._id)} className="transition-colors hover:text-red-500 flex-shrink-0" style={{ color: "var(--nt-text-muted)" }}>
                  <MdDeleteOutline size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {showExpForm && (
          <div className="border-t pt-4" style={{ borderColor: "var(--nt-border)" }}>
            <p className="text-[11px] font-mono uppercase font-semibold mb-3" style={{ color: "var(--nt-text-muted)" }}>Add Work Experience</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: "title",   label: "Job Title",    placeholder: "Software Engineer" },
                { key: "company", label: "Organization", placeholder: "Acme Corp"           },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium mb-1" style={labelStyle}>{f.label}</label>
                  <input
                    type="text"
                    value={expForm[f.key]}
                    placeholder={f.placeholder}
                    onChange={e => setExpForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md border text-xs focus:outline-none"
                    style={inputStyle}
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium mb-1" style={labelStyle}>Employment Type</label>
                <select
                  value={expForm.type}
                  onChange={e => setExpForm(p => ({ ...p, type: e.target.value }))}
                  className="w-full px-3 py-2 rounded-md border text-xs focus:outline-none"
                  style={inputStyle}
                >
                  {["Full-time","Part-time","Contract","Freelance","Internship"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={labelStyle}>Start Date</label>
                <input
                  type="date"
                  value={expForm.startDate}
                  onChange={e => setExpForm(p => ({ ...p, startDate: e.target.value }))}
                  className="w-full px-3 py-2 rounded-md border text-xs focus:outline-none"
                  style={inputStyle}
                />
              </div>
              {!expForm.current && (
                <div>
                  <label className="block text-xs font-medium mb-1" style={labelStyle}>End Date</label>
                  <input
                    type="date"
                    value={expForm.endDate}
                    onChange={e => setExpForm(p => ({ ...p, endDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md border text-xs focus:outline-none"
                    style={inputStyle}
                  />
                </div>
              )}
            </div>
            <label className="inline-flex items-center gap-2 mt-3 cursor-pointer">
              <input
                type="checkbox"
                checked={expForm.current}
                onChange={e => setExpForm(p => ({ ...p, current: e.target.checked }))}
                className="h-3.5 w-3.5 rounded"
                style={{ accentColor: "var(--nt-accent-sage)" }}
              />
              <span className="text-xs" style={{ color: "var(--nt-text-primary)" }}>Currently active role</span>
            </label>
            <div className="flex justify-end mt-3">
              <SaveBtn loading={expLoading} onClick={addExp} label="Save Role" />
            </div>
          </div>
        )}

        {experiences.length === 0 && !showExpForm && (
          <p className="text-xs text-center py-2" style={{ color: "var(--nt-text-muted)" }}>No experience records attached.</p>
        )}
      </Panel>

      {/* ── Education ── */}
      <Panel>
        <SectionHeader title="Education History"
          action={
            <button
              onClick={() => setShowEduForm(v => !v)}
              className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-mono font-medium transition-colors"
              style={{
                backgroundColor: "var(--nt-bg-secondary)",
                borderColor: "var(--nt-border)",
                color: "var(--nt-text-primary)",
              }}
            >
              <span>{showEduForm ? "− Cancel" : "+ Add Education"}</span>
            </button>
          }
        />

        {educations.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
            {educations.map((e) => (
              <div
                key={e._id}
                className="flex items-start gap-2.5 rounded-md border p-3"
                style={{
                  backgroundColor: "var(--nt-bg-card-alt)",
                  borderColor: "var(--nt-border)",
                }}
              >
                <div
                  className="h-8 w-8 rounded border flex-shrink-0 flex items-center justify-center font-mono text-xs font-bold"
                  style={{
                    backgroundColor: "var(--nt-bg-secondary)",
                    borderColor: "var(--nt-border)",
                    color: "var(--nt-text-primary)",
                  }}
                >
                  {getInitials(e.institution)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: "var(--nt-text-primary)" }}>{e.degree}</p>
                  <p className="text-[11px] truncate" style={{ color: "var(--nt-text-secondary)" }}>{e.institution}{e.field ? ` · ${e.field}` : ""}</p>
                  <p className="text-[10px] font-mono mt-0.5" style={{ color: "var(--nt-text-muted)" }}>{formatPeriod(e)}{e.gpa ? ` · GPA: ${e.gpa}` : ""}</p>
                </div>
                <button onClick={() => deleteEdu(e._id)} className="transition-colors hover:text-red-500 flex-shrink-0" style={{ color: "var(--nt-text-muted)" }}>
                  <MdDeleteOutline size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {showEduForm && (
          <div className="border-t pt-4" style={{ borderColor: "var(--nt-border)" }}>
            <p className="text-[11px] font-mono uppercase font-semibold mb-3" style={{ color: "var(--nt-text-muted)" }}>Add Academic Record</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: "institution", label: "Institution",    placeholder: "University Name" },
                { key: "degree",      label: "Degree",         placeholder: "B.Tech / B.S."   },
                { key: "field",       label: "Field of Study", placeholder: "Computer Science" },
                { key: "gpa",         label: "GPA / Score",    placeholder: "3.8 / 4.0"       },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium mb-1" style={labelStyle}>{f.label}</label>
                  <input
                    type="text"
                    value={eduForm[f.key]}
                    placeholder={f.placeholder}
                    onChange={e => setEduForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md border text-xs focus:outline-none"
                    style={inputStyle}
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium mb-1" style={labelStyle}>Start Date</label>
                <input
                  type="date"
                  value={eduForm.startDate}
                  onChange={e => setEduForm(p => ({ ...p, startDate: e.target.value }))}
                  className="w-full px-3 py-2 rounded-md border text-xs focus:outline-none"
                  style={inputStyle}
                />
              </div>
              {!eduForm.current && (
                <div>
                  <label className="block text-xs font-medium mb-1" style={labelStyle}>End Date</label>
                  <input
                    type="date"
                    value={eduForm.endDate}
                    onChange={e => setEduForm(p => ({ ...p, endDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md border text-xs focus:outline-none"
                    style={inputStyle}
                  />
                </div>
              )}
            </div>
            <label className="inline-flex items-center gap-2 mt-3 cursor-pointer">
              <input
                type="checkbox"
                checked={eduForm.current}
                onChange={e => setEduForm(p => ({ ...p, current: e.target.checked }))}
                className="h-3.5 w-3.5 rounded"
                style={{ accentColor: "var(--nt-accent-sage)" }}
              />
              <span className="text-xs" style={{ color: "var(--nt-text-primary)" }}>Currently enrolled</span>
            </label>
            <div className="flex justify-end mt-3">
              <SaveBtn loading={eduLoading} onClick={addEdu} label="Save Academic Record" />
            </div>
          </div>
        )}

        {educations.length === 0 && !showEduForm && (
          <p className="text-xs text-center py-2" style={{ color: "var(--nt-text-muted)" }}>No education records attached.</p>
        )}
      </Panel>

      {/* ── Skills ── */}
      <Panel>
        <SectionHeader title="Skills & Keywords" />
        <div className="flex flex-wrap gap-1.5 mb-3 min-h-[2rem]">
          {skills.length === 0
            ? <p className="text-xs" style={{ color: "var(--nt-text-muted)" }}>No skills registered.</p>
            : skills.map(s => (
              <span
                key={s}
                className="inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-mono"
                style={{
                  backgroundColor: "var(--nt-bg-secondary)",
                  borderColor: "var(--nt-border)",
                  color: "var(--nt-text-primary)",
                }}
              >
                {s}
                <button onClick={() => removeSkill(s)} className="hover:text-red-500 transition-colors leading-none">×</button>
              </span>
            ))
          }
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={skillInput}
            placeholder="e.g. TypeScript, Docker, PostgreSQL..."
            onChange={e => setSkillInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSkill())}
            className="w-full px-3 py-2 rounded-md border text-xs focus:outline-none flex-1"
            style={inputStyle}
          />
          <button
            onClick={addSkill}
            className="rounded-md border px-3.5 py-1.5 text-xs font-mono font-medium transition-colors flex-shrink-0"
            style={{
              backgroundColor: "var(--nt-btn-sec-bg)",
              borderColor: "var(--nt-border)",
              color: "var(--nt-text-primary)",
            }}
          >
            Add
          </button>
        </div>
        <div className="flex justify-end mt-3">
          <SaveBtn loading={skillsLoading} onClick={saveSkills} label="Save Skills" />
        </div>
      </Panel>

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
};

export default PersonalInfoForm;
