import type {
  ApiResponse,
  GroundedQARequest,
  GroundedQAResponse,
  SchemeMatchRequest,
  SchemeMatchResponse,
  OpportunityMatchRequest,
  OpportunityMatchResponse,
  UserProfile,
} from "@accessai/contracts";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export class ApiClient {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {},
    token?: string | null
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data: ApiResponse<T> = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(
        (data as any)?.error?.message || `Request failed with status ${res.status}`
      );
    }

    return data.data;
  }

  // Health
  static async getHealth() {
    return this.request<{ status: string; version: string; database?: string }>("/health");
  }

  static async getDbHealth() {
    return this.request<{ status: string; engine?: string; error?: string }>("/health/db");
  }

  // Users, Profile & Dashboard
  static async getProfile(token?: string | null): Promise<UserProfile> {
    return this.request<UserProfile>("/profile/me", {}, token);
  }

  static async getDashboardStats(token?: string | null): Promise<any> {
    return this.request<any>("/users/dashboard/stats", {}, token);
  }

  static async updateProfile(
    profile: Partial<UserProfile>,
    token?: string | null
  ): Promise<UserProfile> {
    return this.request<UserProfile>(
      "/profile/me",
      {
        method: "PUT",
        body: JSON.stringify(profile),
      },
      token
    );
  }

  static async updatePreferences(
    preferences: Record<string, any>,
    token?: string | null
  ): Promise<Record<string, any>> {
    return this.request<Record<string, any>>(
      "/profile/preferences",
      {
        method: "PATCH",
        body: JSON.stringify(preferences),
      },
      token
    );
  }

  // Documents
  static async uploadDocument(formData: FormData, token?: string | null) {
    const url = `${API_BASE_URL}/documents/upload`;
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data?.error?.message || `Upload failed with status ${res.status}`);
    }
    return data.data;
  }

  static async listDocuments(token?: string | null) {
    return this.request<any[]>("/documents", {}, token);
  }

  static async deleteDocument(documentId: string, token?: string | null) {
    return this.request<{ deleted: boolean }>(`/documents/${documentId}`, { method: "DELETE" }, token);
  }

  static async retryDocument(documentId: string, token?: string | null) {
    return this.request<any>(`/documents/${documentId}/retry`, { method: "POST" }, token);
  }

  static async askDocument(params: GroundedQARequest, token?: string | null): Promise<GroundedQAResponse> {
    return this.request<GroundedQAResponse>(
      "/access/ask",
      {
        method: "POST",
        body: JSON.stringify(params),
      },
      token
    );
  }

  static async simplifyText(text: string, language: string = "en", token?: string | null) {
    return this.request<{ simplified_text: string }>(
      "/access/simplify",
      {
        method: "POST",
        body: JSON.stringify({ text, language }),
      },
      token
    );
  }

  static async summarizeText(text: string, language: string = "en", token?: string | null) {
    return this.request<{ summary: string; language: string }>(
      "/access/summarize",
      {
        method: "POST",
        body: JSON.stringify({ text, language }),
      },
      token
    );
  }

  static async translateText(text: string, targetLanguage: string = "en", token?: string | null) {
    return this.request<{ translated_text: string }>(
      "/access/translate",
      {
        method: "POST",
        body: JSON.stringify({ text, target_language: targetLanguage }),
      },
      token
    );
  }

  // Education
  static async listCourses() {
    return this.request<any[]>("/education/courses");
  }

  static async tutorChat(message: string, courseId?: string, language: string = "en", difficultyLevel: string = "beginner", token?: string | null) {
    return this.request<{ reply: string; concept_tags: string[] }>(
      "/education/tutor",
      {
        method: "POST",
        body: JSON.stringify({
          message,
          course_id: courseId,
          language,
          difficulty_level: difficultyLevel,
        }),
      },
      token
    );
  }

  static async getLearningPath(targetRole: string, userSkills: string[]) {
    return this.request<any>("/education/learning-path", {
      method: "POST",
      body: JSON.stringify({ target_role: targetRole, user_skills: userSkills }),
    });
  }

  static async generateQuiz(topic: string, numQuestions: number = 3, difficultyLevel: string = "beginner") {
    return this.request<any>("/education/quiz/generate", {
      method: "POST",
      body: JSON.stringify({ topic, num_questions: numQuestions, difficulty_level: difficultyLevel }),
    });
  }

  static async submitQuiz(
    data: {
      course_id?: string;
      answers?: Array<{
        question_id: string;
        selected_option_index: number;
        correct_option_index?: number;
        explanation?: string;
      }>;
      score?: number;
      total_questions?: number;
      gap_analysis?: any[];
    },
    token?: string | null
  ) {
    return this.request<any>(
      "/education/quiz/submit",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token
    );
  }

  static async getProgress(token?: string | null) {
    return this.request<any>("/education/progress", {}, token);
  }

  static async updateProgress(data: { course_id: string; progress: number; score?: number; current_topic?: string }, token?: string | null) {
    return this.request<any>(
      "/education/progress",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token
    );
  }

  // Schemes
  static async listSchemes(stateCode?: string) {
    const query = stateCode && stateCode !== "all" ? `?state_code=${encodeURIComponent(stateCode)}` : "";
    return this.request<any[]>(`/schemes${query}`);
  }

  static async matchSchemes(request: SchemeMatchRequest): Promise<SchemeMatchResponse> {
    return this.request<SchemeMatchResponse>("/schemes/match", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  // Opportunities
  static async listOpportunities(type?: string) {
    const query = type && type !== "all" ? `?opportunity_type=${encodeURIComponent(type)}` : "";
    return this.request<any[]>(`/opportunities${query}`);
  }

  static async matchOpportunities(
    request: OpportunityMatchRequest
  ): Promise<OpportunityMatchResponse> {
    return this.request<OpportunityMatchResponse>("/opportunities/match", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  static async applyOpportunity(opportunityId: string, notes?: string, token?: string | null) {
    return this.request<any>(
      `/opportunities/${opportunityId}/apply`,
      {
        method: "POST",
        body: JSON.stringify({ notes }),
      },
      token
    );
  }

  static async listMyApplications(token?: string | null) {
    return this.request<any[]>("/opportunities/applications/me", {}, token);
  }

  static async analyzeResume(resumeText: string) {
    return this.request<{ skills: string[]; education_level: string; summary: string }>(
      "/opportunities/resume/analyze",
      {
        method: "POST",
        body: JSON.stringify({ resume_text: resumeText }),
      }
    );
  }

  // Notifications
  static async listNotifications(token?: string | null) {
    return this.request<any[]>("/notifications", {}, token);
  }

  static async markNotificationRead(id: string, isRead: boolean = true, token?: string | null) {
    return this.request<any>(
      `/notifications/${id}/read`,
      {
        method: "PATCH",
        body: JSON.stringify({ is_read: isRead }),
      },
      token
    );
  }

  static async deleteNotification(id: string, token?: string | null) {
    return this.request<{ deleted: boolean }>(`/notifications/${id}`, { method: "DELETE" }, token);
  }
}
