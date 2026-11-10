"use client";

import React, { useState } from "react";
import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import {
  Settings,
  ZoomIn,
  ZoomOut,
  SunMoon,
  Volume2,
  BookOpen,
  Languages,
  Keyboard,
  ShieldCheck,
  CheckCircle2,
  Palette,
  Moon,
  Sun,
  Database,
  Cloud,
  Loader2,
  LogOut,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { useAccessibilityStore, ThemeMode } from "@/stores/accessibilityStore";
import { ApiClient } from "@/lib/api/client";

export default function SettingsPage() {
  const { isSignedIn, getToken, userId } = useAuth();
  const { signOut } = useClerk();
  const { user } = useUser();
  const [syncStatus, setSyncStatus] = useState<"idle" | "saving" | "synced" | "error">("idle");
  const {
    theme,
    setTheme,
    fontScale,
    increaseFont,
    decreaseFont,
    resetFont,
    highContrast,
    toggleHighContrast,
    voiceEnabled,
    toggleVoice,
    simplifiedLanguage,
    toggleSimplifiedLanguage,
    activeLanguage,
  } = useAccessibilityStore();

  const handleSyncPreferences = async () => {
    if (!isSignedIn) return;
    try {
      setSyncStatus("saving");
      const token = await getToken();
      if (token) {
        await ApiClient.updatePreferences(
          {
            voice_enabled: voiceEnabled,
            simplified_language: simplifiedLanguage,
            high_contrast: highContrast,
            font_scale: fontScale,
            preferred_output: voiceEnabled ? "voice" : "text",
          },
          token
        );
        setSyncStatus("synced");
      }
    } catch (err) {
      console.error("Failed to sync preferences to Supabase:", err);
      setSyncStatus("error");
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <PageHeader
        title="Accessibility Settings & Preferences"
        description="AccessAI is engineered with a pure black OLED dark theme and designed for WCAG 2.2 AA standards. Customize font sizing, contrast modes, and screen-reader narration."
        badge={<Badge variant="primary">Target: WCAG 2.2 AA</Badge>}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Accessibility Settings" },
        ]}
      />

      <div className="space-y-6">
        {/* Visual Theme Selection Card */}
        <Card className="space-y-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-base sm:text-lg text-foreground">
                Base Visual Theme
              </h2>
            </div>
            <Badge variant="outline">
              Current: {theme === "dark" ? "Pure Black Dark" : "Clean Light"}
            </Badge>
          </CardHeader>

          <CardContent className="space-y-4 text-xs sm:text-sm">
            <p className="text-muted leading-relaxed">
              Choose your preferred visual aesthetic. AccessAI defaults to an OLED pure black visual system (<code className="px-1.5 py-0.5 rounded bg-card border border-border text-primary font-mono text-xs">#000000</code>) with subtle <code className="px-1.5 py-0.5 rounded bg-card border border-border text-muted font-mono text-xs">#333333</code> borders and an accessible blue accent. You can also select the clean SaaS Light Theme.
            </p>

            {/* Theme Toggle Options */}
            <div className="grid sm:grid-cols-2 gap-3.5 pt-1">
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 focus-visible:ring-2 focus-visible:ring-primary ${
                  theme === "dark"
                    ? "border-primary bg-card ring-1 ring-primary shadow-sm"
                    : "border-border bg-card/60 hover:border-primary/50 text-muted"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                    <Moon className="w-4 h-4 text-primary" />
                    <span>Pure Black OLED Theme</span>
                  </div>
                  {theme === "dark" && (
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  )}
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  Deep OLED #000000 surfaces, high energy efficiency on mobile AMOLED screens, and reduced eye strain.
                </p>
                <div className="flex items-center gap-2 pt-1 font-mono text-[11px] text-muted">
                  <span className="w-3 h-3 rounded-full bg-black border border-neutral-700" />
                  <span>#000000 surfaces · #2563EB accent</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 focus-visible:ring-2 focus-visible:ring-primary ${
                  theme === "light"
                    ? "border-primary bg-card ring-1 ring-primary shadow-sm"
                    : "border-border bg-card/60 hover:border-primary/50 text-muted"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>Modern Clean Light Theme</span>
                  </div>
                  {theme === "light" && (
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  )}
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  Clean crisp daylight reading mode with slate typography, #ffffff cards, and high readability in bright environments.
                </p>
                <div className="flex items-center gap-2 pt-1 font-mono text-[11px] text-muted">
                  <span className="w-3 h-3 rounded-full bg-slate-100 border border-slate-300" />
                  <span>#ffffff cards · Slate typography</span>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* High Contrast Mode Independent Setting */}
        <Card className="space-y-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <SunMoon className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-base sm:text-lg text-foreground">
                Independent High-Contrast Mode (WCAG AAA Contrast &gt; 7:1)
              </h2>
            </div>
            <Badge variant={highContrast ? "warning" : "outline"}>
              {highContrast ? "HIGH CONTRAST ACTIVE" : "INACTIVE"}
            </Badge>
          </CardHeader>

          <CardContent className="space-y-3.5">
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              An independent accessibility setting designed for low-vision citizens. When enabled, it transforms borders, interactive controls, and key indicators into stark high-visibility yellow (<code className="px-1.5 py-0.5 rounded bg-card border border-border text-yellow-400 font-mono text-xs">#FFFF00</code>) against pure black. Disabling it restores your previously selected base theme (Pure Black or Light).
            </p>

            <Button
              variant={highContrast ? "primary" : "outline"}
              size="md"
              onClick={toggleHighContrast}
              leftIcon={<SunMoon className="w-4 h-4" />}
            >
              {highContrast ? "Turn High Contrast Off (Restore Base Theme)" : "Enable High Contrast Mode (Yellow / Black)"}
            </Button>
          </CardContent>
        </Card>

        {/* Dynamic Font Scaling */}
        <Card className="space-y-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ZoomIn className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-base sm:text-lg text-foreground">
                Dynamic Font Scaling (100% to 200%)
              </h2>
            </div>
            <span className="font-mono font-bold text-sm sm:text-base text-primary">
              {Math.round(fontScale * 100)}% Current Scale
            </span>
          </CardHeader>

          <CardContent className="space-y-3.5">
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              Adjust typography scaling across the entire application interface. Layouts fluidly reflow without horizontal scrolling or text clipping.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={decreaseFont}
                leftIcon={<ZoomOut className="w-4 h-4" />}
              >
                Decrease (-10%)
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={increaseFont}
                leftIcon={<ZoomIn className="w-4 h-4" />}
              >
                Increase (+10%)
              </Button>

              <Button variant="ghost" size="sm" onClick={resetFont}>
                Reset to 100%
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Speech Synthesis & Plain Language */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Card className="space-y-3.5 p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-sm sm:text-base text-foreground">
                  Voice Audio Readout
                </h3>
              </div>
              <Badge variant={voiceEnabled ? "success" : "outline"} className="text-xs">
                {voiceEnabled ? "ON" : "OFF"}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              Provides text-to-speech audio playback for all document summaries, quiz explanations, and tutor answers.
            </p>
            <Button
              variant={voiceEnabled ? "primary" : "outline"}
              size="sm"
              onClick={toggleVoice}
            >
              {voiceEnabled ? "Voice Enabled" : "Enable Voice Readout"}
            </Button>
          </Card>

          <Card className="space-y-3.5 p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-sm sm:text-base text-foreground">
                  Plain Language Simplification
                </h3>
              </div>
              <Badge variant={simplifiedLanguage ? "success" : "outline"} className="text-xs">
                {simplifiedLanguage ? "ON" : "OFF"}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              Automatically rewrites complex bureaucratic language into clear, accessible prose.
            </p>
            <Button
              variant={simplifiedLanguage ? "primary" : "outline"}
              size="sm"
              onClick={toggleSimplifiedLanguage}
            >
              {simplifiedLanguage ? "Simplification ON" : "Enable Plain Language"}
            </Button>
          </Card>
        </div>

        {/* Interface Language */}
        <Card className="space-y-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Languages className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-base sm:text-lg text-foreground">
                Interface Language
              </h2>
            </div>
            <Badge variant="primary" className="text-xs font-mono">
              English Only
            </Badge>
          </CardHeader>

          <CardContent className="space-y-3">
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              AccessAI is standardized exclusively on English across all documents, AI chat, screen-reader audio, educational tutoring, and scheme verification.
            </p>

            <div className="p-4 rounded-xl border border-primary/40 bg-card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Languages className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-foreground">
                    English (Standard)
                  </div>
                  <div className="text-xs text-muted">
                    Active System Language · Latin Script
                  </div>
                </div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        {/* Supabase Cloud Preferences Synchronization */}
        <Card className="space-y-3">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-base sm:text-lg text-foreground">
                Cloud Preference Synchronization
              </h2>
            </div>
            <Badge variant={isSignedIn ? "primary" : "outline"}>
              {isSignedIn ? "Supabase Sync Enabled" : "Local Storage"}
            </Badge>
          </CardHeader>

          <CardContent className="space-y-3 text-xs sm:text-sm text-muted">
            <p className="leading-relaxed">
              {isSignedIn ? (
                <>
                  Your accessibility profile and theme settings are backed up to <strong className="text-foreground">Supabase PostgreSQL</strong> and keyed to your Clerk account (<code className="px-1.5 py-0.5 rounded bg-card border border-border text-primary font-mono text-xs">{userId?.slice(0, 16)}...</code>).
                </>
              ) : (
                <>
                  Settings are currently stored in your browser session. Sign in with Clerk to sync font scaling, contrast, and multilingual preferences across all your devices.
                </>
              )}
            </p>

            {isSignedIn && (
              <div className="flex items-center gap-3 pt-1">
                <LoadingButton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSyncPreferences}
                  isLoading={syncStatus === "saving"}
                  loadingText="Syncing to Supabase..."
                  leftIcon={<Cloud className="w-4 h-4 text-primary" />}
                >
                  {syncStatus === "synced"
                    ? "Preferences Synced to DB!"
                    : "Sync Preferences to Supabase"}
                </LoadingButton>
                {syncStatus === "synced" && (
                  <span className="text-emerald-500 font-medium inline-flex items-center gap-1.5 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Successfully updated in PostgreSQL
                  </span>
                )}
                {syncStatus === "error" && (
                  <span className="text-rose-400 font-medium text-xs">
                    Failed to reach database backend. Local settings remain active.
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Keyboard Navigation Shortcuts */}
        <Card className="space-y-3">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Keyboard className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-base sm:text-lg text-foreground">
                Keyboard Navigation Quick Reference
              </h2>
            </div>
            <Badge variant="outline">Accessibility Keymap</Badge>
          </CardHeader>

          <CardContent className="text-xs sm:text-sm text-muted space-y-2.5">
            <div className="grid sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-lg bg-card border border-border flex items-center justify-between">
                <span className="text-foreground">Navigate forward</span>
                <kbd className="px-2.5 py-1 rounded bg-background border border-border font-mono font-bold text-foreground text-xs shadow-sm">
                  Tab
                </kbd>
              </div>
              <div className="p-3 rounded-lg bg-card border border-border flex items-center justify-between">
                <span className="text-foreground">Navigate backward</span>
                <kbd className="px-2.5 py-1 rounded bg-background border border-border font-mono font-bold text-foreground text-xs shadow-sm">
                  Shift + Tab
                </kbd>
              </div>
              <div className="p-3 rounded-lg bg-card border border-border flex items-center justify-between">
                <span className="text-foreground">Activate control / link</span>
                <kbd className="px-2.5 py-1 rounded bg-background border border-border font-mono font-bold text-foreground text-xs shadow-sm">
                  Enter / Space
                </kbd>
              </div>
              <div className="p-3 rounded-lg bg-card border border-border flex items-center justify-between">
                <span className="text-foreground">Dismiss dialog / modal</span>
                <kbd className="px-2.5 py-1 rounded bg-background border border-border font-mono font-bold text-foreground text-xs shadow-sm">
                  Escape
                </kbd>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account & Session Security */}
        <Card className="space-y-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-base sm:text-lg text-foreground">
                Account & Session Security
              </h2>
            </div>
            <Badge variant={isSignedIn ? "success" : "outline"} className="text-xs">
              {isSignedIn ? "Authenticated" : "Guest Mode"}
            </Badge>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              Your session is secured using Clerk authentication with tenant-isolated Supabase Row-Level Security.
            </p>

            {isSignedIn && user && (
              <div className="p-3.5 rounded-xl border border-border bg-card/60 flex items-center justify-between text-xs sm:text-sm">
                <div>
                  <div className="font-semibold text-foreground">
                    {user.fullName || "Citizen User"}
                  </div>
                  <div className="text-xs text-muted font-mono mt-0.5">
                    {user.primaryEmailAddress?.emailAddress || userId}
                  </div>
                </div>
                <Badge variant="outline" className="font-mono text-xs">
                  Active Session
                </Badge>
              </div>
            )}

            <div className="pt-1">
              <Button
                variant="outline"
                size="md"
                onClick={() => signOut({ redirectUrl: "/login" })}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:border-red-500/40"
                leftIcon={<LogOut className="w-4 h-4" />}
              >
                Log Out of AccessAI
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}