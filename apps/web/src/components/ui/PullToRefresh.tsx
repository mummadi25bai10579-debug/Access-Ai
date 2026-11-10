import React, { useState, useRef, useEffect, useCallback } from "react";
import { ArrowDown, Loader2, RefreshCw } from "lucide-react";

export interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<any> | void;
  className?: string;
  pullThreshold?: number;
  showDesktopTrigger?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  className = "",
  pullThreshold = 75,
  showDesktopTrigger = true,
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const isPulling = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setPullDistance(pullThreshold);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
    }
  }, [isRefreshing, onRefresh, pullThreshold]);

  const handleTouchStart = (e: React.TouchEvent) => {
    // Only allow pull-to-refresh when at the top of the viewport/container
    const scrollTop = window.scrollY || document.documentElement.scrollTop || containerRef.current?.scrollTop || 0;
    if (scrollTop <= 2 && !isRefreshing) {
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling.current || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    if (diff > 0) {
      // Damped resistance curve
      const resistanceDistance = Math.min(diff * 0.45, pullThreshold * 1.5);
      setPullDistance(resistanceDistance);
    } else {
      isPulling.current = false;
      setPullDistance(0);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling.current || isRefreshing) return;
    isPulling.current = false;

    if (pullDistance >= pullThreshold) {
      await handleRefresh();
    } else {
      setPullDistance(0);
    }
  };

  const progressPercent = Math.min(Math.round((pullDistance / pullThreshold) * 100), 100);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`relative ${className}`}
    >
      {/* Pull indicator for touch screens */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 right-0 top-0 flex items-center justify-center overflow-hidden transition-all duration-200 z-30"
        style={{
          height: `${pullDistance}px`,
          opacity: pullDistance > 10 ? 1 : 0,
        }}
      >
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 shadow-md">
          {isRefreshing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-xs font-medium text-foreground">Refreshing...</span>
            </>
          ) : (
            <>
              <ArrowDown
                className="w-4 h-4 text-primary transition-transform duration-200"
                style={{ transform: `rotate(${Math.min(progressPercent * 1.8, 180)}deg)` }}
              />
              <span className="text-xs font-medium text-muted">
                {pullDistance >= pullThreshold ? "Release to refresh" : "Pull down to refresh"}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Accessible desktop / keyboard refresh trigger */}
      {showDesktopTrigger && (
        <div className="hidden sm:flex justify-end mb-3">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-label="Refresh content"
            className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground font-medium px-2.5 py-1 rounded-md border border-border/60 hover:bg-muted/10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`}
              aria-hidden="true"
            />
            <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      )}

      {/* Screen reader notification */}
      <div role="status" aria-live="polite" className="sr-only">
        {isRefreshing ? "Refreshing page content..." : ""}
      </div>

      {children}
    </div>
  );
};

