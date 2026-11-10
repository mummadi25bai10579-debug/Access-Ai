"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth, useUser } from "@clerk/nextjs";
import {
  FileSearch,
  GraduationCap,
  Landmark,
  Briefcase,
  ArrowRight,
  Sparkles,
  FolderOpen,
  ShieldCheck,
  Award,
  Inbox,
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { ModuleCards } from "@/features/dashboard/ModuleCards";
import { QuickActions } from "@/features/dashboard/QuickActions";
import { UpcomingDeadlines } from "@/features/dashboard/UpcomingDeadlines";
import { RecentActivity } from "@/features/dashboard/RecentActivity";
import { ApiClient } from "@/lib/api/client";
import { formatDate } from "@/lib/utils/format";

export default function DashboardPage() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { user } = useUser();

  const [statsData, setStatsData] = useState<any>({
    full_name: "Citizen",
    state_code: "AP",
    annual_family_income: 0,
    education_level: "undergraduate",
    category: "General",
    stats: {
      uploaded_documents_count: 0,
      learning_progress_percent: 0,
      matched_opportunities_count: 0,
      matched_schemes_count: 0,
      eligible_schemes_count: 0,
      applications_count: 0,
      unread_notifications_count: 0,
    },
  });

  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = isSignedIn ? await getToken() : null;

      // Fetch parallel stats, opportunities, documents, and applications from backend
      const [statsRes, oppsRes, docsRes, appsRes] = await Promise.allSettled([
        ApiClient.getDashboardStats(token),
        ApiClient.listOpportunities(),
        token ? ApiClient.listDocuments(token) : Promise.resolve([]),
        token ? ApiClient.listMyApplications(token) : Promise.resolve([]),
      ]);

      if (statsRes.status === "fulfilled" && statsRes.value) {
        setStatsData(statsRes.value);
      }
      if (oppsRes.status === "fulfilled" && Array.isArray(oppsRes.value)) {
        setOpportunities(oppsRes.value);
      }
      if (docsRes.status === "fulfilled" && Array.isArray(docsRes.value)) {
        setDocuments(docsRes.value);
      }
      if (appsRes.status === "fulfilled" && Array.isArray(appsRes.value)) {
        setApplications(appsRes.value);
      }
    } catch {
      // Handled silently
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, getToken]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const topOpportunities = opportunities.slice(0, 2);
  const recentDocs = documents.slice(0, 2);
  const displayName = user?.fullName || statsData?.full_name || "Citizen";

  // Derive real-time upcoming deadlines from actual active opportunities in database
  const deadlines = opportunities
    .filter((opp) => opp.deadline)
    .map((opp) => {
      const d = new Date(opp.deadline);
      const diffMs = d.getTime() - Date.now();
      const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      return {
        id: opp.id,
        title: opp.title,
        category: `${opp.organization} · ${(opp.opportunity_type || "Career").toUpperCase()}`,
        date: formatDate(opp.deadline),
        daysLeft,
        isUrgent: daysLeft <= 7,
      };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 4);

  // Derive real-time audit trail from user's actual documents and applications
  const activities = [
    ...documents.slice(0, 3).map((doc) => ({
      id: `doc-${doc.id}`,
      title: `Document Uploaded: ${doc.filename}`,
      description: `Indexed ${doc.page_count || 1} pages with status ${(doc.status || "uploaded").toUpperCase()}. Grounded Q&A is active.`,
      timestamp: formatDate(doc.created_at),
    })),
    ...applications.slice(0, 2).map((app) => ({
      id: `app-${app.id}`,
      title: `Opportunity Application Submitted`,
      description: `Application status: ${(app.status || "submitted").toUpperCase()}`,
      timestamp: formatDate(app.created_at),
    })),
  ];

  return (
    <PullToRefresh onRefresh={loadDashboard} className="space-y-8">
      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* Hero Welcome Card */}
          <section className="relative overflow-hidden rounded-2xl bg-card border border-border text-foreground p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card border border-primary/40 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Universal Access & Opportunity Platform</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Namaste, {displayName}
            </h1>

            <p className="text-sm sm:text-base text-muted leading-relaxed">
              Your profile is connected to <strong className="text-foreground font-semibold">{statsData.stats.eligible_schemes_count} verified welfare schemes</strong>,{" "}
              <strong className="text-foreground font-semibold">{statsData.stats.matched_opportunities_count} career opportunities</strong>, and active study pathways.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs sm:text-sm text-muted">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-card border border-border font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>{statsData.state_code || "AP"} Domicile</span>
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-card border border-border font-medium">
                <Award className="w-4 h-4 text-sky-500" />
                <span>Category: {statsData.category || "General"}</span>
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-card border border-border font-medium">
                <GraduationCap className="w-4 h-4 text-purple-500" />
                <span>{statsData.education_level || "Undergraduate"}</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
            <Link href="/access">
              <Button
                variant="primary"
                size="md"
                leftIcon={<FileSearch className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                Ask Document Assistant
              </Button>
            </Link>
            <Link href="/schemes">
              <Button
                variant="secondary"
                size="md"
                leftIcon={<Landmark className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                View Eligible Schemes
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Top Stat Metrics */}
      <section aria-label="Key Performance Indicators" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Eligible Schemes"
          value={isLoading ? "..." : `${statsData.stats.eligible_schemes_count} Active`}
          subtitle="Government welfare schemes"
          icon={<Landmark className="w-5 h-5 text-primary" />}
        />
        <StatCard
          label="Opportunity Matches"
          value={isLoading ? "..." : `${statsData.stats.matched_opportunities_count} Listed`}
          subtitle="Jobs, internships & events"
          icon={<Briefcase className="w-5 h-5 text-emerald-500" />}
        />
        <StatCard
          label="EduBridge Progress"
          value={isLoading ? "..." : `${Math.round(statsData.stats.learning_progress_percent)}%`}
          subtitle="Curriculum mastery"
          icon={<GraduationCap className="w-5 h-5 text-purple-500" />}
        />
        <StatCard
          label="Ingested Documents"
          value={isLoading ? "..." : `${statsData.stats.uploaded_documents_count} Files`}
          subtitle="Indexed in database"
          icon={<FolderOpen className="w-5 h-5 text-sky-500" />}
        />
      </section>

      {/* Four Core Module Navigation Cards */}
      <section aria-label="AccessAI Domain Modules">
        <ModuleCards stats={statsData?.stats} />
      </section>

      {/* Quick Action Shortcuts */}
      <section aria-label="Quick Action Shortcuts">
        <QuickActions />
      </section>

      {/* Split Section: Top Recommended Opportunities & Recent Ingested Documents */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Opportunities Card */}
        <Card className="flex flex-col justify-between">
          <div>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" />
                <h2 className="font-bold text-base sm:text-lg text-foreground">
                  Featured Career Opportunities
                </h2>
              </div>
              <Badge variant="outline">Verified Postings</Badge>
            </CardHeader>

            <CardContent className="space-y-3.5">
              {topOpportunities.length === 0 ? (
                <div className="py-8 text-center text-muted space-y-1">
                  <Inbox className="w-6 h-6 mx-auto text-muted/60" />
                  <p className="text-xs sm:text-sm">No opportunity postings currently available.</p>
                </div>
              ) : (
                topOpportunities.map((opp, idx) => (
                  <div
                    key={opp.id || `opp-${idx}`}
                    className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-sm sm:text-base text-foreground hover:text-primary transition-colors">
                          <Link href="/opportunities">{opp.title}</Link>
                        </h3>
                        <p className="text-xs sm:text-sm text-muted">{opp.organization} · {opp.location}</p>
                      </div>
                      <Badge variant="primary" className="font-mono text-xs shrink-0 uppercase">
                        {opp.opportunity_type}
                      </Badge>
                    </div>

                    <p className="text-xs sm:text-sm text-muted leading-relaxed line-clamp-2">
                      {opp.description}
                    </p>

                    <div className="flex items-center justify-between text-xs pt-2.5 border-t border-border">
                      <span className="font-semibold text-emerald-500">
                        {opp.official_url ? "Verified Posting" : "Internal"}
                      </span>
                      <span className="text-muted text-xs">
                        Deadline: {formatDate(opp.deadline)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </div>

          <div className="p-4 border-t border-border">
            <Link
              href="/opportunities"
              className="text-xs sm:text-sm font-semibold text-primary hover:underline flex items-center justify-center gap-1"
            >
              <span>Explore all opportunities</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Card>

        {/* Recent Ingested Documents Card */}
        <Card className="flex flex-col justify-between">
          <div>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-primary" />
                <h2 className="font-bold text-base sm:text-lg text-foreground">
                  Recent Ingested Documents
                </h2>
              </div>
              <Badge variant="outline">Indexed Context</Badge>
            </CardHeader>

            <CardContent className="space-y-3.5">
              {recentDocs.length === 0 ? (
                <div className="py-8 text-center text-muted space-y-1">
                  <Inbox className="w-6 h-6 mx-auto text-muted/60" />
                  <p className="text-xs sm:text-sm">No documents uploaded yet.</p>
                  <p className="text-xs text-muted">Upload circulars or marksheets to enable grounded AI Q&A.</p>
                </div>
              ) : (
                recentDocs.map((doc, idx) => (
                  <div
                    key={doc.id || doc.document_id || `doc-${idx}`}
                    className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-sm sm:text-base text-foreground hover:text-primary transition-colors">
                          <Link href="/access">{doc.filename}</Link>
                        </h3>
                        <p className="text-xs sm:text-sm text-muted">
                          {doc.page_count || 1} pages · Status: {(doc.status || "uploaded").toUpperCase()}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0 font-mono">
                        {(doc.detected_language || "en").toUpperCase()}
                      </Badge>
                    </div>

                    <p className="text-xs sm:text-sm text-muted leading-relaxed line-clamp-2">
                      {doc.extracted_text ? doc.extracted_text.slice(0, 160) + "..." : "Text extracted and indexed for semantic Q&A."}
                    </p>

                    <div className="flex items-center justify-between text-xs pt-2.5 border-t border-border">
                      <span className="text-muted text-xs">
                        Added: {formatDate(doc.created_at)}
                      </span>
                      <Link
                        href="/access"
                        className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                      >
                        <span>Query Assistant</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </div>

          <div className="p-4 border-t border-border">
            <Link
              href="/documents"
              className="text-xs sm:text-sm font-semibold text-primary hover:underline flex items-center justify-center gap-1"
            >
              <span>Manage document repositories</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Card>
      </div>

      {/* Deadlines and Activity Audit Trail */}
      <div className="grid md:grid-cols-2 gap-6">
        <UpcomingDeadlines deadlines={deadlines} />
        <RecentActivity activities={activities} />
      </div>
    </>
    )}
  </PullToRefresh>
  );
}
