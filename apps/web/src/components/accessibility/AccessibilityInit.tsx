"use client";

import { useEffect } from "react";
import { useAccessibilityStore } from "@/stores/accessibilityStore";

export const AccessibilityInit: React.FC = () => {
  const applyDomSettings = useAccessibilityStore((state) => state.applyDomSettings);

  useEffect(() => {
    applyDomSettings();
  }, [applyDomSettings]);

  return null;
};

