import React, { useState, useEffect } from "react";
import { BookOpen, FileText, Volume2, Sparkles, Check, Copy } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PulseLoader } from "@/components/ui/PulseLoader";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAccessibilityStore } from "@/stores/accessibilityStore";
import { ApiClient } from "@/lib/api/client";

interface ContentTransformationToolsProps {
  document?: any;
}

export const ContentTransformationTools: React.FC<ContentTransformationToolsProps> = ({
  document,
}) => {
  const { speakText } = useAccessibilityStore();
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState<"simplify" | "summary">("simplify");
  const [simplifiedText, setSimplifiedText] = useState<string>("");
  const [summaryText, setSummaryText] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const documentContent = document?.extracted_text || document?.simplified_text || "";

  useEffect(() => {
    let isCancelled = false;

    async function loadTransformations() {
      if (!documentContent) {
        setSimplifiedText("");
        setSummaryText("");
        return;
      }

      setIsLoading(true);
      try {
        const token = await getToken();

        if (activeTab === "simplify") {
          const res = await ApiClient.simplifyText(documentContent.slice(0, 3000), "en", token);
          if (!isCancelled && res?.simplified_text) {
            setSimplifiedText(res.simplified_text);
          }
        } else if (activeTab === "summary") {
          const res = await ApiClient.summarizeText(documentContent.slice(0, 3000), "en", token);
          if (!isCancelled && res?.summary) {
            setSummaryText(res.summary);
          }
        }
      } catch {
        if (!isCancelled) {
          if (activeTab === "simplify") {
            setSimplifiedText(documentContent.slice(0, 500) + "...");
          } else {
            setSummaryText(documentContent.slice(0, 500) + "...");
          }
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    loadTransformations();

    return () => {
      isCancelled = true;
    };
  }, [documentContent, activeTab, getToken]);

  const handleCopy = (text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!document) {
    return null;
  }

  const activeContent = activeTab === "simplify" ? simplifiedText : summaryText;

  return (
    <Card className="space-y-4">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-base sm:text-lg text-foreground">
            Adaptive Document Transformations
          </h3>
        </div>
        <Badge variant="outline">Document Intelligence (English)</Badge>
      </CardHeader>

      {/* Tabs */}
      <div className="flex border-b border-border text-xs sm:text-sm font-semibold gap-3">
        <button
          type="button"
          onClick={() => setActiveTab("simplify")}
          className={`pb-3 px-3.5 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "simplify"
              ? "border-primary text-primary"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Plain Language Simplification</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("summary")}
          className={`pb-3 px-3.5 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "summary"
              ? "border-primary text-primary"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Executive Summary & Takeaways</span>
        </button>
      </div>

      <CardContent className="space-y-4">
        {isLoading ? (
          <div role="status" aria-live="polite" className="p-6 rounded-xl bg-accent/20 border border-border space-y-3.5 animate-pulse">
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <PulseLoader
                label={activeTab === "simplify" ? "Generating simplified plain language version in English..." : "Generating executive summary in English..."}
              />
              <Skeleton width="4rem" height="1.25rem" />
            </div>
            <div className="space-y-2 pt-1">
              <Skeleton width="100%" height="0.95rem" />
              <Skeleton width="96%" height="0.95rem" />
              <Skeleton width="90%" height="0.95rem" />
              <Skeleton width="75%" height="0.95rem" />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 sm:p-5 rounded-xl bg-accent/30 border border-border leading-relaxed text-sm text-foreground whitespace-pre-line">
              {activeContent || "No text available for transformation."}
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => speakText(activeContent)}
                disabled={!activeContent}
                leftIcon={<Volume2 className="w-3.5 h-3.5 text-primary" />}
              >
                Listen Aloud (English)
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(activeContent)}
                disabled={!activeContent}
                leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              >
                {copied ? "Copied" : "Copy Text"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
