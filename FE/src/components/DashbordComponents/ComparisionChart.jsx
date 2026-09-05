import React from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 shadow-sm text-xs space-y-1">
        <p className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">{label}</p>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-sm bg-emerald-500" />
            <span className="text-zinc-500 dark:text-zinc-400">{p.name}:</span>
            <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">{p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const ComparisionChart = ({ chartData }) => {
  const hasData = chartData.some((item) => item.Applications > 0);

  return (
    <div className="h-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 flex flex-col">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Application Velocity</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Tracked applications by month</p>
      </div>

      <div className="flex-1 min-h-[220px]">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradApplicationsEmerald" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#71717a" strokeOpacity={0.15} vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "#71717a" }}
                axisLine={{ stroke: "#27272a", strokeOpacity: 0.2 }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "#71717a" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="Applications"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#gradApplicationsEmerald)"
                dot={false}
                activeDot={{ r: 4, fill: "#10b981", strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-center">
            <p className="text-sm text-zinc-400 dark:text-zinc-500">No application activity has been tracked yet this year.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparisionChart;


