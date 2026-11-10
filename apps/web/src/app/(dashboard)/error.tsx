"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard Module Error:", error.message);
  }, [error]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="p-8 border border-red-500/30 rounded-2xl bg-card text-center my-8 max-w-xl mx-auto shadow-sm"
    >
      <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-6 h-6" aria-hidden="true" />
      </div>
      <h2 className="text-lg font-bold mb-2">Module Unavailable</h2>
      <p className="text-muted text-sm mb-6">
        Unable to load the requested module view. Your profile and other services remain secure and operational.
      </p>
      <button
        onClick={() => reset()}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-primary hover:bg-primary-hover text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        <RefreshCw className="w-4 h-4" aria-hidden="true" />
        Reload Section
      </button>
    </div>
  );
}

