import React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

// Harmonious Nature & Earth palette
const COLORS = ["#6FAF7B", "#C9A96E", "#4A8A5A", "#8A7A65", "#A87840"];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div
        className="rounded-md border px-3 py-2 text-xs shadow-sm"
        style={{
          backgroundColor: "var(--nt-bg-card)",
          borderColor: "var(--nt-border)",
          color: "var(--nt-text-primary)",
        }}
      >
        <p className="font-semibold">{payload[0].name}</p>
        <p className="font-mono" style={{ color: "var(--nt-text-secondary)" }}>{payload[0].value} applications</p>
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
    <div
      className="h-full rounded-lg border p-5 flex flex-col"
      style={{
        backgroundColor: "var(--nt-bg-card)",
        borderColor: "var(--nt-border)",
        boxShadow: "var(--nt-shadow-sm)",
      }}
    >
      <div className="mb-4">
        <h3 className="text-sm font-semibold" style={{ color: "var(--nt-text-primary)" }}>Application Status</h3>
        <p className="text-xs mt-0.5" style={{ color: "var(--nt-text-secondary)" }}>Pipeline stage breakdown</p>
      </div>

      <div className="flex-1 flex items-center justify-center min-h-[220px]">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <p className="text-sm" style={{ color: "var(--nt-text-muted)" }}>No applications tracked yet.</p>
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
                  <span className="text-[11px]" style={{ color: "var(--nt-text-secondary)" }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      <div
        className="mt-3 rounded-md border px-3.5 py-2 flex items-center justify-between"
        style={{
          backgroundColor: "var(--nt-bg-card-alt)",
          borderColor: "var(--nt-border)",
        }}
      >
        <span className="text-xs font-medium" style={{ color: "var(--nt-text-secondary)" }}>Total Applications</span>
        <span className="text-sm font-bold font-mono" style={{ color: "var(--nt-accent-sage)" }}>{totalApplications}</span>
      </div>
    </div>
  );
};

export default ApplicationStatausChart;
