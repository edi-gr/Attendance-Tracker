export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { buildHolidayMap, countWorkableDays } from "@/lib/holidays";
import { computeMonthSummary, computeLeaveBalances } from "@/lib/validations";
import { MIN_WFO_PER_MONTH } from "@/lib/constants";
import type { YearSummary, MonthSummary } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get("year") || "2026");

    const entries = await prisma.dayEntry.findMany({
      where: { userId: user.id, year },
      orderBy: { date: "asc" },
    });

    const holidays = await prisma.holidayCalendar.findMany({
      where: { year },
    });
    const holidayMap = buildHolidayMap(holidays);

    const months: Record<number, MonthSummary> = {};
    const wfoCompliance: Record<number, boolean> = {};

    for (let m = 1; m <= 12; m++) {
      const monthEntries = entries.filter((e) => e.month === m);
      months[m] = computeMonthSummary(monthEntries);

      const workableDays = countWorkableDays(year, m, holidayMap);
      if (workableDays < MIN_WFO_PER_MONTH) {
        wfoCompliance[m] = true;
      } else {
        wfoCompliance[m] = months[m].wfo >= MIN_WFO_PER_MONTH;
      }
    }

    const totals: MonthSummary = {
      wfo: Object.values(months).reduce((s, m) => s + m.wfo, 0),
      wfh: Object.values(months).reduce((s, m) => s + m.wfh, 0),
      pl: Object.values(months).reduce((s, m) => s + m.pl, 0),
      sl: Object.values(months).reduce((s, m) => s + m.sl, 0),
      ol: Object.values(months).reduce((s, m) => s + m.ol, 0),
    };

    const balances = computeLeaveBalances({
      pl: totals.pl,
      sl: totals.sl,
      ol: totals.ol,
    });

    const summary: YearSummary = {
      months,
      totals,
      balances,
      wfoCompliance,
    };

    return NextResponse.json(summary);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/calendar/summary error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
