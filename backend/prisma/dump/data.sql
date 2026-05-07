-- =====================================================================
-- DocuNova PostgreSQL data dump for postgres
-- Generated at 2026-05-02T14:40:11.758Z
-- Schemas: public
-- =====================================================================

BEGIN;
SET CONSTRAINTS ALL DEFERRED;

INSERT INTO "public"."features" ("id", "key", "name", "description", "created_at", "updated_at") VALUES
('1', 'pdf_upload', 'PDF upload', 'Upload PDF documents.', '2026-04-24 18:29:34.100274+00', '2026-04-24 18:29:34.100274+00'),
('2', 'docx_upload', 'DOCX upload', 'Upload Microsoft Word documents.', '2026-04-24 18:29:34.100274+00', '2026-04-24 18:29:34.100274+00'),
('3', 'text_based_only', 'Text-based documents only', 'Only documents with extractable text are supported.', '2026-04-24 18:29:34.100274+00', '2026-04-24 18:29:34.100274+00'),
('4', 'ocr', 'OCR', 'OCR support for scanned PDFs and images.', '2026-04-24 18:29:34.100274+00', '2026-04-24 18:29:34.100274+00'),
('5', 'one_page_ai_brief', '1-page AI brief', 'Generate a concise AI summary.', '2026-04-24 18:29:34.100274+00', '2026-04-24 18:29:34.100274+00'),
('6', 'pdf_summary_download', 'PDF summary download', 'Download AI summaries as PDF.', '2026-04-24 18:29:34.100274+00', '2026-04-24 18:29:34.100274+00'),
('7', 'shareable_links', 'Shareable links', 'Share read-only links.', '2026-04-24 18:29:34.100274+00', '2026-04-24 18:29:34.100274+00'),
('8', 'team_members', 'Team members', 'Invite team members.', '2026-04-24 18:29:34.100274+00', '2026-04-24 18:29:34.100274+00'),
('9', 'shared_vault', 'Shared vault', 'Shared team document workspace.', '2026-04-24 18:29:34.100274+00', '2026-04-24 18:29:34.100274+00'),
('10', 'activity_log', 'Activity log', 'Track team activity.', '2026-04-24 18:29:34.100274+00', '2026-04-24 18:29:34.100274+00'),
('11', 'priority_support', 'Priority support', 'Prioritized customer support.', '2026-04-24 18:29:34.100274+00', '2026-04-24 18:29:34.100274+00')
ON CONFLICT DO NOTHING;

INSERT INTO "public"."organizations" ("id", "uuid", "name", "slug", "logo_url", "website", "timezone", "language_code", "plan_code", "billing_email", "max_storage_bytes", "max_users", "settings_json", "created_at", "updated_at") VALUES
('1', '20c5ef85-44ef-425e-95e0-8a864b9c8865', 'DocuNova Administration', 'docunova-admin', NULL, NULL, 'UTC', 'en', NULL, NULL, '0', '0', '{}', '2026-05-02 14:29:24.240751+00', '2026-05-02 14:29:24.240751+00')
ON CONFLICT DO NOTHING;

INSERT INTO "public"."plans" ("id", "slug", "name", "description", "is_active", "sort_order", "created_at", "updated_at") VALUES
('1', 'starter', 'Starter', 'Free plan for trying DocuNova with text-based PDFs.', 'true', '10', '2026-04-24 18:29:34.100274+00', '2026-04-24 18:29:34.100274+00'),
('2', 'professional', 'Professional', 'Monthly document intelligence for individuals and growing teams.', 'true', '20', '2026-04-24 18:29:34.100274+00', '2026-04-24 18:29:34.100274+00'),
('3', 'team', 'Team', 'Shared contract workspace with higher limits and team controls.', 'true', '30', '2026-04-24 18:29:34.100274+00', '2026-04-24 18:29:34.100274+00')
ON CONFLICT DO NOTHING;

INSERT INTO "public"."regions" ("id", "code", "name", "currency_code") VALUES
('1', 'AF', 'Afghanistan', 'AFN'),
('2', 'AL', 'Albania', 'ALL'),
('3', 'DZ', 'Algeria', 'DZD'),
('4', 'AD', 'Andorra', 'EUR'),
('5', 'AO', 'Angola', 'AOA'),
('6', 'AR', 'Argentina', 'ARS'),
('7', 'AM', 'Armenia', 'AMD'),
('8', 'AU', 'Australia', 'AUD'),
('9', 'AT', 'Austria', 'EUR'),
('10', 'AZ', 'Azerbaijan', 'AZN'),
('11', 'BH', 'Bahrain', 'BHD'),
('12', 'BD', 'Bangladesh', 'BDT'),
('13', 'BY', 'Belarus', 'BYN'),
('14', 'BE', 'Belgium', 'EUR'),
('15', 'BZ', 'Belize', 'BZD'),
('16', 'BJ', 'Benin', 'XOF'),
('17', 'BT', 'Bhutan', 'BTN'),
('18', 'BO', 'Bolivia', 'BOB'),
('19', 'BA', 'Bosnia and Herzegovina', 'BAM'),
('20', 'BW', 'Botswana', 'BWP'),
('21', 'BR', 'Brazil', 'BRL'),
('22', 'BN', 'Brunei', 'BND'),
('23', 'BG', 'Bulgaria', 'BGN'),
('24', 'BF', 'Burkina Faso', 'XOF'),
('25', 'BI', 'Burundi', 'BIF'),
('26', 'KH', 'Cambodia', 'KHR'),
('27', 'CM', 'Cameroon', 'XAF'),
('28', 'CA', 'Canada', 'CAD'),
('29', 'CL', 'Chile', 'CLP'),
('30', 'CN', 'China', 'CNY'),
('31', 'CO', 'Colombia', 'COP'),
('32', 'CR', 'Costa Rica', 'CRC'),
('33', 'HR', 'Croatia', 'EUR'),
('34', 'CU', 'Cuba', 'CUP'),
('35', 'CY', 'Cyprus', 'EUR'),
('36', 'CZ', 'Czech Republic', 'CZK'),
('37', 'DK', 'Denmark', 'DKK'),
('38', 'DO', 'Dominican Republic', 'DOP'),
('39', 'EC', 'Ecuador', 'USD'),
('40', 'EG', 'Egypt', 'EGP'),
('41', 'SV', 'El Salvador', 'USD'),
('42', 'EE', 'Estonia', 'EUR'),
('43', 'ET', 'Ethiopia', 'ETB'),
('44', 'FI', 'Finland', 'EUR'),
('45', 'FR', 'France', 'EUR'),
('46', 'GE', 'Georgia', 'GEL'),
('47', 'DE', 'Germany', 'EUR'),
('48', 'GH', 'Ghana', 'GHS'),
('49', 'GR', 'Greece', 'EUR'),
('50', 'GT', 'Guatemala', 'GTQ'),
('51', 'HK', 'Hong Kong', 'HKD'),
('52', 'HU', 'Hungary', 'HUF'),
('53', 'IS', 'Iceland', 'ISK'),
('54', 'IN', 'India', 'INR'),
('55', 'ID', 'Indonesia', 'IDR'),
('56', 'IR', 'Iran', 'IRR'),
('57', 'IQ', 'Iraq', 'IQD'),
('58', 'IE', 'Ireland', 'EUR'),
('59', 'IL', 'Israel', 'ILS'),
('60', 'IT', 'Italy', 'EUR'),
('61', 'JM', 'Jamaica', 'JMD'),
('62', 'JP', 'Japan', 'JPY'),
('63', 'JO', 'Jordan', 'JOD'),
('64', 'KZ', 'Kazakhstan', 'KZT'),
('65', 'KE', 'Kenya', 'KES'),
('66', 'KR', 'South Korea', 'KRW'),
('67', 'KW', 'Kuwait', 'KWD'),
('68', 'KG', 'Kyrgyzstan', 'KGS'),
('69', 'LA', 'Laos', 'LAK'),
('70', 'LV', 'Latvia', 'EUR'),
('71', 'LB', 'Lebanon', 'LBP'),
('72', 'LY', 'Libya', 'LYD'),
('73', 'LT', 'Lithuania', 'EUR'),
('74', 'LU', 'Luxembourg', 'EUR'),
('75', 'MO', 'Macao', 'MOP'),
('76', 'MG', 'Madagascar', 'MGA'),
('77', 'MW', 'Malawi', 'MWK'),
('78', 'MY', 'Malaysia', 'MYR'),
('79', 'MV', 'Maldives', 'MVR'),
('80', 'ML', 'Mali', 'XOF'),
('81', 'MT', 'Malta', 'EUR'),
('82', 'MX', 'Mexico', 'MXN'),
('83', 'MD', 'Moldova', 'MDL'),
('84', 'MN', 'Mongolia', 'MNT'),
('85', 'ME', 'Montenegro', 'EUR'),
('86', 'MA', 'Morocco', 'MAD'),
('87', 'MZ', 'Mozambique', 'MZN'),
('88', 'MM', 'Myanmar', 'MMK'),
('89', 'NA', 'Namibia', 'NAD'),
('90', 'NP', 'Nepal', 'NPR'),
('91', 'NL', 'Netherlands', 'EUR'),
('92', 'NZ', 'New Zealand', 'NZD'),
('93', 'NI', 'Nicaragua', 'NIO'),
('94', 'NE', 'Niger', 'XOF'),
('95', 'NG', 'Nigeria', 'NGN'),
('96', 'NO', 'Norway', 'NOK'),
('97', 'OM', 'Oman', 'OMR'),
('98', 'PK', 'Pakistan', 'PKR'),
('99', 'PA', 'Panama', 'PAB'),
('100', 'PY', 'Paraguay', 'PYG')
ON CONFLICT DO NOTHING;

INSERT INTO "public"."regions" ("id", "code", "name", "currency_code") VALUES
('101', 'PE', 'Peru', 'PEN'),
('102', 'PH', 'Philippines', 'PHP'),
('103', 'PL', 'Poland', 'PLN'),
('104', 'PT', 'Portugal', 'EUR'),
('105', 'QA', 'Qatar', 'QAR'),
('106', 'RO', 'Romania', 'RON'),
('107', 'RU', 'Russia', 'RUB'),
('108', 'RW', 'Rwanda', 'RWF'),
('109', 'SA', 'Saudi Arabia', 'SAR'),
('110', 'SN', 'Senegal', 'XOF'),
('111', 'RS', 'Serbia', 'RSD'),
('112', 'SG', 'Singapore', 'SGD'),
('113', 'SK', 'Slovakia', 'EUR'),
('114', 'SI', 'Slovenia', 'EUR'),
('115', 'ZA', 'South Africa', 'ZAR'),
('116', 'ES', 'Spain', 'EUR'),
('117', 'LK', 'Sri Lanka', 'LKR'),
('118', 'SE', 'Sweden', 'SEK'),
('119', 'CH', 'Switzerland', 'CHF'),
('120', 'TW', 'Taiwan', 'TWD'),
('121', 'TH', 'Thailand', 'THB'),
('122', 'TN', 'Tunisia', 'TND'),
('123', 'TR', 'Turkey', 'TRY'),
('124', 'UG', 'Uganda', 'UGX'),
('125', 'UA', 'Ukraine', 'UAH'),
('126', 'AE', 'United Arab Emirates', 'AED'),
('127', 'GB', 'United Kingdom', 'GBP'),
('128', 'US', 'United States', 'USD'),
('129', 'UY', 'Uruguay', 'UYU'),
('130', 'UZ', 'Uzbekistan', 'UZS'),
('131', 'VE', 'Venezuela', 'VES'),
('132', 'VN', 'Vietnam', 'VND'),
('133', 'YE', 'Yemen', 'YER'),
('134', 'ZM', 'Zambia', 'ZMW'),
('135', 'ZW', 'Zimbabwe', 'ZWL')
ON CONFLICT DO NOTHING;

INSERT INTO "public"."plan_features" ("id", "plan_id", "feature_id", "included") VALUES
('1', '1', '11', 'false'),
('2', '1', '10', 'false'),
('3', '1', '9', 'false'),
('4', '1', '8', 'false'),
('5', '1', '7', 'false'),
('6', '1', '6', 'true'),
('7', '1', '5', 'true'),
('8', '1', '4', 'false'),
('9', '1', '3', 'true'),
('10', '1', '2', 'false'),
('11', '1', '1', 'true'),
('12', '2', '11', 'false'),
('13', '2', '10', 'false'),
('14', '2', '9', 'false'),
('15', '2', '8', 'false'),
('16', '2', '7', 'true'),
('17', '2', '6', 'true'),
('18', '2', '5', 'true'),
('19', '2', '4', 'true'),
('20', '2', '3', 'false'),
('21', '2', '2', 'true'),
('22', '2', '1', 'true'),
('23', '3', '11', 'true'),
('24', '3', '10', 'true'),
('25', '3', '9', 'true'),
('26', '3', '8', 'true'),
('27', '3', '7', 'true'),
('28', '3', '6', 'true'),
('29', '3', '5', 'true'),
('30', '3', '4', 'true'),
('31', '3', '3', 'false'),
('32', '3', '2', 'true'),
('33', '3', '1', 'true')
ON CONFLICT DO NOTHING;

INSERT INTO "public"."plan_limits" ("id", "plan_id", "key", "value", "period") VALUES
('1', '1', 'ocr_pages_included', '0.0000', 'lifetime'),
('2', '1', 'storage_mb', '100.0000', 'none'),
('3', '1', 'max_pages_per_upload', '20.0000', 'none'),
('4', '1', 'lifetime_pages', '50.0000', 'lifetime'),
('5', '2', 'team_members_included', '1.0000', 'none'),
('6', '2', 'storage_mb', '5120.0000', 'none'),
('7', '2', 'ocr_pages_included', '250.0000', 'monthly'),
('8', '2', 'max_pages_per_upload', '100.0000', 'none'),
('9', '2', 'pages_per_month', '1000.0000', 'monthly'),
('10', '3', 'minimum_team_seats', '3.0000', 'none'),
('11', '3', 'team_members_included', '3.0000', 'none'),
('12', '3', 'storage_mb', '20480.0000', 'none'),
('13', '3', 'ocr_pages_included', '1000.0000', 'monthly'),
('14', '3', 'max_pages_per_upload', '200.0000', 'none'),
('15', '3', 'pages_per_month', '3000.0000', 'monthly')
ON CONFLICT DO NOTHING;

INSERT INTO "public"."plan_prices" ("id", "plan_id", "region_code", "currency_code", "monthly_price", "yearly_price", "extra_page_price", "extra_ocr_page_price", "is_active", "created_at", "updated_at") VALUES
('1', '1', 'AE', 'AED', '0.0000', '0.0000', '0.0000', '0.0000', 'true', '2026-04-30 19:12:08.964367+00', '2026-04-30 19:12:08.964367+00'),
('2', '2', 'AE', 'AED', '69.0000', '690.0000', '0.0800', '0.1600', 'true', '2026-04-30 19:12:08.964367+00', '2026-04-30 19:12:08.964367+00'),
('3', '3', 'AE', 'AED', '179.0000', '1790.0000', '0.0600', '0.1200', 'true', '2026-04-30 19:12:08.964367+00', '2026-04-30 19:12:08.964367+00'),
('4', '1', 'AU', 'AUD', '0.0000', '0.0000', '0.0000', '0.0000', 'true', '2026-04-30 19:12:08.964367+00', '2026-04-30 19:12:08.964367+00'),
('5', '2', 'AU', 'AUD', '29.0000', '290.0000', '0.0300', '0.0600', 'true', '2026-04-30 19:12:08.964367+00', '2026-04-30 19:12:08.964367+00'),
('6', '3', 'AU', 'AUD', '69.0000', '690.0000', '0.0250', '0.0500', 'true', '2026-04-30 19:12:08.964367+00', '2026-04-30 19:12:08.964367+00'),
('7', '1', 'GB', 'GBP', '0.0000', '0.0000', '0.0000', '0.0000', 'true', '2026-04-30 19:12:08.964367+00', '2026-04-30 19:12:08.964367+00'),
('8', '2', 'GB', 'GBP', '19.0000', '190.0000', '0.0200', '0.0400', 'true', '2026-04-30 19:12:08.964367+00', '2026-04-30 19:12:08.964367+00'),
('9', '3', 'GB', 'GBP', '39.0000', '390.0000', '0.0150', '0.0300', 'true', '2026-04-30 19:12:08.964367+00', '2026-04-30 19:12:08.964367+00'),
('10', '1', 'IN', 'INR', '0.0000', '0.0000', '0.0000', '0.0000', 'true', '2026-04-30 19:12:08.964367+00', '2026-04-30 19:12:08.964367+00'),
('11', '2', 'IN', 'INR', '499.0000', '4999.0000', '0.4000', '0.8000', 'true', '2026-04-30 19:12:08.964367+00', '2026-04-30 19:12:08.964367+00'),
('12', '3', 'IN', 'INR', '999.0000', '9990.0000', '0.3000', '0.6000', 'true', '2026-04-30 19:12:08.964367+00', '2026-04-30 19:12:08.964367+00'),
('13', '1', 'SG', 'SGD', '0.0000', '0.0000', '0.0000', '0.0000', 'true', '2026-04-30 19:12:08.964367+00', '2026-04-30 19:12:08.964367+00'),
('14', '2', 'SG', 'SGD', '25.0000', '250.0000', '0.0300', '0.0600', 'true', '2026-04-30 19:12:08.964367+00', '2026-04-30 19:12:08.964367+00'),
('15', '3', 'SG', 'SGD', '65.0000', '650.0000', '0.0200', '0.0400', 'true', '2026-04-30 19:12:08.964367+00', '2026-04-30 19:12:08.964367+00'),
('16', '1', 'US', 'USD', '0.0000', '0.0000', '0.0000', '0.0000', 'true', '2026-04-30 19:12:08.964367+00', '2026-04-30 19:12:08.964367+00'),
('17', '2', 'US', 'USD', '19.0000', '199.0000', '0.0200', '0.0400', 'true', '2026-04-30 19:12:08.964367+00', '2026-04-30 19:12:08.964367+00'),
('18', '3', 'US', 'USD', '49.0000', '490.0000', '0.0150', '0.0300', 'true', '2026-04-30 19:12:08.964367+00', '2026-04-30 19:12:08.964367+00')
ON CONFLICT DO NOTHING;

INSERT INTO "public"."roles" ("id", "uuid", "name", "code", "is_system", "description", "created_at", "updated_at") VALUES
('1', '12fc9991-a880-492e-9262-268741768b2d', 'Super Admin', 'superadmin', 'true', 'Application-wide administrator', '2026-05-02 14:29:24.240751+00', '2026-05-02 14:29:24.240751+00')
ON CONFLICT DO NOTHING;

INSERT INTO "public"."users" ("id", "uuid", "organization_id", "email", "password_hash", "auth_provider", "provider_user_id", "first_name", "last_name", "full_name", "phone", "avatar_url", "email_verified_at", "two_factor_enabled", "two_factor_secret", "status", "last_login_at", "last_activity_at", "created_at", "updated_at", "deleted_at", "email_digest_enabled", "security_alerts_enabled", "country_code", "region_code") VALUES
('1', '24434bb5-aab1-4548-b12a-f1cdbb0bb0b3', '1', 'superadmin@example.com', '$2a$12$OfPzD1WwYP43CcrADX.RDO9UUp43G6O0xxsem/BPqv7fCT6QL.Vlm', 'local', NULL, NULL, NULL, 'Super Admin', NULL, NULL, '2026-05-02 14:29:24.240751+00', 'false', NULL, 'active', NULL, NULL, '2026-05-02 14:29:24.240751+00', '2026-05-02 14:29:24.240751+00', NULL, 'true', 'true', NULL, NULL)
ON CONFLICT DO NOTHING;

INSERT INTO "public"."organization_members" ("id", "uuid", "organization_id", "user_id", "role_id", "title", "status", "invited_by", "invited_at", "joined_at", "created_at", "updated_at") VALUES
('1', '6e91a95c-67b7-4fa7-ad88-c90ae45b18f1', '1', '1', '1', NULL, 'active', NULL, NULL, '2026-05-02 14:29:24.240751+00', '2026-05-02 14:29:24.240751+00', '2026-05-02 14:29:24.240751+00')
ON CONFLICT DO NOTHING;

SELECT pg_catalog.setval('"public"."ai_jobs_id_seq"', 1, false);
SELECT pg_catalog.setval('"public"."document_access_history_id_seq"', 1, false);
SELECT pg_catalog.setval('"public"."document_ai_summaries_id_seq"', 1, false);
SELECT pg_catalog.setval('"public"."document_classifications_id_seq"', 1, false);
SELECT pg_catalog.setval('"public"."document_ocr_results_id_seq"', 1, false);
SELECT pg_catalog.setval('"public"."document_versions_id_seq"', 1, false);
SELECT pg_catalog.setval('"public"."documents_id_seq"', 1, false);
SELECT pg_catalog.setval('"public"."email_verification_tokens_id_seq"', 1, false);
SELECT pg_catalog.setval('"public"."features_id_seq"', 1, false);
SELECT pg_catalog.setval('"public"."folders_id_seq"', 1, false);
SELECT pg_catalog.setval('"public"."oauth_callback_states_id_seq"', 1, false);
SELECT pg_catalog.setval('"public"."organization_invitations_id_seq"', 1, false);
SELECT pg_catalog.setval('"public"."organization_members_id_seq"', 1, true);
SELECT pg_catalog.setval('"public"."organizations_id_seq"', 1, true);
SELECT pg_catalog.setval('"public"."password_reset_tokens_id_seq"', 1, false);
SELECT pg_catalog.setval('"public"."plan_features_id_seq"', 1, false);
SELECT pg_catalog.setval('"public"."plan_limits_id_seq"', 1, false);
SELECT pg_catalog.setval('"public"."plan_prices_id_seq"', 1, false);
SELECT pg_catalog.setval('"public"."plans_id_seq"', 1, false);
SELECT pg_catalog.setval('"public"."regions_id_seq"', 8, true);
SELECT pg_catalog.setval('"public"."roles_id_seq"', 1, true);
SELECT pg_catalog.setval('"public"."search_history_id_seq"', 1, false);
SELECT pg_catalog.setval('"public"."subscriptions_id_seq"', 1, false);
SELECT pg_catalog.setval('"public"."usage_records_id_seq"', 1, false);
SELECT pg_catalog.setval('"public"."user_oauth_accounts_id_seq"', 1, false);
SELECT pg_catalog.setval('"public"."user_sessions_id_seq"', 1, false);
SELECT pg_catalog.setval('"public"."users_id_seq"', 1, true);

COMMIT;
