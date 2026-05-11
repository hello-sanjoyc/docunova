--
-- PostgreSQL database dump
--

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.4

-- Started on 2026-05-11 08:50:57 IST

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 131 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- TOC entry 4376 (class 0 OID 0)
-- Dependencies: 131
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- TOC entry 1285 (class 1247 OID 19732)
-- Name: ai_job_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.ai_job_status AS ENUM (
    'queued',
    'running',
    'completed',
    'failed',
    'cancelled'
);


ALTER TYPE public.ai_job_status OWNER TO postgres;

--
-- TOC entry 1282 (class 1247 OID 19720)
-- Name: ai_job_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.ai_job_type AS ENUM (
    'ocr',
    'classify',
    'extract',
    'summarize',
    'full_process'
);


ALTER TYPE public.ai_job_type OWNER TO postgres;

--
-- TOC entry 1273 (class 1247 OID 19682)
-- Name: auth_provider; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.auth_provider AS ENUM (
    'local',
    'google',
    'microsoft',
    'github',
    'apple',
    'linkedin',
    'facebook'
);


ALTER TYPE public.auth_provider OWNER TO postgres;

--
-- TOC entry 1360 (class 1247 OID 26100)
-- Name: billing_cycle; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.billing_cycle AS ENUM (
    'monthly',
    'yearly'
);


ALTER TYPE public.billing_cycle OWNER TO postgres;

--
-- TOC entry 1279 (class 1247 OID 19706)
-- Name: document_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.document_status AS ENUM (
    'uploaded',
    'processing',
    'ready',
    'failed',
    'archived',
    'trashed'
);


ALTER TYPE public.document_status OWNER TO postgres;

--
-- TOC entry 1354 (class 1247 OID 26081)
-- Name: limit_period; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.limit_period AS ENUM (
    'lifetime',
    'monthly',
    'yearly',
    'none'
);


ALTER TYPE public.limit_period OWNER TO postgres;

--
-- TOC entry 1288 (class 1247 OID 19776)
-- Name: member_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.member_status AS ENUM (
    'invited',
    'active',
    'disabled',
    'removed'
);


ALTER TYPE public.member_status OWNER TO postgres;

--
-- TOC entry 1351 (class 1247 OID 25784)
-- Name: ocr_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.ocr_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed',
    'skipped'
);


ALTER TYPE public.ocr_status OWNER TO postgres;

--
-- TOC entry 1345 (class 1247 OID 23464)
-- Name: organization_invitation_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.organization_invitation_status AS ENUM (
    'pending',
    'accepted',
    'revoked',
    'expired'
);


ALTER TYPE public.organization_invitation_status OWNER TO postgres;

--
-- TOC entry 1276 (class 1247 OID 19698)
-- Name: session_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.session_status AS ENUM (
    'active',
    'revoked',
    'expired'
);


ALTER TYPE public.session_status OWNER TO postgres;

--
-- TOC entry 1357 (class 1247 OID 26090)
-- Name: subscription_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.subscription_status AS ENUM (
    'active',
    'trialing',
    'cancelled',
    'expired'
);


ALTER TYPE public.subscription_status OWNER TO postgres;

--
-- TOC entry 1270 (class 1247 OID 19672)
-- Name: user_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_status AS ENUM (
    'active',
    'invited',
    'suspended',
    'deleted'
);


ALTER TYPE public.user_status OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 413 (class 1259 OID 20223)
-- Name: ai_jobs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_jobs (
    id bigint NOT NULL,
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id bigint NOT NULL,
    document_id bigint NOT NULL,
    triggered_by bigint,
    job_type public.ai_job_type NOT NULL,
    status public.ai_job_status DEFAULT 'queued'::public.ai_job_status NOT NULL,
    provider_name character varying(100),
    model_name character varying(150),
    priority smallint DEFAULT 5 NOT NULL,
    progress_percent numeric(5,2) DEFAULT 0 NOT NULL,
    input_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    output_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    error_message text,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ai_jobs_priority_check CHECK (((priority >= 1) AND (priority <= 10))),
    CONSTRAINT ai_jobs_progress_percent_check CHECK (((progress_percent >= (0)::numeric) AND (progress_percent <= (100)::numeric)))
);


ALTER TABLE public.ai_jobs OWNER TO postgres;

--
-- TOC entry 412 (class 1259 OID 20222)
-- Name: ai_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ai_jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ai_jobs_id_seq OWNER TO postgres;

--
-- TOC entry 4379 (class 0 OID 0)
-- Dependencies: 412
-- Name: ai_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ai_jobs_id_seq OWNED BY public.ai_jobs.id;


--
-- TOC entry 411 (class 1259 OID 20136)
-- Name: document_access_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document_access_history (
    id bigint NOT NULL,
    document_id bigint NOT NULL,
    user_id bigint NOT NULL,
    accessed_at timestamp with time zone DEFAULT now() NOT NULL,
    access_type character varying(50) NOT NULL
);


ALTER TABLE public.document_access_history OWNER TO postgres;

--
-- TOC entry 410 (class 1259 OID 20135)
-- Name: document_access_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.document_access_history_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.document_access_history_id_seq OWNER TO postgres;

--
-- TOC entry 4382 (class 0 OID 0)
-- Dependencies: 410
-- Name: document_access_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.document_access_history_id_seq OWNED BY public.document_access_history.id;


--
-- TOC entry 417 (class 1259 OID 20284)
-- Name: document_ai_summaries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document_ai_summaries (
    id bigint NOT NULL,
    document_id bigint NOT NULL,
    ai_job_id bigint,
    summary_type character varying(50) DEFAULT 'general'::character varying NOT NULL,
    summary_text text NOT NULL,
    key_points_json jsonb DEFAULT '[]'::jsonb NOT NULL,
    confidence_score numeric(5,2),
    provider_name character varying(100),
    model_name character varying(150),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT document_ai_summaries_confidence_score_check CHECK (((confidence_score IS NULL) OR ((confidence_score >= (0)::numeric) AND (confidence_score <= (100)::numeric))))
);


ALTER TABLE public.document_ai_summaries OWNER TO postgres;

--
-- TOC entry 416 (class 1259 OID 20283)
-- Name: document_ai_summaries_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.document_ai_summaries_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.document_ai_summaries_id_seq OWNER TO postgres;

--
-- TOC entry 4385 (class 0 OID 0)
-- Dependencies: 416
-- Name: document_ai_summaries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.document_ai_summaries_id_seq OWNED BY public.document_ai_summaries.id;


--
-- TOC entry 419 (class 1259 OID 20330)
-- Name: document_classifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document_classifications (
    id bigint NOT NULL,
    document_id bigint NOT NULL,
    ai_job_id bigint,
    class_label character varying(150) NOT NULL,
    confidence_score numeric(5,2) NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT document_classifications_confidence_score_check CHECK (((confidence_score >= (0)::numeric) AND (confidence_score <= (100)::numeric)))
);


ALTER TABLE public.document_classifications OWNER TO postgres;

--
-- TOC entry 418 (class 1259 OID 20329)
-- Name: document_classifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.document_classifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.document_classifications_id_seq OWNER TO postgres;

--
-- TOC entry 4388 (class 0 OID 0)
-- Dependencies: 418
-- Name: document_classifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.document_classifications_id_seq OWNED BY public.document_classifications.id;


--
-- TOC entry 415 (class 1259 OID 20259)
-- Name: document_ocr_results; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document_ocr_results (
    id bigint NOT NULL,
    document_id bigint NOT NULL,
    ai_job_id bigint,
    extracted_text text,
    page_text_json jsonb DEFAULT '[]'::jsonb NOT NULL,
    confidence_score numeric(5,2),
    language_detected character varying(20),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    ocr_status public.ocr_status DEFAULT 'pending'::public.ocr_status NOT NULL,
    ocr_method character varying(50),
    CONSTRAINT document_ocr_results_confidence_score_check CHECK (((confidence_score IS NULL) OR ((confidence_score >= (0)::numeric) AND (confidence_score <= (100)::numeric))))
);


ALTER TABLE public.document_ocr_results OWNER TO postgres;

--
-- TOC entry 414 (class 1259 OID 20258)
-- Name: document_ocr_results_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.document_ocr_results_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.document_ocr_results_id_seq OWNER TO postgres;

--
-- TOC entry 4391 (class 0 OID 0)
-- Dependencies: 414
-- Name: document_ocr_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.document_ocr_results_id_seq OWNED BY public.document_ocr_results.id;


--
-- TOC entry 409 (class 1259 OID 20103)
-- Name: document_versions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document_versions (
    id bigint NOT NULL,
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    document_id bigint NOT NULL,
    version_number integer NOT NULL,
    storage_key text NOT NULL,
    preview_storage_key text,
    thumbnail_storage_key text,
    file_size_bytes bigint NOT NULL,
    mime_type character varying(150) NOT NULL,
    checksum_sha256 character(64),
    page_count integer,
    created_by bigint NOT NULL,
    version_note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT document_versions_file_size_bytes_check CHECK ((file_size_bytes >= 0)),
    CONSTRAINT document_versions_page_count_check CHECK (((page_count IS NULL) OR (page_count >= 0))),
    CONSTRAINT document_versions_version_number_check CHECK ((version_number > 0))
);


ALTER TABLE public.document_versions OWNER TO postgres;

--
-- TOC entry 408 (class 1259 OID 20102)
-- Name: document_versions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.document_versions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.document_versions_id_seq OWNER TO postgres;

--
-- TOC entry 4394 (class 0 OID 0)
-- Dependencies: 408
-- Name: document_versions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.document_versions_id_seq OWNED BY public.document_versions.id;


--
-- TOC entry 407 (class 1259 OID 20062)
-- Name: documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents (
    id bigint NOT NULL,
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id bigint NOT NULL,
    folder_id bigint,
    owner_user_id bigint NOT NULL,
    current_version_id bigint,
    title character varying(500) NOT NULL,
    original_filename character varying(500) NOT NULL,
    storage_key text NOT NULL,
    preview_storage_key text,
    thumbnail_storage_key text,
    mime_type character varying(150) NOT NULL,
    file_extension character varying(20),
    file_size_bytes bigint NOT NULL,
    checksum_sha256 character(64),
    page_count integer,
    language_code character varying(10),
    status public.document_status DEFAULT 'uploaded'::public.document_status NOT NULL,
    source_type character varying(50) DEFAULT 'upload'::character varying NOT NULL,
    is_favorite_count integer DEFAULT 0 NOT NULL,
    metadata_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    uploaded_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by bigint,
    CONSTRAINT documents_file_size_bytes_check CHECK ((file_size_bytes >= 0)),
    CONSTRAINT documents_is_favorite_count_check CHECK ((is_favorite_count >= 0)),
    CONSTRAINT documents_page_count_check CHECK (((page_count IS NULL) OR (page_count >= 0)))
);


ALTER TABLE public.documents OWNER TO postgres;

--
-- TOC entry 406 (class 1259 OID 20061)
-- Name: documents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.documents_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.documents_id_seq OWNER TO postgres;

--
-- TOC entry 4397 (class 0 OID 0)
-- Dependencies: 406
-- Name: documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.documents_id_seq OWNED BY public.documents.id;


--
-- TOC entry 399 (class 1259 OID 19951)
-- Name: email_verification_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.email_verification_tokens (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    token_hash text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.email_verification_tokens OWNER TO postgres;

--
-- TOC entry 398 (class 1259 OID 19950)
-- Name: email_verification_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.email_verification_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.email_verification_tokens_id_seq OWNER TO postgres;

--
-- TOC entry 4400 (class 0 OID 0)
-- Dependencies: 398
-- Name: email_verification_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.email_verification_tokens_id_seq OWNED BY public.email_verification_tokens.id;


--
-- TOC entry 427 (class 1259 OID 26124)
-- Name: features; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.features (
    id bigint NOT NULL,
    key character varying(150) NOT NULL,
    name character varying(150) NOT NULL,
    description text,
    created_at timestamp(6) with time zone DEFAULT now() NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.features OWNER TO postgres;

--
-- TOC entry 426 (class 1259 OID 26123)
-- Name: features_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.features_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.features_id_seq OWNER TO postgres;

--
-- TOC entry 4403 (class 0 OID 0)
-- Dependencies: 426
-- Name: features_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.features_id_seq OWNED BY public.features.id;


--
-- TOC entry 405 (class 1259 OID 20028)
-- Name: folders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.folders (
    id bigint NOT NULL,
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id bigint NOT NULL,
    parent_id bigint,
    created_by bigint NOT NULL,
    name character varying(255) NOT NULL,
    path_cache text,
    color character varying(20),
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by bigint
);


ALTER TABLE public.folders OWNER TO postgres;

--
-- TOC entry 404 (class 1259 OID 20027)
-- Name: folders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.folders_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.folders_id_seq OWNER TO postgres;

--
-- TOC entry 4406 (class 0 OID 0)
-- Dependencies: 404
-- Name: folders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.folders_id_seq OWNED BY public.folders.id;


--
-- TOC entry 403 (class 1259 OID 20012)
-- Name: oauth_callback_states; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.oauth_callback_states (
    id bigint NOT NULL,
    provider public.auth_provider NOT NULL,
    state_hash character(64) NOT NULL,
    code_verifier_hash character(64),
    source character varying(30) DEFAULT 'login'::character varying NOT NULL,
    target_path text,
    redirect_uri text NOT NULL,
    ip_address inet,
    user_agent text,
    metadata_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    consumed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT oauth_callback_states_provider_check CHECK ((provider = ANY (ARRAY['google'::public.auth_provider, 'microsoft'::public.auth_provider, 'github'::public.auth_provider, 'apple'::public.auth_provider, 'linkedin'::public.auth_provider, 'facebook'::public.auth_provider]))),
    CONSTRAINT oauth_callback_states_source_check CHECK (((source)::text = ANY ((ARRAY['login'::character varying, 'signup'::character varying, 'connect'::character varying])::text[])))
);


ALTER TABLE public.oauth_callback_states OWNER TO postgres;

--
-- TOC entry 402 (class 1259 OID 20011)
-- Name: oauth_callback_states_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.oauth_callback_states_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oauth_callback_states_id_seq OWNER TO postgres;

--
-- TOC entry 4409 (class 0 OID 0)
-- Dependencies: 402
-- Name: oauth_callback_states_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.oauth_callback_states_id_seq OWNED BY public.oauth_callback_states.id;


--
-- TOC entry 423 (class 1259 OID 23474)
-- Name: organization_invitations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organization_invitations (
    id bigint NOT NULL,
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id bigint NOT NULL,
    email character varying(255) NOT NULL,
    role_code character varying(100),
    token_hash text NOT NULL,
    status public.organization_invitation_status DEFAULT 'pending'::public.organization_invitation_status NOT NULL,
    invited_by bigint,
    accepted_by bigint,
    expires_at timestamp(6) with time zone NOT NULL,
    accepted_at timestamp(6) with time zone,
    revoked_at timestamp(6) with time zone,
    created_at timestamp(6) with time zone DEFAULT now() NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.organization_invitations OWNER TO postgres;

--
-- TOC entry 422 (class 1259 OID 23473)
-- Name: organization_invitations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.organization_invitations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.organization_invitations_id_seq OWNER TO postgres;

--
-- TOC entry 4412 (class 0 OID 0)
-- Dependencies: 422
-- Name: organization_invitations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.organization_invitations_id_seq OWNED BY public.organization_invitations.id;


--
-- TOC entry 393 (class 1259 OID 19882)
-- Name: organization_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organization_members (
    id bigint NOT NULL,
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id bigint NOT NULL,
    user_id bigint NOT NULL,
    role_id bigint,
    title character varying(150),
    status public.member_status DEFAULT 'active'::public.member_status NOT NULL,
    invited_by bigint,
    invited_at timestamp with time zone,
    joined_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.organization_members OWNER TO postgres;

--
-- TOC entry 392 (class 1259 OID 19881)
-- Name: organization_members_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.organization_members_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.organization_members_id_seq OWNER TO postgres;

--
-- TOC entry 4415 (class 0 OID 0)
-- Dependencies: 392
-- Name: organization_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.organization_members_id_seq OWNED BY public.organization_members.id;


--
-- TOC entry 387 (class 1259 OID 19796)
-- Name: organizations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organizations (
    id bigint NOT NULL,
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(150) NOT NULL,
    logo_url text,
    website text,
    timezone character varying(100) DEFAULT 'UTC'::character varying NOT NULL,
    language_code character varying(10) DEFAULT 'en'::character varying NOT NULL,
    plan_code character varying(50),
    billing_email character varying(255),
    max_storage_bytes bigint DEFAULT 0 NOT NULL,
    max_users integer DEFAULT 0 NOT NULL,
    settings_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT organizations_max_storage_bytes_check CHECK ((max_storage_bytes >= 0)),
    CONSTRAINT organizations_max_users_check CHECK ((max_users >= 0))
);


ALTER TABLE public.organizations OWNER TO postgres;

--
-- TOC entry 386 (class 1259 OID 19795)
-- Name: organizations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.organizations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.organizations_id_seq OWNER TO postgres;

--
-- TOC entry 4418 (class 0 OID 0)
-- Dependencies: 386
-- Name: organizations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.organizations_id_seq OWNED BY public.organizations.id;


--
-- TOC entry 397 (class 1259 OID 19936)
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_reset_tokens (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    token_hash text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.password_reset_tokens OWNER TO postgres;

--
-- TOC entry 396 (class 1259 OID 19935)
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.password_reset_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.password_reset_tokens_id_seq OWNER TO postgres;

--
-- TOC entry 4421 (class 0 OID 0)
-- Dependencies: 396
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.password_reset_tokens_id_seq OWNED BY public.password_reset_tokens.id;


--
-- TOC entry 429 (class 1259 OID 26137)
-- Name: plan_features; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.plan_features (
    id bigint NOT NULL,
    plan_id bigint NOT NULL,
    feature_id bigint NOT NULL,
    included boolean DEFAULT true NOT NULL
);


ALTER TABLE public.plan_features OWNER TO postgres;

--
-- TOC entry 428 (class 1259 OID 26136)
-- Name: plan_features_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.plan_features_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.plan_features_id_seq OWNER TO postgres;

--
-- TOC entry 4424 (class 0 OID 0)
-- Dependencies: 428
-- Name: plan_features_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.plan_features_id_seq OWNED BY public.plan_features.id;


--
-- TOC entry 431 (class 1259 OID 26158)
-- Name: plan_limits; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.plan_limits (
    id bigint NOT NULL,
    plan_id bigint NOT NULL,
    key character varying(150) NOT NULL,
    value numeric(18,4) NOT NULL,
    period public.limit_period DEFAULT 'none'::public.limit_period NOT NULL
);


ALTER TABLE public.plan_limits OWNER TO postgres;

--
-- TOC entry 430 (class 1259 OID 26157)
-- Name: plan_limits_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.plan_limits_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.plan_limits_id_seq OWNER TO postgres;

--
-- TOC entry 4427 (class 0 OID 0)
-- Dependencies: 430
-- Name: plan_limits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.plan_limits_id_seq OWNED BY public.plan_limits.id;


--
-- TOC entry 435 (class 1259 OID 26183)
-- Name: plan_prices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.plan_prices (
    id bigint NOT NULL,
    plan_id bigint NOT NULL,
    region_code character varying(20) NOT NULL,
    currency_code character varying(10) NOT NULL,
    monthly_price numeric(18,4) DEFAULT 0 NOT NULL,
    yearly_price numeric(18,4) DEFAULT 0 NOT NULL,
    extra_page_price numeric(18,4) DEFAULT 0 NOT NULL,
    extra_ocr_page_price numeric(18,4) DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(6) with time zone DEFAULT now() NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.plan_prices OWNER TO postgres;

--
-- TOC entry 434 (class 1259 OID 26182)
-- Name: plan_prices_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.plan_prices_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.plan_prices_id_seq OWNER TO postgres;

--
-- TOC entry 4430 (class 0 OID 0)
-- Dependencies: 434
-- Name: plan_prices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.plan_prices_id_seq OWNED BY public.plan_prices.id;


--
-- TOC entry 425 (class 1259 OID 26108)
-- Name: plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.plans (
    id bigint NOT NULL,
    slug character varying(100) NOT NULL,
    name character varying(150) NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp(6) with time zone DEFAULT now() NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.plans OWNER TO postgres;

--
-- TOC entry 424 (class 1259 OID 26107)
-- Name: plans_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.plans_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.plans_id_seq OWNER TO postgres;

--
-- TOC entry 4433 (class 0 OID 0)
-- Dependencies: 424
-- Name: plans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.plans_id_seq OWNED BY public.plans.id;


--
-- TOC entry 433 (class 1259 OID 26174)
-- Name: regions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.regions (
    id bigint NOT NULL,
    code character varying(20) NOT NULL,
    name character varying(150) NOT NULL,
    currency_code character varying(10) NOT NULL
);


ALTER TABLE public.regions OWNER TO postgres;

--
-- TOC entry 432 (class 1259 OID 26173)
-- Name: regions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.regions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.regions_id_seq OWNER TO postgres;

--
-- TOC entry 4436 (class 0 OID 0)
-- Dependencies: 432
-- Name: regions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.regions_id_seq OWNED BY public.regions.id;


--
-- TOC entry 391 (class 1259 OID 19843)
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id bigint NOT NULL,
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(100) NOT NULL,
    is_system boolean DEFAULT false NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- TOC entry 390 (class 1259 OID 19842)
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO postgres;

--
-- TOC entry 4439 (class 0 OID 0)
-- Dependencies: 390
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- TOC entry 421 (class 1259 OID 20404)
-- Name: search_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.search_history (
    id bigint NOT NULL,
    organization_id bigint NOT NULL,
    user_id bigint NOT NULL,
    query_text text NOT NULL,
    query_type character varying(30) DEFAULT 'basic'::character varying NOT NULL,
    filters_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    result_count integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT search_history_query_type_check CHECK (((query_type)::text = ANY ((ARRAY['basic'::character varying, 'advanced'::character varying, 'semantic'::character varying])::text[]))),
    CONSTRAINT search_history_result_count_check CHECK (((result_count IS NULL) OR (result_count >= 0)))
);


ALTER TABLE public.search_history OWNER TO postgres;

--
-- TOC entry 420 (class 1259 OID 20403)
-- Name: search_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.search_history_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.search_history_id_seq OWNER TO postgres;

--
-- TOC entry 4442 (class 0 OID 0)
-- Dependencies: 420
-- Name: search_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.search_history_id_seq OWNED BY public.search_history.id;


--
-- TOC entry 437 (class 1259 OID 26210)
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subscriptions (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    plan_id bigint NOT NULL,
    region_code character varying(20) NOT NULL,
    status public.subscription_status DEFAULT 'active'::public.subscription_status NOT NULL,
    billing_cycle public.billing_cycle NOT NULL,
    started_at timestamp(6) with time zone DEFAULT now() NOT NULL,
    current_period_start timestamp(6) with time zone NOT NULL,
    current_period_end timestamp(6) with time zone NOT NULL,
    cancelled_at timestamp(6) with time zone,
    created_at timestamp(6) with time zone DEFAULT now() NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.subscriptions OWNER TO postgres;

--
-- TOC entry 436 (class 1259 OID 26209)
-- Name: subscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.subscriptions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.subscriptions_id_seq OWNER TO postgres;

--
-- TOC entry 4445 (class 0 OID 0)
-- Dependencies: 436
-- Name: subscriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.subscriptions_id_seq OWNED BY public.subscriptions.id;


--
-- TOC entry 439 (class 1259 OID 26240)
-- Name: usage_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usage_records (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    subscription_id bigint,
    document_id bigint,
    pages_used integer DEFAULT 0 NOT NULL,
    ocr_pages_used integer DEFAULT 0 NOT NULL,
    tokens_used integer,
    usage_month date NOT NULL,
    created_at timestamp(6) with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.usage_records OWNER TO postgres;

--
-- TOC entry 438 (class 1259 OID 26239)
-- Name: usage_records_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usage_records_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usage_records_id_seq OWNER TO postgres;

--
-- TOC entry 4448 (class 0 OID 0)
-- Dependencies: 438
-- Name: usage_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usage_records_id_seq OWNED BY public.usage_records.id;


--
-- TOC entry 401 (class 1259 OID 19987)
-- Name: user_oauth_accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_oauth_accounts (
    id bigint NOT NULL,
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id bigint NOT NULL,
    provider public.auth_provider NOT NULL,
    provider_user_id character varying(255) NOT NULL,
    provider_email character varying(255),
    scope text,
    access_token_encrypted text,
    refresh_token_encrypted text,
    token_expires_at timestamp with time zone,
    profile_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    last_login_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT user_oauth_accounts_provider_check CHECK ((provider = ANY (ARRAY['google'::public.auth_provider, 'microsoft'::public.auth_provider, 'github'::public.auth_provider, 'apple'::public.auth_provider, 'linkedin'::public.auth_provider, 'facebook'::public.auth_provider])))
);


ALTER TABLE public.user_oauth_accounts OWNER TO postgres;

--
-- TOC entry 400 (class 1259 OID 19986)
-- Name: user_oauth_accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_oauth_accounts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_oauth_accounts_id_seq OWNER TO postgres;

--
-- TOC entry 4451 (class 0 OID 0)
-- Dependencies: 400
-- Name: user_oauth_accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_oauth_accounts_id_seq OWNED BY public.user_oauth_accounts.id;


--
-- TOC entry 395 (class 1259 OID 19917)
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_sessions (
    id bigint NOT NULL,
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id bigint NOT NULL,
    refresh_token_hash text NOT NULL,
    device_name character varying(255),
    device_type character varying(50),
    browser character varying(100),
    os character varying(100),
    ip_address character varying(45),
    user_agent text,
    status public.session_status DEFAULT 'active'::public.session_status NOT NULL,
    last_seen_at timestamp with time zone,
    expires_at timestamp with time zone NOT NULL,
    revoked_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_sessions OWNER TO postgres;

--
-- TOC entry 394 (class 1259 OID 19916)
-- Name: user_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_sessions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_sessions_id_seq OWNER TO postgres;

--
-- TOC entry 4454 (class 0 OID 0)
-- Dependencies: 394
-- Name: user_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_sessions_id_seq OWNED BY public.user_sessions.id;


--
-- TOC entry 389 (class 1259 OID 19819)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id bigint NOT NULL,
    email character varying(255) NOT NULL,
    password_hash text,
    auth_provider public.auth_provider DEFAULT 'local'::public.auth_provider NOT NULL,
    provider_user_id character varying(255),
    first_name character varying(120),
    last_name character varying(120),
    full_name character varying(255),
    phone character varying(30),
    avatar_url text,
    email_verified_at timestamp with time zone,
    two_factor_enabled boolean DEFAULT false NOT NULL,
    two_factor_secret text,
    status public.user_status DEFAULT 'active'::public.user_status NOT NULL,
    last_login_at timestamp with time zone,
    last_activity_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    email_digest_enabled boolean DEFAULT true NOT NULL,
    security_alerts_enabled boolean DEFAULT true NOT NULL,
    country_code character varying(2),
    region_code character varying(20)
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 388 (class 1259 OID 19818)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 4457 (class 0 OID 0)
-- Dependencies: 388
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 3885 (class 2604 OID 26664)
-- Name: ai_jobs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_jobs ALTER COLUMN id SET DEFAULT nextval('public.ai_jobs_id_seq'::regclass);


--
-- TOC entry 3883 (class 2604 OID 26665)
-- Name: document_access_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_access_history ALTER COLUMN id SET DEFAULT nextval('public.document_access_history_id_seq'::regclass);


--
-- TOC entry 3899 (class 2604 OID 26666)
-- Name: document_ai_summaries id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_ai_summaries ALTER COLUMN id SET DEFAULT nextval('public.document_ai_summaries_id_seq'::regclass);


--
-- TOC entry 3903 (class 2604 OID 26667)
-- Name: document_classifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_classifications ALTER COLUMN id SET DEFAULT nextval('public.document_classifications_id_seq'::regclass);


--
-- TOC entry 3894 (class 2604 OID 26668)
-- Name: document_ocr_results id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_ocr_results ALTER COLUMN id SET DEFAULT nextval('public.document_ocr_results_id_seq'::regclass);


--
-- TOC entry 3880 (class 2604 OID 26669)
-- Name: document_versions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_versions ALTER COLUMN id SET DEFAULT nextval('public.document_versions_id_seq'::regclass);


--
-- TOC entry 3872 (class 2604 OID 26670)
-- Name: documents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents ALTER COLUMN id SET DEFAULT nextval('public.documents_id_seq'::regclass);


--
-- TOC entry 3857 (class 2604 OID 26671)
-- Name: email_verification_tokens id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_verification_tokens ALTER COLUMN id SET DEFAULT nextval('public.email_verification_tokens_id_seq'::regclass);


--
-- TOC entry 3920 (class 2604 OID 26672)
-- Name: features id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.features ALTER COLUMN id SET DEFAULT nextval('public.features_id_seq'::regclass);


--
-- TOC entry 3868 (class 2604 OID 26673)
-- Name: folders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.folders ALTER COLUMN id SET DEFAULT nextval('public.folders_id_seq'::regclass);


--
-- TOC entry 3864 (class 2604 OID 26674)
-- Name: oauth_callback_states id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.oauth_callback_states ALTER COLUMN id SET DEFAULT nextval('public.oauth_callback_states_id_seq'::regclass);


--
-- TOC entry 3910 (class 2604 OID 26675)
-- Name: organization_invitations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_invitations ALTER COLUMN id SET DEFAULT nextval('public.organization_invitations_id_seq'::regclass);


--
-- TOC entry 3846 (class 2604 OID 26676)
-- Name: organization_members id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_members ALTER COLUMN id SET DEFAULT nextval('public.organization_members_id_seq'::regclass);


--
-- TOC entry 3823 (class 2604 OID 26677)
-- Name: organizations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations ALTER COLUMN id SET DEFAULT nextval('public.organizations_id_seq'::regclass);


--
-- TOC entry 3855 (class 2604 OID 26678)
-- Name: password_reset_tokens id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens ALTER COLUMN id SET DEFAULT nextval('public.password_reset_tokens_id_seq'::regclass);


--
-- TOC entry 3923 (class 2604 OID 26679)
-- Name: plan_features id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plan_features ALTER COLUMN id SET DEFAULT nextval('public.plan_features_id_seq'::regclass);


--
-- TOC entry 3925 (class 2604 OID 26680)
-- Name: plan_limits id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plan_limits ALTER COLUMN id SET DEFAULT nextval('public.plan_limits_id_seq'::regclass);


--
-- TOC entry 3928 (class 2604 OID 26681)
-- Name: plan_prices id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plan_prices ALTER COLUMN id SET DEFAULT nextval('public.plan_prices_id_seq'::regclass);


--
-- TOC entry 3915 (class 2604 OID 26682)
-- Name: plans id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plans ALTER COLUMN id SET DEFAULT nextval('public.plans_id_seq'::regclass);


--
-- TOC entry 3927 (class 2604 OID 26683)
-- Name: regions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.regions ALTER COLUMN id SET DEFAULT nextval('public.regions_id_seq'::regclass);


--
-- TOC entry 3841 (class 2604 OID 26684)
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- TOC entry 3906 (class 2604 OID 26685)
-- Name: search_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.search_history ALTER COLUMN id SET DEFAULT nextval('public.search_history_id_seq'::regclass);


--
-- TOC entry 3936 (class 2604 OID 26686)
-- Name: subscriptions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions ALTER COLUMN id SET DEFAULT nextval('public.subscriptions_id_seq'::regclass);


--
-- TOC entry 3941 (class 2604 OID 26687)
-- Name: usage_records id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usage_records ALTER COLUMN id SET DEFAULT nextval('public.usage_records_id_seq'::regclass);


--
-- TOC entry 3859 (class 2604 OID 26688)
-- Name: user_oauth_accounts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_oauth_accounts ALTER COLUMN id SET DEFAULT nextval('public.user_oauth_accounts_id_seq'::regclass);


--
-- TOC entry 3851 (class 2604 OID 26689)
-- Name: user_sessions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions ALTER COLUMN id SET DEFAULT nextval('public.user_sessions_id_seq'::regclass);


--
-- TOC entry 3832 (class 2604 OID 26690)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 4344 (class 0 OID 20223)
-- Dependencies: 413
-- Data for Name: ai_jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 4342 (class 0 OID 20136)
-- Dependencies: 411
-- Data for Name: document_access_history; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 4348 (class 0 OID 20284)
-- Dependencies: 417
-- Data for Name: document_ai_summaries; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 4350 (class 0 OID 20330)
-- Dependencies: 419
-- Data for Name: document_classifications; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 4346 (class 0 OID 20259)
-- Dependencies: 415
-- Data for Name: document_ocr_results; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 4340 (class 0 OID 20103)
-- Dependencies: 409
-- Data for Name: document_versions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 4338 (class 0 OID 20062)
-- Dependencies: 407
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 4330 (class 0 OID 19951)
-- Dependencies: 399
-- Data for Name: email_verification_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 4358 (class 0 OID 26124)
-- Dependencies: 427
-- Data for Name: features; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.features VALUES (1, 'pdf_upload', 'PDF upload', 'Upload PDF documents.', '2026-04-24 18:29:34.100274+00', '2026-04-24 18:29:34.100274+00');
INSERT INTO public.features VALUES (2, 'docx_upload', 'DOCX upload', 'Upload Microsoft Word documents.', '2026-04-24 18:29:34.100274+00', '2026-04-24 18:29:34.100274+00');
INSERT INTO public.features VALUES (3, 'text_based_only', 'Text-based documents only', 'Only documents with extractable text are supported.', '2026-04-24 18:29:34.100274+00', '2026-04-24 18:29:34.100274+00');
INSERT INTO public.features VALUES (4, 'ocr', 'OCR', 'OCR support for scanned PDFs and images.', '2026-04-24 18:29:34.100274+00', '2026-04-24 18:29:34.100274+00');
INSERT INTO public.features VALUES (5, 'one_page_ai_brief', '1-page AI brief', 'Generate a concise AI summary.', '2026-04-24 18:29:34.100274+00', '2026-04-24 18:29:34.100274+00');
INSERT INTO public.features VALUES (6, 'pdf_summary_download', 'PDF summary download', 'Download AI summaries as PDF.', '2026-04-24 18:29:34.100274+00', '2026-04-24 18:29:34.100274+00');
INSERT INTO public.features VALUES (7, 'shareable_links', 'Shareable links', 'Share read-only links.', '2026-04-24 18:29:34.100274+00', '2026-04-24 18:29:34.100274+00');
INSERT INTO public.features VALUES (8, 'team_members', 'Team members', 'Invite team members.', '2026-04-24 18:29:34.100274+00', '2026-04-24 18:29:34.100274+00');
INSERT INTO public.features VALUES (9, 'shared_vault', 'Shared vault', 'Shared team document workspace.', '2026-04-24 18:29:34.100274+00', '2026-04-24 18:29:34.100274+00');
INSERT INTO public.features VALUES (10, 'activity_log', 'Activity log', 'Track team activity.', '2026-04-24 18:29:34.100274+00', '2026-04-24 18:29:34.100274+00');
INSERT INTO public.features VALUES (11, 'priority_support', 'Priority support', 'Prioritized customer support.', '2026-04-24 18:29:34.100274+00', '2026-04-24 18:29:34.100274+00');


--
-- TOC entry 4336 (class 0 OID 20028)
-- Dependencies: 405
-- Data for Name: folders; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 4334 (class 0 OID 20012)
-- Dependencies: 403
-- Data for Name: oauth_callback_states; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 4354 (class 0 OID 23474)
-- Dependencies: 423
-- Data for Name: organization_invitations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 4324 (class 0 OID 19882)
-- Dependencies: 393
-- Data for Name: organization_members; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.organization_members VALUES (1, '6e91a95c-67b7-4fa7-ad88-c90ae45b18f1', 1, 1, 1, NULL, 'active', NULL, NULL, '2026-05-02 14:29:24.240751+00', '2026-05-02 14:29:24.240751+00', '2026-05-02 14:29:24.240751+00');


--
-- TOC entry 4318 (class 0 OID 19796)
-- Dependencies: 387
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.organizations VALUES (1, '20c5ef85-44ef-425e-95e0-8a864b9c8865', 'DocuNova Administration', 'docunova-admin', NULL, NULL, 'UTC', 'en', NULL, NULL, 0, 0, '{}', '2026-05-02 14:29:24.240751+00', '2026-05-02 14:29:24.240751+00');


--
-- TOC entry 4328 (class 0 OID 19936)
-- Dependencies: 397
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 4360 (class 0 OID 26137)
-- Dependencies: 429
-- Data for Name: plan_features; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.plan_features VALUES (1, 1, 11, false);
INSERT INTO public.plan_features VALUES (2, 1, 10, false);
INSERT INTO public.plan_features VALUES (3, 1, 9, false);
INSERT INTO public.plan_features VALUES (4, 1, 8, false);
INSERT INTO public.plan_features VALUES (5, 1, 7, false);
INSERT INTO public.plan_features VALUES (6, 1, 6, true);
INSERT INTO public.plan_features VALUES (7, 1, 5, true);
INSERT INTO public.plan_features VALUES (8, 1, 4, false);
INSERT INTO public.plan_features VALUES (9, 1, 3, true);
INSERT INTO public.plan_features VALUES (10, 1, 2, false);
INSERT INTO public.plan_features VALUES (11, 1, 1, true);
INSERT INTO public.plan_features VALUES (12, 2, 11, false);
INSERT INTO public.plan_features VALUES (13, 2, 10, false);
INSERT INTO public.plan_features VALUES (14, 2, 9, false);
INSERT INTO public.plan_features VALUES (15, 2, 8, false);
INSERT INTO public.plan_features VALUES (16, 2, 7, true);
INSERT INTO public.plan_features VALUES (17, 2, 6, true);
INSERT INTO public.plan_features VALUES (18, 2, 5, true);
INSERT INTO public.plan_features VALUES (19, 2, 4, true);
INSERT INTO public.plan_features VALUES (20, 2, 3, false);
INSERT INTO public.plan_features VALUES (21, 2, 2, true);
INSERT INTO public.plan_features VALUES (22, 2, 1, true);
INSERT INTO public.plan_features VALUES (23, 3, 11, true);
INSERT INTO public.plan_features VALUES (24, 3, 10, true);
INSERT INTO public.plan_features VALUES (25, 3, 9, true);
INSERT INTO public.plan_features VALUES (26, 3, 8, true);
INSERT INTO public.plan_features VALUES (27, 3, 7, true);
INSERT INTO public.plan_features VALUES (28, 3, 6, true);
INSERT INTO public.plan_features VALUES (29, 3, 5, true);
INSERT INTO public.plan_features VALUES (30, 3, 4, true);
INSERT INTO public.plan_features VALUES (31, 3, 3, false);
INSERT INTO public.plan_features VALUES (32, 3, 2, true);
INSERT INTO public.plan_features VALUES (33, 3, 1, true);


--
-- TOC entry 4362 (class 0 OID 26158)
-- Dependencies: 431
-- Data for Name: plan_limits; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.plan_limits VALUES (1, 1, 'ocr_pages_included', 0.0000, 'lifetime');
INSERT INTO public.plan_limits VALUES (2, 1, 'storage_mb', 100.0000, 'none');
INSERT INTO public.plan_limits VALUES (3, 1, 'max_pages_per_upload', 20.0000, 'none');
INSERT INTO public.plan_limits VALUES (4, 1, 'lifetime_pages', 50.0000, 'lifetime');
INSERT INTO public.plan_limits VALUES (5, 2, 'team_members_included', 1.0000, 'none');
INSERT INTO public.plan_limits VALUES (6, 2, 'storage_mb', 5120.0000, 'none');
INSERT INTO public.plan_limits VALUES (7, 2, 'ocr_pages_included', 250.0000, 'monthly');
INSERT INTO public.plan_limits VALUES (8, 2, 'max_pages_per_upload', 100.0000, 'none');
INSERT INTO public.plan_limits VALUES (9, 2, 'pages_per_month', 1000.0000, 'monthly');
INSERT INTO public.plan_limits VALUES (10, 3, 'minimum_team_seats', 3.0000, 'none');
INSERT INTO public.plan_limits VALUES (11, 3, 'team_members_included', 3.0000, 'none');
INSERT INTO public.plan_limits VALUES (12, 3, 'storage_mb', 20480.0000, 'none');
INSERT INTO public.plan_limits VALUES (13, 3, 'ocr_pages_included', 1000.0000, 'monthly');
INSERT INTO public.plan_limits VALUES (14, 3, 'max_pages_per_upload', 200.0000, 'none');
INSERT INTO public.plan_limits VALUES (15, 3, 'pages_per_month', 3000.0000, 'monthly');


--
-- TOC entry 4366 (class 0 OID 26183)
-- Dependencies: 435
-- Data for Name: plan_prices; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.plan_prices VALUES (1, 1, 'AE', 'AED', 0.0000, 0.0000, 0.0000, 0.0000, true, '2026-04-30 19:12:08.964367+00', '2026-04-30 19:12:08.964367+00');
INSERT INTO public.plan_prices VALUES (2, 2, 'AE', 'AED', 69.0000, 690.0000, 0.0800, 0.1600, true, '2026-04-30 19:12:08.964367+00', '2026-04-30 19:12:08.964367+00');
INSERT INTO public.plan_prices VALUES (3, 3, 'AE', 'AED', 179.0000, 1790.0000, 0.0600, 0.1200, true, '2026-04-30 19:12:08.964367+00', '2026-04-30 19:12:08.964367+00');
INSERT INTO public.plan_prices VALUES (4, 1, 'AU', 'AUD', 0.0000, 0.0000, 0.0000, 0.0000, true, '2026-04-30 19:12:08.964367+00', '2026-04-30 19:12:08.964367+00');
INSERT INTO public.plan_prices VALUES (5, 2, 'AU', 'AUD', 29.0000, 290.0000, 0.0300, 0.0600, true, '2026-04-30 19:12:08.964367+00', '2026-04-30 19:12:08.964367+00');
INSERT INTO public.plan_prices VALUES (6, 3, 'AU', 'AUD', 69.0000, 690.0000, 0.0250, 0.0500, true, '2026-04-30 19:12:08.964367+00', '2026-04-30 19:12:08.964367+00');
INSERT INTO public.plan_prices VALUES (7, 1, 'GB', 'GBP', 0.0000, 0.0000, 0.0000, 0.0000, true, '2026-04-30 19:12:08.964367+00', '2026-04-30 19:12:08.964367+00');
INSERT INTO public.plan_prices VALUES (8, 2, 'GB', 'GBP', 19.0000, 190.0000, 0.0200, 0.0400, true, '2026-04-30 19:12:08.964367+00', '2026-04-30 19:12:08.964367+00');
INSERT INTO public.plan_prices VALUES (9, 3, 'GB', 'GBP', 39.0000, 390.0000, 0.0150, 0.0300, true, '2026-04-30 19:12:08.964367+00', '2026-04-30 19:12:08.964367+00');
INSERT INTO public.plan_prices VALUES (10, 1, 'IN', 'INR', 0.0000, 0.0000, 0.0000, 0.0000, true, '2026-04-30 19:12:08.964367+00', '2026-04-30 19:12:08.964367+00');
INSERT INTO public.plan_prices VALUES (11, 2, 'IN', 'INR', 499.0000, 4999.0000, 0.4000, 0.8000, true, '2026-04-30 19:12:08.964367+00', '2026-04-30 19:12:08.964367+00');
INSERT INTO public.plan_prices VALUES (12, 3, 'IN', 'INR', 999.0000, 9990.0000, 0.3000, 0.6000, true, '2026-04-30 19:12:08.964367+00', '2026-04-30 19:12:08.964367+00');
INSERT INTO public.plan_prices VALUES (13, 1, 'SG', 'SGD', 0.0000, 0.0000, 0.0000, 0.0000, true, '2026-04-30 19:12:08.964367+00', '2026-04-30 19:12:08.964367+00');
INSERT INTO public.plan_prices VALUES (14, 2, 'SG', 'SGD', 25.0000, 250.0000, 0.0300, 0.0600, true, '2026-04-30 19:12:08.964367+00', '2026-04-30 19:12:08.964367+00');
INSERT INTO public.plan_prices VALUES (15, 3, 'SG', 'SGD', 65.0000, 650.0000, 0.0200, 0.0400, true, '2026-04-30 19:12:08.964367+00', '2026-04-30 19:12:08.964367+00');
INSERT INTO public.plan_prices VALUES (16, 1, 'US', 'USD', 0.0000, 0.0000, 0.0000, 0.0000, true, '2026-04-30 19:12:08.964367+00', '2026-04-30 19:12:08.964367+00');
INSERT INTO public.plan_prices VALUES (17, 2, 'US', 'USD', 19.0000, 199.0000, 0.0200, 0.0400, true, '2026-04-30 19:12:08.964367+00', '2026-04-30 19:12:08.964367+00');
INSERT INTO public.plan_prices VALUES (18, 3, 'US', 'USD', 49.0000, 490.0000, 0.0150, 0.0300, true, '2026-04-30 19:12:08.964367+00', '2026-04-30 19:12:08.964367+00');


--
-- TOC entry 4356 (class 0 OID 26108)
-- Dependencies: 425
-- Data for Name: plans; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.plans VALUES (1, 'starter', 'Starter', 'Free plan for trying DocuNova with text-based PDFs.', true, 10, '2026-04-24 18:29:34.100274+00', '2026-04-24 18:29:34.100274+00');
INSERT INTO public.plans VALUES (2, 'professional', 'Professional', 'Monthly document intelligence for individuals and growing teams.', true, 20, '2026-04-24 18:29:34.100274+00', '2026-04-24 18:29:34.100274+00');
INSERT INTO public.plans VALUES (3, 'team', 'Team', 'Shared contract workspace with higher limits and team controls.', true, 30, '2026-04-24 18:29:34.100274+00', '2026-04-24 18:29:34.100274+00');


--
-- TOC entry 4364 (class 0 OID 26174)
-- Dependencies: 433
-- Data for Name: regions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.regions VALUES (1, 'AF', 'Afghanistan', 'AFN');
INSERT INTO public.regions VALUES (2, 'AL', 'Albania', 'ALL');
INSERT INTO public.regions VALUES (3, 'DZ', 'Algeria', 'DZD');
INSERT INTO public.regions VALUES (4, 'AD', 'Andorra', 'EUR');
INSERT INTO public.regions VALUES (5, 'AO', 'Angola', 'AOA');
INSERT INTO public.regions VALUES (6, 'AR', 'Argentina', 'ARS');
INSERT INTO public.regions VALUES (7, 'AM', 'Armenia', 'AMD');
INSERT INTO public.regions VALUES (8, 'AU', 'Australia', 'AUD');
INSERT INTO public.regions VALUES (9, 'AT', 'Austria', 'EUR');
INSERT INTO public.regions VALUES (10, 'AZ', 'Azerbaijan', 'AZN');
INSERT INTO public.regions VALUES (11, 'BH', 'Bahrain', 'BHD');
INSERT INTO public.regions VALUES (12, 'BD', 'Bangladesh', 'BDT');
INSERT INTO public.regions VALUES (13, 'BY', 'Belarus', 'BYN');
INSERT INTO public.regions VALUES (14, 'BE', 'Belgium', 'EUR');
INSERT INTO public.regions VALUES (15, 'BZ', 'Belize', 'BZD');
INSERT INTO public.regions VALUES (16, 'BJ', 'Benin', 'XOF');
INSERT INTO public.regions VALUES (17, 'BT', 'Bhutan', 'BTN');
INSERT INTO public.regions VALUES (18, 'BO', 'Bolivia', 'BOB');
INSERT INTO public.regions VALUES (19, 'BA', 'Bosnia and Herzegovina', 'BAM');
INSERT INTO public.regions VALUES (20, 'BW', 'Botswana', 'BWP');
INSERT INTO public.regions VALUES (21, 'BR', 'Brazil', 'BRL');
INSERT INTO public.regions VALUES (22, 'BN', 'Brunei', 'BND');
INSERT INTO public.regions VALUES (23, 'BG', 'Bulgaria', 'BGN');
INSERT INTO public.regions VALUES (24, 'BF', 'Burkina Faso', 'XOF');
INSERT INTO public.regions VALUES (25, 'BI', 'Burundi', 'BIF');
INSERT INTO public.regions VALUES (26, 'KH', 'Cambodia', 'KHR');
INSERT INTO public.regions VALUES (27, 'CM', 'Cameroon', 'XAF');
INSERT INTO public.regions VALUES (28, 'CA', 'Canada', 'CAD');
INSERT INTO public.regions VALUES (29, 'CL', 'Chile', 'CLP');
INSERT INTO public.regions VALUES (30, 'CN', 'China', 'CNY');
INSERT INTO public.regions VALUES (31, 'CO', 'Colombia', 'COP');
INSERT INTO public.regions VALUES (32, 'CR', 'Costa Rica', 'CRC');
INSERT INTO public.regions VALUES (33, 'HR', 'Croatia', 'EUR');
INSERT INTO public.regions VALUES (34, 'CU', 'Cuba', 'CUP');
INSERT INTO public.regions VALUES (35, 'CY', 'Cyprus', 'EUR');
INSERT INTO public.regions VALUES (36, 'CZ', 'Czech Republic', 'CZK');
INSERT INTO public.regions VALUES (37, 'DK', 'Denmark', 'DKK');
INSERT INTO public.regions VALUES (38, 'DO', 'Dominican Republic', 'DOP');
INSERT INTO public.regions VALUES (39, 'EC', 'Ecuador', 'USD');
INSERT INTO public.regions VALUES (40, 'EG', 'Egypt', 'EGP');
INSERT INTO public.regions VALUES (41, 'SV', 'El Salvador', 'USD');
INSERT INTO public.regions VALUES (42, 'EE', 'Estonia', 'EUR');
INSERT INTO public.regions VALUES (43, 'ET', 'Ethiopia', 'ETB');
INSERT INTO public.regions VALUES (44, 'FI', 'Finland', 'EUR');
INSERT INTO public.regions VALUES (45, 'FR', 'France', 'EUR');
INSERT INTO public.regions VALUES (46, 'GE', 'Georgia', 'GEL');
INSERT INTO public.regions VALUES (47, 'DE', 'Germany', 'EUR');
INSERT INTO public.regions VALUES (48, 'GH', 'Ghana', 'GHS');
INSERT INTO public.regions VALUES (49, 'GR', 'Greece', 'EUR');
INSERT INTO public.regions VALUES (50, 'GT', 'Guatemala', 'GTQ');
INSERT INTO public.regions VALUES (51, 'HK', 'Hong Kong', 'HKD');
INSERT INTO public.regions VALUES (52, 'HU', 'Hungary', 'HUF');
INSERT INTO public.regions VALUES (53, 'IS', 'Iceland', 'ISK');
INSERT INTO public.regions VALUES (54, 'IN', 'India', 'INR');
INSERT INTO public.regions VALUES (55, 'ID', 'Indonesia', 'IDR');
INSERT INTO public.regions VALUES (56, 'IR', 'Iran', 'IRR');
INSERT INTO public.regions VALUES (57, 'IQ', 'Iraq', 'IQD');
INSERT INTO public.regions VALUES (58, 'IE', 'Ireland', 'EUR');
INSERT INTO public.regions VALUES (59, 'IL', 'Israel', 'ILS');
INSERT INTO public.regions VALUES (60, 'IT', 'Italy', 'EUR');
INSERT INTO public.regions VALUES (61, 'JM', 'Jamaica', 'JMD');
INSERT INTO public.regions VALUES (62, 'JP', 'Japan', 'JPY');
INSERT INTO public.regions VALUES (63, 'JO', 'Jordan', 'JOD');
INSERT INTO public.regions VALUES (64, 'KZ', 'Kazakhstan', 'KZT');
INSERT INTO public.regions VALUES (65, 'KE', 'Kenya', 'KES');
INSERT INTO public.regions VALUES (66, 'KR', 'South Korea', 'KRW');
INSERT INTO public.regions VALUES (67, 'KW', 'Kuwait', 'KWD');
INSERT INTO public.regions VALUES (68, 'KG', 'Kyrgyzstan', 'KGS');
INSERT INTO public.regions VALUES (69, 'LA', 'Laos', 'LAK');
INSERT INTO public.regions VALUES (70, 'LV', 'Latvia', 'EUR');
INSERT INTO public.regions VALUES (71, 'LB', 'Lebanon', 'LBP');
INSERT INTO public.regions VALUES (72, 'LY', 'Libya', 'LYD');
INSERT INTO public.regions VALUES (73, 'LT', 'Lithuania', 'EUR');
INSERT INTO public.regions VALUES (74, 'LU', 'Luxembourg', 'EUR');
INSERT INTO public.regions VALUES (75, 'MO', 'Macao', 'MOP');
INSERT INTO public.regions VALUES (76, 'MG', 'Madagascar', 'MGA');
INSERT INTO public.regions VALUES (77, 'MW', 'Malawi', 'MWK');
INSERT INTO public.regions VALUES (78, 'MY', 'Malaysia', 'MYR');
INSERT INTO public.regions VALUES (79, 'MV', 'Maldives', 'MVR');
INSERT INTO public.regions VALUES (80, 'ML', 'Mali', 'XOF');
INSERT INTO public.regions VALUES (81, 'MT', 'Malta', 'EUR');
INSERT INTO public.regions VALUES (82, 'MX', 'Mexico', 'MXN');
INSERT INTO public.regions VALUES (83, 'MD', 'Moldova', 'MDL');
INSERT INTO public.regions VALUES (84, 'MN', 'Mongolia', 'MNT');
INSERT INTO public.regions VALUES (85, 'ME', 'Montenegro', 'EUR');
INSERT INTO public.regions VALUES (86, 'MA', 'Morocco', 'MAD');
INSERT INTO public.regions VALUES (87, 'MZ', 'Mozambique', 'MZN');
INSERT INTO public.regions VALUES (88, 'MM', 'Myanmar', 'MMK');
INSERT INTO public.regions VALUES (89, 'NA', 'Namibia', 'NAD');
INSERT INTO public.regions VALUES (90, 'NP', 'Nepal', 'NPR');
INSERT INTO public.regions VALUES (91, 'NL', 'Netherlands', 'EUR');
INSERT INTO public.regions VALUES (92, 'NZ', 'New Zealand', 'NZD');
INSERT INTO public.regions VALUES (93, 'NI', 'Nicaragua', 'NIO');
INSERT INTO public.regions VALUES (94, 'NE', 'Niger', 'XOF');
INSERT INTO public.regions VALUES (95, 'NG', 'Nigeria', 'NGN');
INSERT INTO public.regions VALUES (96, 'NO', 'Norway', 'NOK');
INSERT INTO public.regions VALUES (97, 'OM', 'Oman', 'OMR');
INSERT INTO public.regions VALUES (98, 'PK', 'Pakistan', 'PKR');
INSERT INTO public.regions VALUES (99, 'PA', 'Panama', 'PAB');
INSERT INTO public.regions VALUES (100, 'PY', 'Paraguay', 'PYG');
INSERT INTO public.regions VALUES (101, 'PE', 'Peru', 'PEN');
INSERT INTO public.regions VALUES (102, 'PH', 'Philippines', 'PHP');
INSERT INTO public.regions VALUES (103, 'PL', 'Poland', 'PLN');
INSERT INTO public.regions VALUES (104, 'PT', 'Portugal', 'EUR');
INSERT INTO public.regions VALUES (105, 'QA', 'Qatar', 'QAR');
INSERT INTO public.regions VALUES (106, 'RO', 'Romania', 'RON');
INSERT INTO public.regions VALUES (107, 'RU', 'Russia', 'RUB');
INSERT INTO public.regions VALUES (108, 'RW', 'Rwanda', 'RWF');
INSERT INTO public.regions VALUES (109, 'SA', 'Saudi Arabia', 'SAR');
INSERT INTO public.regions VALUES (110, 'SN', 'Senegal', 'XOF');
INSERT INTO public.regions VALUES (111, 'RS', 'Serbia', 'RSD');
INSERT INTO public.regions VALUES (112, 'SG', 'Singapore', 'SGD');
INSERT INTO public.regions VALUES (113, 'SK', 'Slovakia', 'EUR');
INSERT INTO public.regions VALUES (114, 'SI', 'Slovenia', 'EUR');
INSERT INTO public.regions VALUES (115, 'ZA', 'South Africa', 'ZAR');
INSERT INTO public.regions VALUES (116, 'ES', 'Spain', 'EUR');
INSERT INTO public.regions VALUES (117, 'LK', 'Sri Lanka', 'LKR');
INSERT INTO public.regions VALUES (118, 'SE', 'Sweden', 'SEK');
INSERT INTO public.regions VALUES (119, 'CH', 'Switzerland', 'CHF');
INSERT INTO public.regions VALUES (120, 'TW', 'Taiwan', 'TWD');
INSERT INTO public.regions VALUES (121, 'TH', 'Thailand', 'THB');
INSERT INTO public.regions VALUES (122, 'TN', 'Tunisia', 'TND');
INSERT INTO public.regions VALUES (123, 'TR', 'Turkey', 'TRY');
INSERT INTO public.regions VALUES (124, 'UG', 'Uganda', 'UGX');
INSERT INTO public.regions VALUES (125, 'UA', 'Ukraine', 'UAH');
INSERT INTO public.regions VALUES (126, 'AE', 'United Arab Emirates', 'AED');
INSERT INTO public.regions VALUES (127, 'GB', 'United Kingdom', 'GBP');
INSERT INTO public.regions VALUES (128, 'US', 'United States', 'USD');
INSERT INTO public.regions VALUES (129, 'UY', 'Uruguay', 'UYU');
INSERT INTO public.regions VALUES (130, 'UZ', 'Uzbekistan', 'UZS');
INSERT INTO public.regions VALUES (131, 'VE', 'Venezuela', 'VES');
INSERT INTO public.regions VALUES (132, 'VN', 'Vietnam', 'VND');
INSERT INTO public.regions VALUES (133, 'YE', 'Yemen', 'YER');
INSERT INTO public.regions VALUES (134, 'ZM', 'Zambia', 'ZMW');
INSERT INTO public.regions VALUES (135, 'ZW', 'Zimbabwe', 'ZWL');


--
-- TOC entry 4322 (class 0 OID 19843)
-- Dependencies: 391
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.roles VALUES (1, '12fc9991-a880-492e-9262-268741768b2d', 'Super Admin', 'superadmin', true, 'Application-wide administrator', '2026-05-02 14:29:24.240751+00', '2026-05-02 14:29:24.240751+00');
INSERT INTO public.roles VALUES (2, '087763c3-b8e9-4804-b355-ac114541e547', 'Organisation Admin', 'admin', false, 'Organisation wide administrator', '2026-05-06 17:54:02.159908+00', '2026-05-06 17:54:02.159908+00');
INSERT INTO public.roles VALUES (3, '5af60ecb-f23f-4804-a65d-84445cacc7ca', 'Organisation Member', 'member', false, 'Organisation invited member', '2026-05-06 17:56:31.550696+00', '2026-05-06 17:56:31.550696+00');


--
-- TOC entry 4352 (class 0 OID 20404)
-- Dependencies: 421
-- Data for Name: search_history; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 4368 (class 0 OID 26210)
-- Dependencies: 437
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 4370 (class 0 OID 26240)
-- Dependencies: 439
-- Data for Name: usage_records; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 4332 (class 0 OID 19987)
-- Dependencies: 401
-- Data for Name: user_oauth_accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 4326 (class 0 OID 19917)
-- Dependencies: 395
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 4320 (class 0 OID 19819)
-- Dependencies: 389
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.users VALUES (1, '24434bb5-aab1-4548-b12a-f1cdbb0bb0b3', 1, 'superadmin@docunova.app', '$2a$12$OfPzD1WwYP43CcrADX.RDO9UUp43G6O0xxsem/BPqv7fCT6QL.Vlm', 'local', NULL, NULL, NULL, 'Super Admin', NULL, NULL, '2026-05-02 14:29:24.240751+00', false, NULL, 'active', NULL, NULL, '2026-05-02 14:29:24.240751+00', '2026-05-02 14:29:24.240751+00', NULL, true, true, NULL, NULL);


--
-- TOC entry 4459 (class 0 OID 0)
-- Dependencies: 412
-- Name: ai_jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ai_jobs_id_seq', 1, false);


--
-- TOC entry 4460 (class 0 OID 0)
-- Dependencies: 410
-- Name: document_access_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.document_access_history_id_seq', 1, false);


--
-- TOC entry 4461 (class 0 OID 0)
-- Dependencies: 416
-- Name: document_ai_summaries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.document_ai_summaries_id_seq', 1, false);


--
-- TOC entry 4462 (class 0 OID 0)
-- Dependencies: 418
-- Name: document_classifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.document_classifications_id_seq', 1, false);


--
-- TOC entry 4463 (class 0 OID 0)
-- Dependencies: 414
-- Name: document_ocr_results_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.document_ocr_results_id_seq', 1, false);


--
-- TOC entry 4464 (class 0 OID 0)
-- Dependencies: 408
-- Name: document_versions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.document_versions_id_seq', 1, false);


--
-- TOC entry 4465 (class 0 OID 0)
-- Dependencies: 406
-- Name: documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.documents_id_seq', 1, false);


--
-- TOC entry 4466 (class 0 OID 0)
-- Dependencies: 398
-- Name: email_verification_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.email_verification_tokens_id_seq', 1, false);


--
-- TOC entry 4467 (class 0 OID 0)
-- Dependencies: 426
-- Name: features_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.features_id_seq', 1, false);


--
-- TOC entry 4468 (class 0 OID 0)
-- Dependencies: 404
-- Name: folders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.folders_id_seq', 1, false);


--
-- TOC entry 4469 (class 0 OID 0)
-- Dependencies: 402
-- Name: oauth_callback_states_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.oauth_callback_states_id_seq', 1, false);


--
-- TOC entry 4470 (class 0 OID 0)
-- Dependencies: 422
-- Name: organization_invitations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.organization_invitations_id_seq', 1, false);


--
-- TOC entry 4471 (class 0 OID 0)
-- Dependencies: 392
-- Name: organization_members_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.organization_members_id_seq', 1, false);


--
-- TOC entry 4472 (class 0 OID 0)
-- Dependencies: 386
-- Name: organizations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.organizations_id_seq', 1, false);


--
-- TOC entry 4473 (class 0 OID 0)
-- Dependencies: 396
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.password_reset_tokens_id_seq', 1, false);


--
-- TOC entry 4474 (class 0 OID 0)
-- Dependencies: 428
-- Name: plan_features_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.plan_features_id_seq', 1, false);


--
-- TOC entry 4475 (class 0 OID 0)
-- Dependencies: 430
-- Name: plan_limits_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.plan_limits_id_seq', 1, false);


--
-- TOC entry 4476 (class 0 OID 0)
-- Dependencies: 434
-- Name: plan_prices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.plan_prices_id_seq', 1, false);


--
-- TOC entry 4477 (class 0 OID 0)
-- Dependencies: 424
-- Name: plans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.plans_id_seq', 1, false);


--
-- TOC entry 4478 (class 0 OID 0)
-- Dependencies: 432
-- Name: regions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.regions_id_seq', 8, true);


--
-- TOC entry 4479 (class 0 OID 0)
-- Dependencies: 390
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 3, true);


--
-- TOC entry 4480 (class 0 OID 0)
-- Dependencies: 420
-- Name: search_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.search_history_id_seq', 1, false);


--
-- TOC entry 4481 (class 0 OID 0)
-- Dependencies: 436
-- Name: subscriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.subscriptions_id_seq', 1, false);


--
-- TOC entry 4482 (class 0 OID 0)
-- Dependencies: 438
-- Name: usage_records_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usage_records_id_seq', 1, false);


--
-- TOC entry 4483 (class 0 OID 0)
-- Dependencies: 400
-- Name: user_oauth_accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_oauth_accounts_id_seq', 1, false);


--
-- TOC entry 4484 (class 0 OID 0)
-- Dependencies: 394
-- Name: user_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_sessions_id_seq', 1, false);


--
-- TOC entry 4485 (class 0 OID 0)
-- Dependencies: 388
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 1, false);


--
-- TOC entry 4050 (class 2606 OID 20240)
-- Name: ai_jobs ai_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_jobs
    ADD CONSTRAINT ai_jobs_pkey PRIMARY KEY (id);


--
-- TOC entry 4052 (class 2606 OID 20242)
-- Name: ai_jobs ai_jobs_uuid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_jobs
    ADD CONSTRAINT ai_jobs_uuid_key UNIQUE (uuid);


--
-- TOC entry 4046 (class 2606 OID 20142)
-- Name: document_access_history document_access_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_access_history
    ADD CONSTRAINT document_access_history_pkey PRIMARY KEY (id);


--
-- TOC entry 4065 (class 2606 OID 20295)
-- Name: document_ai_summaries document_ai_summaries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_ai_summaries
    ADD CONSTRAINT document_ai_summaries_pkey PRIMARY KEY (id);


--
-- TOC entry 4068 (class 2606 OID 20338)
-- Name: document_classifications document_classifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_classifications
    ADD CONSTRAINT document_classifications_pkey PRIMARY KEY (id);


--
-- TOC entry 4060 (class 2606 OID 20270)
-- Name: document_ocr_results document_ocr_results_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_ocr_results
    ADD CONSTRAINT document_ocr_results_pkey PRIMARY KEY (id);


--
-- TOC entry 4039 (class 2606 OID 20115)
-- Name: document_versions document_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_versions
    ADD CONSTRAINT document_versions_pkey PRIMARY KEY (id);


--
-- TOC entry 4041 (class 2606 OID 20117)
-- Name: document_versions document_versions_uuid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_versions
    ADD CONSTRAINT document_versions_uuid_key UNIQUE (uuid);


--
-- TOC entry 4028 (class 2606 OID 20079)
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- TOC entry 4030 (class 2606 OID 20081)
-- Name: documents documents_uuid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_uuid_key UNIQUE (uuid);


--
-- TOC entry 4003 (class 2606 OID 19959)
-- Name: email_verification_tokens email_verification_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_verification_tokens
    ADD CONSTRAINT email_verification_tokens_pkey PRIMARY KEY (id);


--
-- TOC entry 4088 (class 2606 OID 26135)
-- Name: features features_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.features
    ADD CONSTRAINT features_key_key UNIQUE (key);


--
-- TOC entry 4090 (class 2606 OID 26133)
-- Name: features features_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.features
    ADD CONSTRAINT features_pkey PRIMARY KEY (id);


--
-- TOC entry 4022 (class 2606 OID 20038)
-- Name: folders folders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT folders_pkey PRIMARY KEY (id);


--
-- TOC entry 4024 (class 2606 OID 20040)
-- Name: folders folders_uuid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT folders_uuid_key UNIQUE (uuid);


--
-- TOC entry 4018 (class 2606 OID 20024)
-- Name: oauth_callback_states oauth_callback_states_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.oauth_callback_states
    ADD CONSTRAINT oauth_callback_states_pkey PRIMARY KEY (id);


--
-- TOC entry 4020 (class 2606 OID 20026)
-- Name: oauth_callback_states oauth_callback_states_state_hash_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.oauth_callback_states
    ADD CONSTRAINT oauth_callback_states_state_hash_key UNIQUE (state_hash);


--
-- TOC entry 4079 (class 2606 OID 23485)
-- Name: organization_invitations organization_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_invitations
    ADD CONSTRAINT organization_invitations_pkey PRIMARY KEY (id);


--
-- TOC entry 4081 (class 2606 OID 23487)
-- Name: organization_invitations organization_invitations_uuid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_invitations
    ADD CONSTRAINT organization_invitations_uuid_key UNIQUE (uuid);


--
-- TOC entry 3988 (class 2606 OID 19891)
-- Name: organization_members organization_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_members
    ADD CONSTRAINT organization_members_pkey PRIMARY KEY (id);


--
-- TOC entry 3990 (class 2606 OID 19893)
-- Name: organization_members organization_members_uuid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_members
    ADD CONSTRAINT organization_members_uuid_key UNIQUE (uuid);


--
-- TOC entry 3964 (class 2606 OID 19813)
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- TOC entry 3966 (class 2606 OID 19817)
-- Name: organizations organizations_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_slug_key UNIQUE (slug);


--
-- TOC entry 3968 (class 2606 OID 19815)
-- Name: organizations organizations_uuid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_uuid_key UNIQUE (uuid);


--
-- TOC entry 4001 (class 2606 OID 19944)
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- TOC entry 4093 (class 2606 OID 26143)
-- Name: plan_features plan_features_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plan_features
    ADD CONSTRAINT plan_features_pkey PRIMARY KEY (id);


--
-- TOC entry 4098 (class 2606 OID 26164)
-- Name: plan_limits plan_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plan_limits
    ADD CONSTRAINT plan_limits_pkey PRIMARY KEY (id);


--
-- TOC entry 4107 (class 2606 OID 26195)
-- Name: plan_prices plan_prices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plan_prices
    ADD CONSTRAINT plan_prices_pkey PRIMARY KEY (id);


--
-- TOC entry 4084 (class 2606 OID 26119)
-- Name: plans plans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_pkey PRIMARY KEY (id);


--
-- TOC entry 4086 (class 2606 OID 26121)
-- Name: plans plans_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_slug_key UNIQUE (slug);


--
-- TOC entry 4102 (class 2606 OID 26181)
-- Name: regions regions_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.regions
    ADD CONSTRAINT regions_code_key UNIQUE (code);


--
-- TOC entry 4104 (class 2606 OID 26179)
-- Name: regions regions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.regions
    ADD CONSTRAINT regions_pkey PRIMARY KEY (id);


--
-- TOC entry 3981 (class 2606 OID 19854)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 3983 (class 2606 OID 19856)
-- Name: roles roles_uuid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_uuid_key UNIQUE (uuid);


--
-- TOC entry 4074 (class 2606 OID 20416)
-- Name: search_history search_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.search_history
    ADD CONSTRAINT search_history_pkey PRIMARY KEY (id);


--
-- TOC entry 4115 (class 2606 OID 26219)
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- TOC entry 4063 (class 2606 OID 20272)
-- Name: document_ocr_results uq_document_ocr_result; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_ocr_results
    ADD CONSTRAINT uq_document_ocr_result UNIQUE (document_id);


--
-- TOC entry 4044 (class 2606 OID 20119)
-- Name: document_versions uq_document_version; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_versions
    ADD CONSTRAINT uq_document_version UNIQUE (document_id, version_number);


--
-- TOC entry 4008 (class 2606 OID 20005)
-- Name: user_oauth_accounts uq_oauth_provider_user; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_oauth_accounts
    ADD CONSTRAINT uq_oauth_provider_user UNIQUE (provider, provider_user_id);


--
-- TOC entry 3992 (class 2606 OID 19895)
-- Name: organization_members uq_org_member; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_members
    ADD CONSTRAINT uq_org_member UNIQUE (organization_id, user_id);


--
-- TOC entry 4095 (class 2606 OID 26145)
-- Name: plan_features uq_plan_features_plan_feature; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plan_features
    ADD CONSTRAINT uq_plan_features_plan_feature UNIQUE (plan_id, feature_id);


--
-- TOC entry 4100 (class 2606 OID 26166)
-- Name: plan_limits uq_plan_limits_plan_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plan_limits
    ADD CONSTRAINT uq_plan_limits_plan_key UNIQUE (plan_id, key);


--
-- TOC entry 4109 (class 2606 OID 26197)
-- Name: plan_prices uq_plan_prices_plan_region; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plan_prices
    ADD CONSTRAINT uq_plan_prices_plan_region UNIQUE (plan_id, region_code);


--
-- TOC entry 4010 (class 2606 OID 20003)
-- Name: user_oauth_accounts uq_user_oauth_provider; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_oauth_accounts
    ADD CONSTRAINT uq_user_oauth_provider UNIQUE (user_id, provider);


--
-- TOC entry 3975 (class 2606 OID 19836)
-- Name: users uq_users_org_email; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT uq_users_org_email UNIQUE (organization_id, email);


--
-- TOC entry 4120 (class 2606 OID 26248)
-- Name: usage_records usage_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usage_records
    ADD CONSTRAINT usage_records_pkey PRIMARY KEY (id);


--
-- TOC entry 4012 (class 2606 OID 19999)
-- Name: user_oauth_accounts user_oauth_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_oauth_accounts
    ADD CONSTRAINT user_oauth_accounts_pkey PRIMARY KEY (id);


--
-- TOC entry 4014 (class 2606 OID 20001)
-- Name: user_oauth_accounts user_oauth_accounts_uuid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_oauth_accounts
    ADD CONSTRAINT user_oauth_accounts_uuid_key UNIQUE (uuid);


--
-- TOC entry 3996 (class 2606 OID 19927)
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 3998 (class 2606 OID 19929)
-- Name: user_sessions user_sessions_uuid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_uuid_key UNIQUE (uuid);


--
-- TOC entry 3977 (class 2606 OID 19832)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3979 (class 2606 OID 19834)
-- Name: users users_uuid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_uuid_key UNIQUE (uuid);


--
-- TOC entry 4053 (class 1259 OID 20694)
-- Name: idx_ai_jobs_doc; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_jobs_doc ON public.ai_jobs USING btree (document_id, created_at DESC);


--
-- TOC entry 4054 (class 1259 OID 20728)
-- Name: idx_ai_jobs_input_gin; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_jobs_input_gin ON public.ai_jobs USING gin (input_json);


--
-- TOC entry 4055 (class 1259 OID 20695)
-- Name: idx_ai_jobs_org_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_jobs_org_status ON public.ai_jobs USING btree (organization_id, status);


--
-- TOC entry 4056 (class 1259 OID 20729)
-- Name: idx_ai_jobs_output_gin; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_jobs_output_gin ON public.ai_jobs USING gin (output_json);


--
-- TOC entry 4057 (class 1259 OID 20696)
-- Name: idx_ai_jobs_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_jobs_status ON public.ai_jobs USING btree (status);


--
-- TOC entry 4058 (class 1259 OID 20697)
-- Name: idx_ai_jobs_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_jobs_type ON public.ai_jobs USING btree (job_type);


--
-- TOC entry 4069 (class 1259 OID 20701)
-- Name: idx_classifications_doc; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_classifications_doc ON public.document_classifications USING btree (document_id);


--
-- TOC entry 4070 (class 1259 OID 20702)
-- Name: idx_classifications_primary; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_classifications_primary ON public.document_classifications USING btree (document_id, is_primary);


--
-- TOC entry 4047 (class 1259 OID 20689)
-- Name: idx_doc_access_doc_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_doc_access_doc_time ON public.document_access_history USING btree (document_id, accessed_at DESC);


--
-- TOC entry 4048 (class 1259 OID 20688)
-- Name: idx_doc_access_user_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_doc_access_user_time ON public.document_access_history USING btree (user_id, accessed_at DESC);


--
-- TOC entry 4042 (class 1259 OID 20687)
-- Name: idx_document_versions_doc_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_document_versions_doc_created_at ON public.document_versions USING btree (document_id, created_at DESC);


--
-- TOC entry 4031 (class 1259 OID 20686)
-- Name: idx_documents_current_version; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documents_current_version ON public.documents USING btree (current_version_id);


--
-- TOC entry 4032 (class 1259 OID 20684)
-- Name: idx_documents_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documents_deleted_at ON public.documents USING btree (deleted_at);


--
-- TOC entry 4033 (class 1259 OID 20727)
-- Name: idx_documents_metadata_gin; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documents_metadata_gin ON public.documents USING gin (metadata_json);


--
-- TOC entry 4034 (class 1259 OID 20681)
-- Name: idx_documents_org_folder; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documents_org_folder ON public.documents USING btree (organization_id, folder_id);


--
-- TOC entry 4035 (class 1259 OID 20682)
-- Name: idx_documents_owner; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documents_owner ON public.documents USING btree (owner_user_id);


--
-- TOC entry 4036 (class 1259 OID 20683)
-- Name: idx_documents_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documents_status ON public.documents USING btree (status);


--
-- TOC entry 4037 (class 1259 OID 20685)
-- Name: idx_documents_uploaded_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documents_uploaded_at ON public.documents USING btree (uploaded_at DESC);


--
-- TOC entry 4004 (class 1259 OID 20672)
-- Name: idx_email_verification_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_email_verification_user ON public.email_verification_tokens USING btree (user_id, created_at DESC);


--
-- TOC entry 4025 (class 1259 OID 20680)
-- Name: idx_folders_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_folders_deleted_at ON public.folders USING btree (deleted_at);


--
-- TOC entry 4026 (class 1259 OID 20679)
-- Name: idx_folders_org_parent; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_folders_org_parent ON public.folders USING btree (organization_id, parent_id);


--
-- TOC entry 4005 (class 1259 OID 20676)
-- Name: idx_oauth_accounts_provider_last_login; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_oauth_accounts_provider_last_login ON public.user_oauth_accounts USING btree (provider, last_login_at DESC);


--
-- TOC entry 4006 (class 1259 OID 20675)
-- Name: idx_oauth_accounts_user_provider; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_oauth_accounts_user_provider ON public.user_oauth_accounts USING btree (user_id, provider);


--
-- TOC entry 4015 (class 1259 OID 20678)
-- Name: idx_oauth_callback_active_state; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_oauth_callback_active_state ON public.oauth_callback_states USING btree (state_hash, expires_at) WHERE (consumed_at IS NULL);


--
-- TOC entry 4016 (class 1259 OID 20677)
-- Name: idx_oauth_callback_provider_expires; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_oauth_callback_provider_expires ON public.oauth_callback_states USING btree (provider, expires_at);


--
-- TOC entry 4061 (class 1259 OID 20698)
-- Name: idx_ocr_doc; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ocr_doc ON public.document_ocr_results USING btree (document_id);


--
-- TOC entry 4075 (class 1259 OID 23504)
-- Name: idx_org_invitations_org_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_org_invitations_org_email ON public.organization_invitations USING btree (organization_id, email);


--
-- TOC entry 4076 (class 1259 OID 23503)
-- Name: idx_org_invitations_org_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_org_invitations_org_status ON public.organization_invitations USING btree (organization_id, status);


--
-- TOC entry 4077 (class 1259 OID 23505)
-- Name: idx_org_invitations_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_org_invitations_token ON public.organization_invitations USING btree (token_hash);


--
-- TOC entry 3984 (class 1259 OID 20666)
-- Name: idx_org_members_org; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_org_members_org ON public.organization_members USING btree (organization_id);


--
-- TOC entry 3985 (class 1259 OID 20668)
-- Name: idx_org_members_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_org_members_role ON public.organization_members USING btree (role_id);


--
-- TOC entry 3986 (class 1259 OID 20667)
-- Name: idx_org_members_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_org_members_user ON public.organization_members USING btree (user_id);


--
-- TOC entry 3999 (class 1259 OID 20671)
-- Name: idx_password_reset_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_password_reset_user ON public.password_reset_tokens USING btree (user_id, created_at DESC);


--
-- TOC entry 4091 (class 1259 OID 26156)
-- Name: idx_plan_features_feature; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plan_features_feature ON public.plan_features USING btree (feature_id);


--
-- TOC entry 4096 (class 1259 OID 26172)
-- Name: idx_plan_limits_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plan_limits_key ON public.plan_limits USING btree (key);


--
-- TOC entry 4105 (class 1259 OID 26208)
-- Name: idx_plan_prices_region_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plan_prices_region_active ON public.plan_prices USING btree (region_code, is_active);


--
-- TOC entry 4082 (class 1259 OID 26122)
-- Name: idx_plans_active_sort; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plans_active_sort ON public.plans USING btree (is_active, sort_order);


--
-- TOC entry 4071 (class 1259 OID 20707)
-- Name: idx_search_history_org_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_search_history_org_time ON public.search_history USING btree (organization_id, created_at DESC);


--
-- TOC entry 4072 (class 1259 OID 20706)
-- Name: idx_search_history_user_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_search_history_user_time ON public.search_history USING btree (user_id, created_at DESC);


--
-- TOC entry 3993 (class 1259 OID 20670)
-- Name: idx_sessions_expires_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sessions_expires_at ON public.user_sessions USING btree (expires_at);


--
-- TOC entry 3994 (class 1259 OID 20669)
-- Name: idx_sessions_user_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sessions_user_status ON public.user_sessions USING btree (user_id, status);


--
-- TOC entry 4110 (class 1259 OID 26238)
-- Name: idx_subscriptions_period_end; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subscriptions_period_end ON public.subscriptions USING btree (current_period_end);


--
-- TOC entry 4111 (class 1259 OID 26236)
-- Name: idx_subscriptions_plan; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subscriptions_plan ON public.subscriptions USING btree (plan_id);


--
-- TOC entry 4112 (class 1259 OID 26237)
-- Name: idx_subscriptions_region; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subscriptions_region ON public.subscriptions USING btree (region_code);


--
-- TOC entry 4113 (class 1259 OID 26235)
-- Name: idx_subscriptions_user_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subscriptions_user_status ON public.subscriptions USING btree (user_id, status);


--
-- TOC entry 4066 (class 1259 OID 20699)
-- Name: idx_summaries_doc_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_summaries_doc_type ON public.document_ai_summaries USING btree (document_id, summary_type);


--
-- TOC entry 4116 (class 1259 OID 26266)
-- Name: idx_usage_records_document; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usage_records_document ON public.usage_records USING btree (document_id);


--
-- TOC entry 4117 (class 1259 OID 26265)
-- Name: idx_usage_records_subscription_month; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usage_records_subscription_month ON public.usage_records USING btree (subscription_id, usage_month);


--
-- TOC entry 4118 (class 1259 OID 26264)
-- Name: idx_usage_records_user_month; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usage_records_user_month ON public.usage_records USING btree (user_id, usage_month);


--
-- TOC entry 3969 (class 1259 OID 26105)
-- Name: idx_users_country_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_country_code ON public.users USING btree (country_code);


--
-- TOC entry 3970 (class 1259 OID 20664)
-- Name: idx_users_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_deleted_at ON public.users USING btree (deleted_at);


--
-- TOC entry 3971 (class 1259 OID 20662)
-- Name: idx_users_org_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_org_email ON public.users USING btree (organization_id, email);


--
-- TOC entry 3972 (class 1259 OID 26106)
-- Name: idx_users_region_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_region_code ON public.users USING btree (region_code);


--
-- TOC entry 3973 (class 1259 OID 20663)
-- Name: idx_users_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_status ON public.users USING btree (status);


--
-- TOC entry 4143 (class 2606 OID 20248)
-- Name: ai_jobs ai_jobs_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_jobs
    ADD CONSTRAINT ai_jobs_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- TOC entry 4144 (class 2606 OID 20243)
-- Name: ai_jobs ai_jobs_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_jobs
    ADD CONSTRAINT ai_jobs_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- TOC entry 4145 (class 2606 OID 20253)
-- Name: ai_jobs ai_jobs_triggered_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_jobs
    ADD CONSTRAINT ai_jobs_triggered_by_fkey FOREIGN KEY (triggered_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 4141 (class 2606 OID 20143)
-- Name: document_access_history document_access_history_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_access_history
    ADD CONSTRAINT document_access_history_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- TOC entry 4142 (class 2606 OID 20148)
-- Name: document_access_history document_access_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_access_history
    ADD CONSTRAINT document_access_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4148 (class 2606 OID 20301)
-- Name: document_ai_summaries document_ai_summaries_ai_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_ai_summaries
    ADD CONSTRAINT document_ai_summaries_ai_job_id_fkey FOREIGN KEY (ai_job_id) REFERENCES public.ai_jobs(id) ON DELETE SET NULL;


--
-- TOC entry 4149 (class 2606 OID 20296)
-- Name: document_ai_summaries document_ai_summaries_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_ai_summaries
    ADD CONSTRAINT document_ai_summaries_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- TOC entry 4150 (class 2606 OID 20344)
-- Name: document_classifications document_classifications_ai_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_classifications
    ADD CONSTRAINT document_classifications_ai_job_id_fkey FOREIGN KEY (ai_job_id) REFERENCES public.ai_jobs(id) ON DELETE SET NULL;


--
-- TOC entry 4151 (class 2606 OID 20339)
-- Name: document_classifications document_classifications_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_classifications
    ADD CONSTRAINT document_classifications_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- TOC entry 4146 (class 2606 OID 20278)
-- Name: document_ocr_results document_ocr_results_ai_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_ocr_results
    ADD CONSTRAINT document_ocr_results_ai_job_id_fkey FOREIGN KEY (ai_job_id) REFERENCES public.ai_jobs(id) ON DELETE SET NULL;


--
-- TOC entry 4147 (class 2606 OID 20273)
-- Name: document_ocr_results document_ocr_results_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_ocr_results
    ADD CONSTRAINT document_ocr_results_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- TOC entry 4139 (class 2606 OID 20125)
-- Name: document_versions document_versions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_versions
    ADD CONSTRAINT document_versions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- TOC entry 4140 (class 2606 OID 20120)
-- Name: document_versions document_versions_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_versions
    ADD CONSTRAINT document_versions_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- TOC entry 4134 (class 2606 OID 20097)
-- Name: documents documents_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 4135 (class 2606 OID 20087)
-- Name: documents documents_folder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.folders(id) ON DELETE SET NULL;


--
-- TOC entry 4136 (class 2606 OID 20082)
-- Name: documents documents_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- TOC entry 4137 (class 2606 OID 20092)
-- Name: documents documents_owner_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- TOC entry 4128 (class 2606 OID 19960)
-- Name: email_verification_tokens email_verification_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_verification_tokens
    ADD CONSTRAINT email_verification_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4138 (class 2606 OID 23918)
-- Name: documents fk_documents_current_version; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT fk_documents_current_version FOREIGN KEY (current_version_id) REFERENCES public.document_versions(id);


--
-- TOC entry 4154 (class 2606 OID 23498)
-- Name: organization_invitations fk_org_invitations_accepted_by; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_invitations
    ADD CONSTRAINT fk_org_invitations_accepted_by FOREIGN KEY (accepted_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 4155 (class 2606 OID 23493)
-- Name: organization_invitations fk_org_invitations_invited_by; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_invitations
    ADD CONSTRAINT fk_org_invitations_invited_by FOREIGN KEY (invited_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 4156 (class 2606 OID 23488)
-- Name: organization_invitations fk_org_invitations_org; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_invitations
    ADD CONSTRAINT fk_org_invitations_org FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- TOC entry 4130 (class 2606 OID 20051)
-- Name: folders folders_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT folders_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- TOC entry 4131 (class 2606 OID 20056)
-- Name: folders folders_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT folders_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 4132 (class 2606 OID 20041)
-- Name: folders folders_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT folders_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- TOC entry 4133 (class 2606 OID 20046)
-- Name: folders folders_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT folders_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.folders(id) ON DELETE CASCADE;


--
-- TOC entry 4122 (class 2606 OID 19911)
-- Name: organization_members organization_members_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_members
    ADD CONSTRAINT organization_members_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 4123 (class 2606 OID 19896)
-- Name: organization_members organization_members_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_members
    ADD CONSTRAINT organization_members_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- TOC entry 4124 (class 2606 OID 19906)
-- Name: organization_members organization_members_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_members
    ADD CONSTRAINT organization_members_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE SET NULL;


--
-- TOC entry 4125 (class 2606 OID 19901)
-- Name: organization_members organization_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_members
    ADD CONSTRAINT organization_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4127 (class 2606 OID 19945)
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4157 (class 2606 OID 26151)
-- Name: plan_features plan_features_feature_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plan_features
    ADD CONSTRAINT plan_features_feature_id_fkey FOREIGN KEY (feature_id) REFERENCES public.features(id) ON DELETE CASCADE;


--
-- TOC entry 4158 (class 2606 OID 26146)
-- Name: plan_features plan_features_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plan_features
    ADD CONSTRAINT plan_features_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON DELETE CASCADE;


--
-- TOC entry 4159 (class 2606 OID 26167)
-- Name: plan_limits plan_limits_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plan_limits
    ADD CONSTRAINT plan_limits_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON DELETE CASCADE;


--
-- TOC entry 4160 (class 2606 OID 26198)
-- Name: plan_prices plan_prices_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plan_prices
    ADD CONSTRAINT plan_prices_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON DELETE CASCADE;


--
-- TOC entry 4161 (class 2606 OID 26203)
-- Name: plan_prices plan_prices_region_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plan_prices
    ADD CONSTRAINT plan_prices_region_code_fkey FOREIGN KEY (region_code) REFERENCES public.regions(code) ON DELETE RESTRICT;


--
-- TOC entry 4152 (class 2606 OID 20417)
-- Name: search_history search_history_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.search_history
    ADD CONSTRAINT search_history_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- TOC entry 4153 (class 2606 OID 20422)
-- Name: search_history search_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.search_history
    ADD CONSTRAINT search_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4162 (class 2606 OID 26225)
-- Name: subscriptions subscriptions_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON DELETE RESTRICT;


--
-- TOC entry 4163 (class 2606 OID 26230)
-- Name: subscriptions subscriptions_region_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_region_code_fkey FOREIGN KEY (region_code) REFERENCES public.regions(code) ON DELETE RESTRICT;


--
-- TOC entry 4164 (class 2606 OID 26220)
-- Name: subscriptions subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4165 (class 2606 OID 26259)
-- Name: usage_records usage_records_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usage_records
    ADD CONSTRAINT usage_records_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE SET NULL;


--
-- TOC entry 4166 (class 2606 OID 26254)
-- Name: usage_records usage_records_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usage_records
    ADD CONSTRAINT usage_records_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id) ON DELETE SET NULL;


--
-- TOC entry 4167 (class 2606 OID 26249)
-- Name: usage_records usage_records_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usage_records
    ADD CONSTRAINT usage_records_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4129 (class 2606 OID 20006)
-- Name: user_oauth_accounts user_oauth_accounts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_oauth_accounts
    ADD CONSTRAINT user_oauth_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4126 (class 2606 OID 19930)
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4121 (class 2606 OID 19837)
-- Name: users users_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE RESTRICT;


--
-- TOC entry 4377 (class 0 OID 0)
-- Dependencies: 131
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- TOC entry 4378 (class 0 OID 0)
-- Dependencies: 413
-- Name: TABLE ai_jobs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.ai_jobs TO anon;
GRANT ALL ON TABLE public.ai_jobs TO authenticated;
GRANT ALL ON TABLE public.ai_jobs TO service_role;


--
-- TOC entry 4380 (class 0 OID 0)
-- Dependencies: 412
-- Name: SEQUENCE ai_jobs_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.ai_jobs_id_seq TO anon;
GRANT ALL ON SEQUENCE public.ai_jobs_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.ai_jobs_id_seq TO service_role;


--
-- TOC entry 4381 (class 0 OID 0)
-- Dependencies: 411
-- Name: TABLE document_access_history; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.document_access_history TO anon;
GRANT ALL ON TABLE public.document_access_history TO authenticated;
GRANT ALL ON TABLE public.document_access_history TO service_role;


--
-- TOC entry 4383 (class 0 OID 0)
-- Dependencies: 410
-- Name: SEQUENCE document_access_history_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.document_access_history_id_seq TO anon;
GRANT ALL ON SEQUENCE public.document_access_history_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.document_access_history_id_seq TO service_role;


--
-- TOC entry 4384 (class 0 OID 0)
-- Dependencies: 417
-- Name: TABLE document_ai_summaries; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.document_ai_summaries TO anon;
GRANT ALL ON TABLE public.document_ai_summaries TO authenticated;
GRANT ALL ON TABLE public.document_ai_summaries TO service_role;


--
-- TOC entry 4386 (class 0 OID 0)
-- Dependencies: 416
-- Name: SEQUENCE document_ai_summaries_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.document_ai_summaries_id_seq TO anon;
GRANT ALL ON SEQUENCE public.document_ai_summaries_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.document_ai_summaries_id_seq TO service_role;


--
-- TOC entry 4387 (class 0 OID 0)
-- Dependencies: 419
-- Name: TABLE document_classifications; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.document_classifications TO anon;
GRANT ALL ON TABLE public.document_classifications TO authenticated;
GRANT ALL ON TABLE public.document_classifications TO service_role;


--
-- TOC entry 4389 (class 0 OID 0)
-- Dependencies: 418
-- Name: SEQUENCE document_classifications_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.document_classifications_id_seq TO anon;
GRANT ALL ON SEQUENCE public.document_classifications_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.document_classifications_id_seq TO service_role;


--
-- TOC entry 4390 (class 0 OID 0)
-- Dependencies: 415
-- Name: TABLE document_ocr_results; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.document_ocr_results TO anon;
GRANT ALL ON TABLE public.document_ocr_results TO authenticated;
GRANT ALL ON TABLE public.document_ocr_results TO service_role;


--
-- TOC entry 4392 (class 0 OID 0)
-- Dependencies: 414
-- Name: SEQUENCE document_ocr_results_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.document_ocr_results_id_seq TO anon;
GRANT ALL ON SEQUENCE public.document_ocr_results_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.document_ocr_results_id_seq TO service_role;


--
-- TOC entry 4393 (class 0 OID 0)
-- Dependencies: 409
-- Name: TABLE document_versions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.document_versions TO anon;
GRANT ALL ON TABLE public.document_versions TO authenticated;
GRANT ALL ON TABLE public.document_versions TO service_role;


--
-- TOC entry 4395 (class 0 OID 0)
-- Dependencies: 408
-- Name: SEQUENCE document_versions_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.document_versions_id_seq TO anon;
GRANT ALL ON SEQUENCE public.document_versions_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.document_versions_id_seq TO service_role;


--
-- TOC entry 4396 (class 0 OID 0)
-- Dependencies: 407
-- Name: TABLE documents; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.documents TO anon;
GRANT ALL ON TABLE public.documents TO authenticated;
GRANT ALL ON TABLE public.documents TO service_role;


--
-- TOC entry 4398 (class 0 OID 0)
-- Dependencies: 406
-- Name: SEQUENCE documents_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.documents_id_seq TO anon;
GRANT ALL ON SEQUENCE public.documents_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.documents_id_seq TO service_role;


--
-- TOC entry 4399 (class 0 OID 0)
-- Dependencies: 399
-- Name: TABLE email_verification_tokens; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.email_verification_tokens TO anon;
GRANT ALL ON TABLE public.email_verification_tokens TO authenticated;
GRANT ALL ON TABLE public.email_verification_tokens TO service_role;


--
-- TOC entry 4401 (class 0 OID 0)
-- Dependencies: 398
-- Name: SEQUENCE email_verification_tokens_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.email_verification_tokens_id_seq TO anon;
GRANT ALL ON SEQUENCE public.email_verification_tokens_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.email_verification_tokens_id_seq TO service_role;


--
-- TOC entry 4402 (class 0 OID 0)
-- Dependencies: 427
-- Name: TABLE features; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.features TO anon;
GRANT ALL ON TABLE public.features TO authenticated;
GRANT ALL ON TABLE public.features TO service_role;


--
-- TOC entry 4404 (class 0 OID 0)
-- Dependencies: 426
-- Name: SEQUENCE features_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.features_id_seq TO anon;
GRANT ALL ON SEQUENCE public.features_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.features_id_seq TO service_role;


--
-- TOC entry 4405 (class 0 OID 0)
-- Dependencies: 405
-- Name: TABLE folders; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.folders TO anon;
GRANT ALL ON TABLE public.folders TO authenticated;
GRANT ALL ON TABLE public.folders TO service_role;


--
-- TOC entry 4407 (class 0 OID 0)
-- Dependencies: 404
-- Name: SEQUENCE folders_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.folders_id_seq TO anon;
GRANT ALL ON SEQUENCE public.folders_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.folders_id_seq TO service_role;


--
-- TOC entry 4408 (class 0 OID 0)
-- Dependencies: 403
-- Name: TABLE oauth_callback_states; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.oauth_callback_states TO anon;
GRANT ALL ON TABLE public.oauth_callback_states TO authenticated;
GRANT ALL ON TABLE public.oauth_callback_states TO service_role;


--
-- TOC entry 4410 (class 0 OID 0)
-- Dependencies: 402
-- Name: SEQUENCE oauth_callback_states_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.oauth_callback_states_id_seq TO anon;
GRANT ALL ON SEQUENCE public.oauth_callback_states_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.oauth_callback_states_id_seq TO service_role;


--
-- TOC entry 4411 (class 0 OID 0)
-- Dependencies: 423
-- Name: TABLE organization_invitations; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.organization_invitations TO anon;
GRANT ALL ON TABLE public.organization_invitations TO authenticated;
GRANT ALL ON TABLE public.organization_invitations TO service_role;


--
-- TOC entry 4413 (class 0 OID 0)
-- Dependencies: 422
-- Name: SEQUENCE organization_invitations_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.organization_invitations_id_seq TO anon;
GRANT ALL ON SEQUENCE public.organization_invitations_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.organization_invitations_id_seq TO service_role;


--
-- TOC entry 4414 (class 0 OID 0)
-- Dependencies: 393
-- Name: TABLE organization_members; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.organization_members TO anon;
GRANT ALL ON TABLE public.organization_members TO authenticated;
GRANT ALL ON TABLE public.organization_members TO service_role;


--
-- TOC entry 4416 (class 0 OID 0)
-- Dependencies: 392
-- Name: SEQUENCE organization_members_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.organization_members_id_seq TO anon;
GRANT ALL ON SEQUENCE public.organization_members_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.organization_members_id_seq TO service_role;


--
-- TOC entry 4417 (class 0 OID 0)
-- Dependencies: 387
-- Name: TABLE organizations; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.organizations TO anon;
GRANT ALL ON TABLE public.organizations TO authenticated;
GRANT ALL ON TABLE public.organizations TO service_role;


--
-- TOC entry 4419 (class 0 OID 0)
-- Dependencies: 386
-- Name: SEQUENCE organizations_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.organizations_id_seq TO anon;
GRANT ALL ON SEQUENCE public.organizations_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.organizations_id_seq TO service_role;


--
-- TOC entry 4420 (class 0 OID 0)
-- Dependencies: 397
-- Name: TABLE password_reset_tokens; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.password_reset_tokens TO anon;
GRANT ALL ON TABLE public.password_reset_tokens TO authenticated;
GRANT ALL ON TABLE public.password_reset_tokens TO service_role;


--
-- TOC entry 4422 (class 0 OID 0)
-- Dependencies: 396
-- Name: SEQUENCE password_reset_tokens_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.password_reset_tokens_id_seq TO anon;
GRANT ALL ON SEQUENCE public.password_reset_tokens_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.password_reset_tokens_id_seq TO service_role;


--
-- TOC entry 4423 (class 0 OID 0)
-- Dependencies: 429
-- Name: TABLE plan_features; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.plan_features TO anon;
GRANT ALL ON TABLE public.plan_features TO authenticated;
GRANT ALL ON TABLE public.plan_features TO service_role;


--
-- TOC entry 4425 (class 0 OID 0)
-- Dependencies: 428
-- Name: SEQUENCE plan_features_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.plan_features_id_seq TO anon;
GRANT ALL ON SEQUENCE public.plan_features_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.plan_features_id_seq TO service_role;


--
-- TOC entry 4426 (class 0 OID 0)
-- Dependencies: 431
-- Name: TABLE plan_limits; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.plan_limits TO anon;
GRANT ALL ON TABLE public.plan_limits TO authenticated;
GRANT ALL ON TABLE public.plan_limits TO service_role;


--
-- TOC entry 4428 (class 0 OID 0)
-- Dependencies: 430
-- Name: SEQUENCE plan_limits_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.plan_limits_id_seq TO anon;
GRANT ALL ON SEQUENCE public.plan_limits_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.plan_limits_id_seq TO service_role;


--
-- TOC entry 4429 (class 0 OID 0)
-- Dependencies: 435
-- Name: TABLE plan_prices; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.plan_prices TO anon;
GRANT ALL ON TABLE public.plan_prices TO authenticated;
GRANT ALL ON TABLE public.plan_prices TO service_role;


--
-- TOC entry 4431 (class 0 OID 0)
-- Dependencies: 434
-- Name: SEQUENCE plan_prices_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.plan_prices_id_seq TO anon;
GRANT ALL ON SEQUENCE public.plan_prices_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.plan_prices_id_seq TO service_role;


--
-- TOC entry 4432 (class 0 OID 0)
-- Dependencies: 425
-- Name: TABLE plans; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.plans TO anon;
GRANT ALL ON TABLE public.plans TO authenticated;
GRANT ALL ON TABLE public.plans TO service_role;


--
-- TOC entry 4434 (class 0 OID 0)
-- Dependencies: 424
-- Name: SEQUENCE plans_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.plans_id_seq TO anon;
GRANT ALL ON SEQUENCE public.plans_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.plans_id_seq TO service_role;


--
-- TOC entry 4435 (class 0 OID 0)
-- Dependencies: 433
-- Name: TABLE regions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.regions TO anon;
GRANT ALL ON TABLE public.regions TO authenticated;
GRANT ALL ON TABLE public.regions TO service_role;


--
-- TOC entry 4437 (class 0 OID 0)
-- Dependencies: 432
-- Name: SEQUENCE regions_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.regions_id_seq TO anon;
GRANT ALL ON SEQUENCE public.regions_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.regions_id_seq TO service_role;


--
-- TOC entry 4438 (class 0 OID 0)
-- Dependencies: 391
-- Name: TABLE roles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.roles TO anon;
GRANT ALL ON TABLE public.roles TO authenticated;
GRANT ALL ON TABLE public.roles TO service_role;


--
-- TOC entry 4440 (class 0 OID 0)
-- Dependencies: 390
-- Name: SEQUENCE roles_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.roles_id_seq TO anon;
GRANT ALL ON SEQUENCE public.roles_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.roles_id_seq TO service_role;


--
-- TOC entry 4441 (class 0 OID 0)
-- Dependencies: 421
-- Name: TABLE search_history; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.search_history TO anon;
GRANT ALL ON TABLE public.search_history TO authenticated;
GRANT ALL ON TABLE public.search_history TO service_role;


--
-- TOC entry 4443 (class 0 OID 0)
-- Dependencies: 420
-- Name: SEQUENCE search_history_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.search_history_id_seq TO anon;
GRANT ALL ON SEQUENCE public.search_history_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.search_history_id_seq TO service_role;


--
-- TOC entry 4444 (class 0 OID 0)
-- Dependencies: 437
-- Name: TABLE subscriptions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.subscriptions TO anon;
GRANT ALL ON TABLE public.subscriptions TO authenticated;
GRANT ALL ON TABLE public.subscriptions TO service_role;


--
-- TOC entry 4446 (class 0 OID 0)
-- Dependencies: 436
-- Name: SEQUENCE subscriptions_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.subscriptions_id_seq TO anon;
GRANT ALL ON SEQUENCE public.subscriptions_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.subscriptions_id_seq TO service_role;


--
-- TOC entry 4447 (class 0 OID 0)
-- Dependencies: 439
-- Name: TABLE usage_records; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.usage_records TO anon;
GRANT ALL ON TABLE public.usage_records TO authenticated;
GRANT ALL ON TABLE public.usage_records TO service_role;


--
-- TOC entry 4449 (class 0 OID 0)
-- Dependencies: 438
-- Name: SEQUENCE usage_records_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.usage_records_id_seq TO anon;
GRANT ALL ON SEQUENCE public.usage_records_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.usage_records_id_seq TO service_role;


--
-- TOC entry 4450 (class 0 OID 0)
-- Dependencies: 401
-- Name: TABLE user_oauth_accounts; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_oauth_accounts TO anon;
GRANT ALL ON TABLE public.user_oauth_accounts TO authenticated;
GRANT ALL ON TABLE public.user_oauth_accounts TO service_role;


--
-- TOC entry 4452 (class 0 OID 0)
-- Dependencies: 400
-- Name: SEQUENCE user_oauth_accounts_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.user_oauth_accounts_id_seq TO anon;
GRANT ALL ON SEQUENCE public.user_oauth_accounts_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.user_oauth_accounts_id_seq TO service_role;


--
-- TOC entry 4453 (class 0 OID 0)
-- Dependencies: 395
-- Name: TABLE user_sessions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_sessions TO anon;
GRANT ALL ON TABLE public.user_sessions TO authenticated;
GRANT ALL ON TABLE public.user_sessions TO service_role;


--
-- TOC entry 4455 (class 0 OID 0)
-- Dependencies: 394
-- Name: SEQUENCE user_sessions_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.user_sessions_id_seq TO anon;
GRANT ALL ON SEQUENCE public.user_sessions_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.user_sessions_id_seq TO service_role;


--
-- TOC entry 4456 (class 0 OID 0)
-- Dependencies: 389
-- Name: TABLE users; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.users TO anon;
GRANT ALL ON TABLE public.users TO authenticated;
GRANT ALL ON TABLE public.users TO service_role;


--
-- TOC entry 4458 (class 0 OID 0)
-- Dependencies: 388
-- Name: SEQUENCE users_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.users_id_seq TO anon;
GRANT ALL ON SEQUENCE public.users_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.users_id_seq TO service_role;


--
-- TOC entry 2602 (class 826 OID 16494)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- TOC entry 2581 (class 826 OID 16495)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- TOC entry 2603 (class 826 OID 16493)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- TOC entry 2583 (class 826 OID 16497)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- TOC entry 2604 (class 826 OID 16492)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- TOC entry 2582 (class 826 OID 16496)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


-- Completed on 2026-05-11 08:51:28 IST

--
-- PostgreSQL database dump complete
--

