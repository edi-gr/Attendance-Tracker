export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") || "2026");

  const holidays = await prisma.holidayCalendar.findMany({
    where: { year },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({
    holidays: holidays.map((h) => ({
      date: h.date.toISOString().split("T")[0],
      type: h.type,
      name: h.name,
    })),
  });
}
