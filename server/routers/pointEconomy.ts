import { TRPCError } from "@trpc/server";
import { and, desc, eq, gt, inArray } from "drizzle-orm";
import { z } from "zod";
import {
  investmentPaymentPolicies,
  investmentPaymentReceipts,
  nodeBenefitPolicies,
  nodeOrders,
  nodes,
  pointLedgerEntries,
  pointMarketFills,
  pointMarketOrders,
  pointTokenConfigs,
  userWallets,
} from "../../drizzle/schema";
import { getDb, createAuditLog } from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  assertValidHybridPaymentSplit,
  assertValidOrderAmounts,
  baseUnitsToDecimal,
  calculateHybridCheckoutQuote,
  calculateMarketFillQuote,
  decimalToBaseUnits,
  isValidTxHash,
  normalizeWalletAddress,
  type PointNetwork,
} from "../../shared/pointEconomy";

const networkSchema = z.enum(["BSC", "ERC20", "TRC20"]);
const activeOrderStatuses = ["open", "partially_filled"] as const;
const EVM_MARKET_ABI = [
  "function createOrder(uint256 pointAmount,uint256 minFillAmount,uint256 priceUsdtPerPoint,uint256 expiresAt) returns (uint256)",
  "function fillOrder(uint256 orderId,uint256 pointAmount)",
  "function cancelOrder(uint256 orderId)",
] as const;

function asError(error: unknown): TRPCError {
  return new TRPCError({
    code: "BAD_REQUEST",
    message: error instanceof Error ? error.message : "Invalid point-economy request.",
  });
}

function walletBindingMessage(params: { userId: number; network: PointNetwork; normalizedAddress: string; nonce: string }) {
  return [
    "AlphaBag wallet ownership verification",
    "",
    `User ID: ${params.userId}`,
    `Network: ${params.network}`,
    `Wallet: ${params.normalizedAddress}`,
    `Nonce: ${params.nonce}`,
    "",
    "This signature is free and does not authorize token transfers.",
  ].join("\n");
}

async function getRequiredConfig(network: PointNetwork, requireLive = false) {
  const database = await getDb();
  if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
  const rows = await database.select().from(pointTokenConfigs)
    .where(and(eq(pointTokenConfigs.network, network), eq(pointTokenConfigs.isActive, true)))
    .orderBy(desc(pointTokenConfigs.updatedAt))
    .limit(1);
  const config = rows[0];
  if (!config) throw new TRPCError({ code: "PRECONDITION_FAILED", message: `${network} point configuration is not available.` });
  if (requireLive && (!config.isLive || config.auditStatus !== "passed" || !config.auditReportUrl || !config.multisigAddress || !config.pointTokenAddress || !config.usdtTokenAddress || !config.marketEscrowAddress || !config.treasuryAddress)) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: `${network} point market is not live. Passed independent audit, audit report, multisig address, contract verification, treasury, and administrator activation are required.` });
  }
  return { database, config };
}

async function getVerifiedWallet(params: { userId: number; network: PointNetwork; address?: string | null }) {
  const database = await getDb();
  if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
  const conditions = [eq(userWallets.userId, params.userId), eq(userWallets.network, params.network), eq(userWallets.isActive, true)];
  if (params.address) {
    let normalized: string;
    try { normalized = normalizeWalletAddress(params.address, params.network); } catch (error) { throw asError(error); }
    conditions.push(eq(userWallets.normalizedAddress, normalized));
  }
  const wallets = await database.select().from(userWallets)
    .where(and(...conditions, gt(userWallets.verifiedAt, new Date(0))))
    .orderBy(desc(userWallets.isPrimary), desc(userWallets.verifiedAt))
    .limit(1);
  if (!wallets[0]) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "A verified wallet for this network is required before creating or filling an order." });
  return wallets[0];
}

export const pointsRouter = router({
  getOverview: protectedProcedure.query(async ({ ctx }) => {
    const database = await getDb();
    if (!database) return { configs: [], wallets: [], ledger: [], totals: {} };
    const [configs, wallets, ledger] = await Promise.all([
      database.select().from(pointTokenConfigs).where(eq(pointTokenConfigs.isActive, true)).orderBy(pointTokenConfigs.network),
      database.select().from(userWallets).where(and(eq(userWallets.userId, ctx.user!.id), eq(userWallets.isActive, true))).orderBy(desc(userWallets.isPrimary), desc(userWallets.verifiedAt)),
      database.select().from(pointLedgerEntries).where(eq(pointLedgerEntries.userId, ctx.user!.id)).orderBy(desc(pointLedgerEntries.occurredAt)).limit(50),
    ]);
    const totals = ledger.reduce<Record<string, string>>((acc, entry) => {
      if (entry.status === "reverted" || entry.status === "failed") return acc;
      const current = BigInt(acc[entry.network] ?? "0");
      const amount = decimalToBaseUnits(String(entry.amount), 18);
      acc[entry.network] = (entry.direction === "credit" ? current + amount : current - amount).toString();
      return acc;
    }, {});
    return { configs, wallets, ledger, totals };
  }),

  requestWalletChallenge: protectedProcedure.input(z.object({ network: networkSchema, address: z.string().min(10) }))
    .mutation(async ({ input, ctx }) => {
      if (input.network === "TRC20") {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "TRON wallet linking requires the TronLink signature-verification module before it can be enabled." });
      }
      let normalizedAddress: string;
      try { normalizedAddress = normalizeWalletAddress(input.address, input.network); } catch (error) { throw asError(error); }
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      const nonce = crypto.randomUUID().replace(/-/g, "");
      const existing = await database.select().from(userWallets).where(and(
        eq(userWallets.userId, ctx.user!.id),
        eq(userWallets.network, input.network),
        eq(userWallets.normalizedAddress, normalizedAddress),
      )).limit(1);
      if (existing[0]) {
        await database.update(userWallets).set({ signatureNonce: nonce, address: input.address.trim(), verifiedAt: null, isActive: true }).where(eq(userWallets.id, existing[0].id));
      } else {
        await database.insert(userWallets).values({ userId: ctx.user!.id, network: input.network, address: input.address.trim(), normalizedAddress, signatureNonce: nonce, isPrimary: false, isActive: true });
      }
      return { message: walletBindingMessage({ userId: ctx.user!.id, network: input.network, normalizedAddress, nonce }), nonce };
    }),

  verifyEvmWallet: protectedProcedure.input(z.object({ network: z.enum(["BSC", "ERC20"]), address: z.string(), signature: z.string().min(1), nonce: z.string().min(16) }))
    .mutation(async ({ input, ctx }) => {
      let normalizedAddress: string;
      try { normalizedAddress = normalizeWalletAddress(input.address, input.network); } catch (error) { throw asError(error); }
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      const [wallet] = await database.select().from(userWallets).where(and(
        eq(userWallets.userId, ctx.user!.id),
        eq(userWallets.network, input.network),
        eq(userWallets.normalizedAddress, normalizedAddress),
        eq(userWallets.signatureNonce, input.nonce),
      )).limit(1);
      if (!wallet) throw new TRPCError({ code: "NOT_FOUND", message: "Wallet verification request was not found or has expired." });
      const { verifyMessage } = await import("ethers");
      const message = walletBindingMessage({ userId: ctx.user!.id, network: input.network, normalizedAddress, nonce: input.nonce });
      let recovered: string;
      try { recovered = verifyMessage(message, input.signature).toLowerCase(); } catch { throw new TRPCError({ code: "UNAUTHORIZED", message: "Wallet signature verification failed." }); }
      if (recovered !== normalizedAddress) throw new TRPCError({ code: "UNAUTHORIZED", message: "The signature does not match the requested wallet." });
      await database.update(userWallets).set({ isPrimary: false }).where(and(eq(userWallets.userId, ctx.user!.id), eq(userWallets.network, input.network)));
      await database.update(userWallets).set({ verifiedAt: new Date(), isPrimary: true, signatureNonce: crypto.randomUUID().replace(/-/g, "") }).where(eq(userWallets.id, wallet.id));
      return { success: true };
    }),

  getTransferPreparation: protectedProcedure.input(z.object({ network: networkSchema, recipient: z.string().min(10), amount: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      const { config } = await getRequiredConfig(input.network, true);
      try {
        normalizeWalletAddress(input.recipient, input.network);
        const amount = decimalToBaseUnits(input.amount, config.pointDecimals);
        if (amount <= BigInt(0)) throw new Error("Point amount must be greater than zero.");
      } catch (error) { throw asError(error); }
      await getVerifiedWallet({ userId: ctx.user!.id, network: input.network });
      return {
        live: config.isLive,
        network: input.network,
        pointTokenAddress: config.pointTokenAddress,
        recipient: input.recipient.trim(),
        amount: input.amount,
        pointDecimals: config.pointDecimals,
        warning: "Transfers are final after network confirmation. Verify the recipient address and network before signing.",
      };
    }),
});

export const pointMarketRouter = router({
  listOrders: publicProcedure.input(z.object({ network: networkSchema.optional(), limit: z.number().int().min(1).max(100).default(50) }).optional())
    .query(async ({ input }) => {
      const database = await getDb();
      if (!database) return [];
      const conditions = [inArray(pointMarketOrders.status, activeOrderStatuses), gt(pointMarketOrders.expiresAt, new Date())];
      if (input?.network) conditions.push(eq(pointMarketOrders.network, input.network));
      return database.select().from(pointMarketOrders).where(and(...conditions)).orderBy(pointMarketOrders.priceUsdtPerPoint, desc(pointMarketOrders.createdAt)).limit(input?.limit ?? 50);
    }),

  myOrders: protectedProcedure.query(async ({ ctx }) => {
    const database = await getDb();
    if (!database) return [];
    return database.select().from(pointMarketOrders).where(eq(pointMarketOrders.sellerUserId, ctx.user!.id)).orderBy(desc(pointMarketOrders.createdAt));
  }),

  getFillQuote: publicProcedure.input(z.object({ orderId: z.number().int().positive(), pointAmount: z.string().min(1) }))
    .query(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      const [order] = await database.select().from(pointMarketOrders).where(eq(pointMarketOrders.id, input.orderId)).limit(1);
      if (!order || !activeOrderStatuses.includes(order.status as typeof activeOrderStatuses[number]) || order.expiresAt <= new Date()) {
        throw new TRPCError({ code: "NOT_FOUND", message: "This order is not available for filling." });
      }
      const { config } = await getRequiredConfig(order.network, true);
      try {
        const fill = decimalToBaseUnits(input.pointAmount, config.pointDecimals);
        const remaining = decimalToBaseUnits(String(order.remainingPointAmount), config.pointDecimals);
        const minimum = decimalToBaseUnits(String(order.minFillAmount), config.pointDecimals);
        if (fill < minimum) throw new Error("Selected amount is below this order's minimum fill.");
        if (fill > remaining) throw new Error("Selected amount exceeds the remaining order size.");
        const quote = calculateMarketFillQuote({
          pointAmountBaseUnits: fill,
          pointDecimals: config.pointDecimals,
          priceUsdtPerPointBaseUnits: decimalToBaseUnits(String(order.priceUsdtPerPoint), config.usdtDecimals),
          feeBps: order.feeBpsSnapshot,
        });
        return {
          order,
          config: { network: config.network, marketEscrowAddress: config.marketEscrowAddress, usdtTokenAddress: config.usdtTokenAddress, pointTokenAddress: config.pointTokenAddress, pointDecimals: config.pointDecimals, usdtDecimals: config.usdtDecimals },
          quote: {
            pointAmount: baseUnitsToDecimal(fill, config.pointDecimals),
            grossUsdt: baseUnitsToDecimal(quote.grossUsdtBaseUnits, config.usdtDecimals),
            feeUsdt: baseUnitsToDecimal(quote.feeUsdtBaseUnits, config.usdtDecimals),
            sellerNetUsdt: baseUnitsToDecimal(quote.sellerNetUsdtBaseUnits, config.usdtDecimals),
          },
        };
      } catch (error) { throw asError(error); }
    }),

  createOrderDraft: protectedProcedure.input(z.object({ network: networkSchema, pointAmount: z.string().min(1), minFillAmount: z.string().min(1), priceUsdtPerPoint: z.string().min(1), expiresAt: z.string().datetime() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user!.kycStatus !== "approved") throw new TRPCError({ code: "FORBIDDEN", message: "KYC approval is required before creating P2P market orders." });
      const { database, config } = await getRequiredConfig(input.network, true);
      const wallet = await getVerifiedWallet({ userId: ctx.user!.id, network: input.network });
      try {
        const pointAmount = decimalToBaseUnits(input.pointAmount, config.pointDecimals);
        const minFillAmount = decimalToBaseUnits(input.minFillAmount, config.pointDecimals);
        const price = decimalToBaseUnits(input.priceUsdtPerPoint, config.usdtDecimals);
        assertValidOrderAmounts({ pointAmountBaseUnits: pointAmount, minFillAmountBaseUnits: minFillAmount, priceUsdtPerPointBaseUnits: price, expiresAtMs: new Date(input.expiresAt).getTime() });
      } catch (error) { throw asError(error); }
      const [result] = await database.insert(pointMarketOrders).values({
        sellerUserId: ctx.user!.id,
        sellerWalletAddress: wallet.address,
        network: input.network,
        configId: config.id,
        pointAmount: input.pointAmount,
        remainingPointAmount: input.pointAmount,
        minFillAmount: input.minFillAmount,
        priceUsdtPerPoint: input.priceUsdtPerPoint,
        feeBpsSnapshot: config.marketFeeBps,
        status: "draft",
        expiresAt: new Date(input.expiresAt),
      });
      await createAuditLog({ adminId: ctx.user!.id, action: "CREATE_POINT_MARKET_DRAFT", targetType: "pointMarketOrder", targetId: Number((result as any).insertId), details: { network: input.network, pointAmount: input.pointAmount, minFillAmount: input.minFillAmount, priceUsdtPerPoint: input.priceUsdtPerPoint } });
      return { success: true, orderId: Number((result as any).insertId), contractAbi: input.network === "TRC20" ? null : EVM_MARKET_ABI, escrowAddress: config.marketEscrowAddress };
    }),

  reportOrderTransaction: protectedProcedure.input(z.object({ orderId: z.number().int().positive(), txHash: z.string().min(32), chainOrderId: z.string().min(1).max(100).optional() }))
    .mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      const [order] = await database.select().from(pointMarketOrders).where(and(eq(pointMarketOrders.id, input.orderId), eq(pointMarketOrders.sellerUserId, ctx.user!.id))).limit(1);
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found." });
      if (order.status !== "draft") throw new TRPCError({ code: "CONFLICT", message: "This order is no longer awaiting its on-chain creation event." });
      if (!isValidTxHash(input.txHash, order.network)) throw new TRPCError({ code: "BAD_REQUEST", message: "Transaction hash format does not match the selected network." });
      await database.update(pointMarketOrders).set({ orderTxHash: input.txHash.trim(), ...(input.chainOrderId ? { chainOrderId: input.chainOrderId.trim() } : {}) }).where(eq(pointMarketOrders.id, order.id));
      return { success: true, status: "awaiting_chain_confirmation" as const };
    }),
});

export const pointCheckoutRouter = router({
  getQuote: publicProcedure.input(z.object({ planId: z.number().int().positive() })).query(async ({ input }) => {
    const database = await getDb();
    if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
    const [policy] = await database.select().from(investmentPaymentPolicies).where(and(
      eq(investmentPaymentPolicies.planId, input.planId),
      eq(investmentPaymentPolicies.isActive, true),
    )).orderBy(desc(investmentPaymentPolicies.version)).limit(1);
    if (!policy || policy.effectiveAt > new Date() || (policy.expiresAt && policy.expiresAt <= new Date())) {
      throw new TRPCError({ code: "NOT_FOUND", message: "There is no active point payment policy for this investment plan." });
    }
    const { config } = await getRequiredConfig(policy.network, false);
    try {
      const quote = calculateHybridCheckoutQuote({
        nominalUsdtBaseUnits: decimalToBaseUnits(String(policy.nominalUsdtAmount), config.usdtDecimals),
        usdtShareBps: policy.usdtShareBps,
        pointShareBps: policy.pointShareBps,
        checkoutPointUsdtRateBaseUnits: decimalToBaseUnits(String(policy.checkoutPointUsdtRate), config.usdtDecimals),
        pointDecimals: config.pointDecimals,
      });
      return {
        policy,
        config: { network: config.network, isLive: config.isLive, checkoutAddress: config.checkoutAddress, pointTokenAddress: config.pointTokenAddress, usdtTokenAddress: config.usdtTokenAddress, pointDecimals: config.pointDecimals, usdtDecimals: config.usdtDecimals },
        quote: {
          nominalUsdt: baseUnitsToDecimal(decimalToBaseUnits(String(policy.nominalUsdtAmount), config.usdtDecimals), config.usdtDecimals),
          usdtAmount: baseUnitsToDecimal(quote.usdtAmountBaseUnits, config.usdtDecimals),
          pointValueUsdt: baseUnitsToDecimal(quote.pointValueUsdtBaseUnits, config.usdtDecimals),
          pointAmount: baseUnitsToDecimal(quote.pointAmountBaseUnits, config.pointDecimals),
        },
      };
    } catch (error) { throw asError(error); }
  }),

  createIntent: protectedProcedure.input(z.object({ planId: z.number().int().positive(), policyId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user!.kycStatus !== "approved") throw new TRPCError({ code: "FORBIDDEN", message: "KYC approval is required before creating an investment payment intent." });
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      const [policy] = await database.select().from(investmentPaymentPolicies).where(and(eq(investmentPaymentPolicies.id, input.policyId), eq(investmentPaymentPolicies.planId, input.planId), eq(investmentPaymentPolicies.isActive, true))).limit(1);
      if (!policy || policy.effectiveAt > new Date() || (policy.expiresAt && policy.expiresAt <= new Date())) throw new TRPCError({ code: "NOT_FOUND", message: "The selected payment policy is not active." });
      const { config } = await getRequiredConfig(policy.network, true);
      if (!config.checkoutAddress) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Investment checkout contract is not configured for this network." });
      const wallet = await getVerifiedWallet({ userId: ctx.user!.id, network: policy.network });
      try {
        const quote = calculateHybridCheckoutQuote({
          nominalUsdtBaseUnits: decimalToBaseUnits(String(policy.nominalUsdtAmount), config.usdtDecimals),
          usdtShareBps: policy.usdtShareBps,
          pointShareBps: policy.pointShareBps,
          checkoutPointUsdtRateBaseUnits: decimalToBaseUnits(String(policy.checkoutPointUsdtRate), config.usdtDecimals),
          pointDecimals: config.pointDecimals,
        });
        const [result] = await database.insert(investmentPaymentReceipts).values({
          userId: ctx.user!.id,
          planId: input.planId,
          policyId: policy.id,
          network: policy.network,
          usdtAmount: baseUnitsToDecimal(quote.usdtAmountBaseUnits, config.usdtDecimals),
          pointAmount: baseUnitsToDecimal(quote.pointAmountBaseUnits, config.pointDecimals),
          walletAddress: wallet.address,
          status: "intent",
        });
        const receiptId = Number((result as any).insertId);
        return {
          receiptId,
          policyVersion: policy.version,
          contract: { checkoutAddress: config.checkoutAddress, usdtTokenAddress: config.usdtTokenAddress, pointTokenAddress: config.pointTokenAddress, pointDecimals: config.pointDecimals, usdtDecimals: config.usdtDecimals },
          quote: { usdtAmount: baseUnitsToDecimal(quote.usdtAmountBaseUnits, config.usdtDecimals), pointAmount: baseUnitsToDecimal(quote.pointAmountBaseUnits, config.pointDecimals) },
        };
      } catch (error) { throw asError(error); }
    }),

  reportCheckoutTransaction: protectedProcedure.input(z.object({ receiptId: z.number().int().positive(), txHash: z.string().min(32) }))
    .mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      const [receipt] = await database.select().from(investmentPaymentReceipts).where(and(eq(investmentPaymentReceipts.id, input.receiptId), eq(investmentPaymentReceipts.userId, ctx.user!.id))).limit(1);
      if (!receipt) throw new TRPCError({ code: "NOT_FOUND", message: "Payment intent not found." });
      if (receipt.status !== "intent") throw new TRPCError({ code: "CONFLICT", message: "This payment intent has already been submitted." });
      if (!isValidTxHash(input.txHash, receipt.network)) throw new TRPCError({ code: "BAD_REQUEST", message: "Transaction hash format does not match the selected network." });
      await database.update(investmentPaymentReceipts).set({ txHash: input.txHash.trim(), status: "pending" }).where(eq(investmentPaymentReceipts.id, receipt.id));
      return { success: true, status: "awaiting_chain_confirmation" as const };
    }),
});

export function createPointAdminRouter(procedures: { adminProcedure: any; superAdminProcedure: any }) {
  const { adminProcedure, superAdminProcedure } = procedures;
  return router({
    listConfigs: adminProcedure.query(async () => {
      const database = await getDb();
      if (!database) return [];
      return database.select().from(pointTokenConfigs).orderBy(pointTokenConfigs.network, desc(pointTokenConfigs.updatedAt));
    }),
    saveConfig: superAdminProcedure.input(z.object({
      id: z.number().int().positive().optional(), network: networkSchema, chainId: z.string().min(1).max(32), pointSymbol: z.string().min(1).max(24).default("ABP"), pointDecimals: z.number().int().min(0).max(36).default(18), usdtDecimals: z.number().int().min(0).max(36).default(6), minConfirmations: z.number().int().min(1).max(1_000).default(12), marketFeeBps: z.number().int().min(0).max(1_000).default(100), pointTokenAddress: z.string().max(100).optional(), usdtTokenAddress: z.string().max(100).optional(), marketEscrowAddress: z.string().max(100).optional(), checkoutAddress: z.string().max(100).optional(), treasuryAddress: z.string().max(100).optional(), auditStatus: z.enum(["not_started", "in_review", "passed"]).default("not_started"), auditReportUrl: z.string().url().max(500).optional(), multisigAddress: z.string().max(100).optional(), isActive: z.boolean().default(true), isLive: z.boolean().default(false),
    })).mutation(async ({ input, ctx }: { input: any; ctx: { user?: { id: number } } }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      if (input.isLive && (!input.pointTokenAddress || !input.usdtTokenAddress || !input.marketEscrowAddress || !input.treasuryAddress || !input.multisigAddress || !input.auditReportUrl || input.auditStatus !== "passed")) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "A live configuration requires point, USDT, escrow, treasury, multisig addresses, and a passed independent audit report." });
      }
      const { id, ...data } = input;
      if (id) await database.update(pointTokenConfigs).set(data).where(eq(pointTokenConfigs.id, id));
      else await database.insert(pointTokenConfigs).values(data);
      await createAuditLog({ adminId: ctx.user!.id, action: id ? "UPDATE_POINT_TOKEN_CONFIG" : "CREATE_POINT_TOKEN_CONFIG", targetType: "pointTokenConfig", targetId: id, details: { network: input.network, isLive: input.isLive, chainId: input.chainId } });
      return { success: true };
    }),
    listNodeBenefits: adminProcedure.query(async () => {
      const database = await getDb();
      if (!database) return [];
      return database.select({ policy: nodeBenefitPolicies, nodeName: nodes.name }).from(nodeBenefitPolicies).leftJoin(nodes, eq(nodeBenefitPolicies.nodeId, nodes.id)).orderBy(desc(nodeBenefitPolicies.effectiveAt));
    }),
    createNodeBenefit: adminProcedure.input(z.object({ nodeId: z.number().int().positive(), pointEarnBoostBps: z.number().int().min(0).max(3_000).default(0), pointSpendCapPct: z.number().int().min(5).max(30).default(5), p2pFeeDiscountBps: z.number().int().min(0).max(10_000).default(0), dailyP2PVolumeCapUsdt: z.string().min(1), voteWeightMultiplierBps: z.number().int().min(1).max(100_000).default(10_000), prioritySupport: z.boolean().default(false), earlyAccess: z.boolean().default(false), terms: z.string().max(5_000).optional(), isActive: z.boolean().default(false) }))
      .mutation(async ({ input, ctx }: { input: any; ctx: { user?: { id: number } } }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
        try { if (decimalToBaseUnits(input.dailyP2PVolumeCapUsdt, 6) < BigInt(0)) throw new Error("Daily volume cap cannot be negative."); } catch (error) { throw asError(error); }
        const existing = await database.select().from(nodeBenefitPolicies).where(eq(nodeBenefitPolicies.nodeId, input.nodeId));
        const version = Math.max(0, ...existing.map(row => row.version)) + 1;
        if (input.isActive) await database.update(nodeBenefitPolicies).set({ isActive: false, expiresAt: new Date() }).where(and(eq(nodeBenefitPolicies.nodeId, input.nodeId), eq(nodeBenefitPolicies.isActive, true)));
        await database.insert(nodeBenefitPolicies).values({ ...input, version, createdBy: ctx.user!.id });
        await createAuditLog({ adminId: ctx.user!.id, action: "CREATE_NODE_BENEFIT_POLICY", targetType: "nodeBenefitPolicy", details: { nodeId: input.nodeId, version, isActive: input.isActive } });
        return { success: true, version };
      }),
    createPaymentPolicy: superAdminProcedure.input(z.object({ planId: z.number().int().positive(), nominalUsdtAmount: z.string().min(1), usdtShareBps: z.number().int(), pointShareBps: z.number().int(), checkoutPointUsdtRate: z.string().min(1), network: networkSchema, configId: z.number().int().positive().optional(), isActive: z.boolean().default(false), effectiveAt: z.string().datetime().optional(), expiresAt: z.string().datetime().optional() }))
      .mutation(async ({ input, ctx }: { input: any; ctx: { user?: { id: number } } }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
        try {
          assertValidHybridPaymentSplit(input);
          if (decimalToBaseUnits(input.nominalUsdtAmount, 6) <= BigInt(0) || decimalToBaseUnits(input.checkoutPointUsdtRate, 18) <= BigInt(0)) throw new Error("Nominal USDT amount and checkout point rate must be greater than zero.");
        } catch (error) { throw asError(error); }
        const existing = await database.select().from(investmentPaymentPolicies).where(eq(investmentPaymentPolicies.planId, input.planId));
        const version = Math.max(0, ...existing.map(row => row.version)) + 1;
        if (input.isActive) await database.update(investmentPaymentPolicies).set({ isActive: false, expiresAt: new Date() }).where(and(eq(investmentPaymentPolicies.planId, input.planId), eq(investmentPaymentPolicies.isActive, true)));
        await database.insert(investmentPaymentPolicies).values({ ...input, version, effectiveAt: input.effectiveAt ? new Date(input.effectiveAt) : new Date(), expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined, createdBy: ctx.user!.id });
        await createAuditLog({ adminId: ctx.user!.id, action: "CREATE_INVESTMENT_PAYMENT_POLICY", targetType: "investmentPaymentPolicy", details: { planId: input.planId, version, usdtShareBps: input.usdtShareBps, pointShareBps: input.pointShareBps, network: input.network } });
        return { success: true, version };
      }),
    marketMonitor: adminProcedure.query(async () => {
      const database = await getDb();
      if (!database) return { orders: [], fills: [], policyCount: 0 };
      const [orders, fills, policies] = await Promise.all([
        database.select().from(pointMarketOrders).orderBy(desc(pointMarketOrders.createdAt)).limit(100),
        database.select().from(pointMarketFills).orderBy(desc(pointMarketFills.createdAt)).limit(100),
        database.select().from(investmentPaymentPolicies),
      ]);
      return { orders, fills, policyCount: policies.length };
    }),
  });
}
