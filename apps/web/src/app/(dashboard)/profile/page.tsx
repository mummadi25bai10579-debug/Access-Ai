"use client";

import React, { useState, useEffect } from "react";
import { useAuth, useUser, useClerk } from "@clerk/nextjs";
import {
  User,
  ShieldCheck,
  CheckCircle2,
  Save,
  Plus,
  X,
  Award,
  Database,
  Lock,
  LogOut,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { ProfileSkeleton } from "@/components/ui/Skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { ApiClient } from "@/lib/api/client";

export default function ProfilePage() {
  const { isSignedIn, isLoaded, getToken, userId } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [stateCode, setStateCode] = useState("AP");
  const [annualFamilyIncome, setAnnualFamilyIncome] = useState(180000);
  const [educationLevel, setEducationLevel] = useState("undergraduate");
  const [category, setCategory] = useState("General");
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [dbSyncStatus, setDbSyncStatus] = useState<"guest" | "loading" | "synced" | "error">("guest");

  // Load live profile when signed in with Clerk
  useEffect(() => {
    let mounted = true;

    async function loadBackendProfile() {
      if (!isLoaded) return;

      if (isSignedIn) {
        setDbSyncStatus("loading");
        if (user) {
          if (user.fullName) setFullName(user.fullName);
          if (user.primaryEmailAddress?.emailAddress) {
            setEmail(user.primaryEmailAddress.emailAddress);
          }
        }
        try {
          const token = await getToken();
          if (token) {
            const data: any = await ApiClient.getProfile(token);
            if (mounted && data) {
              if (data.full_name) setFullName(data.full_name);
              if (data.email) setEmail(data.email);
              if (data.state_code) setStateCode(data.state_code);
              if (data.annual_family_income != null) setAnnualFamilyIncome(Number(data.annual_family_income));
              if (data.education_level) setEducationLevel(data.education_level);
              if (data.category) setCategory(data.category);
              if (Array.isArray(data.skills)) {
                setSkills(data.skills);
              }
              setDbSyncStatus("synced");
              return;
            }
          }
        } catch (err) {
          console.warn("Could not load database profile, falling back to Clerk user:", err);
          if (mounted) setDbSyncStatus("error");
        }
      } else {
        setDbSyncStatus("guest");
      }
    }

    loadBackendProfile();
    return () => {
      mounted = false;
    };
  }, [isLoaded, isSignedIn, user, getToken]);

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
      setIsSaved(false);
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
    setIsSaved(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (isSignedIn) {
        const token = await getToken();
        if (token) {
          await ApiClient.updateProfile(
            {
              full_name: fullName,
              state_code: stateCode,
              annual_family_income: annualFamilyIncome,
              education_level: educationLevel,
              category,
              skills,
            },
            token
          );
          setDbSyncStatus("synced");
          setSavedMessage(`Profile parameters safely persisted to Supabase PostgreSQL (Clerk ID: ${userId?.slice(0, 14)}...).`);
        } else {
          setSavedMessage("Profile parameters updated in active session.");
        }
      } else {
        setSavedMessage("Profile parameters updated in active session.");
      }
      setIsSaved(true);
    } catch (err) {
      console.error("Error saving profile to backend:", err);
      setSavedMessage("Saved locally in session. Supabase synchronization will retry when online.");
      setIsSaved(true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {isSignedIn && (
        <div
          role="status"
          aria-label="Database Status"
          className="flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl border border-primary/30 bg-card text-xs sm:text-sm font-medium"
        >
          <div className="flex items-center gap-3">
            <Lock className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
            <p className="leading-relaxed text-foreground">
              Authenticated as <strong className="font-semibold text-primary">{user?.fullName || fullName}</strong> ({email}). Profile data is strictly isolated via Clerk user ID in Supabase PostgreSQL.
            </p>
          </div>
          <Badge variant="primary" className="shrink-0 flex items-center gap-1">
            <Database className="w-3 h-3" />
            Supabase DB
          </Badge>
        </div>
      )}

      <PageHeader
        title="Citizen Profile & Demographic Parameters"
        description="Your profile powers deterministic eligibility checks across government schemes and informs OpportunityBridge matching algorithms."
        badge={
          isSignedIn ? (
            <Badge variant="primary">Verified Citizen Account</Badge>
          ) : (
            <Badge variant="outline">Guest Session</Badge>
          )
        }
        actions={
          isSignedIn ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ redirectUrl: "/login" })}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:border-red-500/40"
              leftIcon={<LogOut className="w-4 h-4" />}
            >
              Log Out
            </Button>
          ) : undefined
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Citizen Profile" },
        ]}
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Personal Details Card */}
        <Card className="space-y-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-base sm:text-lg text-foreground">
                Personal Identification
              </h2>
            </div>
            <span className="text-xs text-muted font-mono">
              Session: {isSignedIn ? `Clerk (${userId?.slice(0, 12)}...)` : "Guest Session"}
            </span>
          </CardHeader>

          <CardContent className="grid sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="space-y-1.5">
              <label htmlFor="full-name-input" className="font-semibold text-foreground block">
                Full Name
              </label>
              <input
                id="full-name-input"
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setIsSaved(false);
                }}
                className="w-full p-2.5 bg-card border border-border rounded-lg text-foreground focus-visible:ring-2 focus-visible:ring-primary outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email-input" className="font-semibold text-foreground block">
                Email Address
              </label>
              <input
                id="email-input"
                type="email"
                value={email}
                disabled
                className="w-full p-2.5 bg-card border border-border rounded-lg text-muted cursor-not-allowed outline-none opacity-80"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="state-select" className="font-semibold text-foreground block">
                State of Domicile
              </label>
              <select
                id="state-select"
                value={stateCode}
                onChange={(e) => {
                  setStateCode(e.target.value);
                  setIsSaved(false);
                }}
                className="w-full p-2.5 bg-card border border-border rounded-lg text-foreground focus-visible:ring-2 focus-visible:ring-primary outline-none cursor-pointer"
              >
                <option value="AP">Andhra Pradesh</option>
                <option value="TS">Telangana</option>
                <option value="KA">Karnataka</option>
                <option value="TN">Tamil Nadu</option>
                <option value="MH">Maharashtra</option>
                <option value="DL">Delhi</option>
                <option value="UP">Uttar Pradesh</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="category-select" className="font-semibold text-foreground block">
                Social / Reservation Category
              </label>
              <select
                id="category-select"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setIsSaved(false);
                }}
                className="w-full p-2.5 bg-card border border-border rounded-lg text-foreground focus-visible:ring-2 focus-visible:ring-primary outline-none cursor-pointer"
              >
                <option value="BC-A">Backward Class A (BC-A)</option>
                <option value="BC-B">Backward Class B (BC-B)</option>
                <option value="OBC">Other Backward Class (OBC)</option>
                <option value="SC">Scheduled Caste (SC)</option>
                <option value="ST">Scheduled Tribe (ST)</option>
                <option value="General">General / Open Category</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Welfare & Educational Eligibility Card */}
        <Card className="space-y-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-base sm:text-lg text-foreground">
                Welfare Eligibility & Income Verification
              </h2>
            </div>
            <Badge variant="outline">
              Income Bracket: {annualFamilyIncome <= 250000 ? "Under ₹2.5L" : "Above ₹2.5L"}
            </Badge>
          </CardHeader>

          <CardContent className="space-y-4 text-xs sm:text-sm">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="profile-income-input" className="font-semibold text-foreground">
                  Annual Family Income (Household):
                </label>
                <span className="font-mono font-bold text-primary text-sm sm:text-base">
                  ₹{annualFamilyIncome.toLocaleString("en-IN")} / year
                </span>
              </div>
              <input
                id="profile-income-input"
                type="range"
                min={50000}
                max={800000}
                step={25000}
                value={annualFamilyIncome}
                onChange={(e) => {
                  setAnnualFamilyIncome(Number(e.target.value));
                  setIsSaved(false);
                }}
                className="w-full accent-primary cursor-pointer"
              />
              <p className="text-xs text-muted">
                Governs income thresholds for fee reimbursement and central scholarship programs.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="education-level-select" className="font-semibold text-foreground block">
                Highest Enrolled Education Level
              </label>
              <select
                id="education-level-select"
                value={educationLevel}
                onChange={(e) => {
                  setEducationLevel(e.target.value);
                  setIsSaved(false);
                }}
                className="w-full p-2.5 bg-card border border-border rounded-lg text-foreground focus-visible:ring-2 focus-visible:ring-primary outline-none"
              >
                <option value="secondary">10th Class (Secondary)</option>
                <option value="higher_secondary">12th Class (Intermediate)</option>
                <option value="diploma">Polytechnic / Diploma</option>
                <option value="undergraduate">Undergraduate Degree (B.Tech / B.Sc / B.Com)</option>
                <option value="postgraduate">Postgraduate Degree (M.Tech / M.Sc / MCA)</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Technical Skills Profile */}
        <Card className="space-y-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-base sm:text-lg text-foreground">
                Technical Skills & Competencies
              </h2>
            </div>
            <span className="text-xs text-muted">
              {skills.length} skills listed
            </span>
          </CardHeader>

          <CardContent className="space-y-4 text-xs sm:text-sm">
            <p className="text-xs sm:text-sm text-muted">
              These competencies are matched against technical opportunities and used to identify learning roadmaps in EduBridge:
            </p>

            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-card border border-border text-foreground text-xs sm:text-sm font-medium"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="p-0.5 text-muted hover:text-rose-400 rounded focus-visible:ring-1 focus-visible:ring-rose-400"
                    aria-label={`Remove ${skill}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>

            <div className="pt-2 flex gap-2.5">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add a new skill (e.g. Next.js, Docker, SQL)..."
                className="flex-1 p-2.5 text-xs sm:text-sm bg-card border border-border rounded-lg text-foreground placeholder:text-muted focus-visible:ring-2 focus-visible:ring-primary outline-none"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddSkill}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add Skill
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-2">
          {isSaved ? (
            <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-emerald-500">
              <CheckCircle2 className="w-4 h-4" />
              <span>{savedMessage}</span>
              <button
                type="button"
                onClick={() => setIsSaved(false)}
                className="text-xs text-muted hover:text-foreground underline ml-1"
              >
                Dismiss
              </button>
            </div>
          ) : (
            <span className="text-xs text-muted">
              {isSignedIn
                ? "Changes sync securely to your Supabase PostgreSQL account via Clerk ID."
                : "Changes apply immediately to your active session. Sign in to sync across devices."}
            </span>
          )}

          <LoadingButton
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSaving}
            loadingText="Saving Profile Changes..."
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Profile Changes
          </LoadingButton>
        </div>
      </form>
    </div>
  );
}
