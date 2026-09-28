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

## New: more animations

- Every page fades in on navigation; the landing page has a staggered
  entrance and a slowly floating glow.
- Sign-in / create-account forms fade when you switch tabs.
- Status pills pop in; table rows fade in one after another.
- Save and Like buttons give a press effect; feed posts highlight on hover.
- Smooth scrolling (back-to-top, anchor jumps).
- All motion is switched off for people who set "reduce motion" in their
  operating system.

CSS only — no schema change, no new dependency. Copy files, restart `npm run dev`.

## New: apply from saved jobs, skeleton loaders, and more polish

- Saved jobs (on your profile page) and Suggested jobs now have an Apply
  form, and saved jobs can be un-saved right there.
- Pages show a loading skeleton instantly while data loads.
- The profile page has a Profile strength meter (5 fields, 20% each).
- Jobs posted in the last 48 hours get a "New" badge.
- A back-to-top button appears after scrolling.

No schema change — copy files and restart `npm run dev`.

## New: feed, articles, likes, comments, and Open to work

- `/feed` is a shared feed for students and companies. Post a short update,
  or hit **Write article** to add a title and a longer body.
- Like and comment on posts; authors can delete their own posts.
- Students can tick **Open to work** on their profile to show a badge.

This adds `Post`, `PostLike` and `Comment` tables and an `openToWork`
field, so run once:

```bash
npx prisma db push
```

## New: student connections and LinkedIn-style layout

- Students can **Connect** with each other from a profile page (reach one
  via the fellow-applicants chips on a job you've applied to). States:
  Connect, Pending, Accept/Decline, Connected. If two students both send a
  request, it auto-accepts.
- New **My network** page lists invitations and connections.
- The student hub has a LinkedIn-style left sidebar (avatar, headline,
  connections, profile views) on large screens.
- Initial-letter avatars on profiles, network, and fellow applicants.

This adds a `Connection` table, so run once:

```bash
npx prisma db push
```

## New: more dynamic and interactive UI

- Stat numbers count up on load instead of just appearing.
- Job listings and applicant rows fade in with a slight stagger, and
  highlight on hover.
- "Posted X ago" ticks live (updates itself every minute) instead of being
  fixed at page load.
- Long job descriptions collapse with a "Read more" toggle.
- Buttons give a small tactile press effect (scale down slightly on click).

All presentation-only — no schema change, no new dependency. Copy the files
over and restart `npm run dev`.

## New: withdraw, duplicate, and friendlier dates

- Students can **withdraw** an application while it's still pending (before
  a company shortlists, confirms, or rejects it) — a plain text link in the
  applications table.
- Companies can **duplicate** a posting instead of retyping a near-identical
  role.
- Job listings now show "posted 2h ago" / "yesterday" instead of always a
  full date, falling back to the date after a week.

No schema change — just copy the files over and restart `npm run dev`.

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
