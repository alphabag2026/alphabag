import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
} from "drizzle-orm/mysql-core";

// ─── Users ───────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "sub_admin"]).default("user").notNull(),
  walletAddress: varchar("walletAddress", { length: 100 }),
  referralCode: varchar("referralCode", { length: 20 }).unique(),
  referredBy: varchar("referredBy", { length: 20 }),
  kycStatus: mysqlEnum("kycStatus", ["pending", "approved", "rejected", "none"]).default("none").notNull(),
  kycData: json("kycData"),
  totalInvested: decimal("totalInvested", { precision: 18, scale: 2 }).default("0"),
  totalNodes: decimal("totalNodes", { precision: 18, scale: 2 }).default("0"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Investment Plans ─────────────────────────────────────────────────────────
export const investmentPlans = mysqlTable("investmentPlans", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  logoUrl: text("logoUrl"),
  label: varchar("label", { length: 50 }),
  dailyRate: decimal("dailyRate", { precision: 6, scale: 4 }).notNull(),
  minAmount: decimal("minAmount", { precision: 18, scale: 2 }).default("0"),
  maxAmount: decimal("maxAmount", { precision: 18, scale: 2 }),
  duration: int("duration"),
  totalReturn: decimal("totalReturn", { precision: 8, scale: 4 }),
  description: text("description"),
  urlId: varchar("urlId", { length: 50 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  planType: mysqlEnum("planType", ["investment", "staking"]).default("investment").notNull(),
  tags: json("tags"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InvestmentPlan = typeof investmentPlans.$inferSelect;
export type InsertInvestmentPlan = typeof investmentPlans.$inferInsert;

// ─── Nodes ────────────────────────────────────────────────────────────────────
export const nodes = mysqlTable("nodes", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  price: decimal("price", { precision: 18, scale: 2 }).notNull(),
  color: varchar("color", { length: 30 }).default("gold").notNull(),
  nodeId: int("nodeId").default(1).notNull(),
  walletAddress: varchar("walletAddress", { length: 100 }),
  description: text("description"),
  tags: json("tags"),
  totalSold: int("totalSold").default(0).notNull(),
  totalRevenue: decimal("totalRevenue", { precision: 18, scale: 2 }).default("0").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Node = typeof nodes.$inferSelect;
export type InsertNode = typeof nodes.$inferInsert;

// ─── Investments ──────────────────────────────────────────────────────────────
export const investments = mysqlTable("investments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  planId: int("planId").notNull(),
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
  dailyEarning: decimal("dailyEarning", { precision: 18, scale: 2 }),
  totalEarned: decimal("totalEarned", { precision: 18, scale: 2 }).default("0"),
  status: mysqlEnum("status", ["active", "completed", "cancelled"]).default("active").notNull(),
  startDate: timestamp("startDate").defaultNow().notNull(),
  endDate: timestamp("endDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Investment = typeof investments.$inferSelect;
export type InsertInvestment = typeof investments.$inferInsert;

// ─── Node Orders ──────────────────────────────────────────────────────────────
export const nodeOrders = mysqlTable("nodeOrders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  nodeId: int("nodeId").notNull(),
  quantity: int("quantity").default(1).notNull(),
  totalAmount: decimal("totalAmount", { precision: 18, scale: 2 }).notNull(),
  txHash: varchar("txHash", { length: 100 }),
  status: mysqlEnum("status", ["pending", "confirmed", "cancelled"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NodeOrder = typeof nodeOrders.$inferSelect;
export type InsertNodeOrder = typeof nodeOrders.$inferInsert;

// ─── Notices ──────────────────────────────────────────────────────────────────
export const notices = mysqlTable("notices", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  isPinned: boolean("isPinned").default(false).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Notice = typeof notices.$inferSelect;
export type InsertNotice = typeof notices.$inferInsert;

// ─── Announcements ────────────────────────────────────────────────────────────
export const announcements = mysqlTable("announcements", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  type: mysqlEnum("type", ["info", "warning", "success", "urgent"]).default("info").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  targetRole: mysqlEnum("targetRole", ["all", "user", "admin"]).default("all").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = typeof announcements.$inferInsert;

// ─── Event Banners ────────────────────────────────────────────────────────────
export const eventBanners = mysqlTable("eventBanners", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }),
  imageUrl: text("imageUrl").notNull(),
  linkUrl: text("linkUrl"),
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EventBanner = typeof eventBanners.$inferSelect;
export type InsertEventBanner = typeof eventBanners.$inferInsert;

// ─── Ad Images ────────────────────────────────────────────────────────────────
export const adImages = mysqlTable("adImages", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }),
  imageUrl: text("imageUrl").notNull(),
  linkUrl: text("linkUrl"),
  position: varchar("position", { length: 50 }).default("sidebar"),
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AdImage = typeof adImages.$inferSelect;
export type InsertAdImage = typeof adImages.$inferInsert;

// ─── Support Tickets ──────────────────────────────────────────────────────────
export const supportTickets = mysqlTable("supportTickets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  subject: varchar("subject", { length: 200 }).notNull(),
  message: text("message").notNull(),
  category: varchar("category", { length: 50 }).default("general"),
  status: mysqlEnum("status", ["open", "in_progress", "resolved", "closed"]).default("open").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  adminReply: text("adminReply"),
  repliedAt: timestamp("repliedAt"),
  repliedBy: int("repliedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;

// ─── Airdrops ─────────────────────────────────────────────────────────────────
export const airdrops = mysqlTable("airdrops", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  tokenSymbol: varchar("tokenSymbol", { length: 20 }).notNull(),
  totalAmount: decimal("totalAmount", { precision: 18, scale: 2 }).notNull(),
  distributedAmount: decimal("distributedAmount", { precision: 18, scale: 2 }).default("0"),
  perUserAmount: decimal("perUserAmount", { precision: 18, scale: 2 }),
  maxParticipants: int("maxParticipants"),
  currentParticipants: int("currentParticipants").default(0),
  status: mysqlEnum("status", ["draft", "active", "completed", "cancelled"]).default("draft").notNull(),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  requirements: json("requirements"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Airdrop = typeof airdrops.$inferSelect;
export type InsertAirdrop = typeof airdrops.$inferInsert;

// ─── Airdrop Participants ─────────────────────────────────────────────────────
export const airdropParticipants = mysqlTable("airdropParticipants", {
  id: int("id").autoincrement().primaryKey(),
  airdropId: int("airdropId").notNull(),
  userId: int("userId").notNull(),
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "distributed", "failed"]).default("pending").notNull(),
  txHash: varchar("txHash", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AirdropParticipant = typeof airdropParticipants.$inferSelect;
export type InsertAirdropParticipant = typeof airdropParticipants.$inferInsert;

// ─── Referrals ────────────────────────────────────────────────────────────────
export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  referrerId: int("referrerId").notNull(),
  referredId: int("referredId").notNull(),
  level: int("level").default(1).notNull(),
  commissionRate: decimal("commissionRate", { precision: 6, scale: 4 }).default("0.05"),
  totalEarned: decimal("totalEarned", { precision: 18, scale: 2 }).default("0"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;

// ─── Audit Logs ───────────────────────────────────────────────────────────────
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  adminId: int("adminId").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  targetType: varchar("targetType", { length: 50 }),
  targetId: int("targetId"),
  details: json("details"),
  ipAddress: varchar("ipAddress", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// ─── Admin Accounts ───────────────────────────────────────────────────────────
export const adminAccounts = mysqlTable("adminAccounts", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["admin", "sub_admin"]).default("admin").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  lastLoginAt: timestamp("lastLoginAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type AdminAccount = typeof adminAccounts.$inferSelect;
export type InsertAdminAccount = typeof adminAccounts.$inferInsert;

// ─── Notifications ────────────────────────────────────────────────────────────
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 20 }).default("info").notNull(),
  targetRole: varchar("targetRole", { length: 20 }).default("all").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
