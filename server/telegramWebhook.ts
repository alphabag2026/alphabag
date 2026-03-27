import type { Express, Request, Response } from "express";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * 텔레그램 봇 웹훅 핸들러
 * - 사용자가 봇에 /start 메시지를 보내면 Chat ID를 DB에 자동 저장
 * - /start 수신 시 사용자 언어(from.language_code)에 맞게 다국어 응답
 * - 웹훅 URL: POST /api/telegram/webhook
 */

// ─── 다국어 메시지 ────────────────────────────────────────────────────────────
type LangCode = "ko" | "en" | "zh" | "ja" | "vi" | "th" | "id";

function detectLang(languageCode?: string): LangCode {
  if (!languageCode) return "en";
  const code = languageCode.toLowerCase().split("-")[0];
  const map: Record<string, LangCode> = {
    ko: "ko",
    en: "en",
    zh: "zh",
    ja: "ja",
    vi: "vi",
    th: "th",
    id: "id",
  };
  return map[code] ?? "en";
}

const MESSAGES = {
  alreadyConnected: {
    ko: (name: string) => `✅ 이미 연결되어 있습니다!\n\n안녕하세요, ${name}님!\nAlphaBag 알림을 받을 준비가 되어 있습니다. 🎉`,
    en: (name: string) => `✅ Already connected!\n\nHello, ${name}!\nYou're all set to receive AlphaBag notifications. 🎉`,
    zh: (name: string) => `✅ 已连接！\n\n您好，${name}！\n您已准备好接收 AlphaBag 通知。🎉`,
    ja: (name: string) => `✅ すでに接続済みです！\n\nこんにちは、${name}さん！\nAlphaBag の通知を受け取る準備ができています。🎉`,
    vi: (name: string) => `✅ Đã kết nối!\n\nXin chào, ${name}!\nBạn đã sẵn sàng nhận thông báo AlphaBag. 🎉`,
    th: (name: string) => `✅ เชื่อมต่อแล้ว!\n\nสวัสดี, ${name}!\nคุณพร้อมรับการแจ้งเตือน AlphaBag แล้ว 🎉`,
    id: (name: string) => `✅ Sudah terhubung!\n\nHalo, ${name}!\nAnda siap menerima notifikasi AlphaBag. 🎉`,
  },
  linked: {
    ko: (name: string) => `🎉 텔레그램 연동 완료!\n\n안녕하세요, ${name}님!\n이제 AlphaBag 공지 및 알림을 이 채팅으로 받으실 수 있습니다. 📢`,
    en: (name: string) => `🎉 Telegram linked successfully!\n\nHello, ${name}!\nYou will now receive AlphaBag announcements and alerts here. 📢`,
    zh: (name: string) => `🎉 Telegram 绑定成功！\n\n您好，${name}！\n您现在可以在此接收 AlphaBag 公告和提醒。📢`,
    ja: (name: string) => `🎉 Telegram 連携完了！\n\nこんにちは、${name}さん！\nこちらで AlphaBag のお知らせを受け取れます。📢`,
    vi: (name: string) => `🎉 Liên kết Telegram thành công!\n\nXin chào, ${name}!\nBạn sẽ nhận thông báo AlphaBag tại đây. 📢`,
    th: (name: string) => `🎉 เชื่อมต่อ Telegram สำเร็จ!\n\nสวัสดี, ${name}!\nคุณจะได้รับประกาศ AlphaBag ที่นี่ 📢`,
    id: (name: string) => `🎉 Telegram berhasil dihubungkan!\n\nHalo, ${name}!\nAnda akan menerima pengumuman AlphaBag di sini. 📢`,
  },
  chatIdGuide: {
    ko: (chatId: string, firstName: string) =>
      `👋 안녕하세요, ${firstName}님!\n\n귀하의 Chat ID: <code>${chatId}</code>\n\n📌 AlphaBag 사이트 → 마이페이지 → <b>Telegram Notification</b>에서 위 Chat ID를 입력하여 연동하세요.\n\n또는 AlphaBag 사이트에서 <b>"텔레그램 연동"</b> 버튼을 클릭하면 자동으로 연동됩니다.`,
    en: (chatId: string, firstName: string) =>
      `👋 Hello, ${firstName}!\n\nYour Chat ID: <code>${chatId}</code>\n\n📌 Go to AlphaBag → My Page → <b>Telegram Notification</b> and enter the Chat ID above.\n\nOr click the <b>"Link Telegram"</b> button on the AlphaBag site for automatic setup.`,
    zh: (chatId: string, firstName: string) =>
      `👋 您好，${firstName}！\n\n您的 Chat ID: <code>${chatId}</code>\n\n📌 前往 AlphaBag → 我的页面 → <b>Telegram 通知</b>，输入上方的 Chat ID 进行绑定。\n\n或在 AlphaBag 网站点击 <b>"绑定 Telegram"</b> 按钮自动完成。`,
    ja: (chatId: string, firstName: string) =>
      `👋 こんにちは、${firstName}さん！\n\nあなたの Chat ID: <code>${chatId}</code>\n\n📌 AlphaBag → マイページ → <b>Telegram 通知</b> で上記の Chat ID を入力してください。\n\nまたは AlphaBag サイトの <b>「Telegram 連携」</b> ボタンをクリックすると自動で設定できます。`,
    vi: (chatId: string, firstName: string) =>
      `👋 Xin chào, ${firstName}!\n\nChat ID của bạn: <code>${chatId}</code>\n\n📌 Vào AlphaBag → Trang cá nhân → <b>Thông báo Telegram</b> và nhập Chat ID trên.\n\nHoặc nhấn nút <b>"Liên kết Telegram"</b> trên trang AlphaBag để tự động thiết lập.`,
    th: (chatId: string, firstName: string) =>
      `👋 สวัสดี, ${firstName}!\n\nChat ID ของคุณ: <code>${chatId}</code>\n\n📌 ไปที่ AlphaBag → หน้าของฉัน → <b>การแจ้งเตือน Telegram</b> แล้วกรอก Chat ID ด้านบน\n\nหรือคลิกปุ่ม <b>"เชื่อมต่อ Telegram"</b> บนเว็บ AlphaBag เพื่อตั้งค่าอัตโนมัติ`,
    id: (chatId: string, firstName: string) =>
      `👋 Halo, ${firstName}!\n\nChat ID Anda: <code>${chatId}</code>\n\n📌 Buka AlphaBag → Halaman Saya → <b>Notifikasi Telegram</b> dan masukkan Chat ID di atas.\n\nAtau klik tombol <b>"Hubungkan Telegram"</b> di situs AlphaBag untuk pengaturan otomatis.`,
  },
  walletNotFound: {
    ko: (chatId: string, firstName: string) =>
      `👋 안녕하세요, ${firstName}님!\n\n지갑 주소를 찾을 수 없습니다.\n\n귀하의 Chat ID: <code>${chatId}</code>\n\n📌 AlphaBag 사이트 → 마이페이지 → <b>Telegram Notification</b>에서 위 Chat ID를 직접 입력하여 연동하세요.`,
    en: (chatId: string, firstName: string) =>
      `👋 Hello, ${firstName}!\n\nWallet address not found.\n\nYour Chat ID: <code>${chatId}</code>\n\n📌 Go to AlphaBag → My Page → <b>Telegram Notification</b> and enter the Chat ID manually.`,
    zh: (chatId: string, firstName: string) =>
      `👋 您好，${firstName}！\n\n未找到钱包地址。\n\n您的 Chat ID: <code>${chatId}</code>\n\n📌 前往 AlphaBag → 我的页面 → <b>Telegram 通知</b>，手动输入上方的 Chat ID。`,
    ja: (chatId: string, firstName: string) =>
      `👋 こんにちは、${firstName}さん！\n\nウォレットアドレスが見つかりません。\n\nあなたの Chat ID: <code>${chatId}</code>\n\n📌 AlphaBag → マイページ → <b>Telegram 通知</b> で Chat ID を手動で入力してください。`,
    vi: (chatId: string, firstName: string) =>
      `👋 Xin chào, ${firstName}!\n\nKhông tìm thấy địa chỉ ví.\n\nChat ID của bạn: <code>${chatId}</code>\n\n📌 Vào AlphaBag → Trang cá nhân → <b>Thông báo Telegram</b> và nhập Chat ID thủ công.`,
    th: (chatId: string, firstName: string) =>
      `👋 สวัสดี, ${firstName}!\n\nไม่พบที่อยู่กระเป๋าเงิน\n\nChat ID ของคุณ: <code>${chatId}</code>\n\n📌 ไปที่ AlphaBag → หน้าของฉัน → <b>การแจ้งเตือน Telegram</b> แล้วกรอก Chat ID ด้วยตนเอง`,
    id: (chatId: string, firstName: string) =>
      `👋 Halo, ${firstName}!\n\nAlamat dompet tidak ditemukan.\n\nChat ID Anda: <code>${chatId}</code>\n\n📌 Buka AlphaBag → Halaman Saya → <b>Notifikasi Telegram</b> dan masukkan Chat ID secara manual.`,
  },
};

// ─── 메인 웹훅 핸들러 ─────────────────────────────────────────────────────────
export function registerTelegramWebhook(app: Express) {
  app.post("/api/telegram/webhook", async (req: Request, res: Response) => {
    try {
      const update = req.body;

      if (!update?.message) {
        res.json({ ok: true });
        return;
      }

      const message = update.message;
      const chatId = String(message.chat?.id);
      const text = message.text || "";
      const firstName = message.from?.first_name || "User";
      const lang = detectLang(message.from?.language_code);

      // /help 명령어
      if (text === "/help" || text.startsWith("/help ")) {
        const helpMessages: Record<LangCode, string> = {
          ko: `📖 <b>AlphaBag 봇 도움말</b>\n\n/start - 텔레그램 연동 시작\n/status - 내 연동 상태 확인\n/help - 도움말 보기\n\n📌 AlphaBag 사이트: ${process.env.VITE_OAUTH_PORTAL_URL || "https://alphabag.io"}`,
          en: `📖 <b>AlphaBag Bot Help</b>\n\n/start - Start Telegram linking\n/status - Check my connection status\n/help - Show this help\n\n📌 AlphaBag site: ${process.env.VITE_OAUTH_PORTAL_URL || "https://alphabag.io"}`,
          zh: `📖 <b>AlphaBag 机器人帮助</b>\n\n/start - 开始 Telegram 绑定\n/status - 查看我的连接状态\n/help - 显示帮助\n\n📌 AlphaBag 网站: ${process.env.VITE_OAUTH_PORTAL_URL || "https://alphabag.io"}`,
          ja: `📖 <b>AlphaBag ボットヘルプ</b>\n\n/start - Telegram 連携を開始\n/status - 接続状態を確認\n/help - ヘルプを表示\n\n📌 AlphaBag サイト: ${process.env.VITE_OAUTH_PORTAL_URL || "https://alphabag.io"}`,
          vi: `📖 <b>Trợ giúp Bot AlphaBag</b>\n\n/start - Bắt đầu liên kết Telegram\n/status - Kiểm tra trạng thái kết nối\n/help - Hiển thị trợ giúp\n\n📌 Trang AlphaBag: ${process.env.VITE_OAUTH_PORTAL_URL || "https://alphabag.io"}`,
          th: `📖 <b>ความช่วยเหลือบอท AlphaBag</b>\n\n/start - เริ่มเชื่อมต่อ Telegram\n/status - ตรวจสอบสถานะการเชื่อมต่อ\n/help - แสดงความช่วยเหลือ\n\n📌 เว็บ AlphaBag: ${process.env.VITE_OAUTH_PORTAL_URL || "https://alphabag.io"}`,
          id: `📖 <b>Bantuan Bot AlphaBag</b>\n\n/start - Mulai menghubungkan Telegram\n/status - Cek status koneksi saya\n/help - Tampilkan bantuan\n\n📌 Situs AlphaBag: ${process.env.VITE_OAUTH_PORTAL_URL || "https://alphabag.io"}`,
        };
        await sendTelegramMessage(chatId, helpMessages[lang]);
        res.json({ ok: true });
        return;
      }

      // /status 명령어
      if (text === "/status" || text.startsWith("/status ")) {
        const database = await getDb();
        if (database) {
          const existingUsers = await database
            .select({ id: users.id, name: users.name, walletAddress: users.walletAddress })
            .from(users)
            .where(eq(users.telegramChatId, chatId));

          if (existingUsers.length > 0) {
            const u = existingUsers[0];
            const displayName = u.name || firstName;
            const walletShort = u.walletAddress
              ? `${u.walletAddress.slice(0, 6)}...${u.walletAddress.slice(-4)}`
              : "-";
            const statusMessages: Record<LangCode, string> = {
              ko: `✅ <b>연동 상태</b>\n\n이름: ${displayName}\n지갑: <code>${walletShort}</code>\nChat ID: <code>${chatId}</code>\n\n📢 AlphaBag 알림이 이 채팅으로 전송됩니다.`,
              en: `✅ <b>Connection Status</b>\n\nName: ${displayName}\nWallet: <code>${walletShort}</code>\nChat ID: <code>${chatId}</code>\n\n📢 AlphaBag notifications will be sent here.`,
              zh: `✅ <b>连接状态</b>\n\n姓名: ${displayName}\n钱包: <code>${walletShort}</code>\nChat ID: <code>${chatId}</code>\n\n📢 AlphaBag 通知将发送到此处。`,
              ja: `✅ <b>接続状態</b>\n\n名前: ${displayName}\nウォレット: <code>${walletShort}</code>\nChat ID: <code>${chatId}</code>\n\n📢 AlphaBag の通知はここに届きます。`,
              vi: `✅ <b>Trạng thái kết nối</b>\n\nTên: ${displayName}\nVí: <code>${walletShort}</code>\nChat ID: <code>${chatId}</code>\n\n📢 Thông báo AlphaBag sẽ được gửi tại đây.`,
              th: `✅ <b>สถานะการเชื่อมต่อ</b>\n\nชื่อ: ${displayName}\nกระเป๋าเงิน: <code>${walletShort}</code>\nChat ID: <code>${chatId}</code>\n\n📢 การแจ้งเตือน AlphaBag จะถูกส่งมาที่นี่`,
              id: `✅ <b>Status Koneksi</b>\n\nNama: ${displayName}\nDompet: <code>${walletShort}</code>\nChat ID: <code>${chatId}</code>\n\n📢 Notifikasi AlphaBag akan dikirim ke sini.`,
            };
            await sendTelegramMessage(chatId, statusMessages[lang]);
          } else {
            const notLinkedMessages: Record<LangCode, string> = {
              ko: `❌ <b>연동되지 않음</b>\n\nChat ID: <code>${chatId}</code>\n\n📌 /start 명령어로 AlphaBag 계정과 연동하세요.`,
              en: `❌ <b>Not connected</b>\n\nChat ID: <code>${chatId}</code>\n\n📌 Use /start to link your AlphaBag account.`,
              zh: `❌ <b>未连接</b>\n\nChat ID: <code>${chatId}</code>\n\n📌 使用 /start 命令绑定您的 AlphaBag 账户。`,
              ja: `❌ <b>未接続</b>\n\nChat ID: <code>${chatId}</code>\n\n📌 /start コマンドで AlphaBag アカウントを連携してください。`,
              vi: `❌ <b>Chưa kết nối</b>\n\nChat ID: <code>${chatId}</code>\n\n📌 Dùng /start để liên kết tài khoản AlphaBag của bạn.`,
              th: `❌ <b>ยังไม่ได้เชื่อมต่อ</b>\n\nChat ID: <code>${chatId}</code>\n\n📌 ใช้ /start เพื่อเชื่อมต่อบัญชี AlphaBag ของคุณ`,
              id: `❌ <b>Belum terhubung</b>\n\nChat ID: <code>${chatId}</code>\n\n📌 Gunakan /start untuk menghubungkan akun AlphaBag Anda.`,
            };
            await sendTelegramMessage(chatId, notLinkedMessages[lang]);
          }
        }
        res.json({ ok: true });
        return;
      }

      if (text.startsWith("/start")) {
        const database = await getDb();
        if (database) {
          // 이미 등록된 사용자 확인
          const existingUsers = await database
            .select({ id: users.id, name: users.name })
            .from(users)
            .where(eq(users.telegramChatId, chatId));

          if (existingUsers.length > 0) {
            const displayName = existingUsers[0].name || firstName;
            await sendTelegramMessage(chatId, MESSAGES.alreadyConnected[lang](displayName));
          } else {
            const payload = text.replace("/start", "").trim();

            if (payload) {
              // 딥링크: /start <walletAddress>
              const matchedByWallet = await database
                .select({ id: users.id, name: users.name })
                .from(users)
                .where(eq(users.walletAddress, payload));

              if (matchedByWallet.length > 0) {
                await database
                  .update(users)
                  .set({ telegramChatId: chatId })
                  .where(eq(users.id, matchedByWallet[0].id));

                const displayName = matchedByWallet[0].name || firstName;
                await sendTelegramMessage(chatId, MESSAGES.linked[lang](displayName));
              } else {
                await sendTelegramMessage(chatId, MESSAGES.walletNotFound[lang](chatId, firstName));
              }
            } else {
              // payload 없음 - Chat ID 안내
              await sendTelegramMessage(chatId, MESSAGES.chatIdGuide[lang](chatId, firstName));
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
