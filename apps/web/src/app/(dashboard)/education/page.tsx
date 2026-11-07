"use client";

import React, { useState } from "react";
import {
  GraduationCap,
  Send,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  XCircle,
  BookOpen,
  Volume2,
} from "lucide-react";
import { useAccessibilityStore } from "@/stores/accessibilityStore";

export default function EducationPage() {
  const { speakText } = useAccessibilityStore();
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string; concepts?: string[] }[]
  >([
    {
      role: "assistant",
      content:
        "Hello Lakshmi! I am your EduBridge contextual tutor. You're currently studying Python Data Structures. What concept would you like me to explain?",
      concepts: ["Python Basics", "Variables", "Memory"],
    },
  ]);
  const [input, setInput] = useState("");
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("beginner");

  // Quiz state
  const [showQuiz, setShowQuiz] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `In Python, think of a list like a sequence of labeled boxes in a storage room. Each box has an index number starting at 0. When you write \`my_list[0]\`, Python opens the very first box directly without checking the others.`,
          concepts: ["Lists", "Indexing", "O(1) Access"],
        },
      ]);
    }, 400);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-emerald-600" />
            <h1 className="text-2xl font-extrabold tracking-tight">
              EduBridge — AI Contextual Tutor
            </h1>
          </div>
          <p className="text-sm opacity-80 mt-1">
            Personalized learning paths, interactive conceptual tutoring, and formative quizzes.
          </p>
        </div>

        {/* Difficulty Controls */}
        <div className="flex items-center gap-2 text-xs border border-border p-1 rounded-lg bg-card">
          <span className="opacity-75 font-semibold px-2">Difficulty:</span>
          {(["beginner", "intermediate", "advanced"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`px-2.5 py-1 rounded font-semibold capitalize transition-colors ${
                difficulty === d
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Tutor Dialogue Area */}
      <div className="p-6 rounded-xl border border-border bg-card space-y-4">
        <div className="space-y-4 max-h-[360px] overflow-y-auto pr-2">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${
                m.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-[85%] p-4 rounded-xl text-sm leading-relaxed space-y-2 ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground font-medium rounded-br-none"
                    : "bg-accent border border-border rounded-bl-none"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="font-bold text-xs uppercase tracking-wider opacity-75">
                    {m.role === "user" ? "Lakshmi" : "EduBridge AI Tutor"}
                  </span>
                  {m.role === "assistant" && (
                    <button
                      onClick={() => speakText(m.content)}
                      className="p-1 hover:bg-card rounded focus-visible:ring-1"
                      title="Read aloud"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-primary" />
                    </button>
                  )}
                </div>
                <p>{m.content}</p>

                {m.concepts && m.concepts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {m.concepts.map((c, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-background border border-border font-semibold text-foreground"
                      >
                        🏷️ {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input Box */}
        <form onSubmit={handleSend} className="flex gap-2 pt-2 border-t border-border">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your tutor any question (e.g. What is the difference between list and tuple?)..."
            className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Tutor question input"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary-hover flex items-center gap-2 focus-visible:ring-2"
          >
            <span>Ask</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Formative Quiz Generator Card */}
      <div className="p-6 rounded-xl border border-border bg-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold">Knowledge Gap Assessment: Python Basics</h2>
          </div>
          <button
            onClick={() => {
              setShowQuiz(!showQuiz);
              setQuizSubmitted(false);
              setSelectedOption(null);
            }}
            className="px-3 py-1.5 rounded-md border border-border bg-accent text-xs font-semibold hover:bg-card"
          >
            {showQuiz ? "Hide Quiz" : "Generate Quick Quiz (3 Questions)"}
          </button>
        </div>

        {showQuiz && (
          <div className="p-4 rounded-lg border border-border bg-background space-y-4 text-sm">
            <p className="font-semibold text-sm">
              Question 1: Which data structure in Python is mutable and allows duplicate elements?
            </p>

            <div className="space-y-2">
              {["A. Tuple", "B. List", "C. Set", "D. String"].map((opt, i) => (
                <label
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedOption === i
                      ? "border-primary bg-primary/10 font-bold"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  <input
                    type="radio"
                    name="quiz-opt"
                    checked={selectedOption === i}
                    onChange={() => setSelectedOption(i)}
                    className="w-4 h-4 text-primary"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                disabled={selectedOption === null || quizSubmitted}
                onClick={() => setQuizSubmitted(true)}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 disabled:opacity-50"
              >
                Submit Answer
              </button>

              {quizSubmitted && (
                <div className="flex items-center gap-2 text-xs font-bold">
                  {selectedOption === 1 ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Correct! Lists are mutable and indexed in Python.
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center gap-1">
                      <XCircle className="w-4 h-4" />
                      Incorrect. Tuples and Strings are immutable; Sets cannot have duplicates. The correct answer is B. List.
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
