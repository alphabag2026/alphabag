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
  telegramChatId: varchar("telegramChatId", { length: 64 }),
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
  planType: mysqlEnum("planType", ["investment", "staking", "golden", "self", "node", "leader", "meme", "influencer"]).default("investment").notNull(),
  collectionType: mysqlEnum("collectionType", ["golden", "self", "node", "leader", "meme", "influencer"]),
  tags: json("tags"),
  rating: decimal("rating", { precision: 3, scale: 1 }).default("4.0"),
  videoUrl: text("videoUrl"),
  docsUrl: text("docsUrl"),
  blogUrl: text("blogUrl"),
  telegramUrl: text("telegramUrl"),
  twitterUrl: text("twitterUrl"),
  recommendedAmount: decimal("recommendedAmount", { precision: 18, scale: 2 }),
  allocation: varchar("allocation", { length: 50 }),
  strategy: varchar("strategy", { length: 100 }),
  badgeLabels: json("badgeLabels"),
  isHighlight: boolean("isHighlight").default(false).notNull(),
  isHidden: boolean("isHidden").default(false).notNull(),
  // Extended fields
  videoUrl2: text("videoUrl2"),
  docsUrl2: text("docsUrl2"),
  infoweb4Url: text("infoweb4Url"),
  thumbnailImages: json("thumbnailImages"),
  ratioInfo: varchar("ratioInfo", { length: 100 }),
  yieldInfo: varchar("yieldInfo", { length: 100 }),
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
  type: mysqlEnum("type", ["info", "warning", "success", "urgent", "meeting"]).default("info").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  targetRole: mysqlEnum("targetRole", ["all", "user", "admin"]).default("all").notNull(),
  // Meeting/Zoom fields
  meetingUrl: text("meetingUrl"),
  meetingDate: timestamp("meetingDate"),
  meetingPlatform: varchar("meetingPlatform", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
// ─── Referral Messages ────────────────────────────────────────────────────────
export const referralMessages = mysqlTable("referralMessages", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  emoji: varchar("emoji", { length: 10 }),
  subtitle: varchar("subtitle", { length: 200 }),
  content: text("content").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ReferralMessage = typeof referralMessages.$inferSelect;
export type InsertReferralMessage = typeof referralMessages.$inferInsert;

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
  // 에어드랍 섯션 확장 필드
  projectName: varchar("projectName", { length: 100 }),
  imageUrl: varchar("imageUrl", { length: 500 }),
  participateUrl: varchar("participateUrl", { length: 500 }),
  isHot: boolean("isHot").default(false).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
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

// ─── Telegram Schedules (예약 발송) ──────────────────────────────────────────────────────────────────────────────────
export const telegramSchedules = mysqlTable("telegramSchedules", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  channelChatId: varchar("channelChatId", { length: 100 }),
  filter: json("filter"),                                   // { hasInvestment, hasNode, kycApproved }
  cronExpression: varchar("cronExpression", { length: 100 }).notNull(), // e.g. "0 9 * * 1" (every Mon 9am)
  timezone: varchar("timezone", { length: 50 }).default("Asia/Seoul").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  lastRunAt: timestamp("lastRunAt"),
  lastResult: json("lastResult"),                           // { successCount, failCount, total }
  nextRunAt: timestamp("nextRunAt"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type TelegramSchedule = typeof telegramSchedules.$inferSelect;
export type InsertTelegramSchedule = typeof telegramSchedules.$inferInsert;

// ─── User Favorites (즐겨찾기) ────────────────────────────────────────────────
export const userFavorites = mysqlTable("userFavorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  planId: int("planId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type UserFavorite = typeof userFavorites.$inferSelect;
export type InsertUserFavorite = typeof userFavorites.$inferInsert;


// ─── Media Assets (관리자 이미지 업로드) ──────────────────────────────────────
export const mediaAssets = mysqlTable("mediaAssets", {
  id: int("id").autoincrement().primaryKey(),
  filename: varchar("filename", { length: 255 }).notNull(),
  url: varchar("url", { length: 1000 }).notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  mimeType: varchar("mimeType", { length: 100 }),
  size: int("size"),
  uploadedBy: int("uploadedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type MediaAsset = typeof mediaAssets.$inferSelect;
export type InsertMediaAsset = typeof mediaAssets.$inferInsert;

// ─── Trending Alert Settings (급등 토큰 알림 설정) ────────────────────────────
export const trendingAlertSettings = mysqlTable("trendingAlertSettings", {
  id: int("id").autoincrement().primaryKey(),
  isEnabled: boolean("isEnabled").default(false).notNull(),
  // 알림 조건
  priceChangeThreshold: decimal("priceChangeThreshold", { precision: 5, scale: 2 }).default("10.00").notNull(), // 기본 10% 이상
  intervalMinutes: int("intervalMinutes").default(60).notNull(), // 체크 주기 (분)
  // 발송 대상
  channelChatId: varchar("channelChatId", { length: 100 }),
  sendToDm: boolean("sendToDm").default(false).notNull(), // 개별 DM 발송 여부
  filterHasInvestment: boolean("filterHasInvestment").default(false).notNull(),
  // 메시지 템플릿
  messageTemplate: text("messageTemplate"), // null이면 기본 템플릿 사용
  // 실행 기록
  lastRunAt: timestamp("lastRunAt"),
  lastResult: json("lastResult"),
  nextRunAt: timestamp("nextRunAt"),
  // 중복 알림 방지: 이미 알림 보낸 토큰 목록
  lastAlertedTokens: json("lastAlertedTokens"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type TrendingAlertSetting = typeof trendingAlertSettings.$inferSelect;
export type InsertTrendingAlertSetting = typeof trendingAlertSettings.$inferInsert;

// ─── Listing Requests (프로젝트 리스팅 신청) ─────────────────────────────────
export const listingRequests = mysqlTable("listingRequests", {
  id: int("id").autoincrement().primaryKey(),
  projectName: varchar("projectName", { length: 100 }).notNull(),
  projectSymbol: varchar("projectSymbol", { length: 20 }),
  projectWebsite: varchar("projectWebsite", { length: 255 }),
  projectDescription: text("projectDescription"),
  category: mysqlEnum("category", ["golden", "self", "leader", "meme", "influencer", "cbag", "airdrop", "partner"]).notNull(),
  contactName: varchar("contactName", { length: 100 }).notNull(),
  contactEmail: varchar("contactEmail", { length: 255 }).notNull(),
  contactTelegram: varchar("contactTelegram", { length: 100 }),
  logoUrl: text("logoUrl"),
  whitepaperUrl: text("whitepaperUrl"),
  telegramUrl: text("telegramUrl"),
  twitterUrl: text("twitterUrl"),
  additionalInfo: text("additionalInfo"),
  status: mysqlEnum("status", ["pending", "reviewing", "approved", "rejected"]).default("pending").notNull(),
  adminNote: text("adminNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ListingRequest = typeof listingRequests.$inferSelect;
export type InsertListingRequest = typeof listingRequests.$inferInsert;

// ─── Partners (핵심 파트너) ───────────────────────────────────────────────────
export const partners = mysqlTable("partners", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  logoUrl: text("logoUrl"),
  website: varchar("website", { length: 255 }),
  description: text("description"),
  category: varchar("category", { length: 50 }),
  isHidden: boolean("isHidden").default(false).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Partner = typeof partners.$inferSelect;
export type InsertPartner = typeof partners.$inferInsert;

