# Big Mouth 🍜

Group restaurant recommender for Korea. Stop arguing about lunch — get a smart suggestion based on where you are, what you like, and what you've already eaten this week.

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind v4**
- **Clerk** for auth (per-user accounts)
- **Neon Postgres** + **Drizzle ORM** for users / preferences / visit history
- **next-intl** for EN/KO i18n (`/en`, `/ko`)
- **Naver Local Search API** for restaurant data (with a built-in mock so you can develop without keys)
- **Naver Maps JS API** for the map view

## How recommendations work (no AI)

1. Geolocation gives `(lat, lng)` and a search radius.
2. The server queries Naver Local Search for ~30 nearby places.
3. Candidates are scored:
   - `+3` if the cuisine matches your favorites
   - `−5` if the cuisine is in your dislikes
   - `−2 × n` per same-category visit in the last 3 days (variety)
   - dietary filters drop matches (`no_pork`, `vegetarian`, …)
   - small random jitter
4. Places you've visited within your history window (default 7 days) are excluded entirely.
5. Top 10 are shuffled and returned, so the same query doesn't always pick #1.

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Provision Vercel-managed resources

```bash
vercel link              # link this folder to a Vercel project
vercel integration add neon
vercel integration add clerk
vercel env pull .env.local --yes
```

This auto-populates `DATABASE_URL`, `CLERK_SECRET_KEY`, and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`.

### 3. Get Naver API keys

The app runs against a mock dataset when these are missing — you can skip this for a first dev pass.

- **Local Search**: register at <https://developers.naver.com/apps/#/register> → enable "검색". Copy the Client ID and Secret into `.env.local` as `NAVER_SEARCH_CLIENT_ID` / `NAVER_SEARCH_CLIENT_SECRET`.
- **Maps JS**: register at <https://console.ncloud.com> → AI·NAVER API → Maps → Application. Add `localhost` (and your deployment domain). Put the Client ID into `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID`.

See `.env.example` for the full list.

### 4. Initialize the database

```bash
pnpm db:push        # creates users / preferences / visits tables in Neon
```

### 5. Run

```bash
pnpm dev
```

Open <http://localhost:3000>.

## Project layout

```
src/
  app/
    [locale]/          # locale-aware pages (en, ko)
      page.tsx         # home: location + filters
      recommend/       # ranked results + map
      history/         # past visits
      preferences/     # favorites / dislikes / dietary
      sign-in / sign-up
    api/
      recommend/       # POST → scored list
      visits/          # POST → record a visit
      preferences/     # PUT  → save prefs
  db/                  # Drizzle schema + lazy getDb()
  i18n/                # next-intl routing + request config
  lib/
    naver.ts           # Local Search wrapper (mock fallback)
    recommender.ts     # pure-rule scoring
    user.ts            # Clerk → DB user sync
  components/          # UI
  proxy.ts             # Next.js 16 proxy (Clerk + i18n)
messages/
  en.json / ko.json
drizzle.config.ts
```

## Scripts

- `pnpm dev` — start the dev server
- `pnpm build` / `pnpm start` — production build
- `pnpm typecheck` — `tsc --noEmit`
- `pnpm lint` — ESLint
- `pnpm db:generate` — generate SQL migrations from the schema
- `pnpm db:push` — push schema directly to Neon (good for dev)
- `pnpm db:studio` — Drizzle Studio (browse data)

## Deploy

Push to GitHub and import on Vercel, or `vercel --prod`. Vercel-managed Neon + Clerk inject env vars automatically; you'll only need to add the two Naver vars in the Vercel dashboard.
