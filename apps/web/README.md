This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

## Professional Journey publishing

Owners publish updates at `/profile/<username>/share`. Configure the server with:

- `DIRA_OWNER_PASSCODE` (8+ chars) – owner sign-in passcode
- `DIRA_SESSION_SECRET` (16+ chars) – signs the HttpOnly session cookie
- `DIRA_DATA_DIR` (optional, default `apps/web/.data`) – JSON store + media uploads

Persistence is file-backed and needs a persistent disk. Serverless hosting requires swapping
`app/lib/journey-store.ts` for a database and object storage.

## Accounts, onboarding and dashboard (local only)

Professionals can register at `/register`, build a profile through a 9-step guided setup at `/onboarding`, manage it from `/dashboard`, and publish it at `/profile/<username>`. `alex-morgan` remains the built-in demo profile.

Everything runs against local storage, behind adapter interfaces in `app/lib/platform/ports.ts` (`AuthService`, `ProfileRepository`, `MediaStorage`) so Supabase can replace them without touching routes or UI:

- Data: `<DIRA_DATA_DIR or .data>/platform.json` (users, profiles, sessions).
- Images: `<DIRA_DATA_DIR or .data>/uploads/profiles/<profileId>/`. JPEG/PNG/WebP, 8 MB max, content-type and magic bytes checked.
- Passwords: scrypt with per-user salt. Sessions: random token stored as SHA-256, HttpOnly `dira_session` cookie, TTL `DIRA_SESSION_TTL_SECONDS` (default 7 days).
- Draft profiles and their images are visible only to the owner; published profiles are public.

On Vercel (`VERCEL` set) or with `DIRA_PUBLISHING_DISABLED=true`, registration, sign-in, profile edits, publishing and uploads return HTTP 503 (`ACCOUNTS_DISABLED`; Journey writes keep `PUBLISHING_DISABLED`). Public profiles keep working.

Known local-only limitations: JSON file storage is not durable or multi-instance safe, login throttling is in memory, uploaded-but-never-saved images are not garbage collected, and there is no email verification or password reset.

```bash
npm test                 # unit tests
npm run build && npm run test:integration   # HTTP tests against a production build
```
