# Features Documentation

## 1. Fan Photo Gallery

### Overview
Community photo gallery where fans can upload photos related to FC Barcelona. Photos are moderated by Claude Vision AI with automatic approval for high-confidence results.

### Upload Pipeline
1. **Client validation**: File type (JPEG, PNG, WebP, HEIC/HEIF), max 10MB
2. **MIME normalization**: iPhone photos with empty MIME type get type inferred from extension
3. **EXIF extraction**: GPS coordinates, date taken, camera info (via `exifr`)
4. **Image processing** (via `sharp`):
   - EXIF orientation correction (`.rotate()`)
   - HEIC/HEIF → JPEG conversion
   - Resize to max 1920px (main) + 400px (thumbnail)
5. **Geocoding**: GPS coords → city/country name via OpenStreetMap Nominatim
6. **AI moderation**: Claude Vision analyzes with confidence levels
7. **Status assignment**:
   - Approved + high confidence → `approved` (published immediately)
   - Rejected + high confidence → `rejected` (files deleted)
   - Medium/low confidence → `pending` (manual review)

### Report System
- Public users can report photos (5 reasons: inappropriate, spam, copyright, not related, other)
- Max 1 report per IP per photo
- At 10 reports: photo auto-disabled (status → pending)
- Admin can filter "Reported" photos, approve resets report count

### Key Files
- `src/lib/gallery.ts` — Core pipeline
- `src/app/api/gallery/upload/route.ts` — Upload endpoint
- `src/app/api/gallery/report/route.ts` — Public report endpoint
- `src/components/GalleryGrid.tsx` — Gallery display with masonry layout

---

## 2. Competitions & Standings

### Data Sources
- **football-data.org** (primary): La Liga (`PD`), Champions League (`CL`)
  - Free tier: 10 requests/min
  - Barça team ID: 81
- **API-Football** (fallback): Copa del Rey (league 143), CL (league 2)
  - Free tier: 100 requests/day, seasons 2022-2024 only
  - Barça team ID: 529

### AI Predictions
Claude AI generates match predictions based on:
- Current standings and form
- Historical head-to-head data
- Competition context

### Key Files
- `src/lib/competitions.ts` — API clients + AI prediction generation
- `src/app/api/competitions/refresh/route.ts` — Refresh endpoint
- `src/app/competitions/page.tsx` — Standings display

---

## 3. Upcoming Matches Calendar

### Multi-Source Sync
1. **football-data.org**: Scheduled matches for Barça (La Liga + CL)
2. **API-Football**: Copa del Rey matches (not in football-data.org free tier)
3. **Manual entries**: Copa del Rey semifinal dates added when APIs don't cover them

### Team Crests
- Downloaded automatically to `/public/images/crests/`
- Safe filename from team name (lowercase, hyphenated)
- Existing remote URLs converted to local paths on sync
- Supports SVG and PNG formats

### Key Files
- `src/app/api/automations/sync-matches/route.ts` — Sync engine
- `src/app/calendar/MatchCalendarClient.tsx` — Calendar UI with crests

---

## 4. Automated News

### Match Chronicles
- **Auto-detection**: Checks football-data.org daily for completed Barça matches
- **Generation**: Claude AI creates detailed match report (800-1200 words)
- **Content**: Score, key moments, player performances, tactical analysis

### News Digests
- Compiled from 6 RSS sources: FCB Official, Marca, Sport, Mundo Deportivo, ESPN FC, BBC Sport
- Claude AI summarizes and curates the week's top stories
- Published Monday and Thursday

### Key Files
- `src/lib/news-automation.ts` — Chronicle and digest generation
- `src/app/api/automations/auto-chronicle/route.ts` — Daily auto-chronicle
- `src/app/api/automations/news-digest/route.ts` — Digest generation

---

## 5. Newsletter System

### Automation
- Weekly newsletter auto-generated every Thursday at 9AM UTC
- Compiles articles from the past 7 days
- Sends via Resend API with branded HTML template

### Features
- Open tracking via 1x1 GIF pixel
- HMAC-SHA256 tokenized unsubscribe links
- Stats: subscribers, sent count, delivered, open rate
- Admin UI: create, edit, preview, send manually

### Key Files
- `src/lib/newsletter.ts` — Email template, sending logic, HMAC tokens
- `src/app/api/automations/newsletter-digest/route.ts` — Auto newsletter
- `src/app/admin/newsletter/page.tsx` — Admin management

---

## 6. Peñas Directory

### Scraping
- Source: penyes.fcbarcelona.com (3 URLs: Catalunya, Spain, World)
- 1,217 peñas scraped with cheerio
- Fields: name, city, province, country, region

### AI Enrichment Pipeline
Multi-source pipeline with graceful degradation:

1. **Brave Search** (2000/month free) — Find official website
2. **DuckDuckGo** (fallback) — Alternative web search
3. **Perplexity Sonar** — AI-powered search for contact details
4. **Grok** — Additional AI search fallback
5. **Web Scraping** (cheerio) — Scrape discovered websites for emails, phones, social links
6. **Social Scraping** — Extract social media profiles
7. **Claude AI** — Validate website ownership, synthesize description from scraped content

### RAG Chat
- **pgvector**: Vector embeddings stored in PostgreSQL
- **Ollama**: Generates embeddings with all-minilm model (384 dimensions)
- **Chunk types**: basic_info, contact, description, scraped_content, website_validation, notes
- **Auto-indexing**: Triggered after enrichment or manual edit
- **Chat**: Claude AI answers questions using relevant peña chunks as context

### Key Files
- `src/lib/penyes.ts` — Scraping logic
- `src/lib/penya-enrichment.ts` — Multi-source enrichment pipeline
- `src/lib/rag.ts` — RAG system (embeddings, chunking, search, chat)

---

## 7. Affiliate System

### Providers
- **StubHub**: Match tickets (performer/2981)
- **Booking.com**: Hotels in Barcelona (aid parameter)
- **GetYourGuide**: Activities and tours (partner_id: 2VA1MMM)

### Implementation
- Affiliate IDs stored in DB `Setting` table
- URLs generated server-side in `/packages/[slug]/page.tsx`
- Manual URLs (not "#") are preserved
- Configurable from `/admin/settings`

### Key Files
- `src/lib/affiliates.ts` — URL generation logic

---

## 8. Database Backup System

### Features
- **Create**: Full PostgreSQL dump (plain SQL format)
- **List**: All backups sorted by date
- **Download**: Direct .sql file download
- **Restore**: From existing backup or uploaded file
- **Pre-restore backup**: Automatic safety backup before any restore
- **Delete**: Remove old backups

### Storage
- Backups persisted at `/var/www/friendsofbarca/backups/`
- Format: `friendsofbarca-YYYY-MM-DDTHH-MM-SS.sql`

### Key Files
- `src/app/api/admin/backup/route.ts` — Backup API
- `src/app/admin/backup/page.tsx` — Admin UI

---

## 9. Admin Authentication

### JWT Flow
1. User submits credentials at `/admin/login`
2. Server validates bcrypt hash via `AdminUser` table
3. JWT token (HS256) generated with `jose` library
4. Token set as `admin_token` cookie (HttpOnly, 24h expiry)
5. `src/middleware.ts` validates JWT on every admin request

### Cron Authentication
- Cron jobs use `X-Cron-Secret` header instead of JWT
- Secret configured in `.env` as `CRON_SECRET`

### Key Files
- `src/lib/auth.ts` — JWT sign/verify, bcrypt compare
- `src/middleware.ts` — Route protection middleware
- `src/app/admin/login/page.tsx` — Login form
