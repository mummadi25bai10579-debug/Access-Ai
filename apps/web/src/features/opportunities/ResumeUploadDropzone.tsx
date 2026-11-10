import React, { useState } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { ApiClient } from "@/lib/api/client";

interface ResumeUploadDropzoneProps {
  onSkillsExtracted?: (skills: string[]) => void;
}

export const ResumeUploadDropzone: React.FC<ResumeUploadDropzoneProps> = ({
  onSkillsExtracted,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [parsed, setParsed] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setParsed(false);
      setErrorMsg(null);
    }
  };

  const handleExtract = async () => {
    if (!selectedFile) return;
    setIsAnalyzing(true);
    setErrorMsg(null);

    try {
      // Read text content from uploaded file
      const text = await selectedFile.text();
      const result = await ApiClient.analyzeResume(text || selectedFile.name);
      setParsed(true);
      if (onSkillsExtracted && result?.skills) {
        onSkillsExtracted(result.skills);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to analyze resume. Please try a plain text or PDF file.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-6 border-2 border-dashed border-border rounded-2xl bg-card space-y-4 text-center">
      <div className="flex flex-col items-center justify-center space-y-2">
        <div className="p-3.5 rounded-full bg-card border border-border text-primary">
          <Upload className="w-6 h-6" aria-hidden="true" />
        </div>
        <h3 className="font-bold text-base sm:text-lg text-foreground">
          Upload Resume / CV for Skill Extraction
        </h3>
        <p className="text-xs sm:text-sm text-muted max-w-md leading-relaxed">
          Extract technical skills, degree qualifications, and domain expertise to match career opportunities. Supports text, PDF, and Markdown.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <label className="cursor-pointer">
          <input
            type="file"
            accept=".pdf,.docx,.txt,.md"
            onChange={handleFileChange}
            className="sr-only"
            aria-label="Upload resume file"
          />
          <span className="inline-flex items-center justify-center font-medium text-xs sm:text-sm px-4 py-2 rounded-lg bg-card text-foreground hover:bg-accent hover:border-primary/50 border border-border transition-colors">
            Select Resume File
          </span>
        </label>

        {selectedFile && !parsed && (
          <LoadingButton
            variant="primary"
            size="sm"
            onClick={handleExtract}
            isLoading={isAnalyzing}
            loadingText="Analyzing Skills..."
          >
            Extract Skills & Match
          </LoadingButton>
        )}
      </div>

      {isAnalyzing && (
        <div className="max-w-md mx-auto pt-2">
          <ProgressBar
            label="Analyzing resume text & extracting technical competencies..."
            size="sm"
          />
        </div>
      )}

      {selectedFile && (
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-accent/50 border border-border text-xs text-foreground">
          <FileText className="w-3.5 h-3.5 text-primary" />
          <span className="font-medium">{selectedFile.name}</span>
          <span className="text-muted">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
          {parsed && (
            <Badge variant="success" className="text-xs ml-1">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Skills Extracted
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
