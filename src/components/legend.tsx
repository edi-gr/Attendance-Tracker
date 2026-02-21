"use client";

import { STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";

export function Legend() {
  const items = [
    { label: "Holiday", className: "bg-brand-holiday border-slate-200" },
    { label: "Optional Holiday", className: "bg-amber-50 border-amber-200" },
    { label: "Workday", className: "bg-white border-slate-200" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div
            className={`w-3 h-3 rounded border ${item.className}`}
          />
          <span>{item.label}</span>
        </div>
      ))}
      <div className="w-px h-4 bg-slate-200" />
      {Object.entries(STATUS_COLORS).map(([status, colorClass]) => (
        <div key={status} className="flex items-center gap-1.5">
          <div
            className={`w-3 h-3 rounded ${colorClass.split(" ")[0]}`}
          />
          <span>{status}</span>
        </div>
      ))}
    </div>
  );
}
