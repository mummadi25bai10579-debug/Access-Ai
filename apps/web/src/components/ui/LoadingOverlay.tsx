import React from "react";
import { Loader2 } from "lucide-react";

export interface LoadingOverlayProps {
  isLoading: boolean;
  label?: string;
  className?: string;
  children: React.ReactNode;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  label = "Processing...",
  className = "",
  children,
}) => {
  return (
    <div className={`relative ${className}`}>
      {children}
      {isLoading && (
        <div
          role="status"
          aria-live="polite"
          aria-busy="true"
          className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-inherit bg-background/70 backdrop-blur-[2px] transition-all"
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border shadow-lg">
            <Loader2 className="w-5 h-5 animate-spin text-primary" aria-hidden="true" />
            <span className="text-sm font-medium text-foreground">{label}</span>
          </div>
          <span className="sr-only">{label}</span>
        </div>
      )}
    </div>
  );
};

