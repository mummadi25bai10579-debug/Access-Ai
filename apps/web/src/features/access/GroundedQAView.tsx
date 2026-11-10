import React, { useState } from "react";
import { Send, FileSearch, Quote, Volume2, ShieldCheck, AlertCircle } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/Button";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { PulseLoader } from "@/components/ui/PulseLoader";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { useAccessibilityStore } from "@/stores/accessibilityStore";
import { ApiClient } from "@/lib/api/client";

interface GroundedQAViewProps {
  document?: any;
}

export const GroundedQAView: React.FC<GroundedQAViewProps> = ({ document }) => {
  const { speakText, activeLanguage } = useAccessibilityStore();
  const { getToken } = useAuth();
  const [question, setQuestion] = useState("");
  const [isQuerying, setIsQuerying] = useState(false);
  const [qaResult, setQaResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !document) return;

    setIsQuerying(true);
    setErrorMsg(null);

    try {
      const token = await getToken();
      const result = await ApiClient.askDocument(
        {
          document_id: document.id,
          question: question.trim(),
          language: (activeLanguage as any) || "en",
          include_citations: true,
        },
        token
      );
      setQaResult(result);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to query document assistant. Please verify the document is indexed.");
    } finally {
      setIsQuerying(false);
    }
  };

  if (!document) {
    return (
      <div className="p-8 border border-border rounded-2xl bg-card text-center space-y-3">
        <FileSearch className="w-8 h-8 text-muted mx-auto" />
        <h3 className="font-bold text-base text-foreground">No Document Selected</h3>
        <p className="text-xs sm:text-sm text-muted max-w-sm mx-auto">
          Please upload or select an active document context on the left to activate grounded question answering.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Question Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <label
          htmlFor="doc-question-input"
          className="block text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted"
        >
          Ask Grounded Question on “{document.filename}”
        </label>
        <div className="flex gap-2.5">
          <input
            id="doc-question-input"
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. What documents are required? What is the income limit or deadline?"
            className="flex-1 px-4 py-2.5 text-sm sm:text-base bg-card border border-border rounded-xl text-foreground placeholder:text-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent outline-none transition-all shadow-sm"
          />
          <LoadingButton
            type="submit"
            variant="primary"
            size="md"
            disabled={!question.trim()}
            isLoading={isQuerying}
            loadingText="Analyzing..."
            leftIcon={<Send className="w-4 h-4" />}
          >
            Ask
          </LoadingButton>
        </div>
      </form>

      {errorMsg && (
        <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Answer Loading Skeleton */}
      {isQuerying && (
        <div
          role="status"
          aria-live="polite"
          className="p-5 sm:p-6 rounded-2xl border border-primary/30 bg-card shadow-sm space-y-4 animate-pulse"
        >
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <PulseLoader label="Consulting AccessAI intelligence & retrieving grounded citations..." />
            <Skeleton width="5rem" height="1.25rem" />
          </div>
          <div className="space-y-2.5 pt-2">
            <Skeleton width="100%" height="1.1rem" />
            <Skeleton width="92%" height="1.1rem" />
            <Skeleton width="78%" height="1.1rem" />
          </div>
          <div className="pt-3 border-t border-border flex gap-2">
            <Skeleton width="6rem" height="1.75rem" />
            <Skeleton width="7rem" height="1.75rem" />
          </div>
        </div>
      )}

      {/* Answer Display */}
      {!isQuerying && qaResult && (
        <div className="p-5 sm:p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-border flex-wrap">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="font-bold text-xs sm:text-sm uppercase tracking-wide text-foreground">
                Grounded Assistant Response
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="primary" className="text-xs">
                {qaResult.confidence || "Document Grounded"}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => speakText(qaResult.answer)}
                aria-label="Read answer aloud"
                leftIcon={<Volume2 className="w-3.5 h-3.5 text-primary" />}
              >
                Listen
              </Button>
            </div>
          </div>

          <p className="text-sm sm:text-base text-foreground leading-relaxed whitespace-pre-line font-normal">
            {qaResult.answer}
          </p>

          {/* Citations List */}
          {qaResult.citations && qaResult.citations.length > 0 && (
            <div className="pt-3 border-t border-border space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted">
                <Quote className="w-3.5 h-3.5" />
                <span>Verified Source Citations:</span>
              </div>
              <div className="space-y-2">
                {qaResult.citations.map((c: any, idx: number) => (
                  <div
                    key={c.chunk_id || c.id || `citation-${idx}`}
                    className="p-3 rounded-lg bg-accent/40 border border-border/80 text-xs text-muted leading-relaxed"
                  >
                    <span className="font-semibold text-foreground mr-1.5">
                      [Page {c.page_number || 1}, Chunk {c.chunk_index ?? idx}]:
                    </span>
                    &ldquo;{c.quoted_text || c.content}&rdquo;
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
