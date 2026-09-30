CREATE TABLE `crosswalks` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text,
	`locality` text,
	`lat` real NOT NULL,
	`lng` real NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `crosswalks_lat_lng_idx` ON `crosswalks` (`lat`,`lng`);--> statement-breakpoint
CREATE TABLE `supporters` (
	`id` text PRIMARY KEY NOT NULL,
	`crosswalk_id` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`address` text,
	`show_name` integer DEFAULT false NOT NULL,
	`is_requester` integer DEFAULT false NOT NULL,
	`verified_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`crosswalk_id`) REFERENCES `crosswalks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `supporters_crosswalk_email_idx` ON `supporters` (`crosswalk_id`,`email`);--> statement-breakpoint
CREATE TABLE `verification_tokens` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`supporter_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`supporter_id`) REFERENCES `supporters`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `verification_tokens_supporter_idx` ON `verification_tokens` (`supporter_id`);