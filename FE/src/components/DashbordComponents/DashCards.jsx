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
    },
    {
      icon: <BsHourglassSplit size={16} />,
      value: statusCounts["Under Review"] || 0,
      label: "Under Review",
      note: "Awaiting recruiter updates",
      pill: "Pending",
    },
    {
      icon: <HiMiniSparkles size={18} />,
      value: statusCounts["Shortlisted"] || 0,
      label: "Shortlisted",
      note: "Strongest active pipeline",
      pill: "Pipeline",
    },
    {
      icon: <IoCheckmarkDoneCircleOutline size={18} />,
      value: statusCounts["Offer Received"] || 0,
      label: "Offers Received",
      note: "Final-stage wins",
      pill: "Wins",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card, i) => (
        <div
          key={i}
          className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 transition-colors hover:border-zinc-300 dark:hover:border-zinc-700"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300">
              {card.icon}
            </span>
            <span className="inline-flex items-center rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              {card.pill}
            </span>
          </div>
          <p className="text-2xl font-bold font-mono tracking-tight text-zinc-950 dark:text-zinc-50">{card.value}</p>
          <p className="mt-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">{card.label}</p>
          <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">{card.note}</p>
        </div>
      ))}
    </div>
  );
};

export default DashCards;


