import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

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
    res: {} as TrpcContext["res"],
  };
}

describe("sns.influencers (public)", () => {
  it("returns an array", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.sns.influencers();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("sns.posts (public)", () => {
  it("returns an array with no filter", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.sns.posts({ limit: 10 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("accepts influencerId filter", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.sns.posts({ influencerId: 999, limit: 10 });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });
});

describe("sns admin procedures", () => {
  it("adminInfluencers requires admin role", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.sns.adminInfluencers()).rejects.toThrow();
  });

  it("adminInfluencers returns array for admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.sns.adminInfluencers();
    expect(Array.isArray(result)).toBe(true);
  });

  it("adminPosts returns array for admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.sns.adminPosts({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("createInfluencer requires admin role", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.sns.createInfluencer({
      name: "Test", handle: "test_handle",
    })).rejects.toThrow();
  });

  it("deletePost requires admin role", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.sns.deletePost({ id: 1 })).rejects.toThrow();
  });

  it("manualFetch requires admin role", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.sns.manualFetch({ influencerId: 1 })).rejects.toThrow();
  });

  it("manualFetch returns NOT_FOUND for non-existent influencer", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    await expect(caller.sns.manualFetch({ influencerId: 999999 })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("updateInfluencer accepts autoFetchEnabled and snsTelegramChatId fields", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    // Should not throw on valid input (even if id doesn't exist, DB update is a no-op)
    await expect(
      caller.sns.updateInfluencer({
        id: 999999,
        autoFetchEnabled: true,
        snsTelegramChatId: "-100123456789",
        twitterUserId: "12345",
      })
    ).resolves.toMatchObject({ success: true });
  });

  it("createPost accepts sendToTelegram flag", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    // influencerId 999999 doesn't exist, but insert should still succeed (FK not enforced in test)
    // We just verify the input schema accepts the flag without throwing a validation error
    const result = await caller.sns.createPost({
      influencerId: 1,
      content: "Test post for telegram",
      sendToTelegram: false,
    });
    expect(result).toMatchObject({ success: true });
  });
});
