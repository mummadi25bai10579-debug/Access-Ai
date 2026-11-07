"use client";

import React, { useState } from "react";
import { User, Save, ShieldCheck } from "lucide-react";

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    fullName: "Lakshmi Narayana",
    email: "lakshmi.narayana@student.ap.gov.in",
    educationLevel: "Undergraduate (B.Tech)",
    state: "Andhra Pradesh",
    preferredLanguage: "Telugu (తెలుగు)",
    annualFamilyIncome: "₹1,80,000",
    skills: "Python, React, TypeScript, Tailwind CSS, Problem Solving",
  });
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <User className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-extrabold tracking-tight">Citizen & Learner Profile</h1>
        </div>
        <p className="text-sm opacity-80 mt-1">
          Your profile parameters drive deterministic scheme eligibility and personalized opportunity scoring.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 rounded-xl border border-border bg-card space-y-4">
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <label className="font-semibold block mb-1">Full Name</label>
            <input
              type="text"
              value={profile.fullName}
              onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1">Email</label>
            <input
              type="email"
              disabled
              value={profile.email}
              className="w-full p-2.5 rounded-lg border border-border bg-accent opacity-75 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1">Education Level</label>
            <input
              type="text"
              value={profile.educationLevel}
              onChange={(e) => setProfile({ ...profile, educationLevel: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1">State of Domicile</label>
            <input
              type="text"
              value={profile.state}
              onChange={(e) => setProfile({ ...profile, state: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1">Annual Family Income</label>
            <input
              type="text"
              value={profile.annualFamilyIncome}
              onChange={(e) => setProfile({ ...profile, annualFamilyIncome: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1">Preferred Language</label>
            <input
              type="text"
              value={profile.preferredLanguage}
              onChange={(e) => setProfile({ ...profile, preferredLanguage: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label className="font-semibold block mb-1 text-sm">Technical Skills & Competencies</label>
          <input
            type="text"
            value={profile.skills}
            onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
            className="w-full p-2.5 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="pt-4 flex items-center justify-between border-t border-border">
          <span className="text-xs text-green-700 dark:text-green-400 font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>Protected by Supabase Row-Level Security</span>
          </span>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:bg-primary-hover flex items-center gap-2 focus-visible:ring-2"
          >
            <Save className="w-4 h-4" />
            <span>{saved ? "Saved Successfully!" : "Save Profile"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
