"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { NavHeader } from "@/components/nav-header";
import { MonthNavigator } from "@/components/month-navigator";
import { MonthCalendar } from "@/components/month-calendar";
import { SummaryPanel } from "@/components/summary-panel";
import { Legend } from "@/components/legend";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { buildHolidayMap, generateCalendarDays, countWorkableDays } from "@/lib/holidays";
import { MIN_WFO_PER_MONTH } from "@/lib/constants";
import type { CalendarDay, MonthSummary, LeaveBalance, Status } from "@/types";
import type { HolidayRecord } from "@/lib/holidays";

function AdminUserDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const userId = params.userId as string;

  const defaultMonth = parseInt(
    searchParams.get("month") || String(new Date().getMonth() + 1)
  );
  const defaultYear = parseInt(searchParams.get("year") || "2026");

  const [year, setYear] = useState(defaultYear);
  const [month, setMonth] = useState(defaultMonth);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [monthSummary, setMonthSummary] = useState<MonthSummary>({
    wfo: 0, wfh: 0, pl: 0, sl: 0, ol: 0,
  });
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [holidays, setHolidays] = useState<HolidayRecord[]>([]);
  const [workableDays, setWorkableDays] = useState(22);

  useEffect(() => {
    fetch(`/api/calendar/holidays?year=${year}`)
      .then((res) => res.json())
      .then((data) => setHolidays(data.holidays || []));
  }, [year]);

  useEffect(() => {
    if (holidays.length === 0) return;
    setLoading(true);
    fetch(`/api/admin/users/${userId}?year=${year}&month=${month}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUserName(data.user.name);
          setUserEmail(data.user.email);
        }
        if (data.monthSummary) setMonthSummary(data.monthSummary);
        if (data.balances) setBalances(data.balances);

        const savedMap = new Map<string, Status | null>();
        if (data.entries) {
          for (const e of data.entries) {
            savedMap.set(e.date, e.status);
          }
        }

        const holidayMap = buildHolidayMap(holidays);
        const calDays = generateCalendarDays(year, month, holidayMap, savedMap);
        const wd = countWorkableDays(year, month, holidayMap);
        setDays(calDays);
        setWorkableDays(wd);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userId, year, month, holidays]);

  const wfoCompliant =
    workableDays < MIN_WFO_PER_MONTH || monthSummary.wfo >= MIN_WFO_PER_MONTH;

  return (
    <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/admin?year=${year}&month=${month}`}>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-navy-700">
            {userName || "User"}
          </h1>
          <p className="text-sm text-slate-500">{userEmail}</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <div className="mb-4">
            <MonthNavigator
              year={year}
              month={month}
              onNavigate={(y, m) => {
                setYear(y);
                setMonth(m);
              }}
            />
          </div>

          <Legend />

          <div className="mt-4">
            {loading ? (
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 35 }).map((_, i) => (
                  <Skeleton key={i} className="h-[100px] rounded-lg" />
                ))}
              </div>
            ) : (
              <MonthCalendar
                days={days}
                balances={balances}
                onStatusChange={() => {}}
              />
            )}
          </div>
        </div>

        <div className="w-full lg:w-[300px] flex-shrink-0">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-[200px] rounded-xl" />
              <Skeleton className="h-[100px] rounded-xl" />
              <Skeleton className="h-[200px] rounded-xl" />
            </div>
          ) : (
            <SummaryPanel
              monthSummary={monthSummary}
              balances={balances}
              wfoCompliant={wfoCompliant}
              workableDays={workableDays}
              errors={[]}
            />
          )}
        </div>
      </div>
    </main>
  );
}

export default function AdminUserDetailPage() {
  return (
    <div>
      <NavHeader />
      <Suspense
        fallback={
          <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
            <Skeleton className="h-[600px] w-full rounded-xl" />
          </main>
        }
      >
        <AdminUserDetailContent />
      </Suspense>
    </div>
  );
}
