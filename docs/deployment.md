# Deployment Guide

## Server Setup

### Requirements

- Ubuntu 24.04 LTS (Hetzner VPS or similar)
- Node.js 20+ (via NodeSource)
- PostgreSQL 16 with pgvector extension
- Nginx
- Certbot (Let's Encrypt)
- Ollama (for RAG features)
- PM2 (process manager)

### Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Install PostgreSQL 16 + pgvector

```bash
sudo apt install postgresql-16 postgresql-16-pgvector
sudo -u postgres psql -c "CREATE USER friendsofbarca WITH PASSWORD 'your-password' CREATEDB;"
sudo -u postgres psql -c "CREATE DATABASE friendsofbarca OWNER friendsofbarca;"
sudo -u postgres psql -d friendsofbarca -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### Install Ollama

```bash
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull all-minilm
sudo systemctl enable ollama
```

### Install Nginx + SSL

```bash
sudo apt install nginx certbot python3-certbot-nginx

# Configure Nginx (see config below)
sudo certbot --nginx -d friendsofbarca.com -d www.friendsofbarca.com
```

### Nginx Configuration

```nginx
server {
    listen 443 ssl;
    server_name friendsofbarca.com www.friendsofbarca.com;

    ssl_certificate /etc/letsencrypt/live/friendsofbarca.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/friendsofbarca.com/privkey.pem;

    client_max_body_size 12m;

    location /uploads/gallery/ {
        alias /var/www/friendsofbarca/public/uploads/gallery/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name friendsofbarca.com www.friendsofbarca.com;
    return 301 https://$host$request_uri;
}
```

## Application Deployment

### Clone and Install

```bash
cd /var/www
git clone https://github.com/rauldct/friendsoffcb.git friendsofbarca
cd friendsofbarca
npm install
```

### Environment Configuration

```bash
cp .env.example .env
# Edit .env with your actual values
```

### Database Setup

```bash
npx prisma db push
npx prisma db seed        # Seed packages, blog posts, sample photos
node prisma/seed-admin.js # Create initial admin user
```

### Build and Start

```bash
npm run build
pm2 start npm --name friendsofbarca -- start
pm2 startup systemd
pm2 save
```

### Verify Services

```bash
pm2 status
sudo systemctl is-enabled postgresql nginx ollama pm2-root
curl -s http://localhost:3000 | head -5
```

## Cron Jobs

The crontab manages automated tasks. All cron endpoints require `X-Cron-Secret` header.

```bash
crontab -e
```

```cron
# Competition standings (daily 6AM UTC)
0 6 * * * curl -s -X POST -H "X-Cron-Secret: $CRON_SECRET" https://friendsofbarca.com/api/competitions/refresh

# Calendar sync (daily 7AM UTC)
0 7 * * * curl -s -X POST -H "X-Cron-Secret: $CRON_SECRET" https://friendsofbarca.com/api/automations/sync-matches

# News digest (Mon+Thu 8AM UTC)
0 8 * * 1,4 curl -s -X POST -H "X-Cron-Secret: $CRON_SECRET" https://friendsofbarca.com/api/automations/news-digest

# Newsletter (Thu 9AM UTC)
0 9 * * 4 curl -s -X POST -H "X-Cron-Secret: $CRON_SECRET" https://friendsofbarca.com/api/automations/newsletter-digest

# Auto chronicle (daily 10AM UTC)
0 10 * * * curl -s -X POST -H "X-Cron-Secret: $CRON_SECRET" https://friendsofbarca.com/api/automations/auto-chronicle

# Peñas sync (Mon 5AM UTC)
0 5 * * 1 curl -s -X POST -H "X-Cron-Secret: $CRON_SECRET" https://friendsofbarca.com/api/admin/penyes
```

## Updating

```bash
cd /var/www/friendsofbarca
git pull
npm install
npx prisma db push  # Apply any schema changes
npm run build
pm2 restart friendsofbarca
```

## Backup & Restore

### Via Admin UI

Navigate to `/admin/backup` to create, download, restore, and delete backups.

### Via CLI

```bash
# Create backup
pg_dump -U friendsofbarca -d friendsofbarca -F p -f /var/www/friendsofbarca/backups/backup-$(date +%Y%m%d).sql

# Restore
psql -U friendsofbarca -d friendsofbarca -f /var/www/friendsofbarca/backups/backup-20260209.sql
```

## Monitoring

- **PM2 logs**: `pm2 logs friendsofbarca`
- **PM2 status**: `pm2 status`
- **Nginx logs**: `/var/log/nginx/access.log`, `/var/log/nginx/error.log`
- **PostgreSQL logs**: `journalctl -u postgresql`
- **Ollama logs**: `journalctl -u ollama`
- **Automation runs**: Check `/admin/automations` in the admin dashboard
