# Daylog — Personal Learning Analytics & Well-being Platform

> "Understand your patterns. Improve your learning."

Daylog is a local-first, privacy-by-default web application designed for university students with high academic ambitions. It bridges quantitative daily tracking (sleep, energy, mood, focus, academic workload, and independent study time) with qualitative journal reflections to produce contextual, explainable personal insights.

---

## 1. Core Principles

1. **Self-awareness over self-judgment**
2. **Consistency over intensity**
3. **Evidence over assumptions**
4. **Sustainable learning over constant productivity**
5. **Privacy by default**

---

## 2. Technology Stack & Architecture

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS (custom calm, editorial aesthetic)
- **Database**: Turso (libSQL / SQLite in the cloud) via `@libsql/client`
- **ORM**: Drizzle ORM
- **Validation**: Zod
- **Visualizations**: Recharts
- **Icons**: Lucide React
- **Testing**: Vitest

### Architecture Overview

```
Browser UI (Responsive Desktop / Tablet / Mobile)
   ↓
Next.js Server Components / Route Handlers (127.0.0.1)
   ↓
Application & Analytics Engine (Rule-based, Non-diagnostic)
   ↓
Drizzle ORM
   ↓
Turso (libSQL) cloud database
```

- **Storage**: All records live in your own Turso database (configured via `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN`). Without those variables, local development falls back to `./data/daylog.db`.
- **Zero Third-Party AI APIs**: Weekly synthesis and insights are computed via deterministic, explainable algorithms without transmitting reflections to external cloud or LLM services.
- **No User Tracking**: Bound to `127.0.0.1` by default; no cookies, telemetry, or remote dependencies.

---

## 3. Database Schema

### `journal_entries`
- `id` (INTEGER, PK, auto-increment)
- `entry_date` (TEXT, UNIQUE, ISO format `YYYY-MM-DD`)
- `gratitude` (TEXT, nullable)
- `went_well` (TEXT, nullable)
- `challenge` (TEXT, nullable)
- `free_text` (TEXT, nullable)
- `created_at` (TEXT, ISO timestamp)
- `updated_at` (TEXT, ISO timestamp)

### `daily_checkins`
- `id` (INTEGER, PK, auto-increment)
- `entry_date` (TEXT, UNIQUE, FK -> `journal_entries.entry_date` ON DELETE CASCADE)
- `sleep_hours` (REAL, range 0–24)
- `sleep_quality` (INTEGER, scale 1–5)
- `energy` (INTEGER, scale 1–5)
- `mood` (INTEGER, scale 1–5)
- `focus` (INTEGER, scale 1–5)
- `workload` (INTEGER, scale 1–5)
- `study_minutes` (INTEGER, >= 0)
- `created_at` (TEXT, ISO timestamp)
- `updated_at` (TEXT, ISO timestamp)

### `daily_intentions`
- `id` (INTEGER, PK, auto-increment)
- `target_date` (TEXT, UNIQUE, ISO format `YYYY-MM-DD`)
- `learning_priority` (TEXT, required)
- `recovery_action` (TEXT, required)
- `created_at` (TEXT, ISO timestamp)
- `updated_at` (TEXT, ISO timestamp)

*Referential Integrity Note*: Saving a daily check-in automatically creates a corresponding journal record if one does not already exist, ensuring foreign key consistency and enabling seamless upserts for the same date.

---

## 4. Key Application Features

1. **Dashboard (`/`)**:
   - Time-based greeting ("Good morning", "Good afternoon", "Good evening").
   - Today's date and real-time check-in/journal completion status.
   - Active learning priority and today's restorative recovery action.
   - Descriptive metric averages and trend chart for the current week.
   - Quick shortcut to open today's journal.

2. **Daily Journal & Check-in (`/journal`)**:
   - **Quantitative Check-in**: Sleep duration & quality, energy, mood, focus, academic workload, and independent study minutes.
   - **Reflective Journal**: Four prompts (Gratitude, What Went Well, Challenges & Obstacles, Free Reflection). Supports partial saves; all prompts are optional.
   - **Daily Intentions**: Explicitly align one primary academic priority and one non-academic recovery action for any date.
   - Smooth date navigation with automatic date upserting.

3. **History & Calendar (`/history`)**:
   - Monthly calendar grid with visual status indicators for check-in and journal completion.
   - Month-to-month navigation.
   - Side inspector drawer displaying complete quantitative metrics, reflections, and intentions for any selected day.
   - Full-text search through historical journal entries.

4. **Integrated Weekly Review (`/review`)**:
   - Bridges quantitative analytics with qualitative reflections.
   - Weekly numerical summary & averages.
   - Recharts trend graphs for Energy/Mood/Focus, Sleep, and Study Duration vs. Workload.
   - **Contextual Observations**: Deterministic, rule-based correlations connecting quantitative patterns (e.g. above-average sleep days) with relevant journal excerpts from those exact dates.
   - **Actionable Recommendations**: Non-judgmental, transparent recommendations displaying the exact trigger conditions (e.g. 2+ days with energy <= 2).
   - **Sufficient Data Guard**: Requires at least 3 recorded days; presents a calm empty state if data is insufficient.
   - Personal Weekly Synthesis textarea.

5. **Settings & Privacy (`/settings`)**:
   - Data export in **JSON** (full structured schema) and **CSV** (spreadsheet format).
   - Permanent data deletion requiring explicit typed confirmation (`DELETE_ALL_DATA`).
   - Database backup instructions and paths.
   - Optional 7-day development demo dataset loader.

---

## 5. Commands to Install, Run & Test

```bash
# Navigate to the project directory
cd daylog

# Install dependencies (if not already installed)
npm install

# Run automated Vitest test suite
npm test

# Run TypeScript type check
npx tsc --noEmit

# Build production bundle
npm run build

# Start local server (bound to 127.0.0.1:3000)
npm run start

# Alternatively, start development server with Hot Module Reloading
npm run dev

# Export a JSON backup of the configured database
npm run db:backup
```

---

## 6. Deploying to Vercel with Turso

1. Create the Turso database and copy its URL and an auth token (`turso db show <name> --url`, `turso db tokens create <name>`).
2. In Vercel → Project → Settings → Environment Variables add `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` (Production, Preview and Development).
3. In Vercel → Settings → Build and Deployment, set **Node.js Version** to `22.x` (also enforced by `engines` in `package.json`).
4. Redeploy. Tables are created automatically on first request.

### Migrating existing local data to Turso (one time)

```bash
cp .env.example .env.local      # then fill in your Turso URL and token
npm install
npm run db:migrate-to-turso     # copies ./data/daylog.db into Turso and verifies row counts
```

### Backup

```bash
npm run db:backup               # writes data/backups/daylog-backup-<timestamp>.json
```

---

## 7. Known Limitations & Future Roadmap

- **Single User**: Tailored for one student. There is no login, so anyone with the deployed URL can read and edit the data; protect the deployment (e.g. Vercel Deployment Protection) before storing private journals.
- **Offline Attachment Support**: Rich media (images or audio notes) are intentionally omitted in this text/metrics MVP.
- **Rolling Window Defaults**: Weekly review defaults to the calendar week (Monday–Sunday) with one-click toggles for past 7-day rolling windows.
# daylog
