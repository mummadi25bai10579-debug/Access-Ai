"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileSearch,
  GraduationCap,
  Landmark,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ExternalLink,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <section className="p-6 rounded-2xl bg-gradient-to-r from-sky-900 to-indigo-950 text-white space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold tracking-wider uppercase opacity-80">
              Unified Access Dashboard
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold">
              Namaste, Lakshmi Narayana
            </h1>
            <p className="text-sm opacity-90 max-w-2xl mt-1">
              Your profile is matched with 2 state/central government schemes, 3 technical opportunities,
              and your active Python learning progress.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/access"
              className="px-4 py-2 rounded-lg bg-white text-sky-950 font-bold text-sm hover:bg-slate-100 transition-colors flex items-center gap-1.5 focus-visible:ring-2"
            >
              <FileSearch className="w-4 h-4" />
              <span>Ask Document</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Grid of Key Stats & Highlights */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between text-xs opacity-75 font-medium">
            <span>Matched Schemes</span>
            <Landmark className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold mt-2">2 Verified</p>
          <p className="text-xs text-green-600 font-semibold mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Eligible for AP Vidya Deevena</span>
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between text-xs opacity-75 font-medium">
            <span>Opportunities</span>
            <Briefcase className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold mt-2">3 Recommended</p>
          <p className="text-xs text-amber-600 font-semibold mt-1">
            Top fit: 87% Match Score
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between text-xs opacity-75 font-medium">
            <span>EduBridge Progress</span>
            <GraduationCap className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold mt-2">45% Mastery</p>
          <p className="text-xs opacity-75 mt-1">Python Conditionals & Loops</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between text-xs opacity-75 font-medium">
            <span>Upcoming Deadlines</span>
            <Calendar className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold mt-2">Nov 30, 2026</p>
          <p className="text-xs text-rose-600 font-semibold mt-1">NSP Minority Scholarship</p>
        </div>
      </div>

      {/* Two Column Layout: Schemes & Opportunities */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Matched Schemes */}
        <section className="p-6 rounded-xl border border-border bg-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Landmark className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-bold">Verified Government Schemes</h2>
            </div>
            <Link
              href="/schemes"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-lg border border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm">Jagananna Vidya Deevena (RTF)</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-200 dark:bg-green-800 text-green-900 dark:text-green-100 font-bold">
                  Eligible
                </span>
              </div>
              <p className="text-xs opacity-80 leading-relaxed">
                Full college fee reimbursement for undergraduate and polytechnic students in Andhra Pradesh.
              </p>
              <div className="text-xs flex items-center justify-between pt-1">
                <span className="opacity-70">Source: jnanabhumi.ap.gov.in</span>
                <Link
                  href="/schemes"
                  className="font-semibold text-primary hover:underline"
                >
                  View Checklist →
                </Link>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-border bg-background space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm">Post Matric Scholarships for Minorities</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 font-bold">
                  Potentially Eligible
                </span>
              </div>
              <p className="text-xs opacity-80 leading-relaxed">
                Central government financial assistance for students with family income under ₹2,00,000.
              </p>
              <div className="text-xs flex items-center justify-between pt-1">
                <span className="opacity-70">Deadline: 30 Nov 2026</span>
                <Link
                  href="/schemes"
                  className="font-semibold text-primary hover:underline"
                >
                  Check Criteria →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Opportunity Feed */}
        <section className="p-6 rounded-xl border border-border bg-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-bold">Personalized Opportunity Feed</h2>
            </div>
            <Link
              href="/opportunities"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span>Explore All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-lg border border-border bg-background space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm">AI & Full-Stack Engineering Internship</h3>
                  <p className="text-xs opacity-75">AssistiveTech Labs India · Remote</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold text-green-600">87%</span>
                  <p className="text-[10px] opacity-70">Match Score</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 text-[11px]">
                <span className="px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300 font-medium">
                  ✓ Python
                </span>
                <span className="px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300 font-medium">
                  ✓ React
                </span>
                <span className="px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 font-medium">
                  + FastAPI Gap
                </span>
              </div>
              <div className="text-xs flex items-center justify-between pt-1">
                <span className="opacity-70">Deadline: 25 Nov 2026</span>
                <Link
                  href="/education"
                  className="font-semibold text-primary hover:underline"
                >
                  Bridge Skill Gap in EduBridge →
                </Link>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-border bg-background space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm">Digital India AI Hackathon 2026</h3>
                  <p className="text-xs opacity-75">Ministry of Electronics & IT · Hybrid</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold text-green-600">79%</span>
                  <p className="text-[10px] opacity-70">Match Score</p>
                </div>
              </div>
              <p className="text-xs opacity-80">Build voice-enabled assistive applications for public services.</p>
              <div className="text-xs flex items-center justify-between pt-1">
                <span className="opacity-70">Deadline: 05 Dec 2026</span>
                <Link
                  href="/opportunities"
                  className="font-semibold text-primary hover:underline"
                >
                  View Details →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
