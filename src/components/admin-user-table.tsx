"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldCheck,
  ShieldOff,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import type { UserSummary } from "@/types";

interface AdminUserTableProps {
  users: UserSummary[];
  year: number;
  month: number;
  onRoleChanged: () => void;
}

export function AdminUserTable({ users, year, month, onRoleChanged }: AdminUserTableProps) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmingAction, setConfirmingAction] = useState<"ADMIN" | "USER" | null>(null);
  const [changingId, setChangingId] = useState<string | null>(null);

  async function handleRoleChange(userId: string, newRole: "ADMIN" | "USER") {
    setChangingId(userId);
    try {
      const res = await fetch("/api/admin/roles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, newRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to change role");
      } else {
        toast.success(
          newRole === "ADMIN"
            ? `User promoted to Admin`
            : `Admin demoted to User`
        );
        onRoleChanged();
      }
    } catch {
      toast.error("Network error");
    } finally {
      setChangingId(null);
      setConfirmingId(null);
      setConfirmingAction(null);
    }
  }

  function startConfirm(userId: string, action: "ADMIN" | "USER") {
    setConfirmingId(userId);
    setConfirmingAction(action);
  }

  function cancelConfirm() {
    setConfirmingId(null);
    setConfirmingAction(null);
  }

  if (users.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-slate-500">
          No users found.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left py-3 px-4 font-semibold text-navy-700">
                  Name
                </th>
                <th className="text-left py-3 px-4 font-semibold text-navy-700">
                  Email
                </th>
                <th className="text-center py-3 px-2 font-semibold text-navy-700">
                  Role
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
                  PL Rem
                </th>
                <th className="text-center py-3 px-2 font-semibold text-navy-700">
                  SL Rem
                </th>
                <th className="text-center py-3 px-2 font-semibold text-navy-700">
                  OL Rem
                </th>
                <th className="text-center py-3 px-2 font-semibold text-navy-700">
                  WFO
                </th>
                <th className="text-center py-3 px-2 font-semibold text-navy-700">
                  Updated
                </th>
                <th className="py-3 px-2" />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const plBal = user.yearBalances.find((b) => b.type === "PL");
                const slBal = user.yearBalances.find((b) => b.type === "SL");
                const olBal = user.yearBalances.find((b) => b.type === "OL");
                const isConfirming = confirmingId === user.id;
                const isChanging = changingId === user.id;

                return (
                  <tr
                    key={user.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <p className="font-medium text-navy-700">
                        {user.name}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-xs">
                      {user.email}
                    </td>
                    <td className="text-center py-3 px-2">
                      {isConfirming ? (
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-[10px] text-slate-500 mr-1">
                            {confirmingAction === "ADMIN" ? "Promote?" : "Demote?"}
                          </span>
                          <Button
                            size="sm"
                            variant="default"
                            className="h-6 px-2 text-[10px]"
                            disabled={isChanging}
                            onClick={() => handleRoleChange(user.id, confirmingAction!)}
                          >
                            {isChanging ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Yes"
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-[10px]"
                            disabled={isChanging}
                            onClick={cancelConfirm}
                          >
                            No
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5">
                          {user.role === "ADMIN" ? (
                            <>
                              <Badge
                                className="text-[9px] text-white border-0"
                                style={{ backgroundColor: "#1c8195" }}
                              >
                                ADMIN
                              </Badge>
                              <button
                                onClick={() => startConfirm(user.id, "USER")}
                                className="text-slate-400 hover:text-red-500 transition-colors"
                                title="Demote to User"
                              >
                                <ShieldOff className="h-3.5 w-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <Badge variant="secondary" className="text-[9px]">
                                USER
                              </Badge>
                              <button
                                onClick={() => startConfirm(user.id, "ADMIN")}
                                className="text-slate-400 hover:text-navy-600 transition-colors"
                                title="Promote to Admin"
                              >
                                <ShieldCheck className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="text-center py-3 px-2">
                      {user.monthSummary.wfo}
                    </td>
                    <td className="text-center py-3 px-2">
                      {user.monthSummary.wfh}
                    </td>
                    <td className="text-center py-3 px-2">
                      {user.monthSummary.pl}
                    </td>
                    <td className="text-center py-3 px-2">
                      {user.monthSummary.sl}
                    </td>
                    <td className="text-center py-3 px-2">
                      {user.monthSummary.ol}
                    </td>
                    <td
                      className={cn(
                        "text-center py-3 px-2",
                        plBal && plBal.remaining <= 0 && "text-red-600 font-medium"
                      )}
                    >
                      {plBal?.remaining ?? "—"}
                    </td>
                    <td
                      className={cn(
                        "text-center py-3 px-2",
                        slBal && slBal.remaining <= 0 && "text-red-600 font-medium"
                      )}
                    >
                      {slBal?.remaining ?? "—"}
                    </td>
                    <td
                      className={cn(
                        "text-center py-3 px-2",
                        olBal && olBal.remaining <= 0 && "text-red-600 font-medium"
                      )}
                    >
                      {olBal?.remaining ?? "—"}
                    </td>
                    <td className="text-center py-3 px-2">
                      {user.wfoCompliant ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                      )}
                    </td>
                    <td className="text-center py-3 px-2 text-xs text-slate-400">
                      {user.lastUpdated
                        ? format(new Date(user.lastUpdated), "MMM d")
                        : "—"}
                    </td>
                    <td className="py-3 px-2">
                      <Link
                        href={`/admin/${user.id}?year=${year}&month=${month}`}
                        className="text-navy-600 hover:text-navy-700"
                      >
                        <ExternalLink className="h-4 w-4" />
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
  );
}
