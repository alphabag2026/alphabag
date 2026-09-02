import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("internal A/B points policy", () => {
  it("publishes the confirmed internal-ledger conversion and payment rules", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const policy = await caller.internalPoints.policy();
    expect(policy).toMatchObject({
      mode: "internal_ledger",
      aPointUsdtRate: "1",
      bPointUsdtRate: "1",
      minAPointShareBps: 500,
      maxAPointShareBps: 3_000,
      minUsdtShareBps: 7_000,
      maxUsdtShareBps: 9_500,
      withdrawal: "reserve_and_admin_approval",
    });
  });
});

describe("internal A/B points authentication", () => {
  it("protects the user's balances and ledger", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.internalPoints.overview()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("protects A-point member transfers", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.internalPoints.transferA({ recipientUserId: 2, amount: "10" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("protects B-point USDT withdrawal requests", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.internalPoints.requestBWithdrawal({ amountB: "10", network: "BSC", walletAddress: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
