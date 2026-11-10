import React from "react";

export interface PulseLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "muted" | "accent";
}

export const PulseLoader: React.FC<PulseLoaderProps> = ({
  label = "Processing...",
  size = "md",
  variant = "primary",
  className = "",
  ...props
}) => {
  const dotSizes = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-2.5 h-2.5",
  };

  const dotColors = {
    primary: "bg-primary",
    muted: "bg-muted",
    accent: "bg-foreground",
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-2 ${className}`}
      {...props}
    >
      <div className="flex items-center gap-1.5" aria-hidden="true">
        <span
          className={`${dotSizes[size]} ${dotColors[variant]} rounded-full animate-bounce motion-reduce:animate-none motion-reduce:opacity-75 [animation-delay:-0.3s]`}
        />
        <span
          className={`${dotSizes[size]} ${dotColors[variant]} rounded-full animate-bounce motion-reduce:animate-none motion-reduce:opacity-75 [animation-delay:-0.15s]`}
        />
        <span
          className={`${dotSizes[size]} ${dotColors[variant]} rounded-full animate-bounce motion-reduce:animate-none motion-reduce:opacity-75`}
        />
      </div>
      {label && <span className="text-xs sm:text-sm font-medium text-muted">{label}</span>}
      <span className="sr-only">{label}</span>
    </div>
  );
};

