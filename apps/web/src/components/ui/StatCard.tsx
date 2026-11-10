import React from "react";
import { Card } from "./Card";

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtitle,
  icon,
  trend,
}) => {
  return (
    <Card className="p-5 sm:p-6 flex flex-col justify-between hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted">
          {label}
        </span>
        <div className="p-2.5 rounded-lg bg-card border border-border text-primary shrink-0">
          {icon}
        </div>
      </div>

      <div className="mt-3">
        <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          {value}
        </div>
        {(subtitle || trend) && (
          <div className="mt-1.5 flex items-center gap-1.5 text-xs sm:text-sm text-muted flex-wrap">
            {trend && (
              <span
                className={`font-semibold ${
                  trend.isPositive ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"
                }`}
              >
                {trend.value}
              </span>
            )}
            {subtitle && <span>{subtitle}</span>}
          </div>
        )}
      </div>
    </Card>
  );
};
