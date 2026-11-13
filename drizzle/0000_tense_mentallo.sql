CREATE TABLE `portal_admins` (
	`username` text PRIMARY KEY NOT NULL,
	`verifier` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `portal_attempts` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `portal_content` (
	`id` integer PRIMARY KEY NOT NULL,
	`body` text NOT NULL,
	`revision` integer NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `portal_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`version` integer NOT NULL,
	`expires` integer NOT NULL
);
