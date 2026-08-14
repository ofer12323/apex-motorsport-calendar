import { championships, circuits as normalizedCircuits } from "./motorsport/catalog";
import { verifiedEvents2026 } from "./motorsport/schedules/2026";
import type { MotorsportEvent } from "./motorsport/types";

export type Series = {
  id: string;
  name: string;
  short: string;
  category: string;
  color: string;
  races: number;
  officialUrl: string;
  providerId: string;
};

export type Circuit = {
  id: string;
  name: string;
  city?: string;
  country: string;
  countryCode: string;
  flag: string;
  length?: number;
  corners?: number;
  tz: string;
};

export type Session = {
  id: string;
  name: string;
  type: string;
  at: string;
  end?: string;
};

export type Race = {
  id: string;
  name: string;
  series: string;
  relatedSeries: string[];
  circuit: string;
  start: string;
  eventStart: string;
  end: string;
  season: number;
  timingPrecision: "date" | "datetime";
  duration: string;
  type: string;
  status: "UPCOMING" | "LIVE" | "COMPLETED" | "POSTPONED" | "CANCELLED";
  sessions: Session[];
  officialUrl?: string;
  source: string;
  sourceUrl: string;
  lastUpdated: string;
};

const REGIONAL_INDICATORS: Record<string, string> = {
  AE: "🇦🇪", AT: "🇦🇹", AU: "🇦🇺", AZ: "🇦🇿", BE: "🇧🇪", BH: "🇧🇭",
  BR: "🇧🇷", CA: "🇨🇦", CL: "🇨🇱", CN: "🇨🇳", CZ: "🇨🇿", DE: "🇩🇪",
  EE: "🇪🇪", ES: "🇪🇸", FI: "🇫🇮", FR: "🇫🇷", GB: "🇬🇧", GR: "🇬🇷",
  HR: "🇭🇷", HU: "🇭🇺", ID: "🇮🇩", IE: "🇮🇪", IT: "🇮🇹", JP: "🇯🇵",
  KE: "🇰🇪", LV: "🇱🇻", MC: "🇲🇨", MX: "🇲🇽", MY: "🇲🇾", NL: "🇳🇱",
  PT: "🇵🇹", PY: "🇵🇾", QA: "🇶🇦", SA: "🇸🇦", SE: "🇸🇪", SG: "🇸🇬",
  TH: "🇹🇭", US: "🇺🇸",
};

export const circuits: Circuit[] = normalizedCircuits.map((item) => ({
  id: item.id,
  name: item.name,
  city: item.city,
  country: item.country,
  countryCode: item.countryCode,
  flag: REGIONAL_INDICATORS[item.countryCode] ?? "",
  length: item.lengthKm,
  corners: item.corners,
  tz: item.timezone,
}));

function primaryStart(item: MotorsportEvent) {
  return item.sessions.find((session) => session.type === "race")?.startTime ?? item.endDate;
}

export function toRace(item: MotorsportEvent): Race {
  return {
    id: item.id,
    name: item.name,
    series: item.championshipId,
    relatedSeries: item.relatedChampionshipIds ?? [],
    circuit: item.circuit.id,
    start: primaryStart(item),
    eventStart: item.startDate,
    end: item.endDate,
    season: item.season,
    timingPrecision: item.timingPrecision,
    duration: item.duration ?? "Schedule confirmed",
    type: item.raceType ?? item.category,
    status: item.status.toUpperCase() as Race["status"],
    sessions: item.sessions.map((current) => ({
      id: current.id,
      name: current.name,
      type: current.type.toUpperCase(),
      at: current.startTime,
      end: current.endTime,
    })),
    officialUrl: item.officialUrl,
    source: item.source,
    sourceUrl: item.sourceUrl,
    lastUpdated: item.lastUpdated,
  };
}

export const races: Race[] = verifiedEvents2026.map(toRace).sort(
  (a, b) => eventSortTime(a) - eventSortTime(b),
);

export const series: Series[] = championships.map((item) => ({
  id: item.id,
  name: item.name,
  short: item.shortName,
  category: item.category,
  color: item.color,
  races: races.filter((race) => eventMatchesSeries(race, item.id)).length,
  officialUrl: item.officialUrl,
  providerId: item.providerId,
}));

export function isDateOnly(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function eventSortTime(race: Race) {
  return Date.parse(isDateOnly(race.start) ? `${race.start}T12:00:00Z` : race.start);
}

export function eventMatchesSeries(race: Race, seriesId: string) {
  return race.series === seriesId || race.relatedSeries.includes(seriesId);
}

export const bySeries = (id: string) => series.find((item) => item.id === id)!;
export const byCircuit = (id: string) => circuits.find((item) => item.id === id)!;
