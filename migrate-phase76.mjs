import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const sqls = [
  `CREATE TABLE IF NOT EXISTS \`newsItems\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`title\` varchar(300) NOT NULL,
    \`titleKo\` varchar(300),
    \`titleEn\` varchar(300),
    \`titleZh\` varchar(300),
    \`url\` varchar(1000),
    \`category\` varchar(50) DEFAULT 'notice',
    \`imageUrl\` varchar(1000),
    \`isActive\` boolean NOT NULL DEFAULT true,
    \`sortOrder\` int NOT NULL DEFAULT 0,
    \`publishedAt\` timestamp NOT NULL DEFAULT (now()),
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`newsItems_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`liveStreams\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`title\` varchar(300) NOT NULL,
    \`description\` text,
    \`streamUrl\` varchar(1000),
    \`thumbnailUrl\` varchar(1000),
    \`isLive\` boolean NOT NULL DEFAULT false,
    \`scheduledAt\` timestamp NULL,
    \`endedAt\` timestamp NULL,
    \`viewerCount\` int NOT NULL DEFAULT 0,
    \`isActive\` boolean NOT NULL DEFAULT true,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`liveStreams_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`events\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`type\` enum('meetup','expo','conference','webinar') NOT NULL DEFAULT 'meetup',
    \`title\` varchar(300) NOT NULL,
    \`titleKo\` varchar(300),
    \`description\` text,
    \`location\` varchar(300),
    \`onlineUrl\` varchar(1000),
    \`imageUrl\` varchar(1000),
    \`bannerUrl\` varchar(1000),
    \`registrationUrl\` varchar(1000),
    \`startAt\` timestamp NOT NULL DEFAULT (now()),
    \`endAt\` timestamp NULL,
    \`isActive\` boolean NOT NULL DEFAULT true,
    \`isFeatured\` boolean NOT NULL DEFAULT false,
    \`sortOrder\` int NOT NULL DEFAULT 0,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`events_id\` PRIMARY KEY(\`id\`)
  )`,
];

for (const sql of sqls) {
  try {
    await conn.execute(sql);
    const tableName = sql.match(/CREATE TABLE IF NOT EXISTS `(\w+)`/)?.[1];
    console.log(`✅ ${tableName} 테이블 생성 완료`);
  } catch (e) {
    console.error("❌ 오류:", e.message);
  }
}

await conn.end();
console.log("마이그레이션 완료");
