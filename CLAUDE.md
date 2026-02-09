# CLAUDE.md - FriendsOfBarca.com

## Project Overview
Fan site for FC Barcelona: match packages, news, competitions, gallery, newsletter, and supporter clubs (penyes). Live at https://friendsofbarca.com

## Tech Stack
- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS v3 (NOT v4)
- **ORM**: Prisma 5 (NOT v7) + PostgreSQL 16
- **Server**: PM2 on port 3000 behind Nginx with SSL
- **Directory**: `/var/www/friendsofbarca`

## Key Commands
```bash
# Build & deploy
cd /var/www/friendsofbarca && npm run build && pm2 restart friendsofbarca

# Prisma
npx prisma db push          # Sync schema (preferred)
npx prisma generate         # Regenerate client
# Do NOT use `prisma migrate dev` (requires interactive mode)

# Dev
npm run dev                 # Dev server on :3000
```

## Architecture

### Database Models (prisma/schema.prisma)
- `MatchPackage`, `BlogPost`, `Lead`, `Subscriber` (has `language` field)
- `Match`, `Setting` (key-value config), `CompetitionData`
- `NewsArticle` (chronicles + digests), `AutomationRun`, `RssSource`
- `Newsletter` (bilingual: `htmlContent` + `htmlContentEs`), `NewsletterOpen` (per-subscriber tracking)
- `Penya` (supporter clubs with enrichment), `AdminUser` (JWT auth)
- `Photo`, `PhotoReport` (gallery with moderation)
- `Feedback`

### Auth System
- JWT (jose + bcryptjs), cookie `admin_token`, 24h expiry
- Middleware: `src/middleware.ts` (protects `/admin/*` routes)
- Cron endpoints use `X-Cron-Secret` header instead of JWT

### API Keys (configurable via `/admin/settings`)
All keys are fetched from DB `Setting` table first, then `.env` fallback:
`ANTHROPIC_API_KEY`, `FOOTBALL_DATA_API_KEY`, `API_FOOTBALL_KEY`, `RESEND_API_KEY`, `BRAVE_API_KEY`, `PERPLEXITY_API_KEY`, `GROK_API_KEY`, `GA_MEASUREMENT_ID`

### Newsletter System (`src/lib/newsletter.ts`)
- Bilingual (EN + ES) with photos from `/public/images/`
- Claude AI generates both versions as JSON `{"en": "...", "es": "..."}`
- Per-subscriber tracking via `NewsletterOpen` model
- Sent via Resend (200ms delay between emails)
- Weekly auto: Mondays 8AM UTC

### Automations (cron jobs)
- News digest: Mon & Thu 8AM UTC
- Weekly newsletter: Mon 8AM UTC
- Auto chronicle: Daily 10AM UTC
- Calendar sync: Daily 7AM UTC
- Competition data: Daily 6AM UTC
- Package sync: Daily 7:30AM UTC
- Penyes sync: Mon 5AM UTC
- Guide generation: Monthly 1st 9AM UTC

### External APIs
- **football-data.org**: La Liga + CL (rate limit: 10 req/min, use 7s delay)
- **API-Football** (api-sports.io): Copa del Rey fallback (100 req/day)
- **Resend**: Email sending (3000/month, 100/day)
- **Brave Search + DuckDuckGo**: Penyes enrichment
- **Perplexity Sonar + Grok**: Penyes enrichment pipeline
- **Ollama** (local all-minilm): RAG embeddings (384 dims)

## Coding Conventions
- Server → Client: serialize `Date` to ISO string
- Prisma types: `string | null` (not `string | undefined`)
- Claude AI JSON responses: always strip ```json``` markdown blocks
- `cookies()` is synchronous in Next.js 14
- jose (JWT) is Edge Runtime compatible; jsonwebtoken is NOT
- Images: use Next.js `Image` component, sharp for processing
- HEIC/HEIF: convert to JPEG via sharp with `.rotate()` for EXIF orientation

## File Structure Patterns
- API routes: `src/app/api/[domain]/route.ts`
- Admin API routes: `src/app/api/admin/[domain]/route.ts`
- Admin pages: `src/app/admin/[section]/page.tsx` (client components)
- Libraries: `src/lib/[feature].ts`
- Components: `src/components/[Name].tsx`

## Important Notes
- Do NOT upgrade Tailwind to v4 (incompatible with PostCSS config)
- Do NOT upgrade Prisma to v7 (breaking changes)
- Subagents (Task background) don't have auto permissions - create files directly
- `backups/` directory should NOT be committed (contains DB dumps)
