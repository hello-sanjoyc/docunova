-- =====================================================================
-- DocuNova — final Postgres schema
--
-- Part 1: DROP statements for tables / enum types / indexes that are NOT
--         used by the backend code today. Safe to run against a fresh or
--         populated database (uses IF EXISTS / CASCADE).
-- Part 2: CREATE the tables / enums / indexes that ARE required.
--
-- Dialect: PostgreSQL 13+. Requires pgcrypto (gen_random_uuid).
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------
-- Part 1. Drop unused objects
-- ---------------------------------------------------------------------

-- Unused tables (dropping also removes their indexes and FKs).
DROP TABLE IF EXISTS audit_logs                CASCADE;
DROP TABLE IF EXISTS notifications             CASCADE;
DROP TABLE IF EXISTS analytics_exports         CASCADE;
DROP TABLE IF EXISTS analytics_events          CASCADE;
DROP TABLE IF EXISTS organization_usage_daily  CASCADE;
DROP TABLE IF EXISTS organization_billing      CASCADE;
DROP TABLE IF EXISTS share_access_logs         CASCADE;
DROP TABLE IF EXISTS document_shares           CASCADE;
DROP TABLE IF EXISTS document_permissions      CASCADE;
DROP TABLE IF EXISTS search_suggestions_cache  CASCADE;
DROP TABLE IF EXISTS ai_chat_messages          CASCADE;
DROP TABLE IF EXISTS ai_chat_threads           CASCADE;
DROP TABLE IF EXISTS extracted_entities        CASCADE;
DROP TABLE IF EXISTS document_tags             CASCADE;
DROP TABLE IF EXISTS tags                      CASCADE;
DROP TABLE IF EXISTS document_favorites        CASCADE;
DROP TABLE IF EXISTS auth_audit_logs           CASCADE;
DROP TABLE IF EXISTS role_permissions          CASCADE;

-- Unused enum types.
DROP TYPE IF EXISTS analytics_export_status;
DROP TYPE IF EXISTS share_status;
DROP TYPE IF EXISTS share_type;
DROP TYPE IF EXISTS permission_level;


-- ---------------------------------------------------------------------
-- Part 2. Required enum types
-- ---------------------------------------------------------------------

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('active', 'invited', 'suspended', 'deleted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE auth_provider AS ENUM ('local', 'google', 'microsoft', 'github');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE session_status AS ENUM ('active', 'revoked', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE document_status AS ENUM ('uploaded', 'processing', 'ready', 'failed', 'archived', 'trashed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE ai_job_type AS ENUM ('ocr', 'classify', 'extract', 'summarize', 'full_process');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE ai_job_status AS ENUM ('queued', 'running', 'completed', 'failed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE member_status AS ENUM ('invited', 'active', 'disabled', 'removed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE organization_invitation_status AS ENUM ('pending', 'accepted', 'revoked', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ---------------------------------------------------------------------
-- Part 3. Required tables
-- Order: tables with no FKs first, then dependents. A self-referential
-- and a circular FK (documents.current_version_id ↔ document_versions)
-- are added via ALTER at the end.
-- ---------------------------------------------------------------------

-- organizations ------------------------------------------------------
CREATE TABLE IF NOT EXISTS organizations (
    id                 BIGSERIAL      PRIMARY KEY,
    uuid               UUID           NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    name               VARCHAR(255)   NOT NULL,
    slug               VARCHAR(150)   NOT NULL UNIQUE,
    logo_url           TEXT,
    website            TEXT,
    timezone           VARCHAR(100)   NOT NULL DEFAULT 'UTC',
    language_code      VARCHAR(10)    NOT NULL DEFAULT 'en',
    plan_code          VARCHAR(50),
    billing_email      VARCHAR(255),
    max_storage_bytes  BIGINT         NOT NULL DEFAULT 0,
    max_users          INTEGER        NOT NULL DEFAULT 0,
    settings_json      JSONB          NOT NULL DEFAULT '{}'::jsonb,
    created_at         TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

-- users --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id                  BIGSERIAL      PRIMARY KEY,
    uuid                UUID           NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    organization_id     BIGINT         NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    email               VARCHAR(255)   NOT NULL,
    password_hash       TEXT,
    auth_provider       auth_provider  NOT NULL DEFAULT 'local',
    provider_user_id    VARCHAR(255),
    first_name          VARCHAR(120),
    last_name           VARCHAR(120),
    full_name           VARCHAR(255),
    phone               VARCHAR(30),
    avatar_url          TEXT,
    email_verified_at   TIMESTAMPTZ(6),
    two_factor_enabled  BOOLEAN        NOT NULL DEFAULT false,
    two_factor_secret   TEXT,
    status              user_status    NOT NULL DEFAULT 'active',
    last_login_at       TIMESTAMPTZ(6),
    last_activity_at    TIMESTAMPTZ(6),
    created_at          TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ(6),
    CONSTRAINT uq_users_org_email UNIQUE (organization_id, email)
);
CREATE INDEX IF NOT EXISTS idx_users_org_email   ON users (organization_id, email);
CREATE INDEX IF NOT EXISTS idx_users_status      ON users (status);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at  ON users (deleted_at);

-- roles --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
    id               BIGSERIAL      PRIMARY KEY,
    uuid             UUID           NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    organization_id  BIGINT         NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name             VARCHAR(100)   NOT NULL,
    code             VARCHAR(100)   NOT NULL,
    is_system        BOOLEAN        NOT NULL DEFAULT false,
    description      TEXT,
    created_at       TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    CONSTRAINT uq_roles_org_code UNIQUE (organization_id, code),
    CONSTRAINT uq_roles_org_name UNIQUE (organization_id, name)
);
CREATE INDEX IF NOT EXISTS idx_roles_org ON roles (organization_id);

-- organization_members ----------------------------------------------
CREATE TABLE IF NOT EXISTS organization_members (
    id               BIGSERIAL      PRIMARY KEY,
    uuid             UUID           NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    organization_id  BIGINT         NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id          BIGINT         NOT NULL REFERENCES users(id)         ON DELETE CASCADE,
    role_id          BIGINT         REFERENCES roles(id) ON DELETE SET NULL,
    title            VARCHAR(150),
    status           member_status  NOT NULL DEFAULT 'active',
    invited_by       BIGINT         REFERENCES users(id) ON DELETE SET NULL,
    invited_at       TIMESTAMPTZ(6),
    joined_at        TIMESTAMPTZ(6),
    created_at       TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    CONSTRAINT uq_org_member UNIQUE (organization_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_org_members_org  ON organization_members (organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members (user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON organization_members (role_id);

-- organization_invitations ------------------------------------------
CREATE TABLE IF NOT EXISTS organization_invitations (
    id               BIGSERIAL                      PRIMARY KEY,
    uuid             UUID                           NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    organization_id  BIGINT                         NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email            VARCHAR(255)                   NOT NULL,
    role_code        VARCHAR(100),
    token_hash       TEXT                           NOT NULL,
    status           organization_invitation_status NOT NULL DEFAULT 'pending',
    invited_by       BIGINT                         REFERENCES users(id) ON DELETE SET NULL,
    accepted_by      BIGINT                         REFERENCES users(id) ON DELETE SET NULL,
    expires_at       TIMESTAMPTZ(6)                 NOT NULL,
    accepted_at      TIMESTAMPTZ(6),
    revoked_at       TIMESTAMPTZ(6),
    created_at       TIMESTAMPTZ(6)                 NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ(6)                 NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_org_invitations_org_status ON organization_invitations (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_org_invitations_org_email  ON organization_invitations (organization_id, email);
CREATE INDEX IF NOT EXISTS idx_org_invitations_token      ON organization_invitations (token_hash);

-- user_sessions ------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_sessions (
    id                   BIGSERIAL      PRIMARY KEY,
    uuid                 UUID           NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    user_id              BIGINT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash   TEXT           NOT NULL,
    device_name          VARCHAR(255),
    device_type          VARCHAR(50),
    browser              VARCHAR(100),
    os                   VARCHAR(100),
    ip_address           INET,
    user_agent           TEXT,
    status               session_status NOT NULL DEFAULT 'active',
    last_seen_at         TIMESTAMPTZ(6),
    expires_at           TIMESTAMPTZ(6) NOT NULL,
    revoked_at           TIMESTAMPTZ(6),
    created_at           TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_status  ON user_sessions (user_id, status);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at   ON user_sessions (expires_at);

-- password_reset_tokens ---------------------------------------------
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id          BIGSERIAL      PRIMARY KEY,
    user_id     BIGINT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT           NOT NULL,
    expires_at  TIMESTAMPTZ(6) NOT NULL,
    used_at     TIMESTAMPTZ(6),
    created_at  TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset_tokens (user_id, created_at DESC);

-- email_verification_tokens -----------------------------------------
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id           BIGSERIAL      PRIMARY KEY,
    user_id      BIGINT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash   TEXT           NOT NULL,
    expires_at   TIMESTAMPTZ(6) NOT NULL,
    verified_at  TIMESTAMPTZ(6),
    created_at   TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_email_verification_user ON email_verification_tokens (user_id, created_at DESC);

-- folders ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS folders (
    id               BIGSERIAL      PRIMARY KEY,
    uuid             UUID           NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    organization_id  BIGINT         NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    parent_id        BIGINT         REFERENCES folders(id) ON DELETE CASCADE,
    created_by       BIGINT         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    name             VARCHAR(255)   NOT NULL,
    path_cache       TEXT,
    color            VARCHAR(20),
    description      TEXT,
    created_at       TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    deleted_at       TIMESTAMPTZ(6),
    deleted_by       BIGINT         REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_folders_org_parent  ON folders (organization_id, parent_id);
CREATE INDEX IF NOT EXISTS idx_folders_deleted_at  ON folders (deleted_at);

-- documents ----------------------------------------------------------
-- current_version_id FK is added later (circular dependency with document_versions).
CREATE TABLE IF NOT EXISTS documents (
    id                      BIGSERIAL        PRIMARY KEY,
    uuid                    UUID             NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    organization_id         BIGINT           NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    folder_id               BIGINT           REFERENCES folders(id) ON DELETE SET NULL,
    owner_user_id           BIGINT           NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    current_version_id      BIGINT,
    title                   VARCHAR(500)     NOT NULL,
    original_filename       VARCHAR(500)     NOT NULL,
    storage_key             TEXT             NOT NULL,
    preview_storage_key     TEXT,
    thumbnail_storage_key   TEXT,
    mime_type               VARCHAR(150)     NOT NULL,
    file_extension          VARCHAR(20),
    file_size_bytes         BIGINT           NOT NULL,
    checksum_sha256         CHAR(64),
    page_count              INTEGER,
    language_code           VARCHAR(10),
    status                  document_status  NOT NULL DEFAULT 'uploaded',
    source_type             VARCHAR(50)      NOT NULL DEFAULT 'upload',
    is_favorite_count       INTEGER          NOT NULL DEFAULT 0,
    metadata_json           JSONB            NOT NULL DEFAULT '{}'::jsonb,
    uploaded_at             TIMESTAMPTZ(6)   NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ(6)   NOT NULL DEFAULT now(),
    deleted_at              TIMESTAMPTZ(6),
    deleted_by              BIGINT           REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_documents_org_folder       ON documents (organization_id, folder_id);
CREATE INDEX IF NOT EXISTS idx_documents_owner            ON documents (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_documents_status           ON documents (status);
CREATE INDEX IF NOT EXISTS idx_documents_deleted_at       ON documents (deleted_at);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_at      ON documents (uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_current_version  ON documents (current_version_id);
CREATE INDEX IF NOT EXISTS idx_documents_metadata_gin     ON documents USING GIN (metadata_json);

-- document_versions -------------------------------------------------
CREATE TABLE IF NOT EXISTS document_versions (
    id                      BIGSERIAL      PRIMARY KEY,
    uuid                    UUID           NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    document_id             BIGINT         NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    version_number          INTEGER        NOT NULL,
    storage_key             TEXT           NOT NULL,
    preview_storage_key     TEXT,
    thumbnail_storage_key   TEXT,
    file_size_bytes         BIGINT         NOT NULL,
    mime_type               VARCHAR(150)   NOT NULL,
    checksum_sha256         CHAR(64),
    page_count              INTEGER,
    created_by              BIGINT         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    version_note            TEXT,
    created_at              TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    CONSTRAINT uq_document_version UNIQUE (document_id, version_number)
);
CREATE INDEX IF NOT EXISTS idx_document_versions_doc_created_at ON document_versions (document_id, created_at DESC);

-- Close the circular FK.
ALTER TABLE documents
    DROP CONSTRAINT IF EXISTS fk_documents_current_version;
ALTER TABLE documents
    ADD CONSTRAINT fk_documents_current_version
    FOREIGN KEY (current_version_id) REFERENCES document_versions(id);

-- document_access_history -------------------------------------------
CREATE TABLE IF NOT EXISTS document_access_history (
    id           BIGSERIAL      PRIMARY KEY,
    document_id  BIGINT         NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id      BIGINT         NOT NULL REFERENCES users(id)     ON DELETE CASCADE,
    accessed_at  TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    access_type  VARCHAR(50)    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_doc_access_user_time ON document_access_history (user_id, accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_doc_access_doc_time  ON document_access_history (document_id, accessed_at DESC);

-- ai_jobs ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_jobs (
    id                BIGSERIAL      PRIMARY KEY,
    uuid              UUID           NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    organization_id   BIGINT         NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    document_id       BIGINT         NOT NULL REFERENCES documents(id)     ON DELETE CASCADE,
    triggered_by      BIGINT         REFERENCES users(id) ON DELETE SET NULL,
    job_type          ai_job_type    NOT NULL,
    status            ai_job_status  NOT NULL DEFAULT 'queued',
    provider_name     VARCHAR(100),
    model_name        VARCHAR(150),
    priority          SMALLINT       NOT NULL DEFAULT 5,
    progress_percent  NUMERIC(5, 2)  NOT NULL DEFAULT 0,
    input_json        JSONB          NOT NULL DEFAULT '{}'::jsonb,
    output_json       JSONB          NOT NULL DEFAULT '{}'::jsonb,
    error_message     TEXT,
    started_at        TIMESTAMPTZ(6),
    completed_at      TIMESTAMPTZ(6),
    created_at        TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_doc         ON ai_jobs (document_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_org_status  ON ai_jobs (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_status      ON ai_jobs (status);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_type        ON ai_jobs (job_type);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_input_gin   ON ai_jobs USING GIN (input_json);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_output_gin  ON ai_jobs USING GIN (output_json);

-- document_ocr_results ----------------------------------------------
CREATE TABLE IF NOT EXISTS document_ocr_results (
    id                 BIGSERIAL      PRIMARY KEY,
    document_id        BIGINT         NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    ai_job_id          BIGINT         REFERENCES ai_jobs(id) ON DELETE SET NULL,
    extracted_text     TEXT,
    page_text_json     JSONB          NOT NULL DEFAULT '[]'::jsonb,
    confidence_score   NUMERIC(5, 2),
    language_detected  VARCHAR(20),
    created_at         TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    CONSTRAINT uq_document_ocr_result UNIQUE (document_id)
);
CREATE INDEX IF NOT EXISTS idx_ocr_doc ON document_ocr_results (document_id);

-- document_ai_summaries ---------------------------------------------
CREATE TABLE IF NOT EXISTS document_ai_summaries (
    id                BIGSERIAL      PRIMARY KEY,
    document_id       BIGINT         NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    ai_job_id         BIGINT         REFERENCES ai_jobs(id) ON DELETE SET NULL,
    summary_type      VARCHAR(50)    NOT NULL DEFAULT 'general',
    summary_text      TEXT           NOT NULL,
    key_points_json   JSONB          NOT NULL DEFAULT '[]'::jsonb,
    confidence_score  NUMERIC(5, 2),
    provider_name     VARCHAR(100),
    model_name        VARCHAR(150),
    created_at        TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_summaries_doc_type ON document_ai_summaries (document_id, summary_type);

-- document_classifications ------------------------------------------
CREATE TABLE IF NOT EXISTS document_classifications (
    id                BIGSERIAL      PRIMARY KEY,
    document_id       BIGINT         NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    ai_job_id         BIGINT         REFERENCES ai_jobs(id) ON DELETE SET NULL,
    class_label       VARCHAR(150)   NOT NULL,
    confidence_score  NUMERIC(5, 2)  NOT NULL,
    is_primary        BOOLEAN        NOT NULL DEFAULT false,
    created_at        TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_classifications_doc     ON document_classifications (document_id);
CREATE INDEX IF NOT EXISTS idx_classifications_primary ON document_classifications (document_id, is_primary);

-- search_history -----------------------------------------------------
CREATE TABLE IF NOT EXISTS search_history (
    id               BIGSERIAL      PRIMARY KEY,
    organization_id  BIGINT         NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id          BIGINT         NOT NULL REFERENCES users(id)         ON DELETE CASCADE,
    query_text       TEXT           NOT NULL,
    query_type       VARCHAR(30)    NOT NULL DEFAULT 'basic',
    filters_json     JSONB          NOT NULL DEFAULT '{}'::jsonb,
    result_count     INTEGER,
    created_at       TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_search_history_user_time ON search_history (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_org_time  ON search_history (organization_id, created_at DESC);
