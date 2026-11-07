import React from "react";
import Link from "next/link";
import {
  FileSearch,
  GraduationCap,
  Landmark,
  Briefcase,
  ArrowRight,
  ShieldCheck,
  Languages,
  Eye,
  Volume2,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col justify-between">
      {/* Top Banner */}
      <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
            A
          </div>
          <span className="font-bold text-lg tracking-tight">AccessAI</span>
        </div>
        <Link
          href="/dashboard"
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors flex items-center gap-2 focus-visible:ring-2"
        >
          <span>Launch Platform</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-6 py-16 space-y-12">
        <div className="text-center space-y-4">
          <span className="inline-block px-3 py-1 rounded-full bg-accent border border-border text-xs font-semibold uppercase tracking-wider">
            Universal Access & Opportunity Intelligence Platform
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Democratizing Education, Public Services & Opportunities Across India
          </h1>
          <p className="text-lg opacity-80 max-w-3xl mx-auto leading-relaxed">
            An accessibility-first modular platform powered by grounded multilingual AI.
            Breaking language, format, and complexity barriers for students and underserved citizens.
          </p>
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary-hover transition-colors flex items-center gap-2 text-base focus-visible:ring-2"
            >
              <span>Explore Prototype</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/access"
              className="px-6 py-3 rounded-lg border border-border bg-card font-semibold hover:bg-accent transition-colors text-base focus-visible:ring-2"
            >
              Try Document Assistant
            </Link>
          </div>
        </div>

        {/* 4 Modules Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Module 1 */}
          <div className="p-6 rounded-xl border border-border bg-card space-y-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 flex items-center justify-center">
              <FileSearch className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold">01 — AccessAI</h2>
            <p className="text-sm opacity-80 leading-relaxed">
              Central intelligence engine for multimodal document understanding, optical character recognition,
              plain-language simplification, and grounded question answering with page citations.
            </p>
          </div>

          {/* Module 2 */}
          <div className="p-6 rounded-xl border border-border bg-card space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold">02 — EduBridge</h2>
            <p className="text-sm opacity-80 leading-relaxed">
              Interactive contextual AI tutor grounded in uploaded textbooks and notes, automatic concept extraction,
              personalized learning paths, and formative knowledge-gap quizzes.
            </p>
          </div>

          {/* Module 3 */}
          <div className="p-6 rounded-xl border border-border bg-card space-y-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 flex items-center justify-center">
              <Landmark className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold">03 — SchemeConnect</h2>
            <p className="text-sm opacity-80 leading-relaxed">
              Deterministic government scheme eligibility evaluation (PM-KISAN, NSP, AP Vidya Deevena) using
              authoritative criteria—guaranteeing zero AI hallucinations and verified official citations.
            </p>
          </div>

          {/* Module 4 */}
          <div className="p-6 rounded-xl border border-border bg-card space-y-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 flex items-center justify-center">
              <Briefcase className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold">04 — OpportunityBridge</h2>
            <p className="text-sm opacity-80 leading-relaxed">
              Structured resume parsing, skill-gap analysis, and verified opportunity ranking using the calibrated
              formula: <code className="text-xs bg-accent px-1.5 py-0.5 rounded">S = w1*E + w2*R + w3*P + w4*F</code>.
            </p>
          </div>
        </div>

        {/* Accessibility Commitments */}
        <div className="p-6 rounded-xl bg-accent border border-border space-y-4">
          <h3 className="font-bold text-base flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            <span>WCAG 2.2 AA Accessibility & Inclusive Design Baseline</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-medium">
            <div className="flex items-center gap-2">
              <Languages className="w-4 h-4 text-primary" />
              <span>11 Indian Languages</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              <span>High Contrast & 200% Font Scale</span>
            </div>
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-primary" />
              <span>Screen Reader & TTS Narration</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>PostgreSQL RLS Tenant Isolation</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card px-6 py-4 text-center text-xs opacity-75">
        AccessAI Platform · Designed for Students and Underserved Communities
      </footer>
    </div>
  );
}
