import React from "react";
import { FiSun, FiMoon, FiMonitor } from "react-icons/fi";
import { useTheme } from "../lib/useTheme";

const ThemeToggle = ({ variant = "button", className = "" }) => {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  if (variant === "segmented") {
    const options = [
      { key: "light", label: "Light", icon: <FiSun size={13} /> },
      { key: "system", label: "System", icon: <FiMonitor size={13} /> },
      { key: "dark", label: "Dark", icon: <FiMoon size={13} /> },
    ];

    return (
      <div className={`inline-flex items-center rounded-lg bg-zinc-100 dark:bg-zinc-900 p-1 border border-zinc-200 dark:border-zinc-800 ${className}`}>
        {options.map((opt) => {
          const active = theme === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => setTheme(opt.key)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                active
                  ? "bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-zinc-200/80 dark:border-zinc-700/80 font-semibold"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
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
        className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-zinc-100 ${className}`}
        title={`Current mode: ${theme} (resolved: ${resolvedTheme}). Click to switch.`}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-zinc-500 dark:text-zinc-400">
            {resolvedTheme === "dark" ? <FiMoon size={14} className="text-emerald-400" /> : <FiSun size={14} className="text-amber-500" />}
          </span>
          <span className="text-xs">{resolvedTheme === "dark" ? "Dark Mode" : "Light Mode"}</span>
        </div>
        <span className="rounded bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono uppercase text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/50">
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
      className={`relative inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all ${className}`}
      aria-label="Toggle theme"
      title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
    >
      {resolvedTheme === "dark" ? (
        <FiSun size={14} className="text-emerald-400 transition-transform duration-200 hover:rotate-45" />
      ) : (
        <FiMoon size={14} className="text-zinc-700 transition-transform duration-200 hover:-rotate-12" />
      )}
    </button>
  );
};

export default ThemeToggle;

