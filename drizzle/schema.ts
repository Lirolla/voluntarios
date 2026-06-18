import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  datetime,
} from "drizzle-orm/mysql-core";

// ─── Users (Auth) ────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Networks (Redes) ─────────────────────────────────────────────────────────
export const networks = mysqlTable("networks", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Network = typeof networks.$inferSelect;

// ─── Ministries (Ministérios) ─────────────────────────────────────────────────
export const ministries = mysqlTable("ministries", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Ministry = typeof ministries.$inferSelect;

// ─── Volunteers (Voluntários) ─────────────────────────────────────────────────
export const volunteers = mysqlTable("volunteers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  name: varchar("name", { length: 150 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 30 }),
  photoUrl: text("photoUrl"),
  networkId: int("networkId").references(() => networks.id),
  ministryId: int("ministryId").references(() => ministries.id),
  role: varchar("role", { length: 100 }),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Volunteer = typeof volunteers.$inferSelect;
export type InsertVolunteer = typeof volunteers.$inferInsert;

// ─── Events (Eventos) ─────────────────────────────────────────────────────────
export const events = mysqlTable("events", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  location: varchar("location", { length: 200 }),
  startAt: datetime("startAt").notNull(),
  endAt: datetime("endAt"),
  type: varchar("type", { length: 100 }),
  status: mysqlEnum("status", ["upcoming", "ongoing", "completed", "cancelled"]).default("upcoming").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

// ─── Schedules (Escalas) ──────────────────────────────────────────────────────
export const schedules = mysqlTable("schedules", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").references(() => events.id).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  date: datetime("date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Schedule = typeof schedules.$inferSelect;
export type InsertSchedule = typeof schedules.$inferInsert;

// ─── Schedule Assignments (Voluntários na Escala) ─────────────────────────────
export const scheduleAssignments = mysqlTable("schedule_assignments", {
  id: int("id").autoincrement().primaryKey(),
  scheduleId: int("scheduleId").references(() => schedules.id).notNull(),
  volunteerId: int("volunteerId").references(() => volunteers.id).notNull(),
  role: varchar("role", { length: 100 }),
  confirmed: boolean("confirmed").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ScheduleAssignment = typeof scheduleAssignments.$inferSelect;

// ─── Check-ins ────────────────────────────────────────────────────────────────
export const checkins = mysqlTable("checkins", {
  id: int("id").autoincrement().primaryKey(),
  volunteerId: int("volunteerId").references(() => volunteers.id).notNull(),
  eventId: int("eventId").references(() => events.id).notNull(),
  checkinAt: datetime("checkinAt"),
  checkoutAt: datetime("checkoutAt"),
  // GPS tracking
  checkinLat: varchar("checkinLat", { length: 30 }),
  checkinLng: varchar("checkinLng", { length: 30 }),
  checkoutLat: varchar("checkoutLat", { length: 30 }),
  checkoutLng: varchar("checkoutLng", { length: 30 }),
  checkinAddress: varchar("checkinAddress", { length: 300 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Checkin = typeof checkins.$inferSelect;
export type InsertCheckin = typeof checkins.$inferInsert;

// ─── Satisfaction Ratings (Avaliação de Satisfação) ──────────────────────────
export const satisfactionRatings = mysqlTable("satisfaction_ratings", {
  id: int("id").autoincrement().primaryKey(),
  volunteerId: int("volunteerId").references(() => volunteers.id).notNull(),
  eventId: int("eventId").references(() => events.id).notNull(),
  checkinId: int("checkinId").references(() => checkins.id),
  rating: int("rating").notNull(), // 1-5 estrelas
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SatisfactionRating = typeof satisfactionRatings.$inferSelect;
export type InsertSatisfactionRating = typeof satisfactionRatings.$inferInsert;

// ─── Notifications ────────────────────────────────────────────────────────────
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  volunteerId: int("volunteerId").references(() => volunteers.id),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  type: mysqlEnum("type", ["schedule", "event", "general", "checkin"]).default("general").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// ─── Bulletin Posts (Mural de Avisos) ─────────────────────────────────────────
export const bulletinPosts = mysqlTable("bulletin_posts", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  type: mysqlEnum("type", ["general", "urgent", "event", "pastoral"]).default("general").notNull(),
  audience: mysqlEnum("audience", ["all", "admin"]).default("all").notNull(),
  authorId: int("authorId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type BulletinPost = typeof bulletinPosts.$inferSelect;
export type InsertBulletinPost = typeof bulletinPosts.$inferInsert;

// ─── Event QR Tokens (QR Code de Check-in) ───────────────────────────────────
export const eventQrTokens = mysqlTable("event_qr_tokens", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").references(() => events.id).notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  expiresAt: datetime("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type EventQrToken = typeof eventQrTokens.$inferSelect;
