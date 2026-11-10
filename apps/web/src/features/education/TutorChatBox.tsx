import React, { useState } from "react";
import { Send, GraduationCap, Volume2, Sparkles, BookOpen } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { PulseLoader } from "@/components/ui/PulseLoader";
import { Badge } from "@/components/ui/Badge";
import { useAccessibilityStore } from "@/stores/accessibilityStore";
import { ApiClient } from "@/lib/api/client";

interface TutorChatBoxProps {
  course?: any;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  concepts?: string[];
}

export const TutorChatBox: React.FC<TutorChatBoxProps> = ({ course }) => {
  const { speakText, activeLanguage } = useAccessibilityStore();
  const { getToken } = useAuth();
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [userQuery, setUserQuery] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "intro",
      role: "assistant",
      content: course
        ? `Hello! I am your AI tutor for "${course.title}". Ask me any conceptual question or request an analogy at your preferred difficulty level.`
        : "Hello! I am your EduBridge AI tutor. Ask me any conceptual question to begin.",
      concepts: course?.topics || ["Foundational Logic", "Concepts"],
    },
  ]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = userQuery.trim();
    if (!query || isSending) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      role: "user",
      content: query,
    };
    setMessages((prev) => [...prev, userMsg]);
    setUserQuery("");
    setIsSending(true);

    try {
      const token = await getToken();
      const res = await ApiClient.tutorChat(
        query,
        course?.id,
        activeLanguage,
        difficulty,
        token
      );
      const assistantMsg: ChatMessage = {
        id: String(Date.now() + 1),
        role: "assistant",
        content: res.reply,
        concepts: res.concept_tags || [],
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: String(Date.now() + 1),
        role: "assistant",
        content: "I encountered an error connecting to the tutoring engine. Please try again in a moment.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="space-y-4">
      <CardHeader className="flex-col sm:flex-row items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-base sm:text-lg text-foreground">
              EduBridge AI Tutor: {course?.title || "Interactive Assistant"}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-muted mt-0.5">
            Explanations dynamically calibrate vocabulary and conceptual depth
          </p>
        </div>

        {/* Difficulty Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-accent border border-border">
          <button
            type="button"
            onClick={() => setDifficulty("beginner")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              difficulty === "beginner"
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted hover:text-foreground"
            }`}
          >
            Beginner
          </button>
          <button
            type="button"
            onClick={() => setDifficulty("intermediate")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              difficulty === "intermediate"
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted hover:text-foreground"
            }`}
          >
            Intermediate
          </button>
          <button
            type="button"
            onClick={() => setDifficulty("advanced")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              difficulty === "advanced"
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted hover:text-foreground"
            }`}
          >
            Advanced
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Messages Thread */}
        <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`p-4 rounded-xl text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-primary/10 border border-primary/20 text-foreground ml-6 sm:ml-12"
                  : "bg-accent/40 border border-border text-foreground mr-6 sm:mr-12 space-y-2.5"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-xs uppercase tracking-wide text-muted">
                  {m.role === "user" ? "You" : "EduBridge Tutor"}
                </span>
                {m.role === "assistant" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => speakText(m.content)}
                    className="h-6 px-2 text-xs"
                    leftIcon={<Volume2 className="w-3 h-3 text-primary" />}
                  >
                    Listen
                  </Button>
                )}
              </div>

              <p className="whitespace-pre-line">{m.content}</p>

              {m.concepts && m.concepts.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/60">
                  {m.concepts.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
          {isSending && (
            <div
              role="status"
              aria-live="polite"
              className="p-4 rounded-xl bg-accent/40 border border-border mr-6 sm:mr-12 space-y-2"
            >
              <span className="font-bold text-xs uppercase tracking-wide text-muted">
                EduBridge Tutor
              </span>
              <PulseLoader label="Formulating pedagogical explanation..." />
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="flex gap-2 pt-2 border-t border-border">
          <input
            type="text"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            disabled={isSending}
            placeholder="Ask a question (e.g. How does recursion work? Explain with an analogy)..."
            className="flex-1 px-4 py-2 text-xs sm:text-sm bg-card border border-border rounded-xl text-foreground placeholder:text-muted focus-visible:ring-2 focus-visible:ring-primary outline-none disabled:opacity-50"
          />
          <LoadingButton
            type="submit"
            variant="primary"
            size="sm"
            disabled={!userQuery.trim()}
            isLoading={isSending}
            loadingText="Sending..."
            leftIcon={<Send className="w-3.5 h-3.5" />}
          >
            Send
          </LoadingButton>
        </form>
      </CardContent>
    </Card>
  );
};
