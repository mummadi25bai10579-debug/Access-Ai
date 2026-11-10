import React, { useState } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { ApiClient } from "@/lib/api/client";

interface DocumentDropzoneProps {
  onDocumentUploaded?: (doc: any) => void;
}

export const DocumentDropzone: React.FC<DocumentDropzoneProps> = ({
  onDocumentUploaded,
}) => {
  const { getToken } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "selected" | "uploaded">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setUploadStatus("selected");
      setErrorMsg(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setErrorMsg(null);

    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("language", "en");
      formData.append("processing_mode", "full");

      const result: any = await ApiClient.uploadDocument(formData, token);
      const normalizedDoc = {
        ...result,
        id: result?.id || result?.document_id,
      };
      setUploadStatus("uploaded");
      if (onDocumentUploaded) {
        onDocumentUploaded(normalizedDoc);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Upload failed. Please ensure the backend server is running.");
      setUploadStatus("selected");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 border-2 border-dashed border-border rounded-2xl bg-card space-y-4 text-center">
      <div className="flex flex-col items-center justify-center space-y-2">
        <div className="p-3.5 rounded-full bg-card border border-border text-primary">
          <Upload className="w-6 h-6" aria-hidden="true" />
        </div>
        <h3 className="font-bold text-base sm:text-lg text-foreground">
          Upload Official Document, Notice, or Textbook
        </h3>
        <p className="text-xs sm:text-sm text-muted max-w-md leading-relaxed">
          Supports native PDFs, scanned certificates (PNG, JPG), and plain text. Maximum file size 15MB.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <label className="cursor-pointer">
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.txt,.md"
            onChange={handleFileChange}
            className="sr-only"
            aria-label="Choose document file to upload"
          />
          <span className="inline-flex items-center justify-center font-medium text-xs sm:text-sm px-4 py-2 rounded-lg bg-card text-foreground hover:bg-accent hover:border-primary/50 border border-border transition-colors">
            Browse Local File
          </span>
        </label>

        {selectedFile && uploadStatus === "selected" && (
          <LoadingButton
            variant="primary"
            size="sm"
            onClick={handleUpload}
            isLoading={isUploading}
            loadingText="Ingesting & Indexing..."
          >
            Upload & Ingest
          </LoadingButton>
        )}
      </div>

      {isUploading && (
        <div className="max-w-md mx-auto pt-2">
          <ProgressBar
            label="Ingesting Document"
            subLabel="Extracting text, OCR & dense embeddings"
            size="sm"
          />
        </div>
      )}

      {selectedFile && (
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-accent/50 border border-border text-xs text-foreground">
          <FileText className="w-3.5 h-3.5 text-primary" />
          <span className="font-medium">{selectedFile.name}</span>
          <span className="text-muted">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
          {uploadStatus === "uploaded" && (
            <Badge variant="success" className="text-xs ml-1">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Ingested & Indexed
            </Badge>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center justify-center gap-1.5 text-xs text-red-500 font-medium">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
