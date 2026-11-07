-- ============================================================
-- AI Recruitment System - Database Schema (Production Mirror)
-- Generated from live PostgreSQL recruitment_db instance
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name CHARACTER VARYING NOT NULL,
    email CHARACTER VARYING NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role CHARACTER VARYING NOT NULL DEFAULT 'recruiter',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Jobs Table
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recruiter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title CHARACTER VARYING NOT NULL,
    description TEXT,
    mandatory_skills TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
    preferred_skills TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
    min_experience NUMERIC NOT NULL DEFAULT 0,
    education_required CHARACTER VARYING,
    status CHARACTER VARYING NOT NULL DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Candidates Table
CREATE TABLE IF NOT EXISTS candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recruiter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    full_name CHARACTER VARYING,
    email CHARACTER VARYING,
    phone CHARACTER VARYING,
    resume_filename CHARACTER VARYING NOT NULL,
    resume_path TEXT,
    resume_text TEXT,
    processing_status CHARACTER VARYING NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resume_url TEXT,
    resume_public_id TEXT,
    resume_resource_type CHARACTER VARYING,
    skills TEXT[] DEFAULT '{}'::TEXT[],
    education TEXT,
    experience_years NUMERIC,
    experience_summary TEXT,
    source CHARACTER VARYING DEFAULT 'manual',
    gmail_message_id TEXT,
    gmail_attachment_id TEXT
);

-- 4. Candidate Evaluations Table
CREATE TABLE IF NOT EXISTS candidate_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL UNIQUE REFERENCES candidates(id) ON DELETE CASCADE,
    overall_score NUMERIC,
    mandatory_match_score NUMERIC,
    preferred_match_score NUMERIC,
    matched_mandatory_skills TEXT[] DEFAULT '{}'::TEXT[],
    missing_mandatory_skills TEXT[] DEFAULT '{}'::TEXT[],
    matched_preferred_skills TEXT[] DEFAULT '{}'::TEXT[],
    experience_match BOOLEAN,
    education_match BOOLEAN,
    explanation TEXT,
    recommendation CHARACTER VARYING,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Google OAuth Connections Table
CREATE TABLE IF NOT EXISTS google_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recruiter_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    google_email CHARACTER VARYING NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expiry TIMESTAMP WITH TIME ZONE,
    scopes TEXT[],
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_gmail_scan_at TIMESTAMP WITH TIME ZONE
);

-- 6. Google OAuth State Tokens Table
CREATE TABLE IF NOT EXISTS google_oauth_states (
    state_hash TEXT PRIMARY KEY,
    recruiter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Gmail Discovered Attachments Table
CREATE TABLE IF NOT EXISTS gmail_discovered_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recruiter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_id TEXT NOT NULL,
    attachment_id TEXT NOT NULL,
    filename CHARACTER VARYING NOT NULL,
    mime_type CHARACTER VARYING,
    file_size BIGINT,
    sender TEXT,
    subject TEXT,
    email_date TIMESTAMP WITH TIME ZONE,
    status CHARACTER VARYING NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT gmail_discovered_attachments_recruiter_id_message_id_attach_key UNIQUE (recruiter_id, message_id, attachment_id)
);

-- Indexes for Fast Lookups and Joins
CREATE INDEX IF NOT EXISTS idx_jobs_recruiter ON jobs(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_candidates_job ON candidates(job_id);
CREATE INDEX IF NOT EXISTS idx_candidates_recruiter ON candidates(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(processing_status);
CREATE INDEX IF NOT EXISTS idx_evaluations_score ON candidate_evaluations(overall_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_gmail_attachments_recruiter ON gmail_discovered_attachments(recruiter_id);
