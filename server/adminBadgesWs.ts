/**
 * adminBadgesWs.ts
 * WebSocket 서버 - 관리자 배지 실시간 갱신
 * 경로: /ws/admin-badges
 * 연결 시 즉시 배지 카운트 전송, 이후 30초마다 자동 push
 */
import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import { getDb } from "./db";
import { supportTickets, nodeOrders, planSubmissions } from "../drizzle/schema";
import { eq, count } from "drizzle-orm";

// 배지 카운트 계산
async function getBadgeCounts() {
  try {
    const db = await getDb();
    if (!db) return { tickets: 0, nodeOrders: 0, submissions: 0 };
    const [ticketRows, nodeRows, submissionRows] = await Promise.all([
      db.select({ cnt: count() }).from(supportTickets).where(eq(supportTickets.status, "open")),
      db.select({ cnt: count() }).from(nodeOrders).where(eq(nodeOrders.status, "pending")),
      db.select({ cnt: count() }).from(planSubmissions).where(eq(planSubmissions.status, "draft")),
    ]);
    return {
      tickets: Number(ticketRows[0]?.cnt ?? 0),
      nodeOrders: Number(nodeRows[0]?.cnt ?? 0),
      submissions: Number(submissionRows[0]?.cnt ?? 0),
    };
  } catch {
    return { tickets: 0, nodeOrders: 0, submissions: 0 };
  }
}

// 연결된 관리자 클라이언트 집합
const adminClients = new Set<WebSocket>();

// 모든 연결된 클라이언트에 배지 카운트 브로드캐스트
async function broadcastBadges() {
  if (adminClients.size === 0) return;
  const counts = await getBadgeCounts();
  const msg = JSON.stringify({ type: "badges", data: counts });
  for (const ws of Array.from(adminClients)) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  }
}

// 30초마다 자동 브로드캐스트
let broadcastInterval: ReturnType<typeof setInterval> | null = null;

export function setupAdminBadgesWs(server: Server) {
  const wss = new WebSocketServer({ server, path: "/ws/admin-badges" });

  wss.on("connection", async (ws) => {
    adminClients.add(ws);

    // 연결 즉시 현재 배지 카운트 전송
    try {
      const counts = await getBadgeCounts();
      ws.send(JSON.stringify({ type: "badges", data: counts }));
    } catch {
      // ignore
    }

    ws.on("close", () => {
      adminClients.delete(ws);
    });

    ws.on("error", () => {
      adminClients.delete(ws);
    });
  });

  // 30초마다 브로드캐스트 (서버 전체에서 하나만 실행)
  if (!broadcastInterval) {
    broadcastInterval = setInterval(broadcastBadges, 30000);
  }

  return wss;
}

// 외부에서 즉시 배지 갱신 트리거 (티켓 생성/해결 시 호출 가능)
export async function triggerBadgeUpdate() {
  await broadcastBadges();
}
