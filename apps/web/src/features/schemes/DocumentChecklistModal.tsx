import React, { useState, useEffect } from "react";
import { X, CheckCircle2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface DocumentChecklistModalProps {
  scheme: any | null;
  onClose: () => void;
}

export const DocumentChecklistModal: React.FC<DocumentChecklistModalProps> = ({
  scheme,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (scheme) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [scheme, onClose]);

  if (!scheme) return null;

  const schemeTitle = scheme.shortName || scheme.name;
  const requiredDocs: string[] = scheme.requiredDocuments || scheme.required_documents || [];
  const officialUrl = scheme.officialUrl || scheme.official_url || "#";
  const authority = scheme.authority || "Government Authority";

  const handleCopyChecklist = () => {
    const text =
      `Document Submission Checklist for ${schemeTitle}:\n` +
      requiredDocs.map((d, i) => `${i + 1}. ${d}`).join("\n") +
      `\nOfficial Portal: ${officialUrl}`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="checklist-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <Badge variant="outline">Required Documentation</Badge>
            <h2 id="checklist-title" className="text-lg sm:text-xl font-bold text-foreground">
              {schemeTitle} — Required Documents
            </h2>
            <p className="text-xs sm:text-sm text-muted">
              Submit verified original documents or state digital certificates
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

        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {requiredDocs.length === 0 ? (
            <p className="text-xs sm:text-sm text-muted py-4 text-center">
              No specific documents listed for this scheme.
            </p>
          ) : (
            requiredDocs.map((doc, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-border bg-card flex items-start gap-3"
              >
                <div className="w-6 h-6 rounded-full bg-card border border-border text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <div className="space-y-0.5 min-w-0">
                  <span className="text-sm font-semibold text-foreground block">
                    {doc}
                  </span>
                  <span className="text-xs text-muted">
                    Required by {authority}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-2 border-t border-border flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyChecklist}
            leftIcon={copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          >
            {copied ? "Copied Checklist" : "Copy Checklist"}
          </Button>

          <Button variant="primary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};
