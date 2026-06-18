import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertCheckin,
  InsertEvent,
  InsertNotification,
  InsertSchedule,
  InsertUser,
  InsertVolunteer,
  checkins,
  events,
  ministries,
  networks,
  notifications,
  satisfactionRatings,
  scheduleAssignments,
  schedules,
  users,
  volunteers,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach((field) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Networks ─────────────────────────────────────────────────────────────────
export async function getNetworks() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(networks).orderBy(networks.name);
}

export async function createNetwork(data: { name: string; description?: string; color?: string }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(networks).values(data);
  return result;
}

export async function updateNetwork(id: number, data: { name?: string; description?: string; color?: string }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(networks).set(data).where(eq(networks.id, id));
}

export async function deleteNetwork(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(networks).where(eq(networks.id, id));
}

// ─── Ministries ───────────────────────────────────────────────────────────────
export async function getMinistries() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ministries).orderBy(ministries.name);
}

export async function createMinistry(data: { name: string; description?: string; color?: string }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(ministries).values(data);
}

export async function updateMinistry(id: number, data: { name?: string; description?: string; color?: string }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(ministries).set(data).where(eq(ministries.id, id));
}

export async function deleteMinistry(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(ministries).where(eq(ministries.id, id));
}

// ─── Volunteers ───────────────────────────────────────────────────────────────
export async function getVolunteers(filters?: { networkId?: number; ministryId?: number; status?: "active" | "inactive" }) {
  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .select({
      volunteer: volunteers,
      network: networks,
      ministry: ministries,
    })
    .from(volunteers)
    .leftJoin(networks, eq(volunteers.networkId, networks.id))
    .leftJoin(ministries, eq(volunteers.ministryId, ministries.id))
    .orderBy(volunteers.name);

  let result = rows;
  if (filters?.networkId) result = result.filter((r) => r.volunteer.networkId === filters.networkId);
  if (filters?.ministryId) result = result.filter((r) => r.volunteer.ministryId === filters.ministryId);
  if (filters?.status) result = result.filter((r) => r.volunteer.status === filters.status);

  return result;
}

export async function getVolunteerById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select({ volunteer: volunteers, network: networks, ministry: ministries })
    .from(volunteers)
    .leftJoin(networks, eq(volunteers.networkId, networks.id))
    .leftJoin(ministries, eq(volunteers.ministryId, ministries.id))
    .where(eq(volunteers.id, id))
    .limit(1);
  return rows[0] ?? undefined;
}

export async function getVolunteerByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select({ volunteer: volunteers, network: networks, ministry: ministries })
    .from(volunteers)
    .leftJoin(networks, eq(volunteers.networkId, networks.id))
    .leftJoin(ministries, eq(volunteers.ministryId, ministries.id))
    .where(eq(volunteers.userId, userId))
    .limit(1);
  return rows[0] ?? undefined;
}

export async function createVolunteer(data: InsertVolunteer) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(volunteers).values(data);
  return result[0];
}

export async function updateVolunteer(id: number, data: Partial<InsertVolunteer>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(volunteers).set(data).where(eq(volunteers.id, id));
}

export async function deleteVolunteer(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(volunteers).where(eq(volunteers.id, id));
}

// ─── Events ───────────────────────────────────────────────────────────────────
export async function getEvents(status?: string) {
  const db = await getDb();
  if (!db) return [];
  const query = db.select().from(events).orderBy(desc(events.startAt));
  const rows = await query;
  if (status) return rows.filter((e) => e.status === status);
  return rows;
}

export async function getEventById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(events).where(eq(events.id, id)).limit(1);
  return rows[0] ?? undefined;
}

export async function createEvent(data: InsertEvent) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(events).values(data);
}

export async function updateEvent(id: number, data: Partial<InsertEvent>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(events).set(data).where(eq(events.id, id));
}

export async function deleteEvent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(events).where(eq(events.id, id));
}

// ─── Schedules ────────────────────────────────────────────────────────────────
export async function getSchedulesByEvent(eventId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(schedules).where(eq(schedules.eventId, eventId)).orderBy(schedules.date);
}

export async function getScheduleById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(schedules).where(eq(schedules.id, id)).limit(1);
  return rows[0] ?? undefined;
}

export async function createSchedule(data: InsertSchedule) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(schedules).values(data);
}

export async function getScheduleAssignments(scheduleId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ assignment: scheduleAssignments, volunteer: volunteers })
    .from(scheduleAssignments)
    .leftJoin(volunteers, eq(scheduleAssignments.volunteerId, volunteers.id))
    .where(eq(scheduleAssignments.scheduleId, scheduleId));
}

export async function assignVolunteerToSchedule(scheduleId: number, volunteerId: number, role?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(scheduleAssignments).values({ scheduleId, volunteerId, role });
}

export async function removeVolunteerFromSchedule(scheduleId: number, volunteerId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db
    .delete(scheduleAssignments)
    .where(and(eq(scheduleAssignments.scheduleId, scheduleId), eq(scheduleAssignments.volunteerId, volunteerId)));
}

export async function getVolunteerSchedules(volunteerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ assignment: scheduleAssignments, schedule: schedules, event: events })
    .from(scheduleAssignments)
    .leftJoin(schedules, eq(scheduleAssignments.scheduleId, schedules.id))
    .leftJoin(events, eq(schedules.eventId, events.id))
    .where(eq(scheduleAssignments.volunteerId, volunteerId))
    .orderBy(desc(schedules.date));
}

// ─── Check-ins ────────────────────────────────────────────────────────────────
export async function getCheckinsByEvent(eventId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ checkin: checkins, volunteer: volunteers })
    .from(checkins)
    .leftJoin(volunteers, eq(checkins.volunteerId, volunteers.id))
    .where(eq(checkins.eventId, eventId))
    .orderBy(desc(checkins.checkinAt));
}

export async function getCheckinsByVolunteer(volunteerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ checkin: checkins, event: events })
    .from(checkins)
    .leftJoin(events, eq(checkins.eventId, events.id))
    .where(eq(checkins.volunteerId, volunteerId))
    .orderBy(desc(checkins.checkinAt));
}

export async function getActiveCheckin(volunteerId: number, eventId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(checkins)
    .where(and(eq(checkins.volunteerId, volunteerId), eq(checkins.eventId, eventId), isNull(checkins.checkoutAt)))
    .limit(1);
  return rows[0] ?? undefined;
}

export async function createCheckin(data: InsertCheckin) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(checkins).values(data);
}

export async function updateCheckin(id: number, data: Partial<InsertCheckin>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(checkins).set(data).where(eq(checkins.id, id));
}

// ─── Notifications ────────────────────────────────────────────────────────────
export async function getNotifications(volunteerId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (volunteerId) {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.volunteerId, volunteerId))
      .orderBy(desc(notifications.createdAt));
  }
  return db.select().from(notifications).orderBy(desc(notifications.createdAt));
}

export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(notifications).values(data);
}

export async function markNotificationRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(notifications).set({ read: true }).where(eq(notifications.id, id));
}

export async function markAllNotificationsRead(volunteerId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(notifications).set({ read: true }).where(eq(notifications.volunteerId, volunteerId));
}

// ─── Reports ──────────────────────────────────────────────────────────────────
export async function getPresenceReport() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      volunteerId: checkins.volunteerId,
      volunteerName: volunteers.name,
      totalCheckins: sql<number>`COUNT(${checkins.id})`,
    })
    .from(checkins)
    .leftJoin(volunteers, eq(checkins.volunteerId, volunteers.id))
    .groupBy(checkins.volunteerId, volunteers.name)
    .orderBy(desc(sql`COUNT(${checkins.id})`));
}

export async function getNetworkReport() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      networkId: volunteers.networkId,
      networkName: networks.name,
      networkColor: networks.color,
      total: sql<number>`COUNT(${volunteers.id})`,
    })
    .from(volunteers)
    .leftJoin(networks, eq(volunteers.networkId, networks.id))
    .where(eq(volunteers.status, "active"))
    .groupBy(volunteers.networkId, networks.name, networks.color)
    .orderBy(desc(sql`COUNT(${volunteers.id})`));
}

export async function getMinistryReport() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      ministryId: volunteers.ministryId,
      ministryName: ministries.name,
      ministryColor: ministries.color,
      total: sql<number>`COUNT(${volunteers.id})`,
    })
    .from(volunteers)
    .leftJoin(ministries, eq(volunteers.ministryId, ministries.id))
    .where(eq(volunteers.status, "active"))
    .groupBy(volunteers.ministryId, ministries.name, ministries.color)
    .orderBy(desc(sql`COUNT(${volunteers.id})`));
}

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return { totalVolunteers: 0, totalEvents: 0, totalCheckins: 0, upcomingEvents: 0 };

  const [volCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(volunteers).where(eq(volunteers.status, "active"));
  const [evCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(events);
  const [ciCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(checkins);
  const [upCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(events).where(eq(events.status, "upcoming"));

  return {
    totalVolunteers: Number(volCount?.count ?? 0),
    totalEvents: Number(evCount?.count ?? 0),
    totalCheckins: Number(ciCount?.count ?? 0),
    upcomingEvents: Number(upCount?.count ?? 0),
  };
}

// ─── GPS & Satisfaction ───────────────────────────────────────────────────────
export async function createCheckinWithGPS(data: InsertCheckin & {
  checkinLat?: string; checkinLng?: string; checkinAddress?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(checkins).values(data);
}

export async function updateCheckinWithGPS(id: number, data: Partial<InsertCheckin> & {
  checkoutLat?: string; checkoutLng?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(checkins).set(data).where(eq(checkins.id, id));
}

export async function getActiveCheckinsForEvent(eventId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ checkin: checkins, volunteer: volunteers })
    .from(checkins)
    .leftJoin(volunteers, eq(checkins.volunteerId, volunteers.id))
    .where(and(eq(checkins.eventId, eventId), isNull(checkins.checkoutAt)))
    .orderBy(desc(checkins.checkinAt));
}

export async function getAllActiveCheckins() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ checkin: checkins, volunteer: volunteers, event: events })
    .from(checkins)
    .leftJoin(volunteers, eq(checkins.volunteerId, volunteers.id))
    .leftJoin(events, eq(checkins.eventId, events.id))
    .where(isNull(checkins.checkoutAt))
    .orderBy(desc(checkins.checkinAt));
}

// ─── Satisfaction Ratings ─────────────────────────────────────────────────────
export async function createSatisfactionRating(data: {
  volunteerId: number; eventId: number; checkinId?: number; rating: number; comment?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(satisfactionRatings).values(data);
}

export async function getSatisfactionByEvent(eventId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ rating: satisfactionRatings, volunteer: volunteers })
    .from(satisfactionRatings)
    .leftJoin(volunteers, eq(satisfactionRatings.volunteerId, volunteers.id))
    .where(eq(satisfactionRatings.eventId, eventId))
    .orderBy(desc(satisfactionRatings.createdAt));
}

export async function getSatisfactionAvgByEvent() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      eventId: satisfactionRatings.eventId,
      eventName: events.name,
      avgRating: sql<number>`ROUND(AVG(${satisfactionRatings.rating}), 2)`,
      totalRatings: sql<number>`COUNT(${satisfactionRatings.id})`,
    })
    .from(satisfactionRatings)
    .leftJoin(events, eq(satisfactionRatings.eventId, events.id))
    .groupBy(satisfactionRatings.eventId, events.name)
    .orderBy(desc(sql`AVG(${satisfactionRatings.rating})`));
}

export async function getVolunteerSatisfactionForEvent(volunteerId: number, eventId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(satisfactionRatings)
    .where(and(eq(satisfactionRatings.volunteerId, volunteerId), eq(satisfactionRatings.eventId, eventId)))
    .limit(1);
  return rows[0] ?? undefined;
}

// ─── Schedule Conflict Detection ──────────────────────────────────────────────
export async function getVolunteerScheduleConflicts(volunteerId: number, scheduleId: number) {
  const db = await getDb();
  if (!db) return [];
  // Get the target schedule's date/event
  const targetRows = await db
    .select({ schedule: schedules, event: events })
    .from(schedules)
    .leftJoin(events, eq(schedules.eventId, events.id))
    .where(eq(schedules.id, scheduleId))
    .limit(1);
  if (!targetRows[0]) return [];
  const target = targetRows[0];

  // Find all other schedules this volunteer is assigned to on the same date
  const conflictRows = await db
    .select({ assignment: scheduleAssignments, schedule: schedules, event: events })
    .from(scheduleAssignments)
    .leftJoin(schedules, eq(scheduleAssignments.scheduleId, schedules.id))
    .leftJoin(events, eq(schedules.eventId, events.id))
    .where(
      and(
        eq(scheduleAssignments.volunteerId, volunteerId),
        sql`DATE(${schedules.date}) = DATE(${target.schedule.date})`,
        sql`${scheduleAssignments.scheduleId} != ${scheduleId}`
      )
    );
  return conflictRows;
}

export async function checkVolunteerAlreadyAssigned(scheduleId: number, volunteerId: number) {
  const db = await getDb();
  if (!db) return false;
  const rows = await db
    .select()
    .from(scheduleAssignments)
    .where(and(eq(scheduleAssignments.scheduleId, scheduleId), eq(scheduleAssignments.volunteerId, volunteerId)))
    .limit(1);
  return rows.length > 0;
}

export async function getScheduleWithConflictInfo(scheduleId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select({ assignment: scheduleAssignments, volunteer: volunteers })
    .from(scheduleAssignments)
    .leftJoin(volunteers, eq(scheduleAssignments.volunteerId, volunteers.id))
    .where(eq(scheduleAssignments.scheduleId, scheduleId));

  // For each assignment, check conflicts
  const withConflicts = await Promise.all(rows.map(async (row) => {
    const conflicts = await getVolunteerScheduleConflicts(row.assignment.volunteerId, scheduleId);
    return { ...row, hasConflict: conflicts.length > 0, conflicts };
  }));
  return withConflicts;
}
