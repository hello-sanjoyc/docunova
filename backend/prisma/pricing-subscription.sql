-- DocuNova pricing/subscription bootstrap SQL.
-- Safe to run repeatedly on PostgreSQL after the core DocuNova schema exists.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
    CREATE TYPE limit_period AS ENUM ('lifetime', 'monthly', 'yearly', 'none');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('active', 'trialing', 'cancelled', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE billing_cycle AS ENUM ('monthly', 'yearly');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS country_code VARCHAR(2),
    ADD COLUMN IF NOT EXISTS region_code VARCHAR(20);

CREATE INDEX IF NOT EXISTS idx_users_country_code ON users (country_code);
CREATE INDEX IF NOT EXISTS idx_users_region_code ON users (region_code);

CREATE TABLE IF NOT EXISTS plans (
    id BIGSERIAL PRIMARY KEY,
    slug VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_plans_active_sort ON plans (is_active, sort_order);

CREATE TABLE IF NOT EXISTS features (
    id BIGSERIAL PRIMARY KEY,
    key VARCHAR(150) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS plan_features (
    id BIGSERIAL PRIMARY KEY,
    plan_id BIGINT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    feature_id BIGINT NOT NULL REFERENCES features(id) ON DELETE CASCADE,
    included BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT uq_plan_features_plan_feature UNIQUE (plan_id, feature_id)
);
CREATE INDEX IF NOT EXISTS idx_plan_features_feature ON plan_features (feature_id);

CREATE TABLE IF NOT EXISTS plan_limits (
    id BIGSERIAL PRIMARY KEY,
    plan_id BIGINT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    key VARCHAR(150) NOT NULL,
    value NUMERIC(18, 4) NOT NULL,
    period limit_period NOT NULL DEFAULT 'none',
    CONSTRAINT uq_plan_limits_plan_key UNIQUE (plan_id, key)
);
CREATE INDEX IF NOT EXISTS idx_plan_limits_key ON plan_limits (key);

CREATE TABLE IF NOT EXISTS regions (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    currency_code VARCHAR(10) NOT NULL
);

CREATE TABLE IF NOT EXISTS plan_prices (
    id BIGSERIAL PRIMARY KEY,
    plan_id BIGINT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    region_code VARCHAR(20) NOT NULL REFERENCES regions(code) ON DELETE RESTRICT,
    currency_code VARCHAR(10) NOT NULL,
    monthly_price NUMERIC(18, 4) NOT NULL DEFAULT 0,
    yearly_price NUMERIC(18, 4) NOT NULL DEFAULT 0,
    extra_page_price NUMERIC(18, 4) NOT NULL DEFAULT 0,
    extra_ocr_page_price NUMERIC(18, 4) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    CONSTRAINT uq_plan_prices_plan_region UNIQUE (plan_id, region_code)
);
CREATE INDEX IF NOT EXISTS idx_plan_prices_region_active ON plan_prices (region_code, is_active);

CREATE TABLE IF NOT EXISTS subscriptions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id BIGINT NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
    region_code VARCHAR(20) NOT NULL REFERENCES regions(code) ON DELETE RESTRICT,
    status subscription_status NOT NULL DEFAULT 'active',
    billing_cycle billing_cycle NOT NULL,
    started_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    current_period_start TIMESTAMPTZ(6) NOT NULL,
    current_period_end TIMESTAMPTZ(6) NOT NULL,
    cancelled_at TIMESTAMPTZ(6),
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions (user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions (plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_region ON subscriptions (region_code);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON subscriptions (current_period_end);

DO $$ BEGIN
    ALTER TABLE subscriptions
        ADD CONSTRAINT subscriptions_region_code_fkey
        FOREIGN KEY (region_code) REFERENCES regions(code) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS usage_records (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id BIGINT REFERENCES subscriptions(id) ON DELETE SET NULL,
    document_id BIGINT REFERENCES documents(id) ON DELETE SET NULL,
    pages_used INTEGER NOT NULL DEFAULT 0,
    ocr_pages_used INTEGER NOT NULL DEFAULT 0,
    tokens_used INTEGER,
    usage_month DATE NOT NULL,
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_usage_records_user_month ON usage_records (user_id, usage_month);
CREATE INDEX IF NOT EXISTS idx_usage_records_subscription_month ON usage_records (subscription_id, usage_month);
CREATE INDEX IF NOT EXISTS idx_usage_records_document ON usage_records (document_id);

INSERT INTO regions (code, name, currency_code) VALUES
    ('IN', 'India', 'INR'),
    ('US', 'United States', 'USD'),
    ('CA', 'Canada', 'CAD'),
    ('UK', 'United Kingdom', 'GBP'),
    ('AU', 'Australia', 'AUD'),
    ('EU', 'Europe', 'EUR'),
    ('ME', 'Middle East', 'AED'),
    ('DEFAULT', 'Default', 'INR')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    currency_code = EXCLUDED.currency_code;

INSERT INTO plans (slug, name, description, is_active, sort_order) VALUES
    ('starter', 'Starter', 'Free plan for trying DocuNova with text-based PDFs.', true, 10),
    ('professional', 'Professional', 'Monthly document intelligence for individuals and growing teams.', true, 20),
    ('team', 'Team', 'Shared contract workspace with higher limits and team controls.', true, 30)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    sort_order = EXCLUDED.sort_order,
    updated_at = now();

INSERT INTO features (key, name, description) VALUES
    ('pdf_upload', 'PDF upload', 'Upload PDF documents.'),
    ('docx_upload', 'DOCX upload', 'Upload Microsoft Word documents.'),
    ('text_based_only', 'Text-based documents only', 'Only documents with extractable text are supported.'),
    ('ocr', 'OCR', 'OCR support for scanned PDFs and images.'),
    ('one_page_ai_brief', '1-page AI brief', 'Generate a concise AI summary.'),
    ('pdf_summary_download', 'PDF summary download', 'Download AI summaries as PDF.'),
    ('shareable_links', 'Shareable links', 'Share read-only links.'),
    ('team_members', 'Team members', 'Invite team members.'),
    ('shared_vault', 'Shared vault', 'Shared team document workspace.'),
    ('activity_log', 'Activity log', 'Track team activity.'),
    ('priority_support', 'Priority support', 'Prioritized customer support.')
ON CONFLICT (key) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = now();

WITH matrix(plan_slug, feature_key, included) AS (
    VALUES
    ('starter','pdf_upload',true),('starter','docx_upload',false),('starter','text_based_only',true),('starter','ocr',false),('starter','one_page_ai_brief',true),('starter','pdf_summary_download',true),('starter','shareable_links',false),('starter','team_members',false),('starter','shared_vault',false),('starter','activity_log',false),('starter','priority_support',false),
    ('professional','pdf_upload',true),('professional','docx_upload',true),('professional','text_based_only',false),('professional','ocr',true),('professional','one_page_ai_brief',true),('professional','pdf_summary_download',true),('professional','shareable_links',true),('professional','team_members',false),('professional','shared_vault',false),('professional','activity_log',false),('professional','priority_support',false),
    ('team','pdf_upload',true),('team','docx_upload',true),('team','text_based_only',false),('team','ocr',true),('team','one_page_ai_brief',true),('team','pdf_summary_download',true),('team','shareable_links',true),('team','team_members',true),('team','shared_vault',true),('team','activity_log',true),('team','priority_support',true)
)
INSERT INTO plan_features (plan_id, feature_id, included)
SELECT p.id, f.id, m.included
FROM matrix m
JOIN plans p ON p.slug = m.plan_slug
JOIN features f ON f.key = m.feature_key
ON CONFLICT ON CONSTRAINT uq_plan_features_plan_feature DO UPDATE SET included = EXCLUDED.included;

WITH limit_seed(plan_slug, key, value, period) AS (
    VALUES
    ('starter','lifetime_pages',50,'lifetime'::limit_period),
    ('starter','max_pages_per_upload',20,'none'::limit_period),
    ('starter','storage_mb',100,'none'::limit_period),
    ('starter','ocr_pages_included',0,'lifetime'::limit_period),
    ('professional','pages_per_month',1000,'monthly'::limit_period),
    ('professional','max_pages_per_upload',100,'none'::limit_period),
    ('professional','ocr_pages_included',250,'monthly'::limit_period),
    ('professional','storage_mb',5120,'none'::limit_period),
    ('professional','team_members_included',1,'none'::limit_period),
    ('team','pages_per_month',3000,'monthly'::limit_period),
    ('team','max_pages_per_upload',200,'none'::limit_period),
    ('team','ocr_pages_included',1000,'monthly'::limit_period),
    ('team','storage_mb',20480,'none'::limit_period),
    ('team','team_members_included',3,'none'::limit_period),
    ('team','minimum_team_seats',3,'none'::limit_period)
)
INSERT INTO plan_limits (plan_id, key, value, period)
SELECT p.id, l.key, l.value, l.period
FROM limit_seed l
JOIN plans p ON p.slug = l.plan_slug
ON CONFLICT ON CONSTRAINT uq_plan_limits_plan_key DO UPDATE SET
    value = EXCLUDED.value,
    period = EXCLUDED.period;

    

WITH price_seed(region_code, plan_slug, monthly_price, yearly_price, extra_page_price, extra_ocr_page_price) AS (
    VALUES
    ('AU', 'starter', 0, 0, 0, 0),
    ('AU', 'professional', 29, 290, 0.030, 0.060),
    ('AU', 'team', 69, 690, 0.025, 0.050),

    ('IN', 'starter', 0, 0, 0, 0),
    ('IN', 'professional', 499, 4999, 0.400, 0.800),
    ('IN', 'team', 999, 9990, 0.300, 0.600),

    ('SG', 'starter', 0, 0, 0, 0),
    ('SG', 'professional', 25, 250, 0.030, 0.060),
    ('SG', 'team', 65, 650, 0.020, 0.040),

    ('AE', 'starter', 0, 0, 0, 0),
    ('AE', 'professional', 69, 690, 0.080, 0.160),
    ('AE', 'team', 179, 1790, 0.060, 0.120),

    ('GB', 'starter', 0, 0, 0, 0),
    ('GB', 'professional', 19, 190, 0.020, 0.040),
    ('GB', 'team', 39, 390, 0.015, 0.030),

    ('US', 'starter', 0, 0, 0, 0),
    ('US', 'professional', 19, 199, 0.020, 0.040),
    ('US', 'team', 49, 490, 0.015, 0.030)
)
INSERT INTO plan_prices (
    plan_id,
    region_code,
    currency_code,
    monthly_price,
    yearly_price,
    extra_page_price,
    extra_ocr_page_price,
    is_active
)
SELECT
    p.id,
    ps.region_code,
    r.currency_code,
    ps.monthly_price,
    ps.yearly_price,
    ps.extra_page_price,
    ps.extra_ocr_page_price,
    true
FROM price_seed ps
JOIN plans p ON p.slug = ps.plan_slug
JOIN regions r ON r.code = ps.region_code
ORDER BY ps.region_code, ps.monthly_price
ON CONFLICT ON CONSTRAINT uq_plan_prices_plan_region DO UPDATE SET
    currency_code = EXCLUDED.currency_code,
    monthly_price = EXCLUDED.monthly_price,
    yearly_price = EXCLUDED.yearly_price,
    extra_page_price = EXCLUDED.extra_page_price,
    extra_ocr_page_price = EXCLUDED.extra_ocr_page_price,
    is_active = true,
    updated_at = now();
