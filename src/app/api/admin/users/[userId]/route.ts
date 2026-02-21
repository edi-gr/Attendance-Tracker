export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { computeMonthSummary, computeLeaveBalances } from "@/lib/validations";

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get("year") || "2026");
    const month = parseInt(searchParams.get("month") || "1");

    const user = await prisma.user.findUnique({
      where: { id: params.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const monthEntries = await prisma.dayEntry.findMany({
      where: { userId: user.id, year, month },
      orderBy: { date: "asc" },
    });

    const yearEntries = await prisma.dayEntry.findMany({
      where: { userId: user.id, year },
      select: { status: true, month: true },
    });

    const yearCounts = {
      pl: yearEntries.filter((e) => e.status === "PL").length,
      sl: yearEntries.filter((e) => e.status === "SL").length,
      ol: yearEntries.filter((e) => e.status === "OL").length,
    };

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      entries: monthEntries.map((e) => ({
        date: e.date.toISOString().split("T")[0],
        status: e.status,
        dayType: e.dayType,
        holidayName: e.holidayName,
      })),
      monthSummary: computeMonthSummary(monthEntries),
      balances: computeLeaveBalances(yearCounts),
    });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Forbidden") {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === "Forbidden" ? 403 : 401 }
      );
    }
    console.error("GET /api/admin/users/[userId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
