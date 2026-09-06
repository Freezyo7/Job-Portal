import React from "react";
import { AiOutlineFileText } from "react-icons/ai";
import { BsHourglassSplit } from "react-icons/bs";
import { HiSparkles } from "react-icons/hi2";
import { IoCheckmarkDoneCircleOutline } from "react-icons/io5";

const DashCards = ({ statusCounts = {}, totalApplications = 46 }) => {
  const cards = [
    {
      icon: <AiOutlineFileText size={20} />,
      iconBg: "#E1ECE2",
      iconColor: "#39745A",
      value: totalApplications || 46,
      label: "Applications Submitted",
      note: "Tracked by Django",
      pill: "Active",
      pillBg: "#E1ECE2",
      pillColor: "#47745B",
      trend: "↑ 12% from last month",
      trendColor: "#4F8B6C",
      sparklineColor: "#5C9478",
      sparklinePath: "M 0 16 C 16 16, 24 7, 40 11 C 52 14, 60 5, 76 6",
      cardBg: "#FAF8F2",
      cardBorder: "#E2DCCD",
    },
    {
      icon: <BsHourglassSplit size={18} />,
      iconBg: "#F4EBDD",
      iconColor: "#A77A37",
      value: statusCounts["Under Review"] || 0,
      label: "Under Review",
      note: "Awaiting recruiter updates",
      pill: "Pending",
      pillBg: "#F4EBDD",
      pillColor: "#9A7137",
      sparklineColor: "#B68A4A",
      sparklinePath: "M 0 14 C 18 14, 28 7, 46 14 C 58 18, 66 9, 76 12",
      cardBg: "#FAF8F2",
      cardBorder: "#E2DCCD",
    },
    {
      icon: <HiSparkles size={20} />,
      iconBg: "#E1ECE2",
      iconColor: "#39745A",
      value: statusCounts["Shortlisted"] || 0,
      label: "Shortlisted",
      note: "Strongest active pipeline",
      pill: "Pipeline",
      pillBg: "#E2ECE5",
      pillColor: "#4F7560",
      sparklineColor: "#5C9478",
      sparklinePath: "M 0 15 C 18 15, 27 9, 44 14 C 57 17, 65 7, 76 10",
      cardBg: "#FAF8F2",
      cardBorder: "#E2DCCD",
    },
    {
      icon: <IoCheckmarkDoneCircleOutline size={20} />,
      iconBg: "#F4EBDD",
      iconColor: "#A77A37",
      value: statusCounts["Offer Received"] || 0,
      label: "Offers Received",
      note: "Final-stage wins",
      pill: "Wins",
      pillBg: "#F6EEDC",
      pillColor: "#A17634",
      sparklineColor: "#B68A4A",
      sparklinePath: "M 0 14 C 15 14, 25 8, 40 13 C 54 18, 64 7, 76 10",
      cardBg: "#FAF8F2",
      cardBorder: "#E2DCCD",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div
          key={i}
          className="rounded-2xl border flex flex-col justify-between transition-all duration-200 hover:shadow-md"
          style={{
            backgroundColor: card.cardBg,
            borderColor: card.cardBorder,
            padding: "18px 20px",
            boxShadow:
              "0 4px 12px rgba(86, 75, 52, 0.04), 0 12px 30px rgba(86, 75, 52, 0.03)",
          }}
        >
          {/* Top: Icon + Pill */}
          <div className="flex items-start justify-between mb-3">
            <span
              className="inline-flex items-center justify-center rounded-xl flex-shrink-0"
              style={{
                width: 48,
                height: 48,
                backgroundColor: card.iconBg,
                color: card.iconColor,
                border: "1px solid rgba(218, 207, 187, 0.55)",
                boxShadow: "0 4px 12px rgba(95, 77, 45, 0.04)",
              }}
            >
              {card.icon}
            </span>
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
              style={{ backgroundColor: card.pillBg, color: card.pillColor }}
            >
              {card.pill}
            </span>
          </div>

          {/* Value */}
          <p
            className="font-bold font-mono leading-none tracking-tight mb-1.5"
            style={{ color: "#263A3B", fontSize: "32px", fontWeight: 700 }}
          >
            {card.value}
          </p>

          {/* Label */}
          <p
            className="text-[13px] font-semibold leading-snug"
            style={{ color: "var(--text-primary)" }}
          >
            {card.label}
          </p>

          {/* Note */}
          <p
            className="text-[11px] mt-0.5 mb-4"
            style={{ color: "var(--text-muted)" }}
          >
            {card.note}
          </p>

          {/* Bottom: Trend + Sparkline */}
          <div className="flex items-center justify-between">
            {card.trend ? (
              <span
                className="text-[11px] font-semibold"
                style={{ color: card.trendColor }}
              >
                {card.trend}
              </span>
            ) : (
              <span />
            )}
            <svg
              width="80"
              height="22"
              viewBox="0 0 80 22"
              className="overflow-visible"
              style={{ opacity: 0.85 }}
            >
              <path
                d={card.sparklinePath}
                fill="none"
                stroke={card.sparklineColor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashCards;
