# CampusHiring

Full-stack hiring board. Next.js 14 App Router, Server Actions only (no Express),
Prisma + Vercel Postgres (Neon), NextAuth credentials auth, Tailwind.

## Five-step setup (VS Code terminal)

```bash
# 1. Install dependencies (postinstall runs `prisma generate` for you)
npm install

# 2. Create a Postgres database on Vercel
#    Vercel Dashboard > Storage > Create Database > Neon (Postgres) > Free/Hobby
#    Then open the ".env.local" tab and copy the snippet it shows you.
cp .env.local.example .env.local   # paste the copied values over the placeholders

# 3. Add an auth secret to .env.local
openssl rand -base64 32            # paste into NEXTAUTH_SECRET

# 4. Create the tables in Neon (uses POSTGRES_URL_NON_POOLING)
npx prisma db push

# 5. Run it
npm run dev                        # http://localhost:3000
```

## Deploying

```bash
npm i -g vercel
vercel link         # attach this folder to a Vercel project
vercel env pull .env.local   # optional: re-sync env vars locally
vercel --prod
```

The Vercel Postgres integration injects `POSTGRES_PRISMA_URL` and
`POSTGRES_URL_NON_POOLING` automatically. Add `NEXTAUTH_SECRET` yourself under
Project Settings > Environment Variables. Leave `NEXTAUTH_URL` unset in
production — NextAuth derives it from the deployment URL.

## Why this builds cleanly on the free tier

- `next.config.mjs` ignores ESLint and TypeScript during builds.
- `build` runs `prisma generate` before `next build`, so the client always exists.
- `lib/prisma.ts` is a global singleton, so warm lambdas reuse one pool.
- Runtime queries go through the pooled PgBouncer URL; only `db push` uses the direct URL.
- JWT sessions mean no session-table query on every request.
- `bcryptjs` is pure JavaScript — no native build step on Vercel.

## Accounts

Create one company account and one student account from the landing page.
Company publishes roles at `/company`; student searches and applies at `/student`.

## New: shortlisting, hometown, and suggested jobs

- Companies can now **Shortlist** an applicant instead of deciding right
  away — shortlisted candidates move to their own section, where the
  company can confirm an interview (with date/time) or reject them
  whenever they're ready.
- Students can add "Where you're from" on their profile.
- If that's set, a **Suggested for you** section appears on the student
  job hub: roles in that same area where the student's stored skills are
  at least a 50% match to the job's text.

This changes the schema again (`SHORTLISTED` status, `hometown` field), so run:

```bash
npx prisma db push
```

## New: auto sign-in after signup, and dashboard stats

- Creating an account now signs you straight in — no more switching to the
  sign-in tab and retyping your email and password.
- Both dashboards show a quick stats row at the top (applications sent,
  interviews confirmed, live postings, etc.) — built entirely from data
  already being loaded, so no new database queries.
- Companies can now click **Email candidate** next to a CV link to open a
  pre-addressed email to that applicant.

No schema change this time — just run `npm install` isn't even needed,
copy the files over and restart `npm run dev`.

## New: interview scheduling, experience, and job-type filter

- When a company clicks **Confirm interview**, they now pick a date and time
  first. The student sees that slot on their applications table, and it's
  included in the email notification if `RESEND_API_KEY` is set.
- Students can add a free-text "What you were doing before" field on their
  profile — past internships, jobs, or projects, kept as one simple text box
  rather than a structured multi-entry history.
- The student job search now has a job-type dropdown (Full-time, Internship,
  Contract, Part-time) alongside the existing text and location search.

## New: profile, saved jobs, and email alerts

- Students edit a headline, skills and bio at `/student/profile`, and can
  bookmark roles from the job hub — saved jobs show up on that same page.
- Companies can click a candidate's name from an application to see their
  profile at `/profile/[id]`. Each open increments a private view counter
  the student sees on their own profile page — never who looked, only how many.
- If `RESEND_API_KEY` is set, students get an email when a company confirms
  an interview or rejects their application. Sign up free at resend.com,
  verify a sender, and paste the key into `.env.local` (and into Vercel's
  Environment Variables for the live site). Leave it blank and the app just
  skips sending — nothing else is affected.
- Applicants to the same job can see each other's name and headline (only
  once they've applied themselves), and job listings show a skill-match
  percentage badge based on the student's saved skills.

Because the schema has changed across these updates (new fields on `User`,
`interviewAt` on `Application`, plus the `SavedJob` table), run this once
after pulling the update, both locally and against your Vercel database:

```bash
npx prisma db push
```
