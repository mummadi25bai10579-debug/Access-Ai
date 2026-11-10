"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/ui/SearchInput";
import { FilterDropdown } from "@/components/ui/FilterDropdown";
import { EmptyState } from "@/components/ui/EmptyState";
import { OpportunityCardSkeleton } from "@/components/ui/Skeleton";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { InfiniteScroll } from "@/components/ui/InfiniteScroll";
import { OpportunityCard } from "@/features/opportunities/OpportunityCard";
import { ResumeUploadDropzone } from "@/features/opportunities/ResumeUploadDropzone";
import { SkillSummaryCard } from "@/features/opportunities/SkillSummaryCard";
import { MatchScoreVisualizer } from "@/features/opportunities/MatchScoreVisualizer";
import { ApiClient } from "@/lib/api/client";

const PAGE_SIZE = 4;

export default function OpportunitiesPage() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [activeBreakdownOpp, setActiveBreakdownOpp] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const fetchUserData = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const token = await getToken();
      const profile = await ApiClient.getProfile(token);
      if (profile?.skills && Array.isArray(profile.skills)) {
        setUserSkills(profile.skills);
      }
      const myApps = await ApiClient.listMyApplications(token);
      if (Array.isArray(myApps)) {
        const idSet = new Set<string>(myApps.map((a: any) => a.opportunity_id));
        setAppliedIds(idSet);
      }
    } catch {
      // Ignored for unauthenticated users
    }
  }, [isSignedIn, getToken]);

  const fetchOpportunities = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const typeParam = selectedType === "all" ? undefined : selectedType;
      const data = await ApiClient.listOpportunities(typeParam);
      if (Array.isArray(data)) {
        setOpportunities(data);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load opportunities");
    } finally {
      setIsLoading(false);
    }
  }, [selectedType]);

  useEffect(() => {
    if (isLoaded) {
      fetchUserData();
    }
  }, [isLoaded, fetchUserData]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  // Reset pagination on filter change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, selectedType]);

  const filteredOpportunities = opportunities.filter((opp) => {
    const title = (opp.title || "").toLowerCase();
    const org = (opp.organization || "").toLowerCase();
    const desc = (opp.description || "").toLowerCase();
    const skills: string[] = opp.required_skills || opp.requiredSkills || [];
    const query = searchQuery.toLowerCase();

    const matchesSearch =
      title.includes(query) ||
      org.includes(query) ||
      desc.includes(query) ||
      skills.some((s) => s.toLowerCase().includes(query));

    const oppType = (opp.opportunity_type || opp.type || "").toLowerCase();
    const matchesType = selectedType === "all" || oppType === selectedType.toLowerCase();

    return matchesSearch && matchesType;
  });

  const displayedOpportunities = filteredOpportunities.slice(0, visibleCount);
  const hasMore = visibleCount < filteredOpportunities.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredOpportunities.length));
  };

  return (
    <PullToRefresh onRefresh={fetchOpportunities} className="space-y-8">
      <PageHeader
        title="OpportunityBridge Career & Matching"
        description="Structured resume skill analysis, qualification filtering, and multi-factor mathematical matching for internships, hackathons, and technical roles."
        badge={<Badge variant="primary">Multi-Factor Matching Engine</Badge>}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "OpportunityBridge" },
        ]}
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 flex-wrap">
        <SearchInput
          value={searchQuery}
          onChangeValue={setSearchQuery}
          placeholder="Search by title, company, skill (e.g. Python, React)..."
          className="flex-1 max-w-md"
        />

        <div className="flex items-center gap-2.5">
          <FilterDropdown
            label="Opportunity Type"
            selectedValue={selectedType}
            onSelect={setSelectedType}
            options={[
              { label: "All Opportunities", value: "all" },
              { label: "Internships", value: "internship" },
              { label: "Hackathons", value: "hackathon" },
              { label: "Scholarships", value: "scholarship" },
              { label: "Full-Time Jobs", value: "job" },
            ]}
          />
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Two Column Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column: Resume Dropzone & Skill Summary */}
        <div className="lg:col-span-1 space-y-6">
          <ResumeUploadDropzone />
          <SkillSummaryCard skills={userSkills} />
        </div>

        {/* Right Column: Opportunities Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between text-xs sm:text-sm text-muted">
            <span className="font-semibold text-foreground">
              Showing {displayedOpportunities.length} of {filteredOpportunities.length} Ranked Opportunities
            </span>
            <span>Formula Fit Scoring</span>
          </div>

          {isLoading ? (
            <div className="grid gap-4">
              <OpportunityCardSkeleton count={4} />
            </div>
          ) : filteredOpportunities.length === 0 ? (
            <EmptyState
              title="No Opportunities Found"
              description={
                searchQuery || selectedType !== "all"
                  ? "No listings match your search criteria. Try removing filters or searching for foundational skills like Python or React."
                  : "No opportunities are currently published in the database."
              }
              actionLabel="Reset Search & Filters"
              onAction={() => {
                setSearchQuery("");
                setSelectedType("all");
              }}
            />
          ) : (
            <InfiniteScroll
              hasMore={hasMore}
              isLoading={false}
              onLoadMore={handleLoadMore}
              endMessage="All career opportunities loaded."
            >
              <div className="grid gap-4">
                {displayedOpportunities.map((opp, idx) => (
                  <OpportunityCard
                    key={opp.id || `opp-${idx}`}
                    opportunity={{
                      ...opp,
                      has_applied: appliedIds.has(opp.id),
                    }}
                    onSelectForBreakdown={(o) => setActiveBreakdownOpp(o)}
                  />
                ))}
              </div>
            </InfiniteScroll>
          )}
        </div>
      </div>

      {/* Score Breakdown Modal */}
      <MatchScoreVisualizer
        opportunity={activeBreakdownOpp}
        onClose={() => setActiveBreakdownOpp(null)}
      />
    </PullToRefresh>
  );
}
