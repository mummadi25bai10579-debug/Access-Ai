import React, { useEffect, useRef, useCallback } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface InfiniteScrollProps {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => Promise<any> | void;
  error?: string | null;
  onRetry?: () => void;
  endMessage?: string;
  rootMargin?: string;
  enableManualMode?: boolean; // When true, uses an accessible 'Load More' button instead of automatic trigger
  children?: React.ReactNode;
}

export const InfiniteScroll: React.FC<InfiniteScrollProps> = ({
  hasMore,
  isLoading,
  onLoadMore,
  error,
  onRetry,
  endMessage = "You have viewed all available items.",
  rootMargin = "250px",
  enableManualMode = false,
  children,
}) => {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingLock = useRef(false);

  const handleLoadMore = useCallback(async () => {
    if (loadingLock.current || isLoading || !hasMore || Boolean(error)) return;
    loadingLock.current = true;
    try {
      await onLoadMore();
    } finally {
      loadingLock.current = false;
    }
  }, [hasMore, isLoading, onLoadMore, error]);

  useEffect(() => {
    if (enableManualMode || !hasMore || isLoading || Boolean(error)) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting) {
          handleLoadMore();
        }
      },
      {
        root: null,
        rootMargin,
        threshold: 0.1,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoading, error, handleLoadMore, rootMargin, enableManualMode]);

  return (
    <div className="w-full">
      {children}

      <div className="py-6 flex flex-col items-center justify-center text-center">
        {/* Error state with retry */}
        {error && (
          <div
            role="alert"
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-danger/30 bg-card max-w-md w-full"
          >
            <p className="text-xs sm:text-sm text-danger font-medium">{error}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={onRetry || handleLoadMore}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Retry Loading More
            </Button>
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && !error && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-2 text-sm text-muted py-2"
          >
            <Loader2 className="w-4 h-4 animate-spin text-primary" aria-hidden="true" />
            <span>Loading more resources...</span>
            <span className="sr-only">Loading next page of items</span>
          </div>
        )}

        {/* Manual fallback button for accessibility / keyboard users */}
        {hasMore && !isLoading && !error && enableManualMode && (
          <Button
            size="sm"
            variant="secondary"
            onClick={handleLoadMore}
            className="w-full sm:w-auto px-6"
          >
            Load More Results
          </Button>
        )}

        {/* End of results message */}
        {!hasMore && !isLoading && !error && (
          <p className="text-xs sm:text-sm text-muted/70 italic py-2">
            {endMessage}
          </p>
        )}

        {/* Invisible intersection sentinel */}
        {!enableManualMode && hasMore && !error && (
          <div ref={sentinelRef} className="h-4 w-full pointer-events-none" aria-hidden="true" />
        )}
      </div>
    </div>
  );
};

