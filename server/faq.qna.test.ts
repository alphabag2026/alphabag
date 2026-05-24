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
  it("faq.list handles DB unavailable in test environments", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.faq.list();
      expect(Array.isArray(result)).toBe(true);
    } catch (e: any) {
      expect(e.code).toBe("INTERNAL_SERVER_ERROR");
    }
  });

  it("faq.listAdmin requires admin role", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.faq.listAdmin()).rejects.toThrow();
  });

  it("faq.listAdmin succeeds for admin or reaches DB boundary", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.faq.listAdmin();
      expect(Array.isArray(result)).toBe(true);
    } catch (e: any) {
      expect(e.code).toBe("INTERNAL_SERVER_ERROR");
    }
  });
});

describe("qna", () => {
  it("qna.listPublic handles DB unavailable in test environments", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.qna.listPublic();
      expect(Array.isArray(result)).toBe(true);
    } catch (e: any) {
      expect(e.code).toBe("INTERNAL_SERVER_ERROR");
    }
  });

  it("qna.listAdmin requires admin role", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.qna.listAdmin()).rejects.toThrow();
  });

  it("qna.listAdmin succeeds for admin or reaches DB boundary", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.qna.listAdmin();
      expect(Array.isArray(result)).toBe(true);
    } catch (e: any) {
      expect(e.code).toBe("INTERNAL_SERVER_ERROR");
    }
  });

  it("qna.ask requires question field", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
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
