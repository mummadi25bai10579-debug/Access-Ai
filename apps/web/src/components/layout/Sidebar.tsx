"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileSearch,
  GraduationCap,
  Landmark,
  Briefcase,
  FolderOpen,
  User,
  Settings,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/access", label: "Universal Assistant", icon: FileSearch, badge: "Shared AI" },
  { href: "/education", label: "EduBridge", icon: GraduationCap },
  { href: "/schemes", label: "SchemeConnect", icon: Landmark, badge: "Verified" },
  { href: "/opportunities", label: "OpportunityBridge", icon: Briefcase },
  { href: "/documents", label: "My Documents", icon: FolderOpen },
  { href: "/profile", label: "My Profile", icon: User },
  { href: "/settings", label: "Accessibility Settings", icon: Settings },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main Navigation"
      className="w-64 bg-card border-r border-border flex flex-col justify-between shrink-0"
    >
      <div className="p-4 space-y-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
            A
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight">AccessAI</h1>
            <p className="text-xs opacity-70">Universal Access Platform</p>
          </div>
        </div>

        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:ring-2 ${
                    isActive
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "hover:bg-accent text-foreground"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold uppercase ${
                        isActive
                          ? "bg-black/20 text-white"
                          : "bg-accent border border-border"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="p-4 border-t border-border">
        <div className="p-3 bg-accent rounded-lg text-xs space-y-1">
          <p className="font-bold">Indian Languages Ready</p>
          <p className="opacity-75">Telugu · Hindi · Tamil · Kannada</p>
        </div>
      </div>
    </nav>
  );
};
