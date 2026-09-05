import React from "react";
import { AiOutlineFileDone } from "react-icons/ai";
import { IoCheckmarkDoneCircleOutline } from "react-icons/io5";
import { BsHourglassSplit } from "react-icons/bs";
import { HiMiniSparkles } from "react-icons/hi2";

const DashCards = ({ statusCounts, totalApplications }) => {
  const cards = [
    {
      icon: <AiOutlineFileDone size={18} />,
      value: totalApplications,
      label: "Applications Submitted",
      note: "Tracked by Django",
      pill: "Active",
      color: "var(--nt-accent-sage)",
    },
    {
      icon: <BsHourglassSplit size={16} />,
      value: statusCounts["Under Review"] || 0,
      label: "Under Review",
      note: "Awaiting recruiter updates",
      pill: "Pending",
      color: "var(--nt-accent-gold)",
    },
    {
      icon: <HiMiniSparkles size={18} />,
      value: statusCounts["Shortlisted"] || 0,
      label: "Shortlisted",
      note: "Strongest active pipeline",
      pill: "Pipeline",
      color: "var(--nt-accent-sage)",
    },
    {
      icon: <IoCheckmarkDoneCircleOutline size={18} />,
      value: statusCounts["Offer Received"] || 0,
      label: "Offers Received",
      note: "Final-stage wins",
      pill: "Wins",
      color: "var(--nt-accent-gold)",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card, i) => (
        <div
          key={i}
          className="rounded-lg border p-4 transition-colors"
          style={{
            backgroundColor: "var(--nt-bg-card)",
            borderColor: "var(--nt-border)",
            boxShadow: "var(--nt-shadow-sm)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border"
              style={{
                backgroundColor: "var(--nt-bg-secondary)",
                borderColor: "var(--nt-border)",
                color: card.color,
              }}
            >
              {card.icon}
            </span>
            <span
              className="inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold"
              style={{
                backgroundColor: "var(--nt-bg-secondary)",
                borderColor: "var(--nt-border)",
                color: card.color,
              }}
            >
              {card.pill}
            </span>
          </div>
          <p
            className="text-2xl font-bold font-mono tracking-tight"
            style={{ color: "var(--nt-text-primary)" }}
          >
            {card.value}
          </p>
          <p
            className="mt-1 text-xs font-medium"
            style={{ color: "var(--nt-text-secondary)" }}
          >
            {card.label}
          </p>
          <p
            className="mt-1 text-[11px]"
            style={{ color: "var(--nt-text-muted)" }}
          >
            {card.note}
          </p>
        </div>
      ))}
    </div>
  );
};

export default DashCards;
