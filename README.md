# Daylog — Personal Learning Analytics & Well-being Platform

> "Understand your patterns. Improve your learning."

Daylog is a local-first, privacy-by-default web application designed for university students with high academic ambitions. It bridges quantitative daily tracking (sleep, energy, mood, focus, academic workload, and independent study time) with qualitative journal reflections to produce contextual, explainable personal insights.

Every account is completely private: each user sees, modifies, exports, and deletes only their own entries, metrics, intentions, and weekly reviews.

---

## 1. Core Principles

1. **Self-awareness over self-judgment**
2. **Consistency over intensity**
3. **Evidence over assumptions**
4. **Sustainable learning over constant productivity**
5. **Privacy by default & per-user data isolation**

---

## 2. Technology Stack & Architecture

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS (custom calm, editorial aesthetic)
- **Database**: Turso (libSQL / SQLite in the cloud) via `@libsql/client/web` (HTTP-based, zero native binaries)
- **ORM**: Drizzle ORM 0.35.3
- **Authentication**: Built-in Node.js `crypto.scrypt` password hashing + database-backed session tokens (no external auth providers, no JWT secrets)
- **Validation**: Zod
- **Visualizations**: Recharts
- **Icons**: Lucide React
- **Testing**: Vitest

### Architecture Overview

```
Browser UI (Responsive Desktop / Tablet / Mobile)
   ↓
Edge Middleware (Fast Session-Cookie Routing)
   ↓
Next.js Server Components / Route Handlers (127.0.0.1)
   ↓ (Server-side Session Validation & User Scoping)
Application & Analytics Engine (Rule-based, Non-diagnostic)
   ↓
Drizzle ORM
   ↓
Turso (libSQL) cloud database / local SQLite file fallback
```

- **Authentication Architecture**:
  - **Zero native dependencies**: Uses Node's built-in `crypto.scrypt` (random 16-byte salt, 64-byte key) with constant-time `crypto.timingSafeEqual`.
  - **Database-backed sessions**: 32-byte cryptographically random tokens (`base64url`). The database stores only the SHA-256 hex hash of the token.
  - **HttpOnly Cookies**: Placed in an `httpOnly`, `sameSite: "lax"`, `path: "/"`, 30-day cookie (`secure` in production).
  - **Edge Middleware**: Runs at the edge for instant redirection (missing cookie → `/login`), while deep verification happens server-side on every page and API route using `getCurrentUser()`.
  - **Same-Origin Protection**: All state-changing POST endpoints verify that the `Origin` header matches the `Host`.
- **Zero Third-Party AI APIs**: Weekly synthesis and insights are computed via deterministic, explainable algorithms without transmitting reflections to external cloud or LLM services.

---

## 3. Database Schema & Data Model

Every data record is strictly scoped to `user_id`.

### `users`
- `id` (INTEGER, PK, auto-increment)
- `email` (TEXT NOT NULL UNIQUE, stored trimmed and lowercase)
- `password_hash` (TEXT NOT NULL, format `scrypt$<saltB64>$<hashB64>`)
- `created_at` (TEXT, ISO timestamp)

### `sessions`
- `id` (TEXT, PK, SHA-256 hex digest of the raw session token)
- `user_id` (INTEGER NOT NULL, FK -> `users.id` ON DELETE CASCADE)
- `expires_at` (TEXT NOT NULL, ISO timestamp, 30 days)
- `created_at` (TEXT, ISO timestamp)

### `journal_entries`
- `id` (INTEGER, PK, auto-increment)
- `user_id` (INTEGER NOT NULL, FK -> `users.id` ON DELETE CASCADE)
- `entry_date` (TEXT NOT NULL, ISO format `YYYY-MM-DD`)
- `gratitude` (TEXT, nullable)
- `went_well` (TEXT, nullable)
- `challenge` (TEXT, nullable)
- `free_text` (TEXT, nullable)
- `created_at` (TEXT, ISO timestamp)
- `updated_at` (TEXT, ISO timestamp)
- *Constraint*: `UNIQUE(user_id, entry_date)`

### `daily_checkins`
- `id` (INTEGER, PK, auto-increment)
- `user_id` (INTEGER NOT NULL, FK -> `users.id` ON DELETE CASCADE)
- `entry_date` (TEXT NOT NULL)
- `sleep_hours` (REAL, range 0–24)
- `sleep_quality` (INTEGER, scale 1–5)
- `energy` (INTEGER, scale 1–5)
- `mood` (INTEGER, scale 1–5)
- `focus` (INTEGER, scale 1–5)
- `workload` (INTEGER, scale 1–5)
- `study_minutes` (INTEGER, >= 0)
- `created_at` (TEXT, ISO timestamp)
- `updated_at` (TEXT, ISO timestamp)
- *Constraints*: `UNIQUE(user_id, entry_date)`, `FOREIGN KEY (user_id, entry_date) REFERENCES journal_entries(user_id, entry_date) ON DELETE CASCADE`

### `daily_intentions`
- `id` (INTEGER, PK, auto-increment)
- `user_id` (INTEGER NOT NULL, FK -> `users.id` ON DELETE CASCADE)
- `target_date` (TEXT NOT NULL, ISO format `YYYY-MM-DD`)
- `learning_priority` (TEXT, required)
- `recovery_action` (TEXT, required)
- `created_at` (TEXT, ISO timestamp)
- `updated_at` (TEXT, ISO timestamp)
- *Constraint*: `UNIQUE(user_id, target_date)`

### `weekly_reviews`
- `id` (INTEGER, PK, auto-increment)
- `user_id` (INTEGER NOT NULL, FK -> `users.id` ON DELETE CASCADE)
- `start_date` (TEXT NOT NULL, YYYY-MM-DD)
- `end_date` (TEXT NOT NULL, YYYY-MM-DD)
- `reflection` (TEXT, required)
- `created_at` (TEXT, ISO timestamp)
- `updated_at` (TEXT, ISO timestamp)
- *Constraint*: `UNIQUE(user_id, start_date, end_date)`

*Referential Integrity Note*: Saving a daily check-in automatically creates a corresponding journal record for the user if one does not already exist, ensuring foreign key consistency and enabling atomic upserts.

---

## 4. Key Application Features

1. **Private Authentication (`/login`, `/register`)**:
   - Clean, editorial form styling with live validation and error handling.
   - Auto-login upon registration.
   - App shell displays current user's email and a one-click logout action.

2. **Dashboard (`/`)**:
   - Time-based greeting ("Good morning", "Good afternoon", "Good evening").
   - Today's date and real-time check-in/journal completion status for the signed-in account.
   - Active learning priority and restorative recovery action.
   - Descriptive metric averages and trend chart for the current week.

3. **Daily Journal & Check-in (`/journal`)**:
   - **Quantitative Check-in**: Sleep duration & quality, energy, mood, focus, academic workload, and independent study minutes.
   - **Reflective Journal**: Four prompts (Gratitude, What Went Well, Challenges & Obstacles, Free Reflection).
   - **Daily Intentions**: Explicitly align one primary academic priority and one non-academic recovery action.

4. **History & Calendar (`/history`)**:
   - Monthly calendar grid with visual status indicators for check-in and journal completion.
   - Side inspector drawer displaying complete quantitative metrics, reflections, and intentions for any selected day.
   - Full-text search through your own historical journal entries.

5. **Integrated Weekly Review (`/review`)**:
   - Bridges quantitative analytics with qualitative reflections.
   - Recharts trend graphs for Energy/Mood/Focus, Sleep, and Study Duration vs. Workload.
   - **Contextual Observations & Actionable Recommendations**: Rule-based correlations connecting quantitative patterns with journal entries.
   - Personal Weekly Synthesis textarea.

6. **Settings & Privacy (`/settings`)**:
   - Data export in **JSON** (full structured schema) and **CSV** (spreadsheet format) for the current user.
   - Permanent account data deletion requiring typed confirmation (`DELETE_ALL_DATA`) which clears all entries while keeping the account active.
   - Optional 7-day development demo dataset loader scoped exclusively to the current user.

---

## 5. Commands to Install, Run & Test

```bash
# Navigate to the project directory
cd daylog

# Install dependencies
npm install

# Run automated Vitest test suite (isolated in-memory/file test database)
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

# Dry run table reset (prints tables to be dropped)
npm run db:reset-schema

# Execute schema reset on the configured database
npm run db:reset-schema -- --yes
```

---

## 6. Deploying to Vercel with Turso

1. Create the Turso database and copy its URL and an auth token:
   ```bash
   turso db show <name> --url
   turso db tokens create <name>
   ```
2. In Vercel → Project → Settings → Environment Variables, add:
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
   (No additional secret environment variables are needed: sessions are stored directly in Turso).
3. In Vercel → Settings → Build and Deployment, verify **Node.js Version** is set to `22.x` (enforced by `engines` in `package.json`).
4. **Existing Database Schema Migration**:
   If upgrading an existing Turso database that previously ran the single-user schema:
   ```bash
   # Run once to recreate tables with user_id foreign keys and composite constraints
   npm run db:reset-schema -- --yes
   ```
5. Deploy to Vercel. All tables are created automatically on the first request if they do not exist.
