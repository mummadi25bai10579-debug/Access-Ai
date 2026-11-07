-- ============================================================================
-- AccessAI - Row Level Security (RLS) Policies Migration
-- Migration: 20261107000002_row_level_security.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Enable RLS on All Tables
-- ----------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheme_eligibility_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 2. Profiles Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete their own profile"
    ON profiles FOR DELETE
    USING (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- 3. User Preferences Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view their preferences"
    ON user_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their preferences"
    ON user_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their preferences"
    ON user_preferences FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 4. Documents & Document Chunks Policies (Zero Vector Leakage)
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view their own documents"
    ON documents FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents"
    ON documents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
    ON documents FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
    ON documents FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own document chunks"
    ON document_chunks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own document chunks"
    ON document_chunks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own document chunks"
    ON document_chunks FOR DELETE
    USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 5. Processing Jobs Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view their own processing jobs"
    ON processing_jobs FOR SELECT
    USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 6. Conversations & Messages Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view their own conversations"
    ON conversations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own conversations"
    ON conversations FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view messages in their conversations"
    ON messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = messages.conversation_id
            AND conversations.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages in their conversations"
    ON messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = messages.conversation_id
            AND conversations.user_id = auth.uid()
        )
    );

-- ----------------------------------------------------------------------------
-- 7. Public Catalogs (Schemes, Opportunities, Courses, Data Sources)
-- ----------------------------------------------------------------------------
CREATE POLICY "Public read active schemes"
    ON schemes FOR SELECT
    USING (status = 'active');

CREATE POLICY "Public read scheme eligibility rules"
    ON scheme_eligibility_rules FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM schemes
            WHERE schemes.id = scheme_eligibility_rules.scheme_id
            AND schemes.status = 'active'
        )
    );

CREATE POLICY "Public read active opportunities"
    ON opportunities FOR SELECT
    USING (status = 'active');

CREATE POLICY "Public read courses"
    ON courses FOR SELECT
    USING (true);

CREATE POLICY "Public read course materials"
    ON course_materials FOR SELECT
    USING (true);

CREATE POLICY "Public read active data sources"
    ON data_sources FOR SELECT
    USING (is_active = true);

-- ----------------------------------------------------------------------------
-- 8. User Learning, Skills, Applications, Recommendations & Notifications
-- ----------------------------------------------------------------------------
CREATE POLICY "Users manage their learning progress"
    ON learning_progress FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage their quiz attempts"
    ON quiz_attempts FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage their skills"
    ON user_skills FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage their applications"
    ON applications FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view their recommendations"
    ON recommendations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users manage their notifications"
    ON notifications FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view their audit events"
    ON audit_events FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert audit events"
    ON audit_events FOR INSERT
    WITH CHECK (auth.uid() = user_id);
