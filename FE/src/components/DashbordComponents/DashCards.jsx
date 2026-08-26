import React from "react";
import { AiOutlineFileDone } from "react-icons/ai";
import { IoCheckmarkDoneCircleOutline } from "react-icons/io5";
import { BsHourglassSplit } from "react-icons/bs";
import { HiMiniSparkles } from "react-icons/hi2";

const DashCards = ({ statusCounts, totalApplications }) => {
  const cards = [
    {
      icon: <AiOutlineFileDone size={20} />,
      value: totalApplications,
      label: "Applications Submitted",
      note: "Tracked by Django",
      accent: "bg-[#eef2ff] text-[#4f46e5]",
    },
    {
      icon: <BsHourglassSplit size={18} />,
      value: statusCounts["Under Review"],
      label: "Under Review",
      note: "Awaiting recruiter updates",
      accent: "bg-amber-50 text-amber-600",
    },
    {
      icon: <HiMiniSparkles size={20} />,
      value: statusCounts["Shortlisted"],
      label: "Shortlisted",
      note: "Strongest active pipeline",
      accent: "bg-emerald-50 text-emerald-600",
    },
    {
      icon: <IoCheckmarkDoneCircleOutline size={20} />,
      value: statusCounts["Offer Received"],
      label: "Offers Received",
      note: "Final-stage wins",
      accent: "bg-rose-50 text-rose-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div
          key={i}
          className="rounded-3xl border-2 border-slate-100 bg-white/70 backdrop-blur-sm p-5 shadow-lg shadow-slate-200/60 hover:shadow-xl hover:border-[#4f46e5]/20 transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-5">
            <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${card.accent}`}>
              {card.icon}
            </span>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
              Live
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{card.value}</p>
          <p className="mt-1 text-xs font-light text-slate-500">{card.label}</p>
          <p className="mt-2 text-[11px] text-slate-400">{card.note}</p>
        </div>
      ))}
    </div>
  );
};

export default DashCards;
