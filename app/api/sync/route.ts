import { getSchedule, persistNormalizedSchedule } from "../../../lib/server/schedule-cache";

function authorized(request: Request) {
  const configured = process.env.CRON_SECRET;
  if (!configured) return false;
  return request.headers.get("authorization") === `Bearer ${configured}`;
}

export async function POST(request: Request) {
  if (!authorized(request)) return Response.json({ error: "Not found" }, { status: 404 });
  try {
    const payload = await request.json().catch(() => ({})) as { season?: number };
    const season = Number.isInteger(payload.season) ? payload.season! : new Date().getUTCFullYear();
    const snapshot = await getSchedule(season, true);
    await persistNormalizedSchedule(snapshot);
    return Response.json({
      ok: snapshot.validation.valid,
      season,
      events: snapshot.events.length,
      providers: snapshot.providers.length,
      validation: snapshot.validation,
    });
  } catch {
    return Response.json({ error: "Synchronization failed; cached data remains active" }, { status: 500 });
  }
}
