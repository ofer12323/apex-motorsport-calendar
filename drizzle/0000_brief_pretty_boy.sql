CREATE TABLE `championships` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`provider_id` text NOT NULL,
	`official_url` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `circuits` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`country` text NOT NULL,
	`country_code` text NOT NULL,
	`timezone` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `data_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`source_url` text,
	`health` text NOT NULL,
	`last_successful_sync` text,
	`last_error` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`championship_id` text NOT NULL,
	`circuit_id` text NOT NULL,
	`season` integer NOT NULL,
	`name` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`status` text NOT NULL,
	`source_url` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `events_season_start_idx` ON `events` (`season`,`start_date`);--> statement-breakpoint
CREATE INDEX `events_championship_season_idx` ON `events` (`championship_id`,`season`);--> statement-breakpoint
CREATE INDEX `events_circuit_start_idx` ON `events` (`circuit_id`,`start_date`);--> statement-breakpoint
CREATE TABLE `favorite_events` (
	`user_id` integer NOT NULL,
	`event_id` text NOT NULL,
	PRIMARY KEY(`user_id`, `event_id`)
);
--> statement-breakpoint
CREATE TABLE `notification_settings` (
	`user_id` integer NOT NULL,
	`reminder` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	PRIMARY KEY(`user_id`, `reminder`)
);
--> statement-breakpoint
CREATE TABLE `schedule_cache` (
	`season` integer PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`refreshed_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text
);
--> statement-breakpoint
CREATE INDEX `sessions_event_start_idx` ON `sessions` (`event_id`,`start_time`);--> statement-breakpoint
CREATE TABLE `sync_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`provider_id` text NOT NULL,
	`status` text NOT NULL,
	`events_imported` integer DEFAULT 0 NOT NULL,
	`message` text,
	`started_at` text NOT NULL,
	`finished_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `sync_logs_provider_finished_idx` ON `sync_logs` (`provider_id`,`finished_at`);--> statement-breakpoint
CREATE TABLE `user_series` (
	`user_id` integer NOT NULL,
	`championship_id` text NOT NULL,
	PRIMARY KEY(`user_id`, `championship_id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`timezone` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);