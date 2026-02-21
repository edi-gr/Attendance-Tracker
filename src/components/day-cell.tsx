"use client";

import { cn } from "@/lib/utils";
import { StatusSelect } from "@/components/status-select";
import { Badge } from "@/components/ui/badge";
import { STATUS_COLORS } from "@/lib/constants";
import type { CalendarDay, Status, LeaveBalance } from "@/types";

interface DayCellProps {
  day: CalendarDay;
  balances: LeaveBalance[];
  onStatusChange: (dateKey: string, status: Status) => void;
}

export function DayCell({ day, balances, onStatusChange }: DayCellProps) {
  if (!day.isCurrentMonth) {
    return <div className="min-h-[100px] bg-gray-50/50 rounded-lg" />;
  }

  const isHoliday = day.dayType === "HOLIDAY";
  const isOptional = day.dayType === "OPTIONAL_HOLIDAY";

  return (
    <div
      className={cn(
        "min-h-[100px] rounded-lg border p-2 flex flex-col gap-1 transition-colors",
        isHoliday && "bg-brand-holiday border-slate-200",
        isOptional && "bg-amber-50/70 border-amber-200",
        !isHoliday && !isOptional && "bg-white border-slate-200 hover:border-slate-300"
      )}
    >
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "text-sm font-semibold",
            isHoliday && "text-slate-400",
            isOptional && "text-amber-700",
            !isHoliday && !isOptional && "text-navy-700"
          )}
        >
          {day.dayOfMonth}
        </span>
        {day.status && !isHoliday && (
          <span
            className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded",
              STATUS_COLORS[day.status] || "bg-gray-100 text-gray-600"
            )}
          >
            {day.status}
          </span>
        )}
      </div>

      {day.holidayName && (
        <p
          className={cn(
            "text-[10px] leading-tight",
            isHoliday ? "text-slate-400" : "text-amber-600"
          )}
        >
          {day.holidayName}
        </p>
      )}

      {!isHoliday && (
        <div className="mt-auto">
          <StatusSelect
            value={day.status}
            dayType={day.dayType}
            balances={balances}
            onChange={(status) => onStatusChange(day.date, status)}
          />
        </div>
      )}
    </div>
  );
}
