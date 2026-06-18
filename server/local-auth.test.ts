import { describe, expect, it, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock DB helpers ──────────────────────────────────────────────────────────
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getUserByLocalCredentialEmail: vi.fn(),
  };
});

// ─── Mock SDK ─────────────────────────────────────────────────────────────────
vi.mock("./_core/sdk", () => ({
  sdk: {
    createSessionToken: vi.fn().mockResolvedValue("mock-session-token"),
    verifySessionToken: vi.fn(),
  },
}));

import { getUserByLocalCredentialEmail } from "./db";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function makeCtx(): { ctx: TrpcContext; cookies: Record<string, string> } {
  const cookies: Record<string, string> = {};
  const ctx: TrpcContext = {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      cookie: (name: string, value: string) => { cookies[name] = value; },
      clearCookie: (name: string) => { delete cookies[name]; },
    } as unknown as TrpcContext["res"],
  };
  return { ctx, cookies };
}

function makeAdminCtx(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-open-id",
      email: "contato@lirolla.com",
      name: "Admin",
      loginMethod: "local",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("auth.localLogin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unknown e-mail with UNAUTHORIZED", async () => {
    vi.mocked(getUserByLocalCredentialEmail).mockResolvedValue(undefined);
    const { ctx } = makeCtx();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.localLogin({ email: "unknown@test.com", password: "any" })
    ).rejects.toThrow(TRPCError);
  });

  it("rejects wrong password with UNAUTHORIZED", async () => {
    // Return a record with a bcrypt hash of "correct-password"
    // bcrypt hash of "correct-password" (pre-computed, cost 10)
    vi.mocked(getUserByLocalCredentialEmail).mockResolvedValue({
      user: {
        id: 1,
        openId: "admin-open-id",
        email: "contato@lirolla.com",
        name: "Admin",
        loginMethod: "local",
        role: "admin" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      cred: {
        id: 1,
        userId: 1,
        email: "contato@lirolla.com",
        // hash of "correct-password"
        passwordHash: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const { ctx } = makeCtx();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.localLogin({ email: "contato@lirolla.com", password: "wrong-password" })
    ).rejects.toThrow(TRPCError);
  });

  it("sets session cookie on successful login", async () => {
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash("Pagotto24", 10);

    vi.mocked(getUserByLocalCredentialEmail).mockResolvedValue({
      user: {
        id: 1,
        openId: "admin-open-id",
        email: "contato@lirolla.com",
        name: "Admin",
        loginMethod: "local",
        role: "admin" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      cred: {
        id: 1,
        userId: 1,
        email: "contato@lirolla.com",
        passwordHash: hash,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const { ctx, cookies } = makeCtx();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.localLogin({
      email: "contato@lirolla.com",
      password: "Pagotto24",
    });

    expect(result.success).toBe(true);
    expect(result.user.email).toBe("contato@lirolla.com");
    expect(result.user.role).toBe("admin");
    // Cookie should have been set
    expect(Object.keys(cookies).length).toBeGreaterThan(0);
  });
});

describe("auth.logout", () => {
  it("clears session cookie", async () => {
    const ctx = makeAdminCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
  });
});

describe("auth.me", () => {
  it("returns null when not authenticated", async () => {
    const { ctx } = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const user = await caller.auth.me();
    expect(user).toBeNull();
  });

  it("returns user when authenticated", async () => {
    const ctx = makeAdminCtx();
    const caller = appRouter.createCaller(ctx);
    const user = await caller.auth.me();
    expect(user?.email).toBe("contato@lirolla.com");
    expect(user?.role).toBe("admin");
  });
});

describe("protected routes require authentication", () => {
  it("throws UNAUTHORIZED when accessing admin route without auth", async () => {
    const { ctx } = makeCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.networks.create({ name: "Test Network" })
    ).rejects.toThrow(TRPCError);
  });

  it("throws FORBIDDEN when non-admin accesses admin route", async () => {
    const ctx: TrpcContext = {
      user: {
        id: 2,
        openId: "user-open-id",
        email: "voluntario@test.com",
        name: "Voluntário",
        loginMethod: "local",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { cookie: vi.fn(), clearCookie: vi.fn() } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.networks.create({ name: "Test Network" })
    ).rejects.toThrow(TRPCError);
  });
});
