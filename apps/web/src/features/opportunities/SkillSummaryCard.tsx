import React from "react";
import { Award, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface SkillSummaryCardProps {
  skills?: string[];
}

export const SkillSummaryCard: React.FC<SkillSummaryCardProps> = ({ skills = [] }) => {
  return (
    <Card className="space-y-4">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-primary" />
          <h2 className="font-bold text-base sm:text-lg text-foreground">Your Technical Skill Profile</h2>
        </div>
        <Badge variant="outline">{skills.length} Extracted Skills</Badge>
      </CardHeader>

      <CardContent className="space-y-3">
        {skills.length === 0 ? (
          <p className="text-xs sm:text-sm text-muted py-2">
            No technical skills recorded yet. Upload a resume below to extract and match your skills with career opportunities.
          </p>
        ) : (
          <>
            <p className="text-xs sm:text-sm text-muted">
              Extracted from your profile and verified learning progress:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {skills.map((skill, idx) => (
                <span
                  key={`${skill}-${idx}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-card border border-border text-foreground text-xs sm:text-sm font-medium hover:border-primary/50 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                  <span>{skill}</span>
                </span>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
