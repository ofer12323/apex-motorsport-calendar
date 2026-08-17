import { getSchedule } from "../../../lib/server/schedule-cache";

function isAllowed(request: Request) {
  if (process.env.NODE_ENV === "development") return true;
  const configured = process.env.ADMIN_TOKEN;
  return Boolean(configured) && request.headers.get("authorization") === `Bearer ${configured}`;
}

export async function GET(request: Request) {
  if (!isAllowed(request)) return Response.json({ error: "Not authorized" }, { status: 403 });
  try {
    const snapshot = await getSchedule(new Date().getUTCFullYear());
    return Response.json({
      generatedAt: snapshot.generatedAt,
      providers: snapshot.providers,
      validation: snapshot.validation,
      eventCount: snapshot.events.length,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ error: "Status is temporarily unavailable" }, { status: 503 });
  }
}
