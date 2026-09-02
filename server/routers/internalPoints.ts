import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, or, sql } from "drizzle-orm";
import { z } from "zod";
import {
  bPointReserveAccounts,
  bPointReserveMovements,
  bPointWithdrawalRequests,
  internalPointAccounts,
  internalPointConversionRequests,
  internalPointGrantRequests,
  internalPointInvestmentUses,
  internalPointLedgerEntries,
  investmentPlans,
  users,
} from "../../drizzle/schema";
import {
  baseUnitsToDecimal,
  calculateAvailableReserveBaseUnits,
  calculateFullUsdtSaleConversion,
  calculateInternalABPointPayment,
  decimalToBaseUnits,
  isValidTxHash,
  normalizeWalletAddress,
  type PointNetwork,
} from "../../shared/pointEconomy";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { createAuditLog, getDb } from "../db";

const DECIMALS = 18;
const ZERO = BigInt(0);
const networkSchema = z.enum(["BSC", "ERC20", "TRC20"]);
const amountSchema = z.string().regex(/^(0|[1-9]\d*)(?:\.\d{1,18})?$/, "금액 형식이 올바르지 않습니다.");

function toUnits(value: string, label = "금액"): bigint {
  try {
    const units = decimalToBaseUnits(value, DECIMALS);
    if (units <= ZERO) throw new Error(`${label}은(는) 0보다 커야 합니다.`);
    return units;
  } catch (error) {
    throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : `${label}이(가) 올바르지 않습니다.` });
  }
}

function toDecimal(value: bigint): string {
  return baseUnitsToDecimal(value, DECIMALS);
}

function resultCount(result: unknown): number {
  const value = result as any;
  return Number(value?.[0]?.affectedRows ?? value?.affectedRows ?? 0);
}

function insertId(result: unknown): number {
  const value = result as any;
  return Number(value?.[0]?.insertId ?? value?.insertId ?? 0);
}

async function ensureAccount(executor: any, userId: number) {
  const [existing] = await executor.select().from(internalPointAccounts).where(eq(internalPointAccounts.userId, userId)).limit(1);
  if (existing) return existing;
  await executor.insert(internalPointAccounts).values({ userId });
  const [created] = await executor.select().from(internalPointAccounts).where(eq(internalPointAccounts.userId, userId)).limit(1);
  if (!created) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "포인트 계정을 생성하지 못했습니다." });
  return created;
}

async function requireActiveUser(executor: any, userId: number, requireKyc = false) {
  const [user] = await executor.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user || !user.isActive) throw new TRPCError({ code: "FORBIDDEN", message: "활성 사용자 계정이 필요합니다." });
  if (requireKyc && user.kycStatus !== "approved") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "KYC 승인 후 이용할 수 있습니다." });
  return user;
}

async function accountAfter(executor: any, userId: number) {
  const [account] = await executor.select().from(internalPointAccounts).where(eq(internalPointAccounts.userId, userId)).limit(1);
  if (!account) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "포인트 계정을 찾을 수 없습니다." });
  return account;
}

async function reserveCoverage(executor: any) {
  const [accounts, reserves] = await Promise.all([
    executor.select().from(internalPointAccounts),
    executor.select().from(bPointReserveAccounts).where(eq(bPointReserveAccounts.status, "active")),
  ]);
  const liability = accounts.reduce((sum: bigint, row: any) => sum + toUnitsOrZero(row.bAvailable) + toUnitsOrZero(row.bReserved), ZERO);
  const backed = reserves.reduce((sum: bigint, row: any) => sum + toUnitsOrZero(row.fundedUsdt) - toUnitsOrZero(row.paidUsdt), ZERO);
  return { liability, backed, headroom: backed > liability ? backed - liability : ZERO };
}

function toUnitsOrZero(value: unknown): bigint {
  try { return decimalToBaseUnits(String(value ?? "0"), DECIMALS); } catch { return ZERO; }
}

async function writeLedger(executor: any, values: {
  idempotencyKey: string;
  userId: number;
  pointType: "A" | "B";
  direction: "credit" | "debit";
  actionType: "grant" | "transfer_in" | "transfer_out" | "investment_hold" | "investment_use" | "investment_refund" | "conversion_hold" | "conversion_release" | "conversion_debit" | "conversion_credit" | "withdrawal_reserve" | "withdrawal_release" | "withdrawal_paid" | "adjustment";
  amount: string;
  balanceAfter: string;
  relatedUserId?: number;
  referenceType?: string;
  referenceId?: string;
  memo?: string;
  approvedBy?: number;
}) {
  await executor.insert(internalPointLedgerEntries).values(values);
}

export const internalPointsRouter = router({
  policy: publicProcedure.query(() => ({
    mode: "internal_ledger" as const,
    aPointUsdtRate: "1",
    bPointUsdtRate: "1",
    minAPointShareBps: 500,
    maxAPointShareBps: 3_000,
    minUsdtShareBps: 7_000,
    maxUsdtShareBps: 9_500,
    withdrawal: "reserve_and_admin_approval" as const,
  })),

  overview: protectedProcedure.query(async ({ ctx }) => {
    const database = await getDb();
    if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
    await ensureAccount(database, ctx.user!.id);
    const [account, ledger, grants, investments, conversions, withdrawals] = await Promise.all([
      accountAfter(database, ctx.user!.id),
      database.select().from(internalPointLedgerEntries).where(eq(internalPointLedgerEntries.userId, ctx.user!.id)).orderBy(desc(internalPointLedgerEntries.createdAt)).limit(100),
      database.select().from(internalPointGrantRequests).where(eq(internalPointGrantRequests.beneficiaryUserId, ctx.user!.id)).orderBy(desc(internalPointGrantRequests.createdAt)).limit(50),
      database.select().from(internalPointInvestmentUses).where(eq(internalPointInvestmentUses.userId, ctx.user!.id)).orderBy(desc(internalPointInvestmentUses.createdAt)).limit(50),
      database.select().from(internalPointConversionRequests).where(eq(internalPointConversionRequests.userId, ctx.user!.id)).orderBy(desc(internalPointConversionRequests.createdAt)).limit(50),
      database.select().from(bPointWithdrawalRequests).where(eq(bPointWithdrawalRequests.userId, ctx.user!.id)).orderBy(desc(bPointWithdrawalRequests.createdAt)).limit(50),
    ]);
    return { account, ledger, grants, investments, conversions, withdrawals };
  }),

  findRecipient: protectedProcedure.input(z.object({ query: z.string().trim().min(3).max(320) })).query(async ({ input, ctx }) => {
    const database = await getDb();
    if (!database) return null;
    const [recipient] = await database.select({ id: users.id, name: users.name, referralCode: users.referralCode }).from(users)
      .where(and(or(eq(users.referralCode, input.query), eq(users.email, input.query)), eq(users.isActive, true)))
      .limit(1);
    if (!recipient || recipient.id === ctx.user!.id) return null;
    return recipient;
  }),

  transferA: protectedProcedure.input(z.object({ recipientUserId: z.number().int().positive(), amount: amountSchema, memo: z.string().trim().max(300).optional() }))
    .mutation(async ({ input, ctx }) => {
      if (input.recipientUserId === ctx.user!.id) throw new TRPCError({ code: "BAD_REQUEST", message: "자기 자신에게 전송할 수 없습니다." });
      const amount = toUnits(input.amount, "A포인트");
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      const transferKey = crypto.randomUUID();
      await database.transaction(async tx => {
        await requireActiveUser(tx, ctx.user!.id);
        await requireActiveUser(tx, input.recipientUserId);
        await ensureAccount(tx, ctx.user!.id);
        await ensureAccount(tx, input.recipientUserId);
        const debit = await tx.update(internalPointAccounts).set({ aAvailable: sql`${internalPointAccounts.aAvailable} - ${toDecimal(amount)}` })
          .where(and(eq(internalPointAccounts.userId, ctx.user!.id), eq(internalPointAccounts.status, "active"), gte(internalPointAccounts.aAvailable, toDecimal(amount))));
        if (resultCount(debit) !== 1) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "사용 가능한 A포인트가 부족하거나 계정이 동결되었습니다." });
        const credit = await tx.update(internalPointAccounts).set({ aAvailable: sql`${internalPointAccounts.aAvailable} + ${toDecimal(amount)}` })
          .where(and(eq(internalPointAccounts.userId, input.recipientUserId), eq(internalPointAccounts.status, "active")));
        if (resultCount(credit) !== 1) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "수신자의 포인트 계정이 활성 상태가 아닙니다." });
        const [sender, recipient] = await Promise.all([accountAfter(tx, ctx.user!.id), accountAfter(tx, input.recipientUserId)]);
        await writeLedger(tx, { idempotencyKey: `${transferKey}:out`, userId: ctx.user!.id, pointType: "A", direction: "debit", actionType: "transfer_out", amount: toDecimal(amount), balanceAfter: sender.aAvailable, relatedUserId: input.recipientUserId, referenceType: "a_transfer", referenceId: transferKey, memo: input.memo });
        await writeLedger(tx, { idempotencyKey: `${transferKey}:in`, userId: input.recipientUserId, pointType: "A", direction: "credit", actionType: "transfer_in", amount: toDecimal(amount), balanceAfter: recipient.aAvailable, relatedUserId: ctx.user!.id, referenceType: "a_transfer", referenceId: transferKey, memo: input.memo });
      });
      return { success: true, transferId: transferKey };
    }),

  createInvestmentUse: protectedProcedure.input(z.object({ planId: z.number().int().positive(), nominalUsdtAmount: amountSchema, usdtShareBps: z.number().int().min(7_000).max(9_500) }))
    .mutation(async ({ input, ctx }) => {
      const nominal = toUnits(input.nominalUsdtAmount, "투자금");
      const aPointShareBps = 10_000 - input.usdtShareBps;
      let quote;
      try { quote = calculateInternalABPointPayment({ nominalUsdtBaseUnits: nominal, usdtShareBps: input.usdtShareBps, aPointShareBps }); }
      catch (error) { throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "결제 비율이 올바르지 않습니다." }); }
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      let investmentUseId = 0;
      await database.transaction(async tx => {
        await requireActiveUser(tx, ctx.user!.id, true);
        const [plan] = await tx.select({ id: investmentPlans.id }).from(investmentPlans).where(and(eq(investmentPlans.id, input.planId), eq(investmentPlans.isActive, true))).limit(1);
        if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "활성 투자 플랜을 찾을 수 없습니다." });
        await ensureAccount(tx, ctx.user!.id);
        const hold = await tx.update(internalPointAccounts).set({ aAvailable: sql`${internalPointAccounts.aAvailable} - ${toDecimal(quote.aPointAmountBaseUnits)}`, aHeld: sql`${internalPointAccounts.aHeld} + ${toDecimal(quote.aPointAmountBaseUnits)}` })
          .where(and(eq(internalPointAccounts.userId, ctx.user!.id), eq(internalPointAccounts.status, "active"), gte(internalPointAccounts.aAvailable, toDecimal(quote.aPointAmountBaseUnits))));
        if (resultCount(hold) !== 1) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "투자에 사용할 A포인트 잔액이 부족합니다." });
        const created = await tx.insert(internalPointInvestmentUses).values({ userId: ctx.user!.id, planId: input.planId, nominalUsdtAmount: toDecimal(nominal), usdtShareBps: input.usdtShareBps, aPointShareBps, usdtAmount: toDecimal(quote.usdtAmountBaseUnits), aPointAmount: toDecimal(quote.aPointAmountBaseUnits), status: "intent" });
        investmentUseId = insertId(created);
        const account = await accountAfter(tx, ctx.user!.id);
        await writeLedger(tx, { idempotencyKey: `investment:${investmentUseId}:hold`, userId: ctx.user!.id, pointType: "A", direction: "debit", actionType: "investment_hold", amount: toDecimal(quote.aPointAmountBaseUnits), balanceAfter: account.aAvailable, referenceType: "investment_use", referenceId: String(investmentUseId) });
      });
      return { investmentUseId, usdtAmount: toDecimal(quote.usdtAmountBaseUnits), aPointAmount: toDecimal(quote.aPointAmountBaseUnits), status: "intent" as const };
    }),

  requestFullUsdtConversion: protectedProcedure.input(z.object({ planId: z.number().int().positive().optional(), saleAmountUsdt: amountSchema, conversionBps: z.number().int().min(500).max(3_000), evidenceUrl: z.string().url().max(2_000), memo: z.string().trim().max(2_000).optional() }))
    .mutation(async ({ input, ctx }) => {
      const saleAmount = toUnits(input.saleAmountUsdt, "100% USDT 매출액");
      let conversionAmount: bigint;
      try { conversionAmount = calculateFullUsdtSaleConversion({ saleAmountUsdtBaseUnits: saleAmount, conversionBps: input.conversionBps }); }
      catch (error) { throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "전환 금액이 올바르지 않습니다." }); }
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      let requestId = 0;
      await database.transaction(async tx => {
        await requireActiveUser(tx, ctx.user!.id, true);
        await ensureAccount(tx, ctx.user!.id);
        const hold = await tx.update(internalPointAccounts).set({ aAvailable: sql`${internalPointAccounts.aAvailable} - ${toDecimal(conversionAmount)}`, aHeld: sql`${internalPointAccounts.aHeld} + ${toDecimal(conversionAmount)}` })
          .where(and(eq(internalPointAccounts.userId, ctx.user!.id), eq(internalPointAccounts.status, "active"), gte(internalPointAccounts.aAvailable, toDecimal(conversionAmount))));
        if (resultCount(hold) !== 1) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "전환 신청에 필요한 A포인트가 부족합니다." });
        const created = await tx.insert(internalPointConversionRequests).values({ userId: ctx.user!.id, conversionType: "full_usdt_sale", planId: input.planId, saleAmountUsdt: toDecimal(saleAmount), conversionBps: input.conversionBps, requestedAPoints: toDecimal(conversionAmount), convertedBPoints: toDecimal(conversionAmount), evidenceUrl: input.evidenceUrl, memo: input.memo, requestedBy: ctx.user!.id });
        requestId = insertId(created);
        const account = await accountAfter(tx, ctx.user!.id);
        await writeLedger(tx, { idempotencyKey: `conversion:${requestId}:hold`, userId: ctx.user!.id, pointType: "A", direction: "debit", actionType: "conversion_hold", amount: toDecimal(conversionAmount), balanceAfter: account.aAvailable, referenceType: "conversion", referenceId: String(requestId) });
      });
      return { requestId, aPointAmount: toDecimal(conversionAmount), bPointAmount: toDecimal(conversionAmount), status: "requested" as const };
    }),

  requestBWithdrawal: protectedProcedure.input(z.object({ amountB: amountSchema, network: networkSchema, walletAddress: z.string().min(10).max(100) }))
    .mutation(async ({ input, ctx }) => {
      const amount = toUnits(input.amountB, "B포인트");
      let walletAddress: string;
      try { walletAddress = normalizeWalletAddress(input.walletAddress, input.network); }
      catch (error) { throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "지갑 주소가 올바르지 않습니다." }); }
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      let withdrawalId = 0;
      await database.transaction(async tx => {
        await requireActiveUser(tx, ctx.user!.id, true);
        await ensureAccount(tx, ctx.user!.id);
        const reserve = await tx.update(internalPointAccounts).set({ bAvailable: sql`${internalPointAccounts.bAvailable} - ${toDecimal(amount)}`, bReserved: sql`${internalPointAccounts.bReserved} + ${toDecimal(amount)}` })
          .where(and(eq(internalPointAccounts.userId, ctx.user!.id), eq(internalPointAccounts.status, "active"), gte(internalPointAccounts.bAvailable, toDecimal(amount))));
        if (resultCount(reserve) !== 1) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "출금 가능한 B포인트가 부족합니다." });
        const created = await tx.insert(bPointWithdrawalRequests).values({ userId: ctx.user!.id, amountB: toDecimal(amount), usdtAmount: toDecimal(amount), network: input.network, walletAddress });
        withdrawalId = insertId(created);
        const account = await accountAfter(tx, ctx.user!.id);
        await writeLedger(tx, { idempotencyKey: `withdrawal:${withdrawalId}:reserve`, userId: ctx.user!.id, pointType: "B", direction: "debit", actionType: "withdrawal_reserve", amount: toDecimal(amount), balanceAfter: account.bAvailable, referenceType: "withdrawal", referenceId: String(withdrawalId) });
      });
      return { withdrawalId, usdtAmount: toDecimal(amount), status: "requested" as const };
    }),
});

export function createInternalPointAdminRouter(procedures: { adminProcedure: any; superAdminProcedure: any }) {
  const { adminProcedure, superAdminProcedure } = procedures;
  return router({
    dashboard: adminProcedure.query(async () => {
      const database = await getDb();
      if (!database) return { accounts: [], grants: [], investments: [], conversions: [], withdrawals: [], reserves: [], coverage: { liability: "0", backed: "0", headroom: "0" } };
      const [accounts, grants, investments, conversions, withdrawals, reserves, coverage] = await Promise.all([
        database.select({ account: internalPointAccounts, userName: users.name, userEmail: users.email, referralCode: users.referralCode }).from(internalPointAccounts).leftJoin(users, eq(internalPointAccounts.userId, users.id)).orderBy(desc(internalPointAccounts.updatedAt)).limit(200),
        database.select().from(internalPointGrantRequests).orderBy(desc(internalPointGrantRequests.createdAt)).limit(200),
        database.select().from(internalPointInvestmentUses).orderBy(desc(internalPointInvestmentUses.createdAt)).limit(200),
        database.select().from(internalPointConversionRequests).orderBy(desc(internalPointConversionRequests.createdAt)).limit(200),
        database.select().from(bPointWithdrawalRequests).orderBy(desc(bPointWithdrawalRequests.createdAt)).limit(200),
        database.select().from(bPointReserveAccounts).orderBy(desc(bPointReserveAccounts.updatedAt)),
        reserveCoverage(database),
      ]);
      return { accounts, grants, investments, conversions, withdrawals, reserves, coverage: { liability: toDecimal(BigInt(coverage.liability)), backed: toDecimal(BigInt(coverage.backed)), headroom: toDecimal(BigInt(coverage.headroom)) } };
    }),

    createGrant: adminProcedure.input(z.object({ beneficiaryUserId: z.number().int().positive(), reasonType: z.enum(["project_failure_join", "leg_move", "manual"]), amountA: amountSchema, sourceProjectName: z.string().trim().max(160).optional(), evidenceUrl: z.string().url().max(2_000).optional(), memo: z.string().trim().max(2_000).optional() }))
      .mutation(async ({ input, ctx }: any) => {
        const amount = toUnits(input.amountA, "A포인트");
        const database = await getDb();
        if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
        await requireActiveUser(database, input.beneficiaryUserId);
        const created = await database.insert(internalPointGrantRequests).values({ ...input, amountA: toDecimal(amount), requestedBy: ctx.user.id });
        const id = insertId(created);
        await createAuditLog({ adminId: ctx.user.id, action: "CREATE_A_POINT_GRANT", targetType: "internalPointGrantRequest", targetId: id, details: { beneficiaryUserId: input.beneficiaryUserId, amountA: toDecimal(amount), reasonType: input.reasonType } });
        return { id, status: "requested" as const };
      }),

    approveGrant: superAdminProcedure.input(z.object({ requestId: z.number().int().positive() })).mutation(async ({ input, ctx }: any) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      await database.transaction(async tx => {
        const [request] = await tx.select().from(internalPointGrantRequests).where(eq(internalPointGrantRequests.id, input.requestId)).limit(1);
        if (!request || request.status !== "requested") throw new TRPCError({ code: "CONFLICT", message: "승인 가능한 지급 신청이 아닙니다." });
        const claimed = await tx.update(internalPointGrantRequests).set({ status: "approved", approvedBy: ctx.user.id, approvedAt: new Date() }).where(and(eq(internalPointGrantRequests.id, request.id), eq(internalPointGrantRequests.status, "requested")));
        if (resultCount(claimed) !== 1) throw new TRPCError({ code: "CONFLICT", message: "다른 관리자가 이미 지급 신청을 처리했습니다." });
        await ensureAccount(tx, request.beneficiaryUserId);
        await tx.update(internalPointAccounts).set({ aAvailable: sql`${internalPointAccounts.aAvailable} + ${request.amountA}` }).where(eq(internalPointAccounts.userId, request.beneficiaryUserId));
        const account = await accountAfter(tx, request.beneficiaryUserId);
        await writeLedger(tx, { idempotencyKey: `grant:${request.id}:approved`, userId: request.beneficiaryUserId, pointType: "A", direction: "credit", actionType: "grant", amount: request.amountA, balanceAfter: account.aAvailable, referenceType: "grant", referenceId: String(request.id), memo: request.memo ?? undefined, approvedBy: ctx.user.id });
      });
      await createAuditLog({ adminId: ctx.user.id, action: "APPROVE_A_POINT_GRANT", targetType: "internalPointGrantRequest", targetId: input.requestId });
      return { success: true };
    }),

    confirmInvestmentPayment: superAdminProcedure.input(z.object({ investmentUseId: z.number().int().positive(), network: networkSchema, txHash: z.string().min(32).max(100) }))
      .mutation(async ({ input, ctx }: any) => {
        if (!isValidTxHash(input.txHash, input.network)) throw new TRPCError({ code: "BAD_REQUEST", message: "USDT TxHash 형식이 네트워크와 일치하지 않습니다." });
        const database = await getDb();
        if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
        const confirmed = await database.update(internalPointInvestmentUses).set({ status: "confirmed", paymentNetwork: input.network, usdtTxHash: input.txHash.trim(), paymentConfirmedBy: ctx.user.id, paymentConfirmedAt: new Date() })
          .where(and(eq(internalPointInvestmentUses.id, input.investmentUseId), eq(internalPointInvestmentUses.status, "intent")));
        if (resultCount(confirmed) !== 1) throw new TRPCError({ code: "CONFLICT", message: "확인 가능한 투자 결제 의도가 아니거나 이미 처리되었습니다." });
        await createAuditLog({ adminId: ctx.user.id, action: "CONFIRM_INTERNAL_POINT_INVESTMENT_USDT", targetType: "internalPointInvestmentUse", targetId: input.investmentUseId, details: { network: input.network, txHash: input.txHash } });
        return { success: true };
      }),

    completeInvestment: superAdminProcedure.input(z.object({ investmentUseId: z.number().int().positive() })).mutation(async ({ input, ctx }: any) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      await database.transaction(async tx => {
        const [use] = await tx.select().from(internalPointInvestmentUses).where(eq(internalPointInvestmentUses.id, input.investmentUseId)).limit(1);
        if (!use || use.status !== "confirmed" || !use.usdtTxHash || !use.paymentNetwork) throw new TRPCError({ code: "CONFLICT", message: "USDT 결제 TxHash가 확인된 투자만 완료할 수 있습니다." });
        const amount = toUnits(use.aPointAmount, "투자 A포인트");
        const coverage = await reserveCoverage(tx);
        if (coverage.headroom < amount) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "B포인트 준비금 헤드룸이 부족하여 투자 완료 전환을 승인할 수 없습니다." });
        const claimed = await tx.update(internalPointInvestmentUses).set({ status: "completed", completedBy: ctx.user.id, completedAt: new Date() }).where(and(eq(internalPointInvestmentUses.id, use.id), eq(internalPointInvestmentUses.status, "confirmed")));
        if (resultCount(claimed) !== 1) throw new TRPCError({ code: "CONFLICT", message: "다른 관리자가 이미 투자 사용 건을 처리했습니다." });
        const convert = await tx.update(internalPointAccounts).set({ aHeld: sql`${internalPointAccounts.aHeld} - ${use.aPointAmount}`, bAvailable: sql`${internalPointAccounts.bAvailable} + ${use.aPointAmount}` })
          .where(and(eq(internalPointAccounts.userId, use.userId), gte(internalPointAccounts.aHeld, use.aPointAmount)));
        if (resultCount(convert) !== 1) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "예약된 A포인트 잔액이 부족합니다." });
        const created = await tx.insert(internalPointConversionRequests).values({ userId: use.userId, conversionType: "investment_completion", investmentUseId: use.id, planId: use.planId, conversionBps: use.aPointShareBps, requestedAPoints: use.aPointAmount, convertedBPoints: use.aPointAmount, status: "approved", requestedBy: use.userId, approvedBy: ctx.user.id, approvedAt: new Date() });
        const conversionId = insertId(created);
        const account = await accountAfter(tx, use.userId);
        await writeLedger(tx, { idempotencyKey: `conversion:${conversionId}:a-debit`, userId: use.userId, pointType: "A", direction: "debit", actionType: "conversion_debit", amount: use.aPointAmount, balanceAfter: account.aAvailable, referenceType: "conversion", referenceId: String(conversionId), approvedBy: ctx.user.id });
        await writeLedger(tx, { idempotencyKey: `conversion:${conversionId}:b-credit`, userId: use.userId, pointType: "B", direction: "credit", actionType: "conversion_credit", amount: use.aPointAmount, balanceAfter: account.bAvailable, referenceType: "conversion", referenceId: String(conversionId), approvedBy: ctx.user.id });
      });
      await createAuditLog({ adminId: ctx.user.id, action: "COMPLETE_A_POINT_INVESTMENT", targetType: "internalPointInvestmentUse", targetId: input.investmentUseId });
      return { success: true };
    }),

    decideConversion: superAdminProcedure.input(z.object({ requestId: z.number().int().positive(), decision: z.enum(["approve", "reject"]), reason: z.string().trim().max(2_000).optional() }))
      .mutation(async ({ input, ctx }: any) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
        await database.transaction(async tx => {
          const [request] = await tx.select().from(internalPointConversionRequests).where(eq(internalPointConversionRequests.id, input.requestId)).limit(1);
          if (!request || request.status !== "requested" || request.conversionType !== "full_usdt_sale") throw new TRPCError({ code: "CONFLICT", message: "심사 가능한 100% USDT 매출 전환 신청이 아닙니다." });
          if (input.decision === "approve") {
            const amount = toUnits(request.requestedAPoints, "전환 A포인트");
            const coverage = await reserveCoverage(tx);
            if (coverage.headroom < amount) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "B포인트 준비금 헤드룸이 부족합니다." });
            const claimed = await tx.update(internalPointConversionRequests).set({ status: "approved", approvedBy: ctx.user.id, approvedAt: new Date() }).where(and(eq(internalPointConversionRequests.id, request.id), eq(internalPointConversionRequests.status, "requested")));
            if (resultCount(claimed) !== 1) throw new TRPCError({ code: "CONFLICT", message: "다른 관리자가 이미 전환 신청을 처리했습니다." });
            const converted = await tx.update(internalPointAccounts).set({ aHeld: sql`${internalPointAccounts.aHeld} - ${request.requestedAPoints}`, bAvailable: sql`${internalPointAccounts.bAvailable} + ${request.convertedBPoints}` })
              .where(and(eq(internalPointAccounts.userId, request.userId), gte(internalPointAccounts.aHeld, request.requestedAPoints)));
            if (resultCount(converted) !== 1) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "예약된 A포인트가 부족합니다." });
            const account = await accountAfter(tx, request.userId);
            await writeLedger(tx, { idempotencyKey: `conversion:${request.id}:a-debit`, userId: request.userId, pointType: "A", direction: "debit", actionType: "conversion_debit", amount: request.requestedAPoints, balanceAfter: account.aAvailable, referenceType: "conversion", referenceId: String(request.id), approvedBy: ctx.user.id });
            await writeLedger(tx, { idempotencyKey: `conversion:${request.id}:b-credit`, userId: request.userId, pointType: "B", direction: "credit", actionType: "conversion_credit", amount: request.convertedBPoints, balanceAfter: account.bAvailable, referenceType: "conversion", referenceId: String(request.id), approvedBy: ctx.user.id });
          } else {
            const claimed = await tx.update(internalPointConversionRequests).set({ status: "rejected", approvedBy: ctx.user.id, approvedAt: new Date(), rejectedReason: input.reason ?? "관리자 거절" }).where(and(eq(internalPointConversionRequests.id, request.id), eq(internalPointConversionRequests.status, "requested")));
            if (resultCount(claimed) !== 1) throw new TRPCError({ code: "CONFLICT", message: "다른 관리자가 이미 전환 신청을 처리했습니다." });
            await tx.update(internalPointAccounts).set({ aAvailable: sql`${internalPointAccounts.aAvailable} + ${request.requestedAPoints}`, aHeld: sql`${internalPointAccounts.aHeld} - ${request.requestedAPoints}` })
              .where(and(eq(internalPointAccounts.userId, request.userId), gte(internalPointAccounts.aHeld, request.requestedAPoints)));
            const account = await accountAfter(tx, request.userId);
            await writeLedger(tx, { idempotencyKey: `conversion:${request.id}:release`, userId: request.userId, pointType: "A", direction: "credit", actionType: "conversion_release", amount: request.requestedAPoints, balanceAfter: account.aAvailable, referenceType: "conversion", referenceId: String(request.id), approvedBy: ctx.user.id });
          }
        });
        await createAuditLog({ adminId: ctx.user.id, action: input.decision === "approve" ? "APPROVE_A_TO_B_CONVERSION" : "REJECT_A_TO_B_CONVERSION", targetType: "internalPointConversionRequest", targetId: input.requestId, details: { reason: input.reason } });
        return { success: true };
      }),

    createReserve: superAdminProcedure.input(z.object({ network: networkSchema, walletAddress: z.string().min(10).max(100), status: z.enum(["active", "paused"]).default("paused") }))
      .mutation(async ({ input, ctx }: any) => {
        let walletAddress: string;
        try { walletAddress = normalizeWalletAddress(input.walletAddress, input.network as PointNetwork); }
        catch (error) { throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "지갑 주소가 올바르지 않습니다." }); }
        const database = await getDb();
        if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
        const created = await database.insert(bPointReserveAccounts).values({ network: input.network, walletAddress, status: input.status });
        const id = insertId(created);
        await createAuditLog({ adminId: ctx.user.id, action: "CREATE_B_POINT_RESERVE", targetType: "bPointReserveAccount", targetId: id, details: { network: input.network, walletAddress } });
        return { id };
      }),

    fundReserve: superAdminProcedure.input(z.object({ reserveAccountId: z.number().int().positive(), amountUsdt: amountSchema, txHash: z.string().min(32).max(100), memo: z.string().trim().max(1_000).optional() }))
      .mutation(async ({ input, ctx }: any) => {
        const amount = toUnits(input.amountUsdt, "준비금");
        const database = await getDb();
        if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
        await database.transaction(async tx => {
          const [reserve] = await tx.select().from(bPointReserveAccounts).where(eq(bPointReserveAccounts.id, input.reserveAccountId)).limit(1);
          if (!reserve || reserve.status === "closed") throw new TRPCError({ code: "NOT_FOUND", message: "유효한 준비금 계정을 찾을 수 없습니다." });
          if (!isValidTxHash(input.txHash, reserve.network)) throw new TRPCError({ code: "BAD_REQUEST", message: "준비금 입금 TxHash 형식이 네트워크와 일치하지 않습니다." });
          await tx.update(bPointReserveAccounts).set({ fundedUsdt: sql`${bPointReserveAccounts.fundedUsdt} + ${toDecimal(amount)}` }).where(eq(bPointReserveAccounts.id, reserve.id));
          await tx.insert(bPointReserveMovements).values({ idempotencyKey: `reserve:${reserve.id}:fund:${input.txHash.toLowerCase()}`, reserveAccountId: reserve.id, movementType: "fund", amountUsdt: toDecimal(amount), txHash: input.txHash.trim(), memo: input.memo, createdBy: ctx.user.id });
        });
        await createAuditLog({ adminId: ctx.user.id, action: "FUND_B_POINT_RESERVE", targetType: "bPointReserveAccount", targetId: input.reserveAccountId, details: { amountUsdt: toDecimal(amount), txHash: input.txHash } });
        return { success: true };
      }),

    decideWithdrawal: superAdminProcedure.input(z.object({ requestId: z.number().int().positive(), decision: z.enum(["approve", "reject"]), reserveAccountId: z.number().int().positive().optional(), reason: z.string().trim().max(2_000).optional() }))
      .mutation(async ({ input, ctx }: any) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
        await database.transaction(async tx => {
          const [request] = await tx.select().from(bPointWithdrawalRequests).where(eq(bPointWithdrawalRequests.id, input.requestId)).limit(1);
          if (!request || request.status !== "requested") throw new TRPCError({ code: "CONFLICT", message: "심사 가능한 출금 신청이 아닙니다." });
          if (input.decision === "approve") {
            if (!input.reserveAccountId) throw new TRPCError({ code: "BAD_REQUEST", message: "승인할 준비금 계정을 선택해야 합니다." });
            const [reserve] = await tx.select().from(bPointReserveAccounts).where(and(eq(bPointReserveAccounts.id, input.reserveAccountId), eq(bPointReserveAccounts.network, request.network), eq(bPointReserveAccounts.status, "active"))).limit(1);
            if (!reserve) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "동일 네트워크의 활성 준비금 계정이 필요합니다." });
            const available = calculateAvailableReserveBaseUnits({ fundedUsdtBaseUnits: toUnitsOrZero(reserve.fundedUsdt), committedUsdtBaseUnits: toUnitsOrZero(reserve.committedUsdt), paidUsdtBaseUnits: toUnitsOrZero(reserve.paidUsdt) });
            if (available < toUnits(request.usdtAmount, "출금액")) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "가용 USDT 준비금이 부족합니다." });
            const claimed = await tx.update(bPointWithdrawalRequests).set({ status: "approved", reserveAccountId: reserve.id, approvedBy: ctx.user.id, approvedAt: new Date() }).where(and(eq(bPointWithdrawalRequests.id, request.id), eq(bPointWithdrawalRequests.status, "requested")));
            if (resultCount(claimed) !== 1) throw new TRPCError({ code: "CONFLICT", message: "다른 관리자가 이미 출금 신청을 처리했습니다." });
            await tx.update(bPointReserveAccounts).set({ committedUsdt: sql`${bPointReserveAccounts.committedUsdt} + ${request.usdtAmount}` }).where(eq(bPointReserveAccounts.id, reserve.id));
            await tx.insert(bPointReserveMovements).values({ idempotencyKey: `withdrawal:${request.id}:commit`, reserveAccountId: reserve.id, movementType: "commit", amountUsdt: request.usdtAmount, withdrawalRequestId: request.id, createdBy: ctx.user.id });
          } else {
            const claimed = await tx.update(bPointWithdrawalRequests).set({ status: "rejected", approvedBy: ctx.user.id, approvedAt: new Date(), rejectedReason: input.reason ?? "관리자 거절" }).where(and(eq(bPointWithdrawalRequests.id, request.id), eq(bPointWithdrawalRequests.status, "requested")));
            if (resultCount(claimed) !== 1) throw new TRPCError({ code: "CONFLICT", message: "다른 관리자가 이미 출금 신청을 처리했습니다." });
            await tx.update(internalPointAccounts).set({ bAvailable: sql`${internalPointAccounts.bAvailable} + ${request.amountB}`, bReserved: sql`${internalPointAccounts.bReserved} - ${request.amountB}` }).where(and(eq(internalPointAccounts.userId, request.userId), gte(internalPointAccounts.bReserved, request.amountB)));
            const account = await accountAfter(tx, request.userId);
            await writeLedger(tx, { idempotencyKey: `withdrawal:${request.id}:release`, userId: request.userId, pointType: "B", direction: "credit", actionType: "withdrawal_release", amount: request.amountB, balanceAfter: account.bAvailable, referenceType: "withdrawal", referenceId: String(request.id), approvedBy: ctx.user.id });
          }
        });
        await createAuditLog({ adminId: ctx.user.id, action: input.decision === "approve" ? "APPROVE_B_POINT_WITHDRAWAL" : "REJECT_B_POINT_WITHDRAWAL", targetType: "bPointWithdrawalRequest", targetId: input.requestId, details: { reserveAccountId: input.reserveAccountId, reason: input.reason } });
        return { success: true };
      }),

    markWithdrawalPaid: superAdminProcedure.input(z.object({ requestId: z.number().int().positive(), txHash: z.string().min(32).max(100) }))
      .mutation(async ({ input, ctx }: any) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
        await database.transaction(async tx => {
          const [request] = await tx.select().from(bPointWithdrawalRequests).where(eq(bPointWithdrawalRequests.id, input.requestId)).limit(1);
          if (!request || !["approved", "processing"].includes(request.status) || !request.reserveAccountId) throw new TRPCError({ code: "CONFLICT", message: "송금 완료 처리 가능한 출금 신청이 아닙니다." });
          if (!isValidTxHash(input.txHash, request.network)) throw new TRPCError({ code: "BAD_REQUEST", message: "TxHash 형식이 네트워크와 일치하지 않습니다." });
          const claimed = await tx.update(bPointWithdrawalRequests).set({ status: "paid", txHash: input.txHash.trim(), paidAt: new Date() }).where(and(eq(bPointWithdrawalRequests.id, request.id), or(eq(bPointWithdrawalRequests.status, "approved"), eq(bPointWithdrawalRequests.status, "processing"))));
          if (resultCount(claimed) !== 1) throw new TRPCError({ code: "CONFLICT", message: "다른 관리자가 이미 출금 완료를 처리했습니다." });
          const paid = await tx.update(internalPointAccounts).set({ bReserved: sql`${internalPointAccounts.bReserved} - ${request.amountB}` }).where(and(eq(internalPointAccounts.userId, request.userId), gte(internalPointAccounts.bReserved, request.amountB)));
          if (resultCount(paid) !== 1) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "예약된 B포인트가 부족합니다." });
          const reservePayout = await tx.update(bPointReserveAccounts).set({ committedUsdt: sql`${bPointReserveAccounts.committedUsdt} - ${request.usdtAmount}`, paidUsdt: sql`${bPointReserveAccounts.paidUsdt} + ${request.usdtAmount}` }).where(and(eq(bPointReserveAccounts.id, request.reserveAccountId), gte(bPointReserveAccounts.committedUsdt, request.usdtAmount)));
          if (resultCount(reservePayout) !== 1) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "준비금 커밋 잔액이 부족하여 송금 완료 처리할 수 없습니다." });
          await tx.insert(bPointReserveMovements).values({ idempotencyKey: `withdrawal:${request.id}:payout`, reserveAccountId: request.reserveAccountId, movementType: "payout", amountUsdt: request.usdtAmount, withdrawalRequestId: request.id, txHash: input.txHash.trim(), createdBy: ctx.user.id });
          const account = await accountAfter(tx, request.userId);
          await writeLedger(tx, { idempotencyKey: `withdrawal:${request.id}:paid`, userId: request.userId, pointType: "B", direction: "debit", actionType: "withdrawal_paid", amount: request.amountB, balanceAfter: account.bAvailable, referenceType: "withdrawal", referenceId: String(request.id), approvedBy: ctx.user.id });
        });
        await createAuditLog({ adminId: ctx.user.id, action: "MARK_B_POINT_WITHDRAWAL_PAID", targetType: "bPointWithdrawalRequest", targetId: input.requestId, details: { txHash: input.txHash } });
        return { success: true };
      }),
  });
}
