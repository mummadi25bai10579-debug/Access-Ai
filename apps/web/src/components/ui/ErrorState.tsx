import React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "./Button";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "An Error Occurred",
  message,
  onRetry,
  className = "",
}) => {
  return (
    <div
      role="alert"
      className={`p-6 border border-rose-600/50 dark:border-rose-800/80 bg-card rounded-xl text-rose-600 dark:text-rose-300 space-y-3 ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <AlertCircle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0" aria-hidden="true" />
        <h3 className="font-bold text-base text-foreground">{title}</h3>
      </div>
      <p className="text-sm text-muted leading-relaxed">{message}</p>
      {onRetry && (
        <div className="pt-1">
          <Button
            variant="danger"
            size="sm"
            onClick={onRetry}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Retry Request
          </Button>
        </div>
      )}
    </div>
  );
};
