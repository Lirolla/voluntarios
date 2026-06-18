CREATE TABLE `bulletin_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200) NOT NULL,
	`content` text NOT NULL,
	`type` enum('general','urgent','event','pastoral') NOT NULL DEFAULT 'general',
	`audience` enum('all','admin') NOT NULL DEFAULT 'all',
	`authorId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bulletin_posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `event_qr_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`token` varchar(64) NOT NULL,
	`expiresAt` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `event_qr_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `event_qr_tokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
ALTER TABLE `bulletin_posts` ADD CONSTRAINT `bulletin_posts_authorId_users_id_fk` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `event_qr_tokens` ADD CONSTRAINT `event_qr_tokens_eventId_events_id_fk` FOREIGN KEY (`eventId`) REFERENCES `events`(`id`) ON DELETE no action ON UPDATE no action;