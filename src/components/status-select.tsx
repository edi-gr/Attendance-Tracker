"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUS_LABELS, STATUS_COLORS, WORKDAY_STATUSES, OPTIONAL_HOLIDAY_STATUSES } from "@/lib/constants";
import type { DayType, Status, LeaveBalance } from "@/types";

interface StatusSelectProps {
  value: Status | null;
  dayType: DayType;
  balances: LeaveBalance[];
  onChange: (status: Status) => void;
}

export function StatusSelect({
  value,
  dayType,
  balances,
  onChange,
}: StatusSelectProps) {
  if (dayType === "HOLIDAY") return null;

  const options =
    dayType === "OPTIONAL_HOLIDAY" ? OPTIONAL_HOLIDAY_STATUSES : WORKDAY_STATUSES;

  const plBalance = balances.find((b) => b.type === "PL");
  const slBalance = balances.find((b) => b.type === "SL");
  const olBalance = balances.find((b) => b.type === "OL");

  function isDisabled(status: string): boolean {
    if (status === "PL" && plBalance && plBalance.remaining <= 0 && value !== "PL")
      return true;
    if (status === "SL" && slBalance && slBalance.remaining <= 0 && value !== "SL")
      return true;
    if (status === "OL" && olBalance && olBalance.remaining <= 0 && value !== "OL")
      return true;
    return false;
  }

  return (
    <Select value={value || "WFH"} onValueChange={(v) => onChange(v as Status)}>
      <SelectTrigger className="h-7 w-[88px] text-[11px] font-medium">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt} disabled={isDisabled(opt)}>
            <span className="flex items-center gap-1.5">
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  STATUS_COLORS[opt]?.split(" ")[0] || "bg-gray-100"
                }`}
              />
              {opt}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
