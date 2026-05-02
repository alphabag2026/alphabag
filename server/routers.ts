import { TRPCError } from "@trpc/server";
import { invokeLLM } from "./_core/llm";
import { translateTitleContent, translateToAllLanguages, translateQuestionAnswer } from "./translate";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ENV } from "./_core/env";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
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
import { notifyOwner } from "./_core/notification";

// ─── Admin Procedure ──────────────────────────────────────────────────────────
// Helper: verify admin_token cookie and return payload
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach(part => {
    const [key, ...vals] = part.trim().split("=");
    if (key) cookies[key.trim()] = decodeURIComponent(vals.join("=").trim());
  });
  return cookies;
}
function verifyAdminToken(req: any): { id: number; username: string; role: string } | null {
  try {
    // Try req.cookies first (if cookie-parser is installed), then parse raw header
    const cookieObj = req.cookies ?? parseCookies(req.headers?.cookie ?? "");
    const token = cookieObj?.admin_token;
    if (!token) return null;
    const secret = process.env.JWT_SECRET ?? "alphabag-admin-secret";
    return jwt.verify(token, secret) as { id: number; username: string; role: string };
  } catch {
    return null;
  }
}
const adminProcedure = publicProcedure.use(({ ctx, next }) => {
  // Accept either Manus OAuth user with admin role OR admin_token cookie
  const adminToken = verifyAdminToken(ctx.req);
  if (adminToken && (adminToken.role === "admin" || adminToken.role === "sub_admin")) {
    // admin_token 인증 시 ctx.user에 adminToken 정보 주입
    const adminUser = ctx.user ?? { id: adminToken.id, role: adminToken.role as any, openId: "", name: adminToken.username, email: "" };
    return next({ ctx: { ...ctx, user: adminUser } });
  }
  if (ctx.user && (ctx.user.role === "admin" || ctx.user.role === "sub_admin")) {
    return next({ ctx });
  }
  throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
});

const superAdminProcedure = publicProcedure.use(({ ctx, next }) => {
  const adminToken = verifyAdminToken(ctx.req);
  if (adminToken && adminToken.role === "admin") {
    // admin_token 인증 시 ctx.user에 adminToken 정보 주입
    const adminUser = ctx.user ?? { id: adminToken.id, role: adminToken.role as any, openId: "", name: adminToken.username, email: "" };
    return next({ ctx: { ...ctx, user: adminUser } });
  }
  if (ctx.user && ctx.user.role === "admin") {
    return next({ ctx });
  }
  throw new TRPCError({ code: "FORBIDDEN", message: "Super admin access required" });
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
    // EVM 지갑 로그인 (서명 검증)
    walletLogin: publicProcedure.input(z.object({
      walletAddress: z.string().min(10),
      signature: z.string().min(1),
      message: z.string().min(1),
    })).mutation(async ({ input, ctx }) => {
      const { ethers } = await import('ethers');
      let recoveredAddress: string;
      try {
        recoveredAddress = ethers.verifyMessage(input.message, input.signature);
      } catch {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid signature' });
      }
      if (recoveredAddress.toLowerCase() !== input.walletAddress.toLowerCase()) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Signature mismatch' });
      }
      const userId = await db.createUserByWallet(input.walletAddress);
      const { SignJWT } = await import('jose');
      const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? 'alphabag-secret-key');
      const token = await new SignJWT({ userId })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('30d')
        .sign(secret);
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });
      const user = await db.getUserById(userId);
      return { success: true, user };
    }),
    // TronLink 지갑 로그인 (주소만으로)
    tronLogin: publicProcedure.input(z.object({
      walletAddress: z.string().min(10),
    })).mutation(async ({ input, ctx }) => {
      if (!input.walletAddress.startsWith('T')) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid Tron address' });
      }
      const userId = await db.createUserByWallet(input.walletAddress);
      const { SignJWT } = await import('jose');
      const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? 'alphabag-secret-key');
      const token = await new SignJWT({ userId })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('30d')
        .sign(secret);
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });
      const user = await db.getUserById(userId);
      return { success: true, user };
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
      onepageUrl: z.string().optional(),
      sortOrder: z.number().default(0),
      isActive: z.boolean().default(true),
      isMLM: z.boolean().default(false),
      planType: z.enum(["investment", "staking"]).default("investment"),
      tags: z.array(z.string()).optional(),
    })).mutation(async ({ input, ctx }) => {
      await db.createInvestmentPlan({ ...input, tags: input.tags ?? null });
      await createAuditLog({ adminId: ctx.user!.id, action: "CREATE_PLAN", targetType: "plan", details: { name: input.name } });
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
      onepageUrl: z.string().optional(),
      sortOrder: z.number().optional(),
      isActive: z.boolean().optional(),
      isMLM: z.boolean().optional(),
      planType: z.enum(["investment", "staking"]).optional(),
      tags: z.array(z.string()).optional(),
    })).mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      await db.updateInvestmentPlan(id, { ...data, tags: data.tags ?? undefined });
      await createAuditLog({ adminId: ctx.user!.id, action: "UPDATE_PLAN", targetType: "plan", targetId: id, details: data });
      return { success: true };
    }),
    delete: superAdminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      await db.deleteInvestmentPlan(input.id);
      await createAuditLog({ adminId: ctx.user!.id, action: "DELETE_PLAN", targetType: "plan", targetId: input.id });
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
      await createAuditLog({ adminId: ctx.user!.id, action: "UPDATE_PLAN", targetType: "plan", targetId: input.planId, details: { logoUrl: url } });
      return { success: true, url };
    }),
    analyzeFile: adminProcedure.input(z.object({
      base64: z.string(),
      mimeType: z.string(),
      fileName: z.string(),
      extraPrompt: z.string().optional(),
    })).mutation(async ({ input }) => {
      // Upload file to S3 first for LLM access
      const buffer = Buffer.from(input.base64, "base64");
      const key = `plan-analysis/${Date.now()}-${input.fileName}`;
      const { url: fileUrl } = await storagePut(key, buffer, input.mimeType);

      const isImage = input.mimeType.startsWith("image/");
      const isPdf = input.mimeType === "application/pdf";

      const systemPrompt = `You are an expert at analyzing blockchain/crypto project documents (PPT, PDF, one-page images).
Extract the following information and return as JSON:
- name: Project name (string)
- description: Short project description in Korean (2-3 sentences, string)
- revenueModel: Revenue model explanation in Korean (2-4 sentences describing how the project generates revenue, string)
- logoUrl: Logo image URL if visible/extractable (string or null)
- telegramUrl: Telegram community URL (string or null, must start with t.me or telegram.me or https://t.me)
- youtubeUrl: YouTube channel or community URL (string or null)
- twitterUrl: Twitter/X URL (string or null)
- websiteUrl: Official website URL (string or null)
- tags: Array of relevant tags (max 5, e.g. ["DeFi", "NFT", "GameFi"])
If information is not found, use null. Always respond with valid JSON only.`;

      const userContent: any[] = [];

      if (input.extraPrompt) {
        userContent.push({ type: "text", text: `Additional context from user: ${input.extraPrompt}` });
      }

      if (isImage) {
        userContent.push({ type: "image_url", image_url: { url: fileUrl, detail: "high" } });
        userContent.push({ type: "text", text: "Analyze this project image and extract all information as JSON." });
      } else if (isPdf) {
        userContent.push({ type: "file_url", file_url: { url: fileUrl, mime_type: "application/pdf" as any } });
        userContent.push({ type: "text", text: "Analyze this project document and extract all information as JSON." });
      } else {
        // PPT/PPTX or other - extract text first using officeparser
        try {
          const officeParserModule = await import("officeparser");
          const officeParser = (officeParserModule as any).default ?? officeParserModule;
          const extractedText = await new Promise<string>((resolve, reject) => {
            officeParser.parseOffice(buffer, (data: any, err: any) => {
              if (err) reject(err);
              else resolve(typeof data === "string" ? data : JSON.stringify(data));
            }, { outputErrorToConsole: false });
          });
          if (extractedText && extractedText.trim()) {
            userContent.push({ type: "text", text: `Document text content:\n\n${extractedText.slice(0, 8000)}\n\nExtract all project information as JSON.` });
          } else {
            userContent.push({ type: "text", text: `Analyze the project document at: ${fileUrl}\nExtract all project information as JSON.` });
          }
        } catch {
          userContent.push({ type: "text", text: `Analyze the project document at: ${fileUrl}\nExtract all project information as JSON.` });
        }
      }

      const llmMessages: import("./_core/llm").Message[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent as import("./_core/llm").MessageContent[] },
      ];
      const response = await invokeLLM({
        messages: llmMessages,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "project_info",
            strict: true,
            schema: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                revenueModel: { type: "string" },
                logoUrl: { anyOf: [{ type: "string" }, { type: "null" }] },
                telegramUrl: { anyOf: [{ type: "string" }, { type: "null" }] },
                youtubeUrl: { anyOf: [{ type: "string" }, { type: "null" }] },
                twitterUrl: { anyOf: [{ type: "string" }, { type: "null" }] },
                websiteUrl: { anyOf: [{ type: "string" }, { type: "null" }] },
                tags: { type: "array", items: { type: "string" } },
              },
              required: ["name", "description", "revenueModel", "logoUrl", "telegramUrl", "youtubeUrl", "twitterUrl", "websiteUrl", "tags"],
              additionalProperties: false,
            },
          },
        },
      });

      const rawContent = response.choices[0]?.message?.content;
      const content = typeof rawContent === "string" ? rawContent : null;
      if (!content) throw new Error("AI 분석 결과가 없습니다.");

      let parsed: any;
      try {
        parsed = JSON.parse(content);
      } catch {
        throw new Error("AI 응답 파싱 실패: " + content);
      }

      return {
        success: true,
        fileUrl,
        data: parsed,
      };
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
      await createAuditLog({ adminId: ctx.user!.id, action: "CREATE_NODE", targetType: "node", details: { name: input.name } });
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
      await createAuditLog({ adminId: ctx.user!.id, action: "UPDATE_NODE", targetType: "node", targetId: id });
      return { success: true };
    }),
    delete: superAdminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      await db.deleteNode(input.id);
      await createAuditLog({ adminId: ctx.user!.id, action: "DELETE_NODE", targetType: "node", targetId: input.id });
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
        adminId: ctx.user!.id,
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
          adminId: ctx.user!.id,
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
      await createAuditLog({ adminId: ctx.user!.id, action: "UPDATE_KYC", targetType: "user", targetId: input.userId, details: { kycStatus: input.kycStatus } });
      return { success: true };
    }),
    updateRole: superAdminProcedure.input(z.object({
      userId: z.number(),
      role: z.enum(["user", "admin", "sub_admin"]),
    })).mutation(async ({ input, ctx }) => {
      await db.updateUserRole(input.userId, input.role);
      await createAuditLog({ adminId: ctx.user!.id, action: "UPDATE_ROLE", targetType: "user", targetId: input.userId, details: { role: input.role } });
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
      await database.update(users).set({ telegramChatId: input.chatId }).where(eq(users.id, ctx.user!.id));
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
      await createAuditLog({ adminId: ctx.user!.id, action: "UPDATE_TELEGRAM_CHAT_ID", targetType: "user", targetId: input.userId, details: { telegramChatId: input.telegramChatId } });
      return { success: true };
    }),
    // Q&A 알림 설정 업데이트
    updateQnaNotification: protectedProcedure.input(z.object({
      qnaNotifyTelegram: z.boolean().optional(),
      qnaNotifyEmail: z.boolean().optional(),
    })).mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { users } = await import("../drizzle/schema");
      const updateData: Record<string, boolean> = {};
      if (input.qnaNotifyTelegram !== undefined) updateData.qnaNotifyTelegram = input.qnaNotifyTelegram;
      if (input.qnaNotifyEmail !== undefined) updateData.qnaNotifyEmail = input.qnaNotifyEmail;
      await database.update(users).set(updateData as any).where(eq(users.id, ctx.user!.id));
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
        adminId: ctx.user!.id,
        action: "BROADCAST_TELEGRAM",
        targetType: "user",
        details: { message: input.message.slice(0, 100), filter: input.filter, successCount, failCount },
      });

      return { success: true, successCount, failCount, total: results.length, results };
    }),
    detail: adminProcedure.input(z.object({ userId: z.number() })).query(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { users: usersTable, investments: investmentsTable, nodeOrders: nodeOrdersTable, referrals: referralsTable, investmentPlans: plansTable } = await import("../drizzle/schema");
      const { eq: eqOp, desc: descOp } = await import("drizzle-orm");
      const [userResult, userInvestments, userNodes, userReferrals] = await Promise.all([
        database.select().from(usersTable).where(eqOp(usersTable.id, input.userId)).limit(1),
        database.select({
          id: investmentsTable.id,
          planId: investmentsTable.planId,
          amount: investmentsTable.amount,
          status: investmentsTable.status,
          createdAt: investmentsTable.createdAt,
          planName: plansTable.name,
        }).from(investmentsTable)
          .leftJoin(plansTable, eqOp(investmentsTable.planId, plansTable.id))
          .where(eqOp(investmentsTable.userId, input.userId))
          .orderBy(descOp(investmentsTable.createdAt))
          .limit(20),
        database.select().from(nodeOrdersTable).where(eqOp(nodeOrdersTable.userId, input.userId)).orderBy(descOp(nodeOrdersTable.createdAt)).limit(10),
        database.select().from(referralsTable).where(eqOp(referralsTable.referrerId, input.userId)).limit(50),
      ]);
      return {
        user: userResult[0] ?? null,
        investments: userInvestments,
        nodeOrders: userNodes,
        referrals: userReferrals,
      };
    }),
  }),

  // ─── Content ───────────────────────────────────────────────────────────────
  content: router({
    notices: router({
      list: adminProcedure.query(async () => await db.getNotices()),
      // 공개 목록 (사용자용 - viewCount 포함)
      listPublic: publicProcedure.query(async () => {
        const db2 = await getDb();
        if (!db2) return [];
        const { notices } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        return db2.select().from(notices).where(eq(notices.isActive, true));
      }),
      // 조회수 증가
      incrementView: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
        const db2 = await getDb();
        if (!db2) return { success: false };
        const { notices } = await import("../drizzle/schema");
        const { eq, sql } = await import("drizzle-orm");
        await db2.update(notices).set({ viewCount: sql`viewCount + 1` }).where(eq(notices.id, input.id));
        return { success: true };
      }),
      create: superAdminProcedure.input(z.object({
        title: z.string().min(1),
        content: z.string().min(1),
        isActive: z.boolean().default(true),
        isPinned: z.boolean().default(false),
        sortOrder: z.number().default(0),
        attachments: z.string().optional(),
        category: z.string().default('general'),
      })).mutation(async ({ input, ctx }) => {
        await db.createNotice(input);
        await createAuditLog({ adminId: ctx.user!.id, action: "CREATE_NOTICE", targetType: "notice", details: { title: input.title } });
        return { success: true };
      }),
      update: superAdminProcedure.input(z.object({
        id: z.number(),
        title: z.string().optional(),
        content: z.string().optional(),
        isActive: z.boolean().optional(),
        isPinned: z.boolean().optional(),
        sortOrder: z.number().optional(),
        attachments: z.string().optional(),
        category: z.string().optional(),
      })).mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        await db.updateNotice(id, data);
        await createAuditLog({ adminId: ctx.user!.id, action: "UPDATE_NOTICE", targetType: "notice", targetId: id });
        return { success: true };
      }),
      delete: superAdminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
        await db.deleteNotice(input.id);
        await createAuditLog({ adminId: ctx.user!.id, action: "DELETE_NOTICE", targetType: "notice", targetId: input.id });
        return { success: true };
      }),
      // AI 자동 번역 프로시저
      translate: superAdminProcedure.input(z.object({
        id: z.number(),
        title: z.string(),
        content: z.string(),
      })).mutation(async ({ input, ctx }) => {
        const LANGUAGES = [
          { code: "zh", name: "Chinese (Simplified)" },
          { code: "ja", name: "Japanese" },
          { code: "ko", name: "Korean" },
          { code: "vi", name: "Vietnamese" },
          { code: "th", name: "Thai" },
          { code: "id", name: "Indonesian" },
          { code: "ms", name: "Malay" },
          { code: "ru", name: "Russian" },
          { code: "ar", name: "Arabic" },
          { code: "es", name: "Spanish" },
          { code: "pt", name: "Portuguese" },
          { code: "fr", name: "French" },
          { code: "de", name: "German" },
          { code: "it", name: "Italian" },
          { code: "tr", name: "Turkish" },
          { code: "hi", name: "Hindi" },
          { code: "pl", name: "Polish" },
          { code: "nl", name: "Dutch" },
          { code: "uk", name: "Ukrainian" },
          { code: "tl", name: "Filipino (Tagalog)" },
        ];
        const prompt = `You are a professional translator. Translate the following notice title and content into all specified languages. Return ONLY a valid JSON object with no markdown, no code blocks, no extra text.

Title: ${input.title}
Content: ${input.content}

Return this exact JSON structure:
{
  "zh": {"title": "...", "content": "..."},
  "ja": {"title": "...", "content": "..."},
  "ko": {"title": "...", "content": "..."},
  "vi": {"title": "...", "content": "..."},
  "th": {"title": "...", "content": "..."},
  "id": {"title": "...", "content": "..."},
  "ms": {"title": "...", "content": "..."},
  "ru": {"title": "...", "content": "..."},
  "ar": {"title": "...", "content": "..."},
  "es": {"title": "...", "content": "..."},
  "pt": {"title": "...", "content": "..."},
  "fr": {"title": "...", "content": "..."},
  "de": {"title": "...", "content": "..."},
  "it": {"title": "...", "content": "..."},
  "tr": {"title": "...", "content": "..."},
  "hi": {"title": "...", "content": "..."},
  "pl": {"title": "...", "content": "..."},
  "nl": {"title": "...", "content": "..."},
  "uk": {"title": "...", "content": "..."},
  "tl": {"title": "...", "content": "..."}
}`;
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are a professional multilingual translator. Always return valid JSON only." },
            { role: "user", content: prompt },
          ],
        });
        const rawContent = response.choices[0].message.content as string;
        let translations: Record<string, { title: string; content: string }>;
        try {
          // JSON 코드 블록 제거
          const cleaned = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          translations = JSON.parse(cleaned);
        } catch {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Translation parsing failed" });
        }
        // DB 업데이트
        const updateData: Record<string, string> = {};
        for (const lang of LANGUAGES) {
          const t = translations[lang.code];
          if (t) {
            const titleKey = `title${lang.code.charAt(0).toUpperCase() + lang.code.slice(1)}` as keyof typeof updateData;
            const contentKey = `content${lang.code.charAt(0).toUpperCase() + lang.code.slice(1)}` as keyof typeof updateData;
            updateData[titleKey] = t.title;
            updateData[contentKey] = t.content;
          }
        }
        await db.updateNotice(input.id, updateData as Parameters<typeof db.updateNotice>[1]);
        await createAuditLog({ adminId: ctx.user!.id, action: "TRANSLATE_NOTICE", targetType: "notice", targetId: input.id });
        return { success: true, translations };
      }),
      translateAll: superAdminProcedure.mutation(async ({ ctx }) => {
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const { notices } = await import("../drizzle/schema");
        const { isNull } = await import("drizzle-orm");
        const untranslated = await drizzleDb.select().from(notices).where(isNull(notices.titleZh));
        let count = 0;
        for (const notice of untranslated) {
          try {
            const prompt = `Translate the following notice into 20 languages. Return ONLY valid JSON.\nTitle: ${notice.title}\nContent: ${notice.content ?? ""}\nReturn: {"zh":{"title":"...","content":"..."},"ja":{"title":"...","content":"..."},"ko":{"title":"...","content":"..."},"vi":{"title":"...","content":"..."},"th":{"title":"...","content":"..."},"id":{"title":"...","content":"..."},"ms":{"title":"...","content":"..."},"ru":{"title":"...","content":"..."},"ar":{"title":"...","content":"..."},"es":{"title":"...","content":"..."},"pt":{"title":"...","content":"..."},"fr":{"title":"...","content":"..."},"de":{"title":"...","content":"..."},"it":{"title":"...","content":"..."},"tr":{"title":"...","content":"..."},"hi":{"title":"...","content":"..."},"pl":{"title":"...","content":"..."},"nl":{"title":"...","content":"..."},"uk":{"title":"...","content":"..."},"tl":{"title":"...","content":"..."}}\n`;
            const response = await invokeLLM({ messages: [
              { role: "system", content: "Professional multilingual translator. Return valid JSON only." },
              { role: "user", content: prompt },
            ]});
            const raw = (response.choices[0].message.content as string).replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            const translations = JSON.parse(raw) as Record<string, { title: string; content: string }>;
            const LANGS = ["zh","ja","ko","vi","th","id","ms","ru","ar","es","pt","fr","de","it","tr","hi","pl","nl","uk","tl"];
            const updateData: Record<string, string> = {};
            for (const lang of LANGS) {
              const t = translations[lang];
              if (t) {
                updateData[`title${lang.charAt(0).toUpperCase() + lang.slice(1)}`] = t.title;
                updateData[`content${lang.charAt(0).toUpperCase() + lang.slice(1)}`] = t.content;
              }
            }
            const { eq } = await import("drizzle-orm");
            await drizzleDb.update(notices).set(updateData as any).where(eq(notices.id, notice.id));
            count++;
          } catch { /* skip failed */ }
        }
        await createAuditLog({ adminId: ctx.user!.id, action: "TRANSLATE_ALL_NOTICES", targetType: "notice" });
        return { success: true, count };
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
        await createAuditLog({ adminId: ctx.user!.id, action: "CREATE_ANNOUNCEMENT", targetType: "announcement" });
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
      uploadImage: adminProcedure.input(z.object({
        base64: z.string(),
        mimeType: z.string().default("image/png"),
        fileName: z.string().default("banner.png"),
      })).mutation(async ({ input }) => {
        const { storagePut } = await import("./storage");
        const buffer = Buffer.from(input.base64, "base64");
        const key = `banners/${Date.now()}-${input.fileName}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        return { success: true, url };
      }),
      create: adminProcedure.input(z.object({
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
      update: adminProcedure.input(z.object({
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
      delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
        await db.deleteEventBanner(input.id);
        return { success: true };
      }),
    }),
    adImages: router({
      list: adminProcedure.query(async () => await db.getAdImages()),
      create: adminProcedure.input(z.object({
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
      update: adminProcedure.input(z.object({
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
      delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
        await db.deleteAdImage(input.id);
        return { success: true };
      }),
    }),
  }),

  // ─── FAQ ────────────────────────────────────────────────────────────────────
  faq: router({
    list: publicProcedure.query(async () => {
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const { faqs } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      return drizzleDb.select().from(faqs).where(eq(faqs.isActive, true)).orderBy(faqs.sortOrder);
    }),
    listAdmin: adminProcedure.query(async () => {
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const { faqs } = await import("../drizzle/schema");
      return drizzleDb.select().from(faqs).orderBy(faqs.sortOrder);
    }),
    create: superAdminProcedure.input(z.object({
      question: z.string().min(1),
      answer: z.string().min(1),
      category: z.string().default("general"),
      sortOrder: z.number().default(0),
      autoTranslate: z.boolean().default(true),
    })).mutation(async ({ input }) => {
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const { faqs } = await import("../drizzle/schema");
      let translationData: Record<string, string> = {};
      if (input.autoTranslate) {
        try {
          const { questions, answers } = await translateQuestionAnswer(input.question, input.answer);
          for (const [lang, val] of Object.entries(questions)) {
            translationData[`question${lang.charAt(0).toUpperCase() + lang.slice(1)}`] = val;
          }
          for (const [lang, val] of Object.entries(answers)) {
            translationData[`answer${lang.charAt(0).toUpperCase() + lang.slice(1)}`] = val;
          }
        } catch (e) { console.warn('[FAQ translate]', e); }
      }
      await drizzleDb.insert(faqs).values({ question: input.question, answer: input.answer, category: input.category, sortOrder: input.sortOrder, ...translationData } as any);
      return { success: true };
    }),
    update: superAdminProcedure.input(z.object({
      id: z.number(),
      question: z.string().optional(),
      answer: z.string().optional(),
      category: z.string().optional(),
      sortOrder: z.number().optional(),
      isActive: z.boolean().optional(),
      autoTranslate: z.boolean().default(false),
    })).mutation(async ({ input }) => {
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const { faqs } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const { id, autoTranslate, ...data } = input;
      let translationData: Record<string, string> = {};
      if (autoTranslate && data.question && data.answer) {
        try {
          const { questions, answers } = await translateQuestionAnswer(data.question, data.answer);
          for (const [lang, val] of Object.entries(questions)) {
            translationData[`question${lang.charAt(0).toUpperCase() + lang.slice(1)}`] = val;
          }
          for (const [lang, val] of Object.entries(answers)) {
            translationData[`answer${lang.charAt(0).toUpperCase() + lang.slice(1)}`] = val;
          }
        } catch (e) { console.warn('[FAQ translate]', e); }
      }
      await drizzleDb.update(faqs).set({ ...data, ...translationData } as any).where(eq(faqs.id, id!));
      return { success: true };
    }),
    delete: superAdminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const { faqs } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      await drizzleDb.delete(faqs).where(eq(faqs.id, input.id));
      return { success: true };
    }),
    translate: superAdminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const { faqs } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const [faq] = await drizzleDb.select().from(faqs).where(eq(faqs.id, input.id));
      if (!faq) throw new TRPCError({ code: 'NOT_FOUND' });
      const { questions, answers } = await translateQuestionAnswer(faq.question, faq.answer);
      const translationData: Record<string, string> = {};
      for (const [lang, val] of Object.entries(questions)) {
        translationData[`question${lang.charAt(0).toUpperCase() + lang.slice(1)}`] = val;
      }
      for (const [lang, val] of Object.entries(answers)) {
        translationData[`answer${lang.charAt(0).toUpperCase() + lang.slice(1)}`] = val;
      }
      await drizzleDb.update(faqs).set(translationData as any).where(eq(faqs.id, input.id));
      return { success: true };
    }),
    reorder: superAdminProcedure.input(z.object({
      items: z.array(z.object({ id: z.number(), sortOrder: z.number() })),
    })).mutation(async ({ input }) => {
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const { faqs } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      await Promise.all(input.items.map(item =>
        drizzleDb.update(faqs).set({ sortOrder: item.sortOrder }).where(eq(faqs.id, item.id))
      ));
      return { success: true };
    }),
    translateAll: superAdminProcedure.mutation(async ({ ctx }) => {
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const { faqs } = await import("../drizzle/schema");
      const { isNull } = await import("drizzle-orm");
      const untranslated = await drizzleDb.select().from(faqs).where(isNull(faqs.questionZh));
      let count = 0;
      for (const faq of untranslated) {
        try {
          const { questions, answers } = await translateQuestionAnswer(faq.question, faq.answer);
          const translationData: Record<string, string> = {};
          for (const [lang, val] of Object.entries(questions)) {
            translationData[`question${lang.charAt(0).toUpperCase() + lang.slice(1)}`] = val;
          }
          for (const [lang, val] of Object.entries(answers)) {
            translationData[`answer${lang.charAt(0).toUpperCase() + lang.slice(1)}`] = val;
          }
          const { eq } = await import("drizzle-orm");
          await drizzleDb.update(faqs).set(translationData as any).where(eq(faqs.id, faq.id));
          count++;
        } catch { /* skip failed */ }
      }
      await createAuditLog({ adminId: ctx.user!.id, action: "TRANSLATE_ALL_FAQS", targetType: "faq" });
      return { success: true, count };
    }),
  }),
  // ─── Q&A ─────────────────────────────────────────────────────────────────────
  qna: router({
    listPublic: publicProcedure.query(async () => {
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const { qnaQuestions } = await import("../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      return drizzleDb.select().from(qnaQuestions)
        .where(and(eq(qnaQuestions.isPrivate, false), eq(qnaQuestions.isActive, true)))
        .orderBy(qnaQuestions.createdAt);
    }),
    listMine: protectedProcedure.query(async ({ ctx }) => {
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const { qnaQuestions } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      return drizzleDb.select().from(qnaQuestions)
        .where(eq(qnaQuestions.userId, ctx.user!.id))
        .orderBy(qnaQuestions.createdAt);
    }),
    deleteMine: protectedProcedure.input(z.object({
      id: z.number(),
    })).mutation(async ({ ctx, input }) => {
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const { qnaQuestions } = await import("../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      const rows = await drizzleDb.select().from(qnaQuestions)
        .where(and(eq(qnaQuestions.id, input.id), eq(qnaQuestions.userId, ctx.user!.id)));
      if (!rows.length) throw new TRPCError({ code: 'NOT_FOUND' });
      if (rows[0].answer) throw new TRPCError({ code: 'FORBIDDEN', message: '이미 답변된 질문은 삭제할 수 없습니다.' });
      await drizzleDb.delete(qnaQuestions).where(eq(qnaQuestions.id, input.id));
      return { success: true };
    }),
    updateMine: protectedProcedure.input(z.object({
      id: z.number(),
      question: z.string().min(1).max(2000),
      isPrivate: z.boolean().optional(),
      category: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const { qnaQuestions } = await import("../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      const rows = await drizzleDb.select().from(qnaQuestions)
        .where(and(eq(qnaQuestions.id, input.id), eq(qnaQuestions.userId, ctx.user!.id)));
      if (!rows.length) throw new TRPCError({ code: 'NOT_FOUND' });
      if (rows[0].answer) throw new TRPCError({ code: 'FORBIDDEN', message: '이미 답변된 질문은 수정할 수 없습니다.' });
      let translationData: Record<string, string> = {};
      try {
        const translations = await translateToAllLanguages(input.question);
        for (const [lang, val] of Object.entries(translations)) {
          translationData[`question${lang.charAt(0).toUpperCase() + lang.slice(1)}`] = val;
        }
      } catch (e) { console.warn('[QnA translate]', e); }
      await drizzleDb.update(qnaQuestions).set({
        question: input.question,
        ...(input.isPrivate !== undefined ? { isPrivate: input.isPrivate } : {}),
        ...(input.category ? { category: input.category } : {}),
        ...translationData,
      } as any).where(eq(qnaQuestions.id, input.id));
      return { success: true };
    }),
    ask: publicProcedure.input(z.object({
      question: z.string().min(1).max(2000),
      isPrivate: z.boolean().default(false),
      category: z.string().default("general"),
      nickname: z.string().optional(),
      userId: z.number().optional(),
    })).mutation(async ({ input }) => {
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const { qnaQuestions } = await import("../drizzle/schema");
      let translationData: Record<string, string> = {};
      try {
        const translations = await translateToAllLanguages(input.question);
        for (const [lang, val] of Object.entries(translations)) {
          translationData[`question${lang.charAt(0).toUpperCase() + lang.slice(1)}`] = val;
        }
      } catch (e) { console.warn('[QnA translate]', e); }
      await drizzleDb.insert(qnaQuestions).values({
        question: input.question,
        isPrivate: input.isPrivate,
        category: input.category,
        nickname: input.nickname ?? null,
        userId: input.userId ?? null,
        ...translationData,
      } as any);
      return { success: true };
    }),
    listAdmin: adminProcedure.query(async () => {
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const { qnaQuestions } = await import("../drizzle/schema");
      return drizzleDb.select().from(qnaQuestions).orderBy(qnaQuestions.createdAt);
    }),
    answer: adminProcedure.input(z.object({
      id: z.number(),
      answer: z.string().min(1),
      autoTranslate: z.boolean().default(true),
    })).mutation(async ({ input, ctx }) => {
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const { qnaQuestions } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      let translationData: Record<string, string> = {};
      if (input.autoTranslate) {
        try {
          const translations = await translateToAllLanguages(input.answer);
          for (const [lang, val] of Object.entries(translations)) {
            translationData[`answer${lang.charAt(0).toUpperCase() + lang.slice(1)}`] = val;
          }
        } catch (e) { console.warn('[QnA answer translate]', e); }
      }
      // 답변 저장 전 질문 조회 (텔레그램 알림용)
      const [qna] = await drizzleDb.select().from(qnaQuestions).where(eq(qnaQuestions.id, input.id));
      await drizzleDb.update(qnaQuestions).set({
        answer: input.answer,
        answeredBy: ctx.user!.id,
        answeredAt: new Date(),
        ...translationData,
      } as any).where(eq(qnaQuestions.id, input.id));
      // 텔레그램 + 이메일 알림 - 질문자가 userId를 가지고 있는 경우
      if (qna?.userId) {
        try {
          const { users } = await import("../drizzle/schema");
          const [questioner] = await drizzleDb.select({
            telegramChatId: users.telegramChatId,
            email: users.email,
            name: users.name,
          }).from(users).where(eq(users.id, qna.userId));
          const shortQ = qna.question.length > 100 ? qna.question.substring(0, 100) + '...' : qna.question;
          const shortA = input.answer.length > 200 ? input.answer.substring(0, 200) + '...' : input.answer;
          // 텔레그램 알림
          if (questioner?.telegramChatId) {
            const botToken = process.env.TELEGRAM_BOT_TOKEN;
            if (botToken) {
              const msg = `✅ <b>Q&A 답변이 등록되었습니다</b>\n\n❓ <b>질문:</b> ${shortQ}\n\n💬 <b>답변:</b> ${shortA}`;
              fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: questioner.telegramChatId, text: msg, parse_mode: 'HTML' }),
              }).catch(e => console.warn('[QnA telegram notify]', e));
            }
          }
          // 이메일 알림 (질문자 이메일이 있는 경우)
          if (questioner?.email) {
            const apiUrl = process.env.BUILT_IN_FORGE_API_URL;
            const apiKey = process.env.BUILT_IN_FORGE_API_KEY;
            if (apiUrl && apiKey) {
              const subject = `[AlphaBag] Q&A 답변이 등록되었습니다`;
              const body = `안녕하세요${questioner.name ? `, ${questioner.name}님` : ''}!\n\nQ&A 질문에 답변이 등록되었습니다.\n\n❓ 질문: ${shortQ}\n\n💬 답변: ${shortA}\n\n자세한 내용은 AlphaBag 사이트에서 확인하세요.\n\nAlphaBag 운영팀 드림`;
              fetch(`${apiUrl}/v1/email/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
                body: JSON.stringify({ to: questioner.email, subject, text: body }),
              }).catch(e => console.warn('[QnA email notify]', e));
            }
          }
        } catch (e) { console.warn('[QnA notify error]', e); }
      }
      return { success: true };
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const { qnaQuestions } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      await drizzleDb.delete(qnaQuestions).where(eq(qnaQuestions.id, input.id));
      return { success: true };
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
      await db.replyToTicket(input.id, input.adminReply, ctx.user!.id);
      await createAuditLog({ adminId: ctx.user!.id, action: "REPLY_TICKET", targetType: "ticket", targetId: input.id });
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
      await createAuditLog({ adminId: ctx.user!.id, action: "CREATE_AIRDROP", targetType: "airdrop", details: { name: input.name } });
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
      await createAuditLog({ adminId: ctx.user!.id, action: "UPDATE_AIRDROP", targetType: "airdrop", targetId: id });
      return { success: true };
    }),
    participants: adminProcedure.input(z.object({ airdropId: z.number() })).query(async ({ input }) => {
      return await db.getAirdropParticipants(input.airdropId);
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      await db.deleteAirdrop(input.id);
      await createAuditLog({ adminId: ctx.user!.id, action: "DELETE_AIRDROP", targetType: "airdrop", targetId: input.id });
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
      await createAuditLog({ adminId: ctx.user!.id, action: "PROMOTE_ADMIN", targetType: "user", targetId: user.id, details: { role: input.role } });
      return { success: true };
    }),
    demote: superAdminProcedure.input(z.object({ userId: z.number() })).mutation(async ({ input, ctx }) => {
      await db.updateUserRole(input.userId, "user");
      await createAuditLog({ adminId: ctx.user!.id, action: "DEMOTE_ADMIN", targetType: "user", targetId: input.userId });
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
        createdBy: ctx.user!.id,
        nextRunAt,
      });
      await createAuditLog({ adminId: ctx.user!.id, action: "CREATE_TELEGRAM_SCHEDULE", targetType: "telegramSchedule", details: { title: input.title, cronExpression: input.cronExpression } });
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
      await createAuditLog({ adminId: ctx.user!.id, action: "UPDATE_TELEGRAM_SCHEDULE", targetType: "telegramSchedule", targetId: id });
      return { success: true };
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { telegramSchedules } = await import("../drizzle/schema");
      await database.delete(telegramSchedules).where(eq(telegramSchedules.id, input.id));
      await createAuditLog({ adminId: ctx.user!.id, action: "DELETE_TELEGRAM_SCHEDULE", targetType: "telegramSchedule", targetId: input.id });
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
        lastResult: JSON.stringify({ successCount, failCount, total: successCount + failCount, runBy: `admin#${ctx.user!.id}` }),
      }).where(eq(telegramSchedules.id, input.id));
      await createAuditLog({ adminId: ctx.user!.id, action: "RUN_TELEGRAM_SCHEDULE", targetType: "telegramSchedule", targetId: input.id, details: { successCount, failCount, title: schedule.title } });
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
      const { userFavorites, investmentPlans } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const rows = await database
        .select({
          favoriteId: userFavorites.id,
          planId: userFavorites.planId,
          createdAt: userFavorites.createdAt,
          plan: investmentPlans,
        })
        .from(userFavorites)
        .leftJoin(investmentPlans, eq(userFavorites.planId, investmentPlans.id))
        .where(eq(userFavorites.userId, ctx.user!.id));
      return rows.filter(r => r.plan !== null);
    }),
    toggle: protectedProcedure.input(z.object({ planId: z.number() })).mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { userFavorites } = await import("../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      const existing = await database.select().from(userFavorites)
        .where(and(eq(userFavorites.userId, ctx.user!.id), eq(userFavorites.planId, input.planId)))
        .limit(1);
      if (existing.length > 0) {
        await database.delete(userFavorites).where(and(eq(userFavorites.userId, ctx.user!.id), eq(userFavorites.planId, input.planId)));
        return { favorited: false };
      } else {
        await database.insert(userFavorites).values({ userId: ctx.user!.id, planId: input.planId });
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
      const { storagePut } = await import("./storage");
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
        uploadedBy: ctx.user!.id,
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
    // MLM 플랜 목록
    mlmPlans: publicProcedure.query(async () => {
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      const { investmentPlans: plansTable } = await import("../drizzle/schema");
      const { and: andOp } = await import("drizzle-orm");
      return await drizzleDb.select().from(plansTable)
        .where(andOp(eq(plansTable.isMLM, true), eq(plansTable.isActive, true)))
        .orderBy(plansTable.sortOrder);
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
    planReviews: publicProcedure.input(z.object({ planId: z.number() })).query(async ({ input }) => {
      const drizzleDb = await getDb();
      if (!drizzleDb) return { reviews: [], avgRating: 0, count: 0 };
      const { planReviews, users } = await import("../drizzle/schema");
      const rows = await drizzleDb.select({
        id: planReviews.id,
        rating: planReviews.rating,
        comment: planReviews.comment,
        createdAt: planReviews.createdAt,
        userName: users.name,
      }).from(planReviews)
        .leftJoin(users, eq(planReviews.userId, users.id))
        .where(eq(planReviews.planId, input.planId))
        .orderBy(desc(planReviews.createdAt))
        .limit(50);
      const avg = rows.length > 0 ? rows.reduce((s, r) => s + r.rating, 0) / rows.length : 0;
      return { reviews: rows, avgRating: Math.round(avg * 10) / 10, count: rows.length };
    }),
    noticeById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const notices = await db.getNotices();
      const notice = notices.find((n: any) => n.id === input.id && n.isActive);
      if (!notice) throw new TRPCError({ code: 'NOT_FOUND', message: '공지사항을 찾을 수 없습니다.' });
      return notice;
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
    // C-BAG 콜렉션
    cbagPlans: publicProcedure.query(async () => {
      return await db.getInvestmentPlans(undefined, "cbag" as any);
    }),
    // 파트너 목록
    partners: publicProcedure.query(async () => {
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      const { partners } = await import("../drizzle/schema");
      return drizzleDb.select().from(partners).where(eq(partners.isHidden, false)).orderBy(partners.sortOrder);
    }),
    // 에어드랍 목록 (공개)
    airdrops: publicProcedure.query(async () => {
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      const { airdrops } = await import("../drizzle/schema");
      return drizzleDb.select().from(airdrops).where(eq(airdrops.status, "active")).orderBy(airdrops.sortOrder);
    }),

    // 추천문구 자동생성 (LLM)
    generateRecommendText: publicProcedure.input(z.object({
      planId: z.number(),
      lang: z.string().default("ko"),
    })).mutation(async ({ input }) => {
      const plan = await db.getInvestmentPlanById(input.planId);
      if (!plan) throw new TRPCError({ code: "NOT_FOUND" });
      const { invokeLLM } = await import("./_core/llm");
      const langMap: Record<string, string> = {
        ko: "한국어", en: "English", zh: "中文", ja: "日本語",
        vi: "Tiếng Việt", th: "ภาษาไทย", id: "Bahasa Indonesia",
      };
      const langName = langMap[input.lang] || "한국어";
      const dailyRate = Number((plan as any).dailyRate || 0).toFixed(2);
      const minAmount = (plan as any).minAmount ? `$${Number((plan as any).minAmount).toLocaleString()} USDT` : "";
      const description = (plan as any).description || "";
      const collectionType = (plan as any).collectionType || "self";
      const prompt = `당신은 투자 플랫폼 AlphaBag의 마케팅 전문가입니다.
다음 프로젝트 정보를 바탕으로 ${langName}로 추천 문구 3가지를 작성해주세요.
각 문구는 SNS 공유나 지인 추천에 적합한 짧고 임팩트 있는 문장으로, 이모지를 적절히 포함해주세요.

프로젝트명: ${plan.name}
컬렉션: ${collectionType}
일일 수익률: ${dailyRate}%
최소 투자: ${minAmount}
설명: ${description}

출력 형식 (JSON):
{"texts": ["문구1", "문구2", "문구3"]}`;
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a professional investment marketing copywriter. Always respond in valid JSON format." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_schema", json_schema: { name: "recommend_texts", strict: true, schema: { type: "object", properties: { texts: { type: "array", items: { type: "string" } } }, required: ["texts"], additionalProperties: false } } },
      });
      const content = response?.choices?.[0]?.message?.content || "{}";
      const parsed = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
      return { texts: parsed.texts || [] };
    }),
    // 레퍼럴 리더보드 (상위 20명)
    referralLeaderboard: publicProcedure.query(async () => {
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      const { users, investments } = await import("../drizzle/schema");
      const { sql, desc } = await import("drizzle-orm");
      // 레퍼럴 코드 보유자 중 추천인 수 기준 상위 20명
      const rows = await drizzleDb.execute(sql`
        SELECT u.name, u.referralCode,
          COUNT(r.id) AS referralCount,
          COALESCE(SUM(i.amount), 0) AS totalVolume
        FROM users u
        LEFT JOIN users r ON r.referredBy = u.referralCode
        LEFT JOIN investments i ON i.userId = r.id AND i.status = 'active'
        WHERE u.referralCode IS NOT NULL
        GROUP BY u.id
        ORDER BY referralCount DESC, totalVolume DESC
        LIMIT 20
      `);
      return (rows as unknown as any[]).map((row: any, idx: number) => ({
        rank: idx + 1,
        name: row.name || "Anonymous",
        referralCode: row.referralCode,
        referralCount: Number(row.referralCount),
        totalVolume: Number(row.totalVolume),
      }));
    }),
    // 공개 플랜 리뷰 목록
    planReviewsList: publicProcedure.input(z.object({ planId: z.number() })).query(async ({ input }) => {
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      const { planReviews, users } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const rows = await drizzleDb.select({
        id: planReviews.id,
        rating: planReviews.rating,
        comment: planReviews.comment,
        createdAt: planReviews.createdAt,
        userName: users.name,
      })
      .from(planReviews)
      .leftJoin(users, eq(planReviews.userId, users.id))
      .where(eq(planReviews.planId, input.planId))
      .orderBy(planReviews.createdAt);
      return rows;
    }),
  }),
  // 리스팅 신청
  listing: router({
    submit: publicProcedure.input(z.object({
      projectName: z.string().min(1),
      projectSymbol: z.string().optional(),
      projectWebsite: z.string().optional(),
      projectDescription: z.string().optional(),
      category: z.enum(["golden","self","leader","meme","influencer","cbag","airdrop","partner"]),
      contactName: z.string().min(1),
      contactEmail: z.string().email(),
      contactTelegram: z.string().optional(),
      logoUrl: z.string().optional(),
      telegramUrl: z.string().optional(),
      twitterUrl: z.string().optional(),
      youtubeUrl: z.string().optional(),
      revenueModel: z.string().optional(),
      additionalInfo: z.string().optional(),
    })).mutation(async ({ input }) => {
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { listingRequests } = await import("../drizzle/schema");
      await drizzleDb.insert(listingRequests).values(input);
      // 관리자에게 알림 발송 (실패해도 신청은 성공 처리)
      try {
        const categoryLabels: Record<string, string> = {
          golden: "Golden", self: "Self", leader: "Leader",
          meme: "Meme Token", influencer: "Influencer",
          cbag: "C-BAG", airdrop: "Airdrop", partner: "Partner",
        };
        await notifyOwner({
          title: `[AlphaBag] 새 리스팅 신청: ${input.projectName}`,
          content: [
            `프로젝트명: ${input.projectName}${input.projectSymbol ? ` (${input.projectSymbol})` : ""}`,
            `카테고리: ${categoryLabels[input.category] || input.category}`,
            `담당자: ${input.contactName}`,
            `이메일: ${input.contactEmail}`,
            input.contactTelegram ? `텔레그램: ${input.contactTelegram}` : "",
            input.projectWebsite ? `웹사이트: ${input.projectWebsite}` : "",
            input.projectDescription ? `\n프로젝트 설명:\n${input.projectDescription}` : "",
            input.additionalInfo ? `\n추가 정보:\n${input.additionalInfo}` : "",
          ].filter(Boolean).join("\n"),
        });
      } catch (err) {
        console.warn("[Listing] notifyOwner failed:", err);
      }
      return { success: true };
    }),
    analyzeFile: publicProcedure.input(z.object({
      base64: z.string(),
      mimeType: z.string(),
      fileName: z.string(),
      extraPrompt: z.string().optional(),
    })).mutation(async ({ input }) => {
      const { storagePut } = await import("./storage");
      const { invokeLLM } = await import("./_core/llm");

      const buffer = Buffer.from(input.base64, "base64");
      const key = `listing-analysis/${Date.now()}-${input.fileName}`;
      const { url: fileUrl } = await storagePut(key, buffer, input.mimeType);

      const isImage = input.mimeType.startsWith("image/");
      const isPdf = input.mimeType === "application/pdf";

      const systemPrompt = `You are an expert at analyzing blockchain/crypto project documents (PPT, PDF, one-page images).
Extract the following information and return as JSON:
- projectName: Project name (string)
- projectDescription: Short project description in Korean (2-3 sentences, string)
- revenueModel: Revenue model explanation in Korean (2-4 sentences describing how the project generates revenue and rewards users, string)
- logoUrl: Logo image URL if clearly visible in the document (string or null)
- telegramUrl: Telegram community URL (string or null, must start with https://t.me or t.me)
- youtubeUrl: YouTube channel or community URL (string or null)
- twitterUrl: Twitter/X URL (string or null)
- projectWebsite: Official website URL (string or null)
- projectSymbol: Token/coin symbol e.g. BTC, ETH (string or null)
If information is not found, use null. Always respond with valid JSON only.`;

      const userContent: any[] = [];
      if (input.extraPrompt) {
        userContent.push({ type: "text", text: `Additional context: ${input.extraPrompt}` });
      }
      if (isImage) {
        userContent.push({ type: "image_url", image_url: { url: fileUrl, detail: "high" } });
        userContent.push({ type: "text", text: "Analyze this project image and extract all information as JSON." });
      } else if (isPdf) {
        userContent.push({ type: "file_url", file_url: { url: fileUrl, mime_type: "application/pdf" as any } });
        userContent.push({ type: "text", text: "Analyze this project document and extract all information as JSON." });
      } else {
        // PPT/PPTX or other - extract text first using officeparser
        try {
          const officeParserModule2 = await import("officeparser");
          const officeParser2 = (officeParserModule2 as any).default ?? officeParserModule2;
          const extractedText2 = await new Promise<string>((resolve, reject) => {
            officeParser2.parseOffice(buffer, (data: any, err: any) => {
              if (err) reject(err);
              else resolve(typeof data === "string" ? data : JSON.stringify(data));
            }, { outputErrorToConsole: false });
          });
          if (extractedText2 && extractedText2.trim()) {
            userContent.push({ type: "text", text: `Document text content:\n\n${extractedText2.slice(0, 8000)}\n\nExtract all project information as JSON.` });
          } else {
            userContent.push({ type: "text", text: `Analyze the project document at: ${fileUrl}\nExtract all project information as JSON.` });
          }
        } catch {
          userContent.push({ type: "text", text: `Analyze the project document at: ${fileUrl}\nExtract all project information as JSON.` });
        }
      }

      const llmMessages2: import("./_core/llm").Message[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent as import("./_core/llm").MessageContent[] },
      ];
      const response = await invokeLLM({
        messages: llmMessages2,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "listing_project_info",
            strict: true,
            schema: {
              type: "object",
              properties: {
                projectName: { type: "string" },
                projectDescription: { type: "string" },
                revenueModel: { type: "string" },
                logoUrl: { anyOf: [{ type: "string" }, { type: "null" }] },
                telegramUrl: { anyOf: [{ type: "string" }, { type: "null" }] },
                youtubeUrl: { anyOf: [{ type: "string" }, { type: "null" }] },
                twitterUrl: { anyOf: [{ type: "string" }, { type: "null" }] },
                projectWebsite: { anyOf: [{ type: "string" }, { type: "null" }] },
                projectSymbol: { anyOf: [{ type: "string" }, { type: "null" }] },
              },
              required: ["projectName", "projectDescription", "revenueModel", "logoUrl", "telegramUrl", "youtubeUrl", "twitterUrl", "projectWebsite", "projectSymbol"],
              additionalProperties: false,
            },
          },
        },
      });

      const rawContent2 = response.choices[0]?.message?.content;
      const content = typeof rawContent2 === "string" ? rawContent2 : null;
      if (!content) throw new Error("AI 분석 결과가 없습니다.");
      let parsed: any;
      try { parsed = JSON.parse(content); } catch { throw new Error("AI 응답 파싱 실패: " + content); }
      return { success: true, fileUrl, data: parsed };
    }),
    list: adminProcedure.query(async () => {
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      const { listingRequests } = await import("../drizzle/schema");
      return drizzleDb.select().from(listingRequests).orderBy(listingRequests.createdAt);
    }),
    updateStatus: adminProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["pending","reviewing","approved","rejected"]),
      adminNote: z.string().optional(),
    })).mutation(async ({ input }) => {
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { listingRequests } = await import("../drizzle/schema");
      // 기존 신청 정보 조회
      const [existing] = await drizzleDb.select().from(listingRequests).where(eq(listingRequests.id, input.id));
      await drizzleDb.update(listingRequests).set({ status: input.status, adminNote: input.adminNote }).where(eq(listingRequests.id, input.id));
      // 상태 변경 시 관리자에게 알림 발송
      if (existing) {
        const statusLabels: Record<string, string> = {
          pending: "대기 중", reviewing: "검토 중", approved: "승인", rejected: "거절",
        };
        try {
          await notifyOwner({
            title: `[AlphaBag] 리스팅 상태 변경: ${existing.projectName} → ${statusLabels[input.status] || input.status}`,
            content: [
              `프로젝트명: ${existing.projectName}`,
              `변경된 상태: ${statusLabels[input.status] || input.status}`,
              `신청자: ${existing.contactName}`,
              `신청자 이메일: ${existing.contactEmail}`,
              existing.contactTelegram ? `신청자 텔레그램: ${existing.contactTelegram}` : "",
              input.adminNote ? `\n관리자 메모:\n${input.adminNote}` : "",
              `\n※ 신청자(${existing.contactEmail})에게 직접 이메일로 결과를 안내해 주세요.`,
            ].filter(Boolean).join("\n"),
          });
        } catch (err) {
          console.warn("[Listing] notifyOwner on status change failed:", err);
        }
      }
      return { success: true };
    }),
  }),
  // 파트너 관리
  partners: router({
    list: adminProcedure.query(async () => {
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      const { partners } = await import("../drizzle/schema");
      return drizzleDb.select().from(partners).orderBy(partners.sortOrder);
    }),
    create: adminProcedure.input(z.object({
      name: z.string().min(1),
      logoUrl: z.string().optional(),
      website: z.string().optional(),
      description: z.string().optional(),
      category: z.string().optional(),
      sortOrder: z.number().default(0),
    })).mutation(async ({ input }) => {
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { partners } = await import("../drizzle/schema");
      await drizzleDb.insert(partners).values(input);
      return { success: true };
    }),
    toggleHidden: adminProcedure.input(z.object({ id: z.number(), isHidden: z.boolean() })).mutation(async ({ input }) => {
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { partners } = await import("../drizzle/schema");
      await drizzleDb.update(partners).set({ isHidden: input.isHidden }).where(eq(partners.id, input.id));
      return { success: true };
    }),
    update: adminProcedure.input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      logoUrl: z.string().optional(),
      website: z.string().optional(),
      description: z.string().optional(),
      category: z.string().optional(),
      sortOrder: z.number().optional(),
    })).mutation(async ({ input }) => {
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { partners } = await import("../drizzle/schema");
      const { id, ...fields } = input;
      await drizzleDb.update(partners).set(fields).where(eq(partners.id, id));
      return { success: true };
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { partners } = await import("../drizzle/schema");
      await drizzleDb.delete(partners).where(eq(partners.id, input.id));
      return { success: true };
    }),
  }),

  // ─── User API (auth required) ─────────────────────────────────────────────────
  user: router({
    // 내 프로필 조회
    profile: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserById(ctx.user!.id);
    }),

    // 지갑 주소 업데이트
    updateWallet: protectedProcedure.input(z.object({
      walletAddress: z.string().min(1),
    })).mutation(async ({ input, ctx }) => {
      await db.updateUserWallet(ctx.user!.id, input.walletAddress);
      return { success: true };
    }),

    // 추천 코드 생성
    generateReferralCode: protectedProcedure.mutation(async ({ ctx }) => {
      const code = await db.generateUserReferralCode(ctx.user!.id);
      return { code };
    }),

    // 추천인 등록
    registerReferral: protectedProcedure.input(z.object({
      referralCode: z.string().min(1),
    })).mutation(async ({ input, ctx }) => {
      const referrer = await db.getUserByReferralCode(input.referralCode);
      if (!referrer) throw new TRPCError({ code: "NOT_FOUND", message: "Invalid referral code" });
      if (referrer.id === ctx.user!.id) throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot refer yourself" });
      await db.setUserReferral(ctx.user!.id, input.referralCode);
      return { success: true, referrer: { name: referrer.name } };
    }),

    // 내 투자 내역
    investments: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserInvestments(ctx.user!.id);
    }),

    // 내 노드 구매 내역
    nodeOrders: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserNodeOrders(ctx.user!.id);
    }),

    // 내 추천 현황
    referralStats: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserReferralStats(ctx.user!.id);
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
        userId: ctx.user!.id,
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
      cbagPlanId: z.number().optional(),
      cbagPercent: z.string().optional(), // 투자금 대비 CBAG 비율 (%)
    })).mutation(async ({ input, ctx }) => {
      const plan = await db.getInvestmentPlanById(input.planId);
      if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found" });
      // CBAG 연결 처리
      let cbagAmount: string | undefined;
      if (input.cbagPlanId && input.cbagPercent) {
        const pct = parseFloat(input.cbagPercent);
        const mainAmt = parseFloat(input.amount);
        if (!isNaN(pct) && !isNaN(mainAmt) && pct > 0) {
          cbagAmount = ((mainAmt * pct) / 100).toFixed(2);
        }
      }
      await db.createInvestment({
        userId: ctx.user!.id,
        planId: input.planId,
        amount: input.amount,
        status: "active",
        ...(input.cbagPlanId ? { cbagPlanId: input.cbagPlanId } : {}),
        ...(input.cbagPercent ? { cbagPercent: input.cbagPercent } : {}),
        ...(cbagAmount ? { cbagAmount } : {}),
      });
      return { success: true };
    }),

    // 플랜 리뷰 작성/수정
    upsertReview: protectedProcedure.input(z.object({
      planId: z.number(),
      rating: z.number().min(1).max(5),
      comment: z.string().max(500).optional(),
    })).mutation(async ({ input, ctx }) => {
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { planReviews } = await import("../drizzle/schema");
      const existing = await drizzleDb.select().from(planReviews)
        .where(and(eq(planReviews.planId, input.planId), eq(planReviews.userId, ctx.user!.id)))
        .limit(1);
      if (existing.length > 0) {
        await drizzleDb.update(planReviews)
          .set({ rating: input.rating, comment: input.comment || null })
          .where(eq(planReviews.id, existing[0].id));
      } else {
        await drizzleDb.insert(planReviews).values({
          planId: input.planId,
          userId: ctx.user!.id,
          rating: input.rating,
          comment: input.comment || null,
        });
      }
      return { success: true };
    }),
    // 내 리뷰 조회
    myReview: protectedProcedure.input(z.object({ planId: z.number() })).query(async ({ input, ctx }) => {
      const drizzleDb = await getDb();
      if (!drizzleDb) return null;
      const { planReviews } = await import("../drizzle/schema");
      const rows = await drizzleDb.select().from(planReviews)
        .where(and(eq(planReviews.planId, input.planId), eq(planReviews.userId, ctx.user!.id)))
        .limit(1);
      return rows[0] || null;
    }),
    // 지원 티켓 생성
    createTicket: protectedProcedure.input(z.object({
      subject: z.string().min(1),
      message: z.string().min(1),
      category: z.string().default("general"),
    })).mutation(async ({ input, ctx }) => {
      await db.createSupportTicket({
        userId: ctx.user!.id,
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
      return await db.getUserTickets(ctx.user!.id);
    }),
    // 에어드랍 참여 히스토리
    airdropHistory: protectedProcedure.query(async ({ ctx }) => {
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      const { airdropParticipants, airdrops } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const rows = await drizzleDb.select({
        id: airdropParticipants.id,
        airdropId: airdropParticipants.airdropId,
        amount: airdropParticipants.amount,
        status: airdropParticipants.status,
        createdAt: airdropParticipants.createdAt,
        airdropName: airdrops.name,
        tokenSymbol: airdrops.tokenSymbol,
        projectName: airdrops.projectName,
        imageUrl: airdrops.imageUrl,
      })
      .from(airdropParticipants)
      .leftJoin(airdrops, eq(airdropParticipants.airdropId, airdrops.id))
      .where(eq(airdropParticipants.userId, ctx.user!.id))
      .orderBy(airdropParticipants.createdAt);
      return rows;
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
      currentPassword: z.string().min(1),
      newPassword: z.string().min(6),
    })).mutation(async ({ input }) => {
      // 현재 비밀번호 검증 (슈퍼어드민 override 제외)
      if (input.currentPassword !== '__admin_override__') {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB 연결 실패' });
        const { adminAccounts } = await import("../drizzle/schema");
        const rows = await database.select().from(adminAccounts).where(eq(adminAccounts.id, input.id)).limit(1);
        if (!rows[0]) throw new TRPCError({ code: 'NOT_FOUND', message: '계정을 찾을 수 없습니다.' });
        const valid = await bcrypt.compare(input.currentPassword, rows[0].passwordHash);
        if (!valid) throw new TRPCError({ code: 'UNAUTHORIZED', message: '현재 비밀번호가 올바르지 않습니다.' });
      }
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

  // ─── Trending Alert Settings ────────────────────────────────────────────────
  trendingAlert: router({
    getSettings: adminProcedure.query(async () => {
      const database = await getDb();
      if (!database) return null;
      const { trendingAlertSettings } = await import("../drizzle/schema");
      const rows = await database.select().from(trendingAlertSettings).limit(1);
      return rows[0] ?? null;
    }),
    updateSettings: adminProcedure.input(z.object({
      isEnabled: z.boolean().optional(),
      priceChangeThreshold: z.string().optional(),
      intervalMinutes: z.number().optional(),
      channelChatId: z.string().nullable().optional(),
      sendToDm: z.boolean().optional(),
      filterHasInvestment: z.boolean().optional(),
      messageTemplate: z.string().nullable().optional(),
    })).mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { trendingAlertSettings } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      // 기존 설정 조회
      const existing = await database.select().from(trendingAlertSettings).limit(1);
      if (existing.length === 0) {
        // 없으면 생성
        await database.insert(trendingAlertSettings).values({
          isEnabled: input.isEnabled ?? false,
          priceChangeThreshold: input.priceChangeThreshold ?? "10.00",
          intervalMinutes: input.intervalMinutes ?? 60,
          channelChatId: input.channelChatId ?? null,
          sendToDm: input.sendToDm ?? false,
          filterHasInvestment: input.filterHasInvestment ?? false,
          messageTemplate: input.messageTemplate ?? null,
        });
      } else {
        // 있으면 업데이트
        const updateData: any = {};
        if (input.isEnabled !== undefined) updateData.isEnabled = input.isEnabled;
        if (input.priceChangeThreshold !== undefined) updateData.priceChangeThreshold = input.priceChangeThreshold;
        if (input.intervalMinutes !== undefined) updateData.intervalMinutes = input.intervalMinutes;
        if (input.channelChatId !== undefined) updateData.channelChatId = input.channelChatId;
        if (input.sendToDm !== undefined) updateData.sendToDm = input.sendToDm;
        if (input.filterHasInvestment !== undefined) updateData.filterHasInvestment = input.filterHasInvestment;
        if (input.messageTemplate !== undefined) updateData.messageTemplate = input.messageTemplate;
        await database.update(trendingAlertSettings).set(updateData).where(eq(trendingAlertSettings.id, existing[0].id));
      }
      return { success: true };
    }),
    // 즉시 테스트 실행
    runNow: adminProcedure.mutation(async () => {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (!botToken) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "TELEGRAM_BOT_TOKEN not set" });
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { trendingAlertSettings } = await import("../drizzle/schema");
      const settings = await database.select().from(trendingAlertSettings).limit(1);
      if (!settings.length) throw new TRPCError({ code: "NOT_FOUND", message: "Settings not found" });
      const setting = settings[0];
      const threshold = parseFloat(setting.priceChangeThreshold ?? "10");
      // CoinGecko API 호출
      const url = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=percent_change_24h_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h";
      const resp = await fetch(url, { headers: { "Accept": "application/json" } });
      if (!resp.ok) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "CoinGecko API error" });
      const data = await resp.json() as any[];
      const tokens = data.filter((t: any) => (t.price_change_percentage_24h ?? 0) >= threshold);
      if (tokens.length === 0) return { success: true, message: `임계값 ${threshold}% 이상 토큰 없음`, tokenCount: 0 };
      // 메시지 생성
      const tokenLines = tokens.slice(0, 10).map((t: any) =>
        `• <b>${t.symbol.toUpperCase()}</b> (${t.name}): +${t.price_change_percentage_24h.toFixed(1)}% | $${t.current_price >= 1 ? t.current_price.toLocaleString("en-US", { maximumFractionDigits: 2 }) : t.current_price.toFixed(6)}`
      ).join("\n");
      const message = setting.messageTemplate
        ? (setting.messageTemplate as string).replace("{tokens}", tokenLines)
        : `🚀 <b>급등 토큰 알림 (테스트)</b>\n\n${tokenLines}\n\n<i>AlphaBag · ${new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}</i>`;
      let successCount = 0;
      if (setting.channelChatId) {
        const sendResp = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: setting.channelChatId, text: message, parse_mode: "HTML" }),
        });
        const sendData = await sendResp.json() as { ok: boolean };
        if (sendData.ok) successCount++;
      }
      return { success: true, message: `${tokens.length}개 급등 토큰 감지, ${successCount}건 발송`, tokenCount: tokens.length, tokens: tokens.slice(0, 5).map((t: any) => ({ symbol: t.symbol, change: t.price_change_percentage_24h })) };
    }),
  }),

  // ─── SNS Influencers ──────────────────────────────────────────────────────────────────
  sns: router({
    // 인플루언서 목록 (퍼블릭)
    influencers: publicProcedure.query(async () => {
      const database = await getDb();
      if (!database) return [];
      const { snsInfluencers } = await import("../drizzle/schema");
      const { asc } = await import("drizzle-orm");
      return database.select().from(snsInfluencers)
        .where(eq(snsInfluencers.isActive, true))
        .orderBy(asc(snsInfluencers.sortOrder));
    }),
    // 인플루언서별 포스트 목록 (퍼블릭)
    posts: publicProcedure.input(z.object({
      influencerId: z.number().optional(),
      limit: z.number().default(20),
    })).query(async ({ input }) => {
      const database = await getDb();
      if (!database) return [];
      const { snsPosts, snsInfluencers } = await import("../drizzle/schema");
      const { desc } = await import("drizzle-orm");
      let query = database.select({
        id: snsPosts.id,
        influencerId: snsPosts.influencerId,
        content: snsPosts.content,
        tweetUrl: snsPosts.tweetUrl,
        tweetId: snsPosts.tweetId,
        likes: snsPosts.likes,
        retweets: snsPosts.retweets,
        replies: snsPosts.replies,
        postedAt: snsPosts.postedAt,
        isActive: snsPosts.isActive,
        influencerName: snsInfluencers.name,
        influencerHandle: snsInfluencers.handle,
        influencerAvatarUrl: snsInfluencers.avatarUrl,
        influencerTwitterUrl: snsInfluencers.twitterUrl,
      }).from(snsPosts)
        .innerJoin(snsInfluencers, eq(snsPosts.influencerId, snsInfluencers.id))
        .where(eq(snsPosts.isActive, true)) as any;
      if (input.influencerId) {
        const { and } = await import("drizzle-orm");
        query = database.select({
          id: snsPosts.id,
          influencerId: snsPosts.influencerId,
          content: snsPosts.content,
          tweetUrl: snsPosts.tweetUrl,
          tweetId: snsPosts.tweetId,
          likes: snsPosts.likes,
          retweets: snsPosts.retweets,
          replies: snsPosts.replies,
          postedAt: snsPosts.postedAt,
          isActive: snsPosts.isActive,
          influencerName: snsInfluencers.name,
          influencerHandle: snsInfluencers.handle,
          influencerAvatarUrl: snsInfluencers.avatarUrl,
          influencerTwitterUrl: snsInfluencers.twitterUrl,
        }).from(snsPosts)
          .innerJoin(snsInfluencers, eq(snsPosts.influencerId, snsInfluencers.id))
          .where(and(eq(snsPosts.isActive, true), eq(snsPosts.influencerId, input.influencerId)));
      }
      return (query as any).orderBy(desc(snsPosts.postedAt)).limit(input.limit);
    }),
    // 어드민: 인플루언서 전체 목록
    adminInfluencers: adminProcedure.query(async () => {
      const database = await getDb();
      if (!database) return [];
      const { snsInfluencers } = await import("../drizzle/schema");
      const { asc } = await import("drizzle-orm");
      return database.select().from(snsInfluencers).orderBy(asc(snsInfluencers.sortOrder));
    }),
    // 어드민: 인플루언서 생성
    createInfluencer: adminProcedure.input(z.object({
      name: z.string().min(1),
      handle: z.string().min(1),
      avatarUrl: z.string().optional(),
      twitterUrl: z.string().optional(),
      description: z.string().optional(),
      category: z.string().default("crypto"),
      followerCount: z.string().optional(),
      sortOrder: z.number().default(0),
    })).mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { snsInfluencers } = await import("../drizzle/schema");
      await database.insert(snsInfluencers).values(input);
      return { success: true };
    }),
    // 어드민: 인플루언서 수정
    updateInfluencer: adminProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      handle: z.string().optional(),
      avatarUrl: z.string().optional(),
      twitterUrl: z.string().optional(),
      description: z.string().optional(),
      category: z.string().optional(),
      followerCount: z.string().optional(),
      twitterUserId: z.string().optional(),
      autoFetchEnabled: z.boolean().optional(),
      fetchIntervalHours: z.number().optional(),
      alertOnNewPost: z.boolean().optional(),
      estimatedDailyTweets: z.number().optional(),
      snsTelegramChatId: z.string().optional(),
      isActive: z.boolean().optional(),
      sortOrder: z.number().optional(),
      autoTranslate: z.boolean().optional(),
      autoTranslateLang: z.string().optional(),
    })).mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { snsInfluencers } = await import("../drizzle/schema");
      const { id, ...fields } = input;
      await database.update(snsInfluencers).set(fields).where(eq(snsInfluencers.id, id));
      return { success: true };
    }),
    // 어드민: 인플루언서 삭제
    deleteInfluencer: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { snsInfluencers, snsPosts } = await import("../drizzle/schema");
      await database.delete(snsPosts).where(eq(snsPosts.influencerId, input.id));
      await database.delete(snsInfluencers).where(eq(snsInfluencers.id, input.id));
      return { success: true };
    }),
    // 어드민: 수동 트윗 수집 트리거
    manualFetch: adminProcedure.input(z.object({
      influencerId: z.number(),
    })).mutation(async ({ input }) => {
      const { fetchForInfluencer } = await import("./twitterFetchScheduler");
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { snsInfluencers } = await import("../drizzle/schema");
      const rows = await database.select().from(snsInfluencers).where(eq(snsInfluencers.id, input.influencerId));
      const inf = rows[0];
      if (!inf) throw new TRPCError({ code: "NOT_FOUND", message: "인플루언서를 찾을 수 없습니다" });
      const count = await fetchForInfluencer({
        id: inf.id,
        name: inf.name,
        handle: inf.handle,
        twitterUserId: inf.twitterUserId,
        snsTelegramChatId: inf.snsTelegramChatId,
      });
      return { success: true, newPosts: count };
    }),
    // 어드민: 포스트 전체 목록
    adminPosts: adminProcedure.input(z.object({
      influencerId: z.number().optional(),
    })).query(async ({ input }) => {
      const database = await getDb();
      if (!database) return [];
      const { snsPosts, snsInfluencers } = await import("../drizzle/schema");
      const { desc } = await import("drizzle-orm");
      if (input.influencerId) {
        return database.select({
          id: snsPosts.id,
          influencerId: snsPosts.influencerId,
          content: snsPosts.content,
          tweetUrl: snsPosts.tweetUrl,
          likes: snsPosts.likes,
          retweets: snsPosts.retweets,
          replies: snsPosts.replies,
          postedAt: snsPosts.postedAt,
          isActive: snsPosts.isActive,
          influencerName: snsInfluencers.name,
          influencerHandle: snsInfluencers.handle,
        }).from(snsPosts)
          .innerJoin(snsInfluencers, eq(snsPosts.influencerId, snsInfluencers.id))
          .where(eq(snsPosts.influencerId, input.influencerId))
          .orderBy(desc(snsPosts.postedAt));
      }
      return database.select({
        id: snsPosts.id,
        influencerId: snsPosts.influencerId,
        content: snsPosts.content,
        tweetUrl: snsPosts.tweetUrl,
        likes: snsPosts.likes,
        retweets: snsPosts.retweets,
        replies: snsPosts.replies,
        postedAt: snsPosts.postedAt,
        isActive: snsPosts.isActive,
        influencerName: snsInfluencers.name,
        influencerHandle: snsInfluencers.handle,
      }).from(snsPosts)
        .innerJoin(snsInfluencers, eq(snsPosts.influencerId, snsInfluencers.id))
        .orderBy(desc(snsPosts.postedAt));
    }),
    // 어드민: 포스트 생성
    createPost: adminProcedure.input(z.object({
      influencerId: z.number(),
      content: z.string().min(1),
      tweetUrl: z.string().optional(),
      tweetId: z.string().optional(),
      likes: z.number().default(0),
      retweets: z.number().default(0),
      replies: z.number().default(0),
      postedAt: z.string().optional(),
      sendToTelegram: z.boolean().default(false),
    })).mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { snsPosts, snsInfluencers } = await import("../drizzle/schema");
      const { postedAt, sendToTelegram, ...rest } = input;
      await database.insert(snsPosts).values({
        ...rest,
        postedAt: postedAt ? new Date(postedAt) : new Date(),
      });
      // 텔레그램 발송 (설정된 경우)
      if (sendToTelegram) {
        const rows = await database.select().from(snsInfluencers).where(eq(snsInfluencers.id, input.influencerId));
        const inf = rows[0];
        if (inf?.snsTelegramChatId && process.env.TELEGRAM_BOT_TOKEN) {
          const tweetLink = input.tweetUrl ? `\n\n<a href="${input.tweetUrl}">🔗 원문 보기</a>` : "";
          const msg = `📱 <b>${inf.name}</b> (@${inf.handle})\n\n${input.content}${tweetLink}`;
          fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: inf.snsTelegramChatId, text: msg, parse_mode: "HTML" }),
          }).catch((e: unknown) => console.error("[SNS] Telegram send error:", e));
        }
      }
      return { success: true };
    }),
    // 어드민: 포스트 수정
    updatePost: adminProcedure.input(z.object({
      id: z.number(),
      content: z.string().optional(),
      tweetUrl: z.string().optional(),
      likes: z.number().optional(),
      retweets: z.number().optional(),
      replies: z.number().optional(),
      isActive: z.boolean().optional(),
    })).mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { snsPosts } = await import("../drizzle/schema");
      const { id, ...fields } = input;
      await database.update(snsPosts).set(fields).where(eq(snsPosts.id, id));
      return { success: true };
    }),
    // 어드민: 포스트 삭제
    deletePost: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { snsPosts } = await import("../drizzle/schema");
      await database.delete(snsPosts).where(eq(snsPosts.id, input.id));
      return { success: true };
    }),
    // 공개: 단일 포스트 번역 (로그인 불필요)
    translatePost: publicProcedure.input(z.object({
      postId: z.number(),
      targetLang: z.string().default("ko"),
    })).mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { snsPosts } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const posts = await database.select().from(snsPosts).where(eq(snsPosts.id, input.postId)).limit(1);
      if (!posts.length) throw new TRPCError({ code: "NOT_FOUND" });
      const post = posts[0];
      if (post.translatedContent) return { translatedContent: post.translatedContent };
      const langNames: Record<string, string> = {
        ko: "Korean", zh: "Chinese", ja: "Japanese", vi: "Vietnamese",
        th: "Thai", id: "Indonesian", ms: "Malay", ru: "Russian",
        ar: "Arabic", es: "Spanish", pt: "Portuguese", fr: "French",
        de: "German", it: "Italian", tr: "Turkish", hi: "Hindi",
      };
      const targetLangName = langNames[input.targetLang] || "Korean";
      const response = await invokeLLM({
        messages: [
          { role: "system", content: `You are a professional crypto/finance translator. Translate the following tweet to ${targetLangName}. Keep hashtags, cashtags ($BTC), @mentions, URLs, and emojis unchanged. Return ONLY the translated text, no explanation.` },
          { role: "user", content: post.content },
        ],
      });
      const translated = (response.choices[0].message.content as string)?.trim() || post.content;
      await database.update(snsPosts).set({
        translatedContent: translated,
        translatedAt: new Date(),
      }).where(eq(snsPosts.id, input.postId));
      return { translatedContent: translated };
    }),
    // 어드민: 미번역 트윗 일괄 번역
    translateAllPosts: adminProcedure.input(z.object({
      targetLang: z.string().default("ko"),
      batchSize: z.number().default(10),
    })).mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { snsPosts } = await import("../drizzle/schema");
      const { isNull, eq } = await import("drizzle-orm");
      // 미번역 포스트 조회 (최대 batchSize개)
      const untranslated = await database.select({ id: snsPosts.id, content: snsPosts.content })
        .from(snsPosts)
        .where(isNull(snsPosts.translatedContent))
        .limit(input.batchSize);
      if (!untranslated.length) return { translated: 0, remaining: 0 };
      const langNames: Record<string, string> = {
        ko: "Korean", zh: "Chinese", ja: "Japanese", vi: "Vietnamese",
        th: "Thai", id: "Indonesian", ms: "Malay", ru: "Russian",
        ar: "Arabic", es: "Spanish", pt: "Portuguese", fr: "French",
        de: "German", it: "Italian", tr: "Turkish", hi: "Hindi",
      };
      const targetLangName = langNames[input.targetLang] || "Korean";
      let translated = 0;
      for (const post of untranslated) {
        try {
          const response = await invokeLLM({
            messages: [
              { role: "system", content: `You are a professional crypto/finance translator. Translate the following tweet to ${targetLangName}. Keep hashtags, cashtags ($BTC), @mentions, URLs, and emojis unchanged. Return ONLY the translated text, no explanation.` },
              { role: "user", content: post.content },
            ],
          });
          const translatedText = (response.choices[0].message.content as string)?.trim() || post.content;
          await database.update(snsPosts).set({
            translatedContent: translatedText,
            translatedAt: new Date(),
          }).where(eq(snsPosts.id, post.id));
          translated++;
        } catch (e) {
          console.error(`[translateAllPosts] Failed for post ${post.id}:`, e);
        }
        // LLM rate limit 방지
        await new Promise((r) => setTimeout(r, 200));
      }
      // 남은 미번역 수 계산
      const remaining = await database.select({ id: snsPosts.id })
        .from(snsPosts)
        .where(isNull(snsPosts.translatedContent));
      return { translated, remaining: remaining.length };
    }),
    // 어드민: KOL별 트윗 수 조회
    influencerPostCounts: adminProcedure.query(async () => {
      const database = await getDb();
      if (!database) return [];
      const { snsInfluencers, snsPosts } = await import("../drizzle/schema");
      const { count, eq } = await import("drizzle-orm");
      const results = await database
        .select({
          influencerId: snsPosts.influencerId,
          postCount: count(snsPosts.id),
        })
        .from(snsPosts)
        .groupBy(snsPosts.influencerId);
      return results;
    }),
    // 어드민: KOL twitterUserId 일괄 등록 (쉼표 구분 handle:userId 형식)
    bulkUpdateTwitterIds: adminProcedure.input(z.object({
      // 형식: "handle1:userId1,handle2:userId2" 또는 "handle1,handle2" (ID만 있는 경우)
      // 또는 [{handle, twitterUserId}] 배열
      entries: z.array(z.object({
        handle: z.string(),
        twitterUserId: z.string(),
        autoFetchEnabled: z.boolean().optional(),
      })),
    })).mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { snsInfluencers } = await import("../drizzle/schema");
      let updated = 0;
      let notFound: string[] = [];
      for (const entry of input.entries) {
        const handle = entry.handle.replace(/^@/, "").toLowerCase();
        const rows = await database.select({ id: snsInfluencers.id })
          .from(snsInfluencers)
          .where(eq(snsInfluencers.handle, handle));
        if (!rows.length) {
          notFound.push(handle);
          continue;
        }
        const updateData: Record<string, unknown> = { twitterUserId: entry.twitterUserId };
        if (entry.autoFetchEnabled !== undefined) updateData.autoFetchEnabled = entry.autoFetchEnabled;
        await database.update(snsInfluencers).set(updateData).where(eq(snsInfluencers.id, rows[0].id));
        updated++;
      }
      return { updated, notFound };
    }),
    // 어드민: KOL 비용 통계 (비용 정산 대시보드용)
    snsStats: adminProcedure.query(async () => {
      const database = await getDb();
      if (!database) return null;
      const { snsInfluencers, snsPosts } = await import("../drizzle/schema");
      const { count, sum, sql, and } = await import("drizzle-orm");

      // 전체 인플루언서 통계
      const totalInfluencers = await database.select({ count: count() }).from(snsInfluencers)
        .where(eq(snsInfluencers.isActive, true));
      const autoFetchCount = await database.select({ count: count() }).from(snsInfluencers)
        .where(and(eq(snsInfluencers.isActive, true), eq(snsInfluencers.autoFetchEnabled, true)));
      const alertCount = await database.select({ count: count() }).from(snsInfluencers)
        .where(and(eq(snsInfluencers.isActive, true), eq(snsInfluencers.alertOnNewPost, true)));

      // 예상 월 비용 계산 (estimatedDailyTweets * 30 * $0.005)
      const allInfluencers = await database.select({
        id: snsInfluencers.id,
        name: snsInfluencers.name,
        handle: snsInfluencers.handle,
        category: snsInfluencers.category,
        autoFetchEnabled: snsInfluencers.autoFetchEnabled,
        alertOnNewPost: snsInfluencers.alertOnNewPost,
        estimatedDailyTweets: snsInfluencers.estimatedDailyTweets,
        fetchIntervalHours: snsInfluencers.fetchIntervalHours,
        followerCount: snsInfluencers.followerCount,
        lastFetchedAt: snsInfluencers.lastFetchedAt,
      }).from(snsInfluencers).where(eq(snsInfluencers.isActive, true));

      const COST_PER_TWEET = 0.005; // $0.005 per tweet read
      let estimatedMonthlyCost = 0;
      let estimatedMonthlyTweets = 0;
      const categoryBreakdown: Record<string, { count: number; monthlyCost: number; monthlyTweets: number }> = {};

      for (const inf of allInfluencers) {
        if (!inf.autoFetchEnabled) continue;
        const dailyTweets = inf.estimatedDailyTweets || 5;
        const monthlyTweets = dailyTweets * 30;
        const cost = monthlyTweets * COST_PER_TWEET;
        estimatedMonthlyCost += cost;
        estimatedMonthlyTweets += monthlyTweets;

        const cat = inf.category || 'crypto';
        if (!categoryBreakdown[cat]) categoryBreakdown[cat] = { count: 0, monthlyCost: 0, monthlyTweets: 0 };
        categoryBreakdown[cat].count++;
        categoryBreakdown[cat].monthlyCost += cost;
        categoryBreakdown[cat].monthlyTweets += monthlyTweets;
      }

      // 이번 달 실제 수집된 포스트 수
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthPosts = await database.select({ count: count() }).from(snsPosts)
        .where(sql`${snsPosts.postedAt} >= ${monthStart}`);

      // 전체 포스트 수
      const totalPosts = await database.select({ count: count() }).from(snsPosts);

      return {
        totalInfluencers: totalInfluencers[0]?.count ?? 0,
        autoFetchCount: autoFetchCount[0]?.count ?? 0,
        alertCount: alertCount[0]?.count ?? 0,
        estimatedMonthlyCost: Math.round(estimatedMonthlyCost * 100) / 100,
        estimatedMonthlyTweets,
        thisMonthPosts: thisMonthPosts[0]?.count ?? 0,
        totalPosts: totalPosts[0]?.count ?? 0,
        categoryBreakdown,
        influencers: allInfluencers,
        costPerTweet: COST_PER_TWEET,
      };
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
    // 사용자용 알림 목록 (읽음 여부 포함)
    listForUser: protectedProcedure.query(async ({ ctx }) => {
      const database = await getDb();
      if (!database) return [];
      const { notifications, userNotificationReads } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const allNotifs = await database.select().from(notifications)
        .orderBy(notifications.createdAt);
      const readIds = await database.select({ notificationId: userNotificationReads.notificationId })
        .from(userNotificationReads)
        .where(eq(userNotificationReads.userId, String(ctx.user.id)));
      const readSet = new Set(readIds.map((r: any) => r.notificationId));
      return allNotifs.map((n: any) => ({ ...n, isRead: readSet.has(n.id) }));
    }),
    markRead: protectedProcedure.input(z.object({ notificationId: z.number() })).mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { userNotificationReads } = await import("../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      const existing = await database.select().from(userNotificationReads)
        .where(and(eq(userNotificationReads.userId, String(ctx.user.id)), eq(userNotificationReads.notificationId, input.notificationId)));
      if (existing.length === 0) {
        await database.insert(userNotificationReads).values({ userId: String(ctx.user.id), notificationId: input.notificationId });
      }
      return { success: true };
    }),
    markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { notifications, userNotificationReads } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const allNotifs = await database.select({ id: notifications.id }).from(notifications);
      const readIds = await database.select({ notificationId: userNotificationReads.notificationId })
        .from(userNotificationReads)
        .where(eq(userNotificationReads.userId, String(ctx.user.id)));
      const readSet = new Set(readIds.map((r: any) => r.notificationId));
      const unread = allNotifs.filter((n: any) => !readSet.has(n.id));
      if (unread.length > 0) {
        await database.insert(userNotificationReads).values(
          unread.map((n: any) => ({ userId: String(ctx.user.id), notificationId: n.id }))
        );
      }
      return { success: true };
    }),
  }),

  // ─── Influencer Follows ─────────────────────────────────────────────────────
  followInfluencer: protectedProcedure
    .input(z.object({ planId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { influencerFollows } = await import("../drizzle/schema");
      const { and, eq } = await import("drizzle-orm");
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const existing = await database.select().from(influencerFollows)
        .where(and(eq(influencerFollows.userId, ctx.user.id), eq(influencerFollows.planId, input.planId)))
        .limit(1);
      if (existing.length > 0) {
        await database.delete(influencerFollows)
          .where(and(eq(influencerFollows.userId, ctx.user.id), eq(influencerFollows.planId, input.planId)));
        return { followed: false };
      } else {
        await database.insert(influencerFollows).values({ userId: ctx.user.id, planId: input.planId });
        return { followed: true };
      }
    }),
  listFollowedInfluencers: protectedProcedure
    .query(async ({ ctx }) => {
      const { influencerFollows } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return database.select({ planId: influencerFollows.planId })
        .from(influencerFollows)
        .where(eq(influencerFollows.userId, ctx.user.id));
    }),
  // ─── User Coin Alerts ───────────────────────────────────────────────────────
  saveCoinAlert: protectedProcedure
    .input(z.object({
      coinSymbol: z.string().min(1).max(20),
      priceChangeThreshold: z.number().min(1).max(100).default(10),
      isEnabled: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      const { userCoinAlerts } = await import("../drizzle/schema");
      const { and, eq } = await import("drizzle-orm");
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const existing = await database.select().from(userCoinAlerts)
        .where(and(eq(userCoinAlerts.userId, ctx.user.id), eq(userCoinAlerts.coinSymbol, input.coinSymbol.toUpperCase())))
        .limit(1);
      if (existing.length > 0) {
        await database.update(userCoinAlerts)
          .set({ priceChangeThreshold: String(input.priceChangeThreshold), isEnabled: input.isEnabled })
          .where(and(eq(userCoinAlerts.userId, ctx.user.id), eq(userCoinAlerts.coinSymbol, input.coinSymbol.toUpperCase())));
      } else {
        await database.insert(userCoinAlerts).values({
          userId: ctx.user.id,
          coinSymbol: input.coinSymbol.toUpperCase(),
          priceChangeThreshold: String(input.priceChangeThreshold),
          isEnabled: input.isEnabled,
        });
      }
      return { success: true };
    }),
  listCoinAlerts: protectedProcedure
    .query(async ({ ctx }) => {
      const { userCoinAlerts } = await import("../drizzle/schema");
      const { eq, desc } = await import("drizzle-orm");
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return database.select().from(userCoinAlerts)
        .where(eq(userCoinAlerts.userId, ctx.user.id))
        .orderBy(desc(userCoinAlerts.createdAt));
    }),
  deleteCoinAlert: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { userCoinAlerts } = await import("../drizzle/schema");
      const { and, eq } = await import("drizzle-orm");
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await database.delete(userCoinAlerts)
        .where(and(eq(userCoinAlerts.id, input.id), eq(userCoinAlerts.userId, ctx.user.id)));
      return { success: true };
    }),

  // ─── AI Plan Import ──────────────────────────────────────────────────────────
  aiPlanImport: router({
    // 텍스트 프롬프트에서 플랜 정보 파싱
    parseFromText: adminProcedure.input(z.object({
      text: z.string().min(1),
    })).mutation(async ({ input }) => {
      const { invokeLLM } = await import("./_core/llm");
      const systemPrompt = `You are an expert at extracting investment plan information from text descriptions.
Extract the following fields from the provided text and return a JSON object.
Fields to extract:
- name: Plan name (string)
- label: Short label/subtitle (string, optional)
- dailyRate: Daily return rate as decimal string e.g. "0.35" for 0.35% (string)
- minAmount: Minimum investment amount in USDT (string, optional)
- recommendedAmount: Recommended investment amount in USDT (string, optional)
- allocation: Asset allocation ratio e.g. "40% 40% 20%" (string, optional)
- strategy: Investment strategy description (string, optional)
- badgeLabels: Array of strategy tags/badges e.g. ["BINANCE Alpha", "Insurance(Hedge)"] (array of strings)
- tags: Array of feature tags (array of strings, optional)
- description: Full description (string, optional)
- planType: One of "investment", "staking" (default: "investment")
- yieldInfo: Yield range info e.g. "Daily: 0.6% ~ 2%" (string, optional)
- ratioInfo: Ratio info e.g. "40% 40% 20%" (string, optional)
- rating: Rating from 1-5 (number, default 4.0)
Return ONLY valid JSON, no markdown, no explanation.`;
      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: input.text },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "plan_info",
            strict: true,
            schema: {
              type: "object",
              properties: {
                name: { type: "string" },
                label: { type: "string" },
                dailyRate: { type: "string" },
                minAmount: { type: "string" },
                recommendedAmount: { type: "string" },
                allocation: { type: "string" },
                strategy: { type: "string" },
                badgeLabels: { type: "array", items: { type: "string" } },
                tags: { type: "array", items: { type: "string" } },
                description: { type: "string" },
                planType: { type: "string" },
                yieldInfo: { type: "string" },
                ratioInfo: { type: "string" },
                rating: { type: "number" },
              },
              required: ["name", "dailyRate", "badgeLabels", "tags", "description", "planType"],
              additionalProperties: false,
            },
          },
        },
      });
      const content = response.choices[0].message.content;
      const parsed = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
      return { success: true, plan: parsed };
    }),

    // 이미지에서 플랜 정보 파싱 (LLM Vision)
    parseFromImage: adminProcedure.input(z.object({
      base64: z.string(),
      mimeType: z.string().default("image/png"),
    })).mutation(async ({ input }) => {
      const { invokeLLM } = await import("./_core/llm");
      const { storagePut } = await import("./storage");
      // S3에 임시 업로드
      const buffer = Buffer.from(input.base64, "base64");
      const key = `ai-plan-import/temp-${Date.now()}.${input.mimeType.split("/")[1] || "png"}`;
      const { url: imageUrl } = await storagePut(key, buffer, input.mimeType);
      const systemPrompt = `You are an expert at extracting investment plan information from images (screenshots, cards, presentations).
Look at the image and extract all visible investment plan information.
Return a JSON object with these fields:
- name: Plan name
- label: Short label/subtitle
- dailyRate: Daily return rate as decimal string e.g. "0.35" for 0.35%
- minAmount: Minimum investment in USDT
- recommendedAmount: Recommended investment in USDT
- allocation: Asset allocation e.g. "40% 40% 20%"
- strategy: Strategy description
- badgeLabels: Array of strategy/feature badges visible in the image
- tags: Array of feature tags
- description: Description text if visible
- planType: "investment" or "staking"
- yieldInfo: Yield range e.g. "Daily: 0.6% ~ 2%"
- ratioInfo: Ratio info
- rating: Numeric rating if visible (default 4.0)
Return ONLY valid JSON.`;
      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: [{ type: "image_url", image_url: { url: imageUrl } }, { type: "text", text: "Extract all investment plan information from this image." }] },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "plan_info",
            strict: true,
            schema: {
              type: "object",
              properties: {
                name: { type: "string" },
                label: { type: "string" },
                dailyRate: { type: "string" },
                minAmount: { type: "string" },
                recommendedAmount: { type: "string" },
                allocation: { type: "string" },
                strategy: { type: "string" },
                badgeLabels: { type: "array", items: { type: "string" } },
                tags: { type: "array", items: { type: "string" } },
                description: { type: "string" },
                planType: { type: "string" },
                yieldInfo: { type: "string" },
                ratioInfo: { type: "string" },
                rating: { type: "number" },
              },
              required: ["name", "dailyRate", "badgeLabels", "tags", "description", "planType"],
              additionalProperties: false,
            },
          },
        },
      });
      const content = response.choices[0].message.content;
      const parsed = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
      return { success: true, plan: parsed, imageUrl };
    }),

    // PDF/PPT 파일에서 플랜 정보 파싱
    parseFromFile: adminProcedure.input(z.object({
      base64: z.string(),
      mimeType: z.string(),
      fileName: z.string(),
    })).mutation(async ({ input }) => {
      const { invokeLLM } = await import("./_core/llm");
      const buffer = Buffer.from(input.base64, "base64");
      let extractedText = "";
      try {
        if (input.mimeType === "application/pdf" || input.fileName.endsWith(".pdf")) {
          const pdfParseModule = await import("pdf-parse");
          const pdfParseFn = (pdfParseModule as any).default ?? pdfParseModule;
          const pdfData = await pdfParseFn(buffer);
          extractedText = pdfData.text;
        } else if (
          input.mimeType.includes("presentation") ||
          input.mimeType.includes("powerpoint") ||
          input.fileName.endsWith(".pptx") ||
          input.fileName.endsWith(".ppt")
        ) {
          const officeParserModule = await import("officeparser");
          const officeParser = (officeParserModule as any).default ?? officeParserModule;
          extractedText = await new Promise<string>((resolve, reject) => {
            officeParser.parseOffice(buffer, (data: any, err: any) => {
              if (err) reject(err);
              else resolve(typeof data === "string" ? data : JSON.stringify(data));
            }, { outputErrorToConsole: false });
          });
        } else {
          extractedText = buffer.toString("utf-8");
        }
      } catch (e) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `파일 텍스트 추출 실패: ${(e as Error).message}` });
      }
      if (!extractedText.trim()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "파일에서 텍스트를 추출할 수 없습니다." });
      }
      const systemPrompt = `You are an expert at extracting investment plan information from documents (PDF, PPT).
Extract investment plan information from the provided document text.
Return a JSON object with these fields:
- name: Plan name
- label: Short label/subtitle
- dailyRate: Daily return rate as decimal string e.g. "0.35" for 0.35%
- minAmount: Minimum investment in USDT
- recommendedAmount: Recommended investment in USDT
- allocation: Asset allocation e.g. "40% 40% 20%"
- strategy: Strategy description
- badgeLabels: Array of strategy/feature badges
- tags: Array of feature tags
- description: Full description
- planType: "investment" or "staking"
- yieldInfo: Yield range e.g. "Daily: 0.6% ~ 2%"
- ratioInfo: Ratio info
- rating: Numeric rating (default 4.0)
Return ONLY valid JSON.`;
      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Document content:\n\n${extractedText.slice(0, 8000)}` },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "plan_info",
            strict: true,
            schema: {
              type: "object",
              properties: {
                name: { type: "string" },
                label: { type: "string" },
                dailyRate: { type: "string" },
                minAmount: { type: "string" },
                recommendedAmount: { type: "string" },
                allocation: { type: "string" },
                strategy: { type: "string" },
                badgeLabels: { type: "array", items: { type: "string" } },
                tags: { type: "array", items: { type: "string" } },
                description: { type: "string" },
                planType: { type: "string" },
                yieldInfo: { type: "string" },
                ratioInfo: { type: "string" },
                rating: { type: "number" },
              },
              required: ["name", "dailyRate", "badgeLabels", "tags", "description", "planType"],
              additionalProperties: false,
            },
          },
        },
      });
      const content = response.choices[0].message.content;
      const parsed = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
      return { success: true, plan: parsed };
    }),

    // 파싱된 데이터로 플랜 자동 등록
    createFromParsed: adminProcedure.input(z.object({
      name: z.string().min(1),
      label: z.string().optional(),
      dailyRate: z.string(),
      minAmount: z.string().optional(),
      recommendedAmount: z.string().optional(),
      allocation: z.string().optional(),
      strategy: z.string().optional(),
      badgeLabels: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),
      description: z.string().optional(),
      planType: z.enum(["investment", "staking"]).default("investment"),
      yieldInfo: z.string().optional(),
      ratioInfo: z.string().optional(),
      rating: z.number().optional(),
      logoUrl: z.string().optional(),
      sortOrder: z.number().default(0),
      isActive: z.boolean().default(true),
    })).mutation(async ({ input, ctx }) => {
      const { investmentPlans } = await import("../drizzle/schema");
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });
      await database.insert(investmentPlans).values({
        name: input.name,
        label: input.label,
        dailyRate: input.dailyRate,
        minAmount: input.minAmount,
        recommendedAmount: input.recommendedAmount,
        allocation: input.allocation,
        strategy: input.strategy,
        badgeLabels: input.badgeLabels ?? null,
        tags: input.tags ?? null,
        description: input.description,
        planType: input.planType,
        yieldInfo: input.yieldInfo,
        ratioInfo: input.ratioInfo,
        rating: input.rating?.toString() ?? "4.0",
        logoUrl: input.logoUrl,
        sortOrder: input.sortOrder,
        isActive: input.isActive,
      });
      await createAuditLog({ adminId: ctx.user!.id, action: "CREATE_PLAN", targetType: "plan", details: { name: input.name, source: "ai_import" } });
      return { success: true };
    }),
  }),

  // ─── Plan Submissions (공개 플랜 등록 신청) ──────────────────────────────────
  submissions: router({
    // 상장 설정 조회 (공개)
    getSettings: publicProcedure.query(async () => {
      const database = await getDb();
      if (!database) return { listingFeeUsdt: "500", votingPeriodDays: 7, approvalThresholdPct: 60, platformFeePct: 40 };
      const { submissionSettings } = await import("../drizzle/schema");
      const rows = await database.select().from(submissionSettings).limit(1);
      return rows[0] ?? { listingFeeUsdt: "500", votingPeriodDays: 7, approvalThresholdPct: 60, platformFeePct: 40 };
    }),

    // 인증 코드 발송 (이메일)
    sendEmailCode: publicProcedure
      .input(z.object({ submissionId: z.number().optional(), email: z.string().email() }))
      .mutation(async ({ input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { submissionVerifications } = await import("../drizzle/schema");
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10분
        await database.insert(submissionVerifications).values({
          submissionId: input.submissionId ?? 0,
          type: "email",
          target: input.email,
          code,
          verified: false,
          expiresAt,
        });
        // 이메일 발송 (텔레그램 봇 알림 활용)
        try {
          const { notifyOwner } = await import("./_core/notification");
          await notifyOwner({ title: `[AlphaBag] 이메일 인증 코드: ${code}`, content: `${input.email} 님의 인증 코드: ${code}\n유효시간: 10분` });
        } catch {}
        return { success: true, message: "인증 코드가 발송되었습니다. (10분 유효)" };
      }),

    // 이메일 인증 코드 확인
    verifyEmailCode: publicProcedure
      .input(z.object({ submissionId: z.number().optional(), email: z.string().email(), code: z.string() }))
      .mutation(async ({ input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { submissionVerifications } = await import("../drizzle/schema");
        const { and, eq, gt } = await import("drizzle-orm");
        const rows = await database.select().from(submissionVerifications)
          .where(and(
            eq(submissionVerifications.target, input.email),
            eq(submissionVerifications.type, "email"),
            eq(submissionVerifications.code, input.code),
            eq(submissionVerifications.verified, false),
            gt(submissionVerifications.expiresAt, new Date()),
          ))
          .orderBy(submissionVerifications.createdAt)
          .limit(1);
        if (!rows.length) throw new TRPCError({ code: "BAD_REQUEST", message: "인증 코드가 올바르지 않거나 만료되었습니다." });
        await database.update(submissionVerifications)
          .set({ verified: true })
          .where(eq(submissionVerifications.id, rows[0].id));
        return { success: true, verified: true };
      }),

    // 텔레그램 인증 코드 발송
    sendTelegramCode: publicProcedure
      .input(z.object({ submissionId: z.number().optional(), telegram: z.string() }))
      .mutation(async ({ input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { submissionVerifications } = await import("../drizzle/schema");
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await database.insert(submissionVerifications).values({
          submissionId: input.submissionId ?? 0,
          type: "telegram",
          target: input.telegram,
          code,
          verified: false,
          expiresAt,
        });
        // 텔레그램 봇으로 코드 발송
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (botToken) {
          try {
            // 텔레그램 핸들로 직접 발송 (chat_id가 있는 경우)
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: input.telegram.startsWith("@") ? input.telegram : `@${input.telegram}`,
                text: `🔐 AlphaBag 플랜 등록 인증 코드\n\n코드: *${code}*\n\n유효시간: 10분\n\n이 코드를 AlphaBag 플랜 등록 페이지에 입력해주세요.`,
                parse_mode: "Markdown",
              }),
            });
          } catch {}
        }
        return { success: true, message: "텔레그램으로 인증 코드가 발송되었습니다. (10분 유효)" };
      }),

    // 텔레그램 인증 코드 확인
    verifyTelegramCode: publicProcedure
      .input(z.object({ submissionId: z.number().optional(), telegram: z.string(), code: z.string() }))
      .mutation(async ({ input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { submissionVerifications } = await import("../drizzle/schema");
        const { and, eq, gt } = await import("drizzle-orm");
        const rows = await database.select().from(submissionVerifications)
          .where(and(
            eq(submissionVerifications.target, input.telegram),
            eq(submissionVerifications.type, "telegram"),
            eq(submissionVerifications.code, input.code),
            eq(submissionVerifications.verified, false),
            gt(submissionVerifications.expiresAt, new Date()),
          ))
          .orderBy(submissionVerifications.createdAt)
          .limit(1);
        if (!rows.length) throw new TRPCError({ code: "BAD_REQUEST", message: "인증 코드가 올바르지 않거나 만료되었습니다." });
        await database.update(submissionVerifications)
          .set({ verified: true })
          .where(eq(submissionVerifications.id, rows[0].id));
        return { success: true, verified: true };
      }),

    // 플랜 신청 생성
    create: publicProcedure
      .input(z.object({
        applicantName: z.string().min(1),
        applicantEmail: z.string().email(),
        applicantTelegram: z.string().optional(),
        emailVerified: z.boolean(),
        telegramVerified: z.boolean(),
        fileUrl: z.string().optional(),
        fileType: z.string().optional(),
        parsedPlanData: z.any().optional(),
        finalPlanData: z.any().optional(),
        listingFeeUsdt: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        if (!input.emailVerified) throw new TRPCError({ code: "BAD_REQUEST", message: "이메일 인증이 필요합니다." });
        const { planSubmissions } = await import("../drizzle/schema");
        const settings = await database.select().from((await import("../drizzle/schema")).submissionSettings).limit(1);
        const fee = settings[0]?.listingFeeUsdt ?? "500";
        const result = await database.insert(planSubmissions).values({
          applicantName: input.applicantName,
          applicantEmail: input.applicantEmail,
          applicantTelegram: input.applicantTelegram,
          emailVerified: input.emailVerified,
          telegramVerified: input.telegramVerified ?? false,
          fileUrl: input.fileUrl,
          fileType: input.fileType,
          parsedPlanData: input.parsedPlanData ?? null,
          finalPlanData: input.finalPlanData ?? null,
          listingFeeUsdt: fee,
          status: "draft",
        });
        const id = (result as any).insertId;
        // 어드민 알림
        try { await notifyOwner({ title: "새 플랜 등록 신청", content: `${input.applicantName} (${input.applicantEmail}) 님이 플랜 등록을 신청했습니다.` }); } catch {}
        return { success: true, submissionId: id };
      }),

    // 신청 목록 (공개 - 투표 진행 중인 것만)
    listPublic: publicProcedure.query(async () => {
      const database = await getDb();
      if (!database) return [];
      const { planSubmissions } = await import("../drizzle/schema");
      const { inArray } = await import("drizzle-orm");
      return database.select().from(planSubmissions)
        .where(inArray(planSubmissions.status, ["voting", "approved", "listed"]))
        .orderBy(planSubmissions.createdAt);
    }),

    // 내 신청 목록 (이메일로 조회)
    listByEmail: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) return [];
        const { planSubmissions } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        return database.select().from(planSubmissions)
          .where(eq(planSubmissions.applicantEmail, input.email))
          .orderBy(planSubmissions.createdAt);
      }),

    // 신청 상세 조회
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: "NOT_FOUND" });
        const { planSubmissions } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const rows = await database.select().from(planSubmissions).where(eq(planSubmissions.id, input.id)).limit(1);
        if (!rows.length) throw new TRPCError({ code: "NOT_FOUND" });
        return rows[0];
      }),

    // 상장비용 납부 확인 (TxHash 등록)
    confirmFeePayment: publicProcedure
      .input(z.object({ submissionId: z.number(), txHash: z.string() }))
      .mutation(async ({ input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { planSubmissions } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await database.update(planSubmissions)
          .set({ feePaymentTxHash: input.txHash, feePaid: true, status: "fee_paid" })
          .where(eq(planSubmissions.id, input.submissionId));
        try { await notifyOwner({ title: "상장비용 납부 확인 요청", content: `신청 #${input.submissionId} TxHash: ${input.txHash}` }); } catch {}
        return { success: true };
      }),

    // 투표 (노드 보유자 - 로그인 필요)
    vote: protectedProcedure
      .input(z.object({
        submissionId: z.number(),
        vote: z.enum(["approve", "reject"]),
        comment: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { submissionVotes, planSubmissions, nodeOrders } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        // 노드 보유 확인
        const nodeOrderRows = await database.select().from(nodeOrders)
          .where(and(eq(nodeOrders.userId, ctx.user!.id), eq(nodeOrders.status, "confirmed")));
        if (!nodeOrderRows.length) throw new TRPCError({ code: "FORBIDDEN", message: "노드 보유자만 투표할 수 있습니다." });
        // 중복 투표 확인
        const existing = await database.select().from(submissionVotes)
          .where(and(eq(submissionVotes.submissionId, input.submissionId), eq(submissionVotes.voterId, ctx.user!.id)))
          .limit(1);
        if (existing.length) throw new TRPCError({ code: "CONFLICT", message: "이미 투표하셨습니다." });
        // 투표 등록
        const nodeCount = nodeOrderRows.reduce((sum, o) => sum + (o.quantity ?? 1), 0);
        await database.insert(submissionVotes).values({
          submissionId: input.submissionId,
          voterId: ctx.user!.id,
          voterWallet: ctx.user.walletAddress ?? undefined,
          vote: input.vote,
          comment: input.comment,
          nodeCount,
        });
        // 투표 집계 업데이트
        const allVotes = await database.select().from(submissionVotes)
          .where(eq(submissionVotes.submissionId, input.submissionId));
        const approveVotes = allVotes.filter(v => v.vote === "approve").length;
        const rejectVotes = allVotes.filter(v => v.vote === "reject").length;
        await database.update(planSubmissions)
          .set({ totalVotes: allVotes.length, approveVotes, rejectVotes })
          .where(eq(planSubmissions.id, input.submissionId));
        return { success: true };
      }),

    // 투표 현황 조회
    getVoteStatus: publicProcedure
      .input(z.object({ submissionId: z.number() }))
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) return { totalVotes: 0, approveVotes: 0, rejectVotes: 0, votes: [] };
        const { submissionVotes } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const votes = await database.select().from(submissionVotes)
          .where(eq(submissionVotes.submissionId, input.submissionId));
        return {
          totalVotes: votes.length,
          approveVotes: votes.filter(v => v.vote === "approve").length,
          rejectVotes: votes.filter(v => v.vote === "reject").length,
          votes,
        };
      }),

    // 어드민: 전체 신청 목록
    adminList: adminProcedure.query(async () => {
      const database = await getDb();
      if (!database) return [];
      const { planSubmissions } = await import("../drizzle/schema");
      return database.select().from(planSubmissions).orderBy(planSubmissions.createdAt);
    }),

    // 어드민: 신청 상태 변경 (승인/거절/투표시작)
    adminUpdateStatus: adminProcedure
      .input(z.object({
        submissionId: z.number(),
        status: z.enum(["draft", "verified", "fee_paid", "voting", "approved", "rejected", "listed"]),
        adminNote: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { planSubmissions, submissionSettings } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const updateData: Record<string, unknown> = { status: input.status };
        if (input.adminNote) updateData.adminNote = input.adminNote;
        // 투표 시작 시 기간 설정
        if (input.status === "voting") {
          const settings = await database.select().from(submissionSettings).limit(1);
          const days = settings[0]?.votingPeriodDays ?? 7;
          updateData.votingStartAt = new Date();
          updateData.votingEndAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        }
        await database.update(planSubmissions).set(updateData).where(eq(planSubmissions.id, input.submissionId));
        await createAuditLog({ adminId: ctx.user!.id, action: "UPDATE_SUBMISSION_STATUS", targetType: "submission", details: { submissionId: input.submissionId, status: input.status } });
        // 승인/거절 시 신청자에게 이메일 + 텔레그램 알림 발송 (비동기)
        if (input.status === "approved" || input.status === "rejected") {
          const [sub] = await database.select().from(planSubmissions).where(eq(planSubmissions.id, input.submissionId));
          if (sub) {
            // 직접 인라인으로 알림 발송
            const planData = (sub.finalPlanData ?? sub.parsedPlanData) as any;
            const planName = planData?.name ?? `신청 #${sub.id}`;
            const isApproved = input.status === "approved";
            const totalVotes = sub.totalVotes ?? 0;
            const approvePct = totalVotes > 0 ? ((sub.approveVotes ?? 0) / totalVotes * 100) : 0;
            // 이메일 알림
            const apiUrl = process.env.BUILT_IN_FORGE_API_URL;
            const apiKey = process.env.BUILT_IN_FORGE_API_KEY;
            if (apiUrl && apiKey && sub.applicantEmail) {
              const subject = isApproved
                ? `[AlphaBag] 🎉 "${planName}" 플랜 상장 심사 통과 안내`
                : `[AlphaBag] "${planName}" 플랜 심사 결과 안내`;
              const body = isApproved
                ? `안녕하세요, ${sub.applicantName}님!\n\n"${planName}" 플랜이 AlphaBag 상장 심사를 통과하였습니다.\n\n📊 투표 결과\n- 총 투표 수: ${totalVotes}표\n- 찬성 비율: ${approvePct.toFixed(1)}%\n\n마이페이지에서 진행 상황을 확인하세요.\nhttps://alphabagv2-tgrbnq7y.manus.space/my-submissions\n\nAlphaBag 운영팀 드림`
                : `안녕하세요, ${sub.applicantName}님!\n\n"${planName}" 플랜이 이번 심사에서 상장 기준에 미달하였습니다.\n\n📊 투표 결과\n- 총 투표 수: ${totalVotes}표\n- 찬성 비율: ${approvePct.toFixed(1)}%\n\n플랜을 보완하여 재신청하실 수 있습니다.\nhttps://alphabagv2-tgrbnq7y.manus.space/my-submissions\n\nAlphaBag 운영팀 드림`;
              fetch(`${apiUrl}/v1/email/send`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
                body: JSON.stringify({ to: sub.applicantEmail, subject, text: body }),
              }).catch(e => console.warn("[AdminUpdateStatus] Email failed:", e));
            }
            // 텔레그램 알림 (신청자가 봇 연동한 경우)
            const botToken = process.env.TELEGRAM_BOT_TOKEN;
            if (botToken && sub.applicantEmail) {
              const { users: usersTable } = await import("../drizzle/schema");
              const userRows = await database.select({ telegramChatId: usersTable.telegramChatId }).from(usersTable).where(eq(usersTable.email, sub.applicantEmail)).limit(1);
              const chatId = userRows[0]?.telegramChatId;
              if (chatId) {
                const emoji = isApproved ? "🎉" : "📋";
                const msg = [`${emoji} *투표 결과 안내*`, ``, `"${planName}" 플랜 심사 결과: *${isApproved ? "상장 통과" : "심사 미달"}*`, ``, `마이페이지: https://alphabagv2-tgrbnq7y.manus.space/my-submissions`].join("\n");
                fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: "Markdown" }),
                }).catch(() => {});
              }
            }
          }
        }
        return { success: true };
      }),

    // 어드민: 상장비용 분배 실행
    distributeListingFee: adminProcedure
      .input(z.object({ submissionId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { planSubmissions, submissionVotes, submissionFeeDistributions, submissionSettings } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const submission = await database.select().from(planSubmissions).where(eq(planSubmissions.id, input.submissionId)).limit(1);
        if (!submission.length) throw new TRPCError({ code: "NOT_FOUND" });
        const sub = submission[0];
        if (!sub.feePaid) throw new TRPCError({ code: "BAD_REQUEST", message: "상장비용이 납부되지 않았습니다." });
        const totalFee = parseFloat(sub.listingFeeUsdt ?? "500");
        const settings = await database.select().from(submissionSettings).limit(1);
        const platformPct = settings[0]?.platformFeePct ?? 40;
        const nodePct = 100 - platformPct;
        // 플랫폼 수수료
        const platformAmount = (totalFee * platformPct / 100).toFixed(6);
        await database.insert(submissionFeeDistributions).values({
          submissionId: input.submissionId,
          recipientType: "platform",
          amountUsdt: platformAmount,
          distributionPct: platformPct.toString(),
          status: "distributed",
          distributedAt: new Date(),
        });
        // 투표 노드 분배
        const votes = await database.select().from(submissionVotes)
          .where(eq(submissionVotes.submissionId, input.submissionId));
        const approveVoters = votes.filter(v => v.vote === "approve");
        if (approveVoters.length > 0) {
          const perVoterAmount = (totalFee * nodePct / 100 / approveVoters.length).toFixed(6);
          for (const voter of approveVoters) {
            await database.insert(submissionFeeDistributions).values({
              submissionId: input.submissionId,
              recipientType: "node_voter",
              recipientId: voter.voterId,
              recipientWallet: voter.voterWallet ?? undefined,
              amountUsdt: perVoterAmount,
              distributionPct: (nodePct / approveVoters.length).toFixed(4),
              status: "pending",
            });
          }
        }
        await createAuditLog({ adminId: ctx.user!.id, action: "DISTRIBUTE_LISTING_FEE", targetType: "submission", details: { submissionId: input.submissionId, totalFee, platformAmount } });
        return { success: true, platformAmount, voterCount: approveVoters.length };
      }),

    // 어드민: 설정 업데이트
    adminUpdateSettings: adminProcedure
      .input(z.object({
        listingFeeUsdt: z.string().optional(),
        votingPeriodDays: z.number().optional(),
        approvalThresholdPct: z.number().optional(),
        platformFeePct: z.number().optional(),
        paymentWalletAddress: z.string().optional(),
        paymentNetwork: z.enum(["BSC", "TRC20", "ERC20"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { submissionSettings } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const existing = await database.select().from(submissionSettings).limit(1);
        if (existing.length) {
          await database.update(submissionSettings).set(input).where(eq(submissionSettings.id, existing[0].id));
        } else {
          await database.insert(submissionSettings).values({ ...input, isActive: true });
        }
        await createAuditLog({ adminId: ctx.user!.id, action: "UPDATE_SUBMISSION_SETTINGS", targetType: "settings", details: input });
        return { success: true };
      }),

    // 분배 내역 조회
    getFeeDistributions: publicProcedure
      .input(z.object({ submissionId: z.number() }))
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) return [];
        const { submissionFeeDistributions } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        return database.select().from(submissionFeeDistributions)
          .where(eq(submissionFeeDistributions.submissionId, input.submissionId));
      }),
  }),

  // ─── Rewards (투표 보상) ─────────────────────────────────────────────────────
  rewards: router({
    // 내 보상 현황
    myRewards: protectedProcedure.query(async ({ ctx }) => {
      const database = await getDb();
      if (!database) return { totalEarned: 0, pendingBalance: 0, paidBalance: 0, rewards: [] };
      const { voteRewards, planSubmissions } = await import("../drizzle/schema");
      const { eq, desc } = await import("drizzle-orm");
      const rewards = await database
        .select({
          id: voteRewards.id,
          submissionId: voteRewards.submissionId,
          voteId: voteRewards.voteId,
          rewardUsdt: voteRewards.rewardUsdt,
          rewardReason: voteRewards.rewardReason,
          status: voteRewards.status,
          paidAt: voteRewards.paidAt,
          txHash: voteRewards.txHash,
          createdAt: voteRewards.createdAt,
          submissionTitle: planSubmissions.applicantName,
        })
        .from(voteRewards)
        .leftJoin(planSubmissions, eq(voteRewards.submissionId, planSubmissions.id))
        .where(eq(voteRewards.userId, ctx.user!.id))
        .orderBy(desc(voteRewards.createdAt));
      const totalEarned = rewards.reduce((acc, r) => acc + parseFloat(r.rewardUsdt as string || "0"), 0);
      const pendingBalance = rewards.filter(r => r.status === "pending").reduce((acc, r) => acc + parseFloat(r.rewardUsdt as string || "0"), 0);
      const paidBalance = rewards.filter(r => r.status === "paid").reduce((acc, r) => acc + parseFloat(r.rewardUsdt as string || "0"), 0);
      return { totalEarned, pendingBalance, paidBalance, rewards };
    }),

    // 출금 신청
    requestWithdrawal: protectedProcedure
      .input(z.object({
        amountUsdt: z.number().positive(),
        walletAddress: z.string().min(10),
        network: z.enum(["BSC", "TRC20", "ERC20"]).default("BSC"),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { voteRewards, rewardWithdrawals } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const pendingRewards = await database.select().from(voteRewards).where(eq(voteRewards.userId, ctx.user!.id));
        const pendingBalance = pendingRewards.filter(r => r.status === "pending").reduce((acc, r) => acc + parseFloat(r.rewardUsdt as string || "0"), 0);
        if (input.amountUsdt > pendingBalance) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `출금 신청 금액(${input.amountUsdt} USDT)이 미지급 잔액(${pendingBalance.toFixed(2)} USDT)을 초과합니다.` });
        }
        const [result] = await database.insert(rewardWithdrawals).values({
          userId: ctx.user!.id,
          amountUsdt: input.amountUsdt.toString(),
          walletAddress: input.walletAddress,
          network: input.network,
          status: "pending",
        });
        return { success: true, withdrawalId: (result as any).insertId };
      }),

    // 내 출금 내역
    myWithdrawals: protectedProcedure.query(async ({ ctx }) => {
      const database = await getDb();
      if (!database) return [];
      const { rewardWithdrawals } = await import("../drizzle/schema");
      const { eq, desc } = await import("drizzle-orm");
      return database.select().from(rewardWithdrawals).where(eq(rewardWithdrawals.userId, ctx.user!.id)).orderBy(desc(rewardWithdrawals.createdAt));
    }),

    // 어드민: 전체 보상 내역
    adminList: adminProcedure.query(async () => {
      const database = await getDb();
      if (!database) return { rewards: [], withdrawals: [] };
      const { voteRewards, rewardWithdrawals, users, planSubmissions } = await import("../drizzle/schema");
      const { eq, desc } = await import("drizzle-orm");
      const rewards = await database
        .select({ id: voteRewards.id, userId: voteRewards.userId, userName: users.name, userWallet: users.walletAddress, submissionId: voteRewards.submissionId, submissionTitle: planSubmissions.applicantName, rewardUsdt: voteRewards.rewardUsdt, status: voteRewards.status, paidAt: voteRewards.paidAt, createdAt: voteRewards.createdAt })
        .from(voteRewards).leftJoin(users, eq(voteRewards.userId, users.id)).leftJoin(planSubmissions, eq(voteRewards.submissionId, planSubmissions.id)).orderBy(desc(voteRewards.createdAt)).limit(200);
      const withdrawals = await database
        .select({ id: rewardWithdrawals.id, userId: rewardWithdrawals.userId, userName: users.name, amountUsdt: rewardWithdrawals.amountUsdt, walletAddress: rewardWithdrawals.walletAddress, network: rewardWithdrawals.network, status: rewardWithdrawals.status, txHash: rewardWithdrawals.txHash, processedAt: rewardWithdrawals.processedAt, createdAt: rewardWithdrawals.createdAt })
        .from(rewardWithdrawals).leftJoin(users, eq(rewardWithdrawals.userId, users.id)).orderBy(desc(rewardWithdrawals.createdAt)).limit(200);
      return { rewards, withdrawals };
    }),

    // 어드민: 출금 처리
    adminProcessWithdrawal: adminProcedure
      .input(z.object({
        withdrawalId: z.number(),
        action: z.enum(["approve", "reject", "complete"]),
        txHash: z.string().optional(),
        adminNote: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { rewardWithdrawals, voteRewards } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const [withdrawal] = await database.select().from(rewardWithdrawals).where(eq(rewardWithdrawals.id, input.withdrawalId));
        if (!withdrawal) throw new TRPCError({ code: "NOT_FOUND" });
        const newStatus = input.action === "approve" ? "approved" : input.action === "complete" ? "completed" : "rejected";
        await database.update(rewardWithdrawals).set({ status: newStatus, txHash: input.txHash, adminNote: input.adminNote, processedAt: new Date() }).where(eq(rewardWithdrawals.id, input.withdrawalId));
        if (input.action === "complete") {
          const pendingRewards = await database.select().from(voteRewards).where(eq(voteRewards.userId, withdrawal.userId));
          let remaining = parseFloat(withdrawal.amountUsdt as string);
          for (const reward of pendingRewards.filter(r => r.status === "pending")) {
            if (remaining <= 0) break;
            await database.update(voteRewards).set({ status: "paid", paidAt: new Date(), txHash: input.txHash }).where(eq(voteRewards.id, reward.id));
            remaining -= parseFloat(reward.rewardUsdt as string);
          }
        }
        await createAuditLog({ adminId: ctx.user!.id, action: `REWARD_WITHDRAWAL_${input.action.toUpperCase()}`, targetType: "rewardWithdrawal", targetId: input.withdrawalId, details: input });
        return { success: true };
      }),

    // 어드민: 보상 지급 (투표 완료된 신청건에 보상 계산 및 지급)
    adminDistributeRewards: superAdminProcedure
      .input(z.object({ submissionId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { submissionVotes, submissionSettings, voteRewards, planSubmissions } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const [submission] = await database.select().from(planSubmissions).where(eq(planSubmissions.id, input.submissionId));
        if (!submission) throw new TRPCError({ code: "NOT_FOUND" });
        if (!submission.feePaid) throw new TRPCError({ code: "BAD_REQUEST", message: "상장비용이 납부되지 않았습니다." });
        const [settings] = await database.select().from(submissionSettings).limit(1);
        const listingFee = parseFloat((settings?.listingFeeUsdt as string) || "500");
        const platformPct = parseFloat(String(settings?.platformFeePct ?? "40")) / 100;
        const voterPoolPct = 1 - platformPct;
        const votes = await database.select().from(submissionVotes).where(eq(submissionVotes.submissionId, input.submissionId));
        if (votes.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "투표 참여자가 없습니다." });
        const existingRewards = await database.select().from(voteRewards).where(eq(voteRewards.submissionId, input.submissionId));
        if (existingRewards.length > 0) throw new TRPCError({ code: "BAD_REQUEST", message: "이미 보상이 지급되었습니다." });
        const voterPool = listingFee * voterPoolPct;
        const rewardPerVoter = voterPool / votes.length;
        // 보상 지급 + 투표자 텔레그램 알림
        const { users: usersTable } = await import("../drizzle/schema");
        const { inArray } = await import("drizzle-orm");
        const voterIds = votes.map(v => v.voterId);
        const voterUsers = voterIds.length > 0
          ? await database.select({ id: usersTable.id, telegramChatId: usersTable.telegramChatId, name: usersTable.name }).from(usersTable).where(inArray(usersTable.id, voterIds))
          : [];
        const planData = (submission.finalPlanData ?? submission.parsedPlanData) as any;
        const planName = planData?.name ?? `신청 #${submission.id}`;
        for (const vote of votes) {
          await database.insert(voteRewards).values({ userId: vote.voterId, submissionId: input.submissionId, voteId: vote.id, rewardUsdt: String(rewardPerVoter.toFixed(6)), rewardReason: "vote_participation", status: "pending" });
        }
        // 텔레그램 알림 발송 (비동기 - 실패해도 보상 지급은 성공)
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (botToken) {
          const sendRewardNotification = async (chatId: string, userName: string) => {
            const msg = [
              `🎉 *투표 보상 지급 안내*`,
              ``,
              `안녕하세요, ${userName || '노드 보유자'}님!`,
              `✨ **${planName}** 플랜 투표에 참여해 주셔서 감사합니다.`,
              ``,
              `💰 *지급 보상:* ${rewardPerVoter.toFixed(2)} USDT`,
              `👥 *전체 투표자:* ${votes.length}명`,
              `📊 *전체 지급액:* ${voterPool.toFixed(2)} USDT`,
              ``,
              `🔗 마이페이지에서 출금 신청이 가능합니다.`,
              `https://alphabag.net/my-submissions`,
            ].join('\n');
            try {
              await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'Markdown' }),
              });
            } catch (e) {
              console.warn('[RewardNotify] Failed to send telegram to', chatId, e);
            }
          };
          for (const voter of voterUsers) {
            if (voter.telegramChatId) {
              sendRewardNotification(voter.telegramChatId, voter.name || '').catch(() => {});
            }
          }
        }
        await createAuditLog({ adminId: ctx.user!.id, action: "DISTRIBUTE_VOTE_REWARDS", targetType: "submission", targetId: input.submissionId, details: { voterCount: votes.length, rewardPerVoter } });
        return { success: true, voterCount: votes.length, rewardPerVoter, totalDistributed: voterPool };
      }),
  }),

  // ─── CBAG (보험 콜렉션) ────────────────────────────────────────────────────────────────────
  cbag: router({
    // CBAG 전역 설정 조회
    settings: publicProcedure.query(async () => {
      const drizzleDb = await getDb();
      if (!drizzleDb) return null;
      const { cbagSettings } = await import("../drizzle/schema");
      const [setting] = await drizzleDb.select().from(cbagSettings).limit(1);
      return setting || null;
    }),

    // CBAG 설정 수정 (관리자)
    updateSettings: adminProcedure.input(z.object({
      name: z.string().min(1).optional(),
      subtitle: z.string().optional(),
      description: z.string().optional(),
      isActive: z.boolean().optional(),
      defaultPercent: z.string().optional(),
      minPercent: z.string().optional(),
      maxPercent: z.string().optional(),
      goldenRequired: z.boolean().optional(),
    })).mutation(async ({ input }) => {
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { cbagSettings } = await import("../drizzle/schema");
      const [existing] = await drizzleDb.select().from(cbagSettings).limit(1);
      if (existing) {
        await drizzleDb.update(cbagSettings).set({
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.subtitle !== undefined ? { subtitle: input.subtitle } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
          ...(input.defaultPercent !== undefined ? { defaultPercent: input.defaultPercent } : {}),
          ...(input.minPercent !== undefined ? { minPercent: input.minPercent } : {}),
          ...(input.maxPercent !== undefined ? { maxPercent: input.maxPercent } : {}),
          ...(input.goldenRequired !== undefined ? { goldenRequired: input.goldenRequired } : {}),
        }).where(eq(cbagSettings.id, existing.id));
      } else {
        await drizzleDb.insert(cbagSettings).values({
          name: input.name || "C-BAG Insurance",
          subtitle: input.subtitle || "Crypto Bag Insurance Collection",
          description: input.description,
          isActive: input.isActive ?? true,
          defaultPercent: input.defaultPercent || "10.00",
          minPercent: input.minPercent || "1.00",
          maxPercent: input.maxPercent || "50.00",
          goldenRequired: input.goldenRequired ?? true,
        });
      }
      return { success: true };
    }),

    // LLM으로 CBAG 설명 자동 생성
    autoDescribe: adminProcedure.input(z.object({
      planId: z.number().optional(), // 특정 상품 ID (null=전체 콜렉션 설명)
    })).mutation(async ({ input }) => {
      const { invokeLLM } = await import("./_core/llm");
      let planInfo = "";
      if (input.planId) {
        const plan = await db.getInvestmentPlanById(input.planId);
        if (plan) {
          planInfo = `상품명: ${plan.name}\n일일수익률: ${plan.dailyRate}%\n최소투자: $${plan.minAmount}\n설명: ${plan.description || ""}`;
        }
      }
      const prompt = input.planId
        ? `다음 CBAG 보험 상품에 대한 전문적인 마케팅 설명문을 한국어로 작성해주세요. 3문단 이내로 짧고 임팩트 있게 \n\n${planInfo}\n\n출력 형식(JSON): {"description": "...", "highlights": ["...", "...", "..."]}`
        : `AlphaBag의 CBAG 보험 콜렉션에 대한 전문적인 소개 문구를 한국어로 작성해주세요.\nCBAG는 투자금의 일부를 보험으로 운용하는 헤지 전략 콜렉션입니다.\n손실 위험 분산과 안정적 수익을 특징으로 하세요.\n출력 형식(JSON): {"description": "...", "highlights": ["...", "...", "..."]}`;
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a professional crypto investment marketing expert. Always respond in valid JSON format." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_schema", json_schema: { name: "cbag_description", strict: true, schema: { type: "object", properties: { description: { type: "string" }, highlights: { type: "array", items: { type: "string" } } }, required: ["description", "highlights"], additionalProperties: false } } },
      });
      const content = response?.choices?.[0]?.message?.content || "{}";
      const parsed = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
      return { description: parsed.description || "", highlights: parsed.highlights || [] };
    }),

    // CBAG 상품 목록 (투자 모달용 - collectionType=cbag 필터)
    plans: publicProcedure.query(async () => {
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      const { investmentPlans } = await import("../drizzle/schema");
      return drizzleDb.select().from(investmentPlans)
        .where(and(
          eq(investmentPlans.isActive, true),
          eq(investmentPlans.isHidden, false),
          eq(investmentPlans.collectionType, "cbag" as any)
        ))
        .orderBy(investmentPlans.sortOrder);
    }),
  }),

  // ─── API Keys 관리 (백오피스) ───────────────────────────────────────────────
  apiKeysMgmt: router({
    list: adminProcedure.query(async () => {
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      const { apiKeys } = await import("../drizzle/schema");
      return drizzleDb.select({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        partnerName: apiKeys.partnerName,
        partnerEmail: apiKeys.partnerEmail,
        isActive: apiKeys.isActive,
        callCount: apiKeys.callCount,
        lastUsedAt: apiKeys.lastUsedAt,
        expiresAt: apiKeys.expiresAt,
        note: apiKeys.note,
        createdAt: apiKeys.createdAt,
      }).from(apiKeys).orderBy(desc(apiKeys.createdAt));
    }),
    create: adminProcedure.input(z.object({
      name: z.string().min(1),
      partnerName: z.string().optional(),
      partnerEmail: z.string().email().optional(),
      note: z.string().optional(),
      expiresAt: z.string().optional(),
    })).mutation(async ({ input }) => {
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { apiKeys } = await import("../drizzle/schema");
      const { generateApiKey } = await import("./apiV1");
      const { key, prefix, hash } = generateApiKey();
      await drizzleDb.insert(apiKeys).values({
        name: input.name,
        keyHash: hash,
        keyPrefix: prefix,
        partnerName: input.partnerName,
        partnerEmail: input.partnerEmail,
        note: input.note,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
      });
      return { key, prefix };
    }),
    toggle: adminProcedure.input(z.object({ id: z.number(), isActive: z.boolean() })).mutation(async ({ input }) => {
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { apiKeys } = await import("../drizzle/schema");
      await drizzleDb.update(apiKeys).set({ isActive: input.isActive }).where(eq(apiKeys.id, input.id));
      return { success: true };
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { apiKeys } = await import("../drizzle/schema");
      await drizzleDb.delete(apiKeys).where(eq(apiKeys.id, input.id));
      return { success: true };
    }),
    regenerate: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { apiKeys } = await import("../drizzle/schema");
      const { generateApiKey } = await import("./apiV1");
      const { key, prefix, hash } = generateApiKey();
      await drizzleDb.update(apiKeys).set({
        keyHash: hash,
        keyPrefix: prefix,
        callCount: 0,
        lastUsedAt: null,
        isActive: true,
      }).where(eq(apiKeys.id, input.id));
      return { key, prefix };
    }),
    stats: adminProcedure.input(z.object({ apiKeyId: z.number().optional() })).query(async ({ input }) => {
      const drizzleDb = await getDb();
      if (!drizzleDb) return { byEndpoint: [], byDay: [] };
      const { apiLogs, apiKeys } = await import("../drizzle/schema");
      const { sql, count } = await import("drizzle-orm");
      const baseWhere = input.apiKeyId ? eq(apiLogs.apiKeyId, input.apiKeyId) : undefined;
      // Endpoint stats
      const byEndpoint = await drizzleDb.select({
        endpoint: apiLogs.endpoint,
        count: count(),
        avgDuration: sql<number>`AVG(${apiLogs.responseTimeMs})`,
      }).from(apiLogs)
        .where(baseWhere)
        .groupBy(apiLogs.endpoint)
        .orderBy(desc(count()));
      // Daily stats (last 30 days)
      const byDay = await drizzleDb.select({
        date: sql<string>`DATE(FROM_UNIXTIME(${apiLogs.createdAt}/1000))`,
        count: count(),
      }).from(apiLogs)
        .where(baseWhere)
        .groupBy(sql`DATE(FROM_UNIXTIME(${apiLogs.createdAt}/1000))`)
        .orderBy(sql`DATE(FROM_UNIXTIME(${apiLogs.createdAt}/1000)) DESC`)
        .limit(30);
      // Partner summary
      const partnerSummary = await drizzleDb.select({
        id: apiKeys.id,
        name: apiKeys.name,
        partnerName: apiKeys.partnerName,
        callCount: apiKeys.callCount,
        lastUsedAt: apiKeys.lastUsedAt,
        isActive: apiKeys.isActive,
      }).from(apiKeys).orderBy(desc(apiKeys.callCount));
      return { byEndpoint, byDay, partnerSummary };
    }),
    logs: adminProcedure.input(z.object({ apiKeyId: z.number(), limit: z.number().default(50) })).query(async ({ input }) => {
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      const { apiLogs } = await import("../drizzle/schema");
      return drizzleDb.select().from(apiLogs)
        .where(eq(apiLogs.apiKeyId, input.apiKeyId))
        .orderBy(desc(apiLogs.createdAt))
        .limit(input.limit);
    }),
  }),
});
export type AppRouter = typeof appRouter;
