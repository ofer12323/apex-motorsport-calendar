import { championships, circuits, getChampionship, getCircuit } from "./motorsport/catalog";
import { verifiedEvents2026 } from "./motorsport/schedules/2026";
import { dedupeEvents, validateEvents } from "./motorsport/validation";
import type { MotorsportDataProvider, MotorsportEvent, ProviderStatus, ScheduleSnapshot } from "./motorsport/types";

const PROVIDER_NAMES: Record<string, string> = {
  "f1-official": "Formula 1 official calendar",
  "fia-calendars": "FIA sporting calendars",
  "indycar-official": "INDYCAR official schedule",
  "super-formula-official": "SUPER FORMULA official calendar",
  "imsa-official": "IMSA official schedule",
  "aco-calendars": "ACO calendars",
  "nls-official": "NLS official calendar",
  "n24-official": "ADAC 24h Nürburgring schedule",
  "sro-official": "SRO Motorsports calendars",
  "gt-open-official": "International GT Open calendar",
  "dtm-official": "DTM official calendar",
  "motogp-official": "MotoGP official calendar",
  "worldsbk-official": "WorldSBK official calendar",
  "nascar-official": "NASCAR official schedule",
};

class OfficialSnapshotProvider implements MotorsportDataProvider {
  constructor(
    public id: string,
    public name: string,
    public championshipIds: string[],
  ) {}

  async loadSchedule(season: number) {
    if (season !== 2026) return [];
    return verifiedEvents2026.filter((item) =>
      this.championshipIds.includes(item.championshipId) ||
      item.relatedChampionshipIds?.some((id) => this.championshipIds.includes(id)),
    );
  }
}

const JOLPICA_CIRCUITS: Record<string, string> = {
  albert_park: "melbourne", shanghai: "shanghai", suzuka: "suzuka", miami: "miami",
  villeneuve: "montreal", monaco: "monaco", catalunya: "barcelona", red_bull_ring: "red-bull-ring",
  silverstone: "silverstone", spa: "spa", hungaroring: "hungaroring", zandvoort: "zandvoort",
  monza: "monza", baku: "baku", marina_bay: "singapore", americas: "cota",
  rodriguez: "mexico-city", interlagos: "interlagos", vegas: "las-vegas", losail: "lusail",
  yas_marina: "yas-marina", bahrain: "bahrain", jeddah: "jeddah",
};

type JolpicaSession = { date?: string; time?: string };
type JolpicaRace = {
  round: string;
  raceName: string;
  date: string;
  time?: string;
  Circuit: { circuitId: string };
  FirstPractice?: JolpicaSession;
  SecondPractice?: JolpicaSession;
  ThirdPractice?: JolpicaSession;
  Qualifying?: JolpicaSession;
  Sprint?: JolpicaSession;
};

class HistoricalF1Provider implements MotorsportDataProvider {
  id = "f1-official";
  name = "Formula 1 official calendar + Jolpica history";
  championshipIds = ["f1"];

  async loadSchedule(season: number): Promise<MotorsportEvent[]> {
    if (season === 2026) return verifiedEvents2026.filter((item) => item.championshipId === "f1");
    const response = await fetch(`https://api.jolpi.ca/ergast/f1/${season}.json`, {
      headers: { Accept: "application/json", "User-Agent": "ApexMotorsportCalendar/1.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`Jolpica returned ${response.status}`);
    const payload = await response.json() as { MRData?: { RaceTable?: { Races?: JolpicaRace[] } } };
    const rows = payload.MRData?.RaceTable?.Races;
    if (!Array.isArray(rows)) throw new Error("Malformed Jolpica F1 response");
    const championship = getChampionship("f1");
    const now = Date.now();
    return rows.flatMap((row) => {
      const circuitId = JOLPICA_CIRCUITS[row.Circuit.circuitId];
      if (!circuitId) return [];
      const eventId = `${season}-f1-${row.round}-${circuitId}`;
      const definitions: [string, "practice" | "qualifying" | "sprint" | "race", JolpicaSession | undefined][] = [
        ["Practice 1", "practice", row.FirstPractice], ["Practice 2", "practice", row.SecondPractice],
        ["Practice 3", "practice", row.ThirdPractice], ["Qualifying", "qualifying", row.Qualifying],
        ["Sprint", "sprint", row.Sprint], ["Race", "race", { date: row.date, time: row.time }],
      ];
      const sessions = definitions.flatMap(([name, type, value]) => value?.date && value.time ? [{
        id: `${eventId}-${type}-${value.date}`,
        name,
        type,
        startTime: `${value.date}T${value.time}`,
      }] : []);
      const dates = sessions.map((item) => item.startTime.slice(0, 10));
      const raceTime = sessions.find((item) => item.type === "race")?.startTime;
      return [{
        id: eventId,
        name: row.raceName,
        championshipId: "f1",
        championshipName: championship.name,
        season,
        circuit: getCircuit(circuitId),
        startDate: dates.sort()[0] ?? row.date,
        endDate: row.date,
        timingPrecision: sessions.length ? "datetime" as const : "date" as const,
        category: championship.category,
        status: raceTime && Date.parse(raceTime) < now ? "completed" as const : "upcoming" as const,
        sessions,
        duration: "Grand Prix",
        raceType: "Formula",
        officialUrl: `https://www.formula1.com/en/racing/${season}`,
        source: "Jolpica F1 API (Ergast-compatible)",
        sourceUrl: `https://api.jolpi.ca/ergast/f1/${season}.json`,
        lastUpdated: new Date().toISOString(),
      }];
    });
  }
}

const grouped = new Map<string, string[]>();
for (const item of championships) {
  grouped.set(item.providerId, [...(grouped.get(item.providerId) ?? []), item.id]);
}

export const scheduleProviders: MotorsportDataProvider[] = [...grouped].map(
  ([id, championshipIds]) => id === "f1-official"
    ? new HistoricalF1Provider()
    : new OfficialSnapshotProvider(id, PROVIDER_NAMES[id] ?? id, championshipIds),
);

export const F1Provider = scheduleProviders.find((item) => item.id === "f1-official")!;
export const WECProvider = scheduleProviders.find((item) => item.id === "fia-calendars")!;
export const IMSAProvider = scheduleProviders.find((item) => item.id === "imsa-official")!;
export const NLSProvider = scheduleProviders.find((item) => item.id === "nls-official")!;
export const GTWorldChallengeProvider = scheduleProviders.find((item) => item.id === "sro-official")!;
export const MotoGPProvider = scheduleProviders.find((item) => item.id === "motogp-official")!;
export const NASCARProvider = scheduleProviders.find((item) => item.id === "nascar-official")!;
export const IndyCarProvider = scheduleProviders.find((item) => item.id === "indycar-official")!;

export async function loadSchedule(season = new Date().getUTCFullYear()): Promise<ScheduleSnapshot> {
  const results = await Promise.allSettled(scheduleProviders.map((provider) => provider.loadSchedule(season)));
  const imported: MotorsportEvent[] = [];
  const providers: ProviderStatus[] = [];
  const generatedAt = new Date().toISOString();

  results.forEach((result, index) => {
    const provider = scheduleProviders[index];
    if (result.status === "fulfilled") {
      imported.push(...result.value);
      providers.push({
        id: provider.id,
        name: provider.name,
        championships: provider.championshipIds,
        health: result.value.length ? "healthy" : "warning",
        eventCount: result.value.length,
        lastSuccessfulSync: generatedAt,
        nextScheduledSync: new Date(Date.now() + refreshIntervalMs(imported)).toISOString(),
        sourceUrl: championships.find((item) => item.providerId === provider.id)?.officialUrl,
        message: result.value.length ? "Official schedule snapshot verified" : `No verified ${season} schedule available`,
      });
    } else {
      providers.push({
        id: provider.id,
        name: provider.name,
        championships: provider.championshipIds,
        health: "warning",
        eventCount: 0,
        lastError: result.reason instanceof Error ? result.reason.message : "Provider failed",
        message: "Using other providers and cached data",
      });
    }
  });

  const deduped = dedupeEvents(imported);
  const validation = validateEvents(deduped.events);
  return {
    season,
    generatedAt,
    events: deduped.events,
    championships,
    circuits,
    providers,
    validation: { ...validation, duplicatesRemoved: deduped.duplicatesRemoved },
  };
}

export function refreshIntervalMs(events: MotorsportEvent[], now = Date.now()) {
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  const hasNearEvent = events.some((item) => {
    const value = Date.parse(item.sessions.find((session) => session.type === "race")?.startTime ?? `${item.endDate}T12:00:00Z`);
    return value >= now && value - now <= sevenDays;
  });
  return hasNearEvent ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
}
