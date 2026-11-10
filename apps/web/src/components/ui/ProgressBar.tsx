import React from "react";

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number; // 0 to 100. If undefined or null, renders as indeterminate.
  max?: number;
  label?: string;
  subLabel?: string;
  showPercentage?: boolean;
  variant?: "primary" | "success" | "warning";
  size?: "sm" | "md" | "lg";
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  subLabel,
  showPercentage = true,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) => {
  const isIndeterminate = value === undefined || value === null;
  const clampedValue = isIndeterminate ? 0 : Math.min(Math.max(0, value), max);
  const percentage = Math.round((clampedValue / max) * 100);

  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  const variantColors = {
    primary: "bg-primary",
    success: "bg-success",
    warning: "bg-warning",
  };

  return (
    <div className={`w-full space-y-1.5 ${className}`} {...props}>
      {(label || (showPercentage && !isIndeterminate) || subLabel) && (
        <div className="flex items-center justify-between text-xs sm:text-sm font-medium">
          <div className="flex items-center gap-2 truncate">
            {label && <span className="text-foreground truncate">{label}</span>}
            {subLabel && <span className="text-muted text-xs truncate">({subLabel})</span>}
          </div>
          {!isIndeterminate && showPercentage && (
            <span className="text-muted font-mono shrink-0 ml-2">{percentage}%</span>
          )}
        </div>
      )}

      <div
        role="progressbar"
        aria-valuenow={isIndeterminate ? undefined : percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || (isIndeterminate ? "Progress indeterminate" : `Progress ${percentage}%`)}
        className={`w-full overflow-hidden rounded-full bg-border/80 ${sizeClasses[size]}`}
      >
        {isIndeterminate ? (
          <div
            className={`h-full w-2/5 ${variantColors[variant]} rounded-full animate-[indeterminate_1.5s_infinite_linear] motion-reduce:w-full motion-reduce:opacity-60`}
            style={{
              animation: "indeterminate 1.5s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite",
            }}
          />
        ) : (
          <div
            className={`h-full ${variantColors[variant]} rounded-full transition-all duration-300 ease-out`}
            style={{ width: `${percentage}%` }}
          />
        )}
      </div>
    </div>
  );
};

