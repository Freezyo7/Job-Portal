import React from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div
        className="rounded-md border px-3 py-2 shadow-sm text-xs space-y-1"
        style={{
          backgroundColor: "var(--nt-bg-card)",
          borderColor: "var(--nt-border)",
          color: "var(--nt-text-primary)",
        }}
      >
        <p className="font-semibold mb-1" style={{ color: "var(--nt-text-primary)" }}>{label}</p>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: "var(--nt-accent-sage)" }} />
            <span style={{ color: "var(--nt-text-secondary)" }}>{p.name}:</span>
            <span className="font-mono font-semibold" style={{ color: "var(--nt-text-primary)" }}>{p.value}</span>
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
    <div
      className="h-full rounded-lg border p-5 flex flex-col"
      style={{
        backgroundColor: "var(--nt-bg-card)",
        borderColor: "var(--nt-border)",
        boxShadow: "var(--nt-shadow-sm)",
      }}
    >
      <div className="mb-4">
        <h3 className="text-sm font-semibold" style={{ color: "var(--nt-text-primary)" }}>Application Velocity</h3>
        <p className="text-xs mt-0.5" style={{ color: "var(--nt-text-secondary)" }}>Tracked applications by month</p>
      </div>

      <div className="flex-1 min-h-[220px]">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradApplicationsNature" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6FAF7B" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6FAF7B" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#8A7A65" strokeOpacity={0.2} vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "var(--nt-text-muted)" }}
                axisLine={{ stroke: "var(--nt-border)", strokeOpacity: 0.5 }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "var(--nt-text-muted)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="Applications"
                stroke="#6FAF7B"
                strokeWidth={2}
                fill="url(#gradApplicationsNature)"
                dot={false}
                activeDot={{ r: 4, fill: "#C9A96E", strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-center">
            <p className="text-sm" style={{ color: "var(--nt-text-muted)" }}>No application activity has been tracked yet this year.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparisionChart;
