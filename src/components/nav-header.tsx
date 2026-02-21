"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  LayoutDashboard,
  ShieldCheck,
  LogOut,
  User,
  KeyRound,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavHeader() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isAdmin = (session?.user as any)?.role === "ADMIN";

  const navItems = [
    { href: "/calendar", label: "Calendar", icon: CalendarDays },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ...(isAdmin
      ? [{ href: "/admin", label: "Admin", icon: ShieldCheck }]
      : []),
  ];

  return (
    <header className="sticky top-0 z-40 bg-navy-700 shadow-md">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link href="/calendar" className="flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-white" />
              <span className="text-white font-semibold text-lg hidden sm:inline">
                Attendance Tracker
              </span>
            </Link>

            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                      active
                        ? "bg-white/15 text-white"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {session?.user && (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 text-white/80">
                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-white">
                    {session.user.name}
                  </p>
                  <p className="text-[10px] text-white/60">
                    {session.user.email}
                  </p>
                </div>
              </div>
              <Link href="/change-password">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/70 hover:text-white hover:bg-white/10"
                  title="Change Password"
                >
                  <KeyRound className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/sign-in" })}
                className="text-white/70 hover:text-white hover:bg-white/10"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
