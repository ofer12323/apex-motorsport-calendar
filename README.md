# Apex Motorsport Calendar

A production motorsport calendar that combines verified schedules from official series and governing-body sources. It keeps all timestamps in UTC, presents them in the viewer's timezone, and labels unpublished session times as `TBA` instead of inventing data.

## Features

- 378 verified 2026 events across 31 championship selections
- Formula, endurance, GT, motorcycles, rally, IndyCar, NASCAR and major standalone races
- Racing Today, Racing This Weekend and live countdowns for confirmed start times
- Month, timeline and list views with championship, category, country, circuit, date, duration and selected-series filters
- Search across events, series, aliases, circuits, cities and countries
- Dynamic event and circuit pages with official source attribution
- Automatic timezone detection, manual timezone selection and UTC-only session timestamps
- Persistent series, favorites, timezone and reminder preferences in local storage and D1 for signed-in users
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
- Cloudflare Workers and D1 through OpenAI Sites
- Drizzle ORM with indexed event, session, source, sync and user-preference tables
- Browser `Intl.DateTimeFormat` for timezone-safe display
- Service worker and web app manifest for PWA installation

## Local Development

Requirements: Node.js `>=22.13.0`, npm and the standard Linux build tools used by the Sites scripts.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open the URL printed by Vite. D1 is optional for read-only local use because the verified bundled schedule is the fallback.

## Environment Variables

```dotenv
ADMIN_EMAILS=owner@example.com
CRON_SECRET=replace-with-a-long-random-value
MOTORSPORT_API_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

`CRON_SECRET` protects `POST /api/sync`. `ADMIN_EMAILS` optionally restricts `/admin/data-status` beyond the hosting platform's authenticated-user header. No secret is shipped to browser code. Supabase variables are included only for teams that choose to replace D1; this deployment does not require them.

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

This repository is configured for OpenAI Sites in `.openai/hosting.json`, with the production D1 binding named `DB`. Checkpointing through the Sites lifecycle applies migrations and publishes an HTTPS deployment. The same source can be adapted to another Cloudflare-compatible host by providing the D1 binding and Worker environment variables.

## Admin and Security

- `/admin/data-status` displays provider health, imports, errors, next refresh and validation counts without exposing secrets.
- The admin API requires an authenticated hosting user and honors `ADMIN_EMAILS`.
- Sync is disabled unless `CRON_SECRET` is configured and supplied.
- API inputs are bounded and validated; public schedule responses use server caching and security headers.
- Signed-in preferences are tied to the authenticated email header. Anonymous preferences remain local to the device.
