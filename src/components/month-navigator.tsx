"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface MonthNavigatorProps {
  year: number;
  month: number;
  onNavigate: (year: number, month: number) => void;
  minYear?: number;
  maxYear?: number;
}

export function MonthNavigator({
  year,
  month,
  onNavigate,
  minYear = 2026,
  maxYear = 2026,
}: MonthNavigatorProps) {
  const date = new Date(year, month - 1, 1);

  const canGoPrev = year > minYear || month > 1;
  const canGoNext = year < maxYear || month < 12;

  function goPrev() {
    if (month === 1) {
      onNavigate(year - 1, 12);
    } else {
      onNavigate(year, month - 1);
    }
  }

  function goNext() {
    if (month === 12) {
      onNavigate(year + 1, 1);
    } else {
      onNavigate(year, month + 1);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Button
        variant="outline"
        size="icon"
        onClick={goPrev}
        disabled={!canGoPrev}
        className="h-9 w-9"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <h2 className="text-xl font-semibold text-navy-700 min-w-[200px] text-center">
        {format(date, "MMMM yyyy")}
      </h2>
      <Button
        variant="outline"
        size="icon"
        onClick={goNext}
        disabled={!canGoNext}
        className="h-9 w-9"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
