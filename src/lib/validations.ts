import { z } from "zod";
import { LEAVE_LIMITS, MIN_WFO_PER_MONTH, WORKDAY_STATUSES, OPTIONAL_HOLIDAY_STATUSES } from "@/lib/constants";
import type { DayType, Status, MonthSummary, LeaveBalance } from "@/types";

export const saveEntriesSchema = z.object({
  year: z.number().int().min(2026).max(2030),
  month: z.number().int().min(1).max(12),
  entries: z.array(
    z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      status: z.enum(["WFO", "WFH", "PL", "SL", "OL"]),
    })
  ),
});

export type SaveEntriesInput = z.infer<typeof saveEntriesSchema>;

export function isValidStatusForDayType(
  status: string,
  dayType: DayType
): boolean {
  if (dayType === "HOLIDAY") return false;
  if (dayType === "WORKDAY") {
    return (WORKDAY_STATUSES as readonly string[]).includes(status);
  }
  if (dayType === "OPTIONAL_HOLIDAY") {
    return (OPTIONAL_HOLIDAY_STATUSES as readonly string[]).includes(status);
  }
  return false;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateLeaveBalances(
  existingYearCounts: { pl: number; sl: number; ol: number },
  newMonthEntries: { status: string }[]
): ValidationResult {
  const errors: string[] = [];

  const newPL = newMonthEntries.filter((e) => e.status === "PL").length;
  const newSL = newMonthEntries.filter((e) => e.status === "SL").length;
  const newOL = newMonthEntries.filter((e) => e.status === "OL").length;

  const totalPL = existingYearCounts.pl + newPL;
  const totalSL = existingYearCounts.sl + newSL;
  const totalOL = existingYearCounts.ol + newOL;

  if (totalPL > LEAVE_LIMITS.PL) {
    errors.push(
      `Privilege Leave limit exceeded: ${totalPL} used of ${LEAVE_LIMITS.PL} allowed (${LEAVE_LIMITS.PL - existingYearCounts.pl} remaining)`
    );
  }
  if (totalSL > LEAVE_LIMITS.SL) {
    errors.push(
      `Sick Leave limit exceeded: ${totalSL} used of ${LEAVE_LIMITS.SL} allowed (${LEAVE_LIMITS.SL - existingYearCounts.sl} remaining)`
    );
  }
  if (totalOL > LEAVE_LIMITS.OL) {
    errors.push(
      `Optional Leave limit exceeded: ${totalOL} used of ${LEAVE_LIMITS.OL} allowed (${LEAVE_LIMITS.OL - existingYearCounts.ol} remaining)`
    );
  }

  return { valid: errors.length === 0, errors };
}

export function validateWfoMinimum(
  entries: { status: string }[],
  workableDaysInMonth: number
): ValidationResult {
  const errors: string[] = [];
  const wfoCount = entries.filter((e) => e.status === "WFO").length;

  if (workableDaysInMonth < MIN_WFO_PER_MONTH) {
    return { valid: true, errors: [] };
  }

  if (wfoCount < MIN_WFO_PER_MONTH) {
    errors.push(
      `Minimum ${MIN_WFO_PER_MONTH} WFO days required per month. Currently: ${wfoCount}`
    );
  }

  return { valid: errors.length === 0, errors };
}

export function computeMonthSummary(
  entries: { status: string | null }[]
): MonthSummary {
  return {
    wfo: entries.filter((e) => e.status === "WFO").length,
    wfh: entries.filter((e) => e.status === "WFH").length,
    pl: entries.filter((e) => e.status === "PL").length,
    sl: entries.filter((e) => e.status === "SL").length,
    ol: entries.filter((e) => e.status === "OL").length,
  };
}

export function computeLeaveBalances(
  yearCounts: { pl: number; sl: number; ol: number }
): LeaveBalance[] {
  return [
    {
      type: "PL",
      limit: LEAVE_LIMITS.PL,
      used: yearCounts.pl,
      remaining: LEAVE_LIMITS.PL - yearCounts.pl,
    },
    {
      type: "SL",
      limit: LEAVE_LIMITS.SL,
      used: yearCounts.sl,
      remaining: LEAVE_LIMITS.SL - yearCounts.sl,
    },
    {
      type: "OL",
      limit: LEAVE_LIMITS.OL,
      used: yearCounts.ol,
      remaining: LEAVE_LIMITS.OL - yearCounts.ol,
    },
  ];
}
