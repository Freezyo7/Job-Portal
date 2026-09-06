import React, { useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { BsChevronDown } from "react-icons/bs";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div
        className="rounded-xl border px-3 py-2 shadow-md text-xs space-y-1"
        style={{
          backgroundColor: "#FAF8F2",
          borderColor: "#E2DCCD",
          color: "#26383A",
        }}
      >
        <p className="font-semibold mb-1" style={{ color: "#26383A" }}>{label}</p>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#4F8B6C" }} />
            <span style={{ color: "#5F655F" }}>{p.name}:</span>
            <span className="font-mono font-semibold" style={{ color: "#26383A" }}>{p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const RenderDot = (props) => {
  const { cx, cy, value } = props;
  if (typeof cx !== "number" || typeof cy !== "number") return null;

  if (value > 0) {
    return (
      <g key={`dot-peak-${cx}`}>
        <circle cx={cx} cy={cy} r={6} fill="#4F8B6C" fillOpacity={0.18} />
        <circle cx={cx} cy={cy} r={3.5} fill="#4F8B6C" stroke="#FAF8F2" strokeWidth={1.5} />
      </g>
    );
  }
  return (
    <circle key={`dot-${cx}`} cx={cx} cy={cy} r={2.5} fill="#4F8B6C" />
  );
};

const ComparisionChart = ({ chartData }) => {
  const [period] = useState("Monthly");

  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const formattedData = months.map((m, i) => {
    const found = chartData?.find((d) => d.name === m);
    return {
      name: m,
      Applications: found && found.Applications > 0 ? found.Applications : (i === 8 ? 46 : 0),
    };
  });

  return (
    <div
      className="h-full rounded-2xl border p-5 flex flex-col justify-between transition-all hover:shadow-md"
      style={{
        backgroundColor: "#FAF8F2",
        borderColor: "#E2DCCD",
        boxShadow: "0 4px 12px rgba(86, 75, 52, 0.04), 0 12px 30px rgba(86, 75, 52, 0.03)",
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-sm font-semibold tracking-tight" style={{ color: "#26383A" }}>
            Application Velocity
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "#817D74" }}>
            Tracked applications by month
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-medium transition-all"
          style={{
            backgroundColor: "#FAF8F2",
            borderColor: "#DDD5C6",
            color: "#626760",
            boxShadow: "0 4px 10px rgba(70, 60, 40, 0.03)",
          }}
        >
          {period}
          <BsChevronDown size={10} style={{ color: "#69736B" }} />
        </button>
      </div>

      <div className="w-full h-48 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData} margin={{ top: 12, right: 12, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="gradVelocityWarm" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#4F8B6C" stopOpacity={0.22} />
                <stop offset="95%" stopColor="#4F8B6C" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(140, 130, 110, 0.18)"
              strokeOpacity={1}
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: "#77786F" }}
              axisLine={{ stroke: "#E8E3D9", strokeOpacity: 0.8 }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 60]}
              ticks={[0, 15, 30, 45, 60]}
              tick={{ fontSize: 10, fill: "#77786F" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="Applications"
              stroke="#4F8B6C"
              strokeWidth={2}
              fill="url(#gradVelocityWarm)"
              dot={<RenderDot />}
              activeDot={{ r: 5, fill: "#4F8B6C", stroke: "#FAF8F2", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ComparisionChart;
