import React from "react";
import { CiMicrophoneOn, CiCamera } from "react-icons/ci";
import { VscRecord } from "react-icons/vsc";
import { MdOutlineScreenshotMonitor } from "react-icons/md";
import { ImPhoneHangUp } from "react-icons/im";

export const IconButton = ({
  kind = "default",
  children,
  pressed,
  ariaLabel,
  className = "",
  ...props
}) => {
  const base =
    "inline-flex h-9 w-9 items-center justify-center rounded-md text-zinc-700 dark:text-zinc-200 transition-colors";
  const variants = {
    default: "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700/60",
    ghost: "bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800",
    danger: "bg-rose-600 text-white hover:bg-rose-700 border border-rose-600",
  };

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={typeof pressed === "boolean" ? pressed : undefined}
      className={`${base} ${variants[kind]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const Tab = ({ active, children, onClick }) => (
  <button
    onClick={onClick}
    className={[
      "relative px-3.5 pb-2.5 text-xs font-semibold uppercase tracking-wider transition-colors",
      active ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200",
    ].join(" ")}
  >
    {children}
    {active && (
      <span className="absolute inset-x-0 bottom-0 h-0.5 bg-emerald-500" />
    )}
  </button>
);

export const MetaChip = ({ icon, children }) => (
  <span className="inline-flex items-center gap-1.5 border border-zinc-200 dark:border-zinc-800 rounded-md bg-zinc-50 dark:bg-zinc-900 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
    {icon && <span className="text-sm text-zinc-500">{icon}</span>}
    {children}
  </span>
);

/* --- Simple icons (can be replaced with your own icon set) --- */

const OffSlash = ({ className = "" }) => (
  <span
    className={[
      "pointer-events-none absolute left-1/2 top-1/2 h-[2px] w-7 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded bg-rose-500",
      className,
    ].join(" ")}
  />
);

const WithOffOverlay = ({ children }) => (
  <span className="relative inline-flex items-center justify-center">
    {children}
    <OffSlash />
  </span>
);

export const MicIcon = () => <CiMicrophoneOn size={20} />;
export const MicOffIcon = () => (
  <WithOffOverlay>
    <CiMicrophoneOn size={20} className="text-zinc-500 dark:text-zinc-400" />
  </WithOffOverlay>
);

export const CameraIcon = () => <CiCamera size={20} />;
export const CameraOffIcon = () => (
  <WithOffOverlay>
    <CiCamera size={20} className="text-zinc-500 dark:text-zinc-400" />
  </WithOffOverlay>
);

export const ScreenShareIcon = () => <MdOutlineScreenshotMonitor size={20} />;
export const ScreenShareOffIcon = () => (
  <WithOffOverlay>
    <MdOutlineScreenshotMonitor size={20} className="text-zinc-500 dark:text-zinc-400" />
  </WithOffOverlay>
);

export const RecordIcon = () => <VscRecord size={20} />;
export const RecordOffIcon = () => (
  <WithOffOverlay>
    <VscRecord size={20} className="text-zinc-500 dark:text-zinc-400" />
  </WithOffOverlay>
);

export const PhoneOffIcon = () => <ImPhoneHangUp size={16} />;


