/**
 * Telegram Scheduled Broadcast Scheduler
 * - node-cron으로 1분마다 nextRunAt이 지난 스케줄을 실행
 * - 실행 후 lastRunAt, lastResult, nextRunAt 업데이트
 * - 중복 발송 방지: 메모리 락 + DB isRunning 플래그
 * - 발송 실패 시 최대 3회 재시도
 * - 타임존 처리: schedule.timezone 기준으로 nextRunAt 계산
 */
import cron from "node-cron";
import { getDb } from "./db";
import { telegramSchedules, users, investments, nodeOrders } from "../drizzle/schema";
import { and, isNotNull, lte, eq, inArray } from "drizzle-orm";

// 중복 실행 방지용 메모리 락 (scheduleId → isRunning)
const runningSchedules = new Set<number>();

/**
 * cron 표현식 + 타임존에서 다음 실행 시간 계산
 * node-cron의 타임존 지원을 활용하여 정확한 다음 실행 시간을 계산
 */
export function getNextRunAt(cronExpr: string, timezone = "Asia/Seoul"): Date {
  const now = new Date();
  const parts = cronExpr.trim().split(/\s+/);
  if (parts.length !== 5) return new Date(now.getTime() + 60 * 1000);

  const [minute, hour, dom, month, dow] = parts;

  // 타임존 기준 현재 시각 파싱
  const tzFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  });
  const tzParts = tzFormatter.formatToParts(now);
  const tzMap: Record<string, number> = {};
  for (const p of tzParts) {
    if (p.type !== "literal") tzMap[p.type] = parseInt(p.value);
  }

  // 타임존 기준 현재 날짜/시간
  const tzNow = new Date(Date.UTC(
    tzMap.year, tzMap.month - 1, tzMap.day,
    tzMap.hour === 24 ? 0 : tzMap.hour, tzMap.minute, tzMap.second
  ));

  // 매주 특정 요일 특정 시간 (예: "0 9 * * 1")
  if (dom === "*" && month === "*" && minute !== "*" && hour !== "*" && dow !== "*") {
    const targetMinute = parseInt(minute);
    const targetHour = parseInt(hour);
    const targetDow = parseInt(dow);

    const next = new Date(tzNow);
    next.setUTCSeconds(0);
    next.setUTCMilliseconds(0);
    next.setUTCMinutes(targetMinute);
    next.setUTCHours(targetHour);

    const currentDow = next.getUTCDay();
    let daysUntil = (targetDow - currentDow + 7) % 7;
    if (daysUntil === 0 && next <= tzNow) daysUntil = 7;
    next.setUTCDate(next.getUTCDate() + daysUntil);

    // 타임존 오프셋 계산하여 UTC로 변환
    return tzToUtc(next, timezone);
  }

  // 매일 특정 시간 (예: "0 9 * * *")
  if (dom === "*" && month === "*" && dow === "*" && minute !== "*" && hour !== "*") {
    const targetMinute = parseInt(minute);
    const targetHour = parseInt(hour);
    const next = new Date(tzNow);
    next.setUTCSeconds(0);
    next.setUTCMilliseconds(0);
    next.setUTCMinutes(targetMinute);
    next.setUTCHours(targetHour);
    if (next <= tzNow) next.setUTCDate(next.getUTCDate() + 1);
    return tzToUtc(next, timezone);
  }

  // 매시간 특정 분 (예: "30 * * * *")
  if (hour === "*" && dom === "*" && month === "*" && dow === "*" && minute !== "*") {
    const targetMinute = parseInt(minute);
    const next = new Date(tzNow);
    next.setUTCSeconds(0);
    next.setUTCMilliseconds(0);
    next.setUTCMinutes(targetMinute);
    if (next <= tzNow) next.setUTCHours(next.getUTCHours() + 1);
    return tzToUtc(next, timezone);
  }

  // 기본: 1분 후
  return new Date(now.getTime() + 60 * 1000);
}

/**
 * 타임존 기준 시각을 UTC로 변환
 * (타임존 오프셋을 계산하여 실제 UTC 시각 반환)
 */
function tzToUtc(tzDate: Date, timezone: string): Date {
  // 현재 UTC와 타임존 기준 시각의 차이를 이용해 오프셋 계산
  const utcNow = new Date();
  const tzFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  });
  const tzParts = tzFormatter.formatToParts(utcNow);
  const tzMap: Record<string, number> = {};
  for (const p of tzParts) {
    if (p.type !== "literal") tzMap[p.type] = parseInt(p.value);
  }
  const tzNowMs = Date.UTC(
    tzMap.year, tzMap.month - 1, tzMap.day,
    tzMap.hour === 24 ? 0 : tzMap.hour, tzMap.minute, tzMap.second
  );
  const offsetMs = utcNow.getTime() - tzNowMs;
  return new Date(tzDate.getTime() + offsetMs);
}

/**
 * 재시도 포함 텔레그램 메시지 발송
 */
async function sendTelegramMessageWithRetry(
  botToken: string,
  chatId: string,
  message: string,
  maxRetries = 3
): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const resp = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" }),
      });
      const data = await resp.json() as { ok: boolean; description?: string };
      if (data.ok) return true;
      // 429 Too Many Requests - 재시도
      if (resp.status === 429 && attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000 * attempt));
        continue;
      }
      // 400 Bad Request (잘못된 chat_id 등) - 재시도 불필요
      if (resp.status === 400) return false;
    } catch {
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 500 * attempt));
        continue;
      }
    }
  }
  return false;
}

async function runSchedule(schedule: typeof telegramSchedules.$inferSelect) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.warn("[TelegramScheduler] TELEGRAM_BOT_TOKEN not set, skipping schedule:", schedule.id);
    return;
  }

  // 중복 실행 방지 (메모리 락)
  if (runningSchedules.has(schedule.id)) {
    console.warn(`[TelegramScheduler] Schedule #${schedule.id} is already running, skipping`);
    return;
  }
  runningSchedules.add(schedule.id);

  const db = await getDb();
  if (!db) {
    runningSchedules.delete(schedule.id);
    return;
  }

  let successCount = 0;
  let failCount = 0;

  try {
    // 1. 채널 발송
    if (schedule.channelChatId) {
      const ok = await sendTelegramMessageWithRetry(botToken, schedule.channelChatId, schedule.message);
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
      const ok = await sendTelegramMessageWithRetry(botToken, u.telegramChatId, schedule.message);
      if (ok) successCount++; else failCount++;
      await new Promise(r => setTimeout(r, 35)); // Rate limit (30 msg/sec)
    }

    const total = successCount + failCount;
    const timezone = schedule.timezone || "Asia/Seoul";
    const nextRunAt = getNextRunAt(schedule.cronExpression, timezone);

    await db.update(telegramSchedules)
      .set({
        lastRunAt: new Date(),
        lastResult: { successCount, failCount, total },
        nextRunAt,
      })
      .where(eq(telegramSchedules.id, schedule.id));

    console.log(
      `[TelegramScheduler] Schedule #${schedule.id} "${schedule.title}" executed: ` +
      `${successCount}/${total} sent, next: ${nextRunAt.toISOString()} (${timezone})`
    );
  } catch (err) {
    console.error(`[TelegramScheduler] Error in schedule #${schedule.id}:`, err);
  } finally {
    runningSchedules.delete(schedule.id);
  }
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
        // 비동기 실행 (블로킹 방지) - 에러는 runSchedule 내부에서 처리
        runSchedule(schedule).catch(err =>
          console.error(`[TelegramScheduler] Unhandled error in schedule #${schedule.id}:`, err)
        );
      }
    } catch (err) {
      console.error("[TelegramScheduler] Error checking schedules:", err);
    }
  });

  console.log("[TelegramScheduler] Started - checking every minute");
}
