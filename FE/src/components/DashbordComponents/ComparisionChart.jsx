import React from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white px-3 py-2.5 shadow-lg text-xs space-y-1">
        <p className="font-semibold text-slate-700 mb-1">{label}</p>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
            <span className="text-slate-500">{p.name}:</span>
            <span className="font-semibold text-slate-800">{p.value}</span>
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
    <div className="h-full rounded-3xl border-2 border-slate-100 bg-white/70 backdrop-blur-sm p-5 shadow-lg shadow-slate-200/60 flex flex-col">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-800">Application Activity</h3>
        <p className="text-xs font-light text-slate-400 mt-0.5">MongoDB-tracked applications by month</p>
      </div>

      <div className="flex-1 min-h-[220px]">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradApplications" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="Applications"
                stroke="#4f46e5"
                strokeWidth={2}
                fill="url(#gradApplications)"
                dot={false}
                activeDot={{ r: 4, fill: "#4f46e5" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-center">
            <p className="text-sm text-slate-400">No application activity has been tracked yet this year.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparisionChart;
