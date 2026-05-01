This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment Setup

Copy `.env.example` to `.env.local` and update values:

```bash
cp .env.example .env.local
```

- `APP_URL` / `NEXT_PUBLIC_APP_URL`: frontend URL
- `API_URL` / `NEXT_PUBLIC_API_URL`: backend REST API URL
- `NEXT_PUBLIC_DOCUMENT_STORAGE_LIMIT`: storage quota in bytes (used by Documents page usage card)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


## Frontend Folder Structure

```text
frontend/
├── .env.example
├── README.md
├── next.config.ts
├── eslint.config.mjs
├── postcss.config.mjs
├── package.json
├── package-lock.json
├── tsconfig.json
├── next-env.d.ts
├── public/                   # static assets served by Next.js
│   ├── file.svg
│   ├── globe.svg
│   ├── logo.png
│   ├── next.svg
│   ├── opengraph-image.png
│   ├── twitter-image.png
│   ├── vercel.svg
│   └── window.svg
└── src/                      # application source
    ├── app/                  # App Router routes + metadata files
    │   ├── globals.css
    │   ├── icon.png
    │   ├── icon.svg
    │   ├── layout.tsx
    │   ├── opengraph-image.tsx
    │   ├── robots.ts
    │   ├── sitemap.ts
    │   ├── twitter-image.tsx
    │   ├── (public)/         # unauthenticated pages
    │   │   ├── layout.tsx
    │   │   ├── page.tsx
    │   │   ├── forgot-password/page.tsx
    │   │   ├── reset-password/page.tsx
    │   │   ├── verify-email/page.tsx
    │   │   ├── verification-pending/page.tsx
    │   │   ├── login/
    │   │   │   ├── layout.tsx
    │   │   │   └── page.tsx
    │   │   ├── signup/
    │   │   │   ├── layout.tsx
    │   │   │   └── page.tsx
    │   │   ├── invitations/[token]/
    │   │   │   ├── layout.tsx
    │   │   │   └── page.tsx
    │   │   └── oauth/google/callback/page.tsx
    │   └── (authenticated)/  # authenticated app pages
    │       ├── layout.tsx
    │       ├── dashboard/
    │       │   ├── loading.tsx
    │       │   └── page.tsx
    │       ├── documents/
    │       │   ├── loading.tsx
    │       │   ├── page.tsx
    │       │   └── new/
    │       │       ├── loading.tsx
    │       │       └── page.tsx
    │       ├── myprofile/
    │       │   ├── loading.tsx
    │       │   └── page.tsx
    │       ├── recent-activities/
    │       │   ├── loading.tsx
    │       │   └── page.tsx
    │       ├── team/
    │       │   ├── loading.tsx
    │       │   └── page.tsx
    │       └── trash/
    │           ├── loading.tsx
    │           └── page.tsx
    ├── components/           # shared and feature UI components
    │   ├── ToastProvider.tsx
    │   ├── authenticated/
    │   │   ├── AuthenticatedShell.tsx
    │   │   ├── ConfirmActionDialog.tsx
    │   │   ├── ContentArea.tsx
    │   │   ├── DashboardPageClient.tsx
    │   │   ├── DocumentsNewPageClient.tsx
    │   │   ├── DocumentsPageClient.tsx
    │   │   ├── RecentActivitiesPageClient.tsx
    │   │   ├── Sidebar.tsx
    │   │   ├── TeamPageClient.tsx
    │   │   ├── Topbar.tsx
    │   │   ├── TrashPageClient.tsx
    │   │   └── documentFilters.ts
    │   └── public/
    │       ├── BriefCardPreview.tsx
    │       ├── FAQ.tsx
    │       ├── Features.tsx
    │       ├── FinalCTA.tsx
    │       ├── Footer.tsx
    │       ├── Hero.tsx
    │       ├── HowItWorks.tsx
    │       ├── MoveToUpButton.tsx
    │       ├── Navbar.tsx
    │       ├── Pricing.tsx
    │       ├── ScrollReveal.tsx
    │       ├── SocialProof.tsx
    │       ├── StatsBar.tsx
    │       └── UploadZone.tsx
    └── lib/                  # API clients, helpers and utilities
        ├── seo.ts
        ├── api/
        │   ├── auth.ts
        │   ├── client.ts
        │   ├── documents.ts
        │   ├── endpoints.ts
        │   ├── errors.ts
        │   ├── organizations.ts
        │   ├── request.ts
        │   ├── search.ts
        │   ├── session.ts
        │   ├── twoFactor.ts
        │   └── user.ts
        └── utils/
            └── documentActions.ts
```
