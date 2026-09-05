import React from "react";
import { FiSun, FiMoon, FiMonitor } from "react-icons/fi";
import { useTheme } from "../lib/useTheme";
import { V } from "../lib/natureTheme";

const ThemeToggle = ({ variant = "button", className = "" }) => {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  if (variant === "segmented") {
    const options = [
      { key: "light", label: "Light", icon: <FiSun size={13} /> },
      { key: "system", label: "System", icon: <FiMonitor size={13} /> },
      { key: "dark", label: "Dark", icon: <FiMoon size={13} /> },
    ];

    return (
      <div
        className={`inline-flex items-center rounded-lg p-1 border ${className}`}
        style={{ backgroundColor: "var(--nt-bg-secondary)", borderColor: "var(--nt-border)" }}
      >
        {options.map((opt) => {
          const active = theme === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => setTheme(opt.key)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                active ? "shadow-sm font-semibold" : "hover:opacity-80"
              }`}
              style={
                active
                  ? {
                      backgroundColor: "var(--nt-bg-card)",
                      color: "var(--nt-accent-gold)",
                      borderColor: "var(--nt-border)",
                      borderWidth: "1px",
                    }
                  : {
                      color: "var(--nt-text-secondary)",
                    }
              }
            >
              {opt.icon}
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === "sidebar") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${className}`}
        style={{ color: "var(--nt-text-secondary)" }}
        title={`Current mode: ${theme} (resolved: ${resolvedTheme}). Click to switch.`}
      >
        <div className="flex items-center gap-2.5">
          <span style={{ color: resolvedTheme === "dark" ? "var(--nt-accent-gold)" : "var(--nt-accent-sage)" }}>
            {resolvedTheme === "dark" ? <FiMoon size={14} /> : <FiSun size={14} />}
          </span>
          <span className="text-xs" style={{ color: "var(--nt-text-primary)" }}>
            {resolvedTheme === "dark" ? "Dark Mode" : "Light Mode"}
          </span>
        </div>
        <span
          className="rounded px-1.5 py-0.5 text-[10px] font-mono uppercase border"
          style={{
            backgroundColor: "var(--nt-bg-card-alt)",
            color: "var(--nt-text-muted)",
            borderColor: "var(--nt-border)",
          }}
        >
          {resolvedTheme}
        </span>
      </button>
    );
  }

  // Default compact icon button
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex h-8 w-8 items-center justify-center rounded-md border transition-all ${className}`}
      style={{
        backgroundColor: "var(--nt-bg-card)",
        borderColor: "var(--nt-border)",
        color: "var(--nt-text-primary)",
      }}
      aria-label="Toggle theme"
      title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
    >
      {resolvedTheme === "dark" ? (
        <FiSun size={14} style={{ color: "var(--nt-accent-gold)" }} className="transition-transform duration-200 hover:rotate-45" />
      ) : (
        <FiMoon size={14} style={{ color: "var(--nt-accent-sage)" }} className="transition-transform duration-200 hover:-rotate-12" />
      )}
    </button>
  );
};

export default ThemeToggle;
