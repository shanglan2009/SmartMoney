"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  MessageSquareText,
  Search,
  CalendarDays,
  TrendingUp,
} from "lucide-react";
import SearchBox from "@/components/SearchBox";

const navItems = [
  { href: "/", label: "总览", icon: Activity },
  { href: "/stocks", label: "股票", icon: Search },
  { href: "/alerts", label: "预警", icon: MessageSquareText },
  { href: "/industry", label: "行业", icon: CalendarDays },
  { href: "/performance", label: "战绩", icon: TrendingUp },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 px-3 pt-3 sm:px-4 lg:px-6">
      <div className="mx-auto flex w-full max-w-[1480px] items-center justify-between gap-4 rounded-full border border-rule bg-white/95 px-3 py-2 backdrop-blur md:px-4">
        {/* Logo + Brand */}
        <Link
          href="/"
          className="flex min-w-0 items-center gap-3 shrink-0"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-ink text-xs font-semibold text-white md:h-9 md:w-9 md:text-sm">
            SA
          </span>
          <span className="min-w-0 hidden sm:block">
            <span className="block text-sm font-semibold text-ink">
              Serenity A股
            </span>
            <span className="block truncate text-xs text-muted">
              供应链稀缺度分析
            </span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 xl:flex">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-10 items-center gap-2 rounded-full px-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-paper-3 text-ink"
                    : "text-ink-2 hover:bg-paper-3 hover:text-ink"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Search + Actions */}
        <div className="flex items-center gap-2">
          <SearchBox />
        </div>
      </div>
    </header>
  );
}
