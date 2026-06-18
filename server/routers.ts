import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  assignVolunteerToSchedule,
  checkVolunteerAlreadyAssigned,
  createCheckin,
  createCheckinWithGPS,
  createEvent,
  createMinistry,
  createNetwork,
  createNotification,
  createSatisfactionRating,
  createSchedule,
  createVolunteer,
  deleteEvent,
  deleteMinistry,
  deleteNetwork,
  deleteVolunteer,
  getActiveCheckin,
  getActiveCheckinsForEvent,
  getAllActiveCheckins,
  getCheckinsByEvent,
  getCheckinsByVolunteer,
  getDashboardStats,
  getEventById,
  getEvents,
  getMinistries,
  getMinistryReport,
  getNetworkReport,
  getNetworks,
  getNotifications,
  getPresenceReport,
  getSatisfactionAvgByEvent,
  getSatisfactionByEvent,
  getScheduleAssignments,
  getScheduleById,
  getSchedulesByEvent,
  getScheduleWithConflictInfo,
  getVolunteerByUserId,
  getVolunteerById,
  getVolunteerSatisfactionForEvent,
  getVolunteerScheduleConflicts,
  getVolunteerSchedules,
  getVolunteers,
  markAllNotificationsRead,
  markNotificationRead,
  removeVolunteerFromSchedule,
  updateCheckin,
  updateCheckinWithGPS,
  updateEvent,
  updateMinistry,
  updateNetwork,
  updateVolunteer,
  getBulletinPosts,
  createBulletinPost,
  deleteBulletinPost,
  createQrToken,
  getQrTokenByToken,
  getQrTokenByEvent,
  getVolunteerPersonalHistory,
  getBirthdayVolunteers,
} from "./db";
import { nanoid } from "nanoid";
import QRCode from "qrcode";
import bcrypt from "bcryptjs";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getUserByLocalCredentialEmail } from "./db";
import { sdk } from "./_core/sdk";

// Admin guard middleware
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a administradores." });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    localLogin: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        const record = await getUserByLocalCredentialEmail(input.email);
        if (!record) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "E-mail ou senha incorretos." });
        }
        const valid = await bcrypt.compare(input.password, record.cred.passwordHash);
        if (!valid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "E-mail ou senha incorretos." });
        }
        // Create a session token using the existing SDK (same mechanism as OAuth)
        const sessionToken = await sdk.createSessionToken(record.user.openId, { name: record.user.name ?? "" });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
        });
        return { success: true, user: record.user };
      }),
  }),

  // ─── Networks ───────────────────────────────────────────────────────────────
  networks: router({
    list: publicProcedure.query(() => getNetworks()),

    create: adminProcedure
      .input(z.object({ name: z.string().min(1), description: z.string().optional(), color: z.string().optional() }))
      .mutation(({ input }) => createNetwork(input)),

    update: adminProcedure
      .input(z.object({ id: z.number(), name: z.string().optional(), description: z.string().optional(), color: z.string().optional() }))
      .mutation(({ input }) => updateNetwork(input.id, { name: input.name, description: input.description, color: input.color })),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteNetwork(input.id)),
  }),

  // ─── Ministries ─────────────────────────────────────────────────────────────
  ministries: router({
    list: publicProcedure.query(() => getMinistries()),

    create: adminProcedure
      .input(z.object({ name: z.string().min(1), description: z.string().optional(), color: z.string().optional() }))
      .mutation(({ input }) => createMinistry(input)),

    update: adminProcedure
      .input(z.object({ id: z.number(), name: z.string().optional(), description: z.string().optional(), color: z.string().optional() }))
      .mutation(({ input }) => updateMinistry(input.id, { name: input.name, description: input.description, color: input.color })),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteMinistry(input.id)),
  }),

  // ─── Volunteers ─────────────────────────────────────────────────────────────
  volunteers: router({
    list: protectedProcedure
      .input(z.object({ networkId: z.number().optional(), ministryId: z.number().optional(), status: z.enum(["active", "inactive"]).optional() }).optional())
      .query(({ input }) => getVolunteers(input)),

    byId: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getVolunteerById(input.id)),

    myProfile: protectedProcedure.query(({ ctx }) => getVolunteerByUserId(ctx.user.id)),

    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        photoUrl: z.string().optional(),
        networkId: z.number().optional(),
        ministryId: z.number().optional(),
        role: z.string().optional(),
        notes: z.string().optional(),
        userId: z.number().optional(),
      }))
      .mutation(({ input }) => createVolunteer(input)),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        photoUrl: z.string().optional(),
        networkId: z.number().optional(),
        ministryId: z.number().optional(),
        role: z.string().optional(),
        status: z.enum(["active", "inactive"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        // Non-admins can only update their own profile
        if (ctx.user.role !== "admin") {
          const vol = await getVolunteerByUserId(ctx.user.id);
          if (!vol || vol.volunteer.id !== id) {
            throw new TRPCError({ code: "FORBIDDEN" });
          }
        }
        return updateVolunteer(id, data);
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteVolunteer(input.id)),
  }),

  // ─── Events ─────────────────────────────────────────────────────────────────
  events: router({
    list: protectedProcedure
      .input(z.object({ status: z.string().optional() }).optional())
      .query(({ input }) => getEvents(input?.status)),

    byId: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getEventById(input.id)),

    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        location: z.string().optional(),
        startAt: z.date(),
        endAt: z.date().optional(),
        type: z.string().optional(),
        status: z.enum(["upcoming", "ongoing", "completed", "cancelled"]).optional(),
      }))
      .mutation(({ input }) => createEvent(input)),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        location: z.string().optional(),
        startAt: z.date().optional(),
        endAt: z.date().optional(),
        type: z.string().optional(),
        status: z.enum(["upcoming", "ongoing", "completed", "cancelled"]).optional(),
      }))
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return updateEvent(id, data);
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteEvent(input.id)),
  }),

  // ─── Schedules ──────────────────────────────────────────────────────────────
  schedules: router({
    byEvent: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .query(({ input }) => getSchedulesByEvent(input.eventId)),

    create: adminProcedure
      .input(z.object({ eventId: z.number(), title: z.string().min(1), date: z.date(), notes: z.string().optional() }))
      .mutation(({ input }) => createSchedule(input)),

    assignments: protectedProcedure
      .input(z.object({ scheduleId: z.number() }))
      .query(({ input }) => getScheduleAssignments(input.scheduleId)),

    assign: adminProcedure
      .input(z.object({ scheduleId: z.number(), volunteerId: z.number(), role: z.string().optional() }))
      .mutation(({ input }) => assignVolunteerToSchedule(input.scheduleId, input.volunteerId, input.role)),

    unassign: adminProcedure
      .input(z.object({ scheduleId: z.number(), volunteerId: z.number() }))
      .mutation(({ input }) => removeVolunteerFromSchedule(input.scheduleId, input.volunteerId)),

    mySchedules: protectedProcedure.query(async ({ ctx }) => {
      const vol = await getVolunteerByUserId(ctx.user.id);
      if (!vol) return [];
      return getVolunteerSchedules(vol.volunteer.id);
    }),
  }),

  // ─── Check-ins ──────────────────────────────────────────────────────────────
    checkins: router({
    byEvent: adminProcedure
      .input(z.object({ eventId: z.number() }))
      .query(({ input }) => getCheckinsByEvent(input.eventId)),
    // Monitoramento em tempo real: todos os check-ins ativos agora
    liveMonitor: adminProcedure.query(() => getAllActiveCheckins()),
    // Presenças ativas por evento
    activeByEvent: adminProcedure
      .input(z.object({ eventId: z.number() }))
      .query(({ input }) => getActiveCheckinsForEvent(input.eventId)),
    myHistory: protectedProcedure.query(async ({ ctx }) => {
      const vol = await getVolunteerByUserId(ctx.user.id);
      if (!vol) return [];
      return getCheckinsByVolunteer(vol.volunteer.id);
    }),
    checkin: protectedProcedure
      .input(z.object({
        eventId: z.number(),
        volunteerId: z.number().optional(),
        lat: z.string().optional(),
        lng: z.string().optional(),
        address: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        let volunteerId = input.volunteerId;
        if (!volunteerId) {
          const vol = await getVolunteerByUserId(ctx.user.id);
          if (!vol) throw new TRPCError({ code: "NOT_FOUND", message: "Voluntário não encontrado." });
          volunteerId = vol.volunteer.id;
        }
        const existing = await getActiveCheckin(volunteerId, input.eventId);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "Check-in já realizado para este evento." });
        await createCheckinWithGPS({
          volunteerId,
          eventId: input.eventId,
          checkinAt: new Date(),
          checkinLat: input.lat,
          checkinLng: input.lng,
          checkinAddress: input.address,
        });
        return { success: true };
      }),
    checkout: protectedProcedure
      .input(z.object({
        eventId: z.number(),
        volunteerId: z.number().optional(),
        lat: z.string().optional(),
        lng: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        let volunteerId = input.volunteerId;
        if (!volunteerId) {
          const vol = await getVolunteerByUserId(ctx.user.id);
          if (!vol) throw new TRPCError({ code: "NOT_FOUND", message: "Voluntário não encontrado." });
          volunteerId = vol.volunteer.id;
        }
        const existing = await getActiveCheckin(volunteerId, input.eventId);
        if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Nenhum check-in ativo encontrado." });
        await updateCheckinWithGPS(existing.id, {
          checkoutAt: new Date(),
          checkoutLat: input.lat,
          checkoutLng: input.lng,
        });
        return { success: true, checkinId: existing.id };
      }),
  }),
  // ─── Satisfaction ────────────────────────────────────────────────────────────
  satisfaction: router({
    submit: protectedProcedure
      .input(z.object({
        eventId: z.number(),
        checkinId: z.number().optional(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const vol = await getVolunteerByUserId(ctx.user.id);
        if (!vol) throw new TRPCError({ code: "NOT_FOUND", message: "Voluntário não encontrado." });
        const existing = await getVolunteerSatisfactionForEvent(vol.volunteer.id, input.eventId);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "Avaliação já enviada para este evento." });
        await createSatisfactionRating({ ...input, volunteerId: vol.volunteer.id });
        return { success: true };
      }),
    byEvent: adminProcedure
      .input(z.object({ eventId: z.number() }))
      .query(({ input }) => getSatisfactionByEvent(input.eventId)),
    avgByEvent: adminProcedure.query(() => getSatisfactionAvgByEvent()),
    myRating: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input, ctx }) => {
        const vol = await getVolunteerByUserId(ctx.user.id);
        if (!vol) return null;
        return getVolunteerSatisfactionForEvent(vol.volunteer.id, input.eventId);
      }),
  }),
  // ─── Schedule Conflicts ───────────────────────────────────────────────────────
  scheduleConflicts: router({
    check: adminProcedure
      .input(z.object({ scheduleId: z.number(), volunteerId: z.number() }))
      .query(({ input }) => getVolunteerScheduleConflicts(input.volunteerId, input.scheduleId)),
    alreadyAssigned: adminProcedure
      .input(z.object({ scheduleId: z.number(), volunteerId: z.number() }))
      .query(({ input }) => checkVolunteerAlreadyAssigned(input.scheduleId, input.volunteerId)),
    withConflictInfo: adminProcedure
      .input(z.object({ scheduleId: z.number() }))
      .query(({ input }) => getScheduleWithConflictInfo(input.scheduleId)),
  }),

  // ─── Notifications ──────────────────────────────────────────────────────────
  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role === "admin") return getNotifications();
      const vol = await getVolunteerByUserId(ctx.user.id);
      if (!vol) return [];
      return getNotifications(vol.volunteer.id);
    }),

    send: adminProcedure
      .input(z.object({
        volunteerId: z.number().optional(),
        title: z.string().min(1),
        message: z.string().min(1),
        type: z.enum(["schedule", "event", "general", "checkin"]).optional(),
      }))
      .mutation(({ input }) => createNotification({ ...input, type: input.type ?? "general" })),

    markRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => markNotificationRead(input.id)),

    markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
      const vol = await getVolunteerByUserId(ctx.user.id);
      if (!vol) return;
      return markAllNotificationsRead(vol.volunteer.id);
    }),
  }),

    // ─── Reports ────────────────────────────────────────────────────────────────
  reports: router({
    dashboard: protectedProcedure.query(() => getDashboardStats()),
    presence: adminProcedure.query(() => getPresenceReport()),
    byNetwork: adminProcedure.query(() => getNetworkReport()),
    byMinistry: adminProcedure.query(() => getMinistryReport()),
  }),
  // ─── Bulletin ────────────────────────────────────────────────────────────────
  bulletin: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const posts = await getBulletinPosts();
      if (ctx.user.role === 'admin') return posts;
      return posts.filter((p: any) => p.audience === 'all');
    }),
    create: adminProcedure
      .input(z.object({
        title: z.string().min(1),
        content: z.string().min(1),
        type: z.enum(['general', 'urgent', 'event', 'pastoral']).optional(),
        audience: z.enum(['all', 'admin']).optional(),
      }))
      .mutation(({ input, ctx }) =>
        createBulletinPost({
          title: input.title,
          content: input.content,
          type: input.type ?? 'general',
          audience: input.audience ?? 'all',
          authorId: ctx.user.id,
        })
      ),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteBulletinPost(input.id)),
  }),
  // ─── QR Code ─────────────────────────────────────────────────────────────────
  qrcode: router({
    generate: adminProcedure
      .input(z.object({ eventId: z.number() }))
      .mutation(async ({ input }) => {
        const token = nanoid(32);
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await createQrToken(input.eventId, token, expiresAt);
        const qrDataUrl = await QRCode.toDataURL(`/checkins?qr=${token}`, { width: 300, margin: 2 });
        return { token, qrDataUrl, expiresAt };
      }),
    get: adminProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input }) => {
        const existing = await getQrTokenByEvent(input.eventId);
        if (!existing) return null;
        const qrDataUrl = await QRCode.toDataURL(`/checkins?qr=${existing.token}`, { width: 300, margin: 2 });
        return { ...existing, qrDataUrl };
      }),
    checkinByQr: protectedProcedure
      .input(z.object({
        token: z.string(),
        lat: z.string().optional(),
        lng: z.string().optional(),
        address: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const qr = await getQrTokenByToken(input.token);
        if (!qr) throw new TRPCError({ code: 'NOT_FOUND', message: 'QR Code inválido.' });
        if (qr.qr.expiresAt && new Date(qr.qr.expiresAt) < new Date()) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'QR Code expirado.' });
        }
        const vol = await getVolunteerByUserId(ctx.user.id);
        if (!vol) throw new TRPCError({ code: 'NOT_FOUND', message: 'Voluntário não encontrado.' });
        const existing = await getActiveCheckin(vol.volunteer.id, qr.qr.eventId);
        if (existing) throw new TRPCError({ code: 'CONFLICT', message: 'Você já fez check-in neste evento.' });
        await createCheckinWithGPS({
          volunteerId: vol.volunteer.id,
          eventId: qr.qr.eventId,
          checkinLat: input.lat,
          checkinLng: input.lng,
          checkinAddress: input.address,
        });
        return { success: true, event: qr.event };
      }),
  }),
  // ─── My History ──────────────────────────────────────────────────────────────
  myHistory: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const vol = await getVolunteerByUserId(ctx.user.id);
      if (!vol) return [];
      return getVolunteerPersonalHistory(vol.volunteer.id);
    }),
  }),
  // ─── Birthdays ───────────────────────────────────────────────────────────────
  birthdays: router({
    upcoming: adminProcedure.query(() => getBirthdayVolunteers()),
  }),
});
export type AppRouter = typeof appRouter;
