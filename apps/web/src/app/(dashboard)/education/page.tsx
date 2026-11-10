"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  BookOpen,
  Award,
  CheckCircle2,
  Brain,
  AlertCircle,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { CourseCardSkeleton } from "@/components/ui/Skeleton";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { InfiniteScroll } from "@/components/ui/InfiniteScroll";
import { CourseCard, CourseItem } from "@/features/education/CourseCard";
import { TutorChatBox } from "@/features/education/TutorChatBox";
import { QuizDrawer } from "@/features/education/QuizDrawer";
import { ApiClient } from "@/lib/api/client";

const PAGE_SIZE = 4;

export default function EducationPage() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);
  const [userProgress, setUserProgress] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const fetchEducationData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const courseList = await ApiClient.listCourses();
      if (Array.isArray(courseList)) {
        setCourses(courseList);
        if (courseList.length > 0) {
          setSelectedCourse(courseList[0]);
        }
      }

      if (isSignedIn) {
        const token = await getToken();
        const prog = await ApiClient.getProgress(token);
        setUserProgress(prog);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load courses");
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, getToken]);

  useEffect(() => {
    fetchEducationData();
  }, [fetchEducationData]);

  const overallMastery = userProgress?.mastery_score ?? 0;
  const progressPercent = Math.round((userProgress?.progress_percentage ?? 0) * 100);
  const completedTopicsCount = Array.isArray(userProgress?.completed_topics)
    ? userProgress.completed_topics.length
    : 0;

  const displayedCourses = courses.slice(0, visibleCount);
  const hasMore = visibleCount < courses.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, courses.length));
  };

  return (
    <PullToRefresh onRefresh={fetchEducationData} className="space-y-8">
      <PageHeader
        title="EduBridge Learning Platform"
        description="Personalized AI tutoring adapting to your pace and language. Understand complex textbook chapters, take formative comprehension quizzes, and close foundational skill gaps."
        badge={<Badge variant="primary">Active Learning Engine</Badge>}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "EduBridge" },
        ]}
      />

      {errorMessage && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Stats Summary - Live Data */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Available Courses"
          value={`${courses.length} Courses`}
          subtitle="From educational catalog"
          icon={<BookOpen className="w-5 h-5 text-primary" />}
        />
        <StatCard
          label="Mastery Score"
          value={`${overallMastery} / 100`}
          subtitle={isSignedIn ? "Calculated from quiz performance" : "Sign in to track progress"}
          icon={<Award className="w-5 h-5 text-purple-500 dark:text-purple-400" />}
        />
        <StatCard
          label="Topics Completed"
          value={`${completedTopicsCount} Topics`}
          subtitle={`Overall Progress: ${progressPercent}%`}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />}
        />
        <StatCard
          label="Target Learning Path"
          value="AI & Engineering"
          subtitle="Adaptive curriculum"
          icon={<Brain className="w-5 h-5 text-sky-500 dark:text-sky-400" />}
        />
      </div>

      {/* Active AI Tutor Dialogue */}
      <TutorChatBox course={selectedCourse} />

      {/* Course Catalog & Interactive Quiz */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-foreground">Curriculum Courses</h2>
            <span className="text-xs sm:text-sm text-muted">
              {courses.length > 0 ? "Select course to switch tutor focus" : "No courses available"}
            </span>
          </div>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 gap-4">
              <CourseCardSkeleton count={4} />
            </div>
          ) : courses.length === 0 ? (
            <EmptyState
              title="No Courses Found"
              description="No curriculum courses are currently available in the database."
            />
          ) : (
            <InfiniteScroll
              hasMore={hasMore}
              isLoading={false}
              onLoadMore={handleLoadMore}
              endMessage="All curriculum courses loaded."
            >
              <div className="grid sm:grid-cols-2 gap-4">
                {displayedCourses.map((course, idx) => (
                  <CourseCard
                    key={course.id || `course-${idx}`}
                    course={course}
                    onOpenTutor={(c) => setSelectedCourse(c)}
                    onOpenQuiz={(c) => setSelectedCourse(c)}
                  />
                ))}
              </div>
            </InfiniteScroll>
          )}
        </div>

        {/* Formative Quiz Drawer */}
        <div className="lg:col-span-1">
          <QuizDrawer />
        </div>
      </div>
    </PullToRefresh>
  );
}
