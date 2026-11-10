import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  FileCheck,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils/format";

interface EvaluatedRule {
  key: string;
  label: string;
  description: string;
  satisfied: boolean;
  operator?: string;
  expectedValue?: any;
}

interface SchemeCardProps {
  scheme: any;
  userProfile: {
    stateCode: string;
    annualFamilyIncome: number;
    educationLevel: string;
    gender: string;
  };
  onOpenChecklist: (scheme: any) => void;
}

export const SchemeCard: React.FC<SchemeCardProps> = ({
  scheme,
  userProfile,
  onOpenChecklist,
}) => {
  const [expanded, setExpanded] = useState(false);

  let rawRules = Array.isArray(scheme.rules) ? scheme.rules : [];
  if (rawRules.length === 0 && scheme.eligibility) {
    const el = scheme.eligibility;
    const inferred: any[] = [];
    if (scheme.state_code) {
      inferred.push({
        key: "state_code",
        label: "Domicile State",
        operator: "==",
        expectedValue: scheme.state_code,
        description: `Citizen must be a resident of ${scheme.state_code}.`,
      });
    }
    if (el.annual_family_income_max != null) {
      inferred.push({
        key: "annual_family_income",
        label: "Income Ceiling",
        operator: "<=",
        expectedValue: el.annual_family_income_max,
        description: `Annual family income must not exceed ₹${Number(el.annual_family_income_max).toLocaleString("en-IN")}.`,
      });
    }
    if (el.education_level) {
      inferred.push({
        key: "education_level",
        label: "Education Qualification",
        operator: "in",
        expectedValue: el.education_level,
        description: `Enrolled in ${Array.isArray(el.education_level) ? el.education_level.join(", ") : el.education_level}.`,
      });
    }
    rawRules = inferred;
  }

  const ruleResults: EvaluatedRule[] = rawRules.map((rule: any): EvaluatedRule => {
    const key = String(rule.key || rule.rule_key || "");
    const operator = String(rule.operator || "==");
    const expectedValue = rule.expectedValue !== undefined ? rule.expectedValue : rule.expected_value;
    const label = String(rule.label || (key ? key.replace(/_/g, " ").toUpperCase() : "Criteria"));
    const description = String(rule.description || `${label} (${operator} ${JSON.stringify(expectedValue)})`);

    let satisfied = false;
    if (key === "state_code") {
      satisfied = scheme.state_code === null || scheme.stateCode === null || userProfile.stateCode === expectedValue;
    } else if (key === "annual_family_income") {
      satisfied = userProfile.annualFamilyIncome <= Number(expectedValue);
    } else if (key === "education_level") {
      const allowed = Array.isArray(expectedValue) ? expectedValue : [expectedValue];
      satisfied = allowed.includes(userProfile.educationLevel);
    } else if (key === "gender") {
      satisfied = userProfile.gender.toLowerCase() === String(expectedValue).toLowerCase();
    } else {
      satisfied = Boolean(rule.satisfiedByUser ?? true);
    }
    return { ...rule, key, operator, expectedValue, label, description, satisfied };
  });

  const allSatisfied = ruleResults.length === 0 || ruleResults.every((r) => r.satisfied);
  const someSatisfied = ruleResults.some((r) => r.satisfied);

  const officialUrl = scheme.official_url || scheme.officialUrl || "#";
  const requiredDocs = scheme.required_documents || scheme.requiredDocuments || [];
  const stateCode = scheme.state_code || scheme.stateCode;
  const stateName = scheme.stateName || (stateCode ? `${stateCode} State` : "Central / All India");
  const category = scheme.category || "Welfare";
  const authority = scheme.authority || "Government of India";
  const benefit = scheme.benefit_amount || scheme.benefitAmount || "Direct Benefit Transfer / Support";
  const deadline = formatDate(scheme.application_deadline);
  const lastVerified = formatDate(scheme.last_verified_at);

  return (
    <Card className="flex flex-col justify-between p-5 sm:p-6 space-y-4 hover:border-primary/50 transition-colors">
      <div className="space-y-3.5">
        {/* Header badges */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {stateName}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {category.toUpperCase()}
            </Badge>
          </div>

          <div>
            {allSatisfied ? (
              <Badge variant="success" className="text-xs font-bold gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>ELIGIBLE</span>
              </Badge>
            ) : someSatisfied ? (
              <Badge variant="warning" className="text-xs font-bold gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>PARTIAL MATCH</span>
              </Badge>
            ) : (
              <Badge variant="danger" className="text-xs font-bold gap-1.5">
                <XCircle className="w-4 h-4" />
                <span>INELIGIBLE</span>
              </Badge>
            )}
          </div>
        </div>

        {/* Scheme Title & Authority */}
        <div>
          <h3 className="font-extrabold text-base sm:text-lg text-foreground leading-snug">
            {scheme.name}
          </h3>
          <p className="text-xs sm:text-sm text-muted mt-1 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
            <span>{authority}</span>
          </p>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm text-muted leading-relaxed line-clamp-2">
          {scheme.description}
        </p>

        {/* Benefit Highlight Box */}
        <div className="p-3.5 rounded-lg bg-card border border-emerald-600/50 dark:border-emerald-800/80 text-xs sm:text-sm space-y-1">
          <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-xs uppercase tracking-wider block">
            Citizen Benefit:
          </span>
          <span className="font-extrabold text-foreground text-sm sm:text-base">
            {benefit}
          </span>
        </div>

        {/* Rules Breakdown Toggle */}
        {ruleResults.length > 0 && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-between p-2.5 rounded-lg border border-border bg-card text-xs sm:text-sm font-semibold text-foreground hover:border-primary/50 transition-colors"
            >
              <span>
                Deterministic Criteria ({ruleResults.filter((r: any) => r.satisfied).length} of {ruleResults.length} Satisfied)
              </span>
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {expanded && (
              <div className="mt-2.5 space-y-2 p-3 bg-card rounded-lg border border-border text-xs sm:text-sm">
                {ruleResults.map((rule, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between gap-2 pb-2 border-b border-border last:border-b-0 last:pb-0"
                  >
                    <div className="space-y-0.5">
                      <span className="font-semibold text-foreground block">
                        {rule.label}
                      </span>
                      <span className="text-xs text-muted">
                        {rule.description}
                      </span>
                    </div>
                    <div className="shrink-0 mt-0.5">
                      {rule.satisfied ? (
                        <span className="inline-flex items-center gap-1 text-emerald-500 dark:text-emerald-400 font-bold text-xs">
                          <CheckCircle2 className="w-4 h-4" /> Pass
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-500 dark:text-rose-400 font-bold text-xs">
                          <XCircle className="w-4 h-4" /> Fail
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Metadata Footer: Freshness & Deadline */}
        <div className="flex flex-wrap items-center justify-between text-xs text-muted pt-2 border-t border-border gap-2">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Deadline: {deadline}</span>
          </span>
          <span>Verified: {lastVerified}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-border flex items-center gap-2.5">
        <Button
          variant="primary"
          size="sm"
          className="flex-1"
          onClick={() => onOpenChecklist(scheme)}
          leftIcon={<FileCheck className="w-4 h-4" />}
        >
          Required Documents ({requiredDocs.length})
        </Button>

        <a
          href={officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center p-2 rounded-lg border border-border bg-card text-muted hover:text-foreground hover:border-primary/50 transition-colors"
          title="Visit Official Portal"
          aria-label={`Open official portal for ${scheme.name} in new tab`}
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </Card>
  );
};
