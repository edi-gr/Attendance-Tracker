export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { buildHolidayMap, countWorkableDays } from "@/lib/holidays";
import { computeMonthSummary, computeLeaveBalances } from "@/lib/validations";
import { MIN_WFO_PER_MONTH } from "@/lib/constants";
import type { UserSummary } from "@/types";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get("year") || "2026");
    const month = parseInt(searchParams.get("month") || "1");
    const search = searchParams.get("search") || "";

    const users = await prisma.user.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { name: "asc" },
    });

    const holidays = await prisma.holidayCalendar.findMany({
      where: { year },
    });
    const holidayMap = buildHolidayMap(holidays);
    const workableDays = countWorkableDays(year, month, holidayMap);

    const userSummaries: UserSummary[] = [];

    for (const user of users) {
      const monthEntries = await prisma.dayEntry.findMany({
        where: { userId: user.id, year, month },
      });

      const yearEntries = await prisma.dayEntry.findMany({
        where: { userId: user.id, year },
        select: { status: true },
      });

      const monthSummary = computeMonthSummary(monthEntries);
      const yearCounts = {
        pl: yearEntries.filter((e) => e.status === "PL").length,
        sl: yearEntries.filter((e) => e.status === "SL").length,
        ol: yearEntries.filter((e) => e.status === "OL").length,
      };

      const wfoCompliant =
        workableDays < MIN_WFO_PER_MONTH || monthSummary.wfo >= MIN_WFO_PER_MONTH;

      const lastEntry = await prisma.dayEntry.findFirst({
        where: { userId: user.id, year, month },
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true },
      });

      userSummaries.push({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        monthSummary,
        yearBalances: computeLeaveBalances(yearCounts),
        wfoCompliant,
        lastUpdated: lastEntry?.updatedAt.toISOString() || null,
      });
    }

    return NextResponse.json({ users: userSummaries });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Forbidden") {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === "Forbidden" ? 403 : 401 }
      );
    }
    console.error("GET /api/admin/users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
