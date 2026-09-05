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
  style = {},
  ...props
}) => {
  const base =
    "inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors";

  let variantStyle = {};
  if (kind === "default") {
    variantStyle = {
      backgroundColor: "var(--nt-bg-secondary)",
      borderColor: "var(--nt-border)",
      color: "var(--nt-text-primary)",
      borderWidth: "1px",
    };
  } else if (kind === "ghost") {
    variantStyle = {
      backgroundColor: "var(--nt-bg-card)",
      borderColor: "var(--nt-border)",
      color: "var(--nt-text-primary)",
      borderWidth: "1px",
    };
  } else if (kind === "danger") {
    variantStyle = {
      backgroundColor: "#D9534F",
      borderColor: "#D9534F",
      color: "#FFFFFF",
      borderWidth: "1px",
    };
  }

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={typeof pressed === "boolean" ? pressed : undefined}
      className={`${base} ${className}`}
      style={{ ...variantStyle, ...style }}
      {...props}
    >
      {children}
    </button>
  );
};

export const Tab = ({ active, children, onClick }) => (
  <button
    onClick={onClick}
    className="relative px-3.5 pb-2.5 text-xs font-semibold uppercase tracking-wider transition-colors"
    style={{
      color: active ? "var(--nt-text-primary)" : "var(--nt-text-muted)",
    }}
  >
    {children}
    {active && (
      <span
        className="absolute inset-x-0 bottom-0 h-0.5"
        style={{ backgroundColor: "var(--nt-accent-sage)" }}
      />
    )}
  </button>
);

export const MetaChip = ({ icon, children }) => (
  <span
    className="inline-flex items-center gap-1.5 border rounded-md px-2.5 py-1 text-xs font-medium"
    style={{
      backgroundColor: "var(--nt-bg-secondary)",
      borderColor: "var(--nt-border)",
      color: "var(--nt-text-primary)",
    }}
  >
    {icon && <span className="text-sm" style={{ color: "var(--nt-text-muted)" }}>{icon}</span>}
    {children}
  </span>
);

/* --- Simple icons --- */

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
    <CiMicrophoneOn size={20} style={{ color: "var(--nt-text-muted)" }} />
  </WithOffOverlay>
);

export const CameraIcon = () => <CiCamera size={20} />;
export const CameraOffIcon = () => (
  <WithOffOverlay>
    <CiCamera size={20} style={{ color: "var(--nt-text-muted)" }} />
  </WithOffOverlay>
);

export const ScreenShareIcon = () => <MdOutlineScreenshotMonitor size={20} />;
export const ScreenShareOffIcon = () => (
  <WithOffOverlay>
    <MdOutlineScreenshotMonitor size={20} style={{ color: "var(--nt-text-muted)" }} />
  </WithOffOverlay>
);

export const RecordIcon = () => <VscRecord size={20} />;
export const RecordOffIcon = () => (
  <WithOffOverlay>
    <VscRecord size={20} style={{ color: "var(--nt-text-muted)" }} />
  </WithOffOverlay>
);

export const PhoneOffIcon = () => <ImPhoneHangUp size={16} />;
