import React from "react";
import { AiOutlineFileText } from "react-icons/ai";
import { BsHourglassSplit } from "react-icons/bs";
import { HiSparkles } from "react-icons/hi2";
import { IoCheckmarkDoneCircleOutline } from "react-icons/io5";

const DashCards = ({ statusCounts = {}, totalApplications = 46 }) => {
  const cards = [
    {
      icon: <AiOutlineFileText size={19} />,
      iconBg: "bg-[#E2EFE6] text-[#4E7C61] dark:bg-[#1E3B29] dark:text-[#6FAF7B]",
      value: totalApplications || 46,
      label: "Applications Submitted",
      note: "Tracked by Django",
      pill: "Active",
      pillClass: "bg-[#DCEDE1] text-[#2F7B4C] dark:bg-[#1E3B29] dark:text-[#6FAF7B]",
      trend: "↑ 12% from last month",
      trendColor: "text-[#4E7C61] dark:text-[#6FAF7B]",
      sparklineColor: "#4E7C61",
      sparklinePath: "M 0 16 C 18 16, 26 6, 42 12 C 54 16, 62 4, 75 6",
      cardBg: "bg-[#F4F8F5] dark:bg-[#15271D]",
      cardBorder: "border-[#DEEBE1] dark:border-[#223E2D]",
    },
    {
      icon: <BsHourglassSplit size={18} />,
      iconBg: "bg-[#F6E9D8] text-[#B86F47] dark:bg-[#382615] dark:text-[#FBBF24]",
      value: statusCounts["Under Review"] || 0,
      label: "Under Review",
      note: "Awaiting recruiter updates",
      pill: "Pending",
      pillClass: "bg-[#F9EBD8] text-[#A65E36] dark:bg-[#382615] dark:text-[#FBBF24]",
      sparklineColor: "#B86F47",
      sparklinePath: "M 0 15 C 20 15, 30 7, 48 15 C 60 19, 68 9, 75 11",
      cardBg: "bg-[#FAF6F0] dark:bg-[#231C16]",
      cardBorder: "border-[#EFE5D6] dark:border-[#382C1F]",
    },
    {
      icon: <HiSparkles size={19} />,
      iconBg: "bg-[#DCF0EA] text-[#2E8B7A] dark:bg-[#13354C] dark:text-[#38BDF8]",
      value: statusCounts["Shortlisted"] || 0,
      label: "Shortlisted",
      note: "Strongest active pipeline",
      pill: "Pipeline",
      pillClass: "bg-[#D7ECE5] text-[#247B6C] dark:bg-[#13354C] dark:text-[#38BDF8]",
      sparklineColor: "#2E8B7A",
      sparklinePath: "M 0 16 C 18 16, 28 9, 46 15 C 58 18, 66 6, 75 9",
      cardBg: "bg-[#F2F8F6] dark:bg-[#132421]",
      cardBorder: "border-[#DBECE4] dark:border-[#1E3934]",
    },
    {
      icon: <IoCheckmarkDoneCircleOutline size={19} />,
      iconBg: "bg-[#F7E7DC] text-[#B86F47] dark:bg-[#3C1E10] dark:text-[#FB923C]",
      value: statusCounts["Offer Received"] || 0,
      label: "Offers Received",
      note: "Final-stage wins",
      pill: "Wins",
      pillClass: "bg-[#F8E7DC] text-[#A65E36] dark:bg-[#3C1E10] dark:text-[#FB923C]",
      sparklineColor: "#B86F47",
      sparklinePath: "M 0 15 C 16 15, 26 8, 42 14 C 56 19, 66 7, 75 10",
      cardBg: "bg-[#FAF4EF] dark:bg-[#251D17]",
      cardBorder: "border-[#EFE1D4] dark:border-[#3C2A1E]",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div
          key={i}
          className={`rounded-2xl border p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-md ${card.cardBg} ${card.cardBorder}`}
          style={{
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
          }}
        >
          <div>
            {/* Top row: Icon + Pill */}
            <div className="flex items-center justify-between mb-3">
              <span
                className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${card.iconBg}`}
              >
                {card.icon}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-tight ${card.pillClass}`}
              >
                {card.pill}
              </span>
            </div>

            {/* Value */}
            <p
              className="text-[28px] font-bold font-mono tracking-tight leading-none text-[#1F2937] dark:text-[#F3F4F6] mt-2 mb-1.5"
            >
              {card.value}
            </p>

            {/* Label */}
            <p
              className="text-[13px] font-semibold tracking-tight text-[#1F2937] dark:text-[#F3F4F6]"
            >
              {card.label}
            </p>

            {/* Note */}
            <p
              className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] mt-0.5"
            >
              {card.note}
            </p>
          </div>

          {/* Bottom row: Trend and/or Sparkline */}
          <div className="mt-4 pt-1 flex items-center justify-between min-h-[22px]">
            {card.trend ? (
              <span className={`text-[11px] font-medium tracking-tight ${card.trendColor}`}>
                {card.trend}
              </span>
            ) : (
              <div />
            )}

            {/* Subtle organic sparkline */}
            <svg width="75" height="22" viewBox="0 0 75 22" className="overflow-visible">
              <path
                d={card.sparklinePath}
                fill="none"
                stroke={card.sparklineColor}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashCards;

