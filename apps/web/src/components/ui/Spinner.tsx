import React from "react";
import { Loader2 } from "lucide-react";

export type SpinnerSize = "xs" | "sm" | "md" | "lg" | "xl";
export type SpinnerColor = "primary" | "white" | "muted" | "accent";

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: SpinnerSize;
  color?: SpinnerColor;
  label?: string;
  showLabel?: boolean;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = "md",
  color = "primary",
  label = "Loading...",
  showLabel = false,
  className = "",
  ...props
}) => {
  const sizeMap: Record<SpinnerSize, string> = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-10 h-10",
    xl: "w-14 h-14",
  };

  const colorMap: Record<SpinnerColor, string> = {
    primary: "text-primary",
    white: "text-white",
    muted: "text-muted",
    accent: "text-foreground",
  };

  const textGapMap: Record<SpinnerSize, string> = {
    xs: "gap-1.5 text-xs",
    sm: "gap-2 text-xs",
    md: "gap-2.5 text-sm",
    lg: "gap-3 text-base",
    xl: "gap-3.5 text-lg",
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`inline-flex items-center justify-center ${showLabel ? textGapMap[size] : ""} ${className}`}
      {...props}
    >
      <Loader2
        className={`${sizeMap[size]} ${colorMap[color]} animate-spin motion-reduce:animate-none motion-reduce:opacity-75 shrink-0`}
        aria-hidden="true"
      />
      {showLabel ? (
        <span className="font-medium text-foreground">{label}</span>
      ) : (
        <span className="sr-only">{label}</span>
      )}
    </div>
  );
};

