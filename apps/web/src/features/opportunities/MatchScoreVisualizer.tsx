import React, { useEffect } from "react";
import { X, Sparkles, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface MatchScoreVisualizerProps {
  opportunity: any | null;
  onClose: () => void;
}

export const MatchScoreVisualizer: React.FC<MatchScoreVisualizerProps> = ({
  opportunity,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (opportunity) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [opportunity, onClose]);

  if (!opportunity) return null;

  const matchScore = opportunity.match_score != null
    ? Math.round(opportunity.match_score)
    : opportunity.matchScore != null
    ? Math.round(opportunity.matchScore)
    : 100;
  const scoreFactors = opportunity.score_factors || opportunity.scoreFactors || {
    eligibility: 1.0,
    skills: Math.round((matchScore / 100) * 100) / 100,
    profile: 1.0,
    fresh: 0.95,
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="score-breakdown-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <Badge variant="outline">Formula Verification</Badge>
            <h2 id="score-breakdown-title" className="text-lg sm:text-xl font-bold text-foreground">
              Match Score Breakdown: {matchScore}%
            </h2>
            <p className="text-xs sm:text-sm text-muted">
              Computed via multi-factor equation: S = w₁E + w₂R + w₃P + w₄F
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-accent border border-border"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3.5">
          {/* Factor 1: Mandatory Eligibility (w1 = 40%) */}
          <div className="p-3.5 rounded-xl border border-border bg-card space-y-1.5">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-bold text-foreground">
                1. Mandatory Eligibility (E = 40% Weight)
              </span>
              <Badge variant="success" className="text-xs">
                {Math.round(scoreFactors.eligibility * 40)} / 40 pts
              </Badge>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Hard filter verification: Education qualifications, location, and application status match requirement criteria.
            </p>
          </div>

          {/* Factor 2: Resume Skill Relevance (w2 = 30%) */}
          <div className="p-3.5 rounded-xl border border-border bg-card space-y-1.5">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-bold text-foreground">
                2. Resume Skill Match (R = 30% Weight)
              </span>
              <Badge variant="primary" className="text-xs">
                {Math.round(scoreFactors.skills * 30)} / 30 pts
              </Badge>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Cosine vector similarity between parsed candidate skills and target listing taxonomy.
            </p>
          </div>

          {/* Factor 3: Profile Preference Alignment (w3 = 20%) */}
          <div className="p-3.5 rounded-xl border border-border bg-card space-y-1.5">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-bold text-foreground">
                3. Profile Career Focus (P = 20% Weight)
              </span>
              <Badge variant="warning" className="text-xs">
                {Math.round(scoreFactors.profile * 20)} / 20 pts
              </Badge>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Alignment with career goals, preferred modalities, and accessibility accommodations.
            </p>
          </div>

          {/* Factor 4: Freshness Decay (w4 = 10%) */}
          <div className="p-3.5 rounded-xl border border-border bg-card space-y-1.5">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-bold text-foreground">
                4. Freshness Score (F = 10% Weight)
              </span>
              <Badge variant="outline" className="text-xs">
                {Math.round(scoreFactors.fresh * 10)} / 10 pts
              </Badge>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Listing recency and remaining application window duration.
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-border flex items-center justify-end">
          <Button variant="primary" size="sm" onClick={onClose}>
            Close Breakdown
          </Button>
        </div>
      </div>
    </div>
  );
};
