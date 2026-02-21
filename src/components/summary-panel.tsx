"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  Home,
  CalendarOff,
  Stethoscope,
  Star,
} from "lucide-react";
import { STATUS_LABELS, MIN_WFO_PER_MONTH } from "@/lib/constants";
import type { MonthSummary, LeaveBalance } from "@/types";
import { cn } from "@/lib/utils";

interface SummaryPanelProps {
  monthSummary: MonthSummary;
  balances: LeaveBalance[];
  wfoCompliant: boolean;
  workableDays: number;
  errors: string[];
}

const STAT_CONFIG = [
  { key: "wfo", label: "WFO", icon: Building2, color: "text-emerald-600" },
  { key: "wfh", label: "WFH", icon: Home, color: "text-blue-600" },
  { key: "pl", label: "PL", icon: CalendarOff, color: "text-purple-600" },
  { key: "sl", label: "SL", icon: Stethoscope, color: "text-red-600" },
  { key: "ol", label: "OL", icon: Star, color: "text-amber-600" },
] as const;

const BALANCE_LABEL: Record<string, string> = {
  PL: "Privilege Leave",
  SL: "Sick Leave",
  OL: "Optional Leave",
};

const BALANCE_COLOR: Record<string, string> = {
  PL: "bg-purple-500",
  SL: "bg-red-500",
  OL: "bg-amber-500",
};

export function SummaryPanel({
  monthSummary,
  balances,
  wfoCompliant,
  workableDays,
  errors,
}: SummaryPanelProps) {
  return (
    <div className="space-y-4">
      {/* Month Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-navy-700">
            Monthly Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {STAT_CONFIG.map(({ key, label, icon: Icon, color }) => (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className={cn("h-4 w-4", color)} />
                <span className="text-sm text-slate-600">{label}</span>
              </div>
              <span className="text-sm font-semibold text-navy-700">
                {monthSummary[key as keyof MonthSummary]}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* WFO Compliance */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            {wfoCompliant ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="text-sm font-medium text-emerald-700">
                    WFO Compliant
                  </p>
                  <p className="text-xs text-slate-500">
                    {monthSummary.wfo} / {MIN_WFO_PER_MONTH} minimum days met
                  </p>
                </div>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-red-700">
                    WFO Not Met
                  </p>
                  <p className="text-xs text-slate-500">
                    {monthSummary.wfo} / {MIN_WFO_PER_MONTH} minimum days
                    {workableDays < MIN_WFO_PER_MONTH && (
                      <span className="block text-amber-600 mt-0.5">
                        (Only {workableDays} workable days this month)
                      </span>
                    )}
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Leave Balances */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-navy-700">
            Yearly Leave Balance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {balances.map((bal) => (
            <div key={bal.type} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600">
                  {BALANCE_LABEL[bal.type]}
                </span>
                <span className="text-xs text-slate-500">
                  {bal.used} / {bal.limit} used
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    BALANCE_COLOR[bal.type],
                    bal.remaining < 0 && "bg-red-500"
                  )}
                  style={{
                    width: `${Math.min((bal.used / bal.limit) * 100, 100)}%`,
                  }}
                />
              </div>
              <p
                className={cn(
                  "text-xs",
                  bal.remaining <= 0
                    ? "text-red-600 font-medium"
                    : "text-slate-500"
                )}
              >
                {bal.remaining} remaining
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Errors */}
      {errors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <div className="flex gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                {errors.map((error, i) => (
                  <p key={i} className="text-xs text-red-700">
                    {error}
                  </p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
