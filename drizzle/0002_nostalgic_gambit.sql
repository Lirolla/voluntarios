CREATE TABLE `satisfaction_ratings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`volunteerId` int NOT NULL,
	`eventId` int NOT NULL,
	`checkinId` int,
	`rating` int NOT NULL,
	`comment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `satisfaction_ratings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `checkins` ADD `checkinLat` varchar(30);--> statement-breakpoint
ALTER TABLE `checkins` ADD `checkinLng` varchar(30);--> statement-breakpoint
ALTER TABLE `checkins` ADD `checkoutLat` varchar(30);--> statement-breakpoint
ALTER TABLE `checkins` ADD `checkoutLng` varchar(30);--> statement-breakpoint
ALTER TABLE `checkins` ADD `checkinAddress` varchar(300);--> statement-breakpoint
ALTER TABLE `satisfaction_ratings` ADD CONSTRAINT `satisfaction_ratings_volunteerId_volunteers_id_fk` FOREIGN KEY (`volunteerId`) REFERENCES `volunteers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `satisfaction_ratings` ADD CONSTRAINT `satisfaction_ratings_eventId_events_id_fk` FOREIGN KEY (`eventId`) REFERENCES `events`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `satisfaction_ratings` ADD CONSTRAINT `satisfaction_ratings_checkinId_checkins_id_fk` FOREIGN KEY (`checkinId`) REFERENCES `checkins`(`id`) ON DELETE no action ON UPDATE no action;