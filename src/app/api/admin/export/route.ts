export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { buildHolidayMap, countWorkableDays } from "@/lib/holidays";
import { computeMonthSummary, computeLeaveBalances } from "@/lib/validations";
import { MIN_WFO_PER_MONTH, LEAVE_LIMITS } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get("year") || "2026");
    const month = parseInt(searchParams.get("month") || "1");

    const users = await prisma.user.findMany({ orderBy: { name: "asc" } });

    const holidays = await prisma.holidayCalendar.findMany({
      where: { year },
    });
    const holidayMap = buildHolidayMap(holidays);
    const workableDays = countWorkableDays(year, month, holidayMap);

    const rows: string[] = [];
    rows.push(
      "Name,Email,WFO,WFH,PL,SL,OL,PL Remaining,SL Remaining,OL Remaining,WFO Compliant"
    );

    for (const user of users) {
      const monthEntries = await prisma.dayEntry.findMany({
        where: { userId: user.id, year, month },
      });

      const yearEntries = await prisma.dayEntry.findMany({
        where: { userId: user.id, year },
        select: { status: true },
      });

      const ms = computeMonthSummary(monthEntries);
      const yearCounts = {
        pl: yearEntries.filter((e) => e.status === "PL").length,
        sl: yearEntries.filter((e) => e.status === "SL").length,
        ol: yearEntries.filter((e) => e.status === "OL").length,
      };

      const wfoOk =
        workableDays < MIN_WFO_PER_MONTH || ms.wfo >= MIN_WFO_PER_MONTH;

      rows.push(
        [
          `"${user.name}"`,
          user.email,
          ms.wfo,
          ms.wfh,
          ms.pl,
          ms.sl,
          ms.ol,
          LEAVE_LIMITS.PL - yearCounts.pl,
          LEAVE_LIMITS.SL - yearCounts.sl,
          LEAVE_LIMITS.OL - yearCounts.ol,
          wfoOk ? "Yes" : "No",
        ].join(",")
      );
    }

    const csv = rows.join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="attendance-${year}-${String(month).padStart(2, "0")}.csv"`,
      },
    });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Forbidden") {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === "Forbidden" ? 403 : 401 }
      );
    }
    console.error("GET /api/admin/export error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
