CREATE TABLE `portal_audit` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`detail` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `portal_media` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `portal_versions` (
	`revision` integer PRIMARY KEY NOT NULL,
	`body` text NOT NULL,
	`actor` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `portal_admins` ADD `role` text DEFAULT 'admin' NOT NULL;--> statement-breakpoint
ALTER TABLE `portal_admins` ADD `display_name` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `portal_admins` ADD `active` integer DEFAULT 1 NOT NULL;