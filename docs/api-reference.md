# API Reference

## Public Endpoints

### Gallery

#### `GET /api/gallery`
List approved photos with pagination.

**Query params**: `page` (default 1), `limit` (default 20)

**Response**:
```json
{
  "photos": [...],
  "total": 150,
  "page": 1,
  "totalPages": 8
}
```

#### `POST /api/gallery/upload`
Upload a new photo. Multipart form data.

**Body**: `file` (image, max 10MB), `caption` (optional), `location` (optional)

**Supported formats**: JPEG, PNG, WebP, HEIC, HEIF

#### `POST /api/gallery/report`
Report a photo.

**Body**:
```json
{
  "photoId": "uuid",
  "reason": "inappropriate|spam|copyright|not_related|other",
  "description": "optional text"
}
```

### Newsletter

#### `GET /api/newsletter/track?id={newsletterId}`
1x1 GIF tracking pixel for open rate.

#### `GET /api/newsletter/unsubscribe?token={hmacToken}&email={email}`
Unsubscribe from newsletter.

---

## Admin Endpoints

All admin endpoints require `admin_token` cookie (JWT).

### Authentication

#### `POST /api/admin/auth/login`
```json
{ "username": "admin", "password": "secret" }
```
**Response**: Sets `admin_token` cookie.

#### `POST /api/admin/auth/logout`
Clears `admin_token` cookie.

### Gallery Management

#### `GET /api/admin/gallery`
List photos with filters.

**Query params**: `status` (approved|pending|rejected|reported|all), `page`, `limit`

#### `PATCH /api/admin/gallery`
Update photo status.

```json
{ "id": "uuid", "status": "approved|rejected" }
```

#### `DELETE /api/admin/gallery`
Delete a photo.

```json
{ "id": "uuid" }
```

#### `GET /api/admin/gallery/pending-count`
Get count of pending photos.

```json
{ "count": 5 }
```

### Backup

#### `GET /api/admin/backup`
List all backups.

#### `GET /api/admin/backup?action=download&filename=file.sql`
Download a specific backup.

#### `POST /api/admin/backup`
Create a new backup.

#### `POST /api/admin/backup` (multipart)
Restore from existing file or upload.

```
action=restore&filename=file.sql  (from list)
action=restore&file=<upload>      (from upload)
```

#### `DELETE /api/admin/backup?filename=file.sql`
Delete a backup.

### Settings

#### `GET /api/admin/settings`
Get all settings (values masked for API keys).

#### `PATCH /api/admin/settings`
Update a setting.

```json
{ "key": "ANTHROPIC_API_KEY", "value": "sk-ant-..." }
```

### Newsletter Management

#### `GET /api/admin/newsletter`
List newsletters.

#### `POST /api/admin/newsletter`
Create newsletter.

#### `GET /api/admin/newsletter/{id}`
Get newsletter details.

#### `PATCH /api/admin/newsletter/{id}`
Update newsletter.

#### `POST /api/admin/newsletter/{id}/send`
Send newsletter to all active subscribers.

#### `GET /api/admin/newsletter/{id}/preview`
Preview newsletter HTML.

### Users

#### `GET /api/admin/users`
List admin users.

#### `POST /api/admin/users`
Create admin user.

#### `DELETE /api/admin/users`
Delete admin user.

### Leads & Subscribers

#### `GET /api/admin/leads-list`
List all leads.

#### `DELETE /api/admin/leads`
Delete a lead.

#### `GET /api/admin/subscribers-list`
List all subscribers.

#### `DELETE /api/admin/subscribers`
Delete a subscriber.

### Peñas

#### `GET /api/admin/penyes`
List peñas with pagination and search.

**Query params**: `page`, `pageSize` (25|50|100), `search`, `region`, `enriched`

#### `POST /api/admin/penyes`
Trigger peñas scraping from source websites.

#### `POST /api/admin/penyes/chat`
RAG chat about peñas.

```json
{ "message": "What peñas are in London?" }
```

#### `GET /api/admin/penyes/rag`
RAG stats (total chunks, indexed peñas).

#### `POST /api/admin/penyes/rag`
Reindex all peñas.

---

## Automation Endpoints

Require either `admin_token` cookie OR `X-Cron-Secret` header.

#### `POST /api/competitions/refresh`
Refresh competition standings and predictions.

#### `POST /api/automations/sync-matches`
Sync upcoming matches from football APIs.

#### `POST /api/automations/auto-chronicle`
Generate match chronicle if Barça played yesterday.

#### `POST /api/automations/news-digest`
Generate and publish weekly news digest.

#### `POST /api/automations/newsletter-digest`
Generate and send weekly newsletter.

#### `POST /api/automations/match-chronicle`
Generate chronicle for a specific match.

```json
{ "matchData": { "opponent": "...", "score": "...", ... } }
```
