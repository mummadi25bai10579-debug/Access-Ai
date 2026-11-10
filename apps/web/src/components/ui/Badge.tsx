import React from "react";

export type BadgeVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "outline"
  | "accent";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = "default",
  className = "",
  children,
  ...props
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    default: "bg-card text-foreground border border-border",
    primary: "bg-primary text-primary-foreground font-semibold shadow-sm",
    success: "bg-card text-emerald-600 border border-emerald-600/50 dark:text-emerald-400 dark:border-emerald-800/80 font-semibold",
    warning: "bg-card text-amber-600 border border-amber-600/50 dark:text-amber-300 dark:border-amber-800/80 font-semibold",
    danger: "bg-card text-rose-600 border border-rose-600/50 dark:text-rose-400 dark:border-rose-800/80 font-semibold",
    outline: "bg-card text-foreground border border-border font-medium",
    accent: "bg-card text-sky-600 border border-sky-600/50 dark:text-sky-300 dark:border-sky-800/80 font-semibold",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs transition-colors ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
