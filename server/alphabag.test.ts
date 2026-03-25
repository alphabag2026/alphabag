import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db module
vi.mock("./db", () => ({
  getDashboardStats: vi.fn().mockResolvedValue({
    totalUsers: 662,
    totalInvestment: "17950.02",
    totalNodeRevenue: "5000.00",
    openTickets: 3,
    totalReferrals: 120,
    recentInvestments: [],
  }),
  getInvestmentPlans: vi.fn().mockResolvedValue([
    { id: 1, name: "Starter Plan", planType: "investment", dailyRate: "0.5", status: "active", sortOrder: 1 },
    { id: 2, name: "Pro Staking", planType: "staking", dailyRate: "1.2", status: "active", sortOrder: 2 },
  ]),
  getNodes: vi.fn().mockResolvedValue([
    { id: 1, name: "Alpha Node", price: "500", color: "#C9A84C", status: "active" },
  ]),
  getAllUsers: vi.fn().mockResolvedValue({ data: [], total: 0 }),
  getNotices: vi.fn().mockResolvedValue([]),
  getAnnouncements: vi.fn().mockResolvedValue([]),
  getEventBanners: vi.fn().mockResolvedValue([]),
  getAdImages: vi.fn().mockResolvedValue([]),
  getSupportTickets: vi.fn().mockResolvedValue({ data: [], total: 0 }),
  getAirdrops: vi.fn().mockResolvedValue([]),
  getTopReferrers: vi.fn().mockResolvedValue([]),
  getReferralStats: vi.fn().mockResolvedValue({
    totalReferrers: 50,
    totalReferrals: 120,
    totalReferralRevenue: 3500,
    avgReferralsPerUser: 2.4,
  }),
  getAdminUsers: vi.fn().mockResolvedValue([
    { id: 1, name: "Admin User", email: "admin@alphabag.net", role: "admin", createdAt: new Date(), updatedAt: new Date() },
  ]),
  getAuditLogs: vi.fn().mockResolvedValue({ data: [], total: 0 }),
  getInvestmentTrend: vi.fn().mockResolvedValue([]),
  getPlanDistribution: vi.fn().mockResolvedValue([]),
  getTopInvestors: vi.fn().mockResolvedValue([]),
  createAuditLog: vi.fn().mockResolvedValue(undefined),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
}));

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-open-id",
      email: "admin@alphabag.net",
      name: "Admin",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("AlphaBag v2 - Auth", () => {
  it("returns null for unauthenticated user", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user for authenticated user", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeTruthy();
    expect(result?.role).toBe("admin");
  });

  it("logout clears session cookie", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
  });
});

describe("AlphaBag v2 - Dashboard", () => {
  it("returns dashboard stats for admin", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const stats = await caller.dashboard.stats();
    expect(stats).toBeTruthy();
    expect(stats?.totalUsers).toBe(662);
  });

  it("rejects dashboard stats for unauthenticated user", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.dashboard.stats()).rejects.toThrow();
  });
});

describe("AlphaBag v2 - Investment Plans", () => {
  it("returns investment plans list", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const plans = await caller.plans.list({ planType: "investment" });
    expect(Array.isArray(plans)).toBe(true);
    expect(plans.length).toBeGreaterThanOrEqual(0);
  });

  it("returns staking plans list", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const plans = await caller.plans.list({ planType: "staking" });
    expect(Array.isArray(plans)).toBe(true);
  });
});

describe("AlphaBag v2 - Nodes", () => {
  it("returns nodes list for admin", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const nodes = await caller.nodes.list();
    expect(Array.isArray(nodes)).toBe(true);
  });
});

describe("AlphaBag v2 - Users", () => {
  it("returns paginated user list for admin", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.users.list({ page: 1, limit: 20 });
    expect(result).toHaveProperty("data");
    expect(result).toHaveProperty("total");
  });
});

describe("AlphaBag v2 - Support Tickets", () => {
  it("returns tickets list for admin", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.tickets.list({ page: 1, limit: 20 });
    expect(result).toHaveProperty("data");
    expect(result).toHaveProperty("total");
  });
});

describe("AlphaBag v2 - Airdrops", () => {
  it("returns airdrops list for admin", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.airdrops.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("AlphaBag v2 - Referrals", () => {
  it("returns referral stats for admin", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const stats = await caller.referrals.stats();
    expect(stats).toHaveProperty("totalReferrers");
    expect(stats).toHaveProperty("totalReferrals");
    expect(stats?.totalReferrers).toBe(50);
  });
});

describe("AlphaBag v2 - Sub-Admins", () => {
  it("returns admin users list for super admin", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const admins = await caller.subAdmins.list();
    expect(Array.isArray(admins)).toBe(true);
    expect(admins.length).toBeGreaterThanOrEqual(0);
  });
});
