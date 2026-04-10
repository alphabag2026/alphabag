import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { COOKIE_NAME } from "@shared/const";
import * as db from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  try {
    // sdk.ts의 verifySession을 사용하여 JWT 검증 (openId 기반)
    // 이전 방식(userId 기반)과 달리 sdk.ts와 동일한 시크릿/페이로드 구조를 사용
    const { sdk } = await import("./sdk");
    const cookies = opts.req.cookies ?? {};
    const sessionCookie = cookies[COOKIE_NAME];
    if (sessionCookie) {
      const session = await sdk.verifySession(sessionCookie);
      if (session?.openId) {
        const found = await db.getUserByOpenId(session.openId);
        user = found ?? null;
        // DB에 없으면 OAuth 서버에서 동기화 시도
        if (!user) {
          try {
            const userInfo = await sdk.getUserInfoWithJwt(sessionCookie);
            await db.upsertUser({
              openId: userInfo.openId,
              name: userInfo.name || null,
              email: userInfo.email ?? null,
              loginMethod: (userInfo as any).loginMethod ?? null,
              lastSignedIn: new Date(),
            });
            user = await db.getUserByOpenId(userInfo.openId) ?? null;
          } catch {
            user = null;
          }
        }
      }
    }
  } catch {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
