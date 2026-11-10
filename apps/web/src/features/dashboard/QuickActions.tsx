import React from "react";
import Link from "next/link";
import {
  Upload,
  Search,
  BookOpen,
  FileCheck,
  Briefcase,
  ArrowRight,
} from "lucide-react";

export const QuickActions: React.FC = () => {
  const actions = [
    {
      label: "Upload & Understand Document",
      description: "Ingest circular, marksheet or PDF for plain language breakdown",
      href: "/access",
      icon: Upload,
    },
    {
      label: "Check Scheme Eligibility",
      description: "Preview criteria for PM-KISAN, Vidya Deevena & AICTE",
      href: "/schemes",
      icon: FileCheck,
    },
    {
      label: "Ask EduBridge AI Tutor",
      description: "Resume Python & Problem Solving curriculum lesson",
      href: "/education",
      icon: BookOpen,
    },
    {
      label: "Discover Matched Jobs",
      description: "Review opportunities matching your technical skills",
      href: "/opportunities",
      icon: Briefcase,
    },
  ];

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-bold text-foreground">Quick Action Shortcuts</h2>
        <span className="text-xs sm:text-sm text-muted">Direct workflow entry points</span>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <Link
              key={act.label}
              href={act.href}
              className="p-4 sm:p-5 rounded-xl border border-border bg-card hover:border-primary/60 hover:shadow-[0_0_15px_rgba(37,99,235,0.12)] transition-all flex flex-col justify-between group focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div className="space-y-2.5">
                <div className="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center text-primary group-hover:border-primary/60 transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors">
                    {act.label}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted mt-1 leading-relaxed">
                    {act.description}
                  </p>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-border flex items-center justify-end text-xs font-semibold text-primary group-hover:translate-x-1 transition-transform">
                <span className="inline-flex items-center gap-1">
                  Start <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
