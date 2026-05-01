# Pricing and Subscription System

## Database Setup

Generate a Prisma migration from the schema changes:

```bash
cd backend
npx prisma migrate dev --name subscription_pricing
npm run db:seed:pricing
```

For a direct database bootstrap without Prisma migrations, run:

```bash
cd backend
psql "$DATABASE_URL" -f prisma/pricing-subscription.sql
```

The direct SQL file creates the subscription/pricing tables, adds `country_code`
and `region_code` to `users`, and seeds the catalog.

## API Examples

`GET /api/pricing?region_code=US`

```json
{
  "requestedRegionCode": "US",
  "regions": [{ "code": "US", "name": "United States", "currencyCode": "USD" }],
  "plans": [
    {
      "slug": "professional",
      "name": "Professional",
      "limits": [
        { "key": "pages_per_month", "value": 1000, "period": "monthly" }
      ],
      "features": [
        { "key": "shareable_links", "name": "Shareable links", "included": true }
      ],
      "price": {
        "regionCode": "US",
        "currencyCode": "USD",
        "monthlyPrice": 19,
        "yearlyPrice": 199,
        "extraPagePrice": 0.02,
        "extraOcrPagePrice": 0.04,
        "isFallback": false
      }
    }
  ]
}
```

`POST /api/subscriptions`

```json
{
  "plan_slug": "professional",
  "region_code": "IN",
  "billing_cycle": "monthly"
}
```

Response:

```json
{
  "id": "42",
  "status": "active",
  "billingCycle": "monthly",
  "regionCode": "IN",
  "plan": {
    "slug": "professional",
    "name": "Professional"
  }
}
```

`POST /api/usage/check`

```json
{
  "page_count": 120,
  "ocr_page_count": 25
}
```

Response:

```json
{
  "allowed": false,
  "reason": "Upload exceeds the maximum pages allowed per upload.",
  "currentUsage": { "pagesUsed": 380, "ocrPagesUsed": 40 },
  "planLimit": {
    "planSlug": "professional",
    "pages": 1000,
    "ocrPages": 250,
    "maxPagesPerUpload": 100
  },
  "estimatedExtraPageCharge": 0,
  "estimatedOcrCharge": 0,
  "estimatedTotalCharge": 0,
  "formattedEstimate": "$0.00",
  "currencyCode": "USD"
}
```

## Extension Points

Payment gateways should attach after `POST /api/subscriptions`: create a pending
checkout, confirm payment in a webhook, then activate or change the subscription.
The current endpoint marks subscriptions active by design for the no-gateway
phase.

Token usage is stored internally on `usage_records.tokens_used` for future
analytics, but customer-facing pricing is page-based only.
