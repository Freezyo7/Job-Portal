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
    "inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-700 shadow-sm transition-colors";
  const variants = {
    default: "bg-slate-50 hover:bg-slate-100",
    ghost: "bg-white/70 hover:bg-white border border-slate-100",
    danger: "bg-[#ef4444] text-white hover:bg-[#dc2626]",
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
      "relative px-3.5 pb-3 text-xs font-medium md:text-sm",
      active ? "text-slate-900" : "text-slate-400 hover:text-slate-700",
    ].join(" ")}
  >
    {children}
    {active && (
      <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#4f46e5]" />
    )}
  </button>
);

export const MetaChip = ({ icon, children }) => (
  <span className="inline-flex items-center gap-1.5 border rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
    {icon && <span className="text-sm">{icon}</span>}
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

export const MicIcon = () => <CiMicrophoneOn size={25} />;
export const MicOffIcon = () => (
  <WithOffOverlay>
    <CiMicrophoneOn size={25} className="text-slate-500" />
  </WithOffOverlay>
);

export const CameraIcon = () => <CiCamera size={25} />;
export const CameraOffIcon = () => (
  <WithOffOverlay>
    <CiCamera size={25} className="text-slate-500" />
  </WithOffOverlay>
);

export const ScreenShareIcon = () => <MdOutlineScreenshotMonitor size={25} />;
export const ScreenShareOffIcon = () => (
  <WithOffOverlay>
    <MdOutlineScreenshotMonitor size={25} className="text-slate-500" />
  </WithOffOverlay>
);

export const RecordIcon = () => <VscRecord size={25} />;
export const RecordOffIcon = () => (
  <WithOffOverlay>
    <VscRecord size={25} className="text-slate-500" />
  </WithOffOverlay>
);

export const PhoneOffIcon = () => <ImPhoneHangUp />;
