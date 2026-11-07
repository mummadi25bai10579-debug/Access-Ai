"use client";

import React from "react";
import { Settings, Eye, Volume2, BookOpen, SunMoon, Shield } from "lucide-react";
import { useAccessibilityStore } from "@/stores/accessibilityStore";

export default function SettingsPage() {
  const {
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
  } = useAccessibilityStore();

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-extrabold tracking-tight">
            Accessibility & Display Settings
          </h1>
        </div>
        <p className="text-sm opacity-80 mt-1">
          Customize your sensory, visual, and cognitive preferences across all 4 platform modules.
        </p>
      </div>

      <div className="space-y-4">
        {/* Font Scaling Card */}
        <div className="p-5 rounded-xl border border-border bg-card flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              <span>Dynamic Font Scaling (WCAG 2.2 AA)</span>
            </h3>
            <p className="text-xs opacity-75">
              Enlarge text up to 200% without breaking layouts or losing interactive controls.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={decreaseFont}
              className="px-3 py-1.5 rounded border border-border hover:bg-accent text-xs font-bold"
            >
              -10%
            </button>
            <span className="font-mono text-sm font-extrabold px-2">
              {Math.round(fontScale * 100)}%
            </span>
            <button
              onClick={increaseFont}
              className="px-3 py-1.5 rounded border border-border hover:bg-accent text-xs font-bold"
            >
              +10%
            </button>
            <button
              onClick={resetFont}
              className="px-3 py-1.5 rounded bg-accent hover:bg-border text-xs font-semibold"
            >
              Reset
            </button>
          </div>
        </div>

        {/* High Contrast Mode */}
        <div className="p-5 rounded-xl border border-border bg-card flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <SunMoon className="w-4 h-4 text-primary" />
              <span>High Contrast Theme (Black & Yellow)</span>
            </h3>
            <p className="text-xs opacity-75">
              Increases color contrast above 7:1 for low-vision and sunlight readability.
            </p>
          </div>
          <button
            onClick={toggleHighContrast}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              highContrast
                ? "bg-yellow-400 text-black border-2 border-black"
                : "bg-accent border border-border hover:bg-card"
            }`}
          >
            {highContrast ? "Enabled" : "Disabled"}
          </button>
        </div>

        {/* Voice Assistance */}
        <div className="p-5 rounded-xl border border-border bg-card flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-primary" />
              <span>Automatic Speech Synthesis (TTS)</span>
            </h3>
            <p className="text-xs opacity-75">
              Reads explanations, quiz questions, and document answers aloud in your chosen language.
            </p>
          </div>
          <button
            onClick={toggleVoice}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              voiceEnabled
                ? "bg-primary text-primary-foreground"
                : "bg-accent border border-border hover:bg-card"
            }`}
          >
            {voiceEnabled ? "Enabled" : "Disabled"}
          </button>
        </div>

        {/* Plain Language Mode */}
        <div className="p-5 rounded-xl border border-border bg-card flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <span>Plain Language Mode (Cognitive Accessibility)</span>
            </h3>
            <p className="text-xs opacity-75">
              Rewrites legal, educational, and official government text into simple language.
            </p>
          </div>
          <button
            onClick={toggleSimplifiedLanguage}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              simplifiedLanguage
                ? "bg-primary text-primary-foreground"
                : "bg-accent border border-border hover:bg-card"
            }`}
          >
            {simplifiedLanguage ? "Enabled" : "Disabled"}
          </button>
        </div>
      </div>
    </div>
  );
}
