"use client";

import React from "react";
import { useAccessibilityStore } from "@/stores/accessibilityStore";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sun,
  Moon,
  SunMoon,
  Volume2,
  VolumeX,
  Languages,
  BookOpen,
} from "lucide-react";

export const AccessibilityToolbar: React.FC = () => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const store = useAccessibilityStore();
  const theme = mounted ? store.theme : "dark";
  const fontScale = mounted ? store.fontScale : 1.0;
  const highContrast = mounted ? store.highContrast : false;
  const voiceEnabled = mounted ? store.voiceEnabled : false;
  const simplifiedLanguage = mounted ? store.simplifiedLanguage : false;

  const {
    toggleTheme,
    increaseFont,
    decreaseFont,
    resetFont,
    toggleHighContrast,
    toggleVoice,
    toggleSimplifiedLanguage,
  } = store;

  return (
    <aside
      aria-label="Accessibility Controls"
      className="bg-card border-b border-border px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm"
    >
      <div className="flex items-center gap-2">
        <span className="font-semibold text-xs tracking-wider uppercase text-muted">
          Accessibility Bar (Target: WCAG 2.2 AA)
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Font Scaling Controls */}
        <div className="flex items-center border border-border rounded-lg overflow-hidden bg-card">
          <button
            onClick={decreaseFont}
            className="p-1.5 sm:p-2 hover:bg-accent text-foreground focus-visible:ring-2 focus-visible:ring-primary"
            title="Decrease text size (-10%)"
            aria-label="Decrease text size"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="px-2.5 font-mono text-xs font-bold text-foreground" aria-live="polite">
            {Math.round(fontScale * 100)}%
          </span>
          <button
            onClick={increaseFont}
            className="p-1.5 sm:p-2 hover:bg-accent text-foreground focus-visible:ring-2 focus-visible:ring-primary"
            title="Increase text size (+10%)"
            aria-label="Increase text size"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={resetFont}
            className="p-1.5 sm:p-2 hover:bg-accent border-l border-border text-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
            title="Reset text size to 100%"
            aria-label="Reset text size"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 1. Theme Switcher: Pure Black Dark vs Light */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-foreground hover:bg-accent hover:border-primary/50 text-xs sm:text-sm font-medium transition-all focus-visible:ring-2 focus-visible:ring-primary"
          title={theme === "dark" ? "Switch to Light Theme" : "Switch to Pure Black Dark Theme"}
          aria-label={`Toggle theme (currently ${theme})`}
        >
          {theme === "dark" ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Pure Black</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-primary" />
              <span>Light Mode</span>
            </>
          )}
        </button>

        {/* 2. Independent High Contrast Mode (WCAG AAA) */}
        <button
          onClick={toggleHighContrast}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-semibold transition-all focus-visible:ring-2 focus-visible:ring-primary ${
            highContrast
              ? "bg-yellow-400 text-black border-yellow-400 font-bold shadow-[0_0_10px_rgba(255,255,0,0.5)]"
              : "bg-card text-foreground border-border hover:bg-accent hover:border-primary/50"
          }`}
          aria-pressed={highContrast}
          title={highContrast ? "Disable High Contrast mode" : "Enable High Contrast mode (Yellow/Black)"}
        >
          <SunMoon className="w-4 h-4" />
          <span>{highContrast ? "Contrast: High (AAA)" : "High Contrast"}</span>
        </button>

        {/* 3. Voice Audio Toggle */}
        <button
          onClick={toggleVoice}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-medium transition-all focus-visible:ring-2 focus-visible:ring-primary ${
            voiceEnabled
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-muted hover:text-foreground border-border hover:bg-accent"
          }`}
          aria-pressed={voiceEnabled}
          title="Toggle text-to-speech audio narration"
        >
          {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          <span className="hidden sm:inline">Voice {voiceEnabled ? "On" : "Off"}</span>
        </button>

        {/* 4. Plain Language Simplification */}
        <button
          onClick={toggleSimplifiedLanguage}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-medium transition-all focus-visible:ring-2 focus-visible:ring-primary ${
            simplifiedLanguage
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-muted hover:text-foreground border-border hover:bg-accent"
          }`}
          aria-pressed={simplifiedLanguage}
          title="Toggle 6th-grade plain language simplification"
        >
          <BookOpen className="w-4 h-4" />
          <span className="hidden md:inline">Plain Language</span>
        </button>

        {/* 5. Language Indicator */}
        <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-2.5 py-1 text-xs sm:text-sm font-medium text-foreground">
          <Languages className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
          <span>English</span>
        </div>
      </div>
    </aside>
  );
};
