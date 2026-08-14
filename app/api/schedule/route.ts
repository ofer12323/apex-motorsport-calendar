import { getSchedule } from "../../../lib/server/schedule-cache";

function parseSeason(request: Request) {
  const value = new URL(request.url).searchParams.get("season");
  const season = value ? Number(value) : new Date().getUTCFullYear();
  return Number.isInteger(season) && season >= 1950 && season <= 2100 ? season : null;
}

export async function GET(request: Request) {
  const season = parseSeason(request);
  if (!season) return Response.json({ error: "Invalid season" }, { status: 400 });

  try {
    const snapshot = await getSchedule(season);
    return Response.json(snapshot, {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return Response.json({ error: "Schedule data is temporarily unavailable" }, { status: 503 });
  }
}
