# FriendsOfBarca.com

Community platform for FC Barcelona fans — match day packages, travel guides, news, fan gallery, peña directory, and more.

**Live**: [friendsofbarca.com](https://friendsofbarca.com)

## Stack

- **Framework**: Next.js 14 + TypeScript
- **Styling**: Tailwind CSS v3
- **ORM**: Prisma 5
- **Database**: PostgreSQL 16 + pgvector (embeddings)
- **AI**: Claude API (Anthropic) for content generation, photo moderation, peña enrichment, and RAG chat
- **Embeddings**: Ollama (all-minilm, 384 dimensions) for vector search
- **Email**: Resend (newsletters, digests)
- **Process manager**: PM2
- **Reverse proxy**: Nginx + SSL (Let's Encrypt, auto-renewal)
- **Server**: Hetzner VPS, Ubuntu 24.04

## Features

### Public Pages

| Route | Feature | Description |
|-------|---------|-------------|
| `/packages` | Match Packages | Curated travel packages for Barça matches with affiliate links (StubHub, Booking.com, GetYourGuide) |
| `/blog` | Blog & Guides | Travel tips, stadium guides, Barcelona city guides |
| `/gallery` | Fan Gallery | Photo uploads with AI moderation (Claude Vision), EXIF extraction, geocoding, HEIC/HEIF support |
| `/competitions` | Competitions | La Liga, Champions League, Copa del Rey standings with AI predictions |
| `/news` | Automated News | Match chronicles (auto-generated post-match) and weekly digests via RSS + Claude AI |
| `/calendar` | Upcoming Matches | Match schedule with opponent crests, multi-competition (La Liga, CL, Copa del Rey) |
| `/privacy` | Privacy Policy | GDPR-compliant privacy policy |
| `/terms` | Terms of Use | Legal terms of service |
| `/cookies` | Cookie Policy | Cookie usage details |

### Admin Dashboard (`/admin`)

| Route | Feature | Description |
|-------|---------|-------------|
| `/admin/gallery` | Gallery Moderation | Approve/reject/delete photos, reported filter, pending badge |
| `/admin/penyes` | Peñas Directory | 1200+ FCB supporters clubs, multi-source AI enrichment pipeline |
| `/admin/penyes/chat` | RAG Chat | AI chat about peñas using pgvector + Ollama embeddings |
| `/admin/news` | News Management | CRUD for articles, search, filters |
| `/admin/newsletter` | Newsletter | Create/send newsletters, stats (open rate, delivery), weekly auto-digest |
| `/admin/automations` | Automations | Run/monitor cron jobs: match chronicles, digests, calendar sync, competitions |
| `/admin/settings` | API Keys | Manage all API keys and affiliate IDs from UI |
| `/admin/backup` | Database Backup | Create/download/restore/delete PostgreSQL backups |
| `/admin/users` | User Management | Admin user CRUD |
| `/admin/leads` | Leads | Lead management with delete |
| `/admin/subscribers` | Subscribers | Newsletter subscriber management |

### AI-Powered Features

- **Photo Moderation**: Claude Vision analyzes uploads with confidence levels (high/medium/low). High confidence → auto-approve/reject. Medium/low → manual review.
- **Match Chronicles**: Auto-detects completed Barça matches via football-data.org, generates detailed match reports with Claude AI.
- **News Digests**: Compiles weekly news from 6 RSS sources + Claude AI summarization.
- **Competition Predictions**: AI-generated predictions for upcoming matches.
- **Peña Enrichment**: Multi-source pipeline: Brave Search → DuckDuckGo (fallback) → Perplexity Sonar → Grok → Web Scraping → Claude synthesis. Validates websites, extracts contact info.
- **RAG Chat**: Chat with AI about peñas using pgvector embeddings and Ollama.

### Automated Jobs (Cron)

| Schedule | Job | Description |
|----------|-----|-------------|
| Daily 6:00 UTC | Competition Refresh | Update standings and predictions |
| Daily 7:00 UTC | Calendar Sync | Sync upcoming matches + download crests |
| Daily 10:00 UTC | Auto Chronicle | Generate post-match report if Barça played yesterday |
| Mon+Thu 8:00 UTC | News Digest | Compile and publish weekly news digest |
| Thu 9:00 UTC | Newsletter | Auto-send weekly newsletter to subscribers |
| Mon 5:00 UTC | Peñas Sync | Re-scrape peñas directory |

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16 with pgvector extension
- Ollama with all-minilm model (for RAG features)
- API keys: Anthropic (required), football-data.org, API-Football, Resend, Brave Search (optional)

### Installation

```bash
git clone https://github.com/rauldct/friendsoffcb.git
cd friendsoffcb
npm install
```

### Environment

Create a `.env` file:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/friendsofbarca"
JWT_SECRET="your-secret-key"
CRON_SECRET="your-cron-secret"
ANTHROPIC_API_KEY="sk-ant-..."
FOOTBALL_DATA_API_KEY="your-key"
API_FOOTBALL_KEY="your-key"
GA_MEASUREMENT_ID="G-XXXXXXXXXX"
RESEND_API_KEY="re_..."
BRAVE_API_KEY="your-key"
PERPLEXITY_API_KEY="your-key"
GROK_API_KEY="your-key"
```

> All API keys are also configurable from `/admin/settings` (stored in DB, takes priority over .env).

### Database

```bash
npx prisma db push
npx prisma db seed
node prisma/seed-admin.js
```

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
pm2 start npm --name friendsofbarca -- start
pm2 startup systemd
pm2 save
```

### Nginx

Configure reverse proxy to port 3000 with SSL. See `docs/deployment.md` for details.

## Project Structure

```
src/
├── app/
│   ├── admin/              # Admin pages
│   │   ├── automations/    # Cron job management
│   │   ├── backup/         # Database backup/restore
│   │   ├── gallery/        # Photo moderation
│   │   ├── leads/          # Lead management
│   │   ├── news/           # News CRUD
│   │   ├── newsletter/     # Newsletter management
│   │   ├── penyes/         # Peñas directory + RAG chat
│   │   ├── settings/       # API key configuration
│   │   ├── subscribers/    # Subscriber management
│   │   └── users/          # Admin user management
│   ├── api/
│   │   ├── admin/          # Protected admin APIs
│   │   ├── automations/    # Cron job endpoints
│   │   ├── gallery/        # Public gallery + report APIs
│   │   └── newsletter/     # Track + unsubscribe
│   ├── blog/               # Blog pages
│   ├── calendar/           # Upcoming matches
│   ├── competitions/       # Competition standings
│   ├── cookies/            # Cookie policy
│   ├── gallery/            # Public photo gallery
│   ├── news/               # Automated news
│   ├── packages/           # Match day packages
│   ├── privacy/            # Privacy policy
│   └── terms/              # Terms of use
├── components/             # Shared React components
│   ├── GalleryGrid.tsx     # Masonry gallery with lightbox + reports
│   ├── PhotoCard.tsx       # Gallery photo card
│   ├── PhotoLightbox.tsx   # Full-screen photo viewer
│   ├── PhotoUploadForm.tsx # Drag & drop upload (HEIC support)
│   ├── ReportPhotoModal.tsx # Photo report modal
│   └── ...                 # Other UI components
└── lib/                    # Business logic
    ├── affiliates.ts       # Affiliate URL generation
    ├── auth.ts             # JWT authentication (jose + bcryptjs)
    ├── competitions.ts     # football-data.org + API-Football + AI predictions
    ├── gallery.ts          # Photo pipeline (EXIF, HEIC, geocode, Claude Vision)
    ├── news-automation.ts  # RSS + AI content generation
    ├── newsletter.ts       # Resend email + HMAC tokens
    ├── penya-enrichment.ts # Multi-source AI enrichment pipeline
    ├── penyes.ts           # FCB peñas scraping (cheerio)
    ├── prisma.ts           # Prisma client singleton
    └── rag.ts              # pgvector + Ollama RAG system
```

## External APIs

| API | Usage | Tier |
|-----|-------|------|
| [Anthropic Claude](https://anthropic.com) | Photo moderation, content generation, enrichment | Pay per use |
| [football-data.org](https://football-data.org) | La Liga + CL standings, match schedules | Free (10 req/min) |
| [API-Football](https://api-sports.io) | Copa del Rey, CL fallback | Free (100 req/day) |
| [Resend](https://resend.com) | Newsletter emails | Free (3000/month) |
| [Brave Search](https://brave.com/search/api) | Peña enrichment web search | Free (2000/month) |
| [Perplexity Sonar](https://perplexity.ai) | Peña enrichment AI search | Pay per use |
| [Grok](https://x.ai) | Peña enrichment fallback | Pay per use |

## Legal

- **Company**: DCT BUSINESS CORP Inc.
- **Address**: 1395 Brickell Ave, Miami, FL 33131
- **Contact**: info@friendsofbarca.com

Private project. All rights reserved.
