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
import { adminAccounts } from "../drizzle/schema";
import { referralMessages as referralMessagesTable } from "../drizzle/schema.js";
import { storagePut } from "./storage";

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
    uploadLogo: superAdminProcedure.input(z.object({
      planId: z.number(),
      base64: z.string(),
      mimeType: z.string().default("image/png"),
      fileName: z.string().default("logo.png"),
    })).mutation(async ({ input, ctx }) => {
      const buffer = Buffer.from(input.base64, "base64");
      const key = `plan-logos/${input.planId}-${Date.now()}-${input.fileName}`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      await db.updateInvestmentPlan(input.planId, { logoUrl: url });
      await createAuditLog({ adminId: ctx.user.id, action: "UPDATE_PLAN", targetType: "plan", targetId: input.planId, details: { logoUrl: url } });
      return { success: true, url };
    }),
  }),

  // ─── Nodes ─────────────────────────────────────────────────────────────────
  nodes: router({
    list: adminProcedure.query(async () => await db.getNodes()),
    earnings: adminProcedure.query(async () => await db.getNodeEarnings()),
    salesStats: adminProcedure.query(async () => await db.getNodeSalesStats()),
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
    purchasers: adminProcedure.input(z.object({ nodeId: z.number() })).query(async ({ input }) => {
      return await db.getNodePurchasers(input.nodeId);
    }),
    // 노드 구매 상태 일괄 업데이트
    bulkUpdateStatus: adminProcedure.input(z.object({
      orderIds: z.array(z.number()),
      status: z.enum(["pending", "confirmed", "cancelled"]),
    })).mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { nodeOrders } = await import("../drizzle/schema");
      const { inArray } = await import("drizzle-orm");
      await database.update(nodeOrders)
        .set({ status: input.status })
        .where(inArray(nodeOrders.id, input.orderIds));
      // Audit Log 기록
      await createAuditLog({
        adminId: ctx.user.id,
        action: `BULK_UPDATE_NODE_ORDERS_${input.status.toUpperCase()}`,
        targetType: "nodeOrder",
        targetId: input.orderIds[0] ?? 0,
        details: `${input.orderIds.length}건 주문 상태 변경: ${input.status} (IDs: ${input.orderIds.slice(0, 5).join(",")}${input.orderIds.length > 5 ? "..." : ""})`
      });
      return { success: true, updated: input.orderIds.length };
    }),
    // BSCScan TxHash 자동 검증
    verifyTxHashes: adminProcedure.input(z.object({
      nodeId: z.number().optional(),
    })).mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { nodeOrders } = await import("../drizzle/schema");
      const { and, isNotNull, ne, inArray } = await import("drizzle-orm");
      // pending 상태이고 txHash가 있는 주문 조회
      const conditions = [ne(nodeOrders.status, "confirmed"), isNotNull(nodeOrders.txHash)];
      if (input.nodeId) conditions.push(ne(nodeOrders.nodeId, -1)); // placeholder
      const pendingOrders = await database.select().from(nodeOrders)
        .where(and(...conditions))
        .limit(50);
      if (pendingOrders.length === 0) return { verified: 0, confirmed: 0, failed: 0, results: [] };
      const results: Array<{ orderId: number; txHash: string; status: string; bscStatus: string }> = [];
      let confirmedCount = 0;
      let failedCount = 0;
      for (const order of pendingOrders) {
        if (!order.txHash) continue;
        try {
          const resp = await fetch(
            `https://api.bscscan.com/api?module=transaction&action=gettxreceiptstatus&txhash=${order.txHash}${process.env.BSCSCAN_API_KEY ? `&apikey=${process.env.BSCSCAN_API_KEY}` : ""}`
          );
          const data = await resp.json() as { status: string; result?: { status: string } };
          const bscStatus = data.result?.status; // "1" = success, "0" = fail
          if (bscStatus === "1") {
            await database.update(nodeOrders)
              .set({ status: "confirmed" })
              .where(inArray(nodeOrders.id, [order.id]));
            confirmedCount++;
            results.push({ orderId: order.id, txHash: order.txHash, status: "confirmed", bscStatus: "success" });
          } else if (bscStatus === "0") {
            failedCount++;
            results.push({ orderId: order.id, txHash: order.txHash, status: "pending", bscStatus: "failed" });
          } else {
            results.push({ orderId: order.id, txHash: order.txHash, status: "pending", bscStatus: "pending" });
          }
        } catch {
          results.push({ orderId: order.id, txHash: order.txHash ?? "", status: "pending", bscStatus: "error" });
        }
      }
      if (confirmedCount > 0) {
        await createAuditLog({
          adminId: ctx.user.id,
          action: "AUTO_VERIFY_TXHASH",
          targetType: "nodeOrder",
          targetId: 0,
          details: `BSCScan 자동 검증: ${confirmedCount}건 confirmed, ${failedCount}건 failed`
        });
      }
      return { verified: pendingOrders.length, confirmed: confirmedCount, failed: failedCount, results };
    }),
  }),

  // ─── Users ─────────────────────────────────────────────────────────────────
  users: router({
    list: adminProcedure.input(z.object({
      search: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
      filter: z.object({
        hasInvestment: z.boolean().optional(),
        hasNode: z.boolean().optional(),
        kycApproved: z.boolean().optional(),
      }).optional(),
    })).query(async ({ input }) => {
      return await db.getAllUsers(input.search, input.page, input.limit, input.filter);
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
    // 사용자 본인 텔레그램 Chat ID 등록
    updateMyTelegramChatId: protectedProcedure.input(z.object({
      chatId: z.string().nullable(),
    })).mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { users } = await import("../drizzle/schema");
      await database.update(users).set({ telegramChatId: input.chatId }).where(eq(users.id, ctx.user.id));
      return { success: true };
    }),

    updateTelegramChatId: adminProcedure.input(z.object({
      userId: z.number(),
      telegramChatId: z.string().nullable(),
    })).mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { users } = await import("../drizzle/schema");
      await database.update(users).set({ telegramChatId: input.telegramChatId }).where(eq(users.id, input.userId));
      await createAuditLog({ adminId: ctx.user.id, action: "UPDATE_TELEGRAM_CHAT_ID", targetType: "user", targetId: input.userId, details: { telegramChatId: input.telegramChatId } });
      return { success: true };
    }),
    broadcastTelegram: adminProcedure.input(z.object({
      message: z.string().min(1).max(4096),
      filter: z.object({
        hasInvestment: z.boolean().optional(),
        hasNode: z.boolean().optional(),
        kycApproved: z.boolean().optional(),
      }).optional(),
      channelChatId: z.string().optional(), // 채널/그룹 Chat ID (예: -1001234567890)
    })).mutation(async ({ input, ctx }) => {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (!botToken) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "TELEGRAM_BOT_TOKEN이 설정되지 않았습니다" });

      const results: Array<{ type: string; chatId: string; success: boolean; error?: string }> = [];
      let successCount = 0;
      let failCount = 0;

      const sendTelegramMessage = async (chatId: string): Promise<boolean> => {
        try {
          const resp = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: input.message, parse_mode: "HTML" }),
          });
          const data = await resp.json() as { ok: boolean; description?: string };
          return data.ok;
        } catch {
          return false;
        }
      };

      // 1. 채널/그룹 발송
      if (input.channelChatId) {
        const ok = await sendTelegramMessage(input.channelChatId);
        results.push({ type: "channel", chatId: input.channelChatId, success: ok });
        if (ok) successCount++; else failCount++;
      }

      // 2. 개별 DM 발송 (telegramChatId가 있는 사용자)
      const database = await getDb();
      if (database) {
        const { users, investments, nodeOrders } = await import("../drizzle/schema");
        const { and, isNotNull, inArray } = await import("drizzle-orm");
        const conditions: any[] = [isNotNull(users.telegramChatId)];
        if (input.filter?.hasInvestment) {
          const investedUserIds = await database.selectDistinct({ userId: investments.userId }).from(investments);
          const ids = investedUserIds.map((r: any) => r.userId);
          if (ids.length > 0) conditions.push(inArray(users.id, ids));
        }
        if (input.filter?.hasNode) {
          const nodeUserIds = await database.selectDistinct({ userId: nodeOrders.userId }).from(nodeOrders);
          const ids = nodeUserIds.map((r: any) => r.userId);
          if (ids.length > 0) conditions.push(inArray(users.id, ids));
        }
        if (input.filter?.kycApproved) {
          const { eq: eqOp } = await import("drizzle-orm");
          conditions.push(eqOp(users.kycStatus, "approved"));
        }
        const targetUsers = await database.select({ id: users.id, telegramChatId: users.telegramChatId }).from(users)
          .where(and(...conditions));
        for (const u of targetUsers) {
          if (!u.telegramChatId) continue;
          const ok = await sendTelegramMessage(u.telegramChatId);
          results.push({ type: "dm", chatId: u.telegramChatId, success: ok });
          if (ok) successCount++; else failCount++;
          // Rate limit 방지 (30 msg/sec)
          await new Promise(r => setTimeout(r, 35));
        }
      }

      await createAuditLog({
        adminId: ctx.user.id,
        action: "BROADCAST_TELEGRAM",
        targetType: "user",
        details: { message: input.message.slice(0, 100), filter: input.filter, successCount, failCount },
      });

      return { success: true, successCount, failCount, total: results.length, results };
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
    treeRecursive: adminProcedure.input(z.object({
      userId: z.number(),
      maxDepth: z.number().min(1).max(5).default(5),
    })).query(async ({ input }) => {
      return await db.getReferralTreeRecursive(input.userId, input.maxDepth);
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
      action: z.string().optional(),
      dateRange: z.enum(["today", "week", "month", "all"]).default("all"),
    })).query(async ({ input }) => {
      const database = await getDb();
      if (!database) return { data: [], total: 0 };
      const { auditLogs, adminAccounts: adminAccountsTable } = await import("../drizzle/schema");
      const { desc, count, like, sql, and, gte } = await import("drizzle-orm");
      const offset = (input.page - 1) * input.limit;

      // 날짜 범위 계산
      let dateFrom: Date | undefined;
      const now = new Date();
      if (input.dateRange === "today") {
        dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (input.dateRange === "week") {
        dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (input.dateRange === "month") {
        dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      const actionCond = input.action ? like(auditLogs.action, `%${input.action}%`) : undefined;
      const dateCond = dateFrom ? gte(auditLogs.createdAt, dateFrom) : undefined;
      const whereClause = actionCond && dateCond ? and(actionCond, dateCond)
        : actionCond ?? dateCond;

      const selectFields = {
        id: auditLogs.id,
        adminId: auditLogs.adminId,
        adminUsername: sql<string>`COALESCE(${adminAccountsTable.username}, CONCAT('#', ${auditLogs.adminId}))`.as('adminUsername'),
        action: auditLogs.action,
        targetType: auditLogs.targetType,
        targetId: auditLogs.targetId,
        details: auditLogs.details,
        createdAt: auditLogs.createdAt,
      };
      const baseQuery = database
        .select(selectFields)
        .from(auditLogs)
        .leftJoin(adminAccountsTable, sql`${adminAccountsTable.id} = ${auditLogs.adminId}`);
      const [data, totalResult] = await Promise.all([
        whereClause
          ? baseQuery.where(whereClause).orderBy(desc(auditLogs.createdAt)).limit(input.limit).offset(offset)
          : baseQuery.orderBy(desc(auditLogs.createdAt)).limit(input.limit).offset(offset),
        whereClause
          ? database.select({ count: count() }).from(auditLogs).where(whereClause)
          : database.select({ count: count() }).from(auditLogs),
      ]);
      return { data, total: totalResult[0]?.count ?? 0 };
    }),
  }),

  // ─── Telegram Schedules (예약 발송) ──────────────────────────────────────────────────────────────────────────────
  telegramSchedules: router({
    list: adminProcedure.query(async () => {
      const database = await getDb();
      if (!database) return [];
      const { telegramSchedules } = await import("../drizzle/schema");
      const { desc } = await import("drizzle-orm");
      return database.select().from(telegramSchedules).orderBy(desc(telegramSchedules.createdAt));
    }),
    create: adminProcedure.input(z.object({
      title: z.string().min(1).max(200),
      message: z.string().min(1).max(4096),
      channelChatId: z.string().optional(),
      filter: z.object({
        hasInvestment: z.boolean().optional(),
        hasNode: z.boolean().optional(),
        kycApproved: z.boolean().optional(),
      }).optional(),
      cronExpression: z.string().min(1),
      timezone: z.string().default("Asia/Seoul"),
    })).mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { telegramSchedules } = await import("../drizzle/schema");
      // 첫 실행 시간 계산
      const { getNextRunAt } = await import("./telegramScheduler");
      const nextRunAt = getNextRunAt(input.cronExpression);
      await database.insert(telegramSchedules).values({
        ...input,
        filter: input.filter ?? null,
        channelChatId: input.channelChatId ?? null,
        createdBy: ctx.user.id,
        nextRunAt,
      });
      await createAuditLog({ adminId: ctx.user.id, action: "CREATE_TELEGRAM_SCHEDULE", targetType: "telegramSchedule", details: { title: input.title, cronExpression: input.cronExpression } });
      return { success: true };
    }),
    update: adminProcedure.input(z.object({
      id: z.number(),
      title: z.string().min(1).max(200).optional(),
      message: z.string().min(1).max(4096).optional(),
      channelChatId: z.string().nullable().optional(),
      filter: z.object({
        hasInvestment: z.boolean().optional(),
        hasNode: z.boolean().optional(),
        kycApproved: z.boolean().optional(),
      }).nullable().optional(),
      cronExpression: z.string().optional(),
      isActive: z.boolean().optional(),
    })).mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { telegramSchedules } = await import("../drizzle/schema");
      const { id, ...data } = input;
      const updateData: any = { ...data };
      if (data.cronExpression) {
        const { getNextRunAt } = await import("./telegramScheduler");
        updateData.nextRunAt = getNextRunAt(data.cronExpression);
      }
      await database.update(telegramSchedules).set(updateData).where(eq(telegramSchedules.id, id));
      await createAuditLog({ adminId: ctx.user.id, action: "UPDATE_TELEGRAM_SCHEDULE", targetType: "telegramSchedule", targetId: id });
      return { success: true };
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { telegramSchedules } = await import("../drizzle/schema");
      await database.delete(telegramSchedules).where(eq(telegramSchedules.id, input.id));
      await createAuditLog({ adminId: ctx.user.id, action: "DELETE_TELEGRAM_SCHEDULE", targetType: "telegramSchedule", targetId: input.id });
      return { success: true };
    }),
    // 즉시 발송 (테스트용)
    runNow: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { telegramSchedules } = await import("../drizzle/schema");
      const schedules = await database.select().from(telegramSchedules).where(eq(telegramSchedules.id, input.id));
      if (!schedules[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Schedule not found" });
      const schedule = schedules[0];
      // 실제 발송 로직 (broadcastTelegram과 동일)
      const token = process.env.TELEGRAM_BOT_TOKEN;
      if (!token) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "TELEGRAM_BOT_TOKEN not set" });
      const { users: usersTable } = await import("../drizzle/schema");
      const { isNotNull, and } = await import("drizzle-orm");
      const filter = schedule.filter as any;
      let query = database.select({ id: usersTable.id, telegramChatId: usersTable.telegramChatId }).from(usersTable).where(isNotNull(usersTable.telegramChatId));
      const allUsers = await query;
      let successCount = 0;
      let failCount = 0;
      // 채널 발송
      if (schedule.channelChatId) {
        try {
          const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: schedule.channelChatId, text: schedule.message, parse_mode: "HTML" }),
          });
          if (r.ok) successCount++; else failCount++;
        } catch { failCount++; }
      }
      // 개별 DM
      for (const u of allUsers) {
        if (!u.telegramChatId) continue;
        try {
          const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: u.telegramChatId, text: schedule.message, parse_mode: "HTML" }),
          });
          if (r.ok) successCount++; else failCount++;
          await new Promise(res => setTimeout(res, 50));
        } catch { failCount++; }
      }
      // lastRunAt, lastResult 업데이트
      await database.update(telegramSchedules).set({
        lastRunAt: new Date(),
        lastResult: JSON.stringify({ successCount, failCount, total: successCount + failCount, runBy: `admin#${ctx.user.id}` }),
      }).where(eq(telegramSchedules.id, input.id));
      await createAuditLog({ adminId: ctx.user.id, action: "RUN_TELEGRAM_SCHEDULE", targetType: "telegramSchedule", targetId: input.id, details: { successCount, failCount, title: schedule.title } });
      return { success: true, successCount, failCount };
    }),
  }),

  // ─── Market Data (금융 데이터) ─────────────────────────────────────────────────
  market: router({
    // 암호화폐 가격 및 환율 데이터
    prices: publicProcedure.query(async () => {
      try {
        const cryptoRes = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin,tether,solana&vs_currencies=usd,krw&include_24hr_change=true",
          { signal: AbortSignal.timeout(5000) }
        );
        const cryptoData = cryptoRes.ok ? await cryptoRes.json() : null;

        // 환율 데이터 (USD 기준)
        const fxRes = await fetch(
          "https://api.exchangerate-api.com/v4/latest/USD",
          { signal: AbortSignal.timeout(5000) }
        );
        const fxData = fxRes.ok ? await fxRes.json() : null;

        return {
          crypto: {
            BTC: {
              usd: cryptoData?.bitcoin?.usd ?? 0,
              krw: cryptoData?.bitcoin?.krw ?? 0,
              change24h: cryptoData?.bitcoin?.usd_24h_change ?? 0,
            },
            ETH: {
              usd: cryptoData?.ethereum?.usd ?? 0,
              krw: cryptoData?.ethereum?.krw ?? 0,
              change24h: cryptoData?.ethereum?.usd_24h_change ?? 0,
            },
            BNB: {
              usd: cryptoData?.binancecoin?.usd ?? 0,
              krw: cryptoData?.binancecoin?.krw ?? 0,
              change24h: cryptoData?.binancecoin?.usd_24h_change ?? 0,
            },
            USDT: {
              usd: cryptoData?.tether?.usd ?? 1,
              krw: cryptoData?.tether?.krw ?? 1380,
              change24h: cryptoData?.tether?.usd_24h_change ?? 0,
            },
            SOL: {
              usd: cryptoData?.solana?.usd ?? 0,
              krw: cryptoData?.solana?.krw ?? 0,
              change24h: cryptoData?.solana?.usd_24h_change ?? 0,
            },
          },
          fx: {
            KRW: fxData?.rates?.KRW ?? 1380,
            JPY: fxData?.rates?.JPY ?? 150,
            EUR: fxData?.rates?.EUR ?? 0.92,
            CNY: fxData?.rates?.CNY ?? 7.2,
            GBP: fxData?.rates?.GBP ?? 0.79,
          },
          updatedAt: new Date().toISOString(),
        };
      } catch {
        // 폴백 데이터
        return {
          crypto: {
            BTC: { usd: 87000, krw: 120000000, change24h: 1.2 },
            ETH: { usd: 3200, krw: 4416000, change24h: 0.8 },
            BNB: { usd: 580, krw: 800400, change24h: -0.5 },
            USDT: { usd: 1, krw: 1380, change24h: 0 },
            SOL: { usd: 145, krw: 200100, change24h: 2.1 },
          },
          fx: { KRW: 1380, JPY: 150, EUR: 0.92, CNY: 7.2, GBP: 0.79 },
          updatedAt: new Date().toISOString(),
        };
      }
    }),
    // 급등 토큰 (시가요액 상위 50개 중 24h +5% 이상)
    trending: publicProcedure.query(async () => {
      try {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=gecko_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h",
          { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000) }
        );
        if (!res.ok) throw new Error("CoinGecko API error");
        const data: any[] = await res.json();
        return data
          .filter((c: any) => (c.price_change_percentage_24h ?? 0) > 5)
          .sort((a: any, b: any) => b.price_change_percentage_24h - a.price_change_percentage_24h)
          .slice(0, 20)
          .map((c: any) => ({
            id: c.id,
            symbol: c.symbol.toUpperCase(),
            name: c.name,
            image: c.image,
            currentPrice: c.current_price,
            priceChange24h: c.price_change_percentage_24h,
            marketCap: c.market_cap,
            volume24h: c.total_volume,
            exchange: "CoinGecko",
          }));
      } catch {
        return [];
      }
    }),
    // 트렌딩 코인 (CoinGecko trending)
    trendingCoins: publicProcedure.query(async () => {
      try {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/search/trending",
          { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000) }
        );
        if (!res.ok) throw new Error("CoinGecko API error");
        const data: any = await res.json();
        return (data.coins || []).slice(0, 10).map((c: any) => ({
          id: c.item.id,
          symbol: c.item.symbol.toUpperCase(),
          name: c.item.name,
          image: c.item.small,
          priceChange24h: c.item.data?.price_change_percentage_24h?.usd ?? 0,
          currentPrice: c.item.data?.price ?? 0,
          volume24h: c.item.data?.total_volume ?? "",
          marketCap: c.item.data?.market_cap ?? "",
          exchange: "Trending",
        }));
      } catch {
        return [];
      }
    }),
  }),

  // ─── User Favorites (즐겨찾기) ────────────────────────────────────────────
  favorites: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const database = await getDb();
      if (!database) return [];
      const { userFavorites } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      return database.select().from(userFavorites).where(eq(userFavorites.userId, ctx.user.id));
    }),
    toggle: protectedProcedure.input(z.object({ planId: z.number() })).mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { userFavorites } = await import("../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      const existing = await database.select().from(userFavorites)
        .where(and(eq(userFavorites.userId, ctx.user.id), eq(userFavorites.planId, input.planId)))
        .limit(1);
      if (existing.length > 0) {
        await database.delete(userFavorites).where(and(eq(userFavorites.userId, ctx.user.id), eq(userFavorites.planId, input.planId)));
        return { favorited: false };
      } else {
        await database.insert(userFavorites).values({ userId: ctx.user.id, planId: input.planId });
        return { favorited: true };
      }
    }),
  }),

  // ─── Media Assets (관리자 이미지 업로드) ──────────────────────────────────
  media: router({
    list: adminProcedure.query(async () => {
      const database = await getDb();
      if (!database) return [];
      const { mediaAssets } = await import("../drizzle/schema");
      const { desc } = await import("drizzle-orm");
      return database.select().from(mediaAssets).orderBy(desc(mediaAssets.createdAt));
    }),
    upload: adminProcedure.input(z.object({
      filename: z.string(),
      base64: z.string(),
      mimeType: z.string(),
    })).mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { storagePut } = await import("../server/storage");
      const { mediaAssets } = await import("../drizzle/schema");
      const buf = Buffer.from(input.base64, "base64");
      const suffix = Date.now().toString(36);
      const fileKey = `media/${suffix}-${input.filename}`;
      const { url } = await storagePut(fileKey, buf, input.mimeType);
      await database.insert(mediaAssets).values({
        filename: input.filename,
        url,
        fileKey,
        mimeType: input.mimeType,
        size: buf.length,
        uploadedBy: ctx.user.id,
      });
      return { url, fileKey };
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { mediaAssets } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      await database.delete(mediaAssets).where(eq(mediaAssets.id, input.id));
      return { success: true };
    }),
  }),

  // ─── Airdrops (Public 섯션 지원) ──────────────────────────────────────────────────
  airdropSection: router({
    list: publicProcedure.query(async () => {
      const database = await getDb();
      if (!database) return [];
      const { airdrops } = await import("../drizzle/schema");
      const { eq, desc } = await import("drizzle-orm");
      return database.select().from(airdrops)
        .where(eq(airdrops.status, "active"))
        .orderBy(desc(airdrops.sortOrder), desc(airdrops.createdAt));
    }),
  }),

  // ─── Public API (no auth required)) ───────────────────────────────────────────
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

    // 관리자 계정 목록
    list: adminProcedure.query(async () => {
      return db.getAllAdminAccounts();
    }),

    // 관리자 계정 생성
    create: adminProcedure.input(z.object({
      username: z.string().min(3).max(64),
      password: z.string().min(6),
      role: z.enum(["admin", "sub_admin"]).default("sub_admin"),
    })).mutation(async ({ input }) => {
      const existing = await db.getAdminAccountByUsername(input.username);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Username already exists" });
      const hash = await bcrypt.hash(input.password, 10);
      await db.createAdminAccount(input.username, hash, input.role);
      return { success: true };
    }),

    // 비밀번호 변경
    changePassword: adminProcedure.input(z.object({
      id: z.number(),
      newPassword: z.string().min(6),
    })).mutation(async ({ input }) => {
      const hash = await bcrypt.hash(input.newPassword, 10);
      await db.updateAdminPassword(input.id, hash);
      return { success: true };
    }),

    // 활성/비활성 토글
    toggleActive: adminProcedure.input(z.object({
      id: z.number(),
      isActive: z.boolean(),
    })).mutation(async ({ input }) => {
      await db.toggleAdminActive(input.id, input.isActive);
      return { success: true };
    }),

    // 계정 삭제
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteAdminAccount(input.id);
      return { success: true };
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
