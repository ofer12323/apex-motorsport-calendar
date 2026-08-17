# Apex Motorsport Calendar

A production motorsport calendar that combines verified schedules from official series and governing-body sources. It keeps all timestamps in UTC, presents them in the viewer's timezone, and clearly distinguishes confirmed event dates from session times that have not yet been published.

## Features

- 378 verified 2026 events across 31 championship selections
- Formula, endurance, GT, motorcycles, rally, IndyCar, NASCAR and major standalone races
- Racing Today, Racing This Weekend and live countdowns for confirmed start times
- Month, timeline and list views with championship, category, country, circuit, date, duration and selected-series filters
- Search across events, series, aliases, circuits, cities and countries
- Dynamic event and circuit pages with official source attribution
- Automatic timezone detection, manual timezone selection and UTC-only session timestamps
- Persistent series, favorites, timezone and reminder preferences in local storage; D1 is available for server-side data caching
- Independent provider adapters, duplicate detection, validation, stale fallback caching and protected sync/status endpoints
- Installable PWA with responsive phone, tablet and desktop layouts

## Supported Championships

Formula 1, Formula 2, Formula 3, Formula E, IndyCar, Super Formula, FIA WEC, IMSA WeatherTech SportsCar Championship, European Le Mans Series, Asian Le Mans Series, Michelin Le Mans Cup, Nürburgring Langstrecken-Serie, Nürburgring 24 Hours, GT World Challenge Europe, America, Asia and Australia, Intercontinental GT Challenge, DTM, British GT, International GT Open, MotoGP, Moto2, Moto3, WorldSBK, WRC, FIA Rallycross, NASCAR Cup, NASCAR O'Reilly Auto Parts Series (formerly Xfinity), NASCAR Craftsman Truck Series and Dakar Rally.

Major events include the 24 Hours of Le Mans, Rolex 24 at Daytona, 12 Hours of Sebring, Petit Le Mans, Spa 24 Hours, Bathurst 12 Hour, Nürburgring 24 Hours, Indianapolis 500, Daytona 500 and Dakar Rally.

## Data Sources

| Series | Source |
| --- | --- |
| F1 | Current official Formula 1/FIA calendar; Jolpica Ergast-compatible API for historical seasons |
| F2, F3, Formula E, WEC, WRC, Rallycross, Dakar | FIA World Motor Sport Council sporting calendars |
| IndyCar | Official INDYCAR schedule and broadcast start-time release |
| Super Formula | Official SUPER FORMULA race calendar |
| IMSA | Official IMSA WeatherTech schedule |
| ELMS, Asian LMS, Michelin Le Mans Cup | Official ACO championship calendars |
| NLS | Official Nürburgring Langstrecken-Serie calendar |
| Nürburgring 24 Hours | Official ADAC 24h schedule |
| GT World Challenge regions, IGTC, British GT | Official SRO championship calendars |
| DTM | Official DTM calendar |
| International GT Open | Official GT Sport calendar |
| MotoGP, Moto2, Moto3 | Official MotoGP calendar and updates |
| WorldSBK | Official WorldSBK calendar |
| NASCAR national series | Official NASCAR schedule and start-time release |

The 2026 World Rallycross Championship was replaced by a six-round FIA European Rallycross Championship and a standalone FIA Rallycross World Cup; the app labels these accurately under the FIA Rallycross selection. The Asian Le Mans Series shows the official 2025/26 rounds occurring in calendar year 2026; the 2026/27 dates have not yet been published.

## Technology

- Next.js-compatible Vinext, React 19 and TypeScript
- Cloudflare Workers with optional D1 persistence
- Drizzle ORM with indexed event, session, source, sync and user-preference tables
- Browser `Intl.DateTimeFormat` for timezone-safe display
- Service worker and web app manifest for PWA installation

## Local Development

Requirements: Node.js `>=22.13.0` and npm.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open the URL printed by Vite. D1 is optional for read-only local use because the verified bundled schedule is the fallback.

## Environment Variables

```dotenv
ADMIN_TOKEN=replace-with-a-long-random-value
CRON_SECRET=replace-with-a-long-random-value
MOTORSPORT_API_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

`CRON_SECRET` protects `POST /api/sync`. `ADMIN_TOKEN` protects `/api/data-status`; both should be stored as encrypted Cloudflare secrets and are never shipped to browser code. Supabase variables are included only for teams that choose to replace D1; this deployment does not require them.

## Commands

```bash
npm run validate:data
npm run lint
npm run build
npm test
npm run db:generate
```

`validate:data` checks dates, IANA timezones, UTC session timestamps, source fields, duplicate keys and championship coverage.

## Synchronization

`GET /api/schedule?season=2026` loads providers independently with `Promise.allSettled`, validates and deduplicates the normalized result, then serves D1 cache or the bundled verified fallback. Cache freshness is one hour when an event is within seven days and 24 hours otherwise. A scheduler can call the protected endpoint:

```bash
curl -X POST https://your-host/api/sync \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"season":2026}'
```

The sync writes normalized championships, circuits, events, sessions, provider status and sync logs to D1. A provider failure does not remove events imported by another provider.

## Adding a Championship Provider

1. Add the championship and circuits to `lib/motorsport/catalog.ts`.
2. Implement `MotorsportDataProvider` from `lib/motorsport/types.ts`.
3. Normalize every timestamp to UTC and retain source name, URL and verification time.
4. Register the adapter in `lib/providers.ts`.
5. Run `npm run validate:data`, `npm run lint` and `npm test`.

Do not add date-only events with fabricated times. Leave `sessions` empty until the organizer publishes a timetable.

## Deployment

This repository is configured for Cloudflare Workers through `wrangler.jsonc` and the Cloudflare Vite plugin. In Cloudflare Workers Builds use:\n\n```text\nBuild command: npm run build\nDeploy command: npx wrangler deploy\nProduction branch: main\n```\n\nEvery push to `main` then creates a production deployment automatically. The verified bundled schedule and browser preferences work without a database. To enable D1 caching, create a D1 database, add a `DB` binding with its database ID to `wrangler.jsonc`, and apply `drizzle/0000_brief_pretty_boy.sql`.

## Admin and Security

- `/admin/data-status` displays provider health, imports, errors, next refresh and validation counts without exposing secrets.
- The admin status API requires the `ADMIN_TOKEN` bearer secret in production.
- Sync is disabled unless `CRON_SECRET` is configured and supplied.
- API inputs are bounded and validated; public schedule responses use server caching and security headers.
- Preferences remain local to the device until a dedicated authentication provider is configured.
