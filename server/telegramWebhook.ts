import type { Express, Request, Response } from "express";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * 텔레그램 봇 웹훅 핸들러
 * - 사용자가 봇에 /start 메시지를 보내면 Chat ID를 DB에 자동 저장
 * - 웹훅 URL: POST /api/telegram/webhook
 *
 * 웹훅 등록 방법:
 * curl "https://api.telegram.org/bot{BOT_TOKEN}/setWebhook?url=https://YOUR_DOMAIN/api/telegram/webhook"
 */
export function registerTelegramWebhook(app: Express) {
  app.post("/api/telegram/webhook", async (req: Request, res: Response) => {
    try {
      const update = req.body;

      // 메시지가 없으면 무시
      if (!update?.message) {
        res.json({ ok: true });
        return;
      }

      const message = update.message;
      const chatId = String(message.chat?.id);
      const text = message.text || "";
      const firstName = message.from?.first_name || "";
      const username = message.from?.username || "";

      // /start 명령어 처리
      if (text.startsWith("/start")) {
        const database = await getDb();
        if (database) {
          // chatId로 기존 사용자 찾기
          const existingUsers = await database
            .select({ id: users.id, name: users.name })
            .from(users)
            .where(eq(users.telegramChatId, chatId));

          if (existingUsers.length > 0) {
            // 이미 등록된 사용자 - 환영 메시지
            await sendTelegramMessage(chatId, `✅ 이미 연결되어 있습니다!\n\n안녕하세요, ${existingUsers[0].name || firstName}님!\nAlphaBag 알림을 받을 준비가 되어 있습니다.`);
          } else {
            // /start 뒤에 payload가 있으면 (딥링크 방식)
            const payload = text.replace("/start", "").trim();

            if (payload) {
              // 딥링크: /start <walletAddress 또는 userId>
              // 지갑 주소로 사용자 찾기
              const matchedByWallet = await database
                .select({ id: users.id, name: users.name })
                .from(users)
                .where(eq(users.walletAddress, payload));

              if (matchedByWallet.length > 0) {
                await database
                  .update(users)
                  .set({ telegramChatId: chatId })
                  .where(eq(users.id, matchedByWallet[0].id));

                await sendTelegramMessage(
                  chatId,
                  `🎉 텔레그램 연동 완료!\n\n안녕하세요, ${matchedByWallet[0].name || firstName}님!\n이제 AlphaBag 공지 및 알림을 이 채팅으로 받으실 수 있습니다.`
                );
              } else {
                // 매칭 실패 - Chat ID만 임시 저장 안내
                await sendTelegramMessage(
                  chatId,
                  `👋 안녕하세요, ${firstName}님!\n\n귀하의 Chat ID: <code>${chatId}</code>\n\nAlphaBag 사이트 → 마이페이지 → Telegram Notification에서 위 Chat ID를 입력하여 연동하세요.`
                );
              }
            } else {
              // payload 없음 - Chat ID 안내
              await sendTelegramMessage(
                chatId,
                `👋 안녕하세요, ${firstName}님!\n\n귀하의 Chat ID: <code>${chatId}</code>\n\nAlphaBag 사이트 → 마이페이지 → Telegram Notification에서 위 Chat ID를 입력하여 연동하세요.\n\n또는 AlphaBag 사이트에서 "텔레그램 연동" 버튼을 클릭하면 자동으로 연동됩니다.`
              );
            }
          }
        }
      }

      res.json({ ok: true });
    } catch (err) {
      console.error("[TelegramWebhook] Error:", err);
      res.json({ ok: true }); // 텔레그램은 항상 200 응답 필요
    }
  });

  // 웹훅 상태 확인 엔드포인트
  app.get("/api/telegram/webhook/info", async (_req: Request, res: Response) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      res.json({ ok: false, error: "TELEGRAM_BOT_TOKEN not set" });
      return;
    }
    try {
      const r = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
      const data = await r.json();
      res.json(data);
    } catch (err) {
      res.json({ ok: false, error: String(err) });
    }
  });

  // 웹훅 자동 등록 엔드포인트 (관리자가 호출)
  app.post("/api/telegram/webhook/register", async (req: Request, res: Response) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      res.json({ ok: false, error: "TELEGRAM_BOT_TOKEN not set" });
      return;
    }
    const { webhookUrl } = req.body;
    if (!webhookUrl) {
      res.json({ ok: false, error: "webhookUrl required" });
      return;
    }
    try {
      const r = await fetch(
        `https://api.telegram.org/bot${token}/setWebhook`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: webhookUrl, allowed_updates: ["message"] }),
        }
      );
      const data = await r.json();
      res.json(data);
    } catch (err) {
      res.json({ ok: false, error: String(err) });
    }
  });
}

async function sendTelegramMessage(chatId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
  } catch (err) {
    console.error("[TelegramWebhook] sendMessage error:", err);
  }
}
