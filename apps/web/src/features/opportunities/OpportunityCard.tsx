import React, { useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  MapPin,
  Calendar,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Check,
  Loader2,
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { ApiClient } from "@/lib/api/client";
import { formatDate } from "@/lib/utils/format";

interface OpportunityCardProps {
  opportunity: any;
  onSelectForBreakdown: (opp: any) => void;
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opportunity,
  onSelectForBreakdown,
}) => {
  const { isSignedIn, getToken } = useAuth();
  const [isApplying, setIsApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(Boolean(opportunity.has_applied));

  const type = (opportunity.type || opportunity.opportunity_type || "internship").toLowerCase();
  const typeBadgeVariants: Record<string, "primary" | "success" | "warning" | "accent"> = {
    internship: "primary",
    hackathon: "warning",
    scholarship: "success",
    job: "accent",
  };

  const title = opportunity.title;
  const organization = opportunity.organization || "Partner Organization";
  const location = opportunity.location || "Remote";
  const description = opportunity.description || "";
  const officialUrl = opportunity.official_url || opportunity.officialUrl || "#";
  const deadline = formatDate(opportunity.deadline);
  const matchScore = opportunity.match_score != null
    ? Math.round(opportunity.match_score)
    : opportunity.matchScore != null
    ? Math.round(opportunity.matchScore)
    : null;
  const stipend = opportunity.stipendOrPrize || (opportunity.eligibility?.stipend) || "Opportunity Award / Stipend";
  const matchingSkills: string[] = opportunity.matchingSkills || (opportunity.required_skills ? opportunity.required_skills.slice(0, 3) : []);
  const missingSkills: string[] = opportunity.missingSkills || [];
  const allowedLevels: string[] = opportunity.educationLevelAllowed || (opportunity.eligibility?.education_level ? [opportunity.eligibility.education_level] : ["All Citizens"]);

  const handleApply = async () => {
    if (!isSignedIn) {
      window.open(officialUrl, "_blank");
      return;
    }
    setIsApplying(true);
    try {
      const token = await getToken();
      await ApiClient.applyOpportunity(opportunity.id, "Applied via OpportunityBridge", token);
      setHasApplied(true);
    } catch {
      // Fallback to opening external link
      window.open(officialUrl, "_blank");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Card className="flex flex-col justify-between p-5 sm:p-6 space-y-4 hover:border-primary/50 transition-colors">
      <div className="space-y-3.5">
        {/* Header badges */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant={typeBadgeVariants[type] || "outline"}>
              {type.toUpperCase()}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSelectForBreakdown(opportunity)}
              className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
            >
              <span>Score Breakdown</span>
              <Sparkles className="w-3.5 h-3.5" />
            </button>
            {matchScore != null ? (
              <Badge
                variant={
                  matchScore >= 90
                    ? "success"
                    : matchScore >= 75
                      ? "accent"
                      : "warning"
                }
                className="font-mono text-xs font-bold"
              >
                {matchScore}% MATCH
              </Badge>
            ) : (
              <Badge variant="outline" className="font-mono text-xs font-semibold">
                VERIFIED
              </Badge>
            )}
          </div>
        </div>

        {/* Title & Organization */}
        <div>
          <h3 className="font-extrabold text-base sm:text-lg text-foreground leading-snug">
            {title}
          </h3>
          <p className="text-xs sm:text-sm font-medium text-muted mt-1 flex items-center gap-2 flex-wrap">
            <span className="font-bold text-foreground">{organization}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>{location}</span>
            </span>
          </p>
        </div>

        <p className="text-xs sm:text-sm text-muted leading-relaxed line-clamp-2">
          {description}
        </p>

        {/* Stipend/Prize Highlight */}
        <div className="p-3 rounded-lg bg-card border border-border text-xs sm:text-sm flex items-center justify-between">
          <span className="text-muted font-medium">Compensation / Award:</span>
          <span className="font-bold text-foreground">{stipend}</span>
        </div>

        {/* Skill Matches & Gaps */}
        <div className="space-y-2 pt-1 text-xs sm:text-sm">
          {matchingSkills.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-semibold text-muted text-xs">Relevant Skills:</span>
              {matchingSkills.map((sk, idx) => (
                <span
                  key={`match-${sk}-${idx}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-card border border-emerald-600/50 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 font-medium text-xs"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{sk}</span>
                </span>
              ))}
            </div>
          )}

          {missingSkills.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-semibold text-muted text-xs">Skill Gaps to Bridge:</span>
              {missingSkills.map((sk, idx) => (
                <span
                  key={`miss-${sk}-${idx}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-card border border-amber-600/50 dark:border-amber-800 text-amber-600 dark:text-amber-300 font-medium text-xs"
                >
                  <AlertCircle className="w-3 h-3" />
                  <span>{sk}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Deadline */}
        <div className="flex items-center justify-between text-xs text-muted pt-2 border-t border-border">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Deadline: {deadline}</span>
          </span>
          <span className="capitalize">{allowedLevels.join(", ")} Eligible</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-border flex items-center gap-2.5">
        {hasApplied ? (
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-emerald-500 border-emerald-500/40"
            disabled
            leftIcon={<Check className="w-4 h-4" />}
          >
            Application Recorded
          </Button>
        ) : (
          <LoadingButton
            variant="primary"
            size="sm"
            className="flex-1"
            onClick={handleApply}
            isLoading={isApplying}
            loadingText="Recording Application..."
            rightIcon={!isApplying ? <ExternalLink className="w-4 h-4" /> : undefined}
          >
            Apply on Official Portal
          </LoadingButton>
        )}

        {missingSkills.length > 0 && (
          <Link href="/education">
            <Button
              variant="outline"
              size="sm"
              title="Learn missing skills in EduBridge"
            >
              Bridge Skill Gaps
            </Button>
          </Link>
        )}
      </div>
    </Card>
  );
};
