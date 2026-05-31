"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Activity,
  MessageSquareText,
  Search,
  CalendarDays,
  TrendingUp,
  Wallet,
  Menu,
  X,
  Landmark,
} from "lucide-react";
import SearchBox from "@/components/SearchBox";

const navItems = [
  { href: "/", label: "总览", icon: Activity },
  { href: "/trump", label: "Trump持仓", icon: Landmark },
  { href: "/stocks", label: "股票", icon: Search },
  { href: "/alerts", label: "预警", icon: MessageSquareText },
  { href: "/industry", label: "行业", icon: CalendarDays },
  { href: "/portfolio", label: "模拟市值", icon: Wallet },
  { href: "/performance", label: "战绩", icon: TrendingUp },
];

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 px-2 pt-2 sm:px-3 sm:pt-3 lg:px-6">
      <div className="mx-auto flex w-full max-w-[1480px] items-center justify-between gap-2 rounded-full border border-rule bg-white/95 px-3 py-2 backdrop-blur md:px-4">
        {/* Logo + Brand */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-700 text-[10px] font-semibold text-white sm:h-8 sm:w-8 sm:text-xs md:h-9 md:w-9 md:text-sm">
            SM
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-semibold text-ink sm:text-sm">
              SmartMoney
            </span>
            <span className="hidden truncate text-[10px] text-muted sm:block sm:text-xs">
              政要持仓追踪 · 供应链分析
            </span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.slice(0, 4).map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium transition-colors sm:min-h-9 sm:px-3 sm:text-sm ${
                  isActive
                    ? "bg-paper-3 text-ink"
                    : "text-ink-2 hover:bg-paper-3 hover:text-ink"
                }`}
              >
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden lg:inline">{item.label}</span>
              </Link>
            );
          })}
          {/* Search + More on desktop */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.slice(4).map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex min-h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-paper-3 text-ink"
                      : "text-ink-2 hover:bg-paper-3 hover:text-ink"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Right: Search + Mobile Menu */}
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="hidden sm:block">
            <SearchBox />
          </div>
          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex md:hidden items-center justify-center h-8 w-8 rounded-full hover:bg-paper-3 transition-colors"
            aria-label={menuOpen ? "关闭菜单" : "打开菜单"}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <div className="mx-auto mt-2 max-w-[1480px] rounded-2xl border border-rule bg-white/95 p-2 backdrop-blur shadow-lg md:hidden">
          <div className="sm:hidden mb-2">
            <SearchBox />
          </div>
          <nav className="grid grid-cols-3 gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex flex-col items-center gap-1 rounded-xl p-3 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-paper-3 text-ink"
                      : "text-ink-2 hover:bg-paper-3 hover:text-ink"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
