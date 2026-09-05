import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BsPerson, BsShieldLock, BsTrash, BsInfoCircle, BsSun, BsMoon, BsDisplay } from "react-icons/bs";
import { HiCheck, HiX } from "react-icons/hi";
import api from "../lib/api";
import { useTheme } from "../lib/useTheme";

const API = "/auth/settings";

// ── Reusable input ─────────────────────────────────────────────────────────
const Field = ({ label, id, type = "text", value, onChange, disabled, placeholder, hint }) => (
  <div>
    <label htmlFor={id} className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--nt-text-secondary)" }}>
      {label}
      {disabled && (
        <span
          className="ml-2 rounded px-1.5 py-0.5 text-[10px] font-mono border"
          style={{
            backgroundColor: "var(--nt-bg-secondary)",
            borderColor: "var(--nt-border)",
            color: "var(--nt-text-muted)",
          }}
        >
          read-only
        </span>
      )}
    </label>
    <input
      id={id} type={type} value={value} onChange={onChange}
      disabled={disabled} placeholder={placeholder}
      className={`w-full px-3 py-2 rounded-md border text-xs font-mono transition-all focus:outline-none ${
        disabled ? "opacity-60 cursor-not-allowed" : ""
      }`}
      style={{
        backgroundColor: disabled ? "var(--nt-bg-secondary)" : "var(--nt-bg-card-alt)",
        borderColor: "var(--nt-border)",
        color: "var(--nt-text-primary)",
      }}
    />
    {hint && <p className="mt-1 text-[11px]" style={{ color: "var(--nt-text-muted)" }}>{hint}</p>}
  </div>
);

// ── Toast ──────────────────────────────────────────────────────────────────
const Toast = ({ msg, type, onClose }) => (
  <div
    className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg border px-4 py-2.5 shadow-xl text-xs font-medium transition-all"
    style={{
      backgroundColor: "var(--nt-bg-card)",
      borderColor: type === "success" ? "var(--nt-accent-sage)" : "#D9534F",
      color: type === "success" ? "var(--nt-accent-sage)" : "#D9534F",
    }}
  >
    {type === "success" ? <HiCheck size={16} /> : <HiX size={16} />}
    <span>{msg}</span>
    <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><HiX size={14} /></button>
  </div>
);

// ── Section wrapper ────────────────────────────────────────────────────────
const Section = ({ icon, title, subtitle, children }) => (
  <div
    className="rounded-lg border overflow-hidden shadow-none"
    style={{
      backgroundColor: "var(--nt-bg-card)",
      borderColor: "var(--nt-border)",
      boxShadow: "var(--nt-shadow-sm)",
    }}
  >
    <div className="p-5">
      <div className="flex items-center gap-3 mb-5 border-b pb-3.5" style={{ borderColor: "var(--nt-border)" }}>
        <span
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border"
          style={{
            backgroundColor: "var(--nt-bg-secondary)",
            borderColor: "var(--nt-border)",
            color: "var(--nt-text-primary)",
          }}
        >
          {icon}
        </span>
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "var(--nt-text-primary)" }}>{title}</h3>
          {subtitle && <p className="text-xs mt-0.5" style={{ color: "var(--nt-text-secondary)" }}>{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  </div>
);

// ── Main ───────────────────────────────────────────────────────────────────
const Settings = () => {
  const navigate = useNavigate();
  const { theme, setTheme, resolvedTheme } = useTheme();
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--nt-bg-primary)" }}>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-2 w-2 rounded-full animate-pulse"
              style={{ backgroundColor: "var(--nt-accent-sage)", animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen px-4 py-6 md:px-8 lg:px-6 lg:py-6 transition-colors duration-150"
      style={{
        backgroundColor: "var(--nt-bg-primary)",
        color: "var(--nt-text-primary)",
      }}
    >
      <div className="mx-auto max-w-3xl flex flex-col gap-5">

        {/* Page header */}
        <div className="border-b pb-4" style={{ borderColor: "var(--nt-border)" }}>
          <h1 className="text-base font-semibold tracking-tight" style={{ color: "var(--nt-text-primary)" }}>System Settings</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--nt-text-secondary)" }}>Manage preferences, security configuration, and authentication credentials.</p>
        </div>

        {/* ── Appearance & Theme ── */}
        <Section icon={<BsSun size={15} />} title="Theme Configuration" subtitle="Select interface mode for telemetry and workspace.">
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: "light", label: "Light Mode", icon: <BsSun size={16} style={{ color: "var(--nt-accent-gold)" }} />, desc: "Warm Sand & Sage" },
              { id: "dark", label: "Dark Mode", icon: <BsMoon size={16} style={{ color: "var(--nt-accent-sage)" }} />, desc: "Deep Forest & Teal" },
              { id: "system", label: "System Sync", icon: <BsDisplay size={16} style={{ color: "var(--nt-text-muted)" }} />, desc: `Auto (${resolvedTheme})` },
            ].map((opt) => {
              const active = theme === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTheme(opt.id)}
                  className="flex flex-col items-center text-center p-3.5 rounded-lg border transition-all"
                  style={
                    active
                      ? {
                          backgroundColor: "var(--nt-bg-card-alt)",
                          borderColor: "var(--nt-accent-sage)",
                          color: "var(--nt-accent-sage)",
                          borderWidth: "1.5px",
                        }
                      : {
                          backgroundColor: "var(--nt-bg-secondary)",
                          borderColor: "var(--nt-border)",
                          color: "var(--nt-text-primary)",
                        }
                  }
                >
                  <div
                    className="p-2 rounded-md border mb-2"
                    style={{
                      backgroundColor: "var(--nt-bg-card)",
                      borderColor: "var(--nt-border)",
                    }}
                  >
                    {opt.icon}
                  </div>
                  <span className="text-xs font-semibold" style={{ color: active ? "var(--nt-accent-sage)" : "var(--nt-text-primary)" }}>
                    {opt.label}
                  </span>
                  <span className="text-[10px] mt-0.5" style={{ color: "var(--nt-text-muted)" }}>
                    {opt.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </Section>

        {/* ── Account Info (read-only) ── */}
        <Section icon={<BsInfoCircle size={15} />} title="System Identity" subtitle="Machine and identity metadata managed by the backend engine.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Account ID"     id="id"        value={user?.id || ""}          disabled />
            <Field label="Role"           id="role"      value={user?.role || "user"}     disabled />
            <Field label="Member Since"   id="createdAt" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""} disabled />
            <Field label="Total Telemetry Applications" id="apps"  value={String(user?.totalApplied ?? 0)} disabled />
          </div>
        </Section>

        {/* ── Edit Profile ── */}
        <Section icon={<BsPerson size={15} />} title="Profile Credentials" subtitle="Update user identifier and notification communication address.">
          <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Full Name" id="username" value={profile.username}
                onChange={(e) => setProfile((p) => ({ ...p, username: e.target.value }))}
                placeholder="Developer name"
              />
              <Field
                label="Email Address" id="email" type="email" value={profile.email}
                onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                placeholder="dev@example.com"
                hint="Modifying email requires session re-authentication."
              />
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="submit" disabled={profileLoading}
                className="inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors shadow-none disabled:opacity-60"
                style={{
                  backgroundColor: "var(--nt-accent-gold)",
                  color: "var(--nt-btn-cta-text)",
                }}
              >
                {profileLoading ? (
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : <HiCheck size={14} />}
                Save Changes
              </button>
            </div>
          </form>
        </Section>

        {/* ── Change Password ── */}
        <Section icon={<BsShieldLock size={15} />} title="Security Authentication" subtitle="Maintain secure cryptographic credentials.">
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
            <div className="flex justify-end pt-2">
              <button
                type="submit" disabled={pwdLoading}
                className="inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors shadow-none disabled:opacity-60"
                style={{
                  backgroundColor: "var(--nt-accent-gold)",
                  color: "var(--nt-btn-cta-text)",
                }}
              >
                {pwdLoading ? (
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : <BsShieldLock size={13} />}
                Update Password
              </button>
            </div>
          </form>
        </Section>

        {/* ── Danger Zone ── */}
        <div
          className="rounded-lg border p-5"
          style={{
            backgroundColor: "var(--nt-bg-card)",
            borderColor: "#D9534F",
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border"
              style={{
                backgroundColor: "rgba(217, 83, 79, 0.15)",
                borderColor: "rgba(217, 83, 79, 0.3)",
                color: "#D9534F",
              }}
            >
              <BsTrash size={14} />
            </span>
            <div>
              <h3 className="text-sm font-semibold" style={{ color: "#D9534F" }}>Danger Zone</h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--nt-text-secondary)" }}>Permanent operations that will erase all telemetry and account history.</p>
            </div>
          </div>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-md border px-3.5 py-2 text-xs font-semibold transition-colors"
              style={{
                borderColor: "#D9534F",
                color: "#D9534F",
                backgroundColor: "transparent",
              }}
            >
              Delete Account
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-xs leading-relaxed" style={{ color: "#D9534F" }}>
                This will permanently delete your account and all associated application telemetry. Enter password to confirm execution.
              </p>
              <input
                type="password" value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter account password"
                className="w-full px-3 py-2 rounded-md border text-xs font-mono focus:outline-none"
                style={{
                  backgroundColor: "var(--nt-bg-card-alt)",
                  borderColor: "#D9534F",
                  color: "var(--nt-text-primary)",
                }}
              />
              <div className="flex gap-2.5">
                <button
                  onClick={handleDeleteAccount} disabled={!deletePassword || deleteLoading}
                  className="inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-50"
                  style={{ backgroundColor: "#D9534F" }}
                >
                  {deleteLoading ? (
                    <span className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : <BsTrash size={12} />}
                  Confirm Permanent Deletion
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeletePassword(""); }}
                  className="rounded-md border px-3 py-2 text-xs font-semibold transition-colors"
                  style={{
                    backgroundColor: "var(--nt-btn-sec-bg)",
                    borderColor: "var(--nt-border)",
                    color: "var(--nt-text-primary)",
                  }}
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
