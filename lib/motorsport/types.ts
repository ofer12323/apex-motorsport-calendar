export type ChampionshipCategory =
  | "FORMULA"
  | "ENDURANCE"
  | "GT"
  | "TOURING CARS"
  | "MOTORCYCLES"
  | "RALLY"
  | "AMERICAN MOTORSPORT"
  | "OTHER";

export type EventStatus =
  | "upcoming"
  | "live"
  | "completed"
  | "postponed"
  | "cancelled";

export type SessionType =
  | "practice"
  | "qualifying"
  | "sprint"
  | "race"
  | "warmup"
  | "hyperpole"
  | "other";

export type TimingPrecision = "date" | "datetime";

export interface Championship {
  id: string;
  name: string;
  shortName: string;
  category: ChampionshipCategory;
  color: string;
  officialUrl: string;
  providerId: string;
}

export interface Circuit {
  id: string;
  name: string;
  city?: string;
  country: string;
  countryCode: string;
  timezone: string;
  lengthKm?: number;
  corners?: number;
}

export interface MotorsportSession {
  id: string;
  name: string;
  type: SessionType;
  startTime: string;
  endTime?: string;
}

export interface MotorsportEvent {
  id: string;
  name: string;
  championshipId: string;
  championshipName: string;
  relatedChampionshipIds?: string[];
  season: number;
  circuit: Circuit;
  startDate: string;
  endDate: string;
  timingPrecision: TimingPrecision;
  category: ChampionshipCategory;
  status: EventStatus;
  sessions: MotorsportSession[];
  duration?: string;
  raceType?: string;
  officialUrl?: string;
  source: string;
  sourceUrl: string;
  lastUpdated: string;
}

export type ProviderHealth = "healthy" | "warning" | "unavailable";

export interface ProviderStatus {
  id: string;
  name: string;
  championships: string[];
  health: ProviderHealth;
  eventCount: number;
  lastSuccessfulSync?: string;
  nextScheduledSync?: string;
  sourceUrl?: string;
  message?: string;
  lastError?: string;
}

export interface ScheduleSnapshot {
  season: number;
  generatedAt: string;
  events: MotorsportEvent[];
  championships: Championship[];
  circuits: Circuit[];
  providers: ProviderStatus[];
  validation: {
    valid: boolean;
    errors: string[];
    warnings: string[];
    duplicatesRemoved: number;
  };
}

export interface MotorsportDataProvider {
  id: string;
  name: string;
  championshipIds: string[];
  loadSchedule(season: number): Promise<MotorsportEvent[]>;
}
