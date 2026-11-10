import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "default" | "elevated" | "interactive";
}

export const Card: React.FC<CardProps> = ({
  variant = "default",
  className = "",
  children,
  ...props
}) => {
  const variantStyles = {
    default: "bg-card text-card-foreground border border-border rounded-xl p-5 sm:p-6 shadow-sm",
    elevated: "bg-card text-card-foreground border border-border rounded-xl p-5 sm:p-6 shadow-md",
    interactive:
      "bg-card text-card-foreground border border-border rounded-xl p-5 sm:p-6 shadow-sm hover:border-primary/60 hover:shadow-[0_0_15px_rgba(37,99,235,0.12)] transition-all cursor-pointer",
  };

  return (
    <div className={`${variantStyles[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = "",
  children,
  ...props
}) => (
  <div className={`flex items-center justify-between pb-4 border-b border-border ${className}`} {...props}>
    {children}
  </div>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = "",
  children,
  ...props
}) => <div className={`pt-4 ${className}`} {...props}>{children}</div>;

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = "",
  children,
  ...props
}) => (
  <div className={`mt-4 pt-4 border-t border-border flex items-center justify-between ${className}`} {...props}>
    {children}
  </div>
);
