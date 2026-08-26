import React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ["#4f46e5", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white px-3 py-2 shadow-lg text-xs">
        <p className="font-semibold text-slate-800">{payload[0].name}</p>
        <p className="text-slate-500">{payload[0].value} applications</p>
      </div>
    );
  }
  return null;
};

const ApplicationStatausChart = ({ statusCounts, totalApplications }) => {
  const data = [
    { name: "Applied", value: statusCounts["Applied"] },
    { name: "Under Review", value: statusCounts["Under Review"] },
    { name: "Shortlisted", value: statusCounts["Shortlisted"] },
    { name: "Rejected", value: statusCounts["Rejected"] },
    { name: "Offer Received", value: statusCounts["Offer Received"] },
  ].filter((item) => item.value > 0);

  return (
    <div className="h-full rounded-3xl border-2 border-slate-100 bg-white/70 backdrop-blur-sm p-5 shadow-lg shadow-slate-200/60 flex flex-col">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-800">Application Status</h3>
        <p className="text-xs font-light text-slate-400 mt-0.5">Breakdown by current stage</p>
      </div>

      <div className="flex-1 flex items-center justify-center min-h-[220px]">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <p className="text-sm text-slate-400">No MongoDB-tracked applications yet.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={4}
                cornerRadius={8}
                dataKey="value"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span className="text-[11px] text-slate-600">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-3 rounded-2xl bg-[#eef2ff] px-4 py-2.5 flex items-center justify-between">
        <span className="text-xs font-light text-slate-500">Total Applications</span>
        <span className="text-sm font-bold text-[#4f46e5]">{totalApplications}</span>
      </div>
    </div>
  );
};

export default ApplicationStatausChart;
