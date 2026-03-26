import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ENV } from "./_core/env";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { getDb } from "./db";
import { createAuditLog } from "./db";
import { referralMessages as referralMessagesTable } from "../drizzle/schema.js";

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

  // ─── Public API (no auth required) ───────────────────────────────────────────
  public: router({
    // 공개 투자 플랜 목록
    plans: publicProcedure.input(z.object({
      planType: z.enum(["investment", "staking", "golden", "self", "node"]).optional(),
      collectionType: z.enum(["golden", "self", "node"]).optional(),
      limit: z.number().optional(),
      highlightOnly: z.boolean().optional(),
    })).query(async ({ input }) => {
      return await db.getInvestmentPlans(input.planType, input.collectionType, input.limit, input.highlightOnly);
    }),
    // 골든 컬렉션 (하이라이트)
    goldenPlans: publicProcedure.query(async () => {
      return await db.getInvestmentPlans(undefined, "golden");
    }),
    // 셀프 컬렉션 (하이라이트)
    selfPlans: publicProcedure.query(async () => {
      return await db.getInvestmentPlans(undefined, "self");
    }),
    // 노드 컬렉션 (하이라이트)
    nodePlans: publicProcedure.query(async () => {
      return await db.getInvestmentPlans(undefined, "node");
    }),
    // 리더 컬렉션
    leaderPlans: publicProcedure.query(async () => {
      return await db.getInvestmentPlans(undefined, "leader");
    }),
    // 밈토큰 컬렉션
    memePlans: publicProcedure.query(async () => {
      return await db.getInvestmentPlans(undefined, "meme");
    }),
    // 인플루언서 컬렉션
    influencerPlans: publicProcedure.query(async () => {
      return await db.getInvestmentPlans(undefined, "influencer");
    }),
    // 추천글 목록
    referralMessages: publicProcedure.query(async () => {
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      return await drizzleDb.select().from(referralMessagesTable).where(eq(referralMessagesTable.isActive, true)).orderBy(referralMessagesTable.sortOrder);
    }),
    // 단일 플랜 상세
    planDetail: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return await db.getInvestmentPlanById(input.id);
    }),

    // 공개 노드 목록
    nodes: publicProcedure.query(async () => {
      return await db.getNodes();
    }),

    // 공개 공지사항
    notices: publicProcedure.query(async () => {
      const notices = await db.getNotices();
      return notices.filter((n: { isActive: boolean }) => n.isActive);
    }),

    // 공개 이벤트 배너
    banners: publicProcedure.query(async () => {
      return await db.getEventBanners();
    }),

    // 추천 코드 검증
    validateReferral: publicProcedure.input(z.object({
      code: z.string().min(1),
    })).query(async ({ input }) => {
      const user = await db.getUserByReferralCode(input.code);
      if (!user) return { valid: false, referrer: null };
      return { valid: true, referrer: { name: user.name, code: user.referralCode } };
    }),
  }),

  // ─── User API (auth required) ─────────────────────────────────────────────────
  user: router({
    // 내 프로필 조회
    profile: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserById(ctx.user.id);
    }),

    // 지갑 주소 업데이트
    updateWallet: protectedProcedure.input(z.object({
      walletAddress: z.string().min(1),
    })).mutation(async ({ input, ctx }) => {
      await db.updateUserWallet(ctx.user.id, input.walletAddress);
      return { success: true };
    }),

    // 추천 코드 생성
    generateReferralCode: protectedProcedure.mutation(async ({ ctx }) => {
      const code = await db.generateUserReferralCode(ctx.user.id);
      return { code };
    }),

    // 추천인 등록
    registerReferral: protectedProcedure.input(z.object({
      referralCode: z.string().min(1),
    })).mutation(async ({ input, ctx }) => {
      const referrer = await db.getUserByReferralCode(input.referralCode);
      if (!referrer) throw new TRPCError({ code: "NOT_FOUND", message: "Invalid referral code" });
      if (referrer.id === ctx.user.id) throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot refer yourself" });
      await db.setUserReferral(ctx.user.id, input.referralCode);
      return { success: true, referrer: { name: referrer.name } };
    }),

    // 내 투자 내역
    investments: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserInvestments(ctx.user.id);
    }),

    // 내 노드 구매 내역
    nodeOrders: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserNodeOrders(ctx.user.id);
    }),

    // 내 추천 현황
    referralStats: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserReferralStats(ctx.user.id);
    }),

    // 노드 구매 신청
    purchaseNode: protectedProcedure.input(z.object({
      nodeId: z.number(),
      quantity: z.number().min(1).default(1),
      txHash: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const node = await db.getNodeById(input.nodeId);
      if (!node) throw new TRPCError({ code: "NOT_FOUND", message: "Node not found" });
      await db.createNodeOrder({
        userId: ctx.user.id,
        nodeId: input.nodeId,
        quantity: input.quantity,
        totalAmount: String(Number(node.price) * input.quantity),
        txHash: input.txHash ?? null,
        status: "pending",
      });
      return { success: true };
    }),

    // 투자 신청
    invest: protectedProcedure.input(z.object({
      planId: z.number(),
      amount: z.string(),
      txHash: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const plan = await db.getInvestmentPlanById(input.planId);
      if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found" });
      await db.createInvestment({
        userId: ctx.user.id,
        planId: input.planId,
        amount: input.amount,
        status: "active",
      });
      return { success: true };
    }),

    // 지원 티켓 생성
    createTicket: protectedProcedure.input(z.object({
      subject: z.string().min(1),
      message: z.string().min(1),
      category: z.string().default("general"),
    })).mutation(async ({ input, ctx }) => {
      await db.createSupportTicket({
        userId: ctx.user.id,
        subject: input.subject,
        message: input.message,
        category: input.category,
        status: "open",
        priority: "medium",
      });
      return { success: true };
    }),

    // 내 지원 티켓 목록
    tickets: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserTickets(ctx.user.id);
    }),
  }),

  // ─── Admin Auth (ID/PW) ───────────────────────────────────────────────────────
  adminAuth: router({
    login: publicProcedure.input(z.object({
      username: z.string().min(1),
      password: z.string().min(1),
    })).mutation(async ({ input, ctx }) => {
      const account = await db.getAdminAccountByUsername(input.username);
      if (!account || !account.isActive) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
      }
      const valid = await bcrypt.compare(input.password, account.passwordHash);
      if (!valid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
      }
      // Update last login
      await db.updateAdminLastLogin(account.id);
      // Issue JWT token
      const secret = process.env.JWT_SECRET ?? "alphabag-admin-secret";
      const token = jwt.sign(
        { id: account.id, username: account.username, role: account.role },
        secret,
        { expiresIn: "24h" }
      );
      ctx.res.cookie("admin_token", token, {
        httpOnly: true,
        secure: ctx.req.protocol === "https",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000,
        path: "/",
      });
      return { success: true, role: account.role, username: account.username };
    }),

    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie("admin_token", { path: "/" });
      return { success: true };
    }),

    me: publicProcedure.query(({ ctx }) => {
      const token = ctx.req.cookies?.admin_token;
      if (!token) return null;
      try {
        const secret = process.env.JWT_SECRET ?? "alphabag-admin-secret";
        const payload = jwt.verify(token, secret) as { id: number; username: string; role: string };
        return payload;
      } catch {
        return null;
      }
    }),
  }),

  notifications: router({
    list: adminProcedure.query(async () => {
      const database = await getDb();
      if (!database) return [];
      const { notifications } = await import("../drizzle/schema");
      return database.select().from(notifications).orderBy(notifications.createdAt);
    }),
    create: adminProcedure.input(z.object({
      title: z.string(),
      message: z.string(),
      type: z.string().default("info"),
      targetRole: z.string().default("all"),
    })).mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { notifications } = await import("../drizzle/schema");
      await database.insert(notifications).values(input);
      return { success: true };
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { notifications } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      await database.delete(notifications).where(eq(notifications.id, input.id));
      return { success: true };
    }),
  }),
});
export type AppRouter = typeof appRouter;
