# FriendsOfBarca.com

Community platform for FC Barcelona fans — match day packages, travel guides, news, and peña directory.

## Stack

- **Framework**: Next.js 14 + TypeScript
- **Styling**: Tailwind CSS v3
- **ORM**: Prisma 5
- **Database**: PostgreSQL 16
- **AI**: Claude API (Anthropic) for content generation, photo moderation, and peña enrichment
- **Process manager**: PM2
- **Reverse proxy**: Nginx + SSL (Let's Encrypt)

## Features

### Public
- **Match Packages** (`/packages`) — curated travel packages for Barça matches
- **Blog & Guides** (`/blog`, `/guides`) — travel tips, stadium guides
- **Gallery** (`/gallery`) — fan photo uploads with AI moderation (Claude Vision), EXIF extraction, geocoding
- **Competitions** (`/competitions`) — La Liga, Champions League, Copa del Rey standings with AI predictions
- **News** (`/news`) — automated match chronicles and weekly digests via RSS + AI
- **Calendar** (`/calendar`) — upcoming match schedule

### Admin (`/admin`)
- JWT authentication (jose + bcryptjs)
- **Gallery moderation** — approve/reject/delete photos
- **Peñas directory** — 1200+ FCB supporters clubs scraped from penyes.fcbarcelona.com, AI enrichment for contact details
- **News automations** — match chronicle and digest generation
- **Settings** — configurable API keys (Anthropic, API-Football, GA)
- **Leads & subscribers** management
- **User management** — admin user CRUD

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16
- Anthropic API key (for AI features)
- API-Football key (for competition data, optional)

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
API_FOOTBALL_KEY="your-key"
GA_MEASUREMENT_ID="G-XXXXXXXXXX"
```

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
```

## Project Structure

```
src/
├── app/
│   ├── admin/          # Admin pages (gallery, penyes, settings, etc.)
│   ├── api/            # API routes
│   ├── blog/           # Blog pages
│   ├── competitions/   # Competition standings
│   ├── gallery/        # Photo gallery
│   ├── news/           # Automated news
│   └── packages/       # Match day packages
├── components/         # Shared React components
└── lib/                # Business logic
    ├── auth.ts         # JWT authentication
    ├── competitions.ts # API-Football + AI predictions
    ├── gallery.ts      # Photo pipeline (EXIF, geocode, Claude Vision)
    ├── news-automation.ts # RSS + AI content generation
    ├── penyes.ts       # FCB peñas scraping
    ├── penya-enrichment.ts # AI enrichment for peña details
    └── prisma.ts       # Prisma client singleton
```

## License

Private project.
