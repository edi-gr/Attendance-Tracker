"use client";

import { Suspense, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { NavHeader } from "@/components/nav-header";
import { MonthNavigator } from "@/components/month-navigator";
import { MonthCalendar } from "@/components/month-calendar";
import { SummaryPanel } from "@/components/summary-panel";
import { Legend } from "@/components/legend";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCalendar } from "@/hooks/use-calendar";
import { Save, RotateCcw, Loader2 } from "lucide-react";
import type { HolidayRecord } from "@/lib/holidays";

function CalendarContent() {
  const { data: session, status: authStatus } = useSession();
  const searchParams = useSearchParams();

  const now = new Date();
  const defaultMonth = parseInt(
    searchParams.get("month") || String(now.getMonth() + 1)
  );
  const defaultYear = parseInt(searchParams.get("year") || "2026");

  const [year, setYear] = useState(defaultYear);
  const [month, setMonth] = useState(defaultMonth);
  const [holidays, setHolidays] = useState<HolidayRecord[]>([]);

  useEffect(() => {
    fetch(`/api/calendar/holidays?year=${year}`)
      .then((res) => res.json())
      .then((data) => {
        setHolidays(data.holidays || []);
      })
      .catch(() => {});
  }, [year]);

  const calendar = useCalendar(year, month, holidays);

  function handleNavigate(newYear: number, newMonth: number) {
    setYear(newYear);
    setMonth(newMonth);
  }

  async function handleSave() {
    const success = await calendar.save();
    if (success) {
      toast.success("Month saved successfully!");
    } else {
      toast.error("Failed to save. Check the errors.");
    }
  }

  function handleReset() {
    calendar.reset();
    toast.info("Reset to last saved state.");
  }

  if (authStatus === "loading") {
    return (
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-[600px] w-full" />
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <MonthNavigator
              year={year}
              month={month}
              onNavigate={handleNavigate}
            />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={!calendar.isDirty || calendar.saving}
              >
                <RotateCcw className="h-4 w-4 mr-1.5" />
                Reset
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={calendar.saving}
                className="text-white hover:opacity-90"
                style={{ backgroundColor: "#1c8195" }}
              >
                {calendar.saving ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1.5" />
                )}
                Save Month
              </Button>
            </div>
          </div>

          <Legend />

          <div className="mt-4">
            {calendar.loading ? (
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 35 }).map((_, i) => (
                  <Skeleton key={i} className="h-[100px] rounded-lg" />
                ))}
              </div>
            ) : (
              <MonthCalendar
                days={calendar.days}
                balances={calendar.balances}
                onStatusChange={calendar.setDayStatus}
              />
            )}
          </div>
        </div>

        <div className="w-full lg:w-[300px] flex-shrink-0">
          {calendar.loading ? (
            <div className="space-y-4">
              <Skeleton className="h-[200px] rounded-xl" />
              <Skeleton className="h-[100px] rounded-xl" />
              <Skeleton className="h-[200px] rounded-xl" />
            </div>
          ) : (
            <SummaryPanel
              monthSummary={calendar.monthSummary}
              balances={calendar.balances}
              wfoCompliant={calendar.wfoCompliant}
              workableDays={calendar.workableDays}
              errors={calendar.errors}
            />
          )}
        </div>
      </div>
    </main>
  );
}

export default function CalendarPage() {
  return (
    <div>
      <NavHeader />
      <Suspense
        fallback={
          <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
            <div className="space-y-4">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-[600px] w-full" />
            </div>
          </main>
        }
      >
        <CalendarContent />
      </Suspense>
    </div>
  );
}
