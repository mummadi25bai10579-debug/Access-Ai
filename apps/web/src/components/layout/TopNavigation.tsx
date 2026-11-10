"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { Sparkles, Globe, Sun, Moon, LogOut } from "lucide-react";
import { UserButton, useUser, useClerk } from "@clerk/nextjs";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAccessibilityStore } from "@/stores/accessibilityStore";

export const TopNavigation: React.FC = () => {
  const { theme, toggleTheme } = useAccessibilityStore();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  const handleSignOut = () => {
    signOut({ redirectUrl: "/login" });
  };

  const displayName = isLoaded && user
    ? user.fullName || user.primaryEmailAddress?.emailAddress?.split("@")[0] || "Citizen"
    : "Citizen";

  return (
    <div className="bg-card border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between text-xs sm:text-sm">
      <div className="flex items-center gap-2.5 text-muted">
        <Sparkles className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
        <span className="font-semibold text-foreground">
          AccessAI Multi-Module Platform
        </span>
        <span className="hidden sm:inline text-border">|</span>
        <span className="hidden sm:inline text-muted">
          Universal Access Intelligence
        </span>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Active Language Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border border-border text-foreground font-medium text-xs">
          <Globe className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
          <span>English</span>
        </div>

        {/* Quick Theme Switcher */}
        <button
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to pure black dark theme"}
          className="p-2 rounded-lg bg-card border border-border hover:bg-accent hover:border-primary/50 text-foreground transition-all focus-visible:ring-2 focus-visible:ring-primary"
          title={theme === "dark" ? "Switch to light theme" : "Switch to pure black dark theme"}
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-primary" />
          )}
        </button>

        {/* User Identity / Profile pill & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <Suspense fallback={<Skeleton variant="circular" width="1.75rem" height="1.75rem" />}>
            <UserButton />
          </Suspense>
          <span className="hidden md:inline font-medium text-foreground text-xs">
            {displayName}
          </span>
          <button
            type="button"
            onClick={handleSignOut}
            aria-label="Log out of AccessAI"
            title="Log out of your account"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-card text-muted hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10 text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-primary ml-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
