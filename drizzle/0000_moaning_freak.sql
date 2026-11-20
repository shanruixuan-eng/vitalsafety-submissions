CREATE TABLE `submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`title` text NOT NULL,
	`fields` text NOT NULL,
	`images` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `submissions_created_at` ON `submissions` (`created_at`);