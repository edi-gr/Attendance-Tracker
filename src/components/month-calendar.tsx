"use client";

import { DayCell } from "@/components/day-cell";
import type { CalendarDay, Status, LeaveBalance } from "@/types";

interface MonthCalendarProps {
  days: CalendarDay[];
  balances: LeaveBalance[];
  onStatusChange: (dateKey: string, status: Status) => void;
}

const WEEKDAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function MonthCalendar({
  days,
  balances,
  onStatusChange,
}: MonthCalendarProps) {
  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY_HEADERS.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-semibold text-navy-600 py-2"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => (
          <DayCell
            key={day.date + i}
            day={day}
            balances={balances}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>
    </div>
  );
}
