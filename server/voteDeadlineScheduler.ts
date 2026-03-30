/**
 * voteDeadlineScheduler.ts
 * 투표 마감 자동화 스케줄러
 * 5분마다 실행 → votingEndAt이 지난 voting 상태 신청 건을 자동 집계하여 approved/rejected 처리
 */

import { getDb } from "./db";
import { planSubmissions, submissionSettings, submissionVotes, users } from "../drizzle/schema";
import { eq, and, lte, isNotNull } from "drizzle-orm";
import { createAuditLog } from "./db";

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5분마다

/**
 * 마감된 투표 건 자동 집계 처리
 */
async function processExpiredVotes() {
  const db = await getDb();
  if (!db) return;

  const now = new Date();

  // 현재 설정 조회
  const settingsRows = await db.select().from(submissionSettings).limit(1);
  const settings = settingsRows[0];
  const thresholdPct = settings?.approvalThresholdPct ?? 60;

  // voting 상태이고 votingEndAt이 현재 시각 이전인 신청 건 조회
  const expiredSubmissions = await db
    .select()
    .from(planSubmissions)
    .where(
      and(
        eq(planSubmissions.status, "voting"),
        isNotNull(planSubmissions.votingEndAt),
        lte(planSubmissions.votingEndAt, now)
      )
    );

  if (expiredSubmissions.length === 0) return;

  console.log(`[VoteDeadlineScheduler] Processing ${expiredSubmissions.length} expired votes...`);

  for (const submission of expiredSubmissions) {
    try {
      const totalVotes = submission.totalVotes ?? 0;
      const approveVotes = submission.approveVotes ?? 0;

      // 투표가 없으면 rejected 처리
      const approvePct = totalVotes > 0 ? (approveVotes / totalVotes) * 100 : 0;
      const newStatus: "approved" | "rejected" = approvePct >= thresholdPct ? "approved" : "rejected";

      await db
        .update(planSubmissions)
        .set({
          status: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(planSubmissions.id, submission.id));

      console.log(
        `[VoteDeadlineScheduler] Submission #${submission.id} → ${newStatus} ` +
        `(${approveVotes}/${totalVotes} votes, ${approvePct.toFixed(1)}% approval)`
      );

      // 감사 로그 기록 (adminId=0: 시스템 자동 처리)
      await createAuditLog({
        adminId: 0,
        action: "AUTO_VOTE_DEADLINE",
        targetType: "submission",
        targetId: submission.id,
        details: {
          status: newStatus,
          totalVotes,
          approveVotes,
          rejectVotes: submission.rejectVotes ?? 0,
          approvePct: parseFloat(approvePct.toFixed(2)),
          thresholdPct,
        },
      });

      // 이메일 알림 발송 (비동기 - 실패해도 상태 변경은 성공)
      sendResultEmail(submission, newStatus, approvePct, totalVotes).catch((e) => {
        console.warn(`[VoteDeadlineScheduler] Email failed for #${submission.id}:`, e);
      });

      // 신청자 텔레그램 알림 (텔레그램 핸들이 있는 경우)
      if (submission.applicantTelegram) {
        sendResultTelegram(submission, newStatus, approvePct, totalVotes).catch(() => {});
      }
    } catch (e) {
      console.error(`[VoteDeadlineScheduler] Error processing submission #${submission.id}:`, e);
    }
  }
}

/**
 * 투표 결과 이메일 발송
 */
async function sendResultEmail(
  submission: typeof planSubmissions.$inferSelect,
  result: "approved" | "rejected",
  approvePct: number,
  totalVotes: number
) {
  const planData = (submission.finalPlanData ?? submission.parsedPlanData) as any;
  const planName = planData?.name ?? `신청 #${submission.id}`;
  const applicantName = submission.applicantName;
  const applicantEmail = submission.applicantEmail;

  if (!applicantEmail) return;

  const isApproved = result === "approved";
  const subject = isApproved
    ? `[AlphaBag] 🎉 "${planName}" 플랜 상장 심사 통과 안내`
    : `[AlphaBag] "${planName}" 플랜 심사 결과 안내`;

  const body = isApproved
    ? `
안녕하세요, ${applicantName}님!

AlphaBag 플랫폼에 "${planName}" 플랜을 신청해 주셔서 감사합니다.

노드 보유자 투표 결과, 귀하의 플랜이 **상장 심사를 통과**하였습니다.

📊 투표 결과
- 총 투표 수: ${totalVotes}표
- 찬성 비율: ${approvePct.toFixed(1)}%
- 심사 기준: ${60}% 이상 찬성

✅ 다음 단계
AlphaBag 운영팀에서 플랜 등록 절차를 진행할 예정입니다.
마이페이지(https://alphabagv2-tgrbnq7y.manus.space/my-submissions)에서 진행 상황을 확인하실 수 있습니다.

문의사항이 있으시면 텔레그램(@alphabag_support)으로 연락 주세요.

감사합니다.
AlphaBag 운영팀 드림
`
    : `
안녕하세요, ${applicantName}님!

AlphaBag 플랫폼에 "${planName}" 플랜을 신청해 주셔서 감사합니다.

노드 보유자 투표 결과, 아쉽게도 이번 심사에서 **상장 기준에 미달**하였습니다.

📊 투표 결과
- 총 투표 수: ${totalVotes}표
- 찬성 비율: ${approvePct.toFixed(1)}%
- 심사 기준: ${60}% 이상 찬성 필요

💡 재신청 안내
플랜을 보완하여 재신청하실 수 있습니다.
마이페이지(https://alphabagv2-tgrbnq7y.manus.space/my-submissions)에서 상세 내역을 확인하세요.

문의사항이 있으시면 텔레그램(@alphabag_support)으로 연락 주세요.

감사합니다.
AlphaBag 운영팀 드림
`;

  // Manus 내장 이메일 API 사용
  const apiUrl = process.env.BUILT_IN_FORGE_API_URL;
  const apiKey = process.env.BUILT_IN_FORGE_API_KEY;

  if (!apiUrl || !apiKey) {
    console.warn("[VoteDeadlineScheduler] Email API not configured, skipping email");
    return;
  }

  try {
    const res = await fetch(`${apiUrl}/v1/email/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        to: applicantEmail,
        subject,
        text: body,
      }),
    });

    if (res.ok) {
      console.log(`[VoteDeadlineScheduler] Email sent to ${applicantEmail} (${result})`);
    } else {
      const err = await res.text();
      console.warn(`[VoteDeadlineScheduler] Email API error: ${err}`);
    }
  } catch (e) {
    console.warn("[VoteDeadlineScheduler] Email send failed:", e);
  }
}

/**
 * 투표 결과 텔레그램 알림 (신청자 텔레그램 핸들 기반)
 * 참고: 텔레그램 핸들(@username)은 chat_id가 아니므로 직접 DM 불가 → 채널 공지 또는 봇 연동 필요
 * 현재는 로그만 남기고, 향후 봇 연동 시 활성화
 */
async function sendResultTelegram(
  submission: typeof planSubmissions.$inferSelect,
  result: "approved" | "rejected",
  approvePct: number,
  totalVotes: number
) {
  const planData = (submission.finalPlanData ?? submission.parsedPlanData) as any;
  const planName = planData?.name ?? `신청 #${submission.id}`;
  const isApproved = result === "approved";

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return;

  // 신청자가 텔레그램 봇과 연동된 경우 (telegramChatId가 있는 경우)
  // applicantTelegram은 @username 형식이므로 DB에서 해당 사용자의 chatId를 찾아야 함
  // 현재는 applicantEmail로 사용자 조회 후 telegramChatId 확인
  const db = await getDb();
  if (!db) return;

  const userRows = await db
    .select({ telegramChatId: users.telegramChatId })
    .from(users)
    .where(eq(users.email, submission.applicantEmail))
    .limit(1);

  const chatId = userRows[0]?.telegramChatId;
  if (!chatId) return;

  const emoji = isApproved ? "🎉" : "📋";
  const statusText = isApproved ? "상장 심사 통과" : "심사 미달";
  const msg = [
    `${emoji} *투표 결과 안내*`,
    ``,
    `안녕하세요, ${submission.applicantName}님!`,
    `**"${planName}"** 플랜 투표가 마감되었습니다.`,
    ``,
    `📊 *결과:* ${statusText}`,
    `✅ *찬성 비율:* ${approvePct.toFixed(1)}%`,
    `👥 *총 투표 수:* ${totalVotes}표`,
    ``,
    isApproved
      ? `🔗 마이페이지에서 상세 내역을 확인하세요.`
      : `💡 플랜을 보완하여 재신청하실 수 있습니다.`,
    `https://alphabagv2-tgrbnq7y.manus.space/my-submissions`,
  ].join("\n");

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: "Markdown" }),
    });
    console.log(`[VoteDeadlineScheduler] Telegram sent to chatId ${chatId} (${result})`);
  } catch (e) {
    console.warn("[VoteDeadlineScheduler] Telegram send failed:", e);
  }
}

/**
 * 스케줄러 시작
 */
export function startVoteDeadlineScheduler() {
  console.log("[VoteDeadlineScheduler] Starting vote deadline scheduler (every 5 min)...");

  // 시작 후 60초 뒤 첫 실행 (다른 스케줄러와 시작 시간 분산)
  setTimeout(async () => {
    await processExpiredVotes();
    setInterval(processExpiredVotes, POLL_INTERVAL_MS);
  }, 60_000);
}
