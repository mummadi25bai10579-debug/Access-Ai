import React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular" | "rounded";
  width?: string | number;
  height?: string | number;
  animate?: "pulse" | "shimmer" | "none";
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = "rounded",
  width,
  height,
  animate = "pulse",
  className = "",
  style,
  ...props
}) => {
  const variantStyles = {
    text: "h-4 rounded",
    circular: "rounded-full",
    rectangular: "rounded-none",
    rounded: "rounded-xl",
  };

  const animationStyles = {
    pulse: "animate-pulse motion-reduce:animate-none",
    shimmer: "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
    none: "",
  };

  const inlineStyles: React.CSSProperties = {
    ...style,
    ...(width !== undefined ? { width } : {}),
    ...(height !== undefined ? { height } : {}),
  };

  return (
    <div
      aria-hidden="true"
      className={`bg-border/60 ${variantStyles[variant]} ${animationStyles[animate]} ${className}`}
      style={inlineStyles}
      {...props}
    />
  );
};

// ============================================================================
// Specialized Domain Skeletons
// ============================================================================

/** Course Card Skeleton matching CourseCard.tsx */
export const CourseCardSkeleton: React.FC<{ count?: number }> = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          aria-hidden="true"
          className="border border-border rounded-xl p-5 sm:p-6 bg-card flex flex-col justify-between space-y-4 animate-pulse"
        >
          <div className="space-y-3.5">
            <div className="flex items-start justify-between gap-2">
              <Skeleton width="5rem" height="1.35rem" />
              <Skeleton width="4.5rem" height="1.35rem" />
            </div>
            <Skeleton width="85%" height="1.5rem" />
            <div className="space-y-2 pt-1">
              <Skeleton width="100%" height="0.9rem" />
              <Skeleton width="92%" height="0.9rem" />
            </div>
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between">
                <Skeleton width="6rem" height="0.8rem" />
                <Skeleton width="2.5rem" height="0.8rem" />
              </div>
              <Skeleton width="100%" height="0.5rem" className="rounded-full" />
            </div>
          </div>
          <div className="pt-3 border-t border-border flex items-center gap-2.5">
            <Skeleton width="50%" height="2.25rem" />
            <Skeleton width="50%" height="2.25rem" />
          </div>
        </div>
      ))}
    </>
  );
};

/** Scheme Card Skeleton matching SchemeCard.tsx */
export const SchemeCardSkeleton: React.FC<{ count?: number }> = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          aria-hidden="true"
          className="border border-border rounded-xl p-5 sm:p-6 bg-card space-y-4 animate-pulse"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2 flex-1">
              <div className="flex gap-2">
                <Skeleton width="6rem" height="1.25rem" />
                <Skeleton width="5rem" height="1.25rem" />
              </div>
              <Skeleton width="80%" height="1.5rem" />
            </div>
            <Skeleton width="5rem" height="2rem" />
          </div>
          <div className="space-y-2">
            <Skeleton width="100%" height="0.9rem" />
            <Skeleton width="95%" height="0.9rem" />
          </div>
          <div className="flex gap-2 pt-2">
            <Skeleton width="7rem" height="1.5rem" />
            <Skeleton width="8rem" height="1.5rem" />
            <Skeleton width="6rem" height="1.5rem" />
          </div>
          <div className="pt-3 border-t border-border flex items-center justify-between">
            <Skeleton width="8rem" height="1rem" />
            <Skeleton width="8rem" height="2.25rem" />
          </div>
        </div>
      ))}
    </>
  );
};

/** Opportunity Card Skeleton matching OpportunityCard.tsx */
export const OpportunityCardSkeleton: React.FC<{ count?: number }> = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          aria-hidden="true"
          className="border border-border rounded-xl p-5 sm:p-6 bg-card space-y-4 animate-pulse flex flex-col justify-between"
        >
          <div className="space-y-3.5">
            <div className="flex items-start justify-between gap-3">
              <Skeleton width="5.5rem" height="1.25rem" />
              <Skeleton width="4.5rem" height="1.75rem" />
            </div>
            <Skeleton width="80%" height="1.4rem" />
            <div className="flex gap-4">
              <Skeleton width="6rem" height="0.9rem" />
              <Skeleton width="5rem" height="0.9rem" />
            </div>
            <div className="space-y-1.5 pt-1">
              <Skeleton width="100%" height="0.85rem" />
              <Skeleton width="90%" height="0.85rem" />
            </div>
            <div className="flex flex-wrap gap-1.5 pt-2">
              <Skeleton width="4rem" height="1.25rem" />
              <Skeleton width="4.5rem" height="1.25rem" />
              <Skeleton width="3.5rem" height="1.25rem" />
            </div>
          </div>
          <div className="pt-3 border-t border-border flex items-center justify-between">
            <Skeleton width="7rem" height="0.9rem" />
            <Skeleton width="7.5rem" height="2.25rem" />
          </div>
        </div>
      ))}
    </>
  );
};

/** Document List Skeleton matching documents/page.tsx */
export const DocumentListSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div aria-hidden="true" className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="border border-border rounded-xl p-4 bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse"
        >
          <div className="flex items-center gap-3.5 flex-1 min-w-0">
            <Skeleton width="2.5rem" height="2.5rem" className="rounded-lg shrink-0" />
            <div className="space-y-1.5 flex-1 min-w-0">
              <Skeleton width="65%" height="1.1rem" />
              <div className="flex gap-3">
                <Skeleton width="4rem" height="0.8rem" />
                <Skeleton width="5rem" height="0.8rem" />
                <Skeleton width="6rem" height="0.8rem" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <Skeleton width="5.5rem" height="1.5rem" />
            <Skeleton width="2rem" height="2rem" className="rounded-lg" />
            <Skeleton width="2rem" height="2rem" className="rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
};

/** Dashboard Skeleton matching dashboard/page.tsx */
export const DashboardSkeleton: React.FC = () => {
  return (
    <div aria-hidden="true" className="space-y-8 animate-pulse">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border border-border rounded-xl p-5 bg-card space-y-3">
            <div className="flex justify-between items-start">
              <Skeleton width="50%" height="0.9rem" />
              <Skeleton width="2rem" height="2rem" className="rounded-lg" />
            </div>
            <Skeleton width="40%" height="1.8rem" />
            <Skeleton width="70%" height="0.8rem" />
          </div>
        ))}
      </div>

      {/* 4 Module Cards */}
      <div className="space-y-4">
        <Skeleton width="12rem" height="1.5rem" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border border-border rounded-xl p-6 bg-card space-y-4">
              <Skeleton width="3rem" height="3rem" className="rounded-xl" />
              <Skeleton width="75%" height="1.3rem" />
              <Skeleton width="100%" height="2.5rem" />
              <Skeleton width="100%" height="2rem" />
            </div>
          ))}
        </div>
      </div>

      {/* Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 border border-border rounded-xl p-6 bg-card space-y-4">
          <Skeleton width="10rem" height="1.3rem" />
          <div className="space-y-3 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between py-2 border-b border-border/50">
                <Skeleton width="60%" height="1rem" />
                <Skeleton width="20%" height="1rem" />
              </div>
            ))}
          </div>
        </div>
        <div className="border border-border rounded-xl p-6 bg-card space-y-4">
          <Skeleton width="8rem" height="1.3rem" />
          <div className="space-y-3 pt-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton width="90%" height="1rem" />
                <Skeleton width="50%" height="0.8rem" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/** Profile Skeleton */
export const ProfileSkeleton: React.FC = () => {
  return (
    <div aria-hidden="true" className="space-y-6 max-w-4xl mx-auto animate-pulse">
      <div className="border border-border rounded-xl p-6 bg-card flex items-center gap-5">
        <Skeleton width="4.5rem" height="4.5rem" variant="circular" />
        <div className="space-y-2 flex-1">
          <Skeleton width="40%" height="1.4rem" />
          <Skeleton width="30%" height="0.9rem" />
        </div>
      </div>
      <div className="border border-border rounded-xl p-6 bg-card space-y-4">
        <Skeleton width="30%" height="1.2rem" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-2">
            <Skeleton width="25%" height="0.8rem" />
            <Skeleton width="100%" height="2.5rem" />
          </div>
          <div className="space-y-2">
            <Skeleton width="25%" height="0.8rem" />
            <Skeleton width="100%" height="2.5rem" />
          </div>
        </div>
      </div>
    </div>
  );
};

/** Table Skeleton */
export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 4,
}) => {
  return (
    <div aria-hidden="true" className="w-full border border-border rounded-xl overflow-hidden animate-pulse">
      <div className="bg-muted/10 p-4 border-b border-border flex gap-4">
        {Array.from({ length: cols }).map((_, j) => (
          <Skeleton key={j} width={`${100 / cols}%`} height="1.1rem" />
        ))}
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex gap-4 bg-card">
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton key={j} width={`${100 / cols}%`} height="0.9rem" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

/** List Skeleton */
export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <div aria-hidden="true" className="space-y-2.5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-3.5 border border-border rounded-lg bg-card flex items-center justify-between gap-4 animate-pulse">
          <div className="space-y-1.5 flex-1">
            <Skeleton width="60%" height="1rem" />
            <Skeleton width="35%" height="0.8rem" />
          </div>
          <Skeleton width="4rem" height="1.5rem" />
        </div>
      ))}
    </div>
  );
};

