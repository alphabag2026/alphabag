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
  qnaNotifyTelegram: boolean("qnaNotifyTelegram").default(true).notNull(),
  qnaNotifyEmail: boolean("qnaNotifyEmail").default(true).notNull(),
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
  isMLM: boolean("isMLM").default(false).notNull(),
  // Extended fields
  videoUrl2: text("videoUrl2"),
  docsUrl2: text("docsUrl2"),
  infoweb4Url: text("infoweb4Url"),
  onepageUrl: text("onepageUrl"),
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
  // AI 자동 번역 컬럼 (21개 언어)
  titleZh: varchar("title_zh", { length: 200 }),
  titleJa: varchar("title_ja", { length: 200 }),
  titleKo: varchar("title_ko", { length: 200 }),
  titleVi: varchar("title_vi", { length: 200 }),
  titleTh: varchar("title_th", { length: 200 }),
  titleId: varchar("title_id", { length: 200 }),
  titleMs: varchar("title_ms", { length: 200 }),
  titleRu: varchar("title_ru", { length: 200 }),
  titleAr: varchar("title_ar", { length: 200 }),
  titleEs: varchar("title_es", { length: 200 }),
  titlePt: varchar("title_pt", { length: 200 }),
  titleFr: varchar("title_fr", { length: 200 }),
  titleDe: varchar("title_de", { length: 200 }),
  titleIt: varchar("title_it", { length: 200 }),
  titleTr: varchar("title_tr", { length: 200 }),
  titleHi: varchar("title_hi", { length: 200 }),
  titlePl: varchar("title_pl", { length: 200 }),
  titleNl: varchar("title_nl", { length: 200 }),
  titleUk: varchar("title_uk", { length: 200 }),
  titleTl: varchar("title_tl", { length: 200 }),
  contentZh: text("content_zh"),
  contentJa: text("content_ja"),
  contentKo: text("content_ko"),
  contentVi: text("content_vi"),
  contentTh: text("content_th"),
  contentId: text("content_id"),
  contentMs: text("content_ms"),
  contentRu: text("content_ru"),
  contentAr: text("content_ar"),
  contentEs: text("content_es"),
  contentPt: text("content_pt"),
  contentFr: text("content_fr"),
  contentDe: text("content_de"),
  contentIt: text("content_it"),
  contentTr: text("content_tr"),
  contentHi: text("content_hi"),
  contentPl: text("content_pl"),
  contentNl: text("content_nl"),
  contentUk: text("content_uk"),
  contentTl: text("content_tl"),
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

// ─── SNS Influencers (SNS 인플루언서) ────────────────────────────────────────
export const snsInfluencers = mysqlTable("snsInfluencers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  handle: varchar("handle", { length: 100 }).notNull(), // @handle
  avatarUrl: text("avatarUrl"),
  twitterUrl: text("twitterUrl"),
  description: text("description"),
  category: varchar("category", { length: 50 }).default("crypto"), // crypto, defi, trading, nft
  followerCount: varchar("followerCount", { length: 30 }), // e.g. "9.2M"
  twitterUserId: varchar("twitterUserId", { length: 50 }), // X API user ID for auto-fetch
  autoFetchEnabled: boolean("autoFetchEnabled").default(false).notNull(),
  fetchIntervalHours: int("fetchIntervalHours").default(3).notNull(), // 수집 주기 (시간)
  alertOnNewPost: boolean("alertOnNewPost").default(false).notNull(), // 신규 트윗 텔레그램 알림
  estimatedDailyTweets: int("estimatedDailyTweets").default(5).notNull(), // 일 평균 트윗 수 (비용 계산용)
  autoTranslate: boolean("autoTranslate").default(false).notNull(), // 새 트윗 수집 시 자동 번역
  autoTranslateLang: varchar("autoTranslateLang", { length: 10 }).default("ko"), // 자동 번역 언어 코드
  lastFetchedAt: timestamp("lastFetchedAt"),
  snsTelegramChatId: varchar("snsTelegramChatId", { length: 64 }), // 텔레그램 채널 ID
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SnsInfluencer = typeof snsInfluencers.$inferSelect;
export type InsertSnsInfluencer = typeof snsInfluencers.$inferInsert;

// ─── SNS Posts (인플루언서 포스트) ────────────────────────────────────────────
export const snsPosts = mysqlTable("snsPosts", {
  id: int("id").autoincrement().primaryKey(),
  influencerId: int("influencerId").notNull(),
  content: text("content").notNull(),
  tweetUrl: text("tweetUrl"),
  tweetId: varchar("tweetId", { length: 50 }),
  likes: int("likes").default(0).notNull(),
  retweets: int("retweets").default(0).notNull(),
  replies: int("replies").default(0).notNull(),
  postedAt: timestamp("postedAt").defaultNow().notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  translatedContent: text("translatedContent"),
  mediaUrls: text("mediaUrls"), // JSON array of image/video URLs
  translatedAt: timestamp("translatedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SnsPost = typeof snsPosts.$inferSelect;
export type InsertSnsPost = typeof snsPosts.$inferInsert;

// ─── Partners (핵심 파트너) ───────────────────────────────────────────────────
export const partners = mysqlTable("partners", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  logoUrl: text("logoUrl"),
  website: varchar("website", { length: 255 }),
  description: text("description"),
  category: varchar("category", { length: 50 }),
  isHidden: boolean("isHidden").default(false).notNull(),
  isMLM: boolean("isMLM").default(false).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Partner = typeof partners.$inferSelect;
export type InsertPartner = typeof partners.$inferInsert;


// ─── Submission Settings (상장 설정) ──────────────────────────────────────────
export const submissionSettings = mysqlTable("submissionSettings", {
  id: int("id").autoincrement().primaryKey(),
  listingFeeUsdt: decimal("listingFeeUsdt", { precision: 18, scale: 2 }).default("500").notNull(),
  votingPeriodDays: int("votingPeriodDays").default(7).notNull(),
  approvalThresholdPct: int("approvalThresholdPct").default(60).notNull(), // 60% 이상 찬성
  platformFeePct: int("platformFeePct").default(40).notNull(), // 알파백 40%
  // 온체인 납부 설정
  paymentWalletAddress: varchar("paymentWalletAddress", { length: 100 }), // USDT 수령 지갑 주소
  paymentNetwork: mysqlEnum("paymentNetwork", ["BSC", "TRC20", "ERC20"]).default("BSC"), // 네트워크
  isActive: boolean("isActive").default(true).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SubmissionSetting = typeof submissionSettings.$inferSelect;

// ─── Plan Submissions (공개 플랜 신청) ────────────────────────────────────────
export const planSubmissions = mysqlTable("planSubmissions", {
  id: int("id").autoincrement().primaryKey(),
  // 신청자 정보
  applicantName: varchar("applicantName", { length: 100 }).notNull(),
  applicantEmail: varchar("applicantEmail", { length: 320 }).notNull(),
  applicantTelegram: varchar("applicantTelegram", { length: 100 }),
  // 인증 상태
  emailVerified: boolean("emailVerified").default(false).notNull(),
  telegramVerified: boolean("telegramVerified").default(false).notNull(),
  // 파일 및 AI 파싱 결과
  fileUrl: text("fileUrl"),
  fileType: varchar("fileType", { length: 20 }), // ppt, pdf, image, text
  parsedPlanData: json("parsedPlanData"), // AI가 파싱한 플랜 데이터
  finalPlanData: json("finalPlanData"),  // 신청자가 수정한 최종 데이터
  // 상장비용
  listingFeeUsdt: decimal("listingFeeUsdt", { precision: 18, scale: 2 }),
  feePaymentTxHash: varchar("feePaymentTxHash", { length: 100 }),
  feePaid: boolean("feePaid").default(false).notNull(),
  // 투표 관련
  votingStartAt: timestamp("votingStartAt"),
  votingEndAt: timestamp("votingEndAt"),
  totalVotes: int("totalVotes").default(0).notNull(),
  approveVotes: int("approveVotes").default(0).notNull(),
  rejectVotes: int("rejectVotes").default(0).notNull(),
  // 상태: draft → verified → fee_paid → voting → approved → rejected → listed
  status: mysqlEnum("status", ["draft", "verified", "fee_paid", "voting", "approved", "rejected", "listed"]).default("draft").notNull(),
  adminNote: text("adminNote"),
  // 등록된 플랜 ID (상장 후)
  listedPlanId: int("listedPlanId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PlanSubmission = typeof planSubmissions.$inferSelect;
export type InsertPlanSubmission = typeof planSubmissions.$inferInsert;

// ─── Submission Verifications (이메일/텔레그램 인증 코드) ──────────────────────
export const submissionVerifications = mysqlTable("submissionVerifications", {
  id: int("id").autoincrement().primaryKey(),
  submissionId: int("submissionId").notNull(),
  type: mysqlEnum("type", ["email", "telegram"]).notNull(),
  target: varchar("target", { length: 320 }).notNull(), // 이메일 주소 또는 텔레그램 핸들
  code: varchar("code", { length: 10 }).notNull(),
  verified: boolean("verified").default(false).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SubmissionVerification = typeof submissionVerifications.$inferSelect;

// ─── Submission Votes (노드 보유자 투표) ──────────────────────────────────────
export const submissionVotes = mysqlTable("submissionVotes", {
  id: int("id").autoincrement().primaryKey(),
  submissionId: int("submissionId").notNull(),
  voterId: int("voterId").notNull(), // users.id (노드 보유자)
  voterWallet: varchar("voterWallet", { length: 100 }),
  vote: mysqlEnum("vote", ["approve", "reject"]).notNull(),
  comment: text("comment"),
  nodeCount: int("nodeCount").default(1).notNull(), // 보유 노드 수 (가중치)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SubmissionVote = typeof submissionVotes.$inferSelect;

// ─── Submission Fee Distributions (상장비용 분배) ─────────────────────────────
export const submissionFeeDistributions = mysqlTable("submissionFeeDistributions", {
  id: int("id").autoincrement().primaryKey(),
  submissionId: int("submissionId").notNull(),
  recipientType: mysqlEnum("recipientType", ["node_voter", "platform"]).notNull(),
  recipientId: int("recipientId"), // users.id (노드 보유자) or null for platform
  recipientWallet: varchar("recipientWallet", { length: 100 }),
  amountUsdt: decimal("amountUsdt", { precision: 18, scale: 6 }).notNull(),
  distributionPct: decimal("distributionPct", { precision: 6, scale: 4 }),
  status: mysqlEnum("status", ["pending", "distributed", "failed"]).default("pending").notNull(),
  txHash: varchar("txHash", { length: 100 }),
  distributedAt: timestamp("distributedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SubmissionFeeDistribution = typeof submissionFeeDistributions.$inferSelect;

// ─── Vote Rewards (투표 보상) ──────────────────────────────────────────────────
export const voteRewards = mysqlTable("voteRewards", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),           // 보상 수령자 (노드 보유자)
  submissionId: int("submissionId").notNull(), // 어떤 신청건 투표 보상인지
  voteId: int("voteId").notNull(),            // submissionVotes.id
  rewardUsdt: decimal("rewardUsdt", { precision: 18, scale: 6 }).notNull(), // 보상 금액 (USDT)
  rewardReason: varchar("rewardReason", { length: 100 }).default("vote_participation"), // 보상 사유
  status: mysqlEnum("status", ["pending", "paid", "cancelled"]).default("pending").notNull(),
  paidAt: timestamp("paidAt"),
  txHash: varchar("txHash", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type VoteReward = typeof voteRewards.$inferSelect;
export type InsertVoteReward = typeof voteRewards.$inferInsert;

// ─── Reward Withdrawals (보상 출금 신청) ──────────────────────────────────────
export const rewardWithdrawals = mysqlTable("rewardWithdrawals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  amountUsdt: decimal("amountUsdt", { precision: 18, scale: 6 }).notNull(), // 출금 신청 금액
  walletAddress: varchar("walletAddress", { length: 100 }).notNull(), // 수령 지갑 주소
  network: mysqlEnum("network", ["BSC", "TRC20", "ERC20"]).default("BSC").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "completed"]).default("pending").notNull(),
  adminNote: text("adminNote"),
  txHash: varchar("txHash", { length: 100 }),
  processedAt: timestamp("processedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type RewardWithdrawal = typeof rewardWithdrawals.$inferSelect;
export type InsertRewardWithdrawal = typeof rewardWithdrawals.$inferInsert;

// ─── FAQ (자주 묻는 질문) ─────────────────────────────────────────────────────
export const faqs = mysqlTable("faqs", {
  id: int("id").autoincrement().primaryKey(),
  question: text("question").notNull(),           // 원문 질문 (영어/한국어)
  answer: text("answer").notNull(),               // 원문 답변
  category: varchar("category", { length: 50 }).default("general"),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  // AI 자동 번역 컬럼 (21개 언어)
  questionZh: text("question_zh"), answerZh: text("answer_zh"),
  questionJa: text("question_ja"), answerJa: text("answer_ja"),
  questionKo: text("question_ko"), answerKo: text("answer_ko"),
  questionVi: text("question_vi"), answerVi: text("answer_vi"),
  questionTh: text("question_th"), answerTh: text("answer_th"),
  questionId: text("question_id"), answerId: text("answer_id"),
  questionMs: text("question_ms"), answerMs: text("answer_ms"),
  questionRu: text("question_ru"), answerRu: text("answer_ru"),
  questionAr: text("question_ar"), answerAr: text("answer_ar"),
  questionEs: text("question_es"), answerEs: text("answer_es"),
  questionPt: text("question_pt"), answerPt: text("answer_pt"),
  questionFr: text("question_fr"), answerFr: text("answer_fr"),
  questionDe: text("question_de"), answerDe: text("answer_de"),
  questionIt: text("question_it"), answerIt: text("answer_it"),
  questionTr: text("question_tr"), answerTr: text("answer_tr"),
  questionHi: text("question_hi"), answerHi: text("answer_hi"),
  questionPl: text("question_pl"), answerPl: text("answer_pl"),
  questionNl: text("question_nl"), answerNl: text("answer_nl"),
  questionUk: text("question_uk"), answerUk: text("answer_uk"),
  questionTl: text("question_tl"), answerTl: text("answer_tl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Faq = typeof faqs.$inferSelect;
export type InsertFaq = typeof faqs.$inferInsert;

// ─── Q&A (질문/답변) ──────────────────────────────────────────────────────────
export const qnaQuestions = mysqlTable("qnaQuestions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),                          // 로그인 사용자 (null=비로그인)
  nickname: varchar("nickname", { length: 50 }),  // 비로그인 시 닉네임
  isPrivate: boolean("isPrivate").default(false).notNull(), // true=1:1비밀방, false=공개방
  category: varchar("category", { length: 50 }).default("general"),
  question: text("question").notNull(),           // 원문 질문
  answer: text("answer"),                         // 관리자 답변 (null=미답변)
  answeredBy: int("answeredBy"),                  // 답변한 관리자 ID
  answeredAt: timestamp("answeredAt"),
  isActive: boolean("isActive").default(true).notNull(),
  // AI 자동 번역 컬럼 (질문+답변, 21개 언어)
  questionZh: text("question_zh"), answerZh: text("answer_zh"),
  questionJa: text("question_ja"), answerJa: text("answer_ja"),
  questionKo: text("question_ko"), answerKo: text("answer_ko"),
  questionVi: text("question_vi"), answerVi: text("answer_vi"),
  questionTh: text("question_th"), answerTh: text("answer_th"),
  questionId: text("question_id"), answerId: text("answer_id"),
  questionMs: text("question_ms"), answerMs: text("answer_ms"),
  questionRu: text("question_ru"), answerRu: text("answer_ru"),
  questionAr: text("question_ar"), answerAr: text("answer_ar"),
  questionEs: text("question_es"), answerEs: text("answer_es"),
  questionPt: text("question_pt"), answerPt: text("answer_pt"),
  questionFr: text("question_fr"), answerFr: text("answer_fr"),
  questionDe: text("question_de"), answerDe: text("answer_de"),
  questionIt: text("question_it"), answerIt: text("answer_it"),
  questionTr: text("question_tr"), answerTr: text("answer_tr"),
  questionHi: text("question_hi"), answerHi: text("answer_hi"),
  questionPl: text("question_pl"), answerPl: text("answer_pl"),
  questionNl: text("question_nl"), answerNl: text("answer_nl"),
  questionUk: text("question_uk"), answerUk: text("answer_uk"),
  questionTl: text("question_tl"), answerTl: text("answer_tl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type QnaQuestion = typeof qnaQuestions.$inferSelect;
export type InsertQnaQuestion = typeof qnaQuestions.$inferInsert;
