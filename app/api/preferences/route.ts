import { eq } from "drizzle-orm";
import { favoriteEvents, notificationSettings, users, userSeries } from "../../../db/schema";

async function database() {
  return (await import("../../../db")).getDb();
}

function emailFrom(request: Request) {
  return request.headers.get("oai-authenticated-user-email")?.trim().toLowerCase() ?? null;
}

function validTimezone(value: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

async function getOrCreateUser(email: string) {
  const db = await database();
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) return existing;
  const [created] = await db.insert(users).values({ email }).returning();
  return created;
}

export async function GET(request: Request) {
  const email = emailFrom(request);
  if (!email) return Response.json({ signedIn: false }, { headers: { "Cache-Control": "private, no-store" } });
  try {
    const user = await getOrCreateUser(email);
    const db = await database();
    const [selected, favorites, reminders] = await Promise.all([
      db.select().from(userSeries).where(eq(userSeries.userId, user.id)),
      db.select().from(favoriteEvents).where(eq(favoriteEvents.userId, user.id)),
      db.select().from(notificationSettings).where(eq(notificationSettings.userId, user.id)),
    ]);
    return Response.json({
      signedIn: true,
      selected: selected.map((item) => item.championshipId),
      favorites: favorites.map((item) => item.eventId),
      reminders: reminders.filter((item) => item.enabled).map((item) => item.reminder),
      timezone: user.timezone,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ error: "Preferences are temporarily unavailable" }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  const email = emailFrom(request);
  if (!email) return Response.json({ signedIn: false, saved: false }, { headers: { "Cache-Control": "private, no-store" } });
  try {
    const payload = await request.json() as {
      selected?: unknown;
      favorites?: unknown;
      reminders?: unknown;
      timezone?: unknown;
    };
    const stringList = (value: unknown) => Array.isArray(value)
      ? [...new Set(value.filter((item): item is string => typeof item === "string" && item.length <= 120))].slice(0, 150)
      : [];
    const selected = stringList(payload.selected);
    const favorites = stringList(payload.favorites);
    const reminders = stringList(payload.reminders);
    const timezone = typeof payload.timezone === "string" && validTimezone(payload.timezone) ? payload.timezone : null;
    if (!timezone) return Response.json({ error: "Invalid timezone" }, { status: 400 });

    const db = await database();
    const user = await getOrCreateUser(email);
    await db.update(users).set({ timezone, updatedAt: new Date().toISOString() }).where(eq(users.id, user.id));
    await Promise.all([
      db.delete(userSeries).where(eq(userSeries.userId, user.id)),
      db.delete(favoriteEvents).where(eq(favoriteEvents.userId, user.id)),
      db.delete(notificationSettings).where(eq(notificationSettings.userId, user.id)),
    ]);
    if (selected.length) await db.insert(userSeries).values(selected.map((championshipId) => ({ userId: user.id, championshipId })));
    if (favorites.length) await db.insert(favoriteEvents).values(favorites.map((eventId) => ({ userId: user.id, eventId })));
    if (reminders.length) await db.insert(notificationSettings).values(reminders.map((reminder) => ({ userId: user.id, reminder, enabled: true })));
    return Response.json({ saved: true });
  } catch {
    return Response.json({ error: "Preferences could not be saved" }, { status: 503 });
  }
}
