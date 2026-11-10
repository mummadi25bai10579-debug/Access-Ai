import React from "react";
import { Loader2, Sparkles } from "lucide-react";

export interface FullScreenLoaderProps {
  label?: string;
  subLabel?: string;
}

export const FullScreenLoader: React.FC<FullScreenLoaderProps> = ({
  label = "Initializing AccessAI...",
  subLabel = "Synchronizing accessible resources and multi-tenant context",
}) => {
  return (
    <div
      role="status"
      aria-live="assertive"
      aria-busy="true"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/90 backdrop-blur-md p-6 text-center animate-[fadeIn_0.2s_ease-out]"
    >
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_25px_rgba(37,99,235,0.2)]">
          <Sparkles className="w-8 h-8 animate-pulse text-primary" aria-hidden="true" />
        </div>
        <div className="absolute -bottom-1 -right-1 p-1 bg-background rounded-full border border-border">
          <Loader2 className="w-5 h-5 animate-spin text-primary" aria-hidden="true" />
        </div>
      </div>

      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mb-1.5">
        AccessAI
      </h1>
      <p className="text-sm font-medium text-foreground mb-1">{label}</p>
      {subLabel && <p className="text-xs text-muted max-w-sm">{subLabel}</p>}
      <span className="sr-only">{label}</span>
    </div>
  );
};

