export type DayType = "HOLIDAY" | "OPTIONAL_HOLIDAY" | "WORKDAY";
export type Status = "WFO" | "WFH" | "PL" | "SL" | "OL";
export type Role = "USER" | "ADMIN";

export interface DayClassification {
  dayType: DayType;
  holidayName?: string;
}

export interface CalendarDay {
  date: string; // YYYY-MM-DD
  dayOfMonth: number;
  dayType: DayType;
  holidayName?: string;
  status: Status | null;
  isCurrentMonth: boolean;
  isWeekend: boolean;
}

export interface MonthEntry {
  date: string;
  status: Status | null;
  dayType: DayType;
  holidayName?: string;
}

export interface SaveEntriesRequest {
  year: number;
  month: number;
  entries: { date: string; status: string }[];
}

export interface LeaveBalance {
  type: "PL" | "SL" | "OL";
  limit: number;
  used: number;
  remaining: number;
}

export interface MonthSummary {
  wfo: number;
  wfh: number;
  pl: number;
  sl: number;
  ol: number;
}

export interface YearSummary {
  months: Record<number, MonthSummary>;
  totals: MonthSummary;
  balances: LeaveBalance[];
  wfoCompliance: Record<number, boolean>;
}

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: Role;
  monthSummary: MonthSummary;
  yearBalances: LeaveBalance[];
  wfoCompliant: boolean;
  lastUpdated: string | null;
}
