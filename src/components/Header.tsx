"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Menu,
  X,
  ExternalLink,
} from "lucide-react";

const navItems = [
  { href: "/", label: "首页", icon: LayoutDashboard },
];

const dataSources = [
  { name: "Open Cabinet", url: "https://open-cabinet.org" },
  { name: "TrumpTrades", url: "https://trumpstrades.com" },
  { name: "Trump Tracker", url: "https://trumptracker.org" },
  { name: "OGE", url: "https://oge.gov" },
  { name: "ProPublica", url: "https://projects.propublica.org/trump-team-financial-disclosures/" },
];

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-3 py-2.5 sm:px-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-600 to-red-600 text-xs font-bold text-white shadow-sm group-hover:shadow-md transition-shadow">
            SM
          </span>
          <div>
            <span className="block text-sm font-bold text-slate-900 leading-tight">
              SmartMoney
            </span>
            <span className="block text-[10px] text-slate-400 leading-tight">
              政要持仓追踪
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="w-px h-5 bg-slate-200 mx-2" />
          {dataSources.slice(0, 3).map((s) => (
            <a
              key={s.name}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2 py-1 text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
            >
              {s.name}
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          ))}
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex md:hidden items-center justify-center h-9 w-9 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label={menuOpen ? "关闭" : "菜单"}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-3 py-3 shadow-lg">
          <nav className="flex flex-col gap-1 mb-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-slate-100 pt-2">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2 font-medium">数据源</p>
            <div className="flex flex-wrap gap-2">
              {dataSources.map((s) => (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-500 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors"
                >
                  {s.name}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
