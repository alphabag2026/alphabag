/**
 * AlphaBag Public REST API v1
 *
 * 모든 엔드포인트는 API 키 인증이 필요합니다.
 * Authorization: Bearer {api_key}
 */
import { Router, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { getDb } from "./db";
import {
  apiKeys, apiLogs,
  investmentPlans, nodes, notices, airdrops, referrals,
  snsPosts, announcements,
} from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

// ─── DB 헬퍼 ──────────────────────────────────────────────────────────────────
async function db() {
  const d = await getDb();
  if (!d) throw new Error("Database not available");
  return d;
}

// ─── 타입 ──────────────────────────────────────────────────────────────────────
interface ApiRequest extends Request {
  apiKeyRecord?: typeof apiKeys.$inferSelect;
}

// ─── API 키 유틸 ──────────────────────────────────────────────────────────────
export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export function generateApiKey(): { key: string; prefix: string; hash: string } {
  const raw = `abv2_${crypto.randomBytes(24).toString("hex")}`;
  const prefix = raw.slice(0, 12);
  const hash = hashApiKey(raw);
  return { key: raw, prefix, hash };
}

// ─── 인증 미들웨어 ─────────────────────────────────────────────────────────────
async function requireApiKey(req: ApiRequest, res: Response, next: NextFunction) {
  const start = Date.now();
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Authorization: Bearer {api_key} 헤더가 필요합니다.",
      docs: "/api/docs",
    });
  }

  const rawKey = authHeader.slice(7).trim();
  const keyHash = hashApiKey(rawKey);

  try {
    const d = await db();
    const [record] = await d.select().from(apiKeys).where(eq(apiKeys.keyHash, keyHash)).limit(1);

    if (!record || !record.isActive) {
      return res.status(401).json({ error: "Invalid API Key", message: "유효하지 않거나 비활성화된 API 키입니다." });
    }
    if (record.expiresAt && new Date(record.expiresAt) < new Date()) {
      return res.status(401).json({ error: "Expired API Key", message: "만료된 API 키입니다." });
    }

    // 비동기 카운트 업데이트
    d.update(apiKeys).set({ callCount: record.callCount + 1, lastUsedAt: new Date() }).where(eq(apiKeys.id, record.id)).catch(() => {});
    d.insert(apiLogs).values({
      apiKeyId: record.id,
      endpoint: req.path,
      method: req.method,
      statusCode: 200,
      responseTimeMs: Date.now() - start,
      ip: (req.headers["x-forwarded-for"] as string) || req.ip || "",
      userAgent: req.headers["user-agent"]?.slice(0, 500) || "",
    }).catch(() => {});

    req.apiKeyRecord = record;
    next();
  } catch (e) {
    console.error("[API v1] Auth error:", e);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

// ─── 공통 응답 래퍼 ────────────────────────────────────────────────────────────
function ok(res: Response, data: unknown, meta?: Record<string, unknown>) {
  return res.json({ success: true, data, meta: meta ?? {}, timestamp: new Date().toISOString() });
}

function err(res: Response, status: number, message: string) {
  return res.status(status).json({ success: false, error: message, timestamp: new Date().toISOString() });
}

// ─── 엔드포인트 ───────────────────────────────────────────────────────────────

// GET /api/v1/tabs/recommended
router.get("/tabs/recommended", requireApiKey, async (req: ApiRequest, res: Response) => {
  try {
    const d = await db();
    const plans = await d.select({
      id: investmentPlans.id,
      name: investmentPlans.name,
      logoUrl: investmentPlans.logoUrl,
      dailyRate: investmentPlans.dailyRate,
      label: investmentPlans.label,
      tags: investmentPlans.tags,
      isHighlight: investmentPlans.isHighlight,
      planType: investmentPlans.planType,
      collectionType: investmentPlans.collectionType,
      rating: investmentPlans.rating,
      urlId: investmentPlans.urlId,
    }).from(investmentPlans)
      .where(and(eq(investmentPlans.isActive, true), eq(investmentPlans.isHidden, false)))
      .orderBy(desc(investmentPlans.isHighlight), investmentPlans.sortOrder)
      .limit(20);
    ok(res, plans, { total: plans.length });
  } catch (e) { err(res, 500, String(e)); }
});

// GET /api/v1/tabs/bbag
router.get("/tabs/bbag", requireApiKey, async (req: ApiRequest, res: Response) => {
  try {
    const d = await db();
    const plans = await d.select({
      id: investmentPlans.id,
      name: investmentPlans.name,
      logoUrl: investmentPlans.logoUrl,
      dailyRate: investmentPlans.dailyRate,
      label: investmentPlans.label,
      planType: investmentPlans.planType,
      collectionType: investmentPlans.collectionType,
      rating: investmentPlans.rating,
      minAmount: investmentPlans.minAmount,
      recommendedAmount: investmentPlans.recommendedAmount,
      urlId: investmentPlans.urlId,
      tags: investmentPlans.tags,
    }).from(investmentPlans)
      .where(and(eq(investmentPlans.isActive, true), eq(investmentPlans.isHidden, false)))
      .orderBy(investmentPlans.sortOrder)
      .limit(50);
    ok(res, plans, { total: plans.length });
  } catch (e) { err(res, 500, String(e)); }
});

// GET /api/v1/tabs/trending
router.get("/tabs/trending", requireApiKey, async (req: ApiRequest, res: Response) => {
  try {
    const resp = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=percent_change_24h_desc&per_page=20&page=1&sparkline=false",
      { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000) }
    );
    if (!resp.ok) throw new Error("CoinGecko API error");
    const coins = await resp.json() as Array<{
      id: string; symbol: string; name: string; image: string;
      current_price: number; price_change_percentage_24h: number;
      market_cap: number; total_volume: number;
    }>;
    const data = coins.map(c => ({
      id: c.id, symbol: c.symbol, name: c.name, image: c.image,
      price: c.current_price,
      change24h: c.price_change_percentage_24h,
      marketCap: c.market_cap,
      volume24h: c.total_volume,
    }));
    ok(res, data, { source: "CoinGecko", total: data.length });
  } catch {
    ok(res, [], { source: "CoinGecko", error: "데이터를 불러올 수 없습니다." });
  }
});

// GET /api/v1/tabs/airdrop
router.get("/tabs/airdrop", requireApiKey, async (req: ApiRequest, res: Response) => {
  try {
    const d = await db();
    const list = await d.select({
      id: airdrops.id,
      name: airdrops.name,
      tokenSymbol: airdrops.tokenSymbol,
      totalAmount: airdrops.totalAmount,
      status: airdrops.status,
      startDate: airdrops.startDate,
      endDate: airdrops.endDate,
      description: airdrops.description,
      imageUrl: airdrops.imageUrl,
      participateUrl: airdrops.participateUrl,
      isHot: airdrops.isHot,
    }).from(airdrops)
      .where(eq(airdrops.status, "active"))
      .orderBy(desc(airdrops.startDate))
      .limit(20);
    ok(res, list, { total: list.length });
  } catch (e) { err(res, 500, String(e)); }
});

// GET /api/v1/tabs/news
router.get("/tabs/news", requireApiKey, async (req: ApiRequest, res: Response) => {
  try {
    const d = await db();
    const list = await d.select({
      id: notices.id,
      title: notices.title,
      content: notices.content,
      isPinned: notices.isPinned,
      createdAt: notices.createdAt,
    }).from(notices)
      .where(eq(notices.isActive, true))
      .orderBy(desc(notices.isPinned), desc(notices.createdAt))
      .limit(30);
    ok(res, list, { total: list.length });
  } catch (e) { err(res, 500, String(e)); }
});

// GET /api/v1/tabs/sns
router.get("/tabs/sns", requireApiKey, async (req: ApiRequest, res: Response) => {
  try {
    const d = await db();
    const posts = await d.select({
      id: snsPosts.id,
      content: snsPosts.content,
      translatedContent: snsPosts.translatedContent,
      mediaUrls: snsPosts.mediaUrls,
      likes: snsPosts.likes,
      retweets: snsPosts.retweets,
      postedAt: snsPosts.postedAt,
    }).from(snsPosts)
      .where(eq(snsPosts.isActive, true))
      .orderBy(desc(snsPosts.postedAt))
      .limit(30);
    ok(res, posts, { total: posts.length });
  } catch (e) { err(res, 500, String(e)); }
});

// GET /api/v1/tabs/contents
router.get("/tabs/contents", requireApiKey, async (req: ApiRequest, res: Response) => {
  try {
    const d = await db();
    const [noticeList, planList] = await Promise.all([
      d.select({ id: notices.id, title: notices.title, createdAt: notices.createdAt })
        .from(notices).where(eq(notices.isActive, true)).orderBy(desc(notices.createdAt)).limit(10),
      d.select({ id: investmentPlans.id, name: investmentPlans.name, planType: investmentPlans.planType, logoUrl: investmentPlans.logoUrl })
        .from(investmentPlans).where(and(eq(investmentPlans.isActive, true), eq(investmentPlans.isHighlight, true))).limit(10),
    ]);
    ok(res, { notices: noticeList, highlights: planList });
  } catch (e) { err(res, 500, String(e)); }
});

// GET /api/v1/tabs/live
router.get("/tabs/live", requireApiKey, async (req: ApiRequest, res: Response) => {
  try {
    const d = await db();
    const list = await d.select({
      id: announcements.id,
      title: announcements.title,
      meetingUrl: announcements.meetingUrl,
      meetingDate: announcements.meetingDate,
      meetingPlatform: announcements.meetingPlatform,
      type: announcements.type,
    }).from(announcements)
      .where(and(eq(announcements.isActive, true), eq(announcements.type, "meeting")))
      .orderBy(desc(announcements.meetingDate))
      .limit(10);
    ok(res, list, { total: list.length });
  } catch (e) { err(res, 500, String(e)); }
});

// GET /api/v1/tabs/mlm
router.get("/tabs/mlm", requireApiKey, async (req: ApiRequest, res: Response) => {
  try {
    const d = await db();
    const stats = await d.select({
      referrerId: referrals.referrerId,
      totalEarned: referrals.totalEarned,
      level: referrals.level,
    }).from(referrals)
      .orderBy(desc(referrals.totalEarned))
      .limit(20);
    ok(res, stats, { total: stats.length, note: "Top referrers by earnings" });
  } catch (e) { err(res, 500, String(e)); }
});

// GET /api/v1/tabs/meetup
router.get("/tabs/meetup", requireApiKey, async (req: ApiRequest, res: Response) => {
  try {
    const d = await db();
    const list = await d.select({
      id: notices.id,
      title: notices.title,
      content: notices.content,
      createdAt: notices.createdAt,
    }).from(notices)
      .where(eq(notices.isActive, true))
      .orderBy(desc(notices.createdAt))
      .limit(20);
    ok(res, list, { total: list.length, note: "Meetup events" });
  } catch (e) { err(res, 500, String(e)); }
});

// GET /api/v1/tabs/expo
router.get("/tabs/expo", requireApiKey, async (req: ApiRequest, res: Response) => {
  try {
    const d = await db();
    const list = await d.select({
      id: notices.id,
      title: notices.title,
      content: notices.content,
      createdAt: notices.createdAt,
    }).from(notices)
      .where(eq(notices.isActive, true))
      .orderBy(desc(notices.createdAt))
      .limit(10);
    ok(res, list, { total: list.length, note: "Expo/exhibition events" });
  } catch (e) { err(res, 500, String(e)); }
});

// GET /api/v1/tabs/nodes
router.get("/tabs/nodes", requireApiKey, async (req: ApiRequest, res: Response) => {
  try {
    const d = await db();
    const list = await d.select({
      id: nodes.id,
      name: nodes.name,
      price: nodes.price,
      color: nodes.color,
      description: nodes.description,
      tags: nodes.tags,
      totalSold: nodes.totalSold,
    }).from(nodes)
      .where(eq(nodes.isActive, true))
      .orderBy(nodes.sortOrder)
      .limit(20);
    ok(res, list, { total: list.length });
  } catch (e) { err(res, 500, String(e)); }
});

// GET /api/v1/info
router.get("/info", requireApiKey, async (req: ApiRequest, res: Response) => {
  ok(res, {
    version: "1.0.0",
    name: "AlphaBag API v1",
    partner: req.apiKeyRecord?.partnerName || "Unknown",
    endpoints: [
      "GET /api/v1/tabs/recommended",
      "GET /api/v1/tabs/bbag",
      "GET /api/v1/tabs/trending",
      "GET /api/v1/tabs/airdrop",
      "GET /api/v1/tabs/news",
      "GET /api/v1/tabs/sns",
      "GET /api/v1/tabs/contents",
      "GET /api/v1/tabs/live",
      "GET /api/v1/tabs/mlm",
      "GET /api/v1/tabs/meetup",
      "GET /api/v1/tabs/expo",
      "GET /api/v1/tabs/nodes",
      "GET /api/v1/info",
    ],
    docs: "/api/docs",
  });
});

export default router;
