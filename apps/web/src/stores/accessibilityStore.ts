"use client";

import { create } from "zustand";

export type SupportedLanguage = 
  | 'en' | 'te' | 'hi' | 'ta' | 'kn' | 'ml' | 'bn' | 'mr' | 'gu' | 'pa' | 'or';

interface AccessibilityState {
  fontScale: number;
  highContrast: boolean;
  voiceEnabled: boolean;
  simplifiedLanguage: boolean;
  activeLanguage: SupportedLanguage;
  
  increaseFont: () => void;
  decreaseFont: () => void;
  resetFont: () => void;
  toggleHighContrast: () => void;
  toggleVoice: () => void;
  toggleSimplifiedLanguage: () => void;
  setLanguage: (lang: SupportedLanguage) => void;
  speakText: (text: string) => void;
}

export const useAccessibilityStore = create<AccessibilityState>((set, get) => ({
  fontScale: 1.0,
  highContrast: false,
  voiceEnabled: false,
  simplifiedLanguage: false,
  activeLanguage: "en",

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

  toggleVoice: () => set((state) => ({ voiceEnabled: !state.voiceEnabled })),

  toggleSimplifiedLanguage: () =>
    set((state) => ({ simplifiedLanguage: !state.simplifiedLanguage })),

  setLanguage: (lang: SupportedLanguage) => set({ activeLanguage: lang }),

  speakText: (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const currentLang = get().activeLanguage;
      utterance.lang = currentLang === "te" ? "te-IN" : currentLang === "hi" ? "hi-IN" : "en-IN";
      window.speechSynthesis.speak(utterance);
    }
  },
}));
