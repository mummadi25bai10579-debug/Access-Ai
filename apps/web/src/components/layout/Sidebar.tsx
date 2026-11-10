"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import {
  LayoutDashboard,
  FileSearch,
  GraduationCap,
  Landmark,
  Briefcase,
  FolderOpen,
  Bell,
  User,
  Settings,
  Menu,
  X,
  Sparkles,
  LogOut,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeCount?: number;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/access", label: "AccessAI Assistant", icon: FileSearch, badge: "Shared AI" },
  { href: "/education", label: "EduBridge", icon: GraduationCap },
  { href: "/schemes", label: "SchemeConnect", icon: Landmark, badge: "Rules" },
  { href: "/opportunities", label: "OpportunityBridge", icon: Briefcase },
  { href: "/documents", label: "Document Studio", icon: FolderOpen },
  { href: "/notifications", label: "Notifications", icon: Bell, badgeCount: 3 },
  { href: "/profile", label: "Citizen Profile", icon: User },
  { href: "/settings", label: "Accessibility", icon: Settings },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { signOut } = useClerk();

  const closeMobile = () => setMobileOpen(false);

  const handleSignOut = () => {
    closeMobile();
    signOut({ redirectUrl: "/login" });
  };

  const renderNavList = () => (
    <ul className="space-y-1.5 px-3">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={closeMobile}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all focus-visible:ring-2 focus-visible:ring-primary ${
                isActive
                  ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                  : "text-muted hover:text-foreground hover:bg-accent hover:border-border border border-transparent"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? "text-primary-foreground" : "text-muted"
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded font-mono font-medium tracking-wide uppercase shrink-0 ${
                    isActive
                      ? "bg-white/20 text-primary-foreground border border-white/20"
                      : "bg-card border border-border text-muted"
                  }`}
                >
                  {item.badge}
                </span>
              )}

              {typeof item.badgeCount === "number" && item.badgeCount > 0 && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold shrink-0 ${
                    isActive
                      ? "bg-card text-primary font-bold border border-white/30"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {item.badgeCount}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      {/* Mobile Top Toggle Bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-base shadow-sm">
            A
          </div>
          <span className="font-extrabold text-base tracking-tight text-foreground">
            AccessAI
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileOpen}
          className="p-2 rounded-lg border border-border bg-card text-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={closeMobile}
          className="md:hidden fixed inset-0 z-40 bg-black/80 backdrop-blur-sm"
          aria-hidden="true"
        />
      )}

      {/* Desktop Persistent Sidebar & Mobile Drawer */}
      <nav
        aria-label="Primary Navigation"
        className={`w-64 bg-card border-r border-border flex flex-col justify-between shrink-0 transition-transform duration-200 z-50 md:z-auto ${
          mobileOpen
            ? "fixed inset-y-0 left-0 translate-x-0 shadow-2xl flex"
            : "hidden md:flex"
        }`}
      >
        <div className="space-y-6 pt-5">
          {/* Logo & Header */}
          <div className="px-5 flex items-center justify-between">
            <Link
              href="/dashboard"
              onClick={closeMobile}
              className="flex items-center gap-2.5 focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
            >
              <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-extrabold text-lg shadow-sm">
                A
              </div>
              <div>
                <h1 className="font-extrabold text-base tracking-tight text-foreground leading-none">
                  AccessAI
                </h1>
                <p className="text-xs text-muted font-medium mt-1">
                  Universal Intelligence
                </p>
              </div>
            </Link>

            {/* Mobile close button inside drawer */}
            <button
              type="button"
              onClick={closeMobile}
              aria-label="Close navigation"
              className="md:hidden p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-accent border border-border"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          {renderNavList()}
        </div>

        {/* Footer Meta Card & Log Out */}
        <div className="p-4 border-t border-border space-y-2.5">
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-muted hover:text-red-400 hover:bg-red-500/10 border border-border hover:border-red-500/30 transition-all focus-visible:ring-2 focus-visible:ring-red-500"
            aria-label="Log out of AccessAI"
          >
            <LogOut className="w-4 h-4 text-red-400 shrink-0" />
            <span>Log Out</span>
          </button>

          <div className="p-3 bg-card rounded-xl border border-border text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Universal Accessibility</span>
            </div>
            <p className="text-[11px] text-muted leading-relaxed">
              Standardized English interface with WCAG 2.2 AA target compliance.
            </p>
          </div>
        </div>
      </nav>
    </>
  );
};
