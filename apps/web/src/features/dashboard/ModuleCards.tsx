import React from "react";
import Link from "next/link";
import {
  FileSearch,
  GraduationCap,
  Landmark,
  Briefcase,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface ModuleCardItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
  stat: string;
  statLabel: string;
}

const MODULES: ModuleCardItem[] = [
  {
    id: "access",
    title: "AccessAI Assistant",
    subtitle: "Universal Intelligence",
    description: "Multimodal document understanding, optical character recognition (OCR), plain language simplification, and grounded multilingual Q&A.",
    href: "/access",
    icon: FileSearch,
    badge: "Shared Intelligence",
    stat: "3 Ingested",
    statLabel: "Documents indexed",
  },
  {
    id: "education",
    title: "EduBridge",
    subtitle: "Contextual Tutoring",
    description: "Personalized AI tutor adapting explanations to your difficulty level, generating formative quizzes, and closing foundational knowledge gaps.",
    href: "/education",
    icon: GraduationCap,
    badge: "Active Learning",
    stat: "55% Complete",
    statLabel: "Python programming",
  },
  {
    id: "schemes",
    title: "SchemeConnect",
    subtitle: "Public Services & Welfare",
    description: "Deterministic eligibility assessments for Central and State government welfare schemes using structured eligibility rule tables.",
    href: "/schemes",
    icon: Landmark,
    badge: "Rule-Based Preview",
    stat: "2 Eligible",
    statLabel: "Schemes previewed",
  },
  {
    id: "opportunities",
    title: "OpportunityBridge",
    subtitle: "Career & Matching",
    description: "Multi-factor matching formula (S = w₁E + w₂R + w₃P + w₄F), resume skill extraction, and skill-gap recommendations linked to EduBridge.",
    href: "/opportunities",
    icon: Briefcase,
    badge: "Hybrid Ranking",
    stat: "92% Fit",
    statLabel: "Top internship match",
  },
];

interface ModuleCardsProps {
  stats?: {
    uploaded_documents_count?: number;
    learning_progress_percent?: number;
    eligible_schemes_count?: number;
    matched_opportunities_count?: number;
  };
}

export const ModuleCards: React.FC<ModuleCardsProps> = ({ stats }) => {
  const getDynamicStat = (id: string) => {
    switch (id) {
      case "access":
        return {
          stat: `${stats?.uploaded_documents_count ?? 0} Ingested`,
          statLabel: "Documents indexed",
        };
      case "education":
        return {
          stat: `${Math.round(stats?.learning_progress_percent ?? 0)}% Complete`,
          statLabel: "Curriculum mastery",
        };
      case "schemes":
        return {
          stat: `${stats?.eligible_schemes_count ?? 0} Eligible`,
          statLabel: "Welfare schemes",
        };
      case "opportunities":
        return {
          stat: `${stats?.matched_opportunities_count ?? 0} Matches`,
          statLabel: "Verified postings",
        };
      default:
        return { stat: "Active", statLabel: "Platform module" };
    }
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-foreground">
            Core Platform Modules
          </h2>
          <p className="text-xs sm:text-sm text-muted mt-0.5">
            Four specialized domain capabilities powered by AccessAI shared intelligence
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {MODULES.map((mod) => {
          const Icon = mod.icon;
          const { stat, statLabel } = getDynamicStat(mod.id);
          return (
            <Link
              key={mod.id}
              href={mod.href}
              className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
            >
              <Card className="h-full flex flex-col justify-between p-5 sm:p-6 hover:border-primary/60 hover:shadow-[0_0_15px_rgba(37,99,235,0.12)] transition-all">
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-lg bg-card border border-border text-primary group-hover:border-primary/60 transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <Badge variant="outline" className="text-[11px] font-medium border-border text-muted">
                      {mod.badge}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-foreground group-hover:text-primary transition-colors">
                      {mod.title}
                    </h3>
                    <p className="text-xs text-muted font-medium mt-0.5">
                      {mod.subtitle}
                    </p>
                  </div>

                  <p className="text-xs sm:text-sm text-muted leading-relaxed line-clamp-3">
                    {mod.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-border flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-sm sm:text-base text-foreground block">
                      {stat}
                    </span>
                    <span className="text-xs text-muted">
                      {statLabel}
                    </span>
                  </div>

                  <span className="text-xs font-semibold text-primary group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    Open <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
