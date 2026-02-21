import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  format,
} from "date-fns";
import type { DayClassification, CalendarDay, DayType, Status } from "@/types";
import { formatDateKey } from "@/lib/utils";

export interface HolidayRecord {
  date: string;
  type: "HOLIDAY" | "OPTIONAL_HOLIDAY";
  name: string;
}

export function classifyDate(
  date: Date,
  holidayMap: Map<string, HolidayRecord>
): DayClassification {
  const dayOfWeek = getDay(date);
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return { dayType: "HOLIDAY", holidayName: "Weekend" };
  }

  const key = formatDateKey(date);
  const holiday = holidayMap.get(key);

  if (holiday) {
    if (holiday.type === "HOLIDAY") {
      return { dayType: "HOLIDAY", holidayName: holiday.name };
    }
    return { dayType: "OPTIONAL_HOLIDAY", holidayName: holiday.name };
  }

  return { dayType: "WORKDAY" };
}

export function buildHolidayMap(
  holidays: { date: Date | string; type: string; name: string }[]
): Map<string, HolidayRecord> {
  const map = new Map<string, HolidayRecord>();

  for (const h of holidays) {
    const dateObj = typeof h.date === "string" ? new Date(h.date) : h.date;
    const key = formatDateKey(dateObj);
    map.set(key, {
      date: key,
      type: h.type as "HOLIDAY" | "OPTIONAL_HOLIDAY",
      name: h.name,
    });
  }

  return map;
}

export function generateCalendarDays(
  year: number,
  month: number,
  holidayMap: Map<string, HolidayRecord>,
  savedEntries: Map<string, Status | null>
): CalendarDay[] {
  const monthDate = new Date(year, month - 1, 1);
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);

  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return allDays.map((date) => {
    const isCurrentMonth = isSameMonth(date, monthDate);
    const dateKey = formatDateKey(date);
    const classification = classifyDate(date, holidayMap);
    const dayOfWeek = getDay(date);
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    let status: Status | null = null;
    if (isCurrentMonth && classification.dayType !== "HOLIDAY") {
      if (savedEntries.has(dateKey)) {
        status = savedEntries.get(dateKey) ?? null;
      } else {
        status = "WFH";
      }
    }

    return {
      date: dateKey,
      dayOfMonth: date.getDate(),
      dayType: classification.dayType,
      holidayName: classification.holidayName,
      status,
      isCurrentMonth,
      isWeekend,
    };
  });
}

export function countWorkableDays(
  year: number,
  month: number,
  holidayMap: Map<string, HolidayRecord>
): number {
  const monthDate = new Date(year, month - 1, 1);
  const days = eachDayOfInterval({
    start: startOfMonth(monthDate),
    end: endOfMonth(monthDate),
  });

  return days.filter((date) => {
    const classification = classifyDate(date, holidayMap);
    return classification.dayType !== "HOLIDAY";
  }).length;
}
