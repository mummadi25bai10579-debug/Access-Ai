import React, { useState, useEffect } from "react";
import { CheckCircle2, XCircle, HelpCircle, RotateCcw, Sparkles } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { ApiClient } from "@/lib/api/client";

interface QuizDrawerProps {
  course?: any;
  onQuizCompleted?: (score: number, total: number) => void;
}

interface QuestionItem {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const QuizDrawer: React.FC<QuizDrawerProps> = ({
  course,
  onQuizCompleted,
}) => {
  const { getToken } = useAuth();
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-generate real AI quiz questions for the active course
  useEffect(() => {
    let active = true;

    async function loadCourseQuiz() {
      if (!course?.title) return;
      setIsGenerating(true);
      try {
        const topic = course.title;
        const res = await ApiClient.generateQuiz(topic, 3, "beginner");
        if (active && res?.questions && res.questions.length > 0) {
          const formatted: QuestionItem[] = res.questions.map((q: any, idx: number) => ({
            id: q.question_id || `q_${idx}`,
            question: q.question_text || q.question,
            options: q.options || [],
            correctIndex: q.correct_option_index ?? q.correctIndex ?? 0,
            explanation: q.explanation || "Correct answer evaluated from curriculum logic.",
          }));
          setQuestions(formatted);
          setSelectedAnswers({});
          setIsSubmitted(false);
        }
      } catch (err) {
        console.warn("Could not generate quiz from AI backend:", err);
      } finally {
        if (active) setIsGenerating(false);
      }
    }

    loadCourseQuiz();
    return () => {
      active = false;
    };
  }, [course?.id, course?.title]);

  const handleSelect = (questionId: string, optIndex: number) => {
    if (isSubmitted || isSubmitting) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optIndex }));
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) score += 1;
    });
    return score;
  };

  const handleGenerateNew = async () => {
    setIsGenerating(true);
    try {
      const topic = course?.title || "Python Conditionals & Loops";
      const res = await ApiClient.generateQuiz(topic, 3, "beginner");
      if (res?.questions && res.questions.length > 0) {
        const formatted: QuestionItem[] = res.questions.map((q: any, idx: number) => ({
          id: q.question_id || `q_${idx}`,
          question: q.question_text || q.question,
          options: q.options || [],
          correctIndex: q.correct_option_index ?? q.correctIndex ?? 0,
          explanation: q.explanation || "Correct answer deduced by logical evaluation.",
        }));
        setQuestions(formatted);
        setSelectedAnswers({});
        setIsSubmitted(false);
      }
    } catch (e) {
      // Keep existing questions on error
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const score = calculateScore();

    try {
      const token = await getToken();
      const res = await ApiClient.submitQuiz(
        {
          course_id: course?.id,
          answers: questions.map((q) => ({
            question_id: q.id,
            selected_option_index: selectedAnswers[q.id] ?? -1,
            correct_option_index: q.correctIndex,
            explanation: q.explanation,
          })),
          score,
          total_questions: questions.length,
          gap_analysis: questions
            .filter((q) => selectedAnswers[q.id] !== q.correctIndex)
            .map((q) => q.question),
        },
        token
      );

      const serverScore = res?.score ?? score;

      if (course?.id) {
        const progressVal = Math.min(100, Math.round((serverScore / questions.length) * 100));
        await ApiClient.updateProgress(
          {
            course_id: course.id,
            progress: progressVal,
            score: (serverScore / questions.length) * 100,
            current_topic: "Quiz Completed",
          },
          token
        );
      }

      setIsSubmitted(true);
      if (onQuizCompleted) {
        onQuizCompleted(serverScore, questions.length);
      }
    } catch (e) {
      // Handled gracefully
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
  };

  return (
    <Card className="space-y-4">
      <CardHeader>
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-primary" />
          <div>
            <h3 className="font-bold text-base sm:text-lg text-foreground">
              Formative Comprehension Quiz
            </h3>
            <p className="text-xs sm:text-sm text-muted">
              Topic: {course?.title || "General Concept Review"} ({questions.length} Questions)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LoadingButton
            variant="ghost"
            size="sm"
            onClick={handleGenerateNew}
            isLoading={isGenerating}
            loadingText="Generating..."
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-primary" />}
          >
            Generate AI Quiz
          </LoadingButton>

          {isSubmitted && (
            <Badge variant={calculateScore() === questions.length ? "success" : "warning"}>
              Score: {calculateScore()} / {questions.length}
            </Badge>
          )}
        </div>
      </CardHeader>

      {isGenerating && (
        <div className="px-6 py-2">
          <ProgressBar
            label="Formulating formative quiz questions with Gemini..."
            size="sm"
          />
        </div>
      )}

      <CardContent className="space-y-6">
        {questions.length === 0 ? (
          <div className="py-10 text-center space-y-3">
            {isGenerating ? (
              <p className="text-xs sm:text-sm text-muted">
                Generating fresh interactive comprehension questions with Gemini...
              </p>
            ) : (
              <>
                <p className="text-xs sm:text-sm text-muted">
                  Ready to test your comprehension on this topic?
                </p>
                <LoadingButton
                  variant="primary"
                  size="sm"
                  onClick={handleGenerateNew}
                  isLoading={isGenerating}
                  loadingText="Generating Quiz..."
                  leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                >
                  Generate AI Quiz
                </LoadingButton>
              </>
            )}
          </div>
        ) : (
          questions.map((q, qIndex) => {
          const selected = selectedAnswers[q.id];
          const isCorrect = selected === q.correctIndex;

          return (
            <div key={q.id} className="space-y-3.5 p-4 sm:p-5 rounded-xl border border-border bg-card">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider block">
                Question {qIndex + 1}
              </span>

              <h4 className="font-bold text-sm sm:text-base text-foreground">
                {q.question}
              </h4>

              <div className="space-y-2">
                {q.options.map((opt, optIdx) => {
                  const isOptSelected = selected === optIdx;
                  let borderClass = "border-border hover:border-primary/50";

                  if (isSubmitted) {
                    if (optIdx === q.correctIndex) {
                      borderClass = "border-emerald-500 bg-emerald-500/10 text-emerald-500";
                    } else if (isOptSelected && !isCorrect) {
                      borderClass = "border-red-500 bg-red-500/10 text-red-500";
                    }
                  } else if (isOptSelected) {
                    borderClass = "border-primary bg-primary/10 text-primary";
                  }

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      disabled={isSubmitted}
                      onClick={() => handleSelect(q.id, optIdx)}
                      className={`w-full text-left p-3 rounded-lg border text-xs sm:text-sm transition-all flex items-center justify-between ${borderClass}`}
                    >
                      <span>{opt}</span>
                      {isSubmitted && optIdx === q.correctIndex && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      )}
                      {isSubmitted && isOptSelected && !isCorrect && (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </button>
                  );
                })}
              </div>

              {isSubmitted && (
                <div className="p-3 rounded-lg bg-accent/40 border border-border text-xs text-muted leading-relaxed">
                  <strong className="text-foreground font-semibold">Explanation:</strong> {q.explanation}
                </div>
              )}
            </div>
          );
        })
      )}
      </CardContent>

      {questions.length > 0 && (
        <CardFooter className="flex items-center justify-between gap-3">
          {!isSubmitted ? (
            <LoadingButton
              variant="primary"
              size="md"
              onClick={handleSubmit}
              disabled={Object.keys(selectedAnswers).length === 0}
              isLoading={isSubmitting}
              loadingText="Grading quiz on server..."
            >
              Submit Quiz
            </LoadingButton>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleReset}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Retry Quiz
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
};
