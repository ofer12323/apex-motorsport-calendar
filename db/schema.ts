import { sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const championships = sqliteTable("championships", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  providerId: text("provider_id").notNull(),
  officialUrl: text("official_url").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const circuits = sqliteTable("circuits", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  countryCode: text("country_code").notNull(),
  timezone: text("timezone").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const dataSources = sqliteTable("data_sources", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  sourceUrl: text("source_url"),
  health: text("health").notNull(),
  lastSuccessfulSync: text("last_successful_sync"),
  lastError: text("last_error"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const events = sqliteTable("events", {
  id: text("id").primaryKey(),
  championshipId: text("championship_id").notNull(),
  circuitId: text("circuit_id").notNull(),
  season: integer("season").notNull(),
  name: text("name").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  status: text("status").notNull(),
  sourceUrl: text("source_url").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("events_season_start_idx").on(table.season, table.startDate),
  index("events_championship_season_idx").on(table.championshipId, table.season),
  index("events_circuit_start_idx").on(table.circuitId, table.startDate),
]);

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  eventId: text("event_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time"),
}, (table) => [index("sessions_event_start_idx").on(table.eventId, table.startTime)]);

export const syncLogs = sqliteTable("sync_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  providerId: text("provider_id").notNull(),
  status: text("status").notNull(),
  eventsImported: integer("events_imported").notNull().default(0),
  message: text("message"),
  startedAt: text("started_at").notNull(),
  finishedAt: text("finished_at").notNull(),
}, (table) => [index("sync_logs_provider_finished_idx").on(table.providerId, table.finishedAt)]);

export const scheduleCache = sqliteTable("schedule_cache", {
  season: integer("season").primaryKey(),
  payload: text("payload").notNull(),
  refreshedAt: text("refreshed_at").notNull(),
});

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  timezone: text("timezone"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const userSeries = sqliteTable("user_series", {
  userId: integer("user_id").notNull(),
  championshipId: text("championship_id").notNull(),
}, (table) => [primaryKey({ columns: [table.userId, table.championshipId] })]);

export const favoriteEvents = sqliteTable("favorite_events", {
  userId: integer("user_id").notNull(),
  eventId: text("event_id").notNull(),
}, (table) => [primaryKey({ columns: [table.userId, table.eventId] })]);

export const notificationSettings = sqliteTable("notification_settings", {
  userId: integer("user_id").notNull(),
  reminder: text("reminder").notNull(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
}, (table) => [primaryKey({ columns: [table.userId, table.reminder] })]);
