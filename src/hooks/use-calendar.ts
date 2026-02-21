"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { CalendarDay, Status, MonthSummary, LeaveBalance } from "@/types";
import type { HolidayRecord } from "@/lib/holidays";
import {
  generateCalendarDays,
  buildHolidayMap,
  countWorkableDays,
} from "@/lib/holidays";
import { MIN_WFO_PER_MONTH, LEAVE_LIMITS } from "@/lib/constants";

interface UseCalendarReturn {
  days: CalendarDay[];
  monthSummary: MonthSummary;
  balances: LeaveBalance[];
  wfoCompliant: boolean;
  workableDays: number;
  loading: boolean;
  saving: boolean;
  isDirty: boolean;
  errors: string[];
  setDayStatus: (dateKey: string, status: Status) => void;
  save: () => Promise<boolean>;
  reset: () => void;
}

export function useCalendar(
  year: number,
  month: number,
  holidays: HolidayRecord[]
): UseCalendarReturn {
  const [savedStatuses, setSavedStatuses] = useState<Map<string, Status | null>>(
    new Map()
  );
  const [localStatuses, setLocalStatuses] = useState<Map<string, Status | null>>(
    new Map()
  );
  const [otherMonthsCounts, setOtherMonthsCounts] = useState({
    pl: 0,
    sl: 0,
    ol: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const holidayMap = useMemo(() => buildHolidayMap(holidays), [holidays]);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setErrors([]);
    try {
      const res = await fetch(
        `/api/calendar/entries?year=${year}&month=${month}`
      );
      const data = await res.json();

      if (data.entries) {
        const map = new Map<string, Status | null>();
        for (const entry of data.entries) {
          map.set(entry.date, entry.status);
        }
        setSavedStatuses(map);
        setLocalStatuses(new Map(map));
      }

      if (data.balances) {
        const monthPL = data.entries?.filter((e: any) => e.status === "PL").length || 0;
        const monthSL = data.entries?.filter((e: any) => e.status === "SL").length || 0;
        const monthOL = data.entries?.filter((e: any) => e.status === "OL").length || 0;

        const plBal = data.balances.find((b: any) => b.type === "PL");
        const slBal = data.balances.find((b: any) => b.type === "SL");
        const olBal = data.balances.find((b: any) => b.type === "OL");

        setOtherMonthsCounts({
          pl: (plBal?.used || 0) - monthPL,
          sl: (slBal?.used || 0) - monthSL,
          ol: (olBal?.used || 0) - monthOL,
        });
      }
    } catch {
      setErrors(["Failed to load calendar data"]);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const days = useMemo(
    () => generateCalendarDays(year, month, holidayMap, localStatuses),
    [year, month, holidayMap, localStatuses]
  );

  const currentMonthDays = useMemo(
    () => days.filter((d) => d.isCurrentMonth && d.dayType !== "HOLIDAY"),
    [days]
  );

  const monthSummary = useMemo((): MonthSummary => {
    const statuses = currentMonthDays.map((d) => d.status).filter(Boolean) as Status[];
    return {
      wfo: statuses.filter((s) => s === "WFO").length,
      wfh: statuses.filter((s) => s === "WFH").length,
      pl: statuses.filter((s) => s === "PL").length,
      sl: statuses.filter((s) => s === "SL").length,
      ol: statuses.filter((s) => s === "OL").length,
    };
  }, [currentMonthDays]);

  const balances = useMemo((): LeaveBalance[] => {
    return [
      {
        type: "PL",
        limit: LEAVE_LIMITS.PL,
        used: otherMonthsCounts.pl + monthSummary.pl,
        remaining: LEAVE_LIMITS.PL - otherMonthsCounts.pl - monthSummary.pl,
      },
      {
        type: "SL",
        limit: LEAVE_LIMITS.SL,
        used: otherMonthsCounts.sl + monthSummary.sl,
        remaining: LEAVE_LIMITS.SL - otherMonthsCounts.sl - monthSummary.sl,
      },
      {
        type: "OL",
        limit: LEAVE_LIMITS.OL,
        used: otherMonthsCounts.ol + monthSummary.ol,
        remaining: LEAVE_LIMITS.OL - otherMonthsCounts.ol - monthSummary.ol,
      },
    ];
  }, [otherMonthsCounts, monthSummary]);

  const workableDays = useMemo(
    () => countWorkableDays(year, month, holidayMap),
    [year, month, holidayMap]
  );

  const wfoCompliant = useMemo(() => {
    if (workableDays < MIN_WFO_PER_MONTH) return true;
    return monthSummary.wfo >= MIN_WFO_PER_MONTH;
  }, [workableDays, monthSummary.wfo]);

  const isDirty = useMemo(() => {
    if (localStatuses.size !== savedStatuses.size) return true;
    let dirty = false;
    localStatuses.forEach((value, key) => {
      if (savedStatuses.get(key) !== value) dirty = true;
    });
    return dirty;
  }, [localStatuses, savedStatuses]);

  const setDayStatus = useCallback((dateKey: string, status: Status) => {
    setLocalStatuses((prev) => {
      const next = new Map(prev);
      next.set(dateKey, status);
      return next;
    });
    setErrors([]);
  }, []);

  const save = useCallback(async (): Promise<boolean> => {
    setSaving(true);
    setErrors([]);

    const entries = currentMonthDays
      .filter((d) => d.status != null)
      .map((d) => ({
        date: d.date,
        status: d.status as string,
      }));

    try {
      const res = await fetch("/api/calendar/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, month, entries }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorDetails = data.details
          ? Array.isArray(data.details)
            ? data.details
            : [data.error]
          : [data.error || "Save failed"];
        setErrors(errorDetails);
        return false;
      }

      if (data.entries) {
        const map = new Map<string, Status | null>();
        for (const entry of data.entries) {
          map.set(entry.date, entry.status);
        }
        setSavedStatuses(map);
        setLocalStatuses(new Map(map));
      }

      if (data.balances) {
        const monthPL = data.entries?.filter((e: any) => e.status === "PL").length || 0;
        const monthSL = data.entries?.filter((e: any) => e.status === "SL").length || 0;
        const monthOL = data.entries?.filter((e: any) => e.status === "OL").length || 0;

        const plBal = data.balances.find((b: any) => b.type === "PL");
        const slBal = data.balances.find((b: any) => b.type === "SL");
        const olBal = data.balances.find((b: any) => b.type === "OL");

        setOtherMonthsCounts({
          pl: (plBal?.used || 0) - monthPL,
          sl: (slBal?.used || 0) - monthSL,
          ol: (olBal?.used || 0) - monthOL,
        });
      }

      return true;
    } catch {
      setErrors(["Network error. Please try again."]);
      return false;
    } finally {
      setSaving(false);
    }
  }, [year, month, currentMonthDays, localStatuses]);

  const reset = useCallback(() => {
    setLocalStatuses(new Map(savedStatuses));
    setErrors([]);
  }, [savedStatuses]);

  return {
    days,
    monthSummary,
    balances,
    wfoCompliant,
    workableDays,
    loading,
    saving,
    isDirty,
    errors,
    setDayStatus,
    save,
    reset,
  };
}
