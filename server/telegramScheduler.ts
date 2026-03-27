/**
 * Telegram Scheduled Broadcast Scheduler
 * - node-cron으로 1분마다 nextRunAt이 지난 스케줄을 실행
 * - 실행 후 lastRunAt, lastResult, nextRunAt 업데이트
 */
import cron from "node-cron";
import { getDb } from "./db";
import { telegramSchedules, users, investments, nodeOrders } from "../drizzle/schema";
import { and, isNotNull, lte, eq, inArray } from "drizzle-orm";

// cron 표현식에서 다음 실행 시간 계산 (간단한 구현)
export function getNextRunAt(cronExpr: string): Date {
  const now = new Date();
  const parts = cronExpr.trim().split(/\s+/);
  if (parts.length !== 5) return new Date(now.getTime() + 60 * 1000);

  const [minute, hour, dom, month, dow] = parts;

  // 단순 케이스: 매주 특정 요일 특정 시간 (예: "0 9 * * 1")
  if (dom === "*" && month === "*" && minute !== "*" && hour !== "*" && dow !== "*") {
    const targetMinute = parseInt(minute);
    const targetHour = parseInt(hour);
    const targetDow = parseInt(dow); // 0=Sun, 1=Mon, ...

    const next = new Date(now);
    next.setSeconds(0);
    next.setMilliseconds(0);
    next.setMinutes(targetMinute);
    next.setHours(targetHour);

    // 오늘 요일 확인
    const currentDow = next.getDay();
    let daysUntil = (targetDow - currentDow + 7) % 7;
    if (daysUntil === 0 && next <= now) daysUntil = 7;
    next.setDate(next.getDate() + daysUntil);
    return next;
  }

  // 매일 특정 시간 (예: "0 9 * * *")
  if (dom === "*" && month === "*" && dow === "*" && minute !== "*" && hour !== "*") {
    const targetMinute = parseInt(minute);
    const targetHour = parseInt(hour);
    const next = new Date(now);
    next.setSeconds(0);
    next.setMilliseconds(0);
    next.setMinutes(targetMinute);
    next.setHours(targetHour);
    if (next <= now) next.setDate(next.getDate() + 1);
    return next;
  }

  // 매시간 특정 분 (예: "30 * * * *")
  if (hour === "*" && dom === "*" && month === "*" && dow === "*" && minute !== "*") {
    const targetMinute = parseInt(minute);
    const next = new Date(now);
    next.setSeconds(0);
    next.setMilliseconds(0);
    next.setMinutes(targetMinute);
    if (next <= now) next.setHours(next.getHours() + 1);
    return next;
  }

  // 기본: 1분 후
  return new Date(now.getTime() + 60 * 1000);
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

async function runSchedule(schedule: typeof telegramSchedules.$inferSelect) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.warn("[TelegramScheduler] TELEGRAM_BOT_TOKEN not set, skipping schedule:", schedule.id);
    return;
  }

  const db = await getDb();
  if (!db) return;

  let successCount = 0;
  let failCount = 0;

  // 1. 채널 발송
  if (schedule.channelChatId) {
    const ok = await sendTelegramMessage(botToken, schedule.channelChatId, schedule.message);
    if (ok) successCount++; else failCount++;
  }

  // 2. 개별 DM 발송
  const filter = schedule.filter as { hasInvestment?: boolean; hasNode?: boolean; kycApproved?: boolean } | null;
  const conditions: any[] = [isNotNull(users.telegramChatId)];

  if (filter?.hasInvestment) {
    const investedUserIds = await db.selectDistinct({ userId: investments.userId }).from(investments);
    const ids = investedUserIds.map((r: any) => r.userId);
    if (ids.length > 0) conditions.push(inArray(users.id, ids));
  }
  if (filter?.hasNode) {
    const nodeUserIds = await db.selectDistinct({ userId: nodeOrders.userId }).from(nodeOrders);
    const ids = nodeUserIds.map((r: any) => r.userId);
    if (ids.length > 0) conditions.push(inArray(users.id, ids));
  }
  if (filter?.kycApproved) {
    conditions.push(eq(users.kycStatus, "approved"));
  }

  const targetUsers = await db.select({ id: users.id, telegramChatId: users.telegramChatId })
    .from(users).where(and(...conditions));

  for (const u of targetUsers) {
    if (!u.telegramChatId) continue;
    const ok = await sendTelegramMessage(botToken, u.telegramChatId, schedule.message);
    if (ok) successCount++; else failCount++;
    await new Promise(r => setTimeout(r, 35)); // Rate limit
  }

  const total = successCount + failCount;
  const nextRunAt = getNextRunAt(schedule.cronExpression);

  await db.update(telegramSchedules)
    .set({
      lastRunAt: new Date(),
      lastResult: { successCount, failCount, total },
      nextRunAt,
    })
    .where(eq(telegramSchedules.id, schedule.id));

  console.log(`[TelegramScheduler] Schedule #${schedule.id} "${schedule.title}" executed: ${successCount}/${total} sent, next: ${nextRunAt.toISOString()}`);
}

export function startTelegramScheduler() {
  // 1분마다 실행 예정인 스케줄 체크
  cron.schedule("* * * * *", async () => {
    const db = await getDb();
    if (!db) return;

    const now = new Date();
    try {
      const dueSchedules = await db.select().from(telegramSchedules)
        .where(and(
          eq(telegramSchedules.isActive, true),
          lte(telegramSchedules.nextRunAt, now),
        ));

      for (const schedule of dueSchedules) {
        runSchedule(schedule).catch(err =>
          console.error(`[TelegramScheduler] Error running schedule #${schedule.id}:`, err)
        );
      }
    } catch (err) {
      console.error("[TelegramScheduler] Error checking schedules:", err);
    }
  });

  console.log("[TelegramScheduler] Started - checking every minute");
}
