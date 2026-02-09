# Architecture Overview

## System Architecture

```
Internet
    │
    ▼
┌─────────┐     ┌──────────────┐     ┌────────────┐
│  Nginx  │────▶│  Next.js 14  │────▶│ PostgreSQL │
│  (SSL)  │     │  (PM2:3000)  │     │  16 + pgv  │
└─────────┘     └──────┬───────┘     └────────────┘
                       │
              ┌────────┼────────┐
              ▼        ▼        ▼
         ┌────────┐ ┌──────┐ ┌───────┐
         │ Claude │ │Ollama│ │Resend │
         │  API   │ │(emb) │ │(email)│
         └────────┘ └──────┘ └───────┘
```

## Server Stack

| Component | Technology | Details |
|-----------|-----------|---------|
| Web Server | Nginx | Reverse proxy, SSL termination, static file serving |
| Application | Next.js 14 | Server-side rendering, API routes, middleware |
| Process Manager | PM2 | Auto-restart, log management, startup on boot |
| Database | PostgreSQL 16 | Primary data store + pgvector for embeddings |
| Embeddings | Ollama | Local LLM inference for vector embeddings (all-minilm) |
| AI | Claude API | Content generation, photo moderation, RAG chat |
| Email | Resend | Transactional and marketing emails |

## Application Architecture

### Next.js 14 App Router

The application uses the Next.js 14 App Router with a mix of:
- **Server Components** (default): Pages, layouts, metadata
- **Client Components** (`'use client'`): Interactive UI, forms, modals
- **API Routes** (`route.ts`): REST endpoints for CRUD operations and automations

### Authentication

- **JWT-based** using `jose` library (Edge Runtime compatible)
- Cookie: `admin_token` (HttpOnly, 24h expiry)
- Middleware: `src/middleware.ts` validates JWT on all `/admin/*` and `/api/admin/*` routes
- Cron jobs authenticate via `X-Cron-Secret` header

### Data Flow

```
Client Request
    │
    ▼
Nginx (SSL + static files)
    │
    ▼
Next.js Middleware (JWT validation)
    │
    ▼
API Route Handler
    │
    ├──▶ Prisma ORM ──▶ PostgreSQL
    ├──▶ Claude API (AI tasks)
    ├──▶ Ollama (embeddings)
    ├──▶ Football APIs (match data)
    └──▶ Resend (emails)
```

### Prisma Models

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `Post` | Blog articles | title, slug, content, category |
| `Package` | Match day packages | title, slug, price, inclusions |
| `Lead` | Contact form leads | name, email, message |
| `Subscriber` | Newsletter subscribers | email, active, token |
| `Photo` | Gallery photos | url, thumbnail, status, gps, reportCount |
| `PhotoReport` | Photo complaints | photoId, reason, reporterIp |
| `Newsletter` | Sent newsletters | subject, htmlContent, stats |
| `CompetitionData` | Standings cache | competition, standings JSON, predictions |
| `Match` | Upcoming matches | date, opponent, opponentLogo, competition, venue |
| `AutomationRun` | Cron job logs | type, status, message, details |
| `Penya` | FCB supporters clubs | name, city, country, enrichment fields |
| `AdminUser` | Admin users | username, password (bcrypt), name |
| `Setting` | Key-value config | key, value (API keys, settings) |

### API Key Resolution

All API keys follow a two-tier resolution:
1. Check `Setting` table in database (set via `/admin/settings`)
2. Fall back to `process.env` / `.env` file

This allows runtime configuration without redeployment.

## File Storage

| Path | Content | Served By |
|------|---------|-----------|
| `/public/images/packages/` | Package hero images | Next.js static |
| `/public/images/blog/` | Blog post images | Next.js static |
| `/public/images/crests/` | Team crest images | Next.js static |
| `/public/uploads/gallery/` | User-uploaded photos | Nginx (cache 30d) |
| `/var/www/friendsofbarca/backups/` | Database backups | API download only |

## Security

- All admin routes protected by JWT middleware
- Photo uploads: max 10MB, type validation, Claude Vision moderation
- Report system: IP-based rate limiting (1 report per IP per photo)
- Newsletter unsubscribe: HMAC-SHA256 tokenized URLs
- Backup API: admin-only, path traversal prevention with `path.basename()`
- `.env` not committed; keys stored in DB Setting table
