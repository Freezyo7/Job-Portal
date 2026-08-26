import React, { useEffect, useRef, useState } from "react";
import { MdDeleteOutline, MdCheck, MdClose, MdOutlineUploadFile, MdAutoAwesome } from "react-icons/md";
import { HiCheck } from "react-icons/hi";
import api from "../../lib/api";

const API = "/auth/profile";
const inputCls = "w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-white/80 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/10 transition-all";
const labelCls = "block text-xs font-medium text-slate-600 mb-1.5";

const ACCENT_COLORS = ["bg-teal-500","bg-purple-500","bg-[#4f46e5]","bg-indigo-400","bg-rose-500","bg-amber-500","bg-sky-500"];

const getInitials = (str = "") =>
  str.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");

const Panel = ({ children }) => (
  <div className="rounded-3xl border-2 border-slate-200/80 bg-white/60 backdrop-blur-sm shadow-lg shadow-slate-200/60 p-6">
    {children}
  </div>
);

const SectionHeader = ({ title, action }) => (
  <div className="flex items-center justify-between mb-5">
    <h2 className="text-base font-semibold text-slate-900">{title}</h2>
    {action}
  </div>
);

const SaveBtn = ({ loading, onClick, label = "Save" }) => (
  <button onClick={onClick} disabled={loading}
    className="inline-flex items-center gap-2 rounded-2xl bg-[#4f46e5] px-5 py-2 text-xs font-medium text-white hover:bg-[#4338ca] transition-colors shadow-sm disabled:opacity-60">
    {loading
      ? <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
      : <HiCheck size={13} />}
    {label}
  </button>
);

const Toast = ({ msg, type }) => (
  <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl border px-4 py-2.5 shadow-xl text-xs font-medium
    ${type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-600"}`}>
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
  }, [profileData]); // eslint-disable-line react-hooks/exhaustive-deps

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
        showToast("Resume upload route not found. Restart the backend server and try again.", "error");
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
    <div className="space-y-5">

      {/* ── Resume Parser ── */}
      <Panel>
        <SectionHeader title="Resume Parser" />
        <div className="rounded-3xl border border-dashed border-[#4f46e5]/30 bg-[linear-gradient(135deg,rgba(79,70,229,0.08),rgba(255,255,255,0.65))] p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-medium text-[#4f46e5] shadow-sm">
                <MdAutoAwesome size={14} />
                AI-assisted resume import
              </div>
              <h3 className="mt-3 text-base font-semibold text-slate-900">Upload your tech resume to auto-fill profile data</h3>
              <p className="mt-1 text-sm text-slate-500">
                The parser extracts name, contact details, headline, skills, experience, education, links, and any other structured resume details it can find, then saves them to your profile.
              </p>
              {p.resumeMeta?.fileName && (
                <p className="mt-2 text-xs text-slate-400">
                  Last parsed: {p.resumeMeta.fileName}
                  {p.resumeMeta.parsedAt ? ` on ${new Date(p.resumeMeta.parsedAt).toLocaleString("en-IN")}` : ""}
                </p>
              )}
            </div>

            <div className="w-full max-w-sm space-y-3">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm hover:border-[#4f46e5]/30">
                <MdOutlineUploadFile size={18} className="text-[#4f46e5]" />
                <span>{resumeFile ? resumeFile.name : "Choose PDF, DOCX, or TXT"}</span>
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
                className="w-full rounded-2xl bg-[#4f46e5] px-4 py-3 text-sm font-medium text-white hover:bg-[#4338ca] transition-colors shadow-sm disabled:opacity-60"
              >
                {resumeLoading ? "Parsing Resume..." : "Upload and Parse Resume"}
              </button>
            </div>
          </div>
        </div>
      </Panel>

      {/* ── Personal Info ── */}
      <Panel>
        <SectionHeader title="Personal Info" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Full Name <span className="text-slate-300 font-normal">(from account)</span></label>
            <input value={username} disabled className={`${inputCls} bg-slate-50 text-slate-400 cursor-not-allowed`} />
          </div>
          <div>
            <label className={labelCls}>Email <span className="text-slate-300 font-normal">(from account)</span></label>
            <input value={email} disabled className={`${inputCls} bg-slate-50 text-slate-400 cursor-not-allowed`} />
          </div>
          {[
            { key: "designation", label: "Designation",   type: "text",  placeholder: "Software Engineer"  },
            { key: "phone",       label: "Phone",         type: "tel",   placeholder: "+91 98765 43210"     },
            { key: "contactEmail",label: "Resume Email",  type: "email", placeholder: "resume@example.com"  },
            { key: "age",         label: "Age",           type: "text",  placeholder: "24"                  },
            { key: "country",     label: "Country",       type: "text",  placeholder: "India"               },
            { key: "city",        label: "City",          type: "text",  placeholder: "Bhubaneswar"         },
            { key: "linkedin",    label: "LinkedIn",      type: "text",  placeholder: "https://linkedin.com/in/username" },
            { key: "github",      label: "GitHub",        type: "text",  placeholder: "https://github.com/username" },
            { key: "portfolio",   label: "Portfolio",     type: "text",  placeholder: "https://yourportfolio.dev" },
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
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Full Address</label>
            <textarea
              value={personal.fullAddress}
              placeholder="Street, area, city, state, postal code"
              onChange={e => setPersonal(prev => ({ ...prev, fullAddress: e.target.value }))}
              rows={3}
              className={inputCls}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Professional Summary</label>
            <textarea
              value={personal.summary}
              placeholder="A short summary parsed from your resume or edited by you"
              onChange={e => setPersonal(prev => ({ ...prev, summary: e.target.value }))}
              rows={4}
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
        <SectionHeader title="Experience"
          action={
            <button onClick={() => setShowExpForm(v => !v)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#4f46e5] px-3.5 py-1.5 text-xs font-medium text-[#4f46e5] hover:bg-[#eef2ff] transition-colors">
              <span className="text-base leading-none">{showExpForm ? "−" : "+"}</span>
              {showExpForm ? "Cancel" : "Add Experience"}
            </button>
          }
        />

        {/* Existing */}
        {experiences.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            {experiences.map((e, i) => (
              <div key={e._id} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm">
                <div className={`h-10 w-10 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-[11px] font-bold ${ACCENT_COLORS[i % ACCENT_COLORS.length]}`}>
                  {getInitials(e.company)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{e.title}</p>
                  <p className="text-xs text-slate-500 truncate">{e.company} · {e.type}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{formatPeriod(e)}</p>
                </div>
                <button onClick={() => deleteExp(e._id)} className="text-slate-300 hover:text-red-500 transition-colors flex-shrink-0">
                  <MdDeleteOutline size={17} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add form */}
        {showExpForm && (
          <div className="border-t border-slate-100 pt-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">New Experience</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: "title",   label: "Job Title",    placeholder: "Frontend Developer" },
                { key: "company", label: "Company Name", placeholder: "TechNova"           },
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
                className="h-4 w-4 rounded border-slate-300 accent-[#4f46e5]" />
              <span className="text-xs text-slate-600">I currently work here</span>
            </label>
            <div className="flex justify-end mt-4">
              <SaveBtn loading={expLoading} onClick={addExp} label="Add Experience" />
            </div>
          </div>
        )}

        {experiences.length === 0 && !showExpForm && (
          <p className="text-xs text-slate-400 text-center py-4">No experience added yet.</p>
        )}
      </Panel>

      {/* ── Education ── */}
      <Panel>
        <SectionHeader title="Education"
          action={
            <button onClick={() => setShowEduForm(v => !v)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#4f46e5] px-3.5 py-1.5 text-xs font-medium text-[#4f46e5] hover:bg-[#eef2ff] transition-colors">
              <span className="text-base leading-none">{showEduForm ? "−" : "+"}</span>
              {showEduForm ? "Cancel" : "Add Education"}
            </button>
          }
        />

        {/* Existing */}
        {educations.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            {educations.map((e, i) => (
              <div key={e._id} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm">
                <div className={`h-10 w-10 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-[11px] font-bold ${ACCENT_COLORS[(i + 2) % ACCENT_COLORS.length]}`}>
                  {getInitials(e.institution)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{e.degree}</p>
                  <p className="text-xs text-slate-500 truncate">{e.institution}{e.field ? ` · ${e.field}` : ""}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{formatPeriod(e)}{e.gpa ? ` · GPA: ${e.gpa}` : ""}</p>
                </div>
                <button onClick={() => deleteEdu(e._id)} className="text-slate-300 hover:text-red-500 transition-colors flex-shrink-0">
                  <MdDeleteOutline size={17} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add form */}
        {showEduForm && (
          <div className="border-t border-slate-100 pt-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">New Education</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: "institution", label: "Institution",    placeholder: "Stanford University"   },
                { key: "degree",      label: "Degree",         placeholder: "Bachelor of Science"   },
                { key: "field",       label: "Field of Study", placeholder: "Computer Science"      },
                { key: "gpa",         label: "GPA / Result",   placeholder: "3.8 / 4.0"             },
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
                className="h-4 w-4 rounded border-slate-300 accent-[#4f46e5]" />
              <span className="text-xs text-slate-600">I currently study here</span>
            </label>
            <div className="flex justify-end mt-4">
              <SaveBtn loading={eduLoading} onClick={addEdu} label="Add Education" />
            </div>
          </div>
        )}

        {educations.length === 0 && !showEduForm && (
          <p className="text-xs text-slate-400 text-center py-4">No education added yet.</p>
        )}
      </Panel>

      {/* ── Skills ── */}
      <Panel>
        <SectionHeader title="Skills" />
        <div className="flex flex-wrap gap-2 mb-4 min-h-[2rem]">
          {skills.length === 0
            ? <p className="text-xs text-slate-400">No skills added yet.</p>
            : skills.map(s => (
              <span key={s} className="inline-flex items-center gap-1.5 rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-medium text-[#4f46e5]">
                {s}
                <button onClick={() => removeSkill(s)} className="hover:text-red-500 transition-colors leading-none">×</button>
              </span>
            ))
          }
        </div>
        <div className="flex gap-2">
          <input
            type="text" value={skillInput} placeholder="e.g. React, Python, Figma..."
            onChange={e => setSkillInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSkill())}
            className={`${inputCls} flex-1`}
          />
          <button onClick={addSkill}
            className="rounded-2xl border border-[#4f46e5] px-4 py-2 text-xs font-medium text-[#4f46e5] hover:bg-[#eef2ff] transition-colors flex-shrink-0">
            Add
          </button>
        </div>
        <p className="text-[11px] text-slate-400 mt-1.5">Press Enter or click Add, then save.</p>
        <div className="flex justify-end mt-3">
          <SaveBtn loading={skillsLoading} onClick={saveSkills} label="Save Skills" />
        </div>
      </Panel>

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
};

export default PersonalInfoForm;
