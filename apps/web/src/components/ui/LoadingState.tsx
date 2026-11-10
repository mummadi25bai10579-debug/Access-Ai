import React from "react";
import { Loader2 } from "lucide-react";
import { Skeleton } from "./Skeleton";

interface LoadingStateProps {
  label?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  label = "Loading AccessAI resources...",
  className = "",
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center p-12 text-center text-muted ${className}`}
    >
      <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" aria-hidden="true" />
      <span className="text-sm font-medium text-muted">{label}</span>
      <span className="sr-only">{label}</span>
    </div>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="border border-border rounded-xl p-5 bg-card space-y-3">
      <Skeleton width="33%" height="1rem" />
      <Skeleton width="66%" height="1.5rem" />
      <Skeleton width="100%" height="1rem" />
    </div>
  );
};
