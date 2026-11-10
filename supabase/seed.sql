-- ============================================================================
-- AccessAI - Authoritative Initial Seed Dataset
-- File: supabase/seed.sql
-- All IDs are valid RFC 4122 hexadecimal UUIDs
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. DATA SOURCES
-- ----------------------------------------------------------------------------
INSERT INTO data_sources (id, name, source_url, source_type, authority_level, last_verified_at, is_active)
VALUES
    ('d1000000-0000-0000-0000-000000000001', 'myScheme - Government of India', 'https://www.myscheme.gov.in', 'government_portal', 'official', NOW(), true),
    ('d1000000-0000-0000-0000-000000000002', 'National Scholarship Portal (NSP)', 'https://scholarships.gov.in', 'government_portal', 'official', NOW(), true),
    ('d1000000-0000-0000-0000-000000000003', 'JnanaBhumi - Andhra Pradesh State Portal', 'https://jnanabhumi.ap.gov.in', 'government_portal', 'official', NOW(), true),
    ('d1000000-0000-0000-0000-000000000004', 'AICTE Portal', 'https://www.aicte-india.org', 'government_portal', 'official', NOW(), true)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. GOVERNMENT SCHEMES
-- ----------------------------------------------------------------------------
-- Scheme A: PM-KISAN (Central)
INSERT INTO schemes (id, name, description, official_url, source_id, state_code, eligibility, required_documents, application_deadline, status)
VALUES (
    'a1000000-0000-0000-0000-000000000001',
    'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
    'Financial benefit of ₹6,000 per year in three equal installments to small and marginal farmer families with cultivable land.',
    'https://pmkisan.gov.in',
    'd1000000-0000-0000-0000-000000000001',
    NULL, -- Central (All India)
    '{"category": "farmer", "landholding": "small_marginal", "exclusion": "institutional_landholders"}',
    '["Aadhaar Card", "Land Ownership Record (Khata/Khasra)", "Bank Account Passbook (Aadhaar linked)", "Active Mobile Number"]'::jsonb,
    '2026-12-31T23:59:59Z',
    'active'
) ON CONFLICT (id) DO NOTHING;

-- Scheme B: Jagananna Vidya Deevena (Andhra Pradesh State)
INSERT INTO schemes (id, name, description, official_url, source_id, state_code, eligibility, required_documents, application_deadline, status)
VALUES (
    'a1000000-0000-0000-0000-000000000002',
    'Jagananna Vidya Deevena (RTF)',
    'Full fee reimbursement for students pursuing Polytechnic, ITI, Degree, Engineering, Medicine, and Post-Graduate courses.',
    'https://jnanabhumi.ap.gov.in',
    'd1000000-0000-0000-0000-000000000003',
    'AP',
    '{"state": "Andhra Pradesh", "annual_family_income_max": 250000, "attendance_min": 75, "education_level": ["diploma", "undergraduate", "postgraduate"]}',
    '["Integrated Caste Certificate", "Income Certificate / White Ration Card", "Student Aadhaar Card", "Mother Aadhaar Card & Bank Account", "Admission Allotment Order"]'::jsonb,
    '2026-10-31T23:59:59Z',
    'active'
) ON CONFLICT (id) DO NOTHING;

-- Scheme C: Post Matric Scholarships for Minorities (NSP Central)
INSERT INTO schemes (id, name, description, official_url, source_id, state_code, eligibility, required_documents, application_deadline, status)
VALUES (
    'a1000000-0000-0000-0000-000000000003',
    'Post Matric Scholarships Scheme for Minorities',
    'Scholarship awarded to meritorious students belonging to notified minority communities studying from class 11 to Ph.D.',
    'https://scholarships.gov.in',
    'd1000000-0000-0000-0000-000000000002',
    NULL,
    '{"annual_family_income_max": 200000, "min_marks_percent": 50, "communities": ["Muslim", "Christian", "Sikh", "Buddhist", "Jain", "Parsi"]}',
    '["Community / Minority Certificate", "Income Certificate", "Previous Year Marksheet", "Fee Receipt", "Bank Passbook", "Aadhaar Card"]'::jsonb,
    '2026-11-30T23:59:59Z',
    'active'
) ON CONFLICT (id) DO NOTHING;

-- Scheme D: AICTE Pragati Scholarship for Girls
INSERT INTO schemes (id, name, description, official_url, source_id, state_code, eligibility, required_documents, application_deadline, status)
VALUES (
    'a1000000-0000-0000-0000-000000000004',
    'AICTE Pragati Scholarship for Girl Students',
    '₹50,000 per annum for tuition and contingency to girl students admitted to 1st year of technical degree or diploma courses.',
    'https://www.aicte-india.org/schemes/students-development-schemes/pragati',
    'd1000000-0000-0000-0000-000000000004',
    NULL,
    '{"gender": "female", "annual_family_income_max": 800000, "course_type": "technical", "max_girls_per_family": 2}',
    '["10th / 12th Marksheet", "Admission Allotment Letter to AICTE Approved Institution", "Family Income Certificate (issued by Tehsildar)", "Bank Account Details (Aadhaar linked)"]'::jsonb,
    '2026-12-15T23:59:59Z',
    'active'
) ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. STRUCTURED SCHEME ELIGIBILITY RULES (For Deterministic Evaluation)
-- ----------------------------------------------------------------------------
-- Rules for Jagananna Vidya Deevena
INSERT INTO scheme_eligibility_rules (scheme_id, rule_key, operator, expected_value, is_mandatory, description)
VALUES
    ('a1000000-0000-0000-0000-000000000002', 'state_code', '==', '"AP"'::jsonb, true, 'Citizen must be a resident of Andhra Pradesh'),
    ('a1000000-0000-0000-0000-000000000002', 'annual_family_income', '<=', '250000'::jsonb, true, 'Annual family income must not exceed ₹2,50,000'),
    ('a1000000-0000-0000-0000-000000000002', 'education_level', 'in', '["diploma", "undergraduate", "postgraduate"]'::jsonb, true, 'Must be enrolled in Polytechnic, Degree, or PG');

-- Rules for AICTE Pragati
INSERT INTO scheme_eligibility_rules (scheme_id, rule_key, operator, expected_value, is_mandatory, description)
VALUES
    ('a1000000-0000-0000-0000-000000000004', 'gender', '==', '"female"'::jsonb, true, 'Applicant must be a female student'),
    ('a1000000-0000-0000-0000-000000000004', 'annual_family_income', '<=', '800000'::jsonb, true, 'Annual family income must not exceed ₹8,00,000');

-- ----------------------------------------------------------------------------
-- 4. OPPORTUNITIES (Jobs, Internships, Hackathons)
-- ----------------------------------------------------------------------------
INSERT INTO opportunities (id, title, description, opportunity_type, organization, location, official_url, required_skills, eligibility, deadline, status)
VALUES
    (
        'b1000000-0000-0000-0000-000000000001',
        'AI & Full-Stack Engineering Internship',
        '3-month remote engineering internship building accessibility tools and multilingual AI agents using Python and Next.js.',
        'internship',
        'AssistiveTech Labs India',
        'Remote (India)',
        'https://example.com/careers/ai-intern',
        '["Python", "FastAPI", "React", "TypeScript", "Tailwind CSS"]'::jsonb,
        '{"education_level": ["undergraduate", "graduate"], "graduation_years": [2025, 2026, 2027]}'::jsonb,
        '2026-11-25T23:59:59Z',
        'active'
    ),
    (
        'b1000000-0000-0000-0000-000000000002',
        'Digital India AI Hackathon 2026',
        'National grand challenge to create voice-enabled assistive applications for Indian public services.',
        'hackathon',
        'Ministry of Electronics and Information Technology (MeitY)',
        'Hybrid / New Delhi',
        'https://innovateindia.mygov.in',
        '["Machine Learning", "Python", "Speech Recognition", "OpenAPI"]'::jsonb,
        '{"citizenship": "Indian", "student_or_professional": true}'::jsonb,
        '2026-12-05T23:59:59Z',
        'active'
    ),
    (
        'b1000000-0000-0000-0000-000000000003',
        'Junior Cloud & Backend Engineer',
        'Full-time opening for entry-level backend engineers passionate about building resilient APIs and database pipelines.',
        'job',
        'Bharat Cloud Solutions',
        'Hyderabad / Bengaluru',
        'https://example.com/careers/junior-backend',
        '["Python", "PostgreSQL", "Docker", "REST APIs", "Git"]'::jsonb,
        '{"education_level": ["undergraduate", "graduate"]}'::jsonb,
        '2026-11-30T23:59:59Z',
        'active'
    )
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 5. EDUCATION: STARTER COURSES
-- ----------------------------------------------------------------------------
INSERT INTO courses (id, title, description, language, difficulty_level)
VALUES
    (
        'c1000000-0000-0000-0000-000000000001',
        'Introduction to Python & Data Structures for Beginners',
        'Foundational curriculum covering Python syntax, loops, lists, dictionaries, and problem-solving with bilingual explanations.',
        'en',
        'beginner'
    ),
    (
        'c1000000-0000-0000-0000-000000000002',
        'Web Development Essentials: HTML, CSS & Modern TypeScript',
        'Step-by-step guidance on semantic HTML, accessible UI layouts, and reactive web programming.',
        'en',
        'beginner'
    )
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 6. EDUCATION: COURSE MATERIALS
-- ----------------------------------------------------------------------------
INSERT INTO course_materials (id, course_id, title, content, order_index)
VALUES
    (
        'e1000000-0000-0000-0000-000000000001',
        'c1000000-0000-0000-0000-000000000001',
        'Lesson 1: Python Basics & Variables',
        'Python is a high-level interpreted programming language. Variables in Python are created when assigned a value. Common basic types are int, float, str, and bool.',
        1
    ),
    (
        'e1000000-0000-0000-0000-000000000002',
        'c1000000-0000-0000-0000-000000000001',
        'Lesson 2: Control Flow & Loops',
        'In Python, decisions are made using if, elif, and else statements. Loops can be for-loops for iterating over sequences or while-loops for repeated execution while conditions remain true.',
        2
    ),
    (
        'e1000000-0000-0000-0000-000000000003',
        'c1000000-0000-0000-0000-000000000002',
        'Lesson 1: Semantic HTML & Accessibility',
        'Accessible web applications require semantic tags like <main>, <nav>, <header>, and <button>. Use ARIA labels and live regions when dynamic content updates.',
        1
    )
ON CONFLICT (id) DO NOTHING;
