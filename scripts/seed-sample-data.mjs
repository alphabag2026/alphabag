import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// ─── 파트너 샘플 데이터 ───────────────────────────────────────────────────────
const partners = [
  { name: "Binance", category: "exchange", logoUrl: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png", website: "https://binance.com", description: "세계 최대 암호화폐 거래소", sortOrder: 1 },
  { name: "OKX", category: "exchange", logoUrl: "https://cryptologos.cc/logos/okb-okb-logo.png", website: "https://okx.com", description: "글로벌 디지털 자산 거래소", sortOrder: 2 },
  { name: "Uniswap", category: "defi", logoUrl: "https://cryptologos.cc/logos/uniswap-uni-logo.png", website: "https://uniswap.org", description: "선도적인 탈중앙화 거래소", sortOrder: 3 },
  { name: "Aave", category: "defi", logoUrl: "https://cryptologos.cc/logos/aave-aave-logo.png", website: "https://aave.com", description: "DeFi 대출 프로토콜", sortOrder: 4 },
  { name: "Chainlink", category: "infrastructure", logoUrl: "https://cryptologos.cc/logos/chainlink-link-logo.png", website: "https://chain.link", description: "블록체인 오라클 네트워크", sortOrder: 5 },
  { name: "Polygon", category: "infrastructure", logoUrl: "https://cryptologos.cc/logos/polygon-matic-logo.png", website: "https://polygon.technology", description: "이더리움 레이어2 솔루션", sortOrder: 6 },
  { name: "OpenSea", category: "nft", logoUrl: "https://storage.googleapis.com/opensea-static/Logomark/Logomark-Blue.png", website: "https://opensea.io", description: "세계 최대 NFT 마켓플레이스", sortOrder: 7 },
  { name: "CoinGecko", category: "media", logoUrl: "https://static.coingecko.com/s/coingecko-logo-8903d34ce19ca4be1c81f0db30e924154750d2fad96fefc8ca75651e4b8a0b3.png", website: "https://coingecko.com", description: "암호화폐 데이터 분석 플랫폼", sortOrder: 8 },
];

for (const p of partners) {
  await conn.execute(
    "INSERT IGNORE INTO partners (name, category, logoUrl, website, description, sortOrder, isHidden, createdAt) VALUES (?, ?, ?, ?, ?, ?, 0, ?)",
    [p.name, p.category, p.logoUrl, p.website, p.description, p.sortOrder, Date.now()]
  );
}
console.log("✅ 파트너 샘플 데이터 삽입 완료");

// ─── C-BAG 플랜 샘플 데이터 ───────────────────────────────────────────────────
const cbagPlans = [
  {
    name: "C-BAG Alpha Portfolio",
    description: "BTC/ETH/BNB 멀티에셋 분산 투자 전략. 시장 변동성에 강한 포트폴리오 구성.",
    category: "cbag",
    strategyType: "Balanced",
    tags: JSON.stringify(["Multi-Asset", "Auto Rebalance", "DAILY"]),
    ratio: "40% 30% 30%",
    dailyReturnMin: 0.6,
    dailyReturnMax: 1.4,
    currentDailyReturn: 1.05,
    recommendedAmount: 500,
    rating: 4.5,
    isHot: 1,
    isActive: 1,
    sortOrder: 1,
  },
  {
    name: "C-BAG DeFi Yield",
    description: "DeFi 프로토콜 유동성 공급을 통한 안정적 수익 창출 전략.",
    category: "cbag",
    strategyType: "Yield",
    tags: JSON.stringify(["DeFi", "Liquidity", "Compound"]),
    ratio: "50% 50%",
    dailyReturnMin: 0.4,
    dailyReturnMax: 1.2,
    currentDailyReturn: 0.85,
    recommendedAmount: 300,
    rating: 4.2,
    isHot: 0,
    isActive: 1,
    sortOrder: 2,
  },
  {
    name: "C-BAG Futures Pro",
    description: "AI 기반 선물 거래 전략. 롱/숏 포지션을 통한 양방향 수익 추구.",
    category: "cbag",
    strategyType: "Structured",
    tags: JSON.stringify(["Futures", "AI Strategy", "Hedge"]),
    ratio: "60% 40%",
    dailyReturnMin: 0.8,
    dailyReturnMax: 2.0,
    currentDailyReturn: 1.35,
    recommendedAmount: 1000,
    rating: 4.0,
    isHot: 1,
    isActive: 1,
    sortOrder: 3,
  },
];

for (const p of cbagPlans) {
  const existing = await conn.execute("SELECT id FROM investmentPlans WHERE name = ? AND planType = 'investment'", [p.name]);
  if (existing[0].length === 0) {
    await conn.execute(
      `INSERT INTO investmentPlans (name, description, strategy, tags, ratioInfo, yieldInfo, dailyRate, recommendedAmount, rating, isHighlight, isActive, isHidden, sortOrder, planType, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, 'investment', ?, ?)`,
      [p.name, p.description, p.strategyType, p.tags, p.ratio, `Daily: ${p.dailyReturnMin}% ~ ${p.dailyReturnMax}%`, p.currentDailyReturn, p.recommendedAmount, p.rating, p.isHot, p.sortOrder, new Date(), new Date()]
    );
  }
}
console.log("✅ C-BAG 플랜 샘플 데이터 삽입 완료");

// ─── 에어드랍 샘플 데이터 ─────────────────────────────────────────────────────
const airdrops = [
  {
    title: "AlphaDAO 에어드랍",
    description: "AlphaDAO 거버넌스 토큰 에어드랍. 스냅샷 기준 보유량에 따라 $ADAO 토큰 배분.",
    projectName: "AlphaDAO",
    imageUrl: "https://via.placeholder.com/400x200/6366f1/ffffff?text=AlphaDAO+Airdrop",
    participateUrl: "https://alphadao.io/airdrop",
    totalAmount: 1000000,
    perUserAmount: 500,
    requirements: "AlphaBag 플랫폼 이용자 대상",
    startDate: Date.now(),
    endDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
    status: "active",
    isHot: 1,
    sortOrder: 1,
  },
  {
    title: "LOOMX 커뮤니티 에어드랍",
    description: "LOOMX 생태계 확장을 위한 커뮤니티 에어드랍. 텔레그램 참여자 우선 배분.",
    projectName: "LOOMX",
    imageUrl: "https://via.placeholder.com/400x200/f59e0b/ffffff?text=LOOMX+Airdrop",
    participateUrl: "https://loomx.io/airdrop",
    totalAmount: 500000,
    perUserAmount: 250,
    requirements: "텔레그램 채널 참여 필수",
    startDate: Date.now(),
    endDate: Date.now() + 14 * 24 * 60 * 60 * 1000,
    status: "active",
    isHot: 1,
    sortOrder: 2,
  },
  {
    title: "CodexField NFT 에어드랍",
    description: "CodexField 플랫폼 출시 기념 NFT 에어드랍. 한정 수량 1,000개.",
    projectName: "CodexField",
    imageUrl: "https://via.placeholder.com/400x200/8b5cf6/ffffff?text=CodexField+NFT",
    participateUrl: "https://codexfield.io/nft-drop",
    totalAmount: 1000,
    perUserAmount: 1,
    requirements: "AlphaBag 회원 가입 후 KYC 완료",
    startDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
    endDate: Date.now() + 21 * 24 * 60 * 60 * 1000,
    status: "active",
    isHot: 0,
    sortOrder: 3,
  },
];

for (const a of airdrops) {
  const existing = await conn.execute("SELECT id FROM airdrops WHERE name = ?", [a.title]);
  if (existing[0].length === 0) {
    await conn.execute(
      `INSERT INTO airdrops (name, description, tokenSymbol, totalAmount, perUserAmount, requirements, startDate, endDate, status, projectName, imageUrl, participateUrl, isHot, sortOrder, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [a.title, a.description, 'ALPHA', a.totalAmount, a.perUserAmount, JSON.stringify([a.requirements]), new Date(a.startDate), new Date(a.endDate), a.status, a.projectName, a.imageUrl, a.participateUrl, a.isHot, a.sortOrder, new Date(), new Date()]
    );
  }
}
console.log("✅ 에어드랍 샘플 데이터 삽입 완료");

await conn.end();
console.log("🎉 모든 샘플 데이터 삽입 완료!");
