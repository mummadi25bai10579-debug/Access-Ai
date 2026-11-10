"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type SupportedLanguage = "en";

export type ThemeMode = 'dark' | 'light';

interface AccessibilityState {
  theme: ThemeMode;
  fontScale: number;
  highContrast: boolean;
  voiceEnabled: boolean;
  simplifiedLanguage: boolean;
  activeLanguage: SupportedLanguage;
  
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  increaseFont: () => void;
  decreaseFont: () => void;
  resetFont: () => void;
  toggleHighContrast: () => void;
  setHighContrast: (enabled: boolean) => void;
  toggleVoice: () => void;
  toggleSimplifiedLanguage: () => void;
  setLanguage: (lang: SupportedLanguage) => void;
  speakText: (text: string) => void;
  applyDomSettings: () => void;
}

export const useAccessibilityStore = create<AccessibilityState>()(
  persist(
    (set, get) => ({
      theme: "dark",
      fontScale: 1.0,
      highContrast: false,
      voiceEnabled: false,
      simplifiedLanguage: false,
      activeLanguage: "en",

      applyDomSettings: () => {
        if (typeof document !== "undefined") {
          const { fontScale, highContrast, theme } = get();
          document.documentElement.style.setProperty("--font-scale", fontScale.toString());
          
          // Theme classes
          if (theme === "dark") {
            document.documentElement.classList.add("dark");
            document.documentElement.classList.remove("light");
          } else {
            document.documentElement.classList.add("light");
            document.documentElement.classList.remove("dark");
          }

          // Independent high-contrast mode class
          if (highContrast) {
            document.documentElement.classList.add("high-contrast");
          } else {
            document.documentElement.classList.remove("high-contrast");
          }
        }
      },

      setTheme: (theme: ThemeMode) => {
        set({ theme });
        if (typeof document !== "undefined") {
          if (theme === "dark") {
            document.documentElement.classList.add("dark");
            document.documentElement.classList.remove("light");
          } else {
            document.documentElement.classList.add("light");
            document.documentElement.classList.remove("dark");
          }
        }
      },

      toggleTheme: () => {
        const nextTheme = get().theme === "dark" ? "light" : "dark";
        get().setTheme(nextTheme);
      },

      increaseFont: () => {
        set((state) => {
          const next = Math.min(2.0, Math.round((state.fontScale + 0.1) * 10) / 10);
          if (typeof document !== "undefined") {
            document.documentElement.style.setProperty("--font-scale", next.toString());
          }
          return { fontScale: next };
        });
      },

      decreaseFont: () => {
        set((state) => {
          const next = Math.max(0.8, Math.round((state.fontScale - 0.1) * 10) / 10);
          if (typeof document !== "undefined") {
            document.documentElement.style.setProperty("--font-scale", next.toString());
          }
          return { fontScale: next };
        });
      },

      resetFont: () => {
        if (typeof document !== "undefined") {
          document.documentElement.style.setProperty("--font-scale", "1.0");
        }
        set({ fontScale: 1.0 });
      },

      toggleHighContrast: () => {
        set((state) => {
          const next = !state.highContrast;
          if (typeof document !== "undefined") {
            if (next) {
              document.documentElement.classList.add("high-contrast");
            } else {
              document.documentElement.classList.remove("high-contrast");
            }
          }
          return { highContrast: next };
        });
      },

      setHighContrast: (enabled: boolean) => {
        if (typeof document !== "undefined") {
          if (enabled) {
            document.documentElement.classList.add("high-contrast");
          } else {
            document.documentElement.classList.remove("high-contrast");
          }
        }
        set({ highContrast: enabled });
      },

      toggleVoice: () => set((state) => ({ voiceEnabled: !state.voiceEnabled })),

      toggleSimplifiedLanguage: () =>
        set((state) => ({ simplifiedLanguage: !state.simplifiedLanguage })),

      setLanguage: (_lang: SupportedLanguage) => set({ activeLanguage: "en" }),

      speakText: (text: string) => {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = "en-US";
          window.speechSynthesis.speak(utterance);
        }
      },
    }),
    {
      name: "accessai_accessibility_prefs",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: any) => {
        if (persistedState) {
          persistedState.activeLanguage = "en";
        }
        return persistedState;
      },
    }
  )
);
