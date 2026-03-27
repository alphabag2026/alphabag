/**
 * Trending Token Alert Scheduler
 * - 설정된 주기(intervalMinutes)마다 CoinGecko API에서 급등 토큰 감지
 * - 설정된 임계값(priceChangeThreshold) 이상 상승한 토큰 발견 시 텔레그램 알림 발송
 * - 중복 알림 방지: 이미 알림 보낸 토큰은 다음 주기까지 제외
 */
import cron from "node-cron";
import { getDb } from "./db";
import { trendingAlertSettings, users, investments } from "../drizzle/schema";
import { and, isNotNull, inArray, eq } from "drizzle-orm";

interface CoinGeckoToken {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  total_volume: number;
}

async function fetchTrendingTokens(threshold: number): Promise<CoinGeckoToken[]> {
  try {
    const url = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=percent_change_24h_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h";
    const resp = await fetch(url, {
      headers: { "Accept": "application/json" },
    });
    if (!resp.ok) return [];
    const data = await resp.json() as CoinGeckoToken[];
    return data.filter(t => (t.price_change_percentage_24h ?? 0) >= threshold);
  } catch (err) {
    console.error("[TrendingAlertScheduler] CoinGecko fetch error:", err);
    return [];
  }
}

async function sendTelegramMessage(botToken: string, chatId: string, message: string): Promise<boolean> {
  try {
    const resp = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" }),
    });
    const data = await resp.json() as { ok: boolean };
    return data.ok;
  } catch {
    return false;
  }
}

function buildAlertMessage(tokens: CoinGeckoToken[], template?: string | null): string {
  if (template) {
    // 템플릿에 {tokens} 플레이스홀더 대체
    const tokenLines = tokens.slice(0, 10).map(t =>
      `• <b>${t.symbol.toUpperCase()}</b> (${t.name}): +${t.price_change_percentage_24h.toFixed(1)}% | $${t.current_price >= 1 ? t.current_price.toLocaleString("en-US", { maximumFractionDigits: 2 }) : t.current_price.toFixed(6)}`
    ).join("\n");
    return template.replace("{tokens}", tokenLines);
  }

  const tokenLines = tokens.slice(0, 10).map(t =>
    `• <b>${t.symbol.toUpperCase()}</b> (${t.name})\n  📈 +${t.price_change_percentage_24h.toFixed(1)}% | $${t.current_price >= 1 ? t.current_price.toLocaleString("en-US", { maximumFractionDigits: 2 }) : t.current_price.toFixed(6)}`
  ).join("\n");

  return `🚀 <b>급등 토큰 알림</b>\n\n${tokenLines}\n\n<i>AlphaBag · ${new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}</i>`;
}

async function runTrendingAlert() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.warn("[TrendingAlertScheduler] TELEGRAM_BOT_TOKEN not set, skipping");
    return;
  }

  const db = await getDb();
  if (!db) return;

  // 설정 조회 (첫 번째 레코드 사용)
  const settings = await db.select().from(trendingAlertSettings).limit(1);
  if (!settings.length) return;

  const setting = settings[0];
  if (!setting.isEnabled) return;

  const now = new Date();

  // nextRunAt이 아직 안 됐으면 스킵
  if (setting.nextRunAt && setting.nextRunAt > now) return;

  const threshold = parseFloat(setting.priceChangeThreshold ?? "10");
  const tokens = await fetchTrendingTokens(threshold);

  // 이미 알림 보낸 토큰 제외
  const lastAlerted = (setting.lastAlertedTokens as string[] | null) ?? [];
  const newTokens = tokens.filter(t => !lastAlerted.includes(t.id));

  const nextRunAt = new Date(now.getTime() + (setting.intervalMinutes ?? 60) * 60 * 1000);

  if (newTokens.length === 0) {
    // 새 급등 토큰 없음 - 다음 실행 시간만 업데이트
    await db.update(trendingAlertSettings)
      .set({ lastRunAt: now, nextRunAt, lastResult: { newTokens: 0, totalDetected: tokens.length, successCount: 0, failCount: 0 } })
      .where(eq(trendingAlertSettings.id, setting.id));
    console.log(`[TrendingAlertScheduler] No new trending tokens (${tokens.length} total), next check: ${nextRunAt.toISOString()}`);
    return;
  }

  const message = buildAlertMessage(newTokens, setting.messageTemplate);
  let successCount = 0;
  let failCount = 0;

  // 1. 채널 발송
  if (setting.channelChatId) {
    const ok = await sendTelegramMessage(botToken, setting.channelChatId, message);
    if (ok) successCount++; else failCount++;
  }

  // 2. 개별 DM 발송 (옵션)
  if (setting.sendToDm) {
    const conditions: any[] = [isNotNull(users.telegramChatId)];
    if (setting.filterHasInvestment) {
      const investedUserIds = await db.selectDistinct({ userId: investments.userId }).from(investments);
      const ids = investedUserIds.map((r: any) => r.userId);
      if (ids.length > 0) conditions.push(inArray(users.id, ids));
    }
    const targetUsers = await db.select({ id: users.id, telegramChatId: users.telegramChatId })
      .from(users).where(and(...conditions));

    for (const u of targetUsers) {
      if (!u.telegramChatId) continue;
      const ok = await sendTelegramMessage(botToken, u.telegramChatId, message);
      if (ok) successCount++; else failCount++;
      await new Promise(r => setTimeout(r, 35)); // Rate limit
    }
  }

  // 알림 보낸 토큰 목록 업데이트 (최근 50개만 유지)
  const combined = lastAlerted.concat(newTokens.map(t => t.id));
  const updatedAlerted = combined.filter((v, i, a) => a.indexOf(v) === i).slice(-50);

  await db.update(trendingAlertSettings)
    .set({
      lastRunAt: now,
      nextRunAt,
      lastResult: { newTokens: newTokens.length, totalDetected: tokens.length, successCount, failCount },
      lastAlertedTokens: updatedAlerted,
    })
    .where(eq(trendingAlertSettings.id, setting.id));

  console.log(`[TrendingAlertScheduler] Alert sent: ${newTokens.length} new tokens, ${successCount}/${successCount + failCount} delivered, next: ${nextRunAt.toISOString()}`);
}

export function startTrendingAlertScheduler() {
  // 5분마다 nextRunAt 체크 (실제 발송 주기는 DB 설정에 따름)
  cron.schedule("*/5 * * * *", async () => {
    runTrendingAlert().catch(err =>
      console.error("[TrendingAlertScheduler] Error:", err)
    );
  });

  console.log("[TrendingAlertScheduler] Started - checking every 5 minutes");
}
