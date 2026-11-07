"use client";

import React from "react";
import {
  useAccessibilityStore,
  type SupportedLanguage,
} from "@/stores/accessibilityStore";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  SunMoon,
  Volume2,
  VolumeX,
  Languages,
  BookOpen,
} from "lucide-react";

const LANGUAGES: { code: SupportedLanguage; label: string }[] = [
  { code: "en", label: "English" },
  { code: "te", label: "తెలుగు (Telugu)" },
  { code: "hi", label: "हिन्दी (Hindi)" },
  { code: "ta", label: "தமிழ் (Tamil)" },
  { code: "kn", label: "ಕನ್ನಡ (Kannada)" },
  { code: "ml", label: "മലയാളം (Malayalam)" },
  { code: "bn", label: "বাংলা (Bengali)" },
  { code: "mr", label: "मराठी (Marathi)" },
];

export const AccessibilityToolbar: React.FC = () => {
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
    activeLanguage,
    setLanguage,
  } = useAccessibilityStore();

  return (
    <aside
      aria-label="Accessibility Controls"
      className="bg-card border-b border-border px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-sm"
    >
      <div className="flex items-center gap-2">
        <span className="font-semibold text-xs tracking-wider uppercase opacity-75">
          Accessibility Bar (WCAG 2.2 AA)
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Font Scaling */}
        <div className="flex items-center border border-border rounded-md overflow-hidden bg-background">
          <button
            onClick={decreaseFont}
            className="p-1.5 hover:bg-accent focus-visible:ring-2"
            title="Decrease text size"
            aria-label="Decrease text size"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="px-2 font-mono text-xs font-bold" aria-live="polite">
            {Math.round(fontScale * 100)}%
          </span>
          <button
            onClick={increaseFont}
            className="p-1.5 hover:bg-accent focus-visible:ring-2"
            title="Increase text size"
            aria-label="Increase text size"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={resetFont}
            className="p-1.5 hover:bg-accent border-l border-border focus-visible:ring-2"
            title="Reset text size"
            aria-label="Reset text size"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* High Contrast Toggle */}
        <button
          onClick={toggleHighContrast}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border font-medium text-xs transition-colors focus-visible:ring-2 ${
            highContrast
              ? "bg-yellow-400 text-black border-yellow-500 font-bold"
              : "border-border hover:bg-accent"
          }`}
          aria-pressed={highContrast}
        >
          <SunMoon className="w-4 h-4" />
          <span>{highContrast ? "High Contrast: ON" : "High Contrast"}</span>
        </button>

        {/* Voice Audio Readout */}
        <button
          onClick={toggleVoice}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border font-medium text-xs transition-colors focus-visible:ring-2 ${
            voiceEnabled
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border hover:bg-accent"
          }`}
          aria-pressed={voiceEnabled}
        >
          {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          <span>{voiceEnabled ? "Voice: ON" : "Voice Readout"}</span>
        </button>

        {/* Simplified Language Mode */}
        <button
          onClick={toggleSimplifiedLanguage}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border font-medium text-xs transition-colors focus-visible:ring-2 ${
            simplifiedLanguage
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border hover:bg-accent"
          }`}
          aria-pressed={simplifiedLanguage}
        >
          <BookOpen className="w-4 h-4" />
          <span>{simplifiedLanguage ? "Simplified: ON" : "Plain Language"}</span>
        </button>

        {/* Language Selector */}
        <div className="flex items-center gap-1 border border-border rounded-md px-2 py-1 bg-background">
          <Languages className="w-3.5 h-3.5 opacity-70" />
          <select
            value={activeLanguage}
            onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
            className="bg-transparent text-xs font-medium focus:outline-none"
            aria-label="Select platform language"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </aside>
  );
};
