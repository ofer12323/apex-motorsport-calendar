import { getChampionship, getCircuit } from "../catalog";
import type { EventStatus, MotorsportEvent, MotorsportSession, SessionType } from "../types";

export const VERIFIED_AT = "2026-08-12T00:00:00Z";

const SOURCE_NAMES: Record<string, string> = {
  "f1-official": "Formula 1 / FIA official calendar",
  "fia-calendars": "FIA World Motor Sport Council calendar",
  "indycar-official": "INDYCAR official schedule",
  "super-formula-official": "SUPER FORMULA official calendar",
  "imsa-official": "IMSA official schedule",
  "aco-calendars": "ACO official championship calendar",
  "nls-official": "NLS official calendar",
  "n24-official": "ADAC 24h Nürburgring official schedule",
  "sro-official": "SRO Motorsports official calendar",
  "gt-open-official": "International GT Open official calendar",
  "dtm-official": "DTM official calendar",
  "motogp-official": "MotoGP official calendar",
  "worldsbk-official": "WorldSBK official calendar",
  "nascar-official": "NASCAR official schedule",
};

function statusFor(endDate: string, sessions: MotorsportSession[]): EventStatus {
  const now = Date.now();
  const active = sessions.find((session) => {
    const start = Date.parse(session.startTime);
    const end = Date.parse(session.endTime ?? session.startTime) + 2 * 60 * 60 * 1000;
    return now >= start && now <= end;
  });
  if (active) return "live";
  const end = /^\d{4}-\d{2}-\d{2}$/.test(endDate)
    ? Date.parse(`${endDate}T23:59:59Z`)
    : Date.parse(endDate);
  return end < now ? "completed" : "upcoming";
}

export function session(
  eventId: string,
  name: string,
  type: SessionType,
  startTime: string,
  endTime?: string,
): MotorsportSession {
  return {
    id: `${eventId}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`,
    name,
    type,
    startTime,
    endTime,
  };
}

export type EventInput = {
  championshipId: string;
  id: string;
  name: string;
  circuitId: string;
  startDate: string;
  endDate?: string;
  sessions?: MotorsportSession[];
  duration?: string;
  raceType?: string;
  officialUrl?: string;
  sourceUrl?: string;
  relatedChampionshipIds?: string[];
  status?: EventStatus;
};

export function event(input: EventInput): MotorsportEvent {
  const championship = getChampionship(input.championshipId);
  const endDate = input.endDate ?? input.startDate;
  const sessions = input.sessions ?? [];
  return {
    id: input.id,
    name: input.name,
    championshipId: championship.id,
    championshipName: championship.name,
    relatedChampionshipIds: input.relatedChampionshipIds,
    season: 2026,
    circuit: getCircuit(input.circuitId),
    startDate: input.startDate,
    endDate,
    timingPrecision: sessions.length ? "datetime" : "date",
    category: championship.category,
    status: input.status ?? statusFor(endDate, sessions),
    sessions,
    duration: input.duration,
    raceType: input.raceType,
    officialUrl: input.officialUrl ?? championship.officialUrl,
    source: SOURCE_NAMES[championship.providerId] ?? championship.providerId,
    sourceUrl: input.sourceUrl ?? championship.officialUrl,
    lastUpdated: VERIFIED_AT,
  };
}

export function easternToUtc(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const value = Date.UTC(year, month - 1, day, hour, minute);
  const localDay = Date.UTC(year, month - 1, day);
  const dstStart = Date.UTC(2026, 2, 8);
  const dstEnd = Date.UTC(2026, 10, 1);
  const offsetHours = localDay >= dstStart && localDay < dstEnd ? 4 : 5;
  return new Date(value + offsetHours * 60 * 60 * 1000).toISOString();
}
