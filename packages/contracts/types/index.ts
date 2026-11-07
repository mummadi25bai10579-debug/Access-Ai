// ============================================================================
// AccessAI - Shared TypeScript Contract Definitions
// File: packages/contracts/types/index.ts
// ============================================================================

export type SupportedLanguage = 
  | 'en' // English
  | 'te' // Telugu
  | 'hi' // Hindi
  | 'ta' // Tamil
  | 'kn' // Kannada
  | 'ml' // Malayalam
  | 'bn' // Bengali
  | 'mr' // Marathi
  | 'gu' // Gujarati
  | 'pa' // Punjabi
  | 'or'; // Odia

// Standard API Response Envelope
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  request_id: string;
  timestamp?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiError;
  request_id: string;
  timestamp?: string;
}

// ----------------------------------------------------------------------------
// User & Accessibility Preferences
// ----------------------------------------------------------------------------
export interface UserProfile {
  id: string;
  full_name: string;
  education_level?: string;
  preferred_language: SupportedLanguage;
  country_code: string;
  state_code?: string;
  annual_family_income?: number;
  category?: string;
  skills: string[];
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  voice_enabled: boolean;
  simplified_language: boolean;
  high_contrast: boolean;
  font_scale: number; // 1.0 to 2.0
  preferred_output: 'text' | 'voice' | 'summary' | 'action_list';
  additional_languages: SupportedLanguage[];
  created_at: string;
}

// ----------------------------------------------------------------------------
// Documents & Grounded RAG
// ----------------------------------------------------------------------------
export type DocumentProcessingStatus = 'uploaded' | 'processing' | 'completed' | 'failed';

export interface DocumentRecord {
  id: string;
  user_id: string;
  filename: string;
  storage_path: string;
  mime_type: string;
  status: DocumentProcessingStatus;
  detected_language?: SupportedLanguage;
  extracted_text?: string;
  simplified_text?: string;
  translated_text?: string;
  page_count: number;
  created_at: string;
}

export interface Citation {
  document_id: string;
  page_number: number;
  chunk_index: number;
  quoted_text: string;
}

export interface GroundedQARequest {
  document_id: string;
  question: string;
  language?: SupportedLanguage;
  include_citations?: boolean;
}

export interface GroundedQAResponse {
  answer: string;
  language: SupportedLanguage;
  confidence: 'high' | 'medium' | 'low' | 'none';
  citations: Citation[];
}

export interface AdaptiveTransformRequest {
  document_id: string;
  target_language?: SupportedLanguage;
  reading_level?: 'beginner' | 'intermediate' | 'advanced';
}

export interface AdaptiveTransformResponse {
  simplified_explanation: string;
  native_translation: string;
  important_facts: { key: string; value: string }[];
  action_checklist: string[];
  audio_narration_url?: string;
}

// ----------------------------------------------------------------------------
// EduBridge (Education)
// ----------------------------------------------------------------------------
export interface TutorDialogueRequest {
  course_id?: string;
  document_id?: string;
  message: string;
  language?: SupportedLanguage;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
}

export interface TutorDialogueResponse {
  reply: string;
  concept_tags: string[];
  recommended_review_topics: string[];
  citations?: Citation[];
}

export interface QuizQuestion {
  question_id: string;
  question_text: string;
  options: string[];
  correct_option_index: number;
  explanation: string;
}

export interface QuizGenerateRequest {
  topic: string;
  document_id?: string;
  num_questions?: number;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
}

export interface Quiz {
  quiz_id: string;
  topic: string;
  questions: QuizQuestion[];
}

export interface LearningProgress {
  user_id: string;
  course_id: string;
  progress: number;
  mastery_score: number;
  current_topic?: string;
}

// ----------------------------------------------------------------------------
// SchemeConnect (Public Services)
// ----------------------------------------------------------------------------
export type EligibilityStatus = 
  | 'eligible'
  | 'potentially_eligible'
  | 'not_eligible'
  | 'insufficient_information';

export interface Scheme {
  id: string;
  name: string;
  description: string;
  official_url: string;
  state_code?: string;
  required_documents: string[];
  application_deadline?: string;
  status: 'active' | 'archived';
}

export interface SchemeEligibilityRule {
  id: string;
  scheme_id: string;
  rule_key: string;
  operator: '==' | '!=' | '<=' | '>=' | '<' | '>' | 'in' | 'contains';
  expected_value: any;
  is_mandatory: boolean;
  description?: string;
}

export interface SchemeMatchRequest {
  profile: {
    education_level?: string;
    state?: string;
    annual_family_income?: number;
    category?: string;
    gender?: string;
  };
  language?: SupportedLanguage;
}

export interface SchemeMatchResult {
  scheme_id: string;
  scheme_name: string;
  eligibility_status: EligibilityStatus;
  matched_criteria: string[];
  unmatched_criteria: string[];
  unknown_criteria: string[];
  official_source: string;
}

export interface SchemeMatchResponse {
  matches: SchemeMatchResult[];
}

// ----------------------------------------------------------------------------
// OpportunityBridge (Careers)
// ----------------------------------------------------------------------------
export interface Opportunity {
  id: string;
  title: string;
  description: string;
  opportunity_type: 'internship' | 'job' | 'scholarship' | 'hackathon';
  organization: string;
  location: string;
  official_url: string;
  required_skills: string[];
  deadline?: string;
  status: 'active' | 'expired';
}

export interface OpportunityMatchRequest {
  profile: {
    skills: string[];
    education_level?: string;
    interests?: string[];
  };
  filters?: {
    opportunity_type?: ('internship' | 'job' | 'scholarship' | 'hackathon')[];
    location?: string;
  };
}

export interface OpportunityMatchResult {
  opportunity_id: string;
  title: string;
  organization: string;
  match_score: number; // 0 to 100
  matching_skills: string[];
  missing_skills: string[];
  eligibility_status: EligibilityStatus;
  deadline?: string;
  source_verified: boolean;
  official_url: string;
}

export interface OpportunityMatchResponse {
  matches: OpportunityMatchResult[];
}

export interface SkillGapRequest {
  opportunity_id: string;
  user_skills: string[];
}

export interface SkillGapResponse {
  matching_skills: string[];
  missing_skills: string[];
  recommended_learning_topics: string[];
}
