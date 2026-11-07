"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Target,
} from "lucide-react";

export default function OpportunitiesPage() {
  const [resumeText, setResumeText] = useState(
    "Lakshmi Narayana · Computer Science Undergrad (2026)\nSkills: Python, React, TypeScript, Tailwind CSS, Problem Solving, Git.\nProjects: Accessible Web Portal, Voice Document Reader."
  );
  const [parsedSkills, setParsedSkills] = useState(["Python", "React", "TypeScript", "Tailwind CSS", "Git"]);

  const opportunities = [
    {
      id: "o1",
      title: "AI & Full-Stack Engineering Internship",
      org: "AssistiveTech Labs India",
      type: "Internship",
      location: "Remote (India)",
      required: ["Python", "FastAPI", "React", "TypeScript", "Tailwind CSS"],
      deadline: "25 Nov 2026",
      score: 87,
      formulaBreakdown: "E: 1.0 (40%) + R: 0.80 (28%) + P: 1.0 (15%) + F: 0.95 (4%)",
      url: "https://example.com/careers/ai-intern",
    },
    {
      id: "o2",
      title: "Digital India AI Hackathon 2026",
      org: "Ministry of Electronics & IT",
      type: "Hackathon",
      location: "Hybrid / New Delhi",
      required: ["Machine Learning", "Python", "Speech Recognition", "OpenAPI"],
      deadline: "05 Dec 2026",
      score: 74,
      formulaBreakdown: "E: 1.0 (40%) + R: 0.50 (18%) + P: 0.8 (12%) + F: 0.95 (4%)",
      url: "https://innovateindia.mygov.in",
    },
    {
      id: "o3",
      title: "Junior Cloud & Backend Engineer",
      org: "Bharat Cloud Solutions",
      type: "Job",
      location: "Hyderabad / Bengaluru",
      required: ["Python", "PostgreSQL", "Docker", "REST APIs", "Git"],
      deadline: "30 Nov 2026",
      score: 68,
      formulaBreakdown: "E: 1.0 (40%) + R: 0.40 (14%) + P: 0.8 (12%) + F: 0.95 (4%)",
      url: "https://example.com/careers/junior-backend",
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-amber-600" />
          <h1 className="text-2xl font-extrabold tracking-tight">
            OpportunityBridge — Career & Scholarship Matching
          </h1>
        </div>
        <p className="text-sm opacity-80 mt-1">
          Formula-driven ranking combining hard eligibility gates, skill relevance, user preferences, and source freshness.
        </p>
      </div>

      {/* Resume Ingestion Box */}
      <div className="p-5 rounded-xl border border-border bg-card space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-bold text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <span>Active Resume & Extracted Skills</span>
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-accent border border-border font-medium">
            Undergraduate · 2026
          </span>
        </div>

        <textarea
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          rows={3}
          className="w-full p-3 rounded-lg border border-border bg-background text-xs font-mono focus:ring-1 focus:ring-primary"
          aria-label="Resume text"
        />

        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs font-bold mr-1 opacity-75">Parsed Skills:</span>
          {parsedSkills.map((s, idx) => (
            <span
              key={idx}
              className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold"
            >
              ✓ {s}
            </span>
          ))}
        </div>
      </div>

      {/* Matching Algorithm Formula Card */}
      <div className="p-4 rounded-lg bg-accent/60 border border-border text-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <span>
            Scoring Formula: <strong>S = 0.40·E + 0.35·R + 0.15·P + 0.10·F</strong>
          </span>
        </div>
        <span className="text-[11px] opacity-75 hidden md:inline">
          Hard eligibility failure immediately clamps match score to 0.
        </span>
      </div>

      {/* Opportunities List */}
      <div className="space-y-4">
        {opportunities.map((opp) => {
          const matchedSkills = opp.required.filter((r) =>
            parsedSkills.map((s) => s.toLowerCase()).includes(r.toLowerCase())
          );
          const missingSkills = opp.required.filter(
            (r) => !parsedSkills.map((s) => s.toLowerCase()).includes(r.toLowerCase())
          );

          return (
            <div key={opp.id} className="p-6 rounded-xl border border-border bg-card space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base">{opp.title}</h3>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-accent border border-border font-semibold">
                      {opp.type}
                    </span>
                  </div>
                  <p className="text-xs opacity-75">{opp.org} · {opp.location}</p>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-black text-green-600 dark:text-green-400">
                    {opp.score}%
                  </div>
                  <p className="text-[10px] uppercase font-bold opacity-75">Calibrated Fit</p>
                </div>
              </div>

              {/* Skills Breakdown */}
              <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold opacity-75">Skills:</span>
                {matchedSkills.map((s, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300 font-medium"
                  >
                    ✓ {s}
                  </span>
                ))}
                {missingSkills.map((s, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 font-medium flex items-center gap-1"
                  >
                    <span>+ Missing: {s}</span>
                  </span>
                ))}
              </div>

              {/* Formula & Action footer */}
              <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-mono text-[11px] opacity-70">
                  Weights: {opp.formulaBreakdown}
                </span>

                <div className="flex items-center gap-3">
                  {missingSkills.length > 0 && (
                    <Link
                      href="/education"
                      className="text-primary font-semibold hover:underline flex items-center gap-1"
                    >
                      <span>Study {missingSkills[0]} in EduBridge</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                  <a
                    href={opp.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold flex items-center gap-1.5 focus-visible:ring-2"
                  >
                    <span>Apply on Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
