"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/ui/SearchInput";
import { FilterDropdown } from "@/components/ui/FilterDropdown";
import { EmptyState } from "@/components/ui/EmptyState";
import { SchemeCardSkeleton } from "@/components/ui/Skeleton";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { InfiniteScroll } from "@/components/ui/InfiniteScroll";
import { SchemeCard } from "@/features/schemes/SchemeCard";
import { EligibilityForm } from "@/features/schemes/EligibilityForm";
import { DocumentChecklistModal } from "@/features/schemes/DocumentChecklistModal";
import { ApiClient } from "@/lib/api/client";

const DEFAULT_PROFILE = {
  stateCode: "AP",
  annualFamilyIncome: 180000,
  educationLevel: "undergraduate",
  gender: "female",
  category: "OBC",
};

const PAGE_SIZE = 4;

export default function SchemesPage() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const [schemes, setSchemes] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedState, setSelectedState] = useState("all");
  const [activeChecklistScheme, setActiveChecklistScheme] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // User profile state for dynamic deterministic evaluation
  const [userProfile, setUserProfile] = useState(DEFAULT_PROFILE);

  const loadProfile = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const token = await getToken();
      const prof = await ApiClient.getProfile(token);
      if (prof) {
        setUserProfile((prev) => ({
          ...prev,
          stateCode: prof.state_code || prev.stateCode,
          educationLevel: prof.education_level || prev.educationLevel,
          annualFamilyIncome: prof.annual_family_income != null ? Number(prof.annual_family_income) : prev.annualFamilyIncome,
          category: prof.category || prev.category,
        }));
      }
    } catch {
      // Use default profile on error
    }
  }, [isSignedIn, getToken]);

  const fetchSchemes = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const stateParam = selectedState === "all" ? undefined : selectedState === "central" ? "CENTRAL" : selectedState;
      const data = await ApiClient.listSchemes(stateParam);
      if (Array.isArray(data)) {
        setSchemes(data);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load welfare schemes");
    } finally {
      setIsLoading(false);
    }
  }, [selectedState]);

  useEffect(() => {
    if (isLoaded) {
      loadProfile();
    }
  }, [isLoaded, loadProfile]);

  useEffect(() => {
    fetchSchemes();
  }, [fetchSchemes]);

  // Reset pagination on filter change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, selectedCategory, selectedState]);

  const handleResetProfile = () => {
    setUserProfile(DEFAULT_PROFILE);
  };

  // Filter schemes
  const filteredSchemes = schemes.filter((scheme) => {
    const name = (scheme.name || "").toLowerCase();
    const description = (scheme.description || "").toLowerCase();
    const authority = (scheme.authority || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = name.includes(query) || description.includes(query) || authority.includes(query);

    const schemeCategory = (scheme.category || "").toLowerCase();
    const matchesCategory =
      selectedCategory === "all" || schemeCategory.includes(selectedCategory.toLowerCase());

    const schemeState = scheme.state_code || scheme.stateCode;
    const matchesState =
      selectedState === "all" ||
      (selectedState === "central" && !schemeState) ||
      schemeState === selectedState;

    return matchesSearch && matchesCategory && matchesState;
  });

  const displayedSchemes = filteredSchemes.slice(0, visibleCount);
  const hasMore = visibleCount < filteredSchemes.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredSchemes.length));
  };

  return (
    <PullToRefresh onRefresh={fetchSchemes} className="space-y-8">
      <PageHeader
        title="SchemeConnect Welfare Discovery"
        description="Deterministic evaluation against official eligibility rules. Discover citizen benefits, review matching criteria, and generate custom verification checklists without AI hallucination."
        badge={<Badge variant="primary">Deterministic Rules Engine</Badge>}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "SchemeConnect" },
        ]}
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <SearchInput
          value={searchQuery}
          onChangeValue={setSearchQuery}
          placeholder="Search schemes by name, keyword, or authority..."
          className="flex-1 max-w-lg"
        />

        <div className="flex flex-wrap items-center gap-2.5">
          <FilterDropdown
            label="Category"
            selectedValue={selectedCategory}
            onSelect={setSelectedCategory}
            options={[
              { label: "All Schemes", value: "all" },
              { label: "Scholarships", value: "scholarship" },
              { label: "Higher Education", value: "education" },
              { label: "Agriculture", value: "agriculture" },
            ]}
          />

          <FilterDropdown
            label="Jurisdiction"
            selectedValue={selectedState}
            onSelect={setSelectedState}
            options={[
              { label: "All Jurisdictions", value: "all" },
              { label: "Andhra Pradesh (State)", value: "AP" },
              { label: "Central Only", value: "central" },
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

      {/* Two Column Layout: Eligibility Form on Left, Schemes on Right */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <EligibilityForm
            profile={userProfile}
            onChangeProfile={setUserProfile}
            onReset={handleResetProfile}
          />
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between text-xs sm:text-sm text-muted">
            <span className="font-semibold text-foreground">
              Showing {displayedSchemes.length} of {filteredSchemes.length} Government Schemes
            </span>
            <span>Deterministic Rule Evaluation</span>
          </div>

          {isLoading ? (
            <div className="grid gap-4">
              <SchemeCardSkeleton count={4} />
            </div>
          ) : filteredSchemes.length === 0 ? (
            <EmptyState
              title="No Schemes Found"
              description={
                searchQuery || selectedCategory !== "all" || selectedState !== "all"
                  ? "No welfare schemes match the selected filters. Try broadening your category or resetting the search term."
                  : "No government schemes are currently available in the database."
              }
              actionLabel="Reset Search & Filters"
              onAction={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setSelectedState("all");
              }}
            />
          ) : (
            <InfiniteScroll
              hasMore={hasMore}
              isLoading={false}
              onLoadMore={handleLoadMore}
              endMessage="All government schemes loaded."
            >
              <div className="grid gap-4">
                {displayedSchemes.map((scheme, idx) => (
                  <SchemeCard
                    key={scheme.id || `scheme-${idx}`}
                    scheme={scheme}
                    userProfile={userProfile}
                    onOpenChecklist={(s) => setActiveChecklistScheme(s)}
                  />
                ))}
              </div>
            </InfiniteScroll>
          )}
        </div>
      </div>

      {/* Checklist Dialog Modal */}
      <DocumentChecklistModal
        scheme={activeChecklistScheme}
        onClose={() => setActiveChecklistScheme(null)}
      />
    </PullToRefresh>
  );
}
