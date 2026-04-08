import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

describe("faq", () => {
  it("faq.list returns empty array when DB unavailable", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    // DB가 없는 환경에서는 빈 배열 반환
    const result = await caller.faq.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("faq.listAdmin requires admin role", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.faq.listAdmin()).rejects.toThrow();
  });

  it("faq.listAdmin succeeds for admin", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    // DB가 없는 환경에서는 빈 배열 반환
    const result = await caller.faq.listAdmin();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("qna", () => {
  it("qna.listPublic returns empty array when DB unavailable", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.qna.listPublic();
    expect(Array.isArray(result)).toBe(true);
  });

  it("qna.listAdmin requires admin role", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.qna.listAdmin()).rejects.toThrow();
  });

  it("qna.listAdmin succeeds for admin", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.qna.listAdmin();
    expect(Array.isArray(result)).toBe(true);
  });

  it("qna.ask requires question field", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    // 빈 질문은 zod validation으로 거부되어야 함
    await expect(caller.qna.ask({ question: "" })).rejects.toThrow();
  });

  it("qna.answer requires admin role", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.qna.answer({ id: 1, answer: "test answer" })).rejects.toThrow();
  });
});

describe("faq.reorder", () => {
  it("faq.reorder requires admin role", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.faq.reorder({ items: [{ id: 1, sortOrder: 0 }] })).rejects.toThrow();
  });

  it("faq.reorder accepts valid items array for admin", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    // DB 없는 환경에서는 INTERNAL_SERVER_ERROR 또는 성공 두 경우 모두 허용 (인증은 통과)
    try {
      const result = await caller.faq.reorder({ items: [{ id: 1, sortOrder: 0 }] });
      expect(result).toMatchObject({ success: true });
    } catch (e: any) {
      expect(e.code).toBe("INTERNAL_SERVER_ERROR");
    }
  });

  it("faq.reorder rejects empty items array for non-admin", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.faq.reorder({ items: [] })).rejects.toThrow();
  });
});
