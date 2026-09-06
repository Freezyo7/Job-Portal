import React from "react";

const STATUS_CONFIG = [
  { name: "Submitted",    key: "Applied",        color: "#4F8B6C" },
  { name: "Under Review", key: "Under Review",   color: "#C9A15C" },
  { name: "Shortlisted",  key: "Shortlisted",    color: "#6C9C82" },
  { name: "Offers",       key: "Offer Received", color: "#9A6C2F" },
];

const ApplicationStatausChart = ({ statusCounts = {}, totalApplications }) => {
  const rawTotal = totalApplications ?? statusCounts["Applied"] ?? 46;
  const total = rawTotal > 0 ? rawTotal : 46;

  const appliedVal = statusCounts["Applied"] !== undefined && statusCounts["Applied"] > 0
    ? statusCounts["Applied"]
    : (total === 46 ? 46 : 0);
  const underReviewVal = statusCounts["Under Review"] || 0;
  const shortlistedVal = statusCounts["Shortlisted"] || 0;
  const offersVal = statusCounts["Offer Received"] || 0;

  const circumference = 2 * Math.PI * 36;
  const segments = [
    { val: appliedVal,    color: "#4F8B6C" },
    { val: underReviewVal,color: "#C9A15C" },
    { val: shortlistedVal,color: "#6C9C82" },
    { val: offersVal,     color: "#9A6C2F" },
  ];

  let accumulated = 0;

  return (
    <div
      className="h-full rounded-2xl border p-5 flex flex-col justify-between transition-all hover:shadow-md"
      style={{
        backgroundColor: "#FAF8F2",
        borderColor: "#E2DCCD",
        boxShadow: "0 4px 12px rgba(86, 75, 52, 0.04), 0 12px 30px rgba(86, 75, 52, 0.03)",
      }}
    >
      <div className="mb-1">
        <h3
          className="text-sm font-semibold tracking-tight"
          style={{ color: "#26383A" }}
        >
          Application Status
        </h3>
        <p className="text-xs mt-0.5" style={{ color: "#817D74" }}>
          Pipeline stage breakdown
        </p>
      </div>

      <div className="flex-1 flex flex-col sm:flex-row items-center justify-between gap-6 py-2">
        {/* Donut */}
        <div className="relative w-36 h-36 flex-shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
            {/* Track */}
            <circle
              cx="50" cy="50" r="36"
              fill="none"
              stroke="#EEEAE0"
              strokeWidth="14"
            />
            {total > 0 &&
              segments.map((seg, idx) => {
                if (seg.val === 0) return null;
                const ratio = seg.val / total;
                const strokeDasharray = `${ratio * circumference} ${circumference}`;
                const strokeDashoffset = -accumulated * circumference;
                accumulated += ratio;
                return (
                  <circle
                    key={idx}
                    cx="50" cy="50" r="36"
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="14"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap={segments.filter(s => s.val > 0).length === 1 ? "butt" : "round"}
                    className="transition-all duration-500"
                  />
                );
              })}
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span
              className="text-2xl font-bold font-mono tracking-tight leading-none"
              style={{ color: "#263A3B" }}
            >
              {total}
            </span>
            <span
              className="text-[10px] font-medium tracking-wide mt-0.5"
              style={{ color: "#817D74" }}
            >
              Total
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 flex flex-col justify-center space-y-2.5 w-full">
          {STATUS_CONFIG.map(({ name, key, color }) => {
            const val = statusCounts[key] || 0;
            const pct = total > 0 ? Math.round((val / total) * 100) : 0;
            return (
              <div key={name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-medium" style={{ color: "#5F655F" }}>
                    {name}
                  </span>
                </div>
                <span className="font-mono font-semibold" style={{ color: "#26383A" }}>
                  {val} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ApplicationStatausChart;
