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
