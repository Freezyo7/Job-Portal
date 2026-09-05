import React, { useEffect, useRef, useState } from "react";
import { MdDeleteOutline, MdCheck, MdClose, MdOutlineUploadFile, MdAutoAwesome } from "react-icons/md";
import { HiCheck } from "react-icons/hi";
import api from "../../lib/api";

const API = "/auth/profile";
const inputCls = "w-full px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500";
const labelCls = "block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1";

const getInitials = (str = "") =>
  str.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");

const Panel = ({ children }) => (
  <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
    {children}
  </div>
);

const SectionHeader = ({ title, action }) => (
  <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-100 dark:border-zinc-800">
    <h2 className="text-sm font-bold text-zinc-950 dark:text-zinc-50">{title}</h2>
    {action}
  </div>
);

const SaveBtn = ({ loading, onClick, label = "Save" }) => (
  <button onClick={onClick} disabled={loading}
    className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 px-4 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-60">
    {loading
      ? <span className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
      : <HiCheck size={13} />}
    {label}
  </button>
);

const Toast = ({ msg, type }) => (
  <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-md border px-3.5 py-2 shadow-lg text-xs font-mono
    ${type === "success"
      ? "bg-zinc-900 border-emerald-500/40 text-emerald-400 dark:bg-zinc-900 dark:border-emerald-500/40 dark:text-emerald-400"
      : "bg-zinc-900 border-red-500/40 text-red-400 dark:bg-zinc-900 dark:border-red-500/40 dark:text-red-400"}`}>
    {type === "success" ? <MdCheck size={14} /> : <MdClose size={14} />}
    {msg}
  </div>
);

// ── PersonalInfoForm ───────────────────────────────────────────────────────
const PersonalInfoForm = ({ profileData, username, email, onProfileUpdate }) => {
  const p = profileData || {};
  const fileInputRef = useRef(null);

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
        <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/60 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                <MdAutoAwesome size={12} />
                Parser Pipeline
              </div>
              <h3 className="mt-2 text-sm font-bold text-zinc-950 dark:text-zinc-50">Ingest CV to populate developer records</h3>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Parses experience, education, skills, and contact metadata into your profile store.
              </p>
              {p.resumeMeta?.fileName && (
                <p className="mt-1.5 text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                  Last parsed: {p.resumeMeta.fileName}
                  {p.resumeMeta.parsedAt ? ` on ${new Date(p.resumeMeta.parsedAt).toLocaleString("en-IN")}` : ""}
                </p>
              )}
            </div>

            <div className="w-full max-w-xs space-y-2">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-mono text-zinc-700 dark:text-zinc-300 hover:border-emerald-500 transition-colors">
                <MdOutlineUploadFile size={16} className="text-emerald-600 dark:text-emerald-400" />
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
                className="w-full rounded-md bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 px-3 py-2 text-xs font-medium text-white transition-colors disabled:opacity-60"
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
            <label className={labelCls}>Full Name</label>
            <input value={username} disabled className={`${inputCls} opacity-60 cursor-not-allowed`} />
          </div>
          <div>
            <label className={labelCls}>Email Address</label>
            <input value={email} disabled className={`${inputCls} opacity-60 cursor-not-allowed`} />
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
              <label className={labelCls}>{f.label}</label>
              <input type={f.type} value={personal[f.key]} placeholder={f.placeholder}
                onChange={e => setPersonal(prev => ({ ...prev, [f.key]: e.target.value }))}
                className={inputCls} />
            </div>
          ))}
          <div>
            <label className={labelCls}>Gender</label>
            <select value={personal.gender} onChange={e => setPersonal(prev => ({ ...prev, gender: e.target.value }))} className={inputCls}>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Full Address</label>
            <textarea
              value={personal.fullAddress}
              placeholder="Street address, city, state, postal code"
              onChange={e => setPersonal(prev => ({ ...prev, fullAddress: e.target.value }))}
              rows={2}
              className={inputCls}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Professional Summary</label>
            <textarea
              value={personal.summary}
              placeholder="Concise background summary"
              onChange={e => setPersonal(prev => ({ ...prev, summary: e.target.value }))}
              rows={3}
              className={inputCls}
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
            <button onClick={() => setShowExpForm(v => !v)}
              className="inline-flex items-center gap-1 rounded-md border border-zinc-200 dark:border-zinc-800 px-2.5 py-1 text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <span>{showExpForm ? "− Cancel" : "+ Add Experience"}</span>
            </button>
          }
        />

        {experiences.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
            {experiences.map((e) => (
              <div key={e._id} className="flex items-start gap-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 p-3">
                <div className="h-8 w-8 rounded bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 flex-shrink-0 flex items-center justify-center font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  {getInitials(e.company)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">{e.title}</p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{e.company} · {e.type}</p>
                  <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 mt-0.5">{formatPeriod(e)}</p>
                </div>
                <button onClick={() => deleteExp(e._id)} className="text-zinc-400 hover:text-red-500 transition-colors flex-shrink-0">
                  <MdDeleteOutline size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {showExpForm && (
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
            <p className="text-[11px] font-mono uppercase font-semibold text-zinc-500 dark:text-zinc-400 mb-3">Add Work Experience</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: "title",   label: "Job Title",    placeholder: "Software Engineer" },
                { key: "company", label: "Organization", placeholder: "Acme Corp"           },
              ].map(f => (
                <div key={f.key}>
                  <label className={labelCls}>{f.label}</label>
                  <input type="text" value={expForm[f.key]} placeholder={f.placeholder}
                    onChange={e => setExpForm(p => ({ ...p, [f.key]: e.target.value }))} className={inputCls} />
                </div>
              ))}
              <div>
                <label className={labelCls}>Employment Type</label>
                <select value={expForm.type} onChange={e => setExpForm(p => ({ ...p, type: e.target.value }))} className={inputCls}>
                  {["Full-time","Part-time","Contract","Freelance","Internship"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Start Date</label>
                <input type="date" value={expForm.startDate} onChange={e => setExpForm(p => ({ ...p, startDate: e.target.value }))} className={inputCls} />
              </div>
              {!expForm.current && (
                <div>
                  <label className={labelCls}>End Date</label>
                  <input type="date" value={expForm.endDate} onChange={e => setExpForm(p => ({ ...p, endDate: e.target.value }))} className={inputCls} />
                </div>
              )}
            </div>
            <label className="inline-flex items-center gap-2 mt-3 cursor-pointer">
              <input type="checkbox" checked={expForm.current} onChange={e => setExpForm(p => ({ ...p, current: e.target.checked }))}
                className="h-3.5 w-3.5 rounded border-zinc-300 dark:border-zinc-700 text-emerald-600 focus:ring-emerald-500 bg-zinc-50 dark:bg-zinc-950" />
              <span className="text-xs text-zinc-700 dark:text-zinc-300">Currently active role</span>
            </label>
            <div className="flex justify-end mt-3">
              <SaveBtn loading={expLoading} onClick={addExp} label="Save Role" />
            </div>
          </div>
        )}

        {experiences.length === 0 && !showExpForm && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-2">No experience records attached.</p>
        )}
      </Panel>

      {/* ── Education ── */}
      <Panel>
        <SectionHeader title="Education History"
          action={
            <button onClick={() => setShowEduForm(v => !v)}
              className="inline-flex items-center gap-1 rounded-md border border-zinc-200 dark:border-zinc-800 px-2.5 py-1 text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <span>{showEduForm ? "− Cancel" : "+ Add Education"}</span>
            </button>
          }
        />

        {educations.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
            {educations.map((e) => (
              <div key={e._id} className="flex items-start gap-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 p-3">
                <div className="h-8 w-8 rounded bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 flex-shrink-0 flex items-center justify-center font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  {getInitials(e.institution)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">{e.degree}</p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{e.institution}{e.field ? ` · ${e.field}` : ""}</p>
                  <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 mt-0.5">{formatPeriod(e)}{e.gpa ? ` · GPA: ${e.gpa}` : ""}</p>
                </div>
                <button onClick={() => deleteEdu(e._id)} className="text-zinc-400 hover:text-red-500 transition-colors flex-shrink-0">
                  <MdDeleteOutline size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {showEduForm && (
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
            <p className="text-[11px] font-mono uppercase font-semibold text-zinc-500 dark:text-zinc-400 mb-3">Add Academic Record</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: "institution", label: "Institution",    placeholder: "University Name" },
                { key: "degree",      label: "Degree",         placeholder: "B.Tech / B.S."   },
                { key: "field",       label: "Field of Study", placeholder: "Computer Science" },
                { key: "gpa",         label: "GPA / Score",    placeholder: "3.8 / 4.0"       },
              ].map(f => (
                <div key={f.key}>
                  <label className={labelCls}>{f.label}</label>
                  <input type="text" value={eduForm[f.key]} placeholder={f.placeholder}
                    onChange={e => setEduForm(p => ({ ...p, [f.key]: e.target.value }))} className={inputCls} />
                </div>
              ))}
              <div>
                <label className={labelCls}>Start Date</label>
                <input type="date" value={eduForm.startDate} onChange={e => setEduForm(p => ({ ...p, startDate: e.target.value }))} className={inputCls} />
              </div>
              {!eduForm.current && (
                <div>
                  <label className={labelCls}>End Date</label>
                  <input type="date" value={eduForm.endDate} onChange={e => setEduForm(p => ({ ...p, endDate: e.target.value }))} className={inputCls} />
                </div>
              )}
            </div>
            <label className="inline-flex items-center gap-2 mt-3 cursor-pointer">
              <input type="checkbox" checked={eduForm.current} onChange={e => setEduForm(p => ({ ...p, current: e.target.checked }))}
                className="h-3.5 w-3.5 rounded border-zinc-300 dark:border-zinc-700 text-emerald-600 focus:ring-emerald-500 bg-zinc-50 dark:bg-zinc-950" />
              <span className="text-xs text-zinc-700 dark:text-zinc-300">Currently enrolled</span>
            </label>
            <div className="flex justify-end mt-3">
              <SaveBtn loading={eduLoading} onClick={addEdu} label="Save Academic Record" />
            </div>
          </div>
        )}

        {educations.length === 0 && !showEduForm && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-2">No education records attached.</p>
        )}
      </Panel>

      {/* ── Skills ── */}
      <Panel>
        <SectionHeader title="Skills & Keywords" />
        <div className="flex flex-wrap gap-1.5 mb-3 min-h-[2rem]">
          {skills.length === 0
            ? <p className="text-xs text-zinc-400 dark:text-zinc-500">No skills registered.</p>
            : skills.map(s => (
              <span key={s} className="inline-flex items-center gap-1.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 px-2 py-0.5 text-[11px] font-mono text-zinc-700 dark:text-zinc-300">
                {s}
                <button onClick={() => removeSkill(s)} className="hover:text-red-500 transition-colors leading-none">×</button>
              </span>
            ))
          }
        </div>
        <div className="flex gap-2">
          <input
            type="text" value={skillInput} placeholder="e.g. TypeScript, Docker, PostgreSQL..."
            onChange={e => setSkillInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSkill())}
            className={`${inputCls} flex-1`}
          />
          <button onClick={addSkill}
            className="rounded-md border border-zinc-300 dark:border-zinc-700 px-3.5 py-1.5 text-xs font-mono font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex-shrink-0">
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

