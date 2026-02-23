export const LEAVE_LIMITS = {
  PL: 21,
  SL: 12,
  OL: 2,
} as const;

export const MIN_WFO_PER_MONTH = 6;

export const SUPPORTED_YEARS = [2026] as const;

export const STATUS_LABELS: Record<string, string> = {
  WFO: "Work From Office",
  WFH: "Work From Home",
  PL: "Privilege Leave",
  SL: "Sick Leave",
  OL: "Optional Leave",
};

export const STATUS_COLORS: Record<string, string> = {
  WFO: "bg-emerald-100 text-emerald-800",
  WFH: "bg-transparent text-slate-600",
  PL: "bg-purple-100 text-purple-800",
  SL: "bg-red-100 text-red-800",
  OL: "bg-amber-100 text-amber-800",
};

export const WORKDAY_STATUSES = ["WFO", "WFH", "PL", "SL"] as const;
export const OPTIONAL_HOLIDAY_STATUSES = [
  "WFO",
  "WFH",
  "PL",
  "SL",
  "OL",
] as const;

export const ADMIN_EMAILS = [
  "edsongeorge.rebello@breadfinancial.com",
  "abhishekkumar.jha@breadfinancial.com",
  "naveli.das@breadfinancial.com",
];

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
