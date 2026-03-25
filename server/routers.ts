import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { createAuditLog } from "./db";

// ─── Admin Procedure ──────────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.role !== "sub_admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

const superAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Super admin access required" });
  }
  return next({ ctx });
});

// ─── App Router ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Dashboard ─────────────────────────────────────────────────────────────
  dashboard: router({
    stats: adminProcedure.query(async () => {
      return await db.getDashboardStats();
    }),
    topInvestors: adminProcedure.input(z.object({ limit: z.number().default(10) })).query(async ({ input }) => {
      return await db.getTopInvestors(input.limit);
    }),
    investmentTrend: adminProcedure.input(z.object({ days: z.number().default(30) })).query(async ({ input }) => {
      return await db.getInvestmentTrend(input.days);
    }),
    planDistribution: adminProcedure.query(async () => {
      return await db.getPlanDistribution();
    }),
  }),

  // ─── Investment Plans ───────────────────────────────────────────────────────
  plans: router({
    list: adminProcedure.input(z.object({ planType: z.enum(["investment", "staking"]).optional() })).query(async ({ input }) => {
      return await db.getInvestmentPlans(input.planType);
    }),
    create: superAdminProcedure.input(z.object({
      name: z.string().min(1),
      logoUrl: z.string().optional(),
      label: z.string().optional(),
      dailyRate: z.string(),
      minAmount: z.string().optional(),
      maxAmount: z.string().optional(),
      duration: z.number().optional(),
      totalReturn: z.string().optional(),
      description: z.string().optional(),
      urlId: z.string().optional(),
      sortOrder: z.number().default(0),
      isActive: z.boolean().default(true),
      planType: z.enum(["investment", "staking"]).default("investment"),
      tags: z.array(z.string()).optional(),
    })).mutation(async ({ input, ctx }) => {
      await db.createInvestmentPlan({ ...input, tags: input.tags ?? null });
      await createAuditLog({ adminId: ctx.user.id, action: "CREATE_PLAN", targetType: "plan", details: { name: input.name } });
      return { success: true };
    }),
    update: superAdminProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      logoUrl: z.string().optional(),
      label: z.string().optional(),
      dailyRate: z.string().optional(),
      minAmount: z.string().optional(),
      maxAmount: z.string().optional(),
      duration: z.number().optional(),
      totalReturn: z.string().optional(),
      description: z.string().optional(),
      urlId: z.string().optional(),
      sortOrder: z.number().optional(),
      isActive: z.boolean().optional(),
      planType: z.enum(["investment", "staking"]).optional(),
      tags: z.array(z.string()).optional(),
    })).mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      await db.updateInvestmentPlan(id, { ...data, tags: data.tags ?? undefined });
      await createAuditLog({ adminId: ctx.user.id, action: "UPDATE_PLAN", targetType: "plan", targetId: id, details: data });
      return { success: true };
    }),
    delete: superAdminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      await db.deleteInvestmentPlan(input.id);
      await createAuditLog({ adminId: ctx.user.id, action: "DELETE_PLAN", targetType: "plan", targetId: input.id });
      return { success: true };
    }),
  }),

  // ─── Nodes ─────────────────────────────────────────────────────────────────
  nodes: router({
    list: adminProcedure.query(async () => await db.getNodes()),
    earnings: adminProcedure.query(async () => await db.getNodeEarnings()),
    create: superAdminProcedure.input(z.object({
      name: z.string().min(1),
      price: z.string(),
      color: z.string().default("gold"),
      nodeId: z.number().default(1),
      walletAddress: z.string().optional(),
      description: z.string().optional(),
      tags: z.array(z.string()).optional(),
      sortOrder: z.number().default(0),
      isActive: z.boolean().default(true),
    })).mutation(async ({ input, ctx }) => {
      await db.createNode({ ...input, tags: input.tags ?? null });
      await createAuditLog({ adminId: ctx.user.id, action: "CREATE_NODE", targetType: "node", details: { name: input.name } });
      return { success: true };
    }),
    update: superAdminProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      price: z.string().optional(),
      color: z.string().optional(),
      nodeId: z.number().optional(),
      walletAddress: z.string().optional(),
      description: z.string().optional(),
      tags: z.array(z.string()).optional(),
      sortOrder: z.number().optional(),
      isActive: z.boolean().optional(),
    })).mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      await db.updateNode(id, { ...data, tags: data.tags ?? undefined });
      await createAuditLog({ adminId: ctx.user.id, action: "UPDATE_NODE", targetType: "node", targetId: id });
      return { success: true };
    }),
    delete: superAdminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      await db.deleteNode(input.id);
      await createAuditLog({ adminId: ctx.user.id, action: "DELETE_NODE", targetType: "node", targetId: input.id });
      return { success: true };
    }),
  }),

  // ─── Users ─────────────────────────────────────────────────────────────────
  users: router({
    list: adminProcedure.input(z.object({
      search: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    })).query(async ({ input }) => {
      return await db.getAllUsers(input.search, input.page, input.limit);
    }),
    updateKyc: superAdminProcedure.input(z.object({
      userId: z.number(),
      kycStatus: z.enum(["pending", "approved", "rejected", "none"]),
      kycData: z.unknown().optional(),
    })).mutation(async ({ input, ctx }) => {
      await db.updateUserKyc(input.userId, input.kycStatus, input.kycData);
      await createAuditLog({ adminId: ctx.user.id, action: "UPDATE_KYC", targetType: "user", targetId: input.userId, details: { kycStatus: input.kycStatus } });
      return { success: true };
    }),
    updateRole: superAdminProcedure.input(z.object({
      userId: z.number(),
      role: z.enum(["user", "admin", "sub_admin"]),
    })).mutation(async ({ input, ctx }) => {
      await db.updateUserRole(input.userId, input.role);
      await createAuditLog({ adminId: ctx.user.id, action: "UPDATE_ROLE", targetType: "user", targetId: input.userId, details: { role: input.role } });
      return { success: true };
    }),
    referralTree: adminProcedure.input(z.object({ userId: z.number() })).query(async ({ input }) => {
      return await db.getReferralTree(input.userId);
    }),
  }),

  // ─── Content ───────────────────────────────────────────────────────────────
  content: router({
    notices: router({
      list: adminProcedure.query(async () => await db.getNotices()),
      create: superAdminProcedure.input(z.object({
        title: z.string().min(1),
        content: z.string().min(1),
        isActive: z.boolean().default(true),
        isPinned: z.boolean().default(false),
        sortOrder: z.number().default(0),
      })).mutation(async ({ input, ctx }) => {
        await db.createNotice(input);
        await createAuditLog({ adminId: ctx.user.id, action: "CREATE_NOTICE", targetType: "notice", details: { title: input.title } });
        return { success: true };
      }),
      update: superAdminProcedure.input(z.object({
        id: z.number(),
        title: z.string().optional(),
        content: z.string().optional(),
        isActive: z.boolean().optional(),
        isPinned: z.boolean().optional(),
        sortOrder: z.number().optional(),
      })).mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        await db.updateNotice(id, data);
        await createAuditLog({ adminId: ctx.user.id, action: "UPDATE_NOTICE", targetType: "notice", targetId: id });
        return { success: true };
      }),
      delete: superAdminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
        await db.deleteNotice(input.id);
        await createAuditLog({ adminId: ctx.user.id, action: "DELETE_NOTICE", targetType: "notice", targetId: input.id });
        return { success: true };
      }),
    }),
    announcements: router({
      list: adminProcedure.query(async () => await db.getAnnouncements()),
      create: superAdminProcedure.input(z.object({
        title: z.string().min(1),
        content: z.string().min(1),
        type: z.enum(["info", "warning", "success", "urgent"]).default("info"),
        isActive: z.boolean().default(true),
        targetRole: z.enum(["all", "user", "admin"]).default("all"),
      })).mutation(async ({ input, ctx }) => {
        await db.createAnnouncement(input);
        await createAuditLog({ adminId: ctx.user.id, action: "CREATE_ANNOUNCEMENT", targetType: "announcement" });
        return { success: true };
      }),
      update: superAdminProcedure.input(z.object({
        id: z.number(),
        title: z.string().optional(),
        content: z.string().optional(),
        type: z.enum(["info", "warning", "success", "urgent"]).optional(),
        isActive: z.boolean().optional(),
        targetRole: z.enum(["all", "user", "admin"]).optional(),
      })).mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        await db.updateAnnouncement(id, data);
        return { success: true };
      }),
      delete: superAdminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
        await db.deleteAnnouncement(input.id);
        return { success: true };
      }),
    }),
    eventBanners: router({
      list: adminProcedure.query(async () => await db.getEventBanners()),
      create: superAdminProcedure.input(z.object({
        title: z.string().optional(),
        imageUrl: z.string().min(1),
        linkUrl: z.string().optional(),
        isActive: z.boolean().default(true),
        sortOrder: z.number().default(0),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })).mutation(async ({ input }) => {
        await db.createEventBanner(input);
        return { success: true };
      }),
      update: superAdminProcedure.input(z.object({
        id: z.number(),
        title: z.string().optional(),
        imageUrl: z.string().optional(),
        linkUrl: z.string().optional(),
        isActive: z.boolean().optional(),
        sortOrder: z.number().optional(),
      })).mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateEventBanner(id, data);
        return { success: true };
      }),
      delete: superAdminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
        await db.deleteEventBanner(input.id);
        return { success: true };
      }),
    }),
    adImages: router({
      list: adminProcedure.query(async () => await db.getAdImages()),
      create: superAdminProcedure.input(z.object({
        title: z.string().optional(),
        imageUrl: z.string().min(1),
        linkUrl: z.string().optional(),
        position: z.string().default("sidebar"),
        isActive: z.boolean().default(true),
        sortOrder: z.number().default(0),
      })).mutation(async ({ input }) => {
        await db.createAdImage(input);
        return { success: true };
      }),
      update: superAdminProcedure.input(z.object({
        id: z.number(),
        title: z.string().optional(),
        imageUrl: z.string().optional(),
        linkUrl: z.string().optional(),
        position: z.string().optional(),
        isActive: z.boolean().optional(),
        sortOrder: z.number().optional(),
      })).mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateAdImage(id, data);
        return { success: true };
      }),
      delete: superAdminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
        await db.deleteAdImage(input.id);
        return { success: true };
      }),
    }),
  }),

  // ─── Support Tickets ────────────────────────────────────────────────────────
  tickets: router({
    list: adminProcedure.input(z.object({
      status: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    })).query(async ({ input }) => {
      return await db.getSupportTickets(input.status, input.page, input.limit);
    }),
    reply: superAdminProcedure.input(z.object({
      id: z.number(),
      adminReply: z.string().min(1),
    })).mutation(async ({ input, ctx }) => {
      await db.replyToTicket(input.id, input.adminReply, ctx.user.id);
      await createAuditLog({ adminId: ctx.user.id, action: "REPLY_TICKET", targetType: "ticket", targetId: input.id });
      return { success: true };
    }),
    updateStatus: superAdminProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["open", "in_progress", "resolved", "closed"]),
    })).mutation(async ({ input }) => {
      await db.updateTicketStatus(input.id, input.status);
      return { success: true };
    }),
  }),

  // ─── Airdrops ──────────────────────────────────────────────────────────────
  airdrops: router({
    list: adminProcedure.query(async () => await db.getAirdrops()),
    create: superAdminProcedure.input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      tokenSymbol: z.string().min(1),
      totalAmount: z.string(),
      perUserAmount: z.string().optional(),
      maxParticipants: z.number().optional(),
      status: z.enum(["draft", "active", "completed", "cancelled"]).default("draft"),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      requiresKyc: z.boolean().optional(),
      requiresMinInvestment: z.boolean().optional(),
      minInvestmentAmount: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      await db.createAirdrop(input);
      await createAuditLog({ adminId: ctx.user.id, action: "CREATE_AIRDROP", targetType: "airdrop", details: { name: input.name } });
      return { success: true };
    }),
    update: superAdminProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      tokenSymbol: z.string().optional(),
      totalAmount: z.string().optional(),
      perUserAmount: z.string().optional(),
      maxParticipants: z.number().optional(),
      status: z.enum(["draft", "active", "completed", "cancelled"]).optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      requiresKyc: z.boolean().optional(),
      requiresMinInvestment: z.boolean().optional(),
      minInvestmentAmount: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      await db.updateAirdrop(id, data);
      await createAuditLog({ adminId: ctx.user.id, action: "UPDATE_AIRDROP", targetType: "airdrop", targetId: id });
      return { success: true };
    }),
    participants: adminProcedure.input(z.object({ airdropId: z.number() })).query(async ({ input }) => {
      return await db.getAirdropParticipants(input.airdropId);
    }),
    delete: superAdminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      await db.deleteAirdrop(input.id);
      await createAuditLog({ adminId: ctx.user.id, action: "DELETE_AIRDROP", targetType: "airdrop", targetId: input.id });
      return { success: true };
    }),
  }),

  // ─── Referrals ─────────────────────────────────────────────────────────────
  referrals: router({
    topReferrers: adminProcedure.input(z.object({ limit: z.number().default(10) })).query(async ({ input }) => {
      return await db.getTopReferrers(input.limit);
    }),
    tree: adminProcedure.input(z.object({ userId: z.number() })).query(async ({ input }) => {
      return await db.getReferralTree(input.userId);
    }),
    stats: adminProcedure.query(async () => {
      return await db.getReferralStats();
    }),
  }),  // ─── Sub-Admins ───────────────────────────────────────────────────────────────
  subAdmins: router({
    list: superAdminProcedure.query(async () => {
      return await db.getAdminUsers();
    }),
    promote: superAdminProcedure.input(z.object({
      emailOrId: z.string().min(1),
      role: z.enum(["admin", "sub_admin"]),
    })).mutation(async ({ input, ctx }) => {
      const user = await db.findUserByEmailOrId(input.emailOrId);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      await db.updateUserRole(user.id, input.role);
      await createAuditLog({ adminId: ctx.user.id, action: "PROMOTE_ADMIN", targetType: "user", targetId: user.id, details: { role: input.role } });
      return { success: true };
    }),
    demote: superAdminProcedure.input(z.object({ userId: z.number() })).mutation(async ({ input, ctx }) => {
      await db.updateUserRole(input.userId, "user");
      await createAuditLog({ adminId: ctx.user.id, action: "DEMOTE_ADMIN", targetType: "user", targetId: input.userId });
      return { success: true };
    }),
  }),

  // ─── Audit Logs ───────────────────────────────────────────────────────────────
  auditLogs: router({
    list: superAdminProcedure.input(z.object({
      page: z.number().default(1),
      limit: z.number().default(50),
    })).query(async ({ input }) => {
      return await db.getAuditLogs(input.page, input.limit);
    }),
  }),
});

export type AppRouter = typeof appRouter;
