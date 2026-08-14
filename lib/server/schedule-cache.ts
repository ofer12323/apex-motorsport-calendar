import { eq } from "drizzle-orm";
import {
  championships as championshipTable,
  circuits as circuitTable,
  dataSources,
  events as eventTable,
  scheduleCache,
  sessions as sessionTable,
  syncLogs,
} from "../../db/schema";
import { loadSchedule, refreshIntervalMs } from "../providers";
import type { ScheduleSnapshot } from "../motorsport/types";

async function database() {
  return (await import("../../db")).getDb();
}

export async function readCachedSchedule(season: number) {
  try {
    const db = await database();
    const [row] = await db.select().from(scheduleCache).where(eq(scheduleCache.season, season)).limit(1);
    if (!row) return null;
    const snapshot = JSON.parse(row.payload) as ScheduleSnapshot;
    return { snapshot, refreshedAt: row.refreshedAt };
  } catch {
    return null;
  }
}

export async function getSchedule(season: number, force = false) {
  const cached = await readCachedSchedule(season);
  if (!force && cached) {
    const age = Date.now() - Date.parse(cached.refreshedAt);
    if (age < refreshIntervalMs(cached.snapshot.events)) return cached.snapshot;
  }

  const snapshot = await loadSchedule(season);
  try {
    const db = await database();
    await db
      .insert(scheduleCache)
      .values({ season, payload: JSON.stringify(snapshot), refreshedAt: snapshot.generatedAt })
      .onConflictDoUpdate({ target: scheduleCache.season, set: { payload: JSON.stringify(snapshot), refreshedAt: snapshot.generatedAt } });
  } catch {
    // The bundled verified schedule remains available if D1 is not configured locally.
  }
  return snapshot;
}

async function insertChunks<T>(rows: T[], size: number, insert: (chunk: T[]) => Promise<unknown>) {
  for (let index = 0; index < rows.length; index += size) {
    await insert(rows.slice(index, index + size));
  }
}

export async function persistNormalizedSchedule(snapshot: ScheduleSnapshot) {
  const db = await database();
  for (const item of snapshot.championships) {
    await db.insert(championshipTable).values({
      id: item.id, name: item.name, category: item.category, providerId: item.providerId, officialUrl: item.officialUrl,
    }).onConflictDoUpdate({ target: championshipTable.id, set: { name: item.name, category: item.category, providerId: item.providerId, officialUrl: item.officialUrl, updatedAt: snapshot.generatedAt } });
  }
  for (const item of snapshot.circuits) {
    await db.insert(circuitTable).values({
      id: item.id, name: item.name, country: item.country, countryCode: item.countryCode, timezone: item.timezone,
    }).onConflictDoUpdate({ target: circuitTable.id, set: { name: item.name, country: item.country, countryCode: item.countryCode, timezone: item.timezone, updatedAt: snapshot.generatedAt } });
  }

  await db.delete(sessionTable);
  await db.delete(eventTable).where(eq(eventTable.season, snapshot.season));
  await insertChunks(snapshot.events, 40, async (chunk) => db.insert(eventTable).values(chunk.map((item) => ({
    id: item.id,
    championshipId: item.championshipId,
    circuitId: item.circuit.id,
    season: item.season,
    name: item.name,
    startDate: item.startDate,
    endDate: item.endDate,
    status: item.status,
    sourceUrl: item.sourceUrl,
    updatedAt: snapshot.generatedAt,
  }))));

  const sessions = snapshot.events.flatMap((item) => item.sessions.map((current) => ({
    id: current.id,
    eventId: item.id,
    name: current.name,
    type: current.type,
    startTime: current.startTime,
    endTime: current.endTime,
  })));
  await insertChunks(sessions, 50, async (chunk) => db.insert(sessionTable).values(chunk));

  for (const provider of snapshot.providers) {
    await db.insert(dataSources).values({
      id: provider.id,
      name: provider.name,
      sourceUrl: provider.sourceUrl,
      health: provider.health,
      lastSuccessfulSync: provider.lastSuccessfulSync,
      lastError: provider.lastError,
      updatedAt: snapshot.generatedAt,
    }).onConflictDoUpdate({ target: dataSources.id, set: {
      name: provider.name, sourceUrl: provider.sourceUrl, health: provider.health,
      lastSuccessfulSync: provider.lastSuccessfulSync, lastError: provider.lastError, updatedAt: snapshot.generatedAt,
    } });
    await db.insert(syncLogs).values({
      providerId: provider.id,
      status: provider.health,
      eventsImported: provider.eventCount,
      message: provider.message ?? provider.lastError,
      startedAt: snapshot.generatedAt,
      finishedAt: new Date().toISOString(),
    });
  }
}
