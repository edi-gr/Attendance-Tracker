"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { NavHeader } from "@/components/nav-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  Home,
  CalendarOff,
  Stethoscope,
  Star,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { YearSummary } from "@/types";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const [summary, setSummary] = useState<YearSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const year = 2026;

  useEffect(() => {
    fetch(`/api/calendar/summary?year=${year}`)
      .then((res) => res.json())
      .then((data) => {
        setSummary(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [year]);

  const statCards = summary
    ? [
        { label: "Total WFO", value: summary.totals.wfo, icon: Building2, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Total WFH", value: summary.totals.wfh, icon: Home, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Total PL", value: summary.totals.pl, icon: CalendarOff, color: "text-purple-600", bg: "bg-purple-50" },
        { label: "Total SL", value: summary.totals.sl, icon: Stethoscope, color: "text-red-600", bg: "bg-red-50" },
        { label: "Total OL", value: summary.totals.ol, icon: Star, color: "text-amber-600", bg: "bg-amber-50" },
      ]
    : [];

  return (
    <div>
      <NavHeader />
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-2xl font-bold text-navy-700 mb-6">
          Year Dashboard — {year}
        </h1>

        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-[400px] rounded-xl" />
          </div>
        ) : summary ? (
          <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {statCards.map((card) => {
                const Icon = card.icon;
                return (
                  <Card key={card.label}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg", card.bg)}>
                          <Icon className={cn("h-5 w-5", card.color)} />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-navy-700">
                            {card.value}
                          </p>
                          <p className="text-xs text-slate-500">{card.label}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Leave Balances */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {summary.balances.map((bal) => {
                const pct = (bal.used / bal.limit) * 100;
                const colorMap: Record<string, string> = {
                  PL: "bg-purple-500",
                  SL: "bg-red-500",
                  OL: "bg-amber-500",
                };
                const labelMap: Record<string, string> = {
                  PL: "Privilege Leave",
                  SL: "Sick Leave",
                  OL: "Optional Leave",
                };
                return (
                  <Card key={bal.type}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-navy-700">
                          {labelMap[bal.type]}
                        </span>
                        <span className="text-xs text-slate-500">
                          {bal.used} / {bal.limit}
                        </span>
                      </div>
                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            colorMap[bal.type]
                          )}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <p
                        className={cn(
                          "text-xs mt-1.5",
                          bal.remaining <= 0
                            ? "text-red-600 font-medium"
                            : "text-slate-500"
                        )}
                      >
                        {bal.remaining} days remaining
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Monthly Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-navy-700">
                  Monthly Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-2 font-semibold text-navy-700">
                          Month
                        </th>
                        <th className="text-center py-3 px-2 font-semibold text-navy-700">
                          WFO
                        </th>
                        <th className="text-center py-3 px-2 font-semibold text-navy-700">
                          WFH
                        </th>
                        <th className="text-center py-3 px-2 font-semibold text-navy-700">
                          PL
                        </th>
                        <th className="text-center py-3 px-2 font-semibold text-navy-700">
                          SL
                        </th>
                        <th className="text-center py-3 px-2 font-semibold text-navy-700">
                          OL
                        </th>
                        <th className="text-center py-3 px-2 font-semibold text-navy-700">
                          WFO Status
                        </th>
                        <th className="py-3 px-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                        const ms = summary.months[m] || {
                          wfo: 0,
                          wfh: 0,
                          pl: 0,
                          sl: 0,
                          ol: 0,
                        };
                        const compliant = summary.wfoCompliance[m];
                        const hasData =
                          ms.wfo + ms.wfh + ms.pl + ms.sl + ms.ol > 0;

                        return (
                          <tr
                            key={m}
                            className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                          >
                            <td className="py-3 px-2 font-medium text-navy-700">
                              {MONTH_NAMES[m - 1]}
                            </td>
                            <td className="text-center py-3 px-2">{ms.wfo}</td>
                            <td className="text-center py-3 px-2">{ms.wfh}</td>
                            <td className="text-center py-3 px-2">{ms.pl}</td>
                            <td className="text-center py-3 px-2">{ms.sl}</td>
                            <td className="text-center py-3 px-2">{ms.ol}</td>
                            <td className="text-center py-3 px-2">
                              {hasData ? (
                                compliant ? (
                                  <Badge variant="success" className="text-[10px]">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Met
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive" className="text-[10px]">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Not Met
                                  </Badge>
                                )
                              ) : (
                                <span className="text-slate-400 text-xs">
                                  —
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-2">
                              <Link
                                href={`/calendar?month=${m}&year=${year}`}
                                className="text-navy-600 hover:text-navy-700"
                              >
                                <ArrowRight className="h-4 w-4" />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <p className="text-slate-500">No data available.</p>
        )}
      </main>
    </div>
  );
}
