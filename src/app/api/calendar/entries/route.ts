export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { buildHolidayMap, classifyDate } from "@/lib/holidays";
import {
  saveEntriesSchema,
  isValidStatusForDayType,
  validateLeaveBalances,
  computeMonthSummary,
  computeLeaveBalances,
} from "@/lib/validations";
import { parseDateKey } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get("year") || "2026");
    const month = parseInt(searchParams.get("month") || "1");

    const entries = await prisma.dayEntry.findMany({
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

    const formattedEntries = entries.map((e) => ({
      date: e.date.toISOString().split("T")[0],
      status: e.status,
      dayType: e.dayType,
      holidayName: e.holidayName,
    }));

    return NextResponse.json({
      entries: formattedEntries,
      monthSummary: computeMonthSummary(entries),
      balances: computeLeaveBalances(yearCounts),
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/calendar/entries error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const parsed = saveEntriesSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { year, month, entries } = parsed.data;

    const holidays = await prisma.holidayCalendar.findMany({
      where: { year },
    });
    const holidayMap = buildHolidayMap(holidays);

    const validationErrors: string[] = [];
    for (const entry of entries) {
      const date = parseDateKey(entry.date);
      const entryMonth = date.getMonth() + 1;
      const entryYear = date.getFullYear();

      if (entryMonth !== month || entryYear !== year) {
        validationErrors.push(`Date ${entry.date} does not belong to ${year}-${month}`);
        continue;
      }

      const classification = classifyDate(date, holidayMap);

      if (classification.dayType === "HOLIDAY") {
        validationErrors.push(`Cannot set status on holiday: ${entry.date}`);
        continue;
      }

      if (!isValidStatusForDayType(entry.status, classification.dayType)) {
        validationErrors.push(
          `Status "${entry.status}" is not valid for ${classification.dayType} on ${entry.date}`
        );
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: "Validation failed", details: validationErrors },
        { status: 400 }
      );
    }

    const existingYearEntries = await prisma.dayEntry.findMany({
      where: {
        userId: user.id,
        year,
        NOT: { month },
      },
      select: { status: true },
    });

    const existingYearCounts = {
      pl: existingYearEntries.filter((e) => e.status === "PL").length,
      sl: existingYearEntries.filter((e) => e.status === "SL").length,
      ol: existingYearEntries.filter((e) => e.status === "OL").length,
    };

    const balanceResult = validateLeaveBalances(existingYearCounts, entries);
    if (!balanceResult.valid) {
      return NextResponse.json(
        { error: "Leave balance exceeded", details: balanceResult.errors },
        { status: 400 }
      );
    }

    await prisma.$transaction(
      entries.map((entry) => {
        const date = parseDateKey(entry.date);
        const classification = classifyDate(date, holidayMap);

        return prisma.dayEntry.upsert({
          where: {
            userId_date: {
              userId: user.id,
              date: new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())),
            },
          },
          update: {
            status: entry.status as any,
            dayType: classification.dayType as any,
            holidayName: classification.holidayName || null,
          },
          create: {
            userId: user.id,
            date: new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())),
            year,
            month,
            dayType: classification.dayType as any,
            status: entry.status as any,
            holidayName: classification.holidayName || null,
          },
        });
      })
    );

    const updatedYearEntries = await prisma.dayEntry.findMany({
      where: { userId: user.id, year },
      select: { status: true },
    });

    const updatedYearCounts = {
      pl: updatedYearEntries.filter((e) => e.status === "PL").length,
      sl: updatedYearEntries.filter((e) => e.status === "SL").length,
      ol: updatedYearEntries.filter((e) => e.status === "OL").length,
    };

    const savedEntries = await prisma.dayEntry.findMany({
      where: { userId: user.id, year, month },
      orderBy: { date: "asc" },
    });

    return NextResponse.json({
      success: true,
      entries: savedEntries.map((e) => ({
        date: e.date.toISOString().split("T")[0],
        status: e.status,
        dayType: e.dayType,
        holidayName: e.holidayName,
      })),
      monthSummary: computeMonthSummary(savedEntries),
      balances: computeLeaveBalances(updatedYearCounts),
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/calendar/entries error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
