import React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

// Monochromatic Zinc + Emerald palette
const COLORS = ["#10b981", "#059669", "#71717a", "#a1a1aa", "#3f3f46"];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs shadow-sm">
        <p className="font-semibold text-zinc-900 dark:text-zinc-100">{payload[0].name}</p>
        <p className="font-mono text-zinc-500 dark:text-zinc-400">{payload[0].value} applications</p>
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
    <div className="h-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 flex flex-col">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Application Status</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Pipeline stage breakdown</p>
      </div>

      <div className="flex-1 flex items-center justify-center min-h-[220px]">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <p className="text-sm text-zinc-400 dark:text-zinc-500">No applications tracked yet.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                cornerRadius={4}
                dataKey="value"
                stroke="none"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="square"
                iconSize={8}
                formatter={(value) => (
                  <span className="text-[11px] text-zinc-600 dark:text-zinc-400">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-3 rounded-md bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 px-3.5 py-2 flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Total Applications</span>
        <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">{totalApplications}</span>
      </div>
    </div>
  );
};

export default ApplicationStatausChart;


