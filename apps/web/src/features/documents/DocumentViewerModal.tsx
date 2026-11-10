import React, { useEffect } from "react";
import { X, FileText, Calendar, CheckCircle2, Volume2, ShieldCheck, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAccessibilityStore } from "@/stores/accessibilityStore";
import { formatDate } from "@/lib/utils/format";

export interface ModalDocument {
  id: string;
  filename: string;
  fileSizeKb?: number;
  mimeType?: string;
  mime_type?: string;
  uploadedAt?: string;
  created_at?: string;
  status: string;
  pageCount?: number;
  page_count?: number;
  detectedLanguage?: string;
  detected_language?: string;
  extractedSnippet?: string;
  extracted_text?: string;
  simplifiedSummary?: string;
  keyFacts?: Array<{ label: string; value: string }>;
}

interface DocumentViewerModalProps {
  document: ModalDocument | null;
  onClose: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  document,
  onClose,
}) => {
  const { speakText } = useAccessibilityStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (document) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [document, onClose]);

  if (!document) return null;

  const pageCount = document.pageCount ?? document.page_count ?? 1;
  const summary =
    document.simplifiedSummary ||
    (document.extracted_text
      ? document.extracted_text.slice(0, 300) + (document.extracted_text.length > 300 ? "..." : "")
      : "Document content ingested and indexed for semantic search and grounded retrieval.");
  const snippet = document.extractedSnippet || document.extracted_text || "No preview snippet available.";
  const uploadedTime = formatDate(document.created_at || document.uploadedAt);
  const facts =
    document.keyFacts || [
      { label: "File Name", value: document.filename },
      { label: "Pages", value: String(pageCount) },
      { label: "Format", value: document.mimeType || document.mime_type || "application/pdf" },
      { label: "Status", value: document.status.toUpperCase() },
    ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="doc-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div className="bg-card border border-border rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Dense Embeddings Indexed</Badge>
              <Badge variant="outline">{pageCount} Page(s)</Badge>
            </div>
            <h2 id="doc-modal-title" className="text-lg sm:text-xl font-bold text-foreground truncate">
              {document.filename}
            </h2>
            <p className="text-xs sm:text-sm text-muted">
              Uploaded {uploadedTime} {document.fileSizeKb ? `· Size: ${document.fileSizeKb} KB` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-muted border border-border transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Plain Language Summary */}
        <div className="p-4 sm:p-5 rounded-xl bg-card border border-border space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs uppercase tracking-wider text-muted">
              Plain Language Representation
            </span>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Volume2 className="w-4 h-4" />}
              onClick={() => speakText(summary)}
            >
              Listen
            </Button>
          </div>
          <p className="text-sm sm:text-base text-foreground leading-relaxed">
            {summary}
          </p>
        </div>

        {/* Extracted Key Facts */}
        <div className="space-y-2.5">
          <h3 className="font-bold text-xs uppercase tracking-wider text-muted">
            Extracted Key Facts:
          </h3>
          <div className="grid sm:grid-cols-2 gap-2.5">
            {facts.map((fact, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-lg border border-border bg-card space-y-0.5"
              >
                <span className="text-xs font-semibold text-muted uppercase tracking-wider block">
                  {fact.label}
                </span>
                <span className="text-sm font-bold text-foreground">
                  {fact.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Extracted Text Snippet */}
        <div className="space-y-2">
          <h3 className="font-bold text-xs uppercase tracking-wider text-muted">
            Extracted OCR Text Preview:
          </h3>
          <pre className="p-4 bg-background rounded-xl border border-border text-xs text-muted font-mono whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
            {snippet}
          </pre>
        </div>

        <div className="pt-2 border-t border-border flex items-center justify-end">
          <Button variant="primary" size="sm" onClick={onClose}>
            Close Inspector
          </Button>
        </div>
      </div>
    </div>
  );
};
