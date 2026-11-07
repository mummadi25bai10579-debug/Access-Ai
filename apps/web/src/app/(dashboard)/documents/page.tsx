"use client";

import React from "react";
import Link from "next/link";
import { FolderOpen, FileText, CheckCircle2, Clock, Upload, ArrowRight } from "lucide-react";

export default function DocumentsPage() {
  const documents = [
    {
      id: "doc-1",
      name: "AP_Scholarship_Circular_2026.pdf",
      size: "2.4 MB",
      date: "Nov 5, 2026",
      status: "completed",
      chunks: 14,
      pages: 4,
    },
    {
      id: "doc-2",
      name: "Python_Data_Structures_Notes.pdf",
      size: "4.1 MB",
      date: "Nov 6, 2026",
      status: "completed",
      chunks: 28,
      pages: 12,
    },
    {
      id: "doc-3",
      name: "Resume_Lakshmi_Narayana.pdf",
      size: "420 KB",
      date: "Nov 7, 2026",
      status: "completed",
      chunks: 3,
      pages: 1,
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-extrabold tracking-tight">My Documents</h1>
          </div>
          <p className="text-sm opacity-80 mt-1">
            Uploaded PDFs, notes, and circulars securely indexed with pgvector and isolated with Supabase RLS.
          </p>
        </div>

        <Link
          href="/access"
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs flex items-center gap-2 hover:bg-primary-hover focus-visible:ring-2"
        >
          <Upload className="w-4 h-4" />
          <span>Upload New File</span>
        </Link>
      </div>

      <div className="divide-y divide-border rounded-xl border border-border bg-card">
        {documents.map((doc) => (
          <div key={doc.id} className="p-4 flex flex-wrap items-center justify-between gap-4 hover:bg-accent/40 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">{doc.name}</h3>
                <p className="text-xs opacity-70">
                  {doc.pages} pages · {doc.chunks} chunks embedded · {doc.size} · Uploaded {doc.date}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ready for Q&A</span>
              </span>

              <Link
                href="/access"
                className="px-3 py-1.5 rounded-md border border-border text-xs font-semibold hover:bg-card flex items-center gap-1"
              >
                <span>Ask</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
