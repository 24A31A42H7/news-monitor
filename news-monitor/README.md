# Intelligent News Monitoring & Report Generation System

A MERN-stack platform that aggregates industry news (Steel, Coal, Iron Ore, Mining, and related
sectors) from multiple providers, supports multilingual search (English/Telugu/Hindi), generates
PDF reports, and gives admins a usage/analytics dashboard.

## What's fully implemented

- **Auth**: Google Sign-In only (ID-token verification), JWT access + refresh tokens (httpOnly
  refresh cookie), auto-promotion to `admin` role via `ADMIN_EMAILS`, account activate/deactivate.
- **All 14 MongoDB collections** from the spec, with indexes for dedup, search, and analytics.
- **News aggregation**: 7 provider adapters (NewsAPI, GNews, NewsData.io, Mediastack, Currents,
  Bing News, Event Registry) queried in parallel via `Promise.allSettled` — one provider failing
  never blocks the others. Configurable fallback/priority order stored in `ApiConfiguration` and
  editable from the admin panel. Dedup by URL hash + normalized-title hash. Relevance scoring
  favors trusted publishers and freshness.
- **Search**: MongoDB text index + regex fallback, keyword expansion table, a small cross-language
  keyword map (Telugu/Hindi → English) so cross-language search actually returns results, full
  filter set (language/edition/publisher/country/tags/categories/date range), explicit Search
  button (no live-as-you-type result flashing), search history logging.
- **Tags & categories**: create/edit/remove custom tags, default tag seed list, trending/usage
  counters, admin flagging.
- **PDF generation**: PDFKit-based report with cover, table of contents, executive summary,
  per-article pages, footer, page numbers, and watermark.
- **Admin analytics**: user/search/news/report/system endpoints backing real charts (Recharts) —
  top queries, search trend, articles by source/language, API provider health table.
- **Cron jobs**: daily 6 AM news fetch across default industry queries, daily 2 AM retention
  cleanup (3-year default), midnight quota reset.
- **Docker Compose**: Mongo + Redis + backend + frontend (nginx), ready to `docker compose up`.

## What's intentionally left as a starting point, not finished

Being upfront rather than pretending otherwise — a handful of things are real, working, but
simpler than a fully hardened enterprise deployment would want:

- **BullMQ** isn't wired in — cron jobs run in-process via `node-cron`. Fine for one server;
  swap in BullMQ + Redis workers if you need horizontal scaling of the fetch jobs.
- **Cloudinary/S3** upload code isn't included — reports currently save to local disk
  (`backend/uploads/reports`), served statically. The env vars are there as placeholders;
  wiring the actual SDK calls is a self-contained follow-up.
- **Storage-usage stats** in the admin system dashboard are estimated from article count, not a
  live `db.stats()` call — trivial to swap in.
- **Search relevance** uses a text index + a small hand-built synonym/cross-language table rather
  than a real NLP/embedding pipeline. It works for the seeded industry vocabulary; expanding it to
  arbitrary queries would mean plugging in a translation or embeddings API.
- **Frontend has no automated tests** and hasn't been run through `npm install` in this
  environment (no network access here) — I syntax-checked every backend file and manually
  cross-checked every frontend import, but you should run `npm install && npm run dev` locally as
  the first step to catch anything version-specific.

None of this is hidden inside the code — every shortcut above is called out in a comment at the
relevant spot (e.g. `services/pdfGenerator.js`, `jobs/cron.js`).

## Project structure

```
news-monitor/
├── backend/
│   ├── config/          # db.js, jwt.js
│   ├── models/           # 14 Mongoose schemas
│   ├── middleware/        # auth.js (JWT verify + RBAC)
│   ├── routes/            # auth, articles, search, tags, reports, admin
│   ├── services/          # newsAggregator.js, pdfGenerator.js
│   ├── jobs/cron.js       # scheduled fetch + retention cleanup
│   ├── scripts/seed.js    # seeds default categories/tags/provider configs
│   ├── server.js
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/         # Login, Dashboard, Search, Bookmarks, Reports, Tags, Admin*
│   │   ├── components/    # Layout, ArticleCard, GeneratePdfButton
│   │   ├── redux/          # store + auth/filters slices
│   │   └── api/client.js  # axios with auto token refresh
│   └── .env.example
└── docker-compose.yml
```

## Setup

### 1. Prerequisites
- Node.js 20+
- MongoDB (local or Atlas)
- A Google Cloud project with an OAuth 2.0 Client ID (Web application type)

### 2. Backend
```bash
cd backend
cp .env.example .env
# Edit .env: add MONGODB_URI, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, JWT secrets,
# ADMIN_EMAILS, and whichever news provider API keys you have.
npm install
npm run seed     # populates default categories, tags, and provider priority order
npm run dev
```

### 3. Frontend
```bash
cd frontend
cp .env.example .env
# Edit .env: set VITE_API_BASE_URL and VITE_GOOGLE_CLIENT_ID (same client ID as backend)
npm install
npm run dev
```
Visit `http://localhost:5173`.

### 4. Docker (alternative to steps 2–3)
```bash
# fill in backend/.env first
docker compose up --build
```

## Google OAuth setup notes

1. In Google Cloud Console → APIs & Services → Credentials, create an **OAuth 2.0 Client ID**
   (Web application).
2. Authorized JavaScript origins: `http://localhost:5173` (and your production domain later).
3. Copy the Client ID into both `backend/.env` (`GOOGLE_CLIENT_ID`) and `frontend/.env`
   (`VITE_GOOGLE_CLIENT_ID`).
4. Add your own email to `ADMIN_EMAILS` in `backend/.env` before your first login so your account
   is created with the `admin` role automatically.

## Manual work remaining (as scoped)

1. Add news provider API keys to `backend/.env`
2. Add Google OAuth credentials to `backend/.env` and `frontend/.env`
3. `npm install` in both `backend/` and `frontend/`
4. `npm run seed` once, then `npm run dev` / `docker compose up`

Everything else — auth flow, models, aggregation, search, filters, tags, PDF generation, admin
analytics — is generated and wired end-to-end.
Deployment in render
Backend:https://news-monitor-backend.onrender.com/
Frontend:https://news-monitor-frontend.onrender.com/
