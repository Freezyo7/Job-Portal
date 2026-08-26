import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BsPerson, BsShieldLock, BsTrash, BsInfoCircle } from "react-icons/bs";
import { HiCheck, HiX } from "react-icons/hi";
import api from "../lib/api";

const API = "/auth/settings";

// ── Reusable input ─────────────────────────────────────────────────────────
const Field = ({ label, id, type = "text", value, onChange, disabled, placeholder, hint }) => (
  <div>
    <label htmlFor={id} className="block text-xs font-medium text-slate-600 mb-1.5">
      {label}
      {disabled && (
        <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-normal text-slate-400">
          read-only
        </span>
      )}
    </label>
    <input
      id={id} type={type} value={value} onChange={onChange}
      disabled={disabled} placeholder={placeholder}
      className={`w-full px-4 py-2.5 rounded-2xl border text-sm transition-all focus:outline-none
        ${disabled
          ? "border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed"
          : "border-slate-200 bg-white/80 text-slate-800 placeholder:text-slate-300 focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/10"
        }`}
    />
    {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
  </div>
);

// ── Toast ──────────────────────────────────────────────────────────────────
const Toast = ({ msg, type, onClose }) => (
  <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-xl text-sm font-medium transition-all
    ${type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-600"}`}>
    {type === "success" ? <HiCheck size={16} /> : <HiX size={16} />}
    {msg}
    <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100"><HiX size={14} /></button>
  </div>
);

// ── Section wrapper ────────────────────────────────────────────────────────
const Section = ({ icon, title, subtitle, children }) => (
  <div className="rounded-3xl border-2 border-slate-200/80 bg-white/60 backdrop-blur-sm shadow-lg shadow-slate-200/60 overflow-hidden">
    <div className="h-1 w-full bg-[linear-gradient(135deg,#03001e,#7303c0,#ec38bc,#fdeff9)]" />
    <div className="p-6">
      <div className="flex items-center gap-3 mb-5">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[#eef2ff] text-[#4f46e5]">
          {icon}
        </span>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  </div>
);

// ── Main ───────────────────────────────────────────────────────────────────
const Settings = () => {
  const navigate = useNavigate();
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast]     = useState(null);

  // Profile form
  const [profile, setProfile]           = useState({ username: "", email: "" });
  const [profileLoading, setProfileLoading] = useState(false);

  // Password form
  const [pwd, setPwd]           = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwdLoading, setPwdLoading] = useState(false);

  // Delete account
  const [deletePassword, setDeletePassword]   = useState("");
  const [deleteLoading, setDeleteLoading]     = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch current user settings
  useEffect(() => {
    api.get(API)
      .then((res) => {
        const raw = res.data && typeof res.data === "object" ? res.data : null;
        // Normalise Django field names for the UI
        const safeUser = raw ? {
          ...raw,
          createdAt:    raw.date_joined,
          totalApplied: raw.total_applied,
        } : null;
        setUser(safeUser);
        setProfile({
          username: safeUser?.username || "",
          email:    safeUser?.email    || "",
        });
      })
      .catch((err) => {
        if (err.response?.status === 401) navigate("/login");
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  // ── Update profile ──
  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const res = await api.patch(`${API}/profile/`, profile);
      if (res.data?.email_changed) {
        // Account deactivated – will be redirected to login after cookie is cleared
        showToast("Email updated. Please verify your new inbox to continue.");
        setTimeout(() => navigate("/login"), 2500);
        return;
      }
      const updated = res.data?.user ?? res.data;
      setUser((u) => ({
        ...u,
        ...updated,
        createdAt:    updated?.date_joined    ?? u.createdAt,
        totalApplied: updated?.total_applied  ?? u.totalApplied,
      }));
      showToast("Profile updated successfully");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update profile", "error");
    } finally {
      setProfileLoading(false);
    }
  };

  // ── Change password ──
  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (pwd.newPassword !== pwd.confirmPassword) {
      showToast("New passwords do not match", "error");
      return;
    }
    setPwdLoading(true);
    try {
      await api.patch(`${API}/password/`, {
        currentPassword: pwd.currentPassword,
        newPassword: pwd.newPassword,
      });
      setPwd({ currentPassword: "", newPassword: "", confirmPassword: "" });
      showToast("Password changed successfully");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to change password", "error");
    } finally {
      setPwdLoading(false);
    }
  };

  // ── Delete account ──
  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`${API}/account/`, {
        data: { password: deletePassword },
      });
      navigate("/signup");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete account", "error");
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f3f4ff] via-[#f6f7ff] to-[#e9f0ff] flex items-center justify-center">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-2.5 w-2.5 rounded-full bg-[#4f46e5] animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f3f4ff] via-[#f6f7ff] to-[#e9f0ff] px-4 py-6 md:px-8 lg:px-6 lg:py-5 text-slate-900">
      <div className="mx-auto max-w-3xl flex flex-col gap-5">

        {/* Page header */}
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Settings</h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage your account preferences and security.</p>
        </div>

        {/* ── Account Info (read-only) ── */}
        <Section icon={<BsInfoCircle size={16} />} title="Account Info" subtitle="These fields are managed by the system and cannot be edited.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Account ID"     id="id"        value={user?.id || ""}          disabled />
            <Field label="Role"           id="role"      value={user?.role || "user"}     disabled />
            <Field label="Member Since"   id="createdAt" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : ""} disabled />
            <Field label="Total Applications" id="apps"  value={String(user?.totalApplied ?? 0)} disabled />
          </div>
        </Section>

        {/* ── Edit Profile ── */}
        <Section icon={<BsPerson size={16} />} title="Edit Profile" subtitle="Update your display name and email address.">
          <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Full Name" id="username" value={profile.username}
                onChange={(e) => setProfile((p) => ({ ...p, username: e.target.value }))}
                placeholder="Your name"
              />
              <Field
                label="Email Address" id="email" type="email" value={profile.email}
                onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                placeholder="you@example.com"
                hint="Changing email will require you to log in again."
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit" disabled={profileLoading}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#4f46e5] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#4338ca] transition-colors shadow-sm disabled:opacity-60"
              >
                {profileLoading ? (
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : <HiCheck size={15} />}
                Save Changes
              </button>
            </div>
          </form>
        </Section>

        {/* ── Change Password ── */}
        <Section icon={<BsShieldLock size={16} />} title="Change Password" subtitle="Use a strong password you don't use elsewhere.">
          <form onSubmit={handlePasswordSave} className="flex flex-col gap-4">
            <Field
              label="Current Password" id="currentPassword" type="password"
              value={pwd.currentPassword}
              onChange={(e) => setPwd((p) => ({ ...p, currentPassword: e.target.value }))}
              placeholder="••••••••"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="New Password" id="newPassword" type="password"
                value={pwd.newPassword}
                onChange={(e) => setPwd((p) => ({ ...p, newPassword: e.target.value }))}
                placeholder="••••••••" hint="Minimum 6 characters."
              />
              <Field
                label="Confirm New Password" id="confirmPassword" type="password"
                value={pwd.confirmPassword}
                onChange={(e) => setPwd((p) => ({ ...p, confirmPassword: e.target.value }))}
                placeholder="••••••••"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit" disabled={pwdLoading}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#4f46e5] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#4338ca] transition-colors shadow-sm disabled:opacity-60"
              >
                {pwdLoading ? (
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : <BsShieldLock size={14} />}
                Update Password
              </button>
            </div>
          </form>
        </Section>

        {/* ── Danger Zone ── */}
        <div className="rounded-3xl border-2 border-red-100 bg-red-50/40 backdrop-blur-sm shadow-lg shadow-red-100/40 p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-red-100 text-red-500">
              <BsTrash size={16} />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-red-700">Danger Zone</h3>
              <p className="text-[11px] text-red-400 mt-0.5">These actions are permanent and cannot be undone.</p>
            </div>
          </div>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-2xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              Delete My Account
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-red-600 leading-relaxed">
                This will permanently delete your account and all your application data. Enter your password to confirm.
              </p>
              <input
                type="password" value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter your password to confirm"
                className="w-full px-4 py-2.5 rounded-2xl border border-red-200 bg-white text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/10 transition-all"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteAccount} disabled={!deletePassword || deleteLoading}
                  className="inline-flex items-center gap-2 rounded-2xl bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {deleteLoading ? (
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : <BsTrash size={13} />}
                  Yes, Delete Account
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeletePassword(""); }}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default Settings;
