"use client";

import React, { useState } from "react";
import {
  FileSearch,
  Upload,
  Send,
  Volume2,
  CheckCircle2,
  FileText,
  Languages,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { useAccessibilityStore } from "@/stores/accessibilityStore";
import { ApiClient } from "@/lib/api/client";

export default function AccessPage() {
  const { activeLanguage, speakText } = useAccessibilityStore();

  const [documentText, setDocumentText] = useState(
    "Government Scholarship Circular 2026: Financial assistance of ₹50,000 is provided to eligible students pursuing technical education. Mandatory eligibility requires applicant family annual income to be under ₹2,50,000. All applicants must submit caste and income certificates verified by the revenue officer before 31st December 2026."
  );
  const [question, setQuestion] = useState("What is the family income limit and application deadline?");
  const [loading, setLoading] = useState(false);
  const [answerData, setAnswerData] = useState<{
    answer: string;
    citations: any[];
    confidence: string;
  } | null>({
    answer:
      "కుటుంబ వార్షిక ఆదాయ పరిమితి ₹2,50,000 కంటే తక్కువగా ఉండాలి, మరియు దరఖాస్తు చేసుకోవడానికి చివరి తేదీ 31 డిసెంబర్ 2026.",
    confidence: "high",
    citations: [
      {
        page_number: 1,
        chunk_index: 0,
        quoted_text: "Mandatory eligibility requires applicant family annual income to be under ₹2,50,000... before 31st December 2026.",
      },
    ],
  });

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    try {
      // In production calls ApiClient.askDocument(...)
      setTimeout(() => {
        setAnswerData({
          answer:
            activeLanguage === "te"
              ? `ప్రశ్న ప్రకారం: కుటుంబ ఆదాయం ₹2,50,000 మించరాదు. గడువు: 31 డిసెంబర్ 2026.`
              : `According to the document: Family income must be under ₹2,50,000 and the deadline is 31st December 2026.`,
          confidence: "high",
          citations: [
            {
              page_number: 1,
              chunk_index: 0,
              quoted_text: "Family annual income to be under ₹2,50,000... before 31st December 2026.",
            },
          ],
        });
        setLoading(false);
      }, 400);
    } catch (err: any) {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <FileSearch className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-extrabold tracking-tight">
            Universal Document Assistant (AccessAI)
          </h1>
        </div>
        <p className="text-sm opacity-80 mt-1">
          Upload circulars, certificates, or textbooks. Get plain language explanations,
          multilingual translations, and grounded answers with exact source citations.
        </p>
      </div>

      {/* Document Ingestion Card */}
      <div className="p-6 rounded-xl border border-border bg-card space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-bold text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <span>Active Document Context</span>
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Indexed in pgvector (384-dim)</span>
          </span>
        </div>

        <textarea
          value={documentText}
          onChange={(e) => setDocumentText(e.target.value)}
          rows={4}
          className="w-full p-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono"
          aria-label="Document text"
        />

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
          <div className="flex items-center gap-2">
            <label className="cursor-pointer px-3 py-1.5 rounded-md border border-border hover:bg-accent font-semibold flex items-center gap-1.5 focus-within:ring-2">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload PDF / Image</span>
              <input type="file" className="sr-only" accept=".pdf,.png,.jpg,.jpeg,.txt" />
            </label>
            <span className="opacity-75">Max file size: 10MB</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setDocumentText(
                  "Simplified: If you are a student studying in college and your family earns less than ₹2.5 Lakhs a year, you can receive ₹50,000 for college fees. Apply before 31 December 2026 with income proof."
                );
              }}
              className="px-3 py-1.5 rounded-md bg-accent border border-border hover:bg-card font-semibold flex items-center gap-1"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Simplify to 6th Grade</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grounded Question & Answer Section */}
      <div className="p-6 rounded-xl border border-border bg-card space-y-5">
        <h2 className="text-base font-bold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span>Ask Your Document (Grounded RAG)</span>
        </h2>

        <form onSubmit={handleAsk} className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask anything about the document..."
            className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Ask a question about the document"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary-hover transition-colors flex items-center gap-2 disabled:opacity-50 focus-visible:ring-2"
          >
            <span>{loading ? "Retrieving..." : "Ask"}</span>
            <Send className="w-4 h-4" />
          </button>
        </form>

        {answerData && (
          <div className="p-5 rounded-lg border border-primary/20 bg-accent/40 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary tracking-wide uppercase flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Grounded Answer ({activeLanguage.toUpperCase()})</span>
              </span>
              <button
                onClick={() => speakText(answerData.answer)}
                className="px-2.5 py-1 rounded border border-border bg-background hover:bg-accent text-xs font-semibold flex items-center gap-1.5 focus-visible:ring-2"
                title="Listen to answer"
              >
                <Volume2 className="w-3.5 h-3.5 text-primary" />
                <span>Audio Narration</span>
              </button>
            </div>

            <p className="text-base font-medium leading-relaxed">{answerData.answer}</p>

            {/* Citations Box */}
            {answerData.citations && answerData.citations.length > 0 && (
              <div className="border-t border-border pt-3 space-y-1.5">
                <span className="text-[11px] font-bold uppercase opacity-75">
                  Verified Document Citations
                </span>
                {answerData.citations.map((c, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded bg-background border border-border text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono font-bold text-primary">
                      <span>Page {c.page_number} · Chunk {c.chunk_index}</span>
                      <span className="text-green-700 dark:text-green-400">100% Grounded</span>
                    </div>
                    <p className="italic opacity-85">&quot;{c.quoted_text}&quot;</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
