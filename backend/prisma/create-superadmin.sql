-- Create or update a DocuNova SUPERADMIN user at the database level.
-- Replace the email, password, and full name literals before running.
-- Requires pgcrypto for gen_random_uuid() and crypt().

CREATE EXTENSION IF NOT EXISTS pgcrypto;

WITH admin_org AS (
    INSERT INTO organizations (name, slug, timezone, language_code)
    VALUES ('DocuNova Administration', 'docunova-admin', 'UTC', 'en')
    ON CONFLICT (slug) DO UPDATE
        SET name = EXCLUDED.name,
            updated_at = now()
    RETURNING id
),
superadmin_role AS (
    INSERT INTO roles (organization_id, name, code, is_system, description)
    SELECT
        admin_org.id,
        'Super Admin',
        'superadmin',
        true,
        'Application-wide administrator'
    FROM admin_org
    ON CONFLICT ON CONSTRAINT uq_roles_org_code DO UPDATE
        SET name = EXCLUDED.name,
            is_system = true,
            description = EXCLUDED.description,
            updated_at = now()
    RETURNING id, organization_id
),
superadmin_user AS (
    INSERT INTO users (
        organization_id,
        email,
        password_hash,
        auth_provider,
        full_name,
        email_verified_at,
        status
    )
    SELECT
        admin_org.id,
        lower('superadmin@example.com'),
        crypt('ChangeMe!12345', gen_salt('bf', 12)),
        'local'::auth_provider,
        'Super Admin',
        now(),
        'active'::user_status
    FROM admin_org
    ON CONFLICT ON CONSTRAINT uq_users_org_email DO UPDATE
        SET password_hash = EXCLUDED.password_hash,
            full_name = EXCLUDED.full_name,
            email_verified_at = COALESCE(users.email_verified_at, now()),
            status = 'active'::user_status,
            deleted_at = NULL,
            updated_at = now()
    RETURNING id, organization_id
)
INSERT INTO organization_members (
    organization_id,
    user_id,
    role_id,
    status,
    joined_at
)
SELECT
    superadmin_user.organization_id,
    superadmin_user.id,
    superadmin_role.id,
    'active'::member_status,
    now()
FROM superadmin_user
JOIN superadmin_role
    ON superadmin_role.organization_id = superadmin_user.organization_id
ON CONFLICT ON CONSTRAINT uq_org_member DO UPDATE
    SET role_id = EXCLUDED.role_id,
        status = 'active'::member_status,
        joined_at = COALESCE(organization_members.joined_at, now()),
        updated_at = now();
