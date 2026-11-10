import React from "react";
import { FileText, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface DocumentSelectorProps {
  documents?: any[];
  selectedDocId?: string;
  onSelectDoc: (doc: any) => void;
}

export const DocumentSelector: React.FC<DocumentSelectorProps> = ({
  documents = [],
  selectedDocId,
  onSelectDoc,
}) => {
  return (
    <Card className="space-y-4">
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <h2 className="font-bold text-base sm:text-lg text-foreground">Active Document Context</h2>
        </div>
        <span className="text-xs text-muted font-mono">
          {documents.length} Available
        </span>
      </CardHeader>

      <CardContent className="space-y-2.5">
        {documents.length === 0 ? (
          <div className="text-center py-6 px-2 space-y-2">
            <p className="text-xs sm:text-sm text-muted">
              No documents uploaded yet. Upload a circular, certificate, or textbook above to activate grounded AI assistance.
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs sm:text-sm text-muted">
              Select an ingested document to ground the AI assistant in verified text chunks:
            </p>

            <div className="space-y-2 pt-1">
              {documents.map((doc, idx) => {
                const docId = String(doc?.id || doc?.document_id || `doc-${idx}-${doc?.filename || "file"}`);
                const isSelected = Boolean(
                  (selectedDocId && (docId === selectedDocId || doc?.id === selectedDocId || doc?.document_id === selectedDocId))
                );
                return (
                  <button
                    key={docId}
                    type="button"
                    onClick={() => onSelectDoc(doc)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? "border-primary bg-card ring-1 ring-primary shadow-sm"
                        : "border-border bg-card hover:border-primary/50 text-muted hover:text-foreground"
                    }`}
                    aria-pressed={isSelected}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground truncate">
                          {doc.filename}
                        </span>
                      </div>
                      <p className="text-xs text-muted">
                        {doc.page_count || doc.pageCount || 1} pages · {(doc.status || "uploaded").toUpperCase()}
                      </p>
                    </div>

                    {isSelected ? (
                      <Badge variant="primary" className="text-xs shrink-0">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> ACTIVE
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted hover:text-foreground">
                        Select Context
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
