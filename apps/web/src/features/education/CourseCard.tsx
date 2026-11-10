import React from "react";
import { BookOpen, CheckCircle2, Clock, Globe, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export interface CourseItem {
  id: string;
  title: string;
  category?: string;
  level?: string;
  difficulty_level?: string;
  description?: string;
  language?: string;
  progressPercent?: number;
  progress?: number;
  masteryScore?: number;
  totalTopics?: number;
  completedTopics?: number;
  topics?: any[];
}

interface CourseCardProps {
  course: CourseItem;
  onOpenTutor: (course: CourseItem) => void;
  onOpenQuiz: (course: CourseItem) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onOpenTutor,
  onOpenQuiz,
}) => {
  const category = course.category || "Curriculum";
  const level = (course.level || course.difficulty_level || "Beginner").toLowerCase();
  const displayLevel = level.charAt(0).toUpperCase() + level.slice(1);
  const progressPercent = Math.round(course.progressPercent ?? (course.progress ? course.progress * 100 : 0));
  const totalTopics = course.totalTopics ?? (Array.isArray(course.topics) ? course.topics.length : 0);
  const completedTopics = course.completedTopics ?? 0;
  const masteryScore = course.masteryScore ?? 0;

  return (
    <Card className="flex flex-col justify-between space-y-4 p-5 sm:p-6 hover:border-primary/50 transition-colors">
      <div className="space-y-3.5">
        <div className="flex items-start justify-between gap-2">
          <Badge variant="outline" className="text-xs">
            {category}
          </Badge>
          <Badge
            variant={
              displayLevel === "Beginner"
                ? "success"
                : displayLevel === "Intermediate"
                ? "warning"
                : "danger"
            }
            className="text-xs"
          >
            {displayLevel}
          </Badge>
        </div>

        <div>
          <h3 className="font-bold text-base sm:text-lg text-foreground leading-snug">
            {course.title}
          </h3>
          <p className="text-xs sm:text-sm text-muted mt-1 leading-relaxed line-clamp-2">
            {course.description || "Course modules and materials available for interactive AI tutoring."}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted">
          <Globe className="w-3.5 h-3.5 text-primary" />
          <span>{course.language || "English"}</span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">
            <span className="text-muted">Mastery Progress</span>
            <span className="text-primary font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-card border border-border overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <div className="text-xs text-muted flex items-center justify-between">
            <span>{completedTopics} of {totalTopics} topics</span>
            <span>Mastery: {masteryScore}/100</span>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-border flex items-center gap-2.5">
        <Button
          variant="primary"
          size="sm"
          className="flex-1"
          onClick={() => onOpenTutor(course)}
          leftIcon={<BookOpen className="w-4 h-4" />}
        >
          Ask AI Tutor
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onOpenQuiz(course)}
        >
          Take Quiz
        </Button>
      </div>
    </Card>
  );
};
