import type { MotorsportEvent } from "./types";

export type ValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

const dateOnly = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(value: string) {
  if (dateOnly.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
  }
  return Number.isFinite(Date.parse(value));
}

function isValidTimezone(value: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

function localDate(value: string, timezone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function duplicateKey(item: MotorsportEvent) {
  const normalizedName = item.name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  return [item.championshipId, item.season, item.circuit.id, item.endDate.slice(0, 10), normalizedName].join("|");
}

export function dedupeEvents(events: MotorsportEvent[]) {
  const seen = new Set<string>();
  const unique: MotorsportEvent[] = [];
  let duplicatesRemoved = 0;
  for (const item of events) {
    const key = duplicateKey(item);
    if (seen.has(key)) {
      duplicatesRemoved += 1;
      continue;
    }
    seen.add(key);
    unique.push(item);
  }
  return { events: unique, duplicatesRemoved };
}

export function validateEvents(events: MotorsportEvent[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const ids = new Set<string>();
  const keys = new Set<string>();

  for (const item of events) {
    if (ids.has(item.id)) errors.push(`${item.id}: duplicate event id`);
    ids.add(item.id);
    const key = duplicateKey(item);
    if (keys.has(key)) errors.push(`${item.id}: duplicate normalized event`);
    keys.add(key);

    if (!item.name.trim()) errors.push(`${item.id}: missing event name`);
    if (!item.circuit?.id || !item.circuit.name) errors.push(`${item.id}: missing circuit`);
    if (!isValidDate(item.startDate)) errors.push(`${item.id}: invalid start date ${item.startDate}`);
    if (!isValidDate(item.endDate)) errors.push(`${item.id}: invalid end date ${item.endDate}`);
    if (Date.parse(item.startDate) > Date.parse(item.endDate)) errors.push(`${item.id}: event ends before it starts`);
    if (/^24h$/i.test(item.duration ?? "") && item.startDate === item.endDate) {
      errors.push(`${item.id}: a 24-hour race must span two calendar dates`);
    }
    if (!isValidTimezone(item.circuit.timezone)) errors.push(`${item.id}: invalid timezone ${item.circuit.timezone}`);
    if (!item.source || !item.sourceUrl) errors.push(`${item.id}: missing source tracking`);
    if (!item.sessions.length) warnings.push(`${item.id}: session timetable not yet published`);

    for (const currentSession of item.sessions) {
      if (!isValidDate(currentSession.startTime) || dateOnly.test(currentSession.startTime)) {
        errors.push(`${item.id}/${currentSession.id}: invalid UTC session timestamp`);
        continue;
      }
      if (!currentSession.startTime.endsWith("Z")) errors.push(`${item.id}/${currentSession.id}: session timestamp is not UTC`);
      const sessionDate = localDate(currentSession.startTime, item.circuit.timezone);
      if (sessionDate < item.startDate.slice(0, 10) || sessionDate > item.endDate.slice(0, 10)) {
        errors.push(`${item.id}/${currentSession.id}: session falls outside event dates`);
      }
      if (currentSession.endTime && Date.parse(currentSession.endTime) < Date.parse(currentSession.startTime)) {
        errors.push(`${item.id}/${currentSession.id}: session ends before it starts`);
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}
