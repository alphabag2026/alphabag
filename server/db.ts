import { and, desc, eq, like, or, sql, count, sum, countDistinct } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  investmentPlans, InsertInvestmentPlan,
  nodes, InsertNode,
  investments, InsertInvestment,
  nodeOrders, InsertNodeOrder,
  notices, InsertNotice,
  announcements, InsertAnnouncement,
  eventBanners, InsertEventBanner,
  adImages, InsertAdImage,
  supportTickets, InsertSupportTicket,
  airdrops, InsertAirdrop,
  airdropParticipants, InsertAirdropParticipant,
  referrals, InsertReferral,
  auditLogs, InsertAuditLog,
  adminAccounts,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const fields = ["name", "email", "loginMethod"] as const;
  for (const f of fields) {
    if (user[f] !== undefined) { values[f] = user[f] ?? null; updateSet[f] = user[f] ?? null; }
  }
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getAllUsers(search?: string, page = 1, limit = 20) {
  const db = await getDb();
  if (!db) return { data: [], total: 0 };
  const offset = (page - 1) * limit;
  const where = search
    ? or(
        like(users.walletAddress, `%${search}%`),
        like(users.referralCode, `%${search}%`),
        like(users.referredBy, `%${search}%`),
        like(users.name, `%${search}%`),
        like(users.email, `%${search}%`)
      )
    : undefined;
  const [data, totalResult] = await Promise.all([
    db.select().from(users).where(where).orderBy(desc(users.createdAt)).limit(limit).offset(offset),
    db.select({ count: count() }).from(users).where(where),
  ]);
  return { data, total: totalResult[0]?.count ?? 0 };
}

export async function updateUserKyc(userId: number, kycStatus: "pending" | "approved" | "rejected" | "none", kycData?: unknown) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ kycStatus, kycData: kycData ?? null }).where(eq(users.id, userId));
}

export async function updateUserRole(userId: number, role: "user" | "admin" | "sub_admin") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function getAdminUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).where(or(eq(users.role, "admin"), eq(users.role, "sub_admin"))).orderBy(users.role, users.createdAt);
}

export async function findUserByEmailOrId(emailOrId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const numId = parseInt(emailOrId);
  if (!isNaN(numId)) {
    const result = await db.select().from(users).where(eq(users.id, numId)).limit(1);
    return result[0];
  }
  const result = await db.select().from(users).where(eq(users.email, emailOrId)).limit(1);
  return result[0];
}

// --- Investment Plans ---
export async function getInvestmentPlans(
  planType?: "investment" | "staking" | "golden" | "self" | "node",
  collectionType?: "golden" | "self" | "node",
  limit?: number,
  highlightOnly?: boolean
) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (planType) conditions.push(eq(investmentPlans.planType, planType));
  if (collectionType) conditions.push(eq(investmentPlans.collectionType, collectionType));
  if (highlightOnly) conditions.push(eq(investmentPlans.isHighlight, true));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const query = db.select().from(investmentPlans).where(where).orderBy(investmentPlans.sortOrder);
  if (limit) return (query as any).limit(limit);
  return query;
}

export async function createInvestmentPlan(data: InsertInvestmentPlan) {
  const db = await getDb();
  if (!db) return;
  const result = await db.insert(investmentPlans).values(data);
  return result;
}

export async function updateInvestmentPlan(id: number, data: Partial<InsertInvestmentPlan>) {
  const db = await getDb();
  if (!db) return;
  await db.update(investmentPlans).set(data).where(eq(investmentPlans.id, id));
}

export async function deleteInvestmentPlan(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(investmentPlans).where(eq(investmentPlans.id, id));
}

// ─── Nodes ────────────────────────────────────────────────────────────────────
export async function getNodes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(nodes).orderBy(nodes.sortOrder);
}

export async function createNode(data: InsertNode) {
  const db = await getDb();
  if (!db) return;
  return db.insert(nodes).values(data);
}

export async function updateNode(id: number, data: Partial<InsertNode>) {
  const db = await getDb();
  if (!db) return;
  await db.update(nodes).set(data).where(eq(nodes.id, id));
}

export async function deleteNode(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(nodes).where(eq(nodes.id, id));
}

export async function getNodeEarnings() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    nodeId: nodeOrders.nodeId,
    totalOrders: count(nodeOrders.id),
    totalRevenue: sum(nodeOrders.totalAmount),
  }).from(nodeOrders).where(eq(nodeOrders.status, "confirmed")).groupBy(nodeOrders.nodeId);
}

// ─── Notices ──────────────────────────────────────────────────────────────────
export async function getNotices() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notices).orderBy(desc(notices.isPinned), notices.sortOrder, desc(notices.createdAt));
}

export async function createNotice(data: InsertNotice) {
  const db = await getDb();
  if (!db) return;
  return db.insert(notices).values(data);
}

export async function updateNotice(id: number, data: Partial<InsertNotice>) {
  const db = await getDb();
  if (!db) return;
  await db.update(notices).set(data).where(eq(notices.id, id));
}

export async function deleteNotice(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(notices).where(eq(notices.id, id));
}

// ─── Announcements ────────────────────────────────────────────────────────────
export async function getAnnouncements() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(announcements).orderBy(desc(announcements.createdAt));
}

export async function createAnnouncement(data: InsertAnnouncement) {
  const db = await getDb();
  if (!db) return;
  return db.insert(announcements).values(data);
}

export async function updateAnnouncement(id: number, data: Partial<InsertAnnouncement>) {
  const db = await getDb();
  if (!db) return;
  await db.update(announcements).set(data).where(eq(announcements.id, id));
}

export async function deleteAnnouncement(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(announcements).where(eq(announcements.id, id));
}

// ─── Event Banners ────────────────────────────────────────────────────────────
export async function getEventBanners() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(eventBanners).orderBy(eventBanners.sortOrder);
}

export async function createEventBanner(data: InsertEventBanner) {
  const db = await getDb();
  if (!db) return;
  return db.insert(eventBanners).values(data);
}

export async function updateEventBanner(id: number, data: Partial<InsertEventBanner>) {
  const db = await getDb();
  if (!db) return;
  await db.update(eventBanners).set(data).where(eq(eventBanners.id, id));
}

export async function deleteEventBanner(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(eventBanners).where(eq(eventBanners.id, id));
}

// ─── Ad Images ────────────────────────────────────────────────────────────────
export async function getAdImages() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(adImages).orderBy(adImages.sortOrder);
}

export async function createAdImage(data: InsertAdImage) {
  const db = await getDb();
  if (!db) return;
  return db.insert(adImages).values(data);
}

export async function updateAdImage(id: number, data: Partial<InsertAdImage>) {
  const db = await getDb();
  if (!db) return;
  await db.update(adImages).set(data).where(eq(adImages.id, id));
}

export async function deleteAdImage(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(adImages).where(eq(adImages.id, id));
}

// ─── Support Tickets ──────────────────────────────────────────────────────────
export async function getSupportTickets(status?: string, page = 1, limit = 20) {
  const db = await getDb();
  if (!db) return { data: [], total: 0 };
  const offset = (page - 1) * limit;
  const where = status ? eq(supportTickets.status, status as "open" | "in_progress" | "resolved" | "closed") : undefined;
  const [data, totalResult] = await Promise.all([
    db.select().from(supportTickets).where(where).orderBy(desc(supportTickets.createdAt)).limit(limit).offset(offset),
    db.select({ count: count() }).from(supportTickets).where(where),
  ]);
  return { data, total: totalResult[0]?.count ?? 0 };
}

export async function replyToTicket(id: number, adminReply: string, adminId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(supportTickets).set({
    adminReply,
    repliedAt: new Date(),
    repliedBy: adminId,
    status: "resolved",
  }).where(eq(supportTickets.id, id));
}

export async function updateTicketStatus(id: number, status: "open" | "in_progress" | "resolved" | "closed") {
  const db = await getDb();
  if (!db) return;
  await db.update(supportTickets).set({ status }).where(eq(supportTickets.id, id));
}

// ─── Airdrops ─────────────────────────────────────────────────────────────────
export async function getAirdrops() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(airdrops).orderBy(desc(airdrops.createdAt));
}

export async function createAirdrop(data: InsertAirdrop) {
  const db = await getDb();
  if (!db) return;
  return db.insert(airdrops).values(data);
}

export async function updateAirdrop(id: number, data: Partial<InsertAirdrop>) {
  const db = await getDb();
  if (!db) return;
  await db.update(airdrops).set(data).where(eq(airdrops.id, id));
}

export async function deleteAirdrop(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(airdrops).where(eq(airdrops.id, id));
}

export async function getAirdropParticipants(airdropId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(airdropParticipants).where(eq(airdropParticipants.airdropId, airdropId)).orderBy(desc(airdropParticipants.createdAt));
}

// ─── Referrals ────────────────────────────────────────────────────────────────
export async function getReferralTree(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(referrals).where(eq(referrals.referrerId, userId));
}

export async function getTopReferrers(limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    referrerId: referrals.referrerId,
    totalReferrals: count(referrals.id),
    totalEarned: sum(referrals.totalEarned),
  }).from(referrals).groupBy(referrals.referrerId).orderBy(desc(count(referrals.id))).limit(limit);
}

export async function getReferralStats() {
  const db = await getDb();
  if (!db) return { totalReferrers: 0, totalReferrals: 0, totalReferralRevenue: 0, avgReferralsPerUser: 0 };
  const [referrersResult, referralsResult, revenueResult] = await Promise.all([
    db.select({ count: count(referrals.referrerId) }).from(referrals).groupBy(referrals.referrerId),
    db.select({ count: count() }).from(referrals),
    db.select({ total: sum(referrals.totalEarned) }).from(referrals),
  ]);
  const totalReferrers = referrersResult.length;
  const totalReferrals = referralsResult[0]?.count ?? 0;
  const totalReferralRevenue = Number(revenueResult[0]?.total ?? 0);
  const avgReferralsPerUser = totalReferrers > 0 ? totalReferrals / totalReferrers : 0;
  return { totalReferrers, totalReferrals, totalReferralRevenue, avgReferralsPerUser };
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────
export async function createAuditLog(data: InsertAuditLog) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLogs).values(data);
}

export async function getAuditLogs(page = 1, limit = 50) {
  const db = await getDb();
  if (!db) return { data: [], total: 0 };
  const offset = (page - 1) * limit;
  const [data, totalResult] = await Promise.all([
    db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit).offset(offset),
    db.select({ count: count() }).from(auditLogs),
  ]);
  return { data, total: totalResult[0]?.count ?? 0 };
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return null;
  const [
    totalUsers,
    totalInvestment,
    totalNodeRevenue,
    openTickets,
    totalReferrals,
    recentInvestments,
  ] = await Promise.all([
    db.select({ count: count() }).from(users),
    db.select({ total: sum(investments.amount) }).from(investments).where(eq(investments.status, "active")),
    db.select({ total: sum(nodeOrders.totalAmount) }).from(nodeOrders).where(eq(nodeOrders.status, "confirmed")),
    db.select({ count: count() }).from(supportTickets).where(eq(supportTickets.status, "open")),
    db.select({ count: count() }).from(referrals),
    db.select({
      date: sql<string>`DATE(${investments.createdAt})`,
      volume: sum(investments.amount),
      count: count(),
    }).from(investments).groupBy(sql`DATE(${investments.createdAt})`).orderBy(sql`DATE(${investments.createdAt})`).limit(30),
  ]);
  const totalInvestmentNum = Number(totalInvestment[0]?.total ?? 0);
  const totalNodeRevenueNum = Number(totalNodeRevenue[0]?.total ?? 0);
  const totalUsersNum = totalUsers[0]?.count ?? 0;
  const totalReferralsNum = totalReferrals[0]?.count ?? 0;
  const investingUsers = await db.select({ count: countDistinct(investments.userId) }).from(investments).where(eq(investments.status, "active"));
  const investingUsersNum = investingUsers[0]?.count ?? 0;
  const conversionRate = totalUsersNum > 0 ? (investingUsersNum / totalUsersNum) * 100 : 0;
  return {
    totalUsers: totalUsersNum,
    totalInvestment: totalInvestmentNum,
    totalNodeRevenue: totalNodeRevenueNum,
    totalRevenue: totalInvestmentNum + totalNodeRevenueNum,
    openTickets: openTickets[0]?.count ?? 0,
    totalReferrals: totalReferralsNum,
    conversionRate: Math.round(conversionRate * 10) / 10,
    recentInvestments,
  };
}

export async function getTopInvestors(limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    userId: investments.userId,
    totalAmount: sum(investments.amount),
    investmentCount: count(investments.id),
  }).from(investments).where(eq(investments.status, "active")).groupBy(investments.userId).orderBy(desc(sum(investments.amount))).limit(limit);
}

export async function getInvestmentTrend(days = 30) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    date: sql<string>`DATE(${investments.createdAt})`,
    volume: sum(investments.amount),
    count: count(),
  }).from(investments)
    .where(sql`${investments.createdAt} >= DATE_SUB(NOW(), INTERVAL ${days} DAY)`)
    .groupBy(sql`DATE(${investments.createdAt})`)
    .orderBy(sql`DATE(${investments.createdAt})`);
}

export async function getPlanDistribution() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    planId: investments.planId,
    totalAmount: sum(investments.amount),
    count: count(),
  }).from(investments).where(eq(investments.status, "active")).groupBy(investments.planId).orderBy(desc(sum(investments.amount)));
}

// ─── User-facing helpers ──────────────────────────────────────────────────────

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getUserByReferralCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.referralCode, code)).limit(1);
  return result[0];
}

export async function updateUserWallet(userId: number, walletAddress: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ walletAddress }).where(eq(users.id, userId));
}

export async function generateUserReferralCode(userId: number): Promise<string> {
  const db = await getDb();
  if (!db) return "";
  // Check if user already has a referral code
  const user = await getUserById(userId);
  if (user?.referralCode) return user.referralCode;
  // Generate a unique code
  const code = `AB${userId.toString().padStart(6, "0")}`;
  await db.update(users).set({ referralCode: code }).where(eq(users.id, userId));
  return code;
}

export async function setUserReferral(userId: number, referralCode: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ referredBy: referralCode }).where(eq(users.id, userId));
  // Create referral record
  const referrer = await getUserByReferralCode(referralCode);
  if (referrer) {
    await db.insert(referrals).values({
      referrerId: referrer.id,
      referredId: userId,
      level: 1,
    } as InsertReferral);
  }
}

export async function getInvestmentPlanById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(investmentPlans).where(eq(investmentPlans.id, id)).limit(1);
  return result[0];
}

export async function getNodeById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(nodes).where(eq(nodes.id, id)).limit(1);
  return result[0];
}

export async function createInvestment(data: InsertInvestment) {
  const db = await getDb();
  if (!db) return;
  await db.insert(investments).values(data);
}

export async function createNodeOrder(data: InsertNodeOrder) {
  const db = await getDb();
  if (!db) return;
  await db.insert(nodeOrders).values(data);
}

export async function getUserInvestments(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(investments).where(eq(investments.userId, userId)).orderBy(desc(investments.createdAt));
}

export async function getUserNodeOrders(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(nodeOrders).where(eq(nodeOrders.userId, userId)).orderBy(desc(nodeOrders.createdAt));
}

export async function createSupportTicket(data: InsertSupportTicket) {
  const db = await getDb();
  if (!db) return;
  await db.insert(supportTickets).values(data);
}

export async function getUserTickets(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(supportTickets).where(eq(supportTickets.userId, userId)).orderBy(desc(supportTickets.createdAt));
}

export async function getUserReferralStats(userId: number) {
  const db = await getDb();
  if (!db) return { totalReferrals: 0, activeReferrals: 0, referralCode: null };
  const user = await getUserById(userId);
  const allReferrals = await db.select().from(referrals).where(eq(referrals.referrerId, userId));
  return {
    totalReferrals: allReferrals.length,
    activeReferrals: allReferrals.length,
    referralCode: user?.referralCode ?? null,
  };
}

// ─── Admin Accounts ───────────────────────────────────────────────────────────
export async function getAdminAccountByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(adminAccounts).where(eq(adminAccounts.username, username)).limit(1);
  return result[0];
}

export async function updateAdminLastLogin(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(adminAccounts).set({ lastLoginAt: new Date() }).where(eq(adminAccounts.id, id));
}
