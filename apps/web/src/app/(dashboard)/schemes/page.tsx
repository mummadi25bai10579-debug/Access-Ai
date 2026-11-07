"use client";

import React, { useState } from "react";
import {
  Landmark,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  FileCheck,
  Filter,
} from "lucide-react";

export default function SchemesPage() {
  const [userProfile, setUserProfile] = useState({
    state_code: "AP",
    annual_family_income: 180000,
    education_level: "undergraduate",
    gender: "female",
    category: "BC-A",
  });

  const schemes = [
    {
      id: "s1000000-0000-0000-0000-000000000002",
      name: "Jagananna Vidya Deevena (RTF)",
      authority: "Government of Andhra Pradesh",
      portal_url: "https://jnanabhumi.ap.gov.in",
      state: "Andhra Pradesh",
      description: "Full college tuition fee reimbursement for polytechnic, degree, engineering, and PG students.",
      rules: [
        { desc: "State of residence is Andhra Pradesh", satisfied: userProfile.state_code === "AP" },
        { desc: "Annual family income <= ₹2,50,000", satisfied: userProfile.annual_family_income <= 250000 },
        { desc: "Education level is diploma, undergraduate, or PG", satisfied: ["diploma", "undergraduate", "postgraduate"].includes(userProfile.education_level) },
      ],
      documents: ["Integrated Caste Certificate", "Income Certificate / White Ration Card", "Student Aadhaar", "Mother Aadhaar & Bank Details"],
      deadline: "31 Oct 2026",
    },
    {
      id: "s1000000-0000-0000-0000-000000000004",
      name: "AICTE Pragati Scholarship for Girl Students",
      authority: "All India Council for Technical Education (Central)",
      portal_url: "https://www.aicte-india.org",
      state: "All India",
      description: "₹50,000 per annum scholarship for girl students admitted to technical degree or diploma courses.",
      rules: [
        { desc: "Applicant gender is female", satisfied: userProfile.gender === "female" },
        { desc: "Annual family income <= ₹8,00,000", satisfied: userProfile.annual_family_income <= 800000 },
      ],
      documents: ["10th / 12th Marksheet", "Admission Allotment Letter", "Tehsildar Income Certificate"],
      deadline: "15 Dec 2026",
    },
    {
      id: "s1000000-0000-0000-0000-000000000001",
      name: "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
      authority: "Ministry of Agriculture & Farmers Welfare",
      portal_url: "https://pmkisan.gov.in",
      state: "All India",
      description: "Financial benefit of ₹6,000 per year in three installments for landholding farmer families.",
      rules: [
        { desc: "Registered as small/marginal farmer family", satisfied: userProfile.category === "farmer" },
      ],
      documents: ["Aadhaar Card", "Land Ownership Record", "Aadhaar-Linked Bank Account"],
      deadline: "31 Dec 2026",
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <Landmark className="w-6 h-6 text-purple-600" />
          <h1 className="text-2xl font-extrabold tracking-tight">
            SchemeConnect — Public Services & Welfare Intelligence
          </h1>
        </div>
        <p className="text-sm opacity-80 mt-1">
          Deterministic eligibility evaluation evaluated strictly against official criteria.
          Zero hallucinations, zero false guarantees.
        </p>
      </div>

      {/* Interactive Profile Simulation Box */}
      <div className="p-5 rounded-xl border border-border bg-card space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-bold text-sm flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" />
            <span>Citizen Profile Attributes (Test Criteria Live)</span>
          </span>
          <span className="text-xs opacity-75">Used for deterministic Boolean evaluation</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="font-semibold block mb-1">State</label>
            <select
              value={userProfile.state_code}
              onChange={(e) => setUserProfile({ ...userProfile, state_code: e.target.value })}
              className="w-full p-2 rounded border border-border bg-background focus:ring-1 focus:ring-primary"
            >
              <option value="AP">Andhra Pradesh (AP)</option>
              <option value="TG">Telangana (TG)</option>
              <option value="TN">Tamil Nadu (TN)</option>
              <option value="KA">Karnataka (KA)</option>
              <option value="MH">Maharashtra (MH)</option>
              <option value="DL">Delhi (DL)</option>
            </select>
          </div>

          <div>
            <label className="font-semibold block mb-1">Family Income (₹ / yr)</label>
            <input
              type="number"
              value={userProfile.annual_family_income}
              onChange={(e) =>
                setUserProfile({
                  ...userProfile,
                  annual_family_income: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full p-2 rounded border border-border bg-background focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1">Education Level</label>
            <select
              value={userProfile.education_level}
              onChange={(e) =>
                setUserProfile({ ...userProfile, education_level: e.target.value })
              }
              className="w-full p-2 rounded border border-border bg-background focus:ring-1 focus:ring-primary"
            >
              <option value="undergraduate">Undergraduate (B.Tech / B.Sc)</option>
              <option value="diploma">Polytechnic / Diploma</option>
              <option value="postgraduate">Postgraduate</option>
              <option value="high_school">10th / 12th Standard</option>
            </select>
          </div>

          <div>
            <label className="font-semibold block mb-1">Gender</label>
            <select
              value={userProfile.gender}
              onChange={(e) => setUserProfile({ ...userProfile, gender: e.target.value })}
              className="w-full p-2 rounded border border-border bg-background focus:ring-1 focus:ring-primary"
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Scheme Cards List */}
      <div className="space-y-4">
        {schemes.map((scheme) => {
          const allSatisfied = scheme.rules.every((r) => r.satisfied);
          return (
            <div
              key={scheme.id}
              className={`p-6 rounded-xl border transition-all ${
                allSatisfied
                  ? "border-green-300 dark:border-green-800 bg-green-50/20 dark:bg-green-950/10"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base">{scheme.name}</h3>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                        allSatisfied
                          ? "bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-100"
                          : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                      }`}
                    >
                      {allSatisfied ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Eligible</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Not Eligible</span>
                        </>
                      )}
                    </span>
                  </div>
                  <p className="text-xs opacity-75">{scheme.authority} · State: {scheme.state}</p>
                </div>

                <a
                  href={scheme.portal_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg border border-border hover:bg-accent text-xs font-semibold flex items-center gap-1.5 focus-visible:ring-2"
                >
                  <span>Official Portal</span>
                  <ExternalLink className="w-3.5 h-3.5 text-primary" />
                </a>
              </div>

              <p className="text-sm opacity-90 mt-3 leading-relaxed">{scheme.description}</p>

              {/* Evaluated Criteria List */}
              <div className="mt-4 pt-4 border-t border-border grid md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-bold uppercase tracking-wider text-[11px] opacity-75 block mb-2">
                    Deterministic Criteria Breakdown
                  </span>
                  <ul className="space-y-1.5">
                    {scheme.rules.map((rule, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        {rule.satisfied ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                        )}
                        <span className={rule.satisfied ? "font-medium" : "text-red-600 font-medium"}>
                          {rule.desc}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <span className="font-bold uppercase tracking-wider text-[11px] opacity-75 block mb-2">
                    Required Document Checklist
                  </span>
                  <ul className="space-y-1 text-opacity-80">
                    {scheme.documents.map((doc, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <FileCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>{doc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
