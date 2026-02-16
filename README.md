# Synapse

Synapse is a full-stack skills marketplace for Claude/Cursor-compatible `SKILL.md` workflows.

## Implemented MVP

- Next.js App Router + TypeScript + Tailwind
- Auth.js (Credentials + Google + GitHub)
- Prisma schema for users, skills, versions, reviews, sync jobs, usage logs
- Skills browse/detail/create flows
- Trial tier guard (`3` skills max)
- GitHub sync endpoint for `ComposioHQ/awesome-claude-skills`
- GitHub Models generation endpoint with rate limiting hooks
- Vercel cron config for nightly + weekly sync
- Unit tests (Vitest)

## Quickstart

1. Install dependencies:

```bash
npm install
```

2. Copy env file:

```bash
cp .env.example .env.local
```

3. Set `DATABASE_URL` to Supabase Postgres and fill OAuth/env keys.

4. Generate Prisma client and run migration:

```bash
npm run prisma:generate
npm run prisma:migrate
```

5. Run local dev:

```bash
npm run dev
```

## Key Endpoints

- `GET/POST /api/skills`
- `GET/PATCH /api/skills/:idOrSlug`
- `POST /api/skills/:id/reviews`
- `POST/GET /api/github/sync`
- `GET /api/github/sync/:jobId`
- `POST /api/llm/generate-skill`

## Deployment (Vercel Free-first)

1. Import project in Vercel.
2. Set environment variables from `.env.example`.
3. Configure Supabase Postgres + Supabase Storage.
4. Configure Upstash Redis keys for rate limits.
5. Set `CRON_SECRET`; Vercel cron hits `/api/github/sync` per `vercel.json`.

## Validation

```bash
npm run lint
npm run test
npm run build
```
