-- =====================================================================
-- DocuNova PostgreSQL DDL dump for postgres
-- Generated at 2026-05-02T14:40:06.240Z
-- Schemas: public
-- =====================================================================


-- Server

-- PostgreSQL 17.6 on aarch64-unknown-linux-gnu, compiled by gcc (GCC) 15.2.0, 64-bit

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE "public"."ai_job_status" AS ENUM ('queued', 'running', 'completed', 'failed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "public"."ai_job_type" AS ENUM ('ocr', 'classify', 'extract', 'summarize', 'full_process');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "public"."auth_provider" AS ENUM ('local', 'google', 'microsoft', 'github', 'apple', 'linkedin', 'facebook');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "public"."billing_cycle" AS ENUM ('monthly', 'yearly');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "public"."document_status" AS ENUM ('uploaded', 'processing', 'ready', 'failed', 'archived', 'trashed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "public"."limit_period" AS ENUM ('lifetime', 'monthly', 'yearly', 'none');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "public"."member_status" AS ENUM ('invited', 'active', 'disabled', 'removed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "public"."ocr_status" AS ENUM ('pending', 'processing', 'completed', 'failed', 'skipped');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "public"."organization_invitation_status" AS ENUM ('pending', 'accepted', 'revoked', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "public"."session_status" AS ENUM ('active', 'revoked', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "public"."subscription_status" AS ENUM ('active', 'trialing', 'cancelled', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "public"."user_status" AS ENUM ('active', 'invited', 'suspended', 'deleted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE SEQUENCE IF NOT EXISTS "public"."ai_jobs_id_seq"
    AS bigint
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS "public"."document_access_history_id_seq"
    AS bigint
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS "public"."document_ai_summaries_id_seq"
    AS bigint
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS "public"."document_classifications_id_seq"
    AS bigint
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS "public"."document_ocr_results_id_seq"
    AS bigint
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS "public"."document_versions_id_seq"
    AS bigint
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS "public"."documents_id_seq"
    AS bigint
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS "public"."email_verification_tokens_id_seq"
    AS bigint
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS "public"."features_id_seq"
    AS bigint
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS "public"."folders_id_seq"
    AS bigint
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS "public"."oauth_callback_states_id_seq"
    AS bigint
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS "public"."organization_invitations_id_seq"
    AS bigint
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS "public"."organization_members_id_seq"
    AS bigint
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS "public"."organizations_id_seq"
    AS bigint
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS "public"."password_reset_tokens_id_seq"
    AS bigint
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS "public"."plan_features_id_seq"
    AS bigint
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS "public"."plan_limits_id_seq"
    AS bigint
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS "public"."plan_prices_id_seq"
    AS bigint
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS "public"."plans_id_seq"
    AS bigint
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS "public"."regions_id_seq"
    AS bigint
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS "public"."roles_id_seq"
    AS bigint
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS "public"."search_history_id_seq"
    AS bigint
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS "public"."subscriptions_id_seq"
    AS bigint
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS "public"."usage_records_id_seq"
    AS bigint
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS "public"."user_oauth_accounts_id_seq"
    AS bigint
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS "public"."user_sessions_id_seq"
    AS bigint
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS "public"."users_id_seq"
    AS bigint
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    CACHE 1;

CREATE TABLE IF NOT EXISTS "public"."ai_jobs" (
    "id" bigint DEFAULT nextval('ai_jobs_id_seq'::regclass) NOT NULL,
    "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
    "organization_id" bigint NOT NULL,
    "document_id" bigint NOT NULL,
    "triggered_by" bigint,
    "job_type" ai_job_type NOT NULL,
    "status" ai_job_status DEFAULT 'queued'::ai_job_status NOT NULL,
    "provider_name" character varying(100),
    "model_name" character varying(150),
    "priority" smallint DEFAULT 5 NOT NULL,
    "progress_percent" numeric(5,2) DEFAULT 0 NOT NULL,
    "input_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "output_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "error_message" text,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."document_access_history" (
    "id" bigint DEFAULT nextval('document_access_history_id_seq'::regclass) NOT NULL,
    "document_id" bigint NOT NULL,
    "user_id" bigint NOT NULL,
    "accessed_at" timestamp with time zone DEFAULT now() NOT NULL,
    "access_type" character varying(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."document_ai_summaries" (
    "id" bigint DEFAULT nextval('document_ai_summaries_id_seq'::regclass) NOT NULL,
    "document_id" bigint NOT NULL,
    "ai_job_id" bigint,
    "summary_type" character varying(50) DEFAULT 'general'::character varying NOT NULL,
    "summary_text" text NOT NULL,
    "key_points_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "confidence_score" numeric(5,2),
    "provider_name" character varying(100),
    "model_name" character varying(150),
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."document_classifications" (
    "id" bigint DEFAULT nextval('document_classifications_id_seq'::regclass) NOT NULL,
    "document_id" bigint NOT NULL,
    "ai_job_id" bigint,
    "class_label" character varying(150) NOT NULL,
    "confidence_score" numeric(5,2) NOT NULL,
    "is_primary" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."document_ocr_results" (
    "id" bigint DEFAULT nextval('document_ocr_results_id_seq'::regclass) NOT NULL,
    "document_id" bigint NOT NULL,
    "ai_job_id" bigint,
    "extracted_text" text,
    "page_text_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "confidence_score" numeric(5,2),
    "language_detected" character varying(20),
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "ocr_status" ocr_status DEFAULT 'pending'::ocr_status NOT NULL,
    "ocr_method" character varying(50)
);

CREATE TABLE IF NOT EXISTS "public"."document_versions" (
    "id" bigint DEFAULT nextval('document_versions_id_seq'::regclass) NOT NULL,
    "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
    "document_id" bigint NOT NULL,
    "version_number" integer NOT NULL,
    "storage_key" text NOT NULL,
    "preview_storage_key" text,
    "thumbnail_storage_key" text,
    "file_size_bytes" bigint NOT NULL,
    "mime_type" character varying(150) NOT NULL,
    "checksum_sha256" character(64),
    "page_count" integer,
    "created_by" bigint NOT NULL,
    "version_note" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."documents" (
    "id" bigint DEFAULT nextval('documents_id_seq'::regclass) NOT NULL,
    "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
    "organization_id" bigint NOT NULL,
    "folder_id" bigint,
    "owner_user_id" bigint NOT NULL,
    "current_version_id" bigint,
    "title" character varying(500) NOT NULL,
    "original_filename" character varying(500) NOT NULL,
    "storage_key" text NOT NULL,
    "preview_storage_key" text,
    "thumbnail_storage_key" text,
    "mime_type" character varying(150) NOT NULL,
    "file_extension" character varying(20),
    "file_size_bytes" bigint NOT NULL,
    "checksum_sha256" character(64),
    "page_count" integer,
    "language_code" character varying(10),
    "status" document_status DEFAULT 'uploaded'::document_status NOT NULL,
    "source_type" character varying(50) DEFAULT 'upload'::character varying NOT NULL,
    "is_favorite_count" integer DEFAULT 0 NOT NULL,
    "metadata_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    "deleted_by" bigint
);

CREATE TABLE IF NOT EXISTS "public"."email_verification_tokens" (
    "id" bigint DEFAULT nextval('email_verification_tokens_id_seq'::regclass) NOT NULL,
    "user_id" bigint NOT NULL,
    "token_hash" text NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "verified_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."features" (
    "id" bigint DEFAULT nextval('features_id_seq'::regclass) NOT NULL,
    "key" character varying(150) NOT NULL,
    "name" character varying(150) NOT NULL,
    "description" text,
    "created_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(6) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."folders" (
    "id" bigint DEFAULT nextval('folders_id_seq'::regclass) NOT NULL,
    "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
    "organization_id" bigint NOT NULL,
    "parent_id" bigint,
    "created_by" bigint NOT NULL,
    "name" character varying(255) NOT NULL,
    "path_cache" text,
    "color" character varying(20),
    "description" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    "deleted_by" bigint
);

CREATE TABLE IF NOT EXISTS "public"."oauth_callback_states" (
    "id" bigint DEFAULT nextval('oauth_callback_states_id_seq'::regclass) NOT NULL,
    "provider" auth_provider NOT NULL,
    "state_hash" character(64) NOT NULL,
    "code_verifier_hash" character(64),
    "source" character varying(30) DEFAULT 'login'::character varying NOT NULL,
    "target_path" text,
    "redirect_uri" text NOT NULL,
    "ip_address" inet,
    "user_agent" text,
    "metadata_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "consumed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."organization_invitations" (
    "id" bigint DEFAULT nextval('organization_invitations_id_seq'::regclass) NOT NULL,
    "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
    "organization_id" bigint NOT NULL,
    "email" character varying(255) NOT NULL,
    "role_code" character varying(100),
    "token_hash" text NOT NULL,
    "status" organization_invitation_status DEFAULT 'pending'::organization_invitation_status NOT NULL,
    "invited_by" bigint,
    "accepted_by" bigint,
    "expires_at" timestamp(6) with time zone NOT NULL,
    "accepted_at" timestamp(6) with time zone,
    "revoked_at" timestamp(6) with time zone,
    "created_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(6) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."organization_members" (
    "id" bigint DEFAULT nextval('organization_members_id_seq'::regclass) NOT NULL,
    "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
    "organization_id" bigint NOT NULL,
    "user_id" bigint NOT NULL,
    "role_id" bigint,
    "title" character varying(150),
    "status" member_status DEFAULT 'active'::member_status NOT NULL,
    "invited_by" bigint,
    "invited_at" timestamp with time zone,
    "joined_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" bigint DEFAULT nextval('organizations_id_seq'::regclass) NOT NULL,
    "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
    "name" character varying(255) NOT NULL,
    "slug" character varying(150) NOT NULL,
    "logo_url" text,
    "website" text,
    "timezone" character varying(100) DEFAULT 'UTC'::character varying NOT NULL,
    "language_code" character varying(10) DEFAULT 'en'::character varying NOT NULL,
    "plan_code" character varying(50),
    "billing_email" character varying(255),
    "max_storage_bytes" bigint DEFAULT 0 NOT NULL,
    "max_users" integer DEFAULT 0 NOT NULL,
    "settings_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."password_reset_tokens" (
    "id" bigint DEFAULT nextval('password_reset_tokens_id_seq'::regclass) NOT NULL,
    "user_id" bigint NOT NULL,
    "token_hash" text NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "used_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."plan_features" (
    "id" bigint DEFAULT nextval('plan_features_id_seq'::regclass) NOT NULL,
    "plan_id" bigint NOT NULL,
    "feature_id" bigint NOT NULL,
    "included" boolean DEFAULT true NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."plan_limits" (
    "id" bigint DEFAULT nextval('plan_limits_id_seq'::regclass) NOT NULL,
    "plan_id" bigint NOT NULL,
    "key" character varying(150) NOT NULL,
    "value" numeric(18,4) NOT NULL,
    "period" limit_period DEFAULT 'none'::limit_period NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."plan_prices" (
    "id" bigint DEFAULT nextval('plan_prices_id_seq'::regclass) NOT NULL,
    "plan_id" bigint NOT NULL,
    "region_code" character varying(20) NOT NULL,
    "currency_code" character varying(10) NOT NULL,
    "monthly_price" numeric(18,4) DEFAULT 0 NOT NULL,
    "yearly_price" numeric(18,4) DEFAULT 0 NOT NULL,
    "extra_page_price" numeric(18,4) DEFAULT 0 NOT NULL,
    "extra_ocr_page_price" numeric(18,4) DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(6) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."plans" (
    "id" bigint DEFAULT nextval('plans_id_seq'::regclass) NOT NULL,
    "slug" character varying(100) NOT NULL,
    "name" character varying(150) NOT NULL,
    "description" text,
    "is_active" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(6) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."regions" (
    "id" bigint DEFAULT nextval('regions_id_seq'::regclass) NOT NULL,
    "code" character varying(20) NOT NULL,
    "name" character varying(150) NOT NULL,
    "currency_code" character varying(10) NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" bigint DEFAULT nextval('roles_id_seq'::regclass) NOT NULL,
    "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
    "name" character varying(100) NOT NULL,
    "code" character varying(100) NOT NULL,
    "is_system" boolean DEFAULT false NOT NULL,
    "description" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."search_history" (
    "id" bigint DEFAULT nextval('search_history_id_seq'::regclass) NOT NULL,
    "organization_id" bigint NOT NULL,
    "user_id" bigint NOT NULL,
    "query_text" text NOT NULL,
    "query_type" character varying(30) DEFAULT 'basic'::character varying NOT NULL,
    "filters_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "result_count" integer,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" bigint DEFAULT nextval('subscriptions_id_seq'::regclass) NOT NULL,
    "user_id" bigint NOT NULL,
    "plan_id" bigint NOT NULL,
    "region_code" character varying(20) NOT NULL,
    "status" subscription_status DEFAULT 'active'::subscription_status NOT NULL,
    "billing_cycle" billing_cycle NOT NULL,
    "started_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
    "current_period_start" timestamp(6) with time zone NOT NULL,
    "current_period_end" timestamp(6) with time zone NOT NULL,
    "cancelled_at" timestamp(6) with time zone,
    "created_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(6) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."usage_records" (
    "id" bigint DEFAULT nextval('usage_records_id_seq'::regclass) NOT NULL,
    "user_id" bigint NOT NULL,
    "subscription_id" bigint,
    "document_id" bigint,
    "pages_used" integer DEFAULT 0 NOT NULL,
    "ocr_pages_used" integer DEFAULT 0 NOT NULL,
    "tokens_used" integer,
    "usage_month" date NOT NULL,
    "created_at" timestamp(6) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."user_oauth_accounts" (
    "id" bigint DEFAULT nextval('user_oauth_accounts_id_seq'::regclass) NOT NULL,
    "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
    "user_id" bigint NOT NULL,
    "provider" auth_provider NOT NULL,
    "provider_user_id" character varying(255) NOT NULL,
    "provider_email" character varying(255),
    "scope" text,
    "access_token_encrypted" text,
    "refresh_token_encrypted" text,
    "token_expires_at" timestamp with time zone,
    "profile_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "last_login_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."user_sessions" (
    "id" bigint DEFAULT nextval('user_sessions_id_seq'::regclass) NOT NULL,
    "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
    "user_id" bigint NOT NULL,
    "refresh_token_hash" text NOT NULL,
    "device_name" character varying(255),
    "device_type" character varying(50),
    "browser" character varying(100),
    "os" character varying(100),
    "ip_address" character varying(45),
    "user_agent" text,
    "status" session_status DEFAULT 'active'::session_status NOT NULL,
    "last_seen_at" timestamp with time zone,
    "expires_at" timestamp with time zone NOT NULL,
    "revoked_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" bigint DEFAULT nextval('users_id_seq'::regclass) NOT NULL,
    "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
    "organization_id" bigint NOT NULL,
    "email" character varying(255) NOT NULL,
    "password_hash" text,
    "auth_provider" auth_provider DEFAULT 'local'::auth_provider NOT NULL,
    "provider_user_id" character varying(255),
    "first_name" character varying(120),
    "last_name" character varying(120),
    "full_name" character varying(255),
    "phone" character varying(30),
    "avatar_url" text,
    "email_verified_at" timestamp with time zone,
    "two_factor_enabled" boolean DEFAULT false NOT NULL,
    "two_factor_secret" text,
    "status" user_status DEFAULT 'active'::user_status NOT NULL,
    "last_login_at" timestamp with time zone,
    "last_activity_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    "email_digest_enabled" boolean DEFAULT true NOT NULL,
    "security_alerts_enabled" boolean DEFAULT true NOT NULL,
    "country_code" character varying(2),
    "region_code" character varying(20)
);

ALTER SEQUENCE "public"."ai_jobs_id_seq" OWNED BY "public"."ai_jobs"."id";
ALTER SEQUENCE "public"."document_access_history_id_seq" OWNED BY "public"."document_access_history"."id";
ALTER SEQUENCE "public"."document_ai_summaries_id_seq" OWNED BY "public"."document_ai_summaries"."id";
ALTER SEQUENCE "public"."document_classifications_id_seq" OWNED BY "public"."document_classifications"."id";
ALTER SEQUENCE "public"."document_ocr_results_id_seq" OWNED BY "public"."document_ocr_results"."id";
ALTER SEQUENCE "public"."document_versions_id_seq" OWNED BY "public"."document_versions"."id";
ALTER SEQUENCE "public"."documents_id_seq" OWNED BY "public"."documents"."id";
ALTER SEQUENCE "public"."email_verification_tokens_id_seq" OWNED BY "public"."email_verification_tokens"."id";
ALTER SEQUENCE "public"."features_id_seq" OWNED BY "public"."features"."id";
ALTER SEQUENCE "public"."folders_id_seq" OWNED BY "public"."folders"."id";
ALTER SEQUENCE "public"."oauth_callback_states_id_seq" OWNED BY "public"."oauth_callback_states"."id";
ALTER SEQUENCE "public"."organization_invitations_id_seq" OWNED BY "public"."organization_invitations"."id";
ALTER SEQUENCE "public"."organization_members_id_seq" OWNED BY "public"."organization_members"."id";
ALTER SEQUENCE "public"."organizations_id_seq" OWNED BY "public"."organizations"."id";
ALTER SEQUENCE "public"."password_reset_tokens_id_seq" OWNED BY "public"."password_reset_tokens"."id";
ALTER SEQUENCE "public"."plan_features_id_seq" OWNED BY "public"."plan_features"."id";
ALTER SEQUENCE "public"."plan_limits_id_seq" OWNED BY "public"."plan_limits"."id";
ALTER SEQUENCE "public"."plan_prices_id_seq" OWNED BY "public"."plan_prices"."id";
ALTER SEQUENCE "public"."plans_id_seq" OWNED BY "public"."plans"."id";
ALTER SEQUENCE "public"."regions_id_seq" OWNED BY "public"."regions"."id";
ALTER SEQUENCE "public"."roles_id_seq" OWNED BY "public"."roles"."id";
ALTER SEQUENCE "public"."search_history_id_seq" OWNED BY "public"."search_history"."id";
ALTER SEQUENCE "public"."subscriptions_id_seq" OWNED BY "public"."subscriptions"."id";
ALTER SEQUENCE "public"."usage_records_id_seq" OWNED BY "public"."usage_records"."id";
ALTER SEQUENCE "public"."user_oauth_accounts_id_seq" OWNED BY "public"."user_oauth_accounts"."id";
ALTER SEQUENCE "public"."user_sessions_id_seq" OWNED BY "public"."user_sessions"."id";
ALTER SEQUENCE "public"."users_id_seq" OWNED BY "public"."users"."id";

ALTER TABLE ONLY "public"."ai_jobs" ADD CONSTRAINT "ai_jobs_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "public"."document_access_history" ADD CONSTRAINT "document_access_history_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "public"."document_ai_summaries" ADD CONSTRAINT "document_ai_summaries_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "public"."document_classifications" ADD CONSTRAINT "document_classifications_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "public"."document_ocr_results" ADD CONSTRAINT "document_ocr_results_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "public"."document_versions" ADD CONSTRAINT "document_versions_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "public"."documents" ADD CONSTRAINT "documents_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "public"."email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "public"."features" ADD CONSTRAINT "features_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "public"."folders" ADD CONSTRAINT "folders_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "public"."oauth_callback_states" ADD CONSTRAINT "oauth_callback_states_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "public"."organization_invitations" ADD CONSTRAINT "organization_invitations_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "public"."organization_members" ADD CONSTRAINT "organization_members_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "public"."organizations" ADD CONSTRAINT "organizations_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "public"."password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "public"."plan_features" ADD CONSTRAINT "plan_features_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "public"."plan_limits" ADD CONSTRAINT "plan_limits_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "public"."plan_prices" ADD CONSTRAINT "plan_prices_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "public"."plans" ADD CONSTRAINT "plans_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "public"."regions" ADD CONSTRAINT "regions_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "public"."roles" ADD CONSTRAINT "roles_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "public"."search_history" ADD CONSTRAINT "search_history_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "public"."subscriptions" ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "public"."usage_records" ADD CONSTRAINT "usage_records_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "public"."user_oauth_accounts" ADD CONSTRAINT "user_oauth_accounts_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "public"."user_sessions" ADD CONSTRAINT "user_sessions_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "public"."users" ADD CONSTRAINT "users_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "public"."ai_jobs" ADD CONSTRAINT "ai_jobs_uuid_key" UNIQUE (uuid);
ALTER TABLE ONLY "public"."document_ocr_results" ADD CONSTRAINT "uq_document_ocr_result" UNIQUE (document_id);
ALTER TABLE ONLY "public"."document_versions" ADD CONSTRAINT "document_versions_uuid_key" UNIQUE (uuid);
ALTER TABLE ONLY "public"."document_versions" ADD CONSTRAINT "uq_document_version" UNIQUE (document_id, version_number);
ALTER TABLE ONLY "public"."documents" ADD CONSTRAINT "documents_uuid_key" UNIQUE (uuid);
ALTER TABLE ONLY "public"."features" ADD CONSTRAINT "features_key_key" UNIQUE (key);
ALTER TABLE ONLY "public"."folders" ADD CONSTRAINT "folders_uuid_key" UNIQUE (uuid);
ALTER TABLE ONLY "public"."oauth_callback_states" ADD CONSTRAINT "oauth_callback_states_state_hash_key" UNIQUE (state_hash);
ALTER TABLE ONLY "public"."organization_invitations" ADD CONSTRAINT "organization_invitations_uuid_key" UNIQUE (uuid);
ALTER TABLE ONLY "public"."organization_members" ADD CONSTRAINT "organization_members_uuid_key" UNIQUE (uuid);
ALTER TABLE ONLY "public"."organization_members" ADD CONSTRAINT "uq_org_member" UNIQUE (organization_id, user_id);
ALTER TABLE ONLY "public"."organizations" ADD CONSTRAINT "organizations_slug_key" UNIQUE (slug);
ALTER TABLE ONLY "public"."organizations" ADD CONSTRAINT "organizations_uuid_key" UNIQUE (uuid);
ALTER TABLE ONLY "public"."plan_features" ADD CONSTRAINT "uq_plan_features_plan_feature" UNIQUE (plan_id, feature_id);
ALTER TABLE ONLY "public"."plan_limits" ADD CONSTRAINT "uq_plan_limits_plan_key" UNIQUE (plan_id, key);
ALTER TABLE ONLY "public"."plan_prices" ADD CONSTRAINT "uq_plan_prices_plan_region" UNIQUE (plan_id, region_code);
ALTER TABLE ONLY "public"."plans" ADD CONSTRAINT "plans_slug_key" UNIQUE (slug);
ALTER TABLE ONLY "public"."regions" ADD CONSTRAINT "regions_code_key" UNIQUE (code);
ALTER TABLE ONLY "public"."roles" ADD CONSTRAINT "roles_uuid_key" UNIQUE (uuid);
ALTER TABLE ONLY "public"."roles" ADD CONSTRAINT "uq_roles_org_code" UNIQUE (organization_id, code);
ALTER TABLE ONLY "public"."roles" ADD CONSTRAINT "uq_roles_org_name" UNIQUE (organization_id, name);
ALTER TABLE ONLY "public"."user_oauth_accounts" ADD CONSTRAINT "uq_oauth_provider_user" UNIQUE (provider, provider_user_id);
ALTER TABLE ONLY "public"."user_oauth_accounts" ADD CONSTRAINT "uq_user_oauth_provider" UNIQUE (user_id, provider);
ALTER TABLE ONLY "public"."user_oauth_accounts" ADD CONSTRAINT "user_oauth_accounts_uuid_key" UNIQUE (uuid);
ALTER TABLE ONLY "public"."user_sessions" ADD CONSTRAINT "user_sessions_uuid_key" UNIQUE (uuid);
ALTER TABLE ONLY "public"."users" ADD CONSTRAINT "uq_users_org_email" UNIQUE (organization_id, email);
ALTER TABLE ONLY "public"."users" ADD CONSTRAINT "users_uuid_key" UNIQUE (uuid);
ALTER TABLE ONLY "public"."ai_jobs" ADD CONSTRAINT "ai_jobs_priority_check" CHECK (priority >= 1 AND priority <= 10);
ALTER TABLE ONLY "public"."ai_jobs" ADD CONSTRAINT "ai_jobs_progress_percent_check" CHECK (progress_percent >= 0::numeric AND progress_percent <= 100::numeric);
ALTER TABLE ONLY "public"."document_ai_summaries" ADD CONSTRAINT "document_ai_summaries_confidence_score_check" CHECK (confidence_score IS NULL OR confidence_score >= 0::numeric AND confidence_score <= 100::numeric);
ALTER TABLE ONLY "public"."document_classifications" ADD CONSTRAINT "document_classifications_confidence_score_check" CHECK (confidence_score >= 0::numeric AND confidence_score <= 100::numeric);
ALTER TABLE ONLY "public"."document_ocr_results" ADD CONSTRAINT "document_ocr_results_confidence_score_check" CHECK (confidence_score IS NULL OR confidence_score >= 0::numeric AND confidence_score <= 100::numeric);
ALTER TABLE ONLY "public"."document_versions" ADD CONSTRAINT "document_versions_file_size_bytes_check" CHECK (file_size_bytes >= 0);
ALTER TABLE ONLY "public"."document_versions" ADD CONSTRAINT "document_versions_page_count_check" CHECK (page_count IS NULL OR page_count >= 0);
ALTER TABLE ONLY "public"."document_versions" ADD CONSTRAINT "document_versions_version_number_check" CHECK (version_number > 0);
ALTER TABLE ONLY "public"."documents" ADD CONSTRAINT "documents_file_size_bytes_check" CHECK (file_size_bytes >= 0);
ALTER TABLE ONLY "public"."documents" ADD CONSTRAINT "documents_is_favorite_count_check" CHECK (is_favorite_count >= 0);
ALTER TABLE ONLY "public"."documents" ADD CONSTRAINT "documents_page_count_check" CHECK (page_count IS NULL OR page_count >= 0);
ALTER TABLE ONLY "public"."oauth_callback_states" ADD CONSTRAINT "oauth_callback_states_provider_check" CHECK (provider = ANY (ARRAY['google'::auth_provider, 'microsoft'::auth_provider, 'github'::auth_provider, 'apple'::auth_provider, 'linkedin'::auth_provider, 'facebook'::auth_provider]));
ALTER TABLE ONLY "public"."oauth_callback_states" ADD CONSTRAINT "oauth_callback_states_source_check" CHECK (source::text = ANY (ARRAY['login'::character varying, 'signup'::character varying, 'connect'::character varying]::text[]));
ALTER TABLE ONLY "public"."organizations" ADD CONSTRAINT "organizations_max_storage_bytes_check" CHECK (max_storage_bytes >= 0);
ALTER TABLE ONLY "public"."organizations" ADD CONSTRAINT "organizations_max_users_check" CHECK (max_users >= 0);
ALTER TABLE ONLY "public"."search_history" ADD CONSTRAINT "search_history_query_type_check" CHECK (query_type::text = ANY (ARRAY['basic'::character varying, 'advanced'::character varying, 'semantic'::character varying]::text[]));
ALTER TABLE ONLY "public"."search_history" ADD CONSTRAINT "search_history_result_count_check" CHECK (result_count IS NULL OR result_count >= 0);
ALTER TABLE ONLY "public"."user_oauth_accounts" ADD CONSTRAINT "user_oauth_accounts_provider_check" CHECK (provider = ANY (ARRAY['google'::auth_provider, 'microsoft'::auth_provider, 'github'::auth_provider, 'apple'::auth_provider, 'linkedin'::auth_provider, 'facebook'::auth_provider]));
ALTER TABLE ONLY "public"."ai_jobs" ADD CONSTRAINT "ai_jobs_document_id_fkey" FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."ai_jobs" ADD CONSTRAINT "ai_jobs_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."ai_jobs" ADD CONSTRAINT "ai_jobs_triggered_by_fkey" FOREIGN KEY (triggered_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY "public"."document_access_history" ADD CONSTRAINT "document_access_history_document_id_fkey" FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."document_access_history" ADD CONSTRAINT "document_access_history_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."document_ai_summaries" ADD CONSTRAINT "document_ai_summaries_ai_job_id_fkey" FOREIGN KEY (ai_job_id) REFERENCES ai_jobs(id) ON DELETE SET NULL;
ALTER TABLE ONLY "public"."document_ai_summaries" ADD CONSTRAINT "document_ai_summaries_document_id_fkey" FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."document_classifications" ADD CONSTRAINT "document_classifications_ai_job_id_fkey" FOREIGN KEY (ai_job_id) REFERENCES ai_jobs(id) ON DELETE SET NULL;
ALTER TABLE ONLY "public"."document_classifications" ADD CONSTRAINT "document_classifications_document_id_fkey" FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."document_ocr_results" ADD CONSTRAINT "document_ocr_results_ai_job_id_fkey" FOREIGN KEY (ai_job_id) REFERENCES ai_jobs(id) ON DELETE SET NULL;
ALTER TABLE ONLY "public"."document_ocr_results" ADD CONSTRAINT "document_ocr_results_document_id_fkey" FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."document_versions" ADD CONSTRAINT "document_versions_created_by_fkey" FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT;
ALTER TABLE ONLY "public"."document_versions" ADD CONSTRAINT "document_versions_document_id_fkey" FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."documents" ADD CONSTRAINT "documents_deleted_by_fkey" FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY "public"."documents" ADD CONSTRAINT "documents_folder_id_fkey" FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL;
ALTER TABLE ONLY "public"."documents" ADD CONSTRAINT "documents_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."documents" ADD CONSTRAINT "documents_owner_user_id_fkey" FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE RESTRICT;
ALTER TABLE ONLY "public"."documents" ADD CONSTRAINT "fk_documents_current_version" FOREIGN KEY (current_version_id) REFERENCES document_versions(id);
ALTER TABLE ONLY "public"."email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."folders" ADD CONSTRAINT "folders_created_by_fkey" FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT;
ALTER TABLE ONLY "public"."folders" ADD CONSTRAINT "folders_deleted_by_fkey" FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY "public"."folders" ADD CONSTRAINT "folders_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."folders" ADD CONSTRAINT "folders_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."organization_invitations" ADD CONSTRAINT "fk_org_invitations_accepted_by" FOREIGN KEY (accepted_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY "public"."organization_invitations" ADD CONSTRAINT "fk_org_invitations_invited_by" FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY "public"."organization_invitations" ADD CONSTRAINT "fk_org_invitations_org" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."organization_members" ADD CONSTRAINT "organization_members_invited_by_fkey" FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY "public"."organization_members" ADD CONSTRAINT "organization_members_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."organization_members" ADD CONSTRAINT "organization_members_role_id_fkey" FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL;
ALTER TABLE ONLY "public"."organization_members" ADD CONSTRAINT "organization_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."plan_features" ADD CONSTRAINT "plan_features_feature_id_fkey" FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."plan_features" ADD CONSTRAINT "plan_features_plan_id_fkey" FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."plan_limits" ADD CONSTRAINT "plan_limits_plan_id_fkey" FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."plan_prices" ADD CONSTRAINT "plan_prices_plan_id_fkey" FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."plan_prices" ADD CONSTRAINT "plan_prices_region_code_fkey" FOREIGN KEY (region_code) REFERENCES regions(code) ON DELETE RESTRICT;
ALTER TABLE ONLY "public"."search_history" ADD CONSTRAINT "search_history_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."search_history" ADD CONSTRAINT "search_history_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE RESTRICT;
ALTER TABLE ONLY "public"."subscriptions" ADD CONSTRAINT "subscriptions_region_code_fkey" FOREIGN KEY (region_code) REFERENCES regions(code) ON DELETE RESTRICT;
ALTER TABLE ONLY "public"."subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."usage_records" ADD CONSTRAINT "usage_records_document_id_fkey" FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL;
ALTER TABLE ONLY "public"."usage_records" ADD CONSTRAINT "usage_records_subscription_id_fkey" FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL;
ALTER TABLE ONLY "public"."usage_records" ADD CONSTRAINT "usage_records_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."user_oauth_accounts" ADD CONSTRAINT "user_oauth_accounts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_ai_jobs_doc ON public.ai_jobs USING btree (document_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_input_gin ON public.ai_jobs USING gin (input_json);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_org_status ON public.ai_jobs USING btree (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_output_gin ON public.ai_jobs USING gin (output_json);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_status ON public.ai_jobs USING btree (status);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_type ON public.ai_jobs USING btree (job_type);
CREATE INDEX IF NOT EXISTS idx_doc_access_doc_time ON public.document_access_history USING btree (document_id, accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_doc_access_user_time ON public.document_access_history USING btree (user_id, accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_summaries_doc_type ON public.document_ai_summaries USING btree (document_id, summary_type);
CREATE INDEX IF NOT EXISTS idx_classifications_doc ON public.document_classifications USING btree (document_id);
CREATE INDEX IF NOT EXISTS idx_classifications_primary ON public.document_classifications USING btree (document_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_ocr_doc ON public.document_ocr_results USING btree (document_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_doc_created_at ON public.document_versions USING btree (document_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_current_version ON public.documents USING btree (current_version_id);
CREATE INDEX IF NOT EXISTS idx_documents_deleted_at ON public.documents USING btree (deleted_at);
CREATE INDEX IF NOT EXISTS idx_documents_metadata_gin ON public.documents USING gin (metadata_json);
CREATE INDEX IF NOT EXISTS idx_documents_org_folder ON public.documents USING btree (organization_id, folder_id);
CREATE INDEX IF NOT EXISTS idx_documents_owner ON public.documents USING btree (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents USING btree (status);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_at ON public.documents USING btree (uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_verification_user ON public.email_verification_tokens USING btree (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_folders_deleted_at ON public.folders USING btree (deleted_at);
CREATE INDEX IF NOT EXISTS idx_folders_org_parent ON public.folders USING btree (organization_id, parent_id);
CREATE INDEX IF NOT EXISTS idx_oauth_callback_active_state ON public.oauth_callback_states USING btree (state_hash, expires_at) WHERE (consumed_at IS NULL);
CREATE INDEX IF NOT EXISTS idx_oauth_callback_provider_expires ON public.oauth_callback_states USING btree (provider, expires_at);
CREATE INDEX IF NOT EXISTS idx_org_invitations_org_email ON public.organization_invitations USING btree (organization_id, email);
CREATE INDEX IF NOT EXISTS idx_org_invitations_org_status ON public.organization_invitations USING btree (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_org_invitations_token ON public.organization_invitations USING btree (token_hash);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members USING btree (organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON public.organization_members USING btree (role_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_user ON public.password_reset_tokens USING btree (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_plan_features_feature ON public.plan_features USING btree (feature_id);
CREATE INDEX IF NOT EXISTS idx_plan_limits_key ON public.plan_limits USING btree (key);
CREATE INDEX IF NOT EXISTS idx_plan_prices_region_active ON public.plan_prices USING btree (region_code, is_active);
CREATE INDEX IF NOT EXISTS idx_plans_active_sort ON public.plans USING btree (is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_roles_org ON public.roles USING btree (organization_id);
CREATE INDEX IF NOT EXISTS idx_search_history_org_time ON public.search_history USING btree (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_user_time ON public.search_history USING btree (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON public.subscriptions USING btree (current_period_end);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON public.subscriptions USING btree (plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_region ON public.subscriptions USING btree (region_code);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON public.subscriptions USING btree (user_id, status);
CREATE INDEX IF NOT EXISTS idx_usage_records_document ON public.usage_records USING btree (document_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_subscription_month ON public.usage_records USING btree (subscription_id, usage_month);
CREATE INDEX IF NOT EXISTS idx_usage_records_user_month ON public.usage_records USING btree (user_id, usage_month);
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_provider_last_login ON public.user_oauth_accounts USING btree (provider, last_login_at DESC);
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_user_provider ON public.user_oauth_accounts USING btree (user_id, provider);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON public.user_sessions USING btree (expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_user_status ON public.user_sessions USING btree (user_id, status);
CREATE INDEX IF NOT EXISTS idx_users_country_code ON public.users USING btree (country_code);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON public.users USING btree (deleted_at);
CREATE INDEX IF NOT EXISTS idx_users_org_email ON public.users USING btree (organization_id, email);
CREATE INDEX IF NOT EXISTS idx_users_region_code ON public.users USING btree (region_code);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users USING btree (status);