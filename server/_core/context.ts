import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { COOKIE_NAME } from "@shared/const";
import { jwtVerify } from "jose";
import * as db from "../db";
import { getCookieValue } from "./cookies";
import { getUserJwtSecretBytes } from "./jwtSecret";

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
    const sessionCookie = getCookieValue(opts.req, COOKIE_NAME);
    if (sessionCookie) {
      const { payload } = await jwtVerify(sessionCookie, getUserJwtSecretBytes());
      const userId = payload.userId as number | undefined;
      if (userId) {
        const found = await db.getUserById(userId);
        user = found ?? null;
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
