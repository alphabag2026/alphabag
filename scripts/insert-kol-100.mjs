import mysql from 'mysql2/promise';

// 기존 27명 handle 목록 (중복 제거용)
const existingHandles = new Set([
  'cz_binance', 'haileycrypto', 'VitalikButerin', 'elonmusk', 'CryptoHayes',
  'blknoiz06', 'AndreCronjeTech', 'haydenzadams', 'StaniKulechov', 'RuneKek',
  'kaiynne', 'beeple', 'saylor', 'garyvee', 'brian_armstrong', 'pranksy_nft',
  'APompliano', 'gmoneyNFT', 'RaoulGMI', 'adam3us', 'punk6529', 'stablekwon',
  'MustStopMurad', 'cobie', 'PeterLBrandt', 'woonomic', 'ToneVays'
].map(h => h.toLowerCase()));

// 추가할 KOL 73명 데이터 (기존 27명 제외)
const newKOLs = [
  // === 암호화폐 핵심 인물 ===
  { name: 'Donald Trump', handle: 'realDonaldTrump', category: 'crypto', followerCount: '97M', description: '미국 제45·47대 대통령. 친크립토 정책 추진, 비트코인 전략적 비축 지지', estimatedDailyTweets: 15, alertOnNewPost: true, priority: 'high' },
  { name: 'Changpeng Zhao (New)', handle: 'binance', category: 'crypto', followerCount: '11M', description: 'Binance 공식 계정. 거래소 공지 및 시장 동향', estimatedDailyTweets: 5, alertOnNewPost: false, priority: 'medium' },
  { name: 'Justin Sun', handle: 'justinsuntron', category: 'crypto', followerCount: '3.2M', description: 'TRON 창업자, HTX(Huobi) 고문. 중국계 주요 크립토 인플루언서', estimatedDailyTweets: 8, alertOnNewPost: false, priority: 'medium' },
  { name: 'Sam Bankman-Fried', handle: 'SBF_FTX', category: 'crypto', followerCount: '1M', description: '전 FTX CEO. 크립토 역사적 인물', estimatedDailyTweets: 2, alertOnNewPost: false, priority: 'low' },
  { name: 'Anatoly Yakovenko', handle: 'aeyakovenko', category: 'crypto', followerCount: '500K', description: 'Solana 공동 창업자. SOL 생태계 핵심 인물', estimatedDailyTweets: 5, alertOnNewPost: false, priority: 'medium' },
  { name: 'Gavin Wood', handle: 'gavofyork', category: 'defi', followerCount: '700K', description: 'Polkadot 창업자, 이더리움 공동 창업자. Web3 선구자', estimatedDailyTweets: 3, alertOnNewPost: false, priority: 'medium' },
  { name: 'Charles Hoskinson', handle: 'IOHK_Charles', category: 'crypto', followerCount: '1.2M', description: 'Cardano(ADA) 창업자. 이더리움 공동 창업자 출신', estimatedDailyTweets: 6, alertOnNewPost: false, priority: 'medium' },
  { name: 'Sergey Nazarov', handle: 'SergeyNazarov', category: 'defi', followerCount: '400K', description: 'Chainlink 공동 창업자. 오라클 인프라 선구자', estimatedDailyTweets: 3, alertOnNewPost: false, priority: 'medium' },
  { name: 'Dan Larimer', handle: 'bytemaster7', category: 'crypto', followerCount: '300K', description: 'EOS, Steemit, BitShares 창업자. 블록체인 개척자', estimatedDailyTweets: 3, alertOnNewPost: false, priority: 'low' },
  { name: 'Roger Ver', handle: 'rogerkver', category: 'crypto', followerCount: '700K', description: '"Bitcoin Jesus". BCH(비트코인캐시) 지지자', estimatedDailyTweets: 5, alertOnNewPost: false, priority: 'low' },

  // === 트레이딩/분석 전문가 ===
  { name: 'PlanB', handle: '100trillionUSD', category: 'trading', followerCount: '1.8M', description: 'Stock-to-Flow 모델 창시자. 비트코인 가격 예측 분석가', estimatedDailyTweets: 4, alertOnNewPost: false, priority: 'high' },
  { name: 'Benjamin Cowen', handle: 'intocryptoverse', category: 'trading', followerCount: '800K', description: 'Into The Cryptoverse 운영. 온체인 데이터 분석가', estimatedDailyTweets: 3, alertOnNewPost: false, priority: 'medium' },
  { name: 'Scott Melker', handle: 'scottmelker', category: 'trading', followerCount: '600K', description: '"The Wolf Of All Streets". 크립토 트레이더 및 팟캐스터', estimatedDailyTweets: 6, alertOnNewPost: false, priority: 'medium' },
  { name: 'Michaël van de Poppe', handle: 'CryptoMichNL', category: 'trading', followerCount: '700K', description: '알트코인 트레이딩 전문가. 시장 분석 및 교육', estimatedDailyTweets: 8, alertOnNewPost: false, priority: 'medium' },
  { name: 'Credible Crypto', handle: 'CredibleCrypto', category: 'trading', followerCount: '400K', description: '엘리엇 파동 이론 기반 크립토 분석가', estimatedDailyTweets: 5, alertOnNewPost: false, priority: 'medium' },
  { name: 'Crypto Rover', handle: 'rovercrc', category: 'trading', followerCount: '500K', description: '크립토 시장 분석 및 뉴스 큐레이터', estimatedDailyTweets: 10, alertOnNewPost: false, priority: 'medium' },
  { name: 'Lark Davis', handle: 'TheCryptoLark', category: 'trading', followerCount: '500K', description: '크립토 교육 유튜버 및 분석가', estimatedDailyTweets: 5, alertOnNewPost: false, priority: 'low' },
  { name: 'Crypto Kaleo', handle: 'CryptoKaleo', category: 'trading', followerCount: '600K', description: '크립토 차트 분석 전문가. 장기 사이클 예측', estimatedDailyTweets: 4, alertOnNewPost: false, priority: 'medium' },
  { name: 'DonAlt', handle: 'CryptoDonAlt', category: 'trading', followerCount: '400K', description: '크립토 트레이더. 기술적 분석 전문가', estimatedDailyTweets: 5, alertOnNewPost: false, priority: 'low' },
  { name: 'Pentoshi', handle: 'Pentosh1', category: 'trading', followerCount: '400K', description: '크립토 트레이더. 알트코인 분석 전문가', estimatedDailyTweets: 6, alertOnNewPost: false, priority: 'low' },

  // === DeFi/Web3 빌더 ===
  { name: 'Balaji Srinivasan', category: 'crypto', handle: 'balajis', followerCount: '1M', description: '전 Coinbase CTO, a16z 파트너. 크립토 사상가', estimatedDailyTweets: 5, alertOnNewPost: false, priority: 'medium' },
  { name: 'Nic Carter', handle: 'nic__carter', category: 'crypto', followerCount: '400K', description: 'Castle Island Ventures 파트너. 비트코인 연구자', estimatedDailyTweets: 5, alertOnNewPost: false, priority: 'medium' },
  { name: 'Lyn Alden', handle: 'LynAldenContact', category: 'trading', followerCount: '600K', description: '거시경제 투자 분석가. 비트코인 지지자', estimatedDailyTweets: 3, alertOnNewPost: false, priority: 'medium' },
  { name: 'Alex Gladstein', handle: 'gladstein', category: 'crypto', followerCount: '200K', description: 'HRF CSO. 비트코인과 인권 옹호자', estimatedDailyTweets: 3, alertOnNewPost: false, priority: 'low' },
  { name: 'Saifedean Ammous', handle: 'saifedean', category: 'crypto', followerCount: '500K', description: '"Bitcoin Standard" 저자. 비트코인 경제학자', estimatedDailyTweets: 4, alertOnNewPost: false, priority: 'medium' },
  { name: 'Parker Lewis', handle: 'parkeralewis', category: 'crypto', followerCount: '200K', description: '"Gradually, Then Suddenly" 저자. 비트코인 교육자', estimatedDailyTweets: 2, alertOnNewPost: false, priority: 'low' },
  { name: 'Udi Wertheimer', handle: 'udiWertheimer', category: 'crypto', followerCount: '200K', description: '비트코인 개발자. Ordinals/BRC-20 초기 지지자', estimatedDailyTweets: 5, alertOnNewPost: false, priority: 'low' },
  { name: 'Eric Wall', handle: 'ercwl', category: 'crypto', followerCount: '200K', description: '크립토 연구자. 비트코인 및 이더리움 분석', estimatedDailyTweets: 4, alertOnNewPost: false, priority: 'low' },

  // === 기관/금융 인물 ===
  { name: 'Larry Fink', handle: 'BlackRock', category: 'finance', followerCount: '5M', description: 'BlackRock CEO. 비트코인 ETF 승인 핵심 인물', estimatedDailyTweets: 2, alertOnNewPost: true, priority: 'high' },
  { name: 'Cathie Wood', handle: 'CathieDWood', category: 'finance', followerCount: '1.5M', description: 'ARK Invest CEO. 비트코인 강세론자, 혁신 투자자', estimatedDailyTweets: 3, alertOnNewPost: true, priority: 'high' },
  { name: 'Paul Tudor Jones', handle: 'ptj_official', category: 'finance', followerCount: '300K', description: '헤지펀드 전설. 비트코인을 인플레이션 헤지로 지지', estimatedDailyTweets: 1, alertOnNewPost: false, priority: 'medium' },
  { name: 'Ray Dalio', handle: 'RayDalio', category: 'finance', followerCount: '2M', description: 'Bridgewater Associates 창업자. 거시경제 전문가', estimatedDailyTweets: 2, alertOnNewPost: false, priority: 'medium' },
  { name: 'Nayib Bukele', handle: 'nayibbukele', category: 'crypto', followerCount: '6M', description: '엘살바도르 대통령. 비트코인 법정화폐 채택 국가 수반', estimatedDailyTweets: 5, alertOnNewPost: true, priority: 'high' },
  { name: 'Robert Kiyosaki', handle: 'theRealKiyosaki', category: 'finance', followerCount: '2M', description: '"Rich Dad Poor Dad" 저자. 비트코인 및 금 지지자', estimatedDailyTweets: 4, alertOnNewPost: false, priority: 'medium' },
  { name: 'Mark Cuban', handle: 'mcuban', category: 'crypto', followerCount: '9M', description: 'Shark Tank 투자자. DeFi 및 NFT 지지자', estimatedDailyTweets: 5, alertOnNewPost: false, priority: 'medium' },
  { name: 'Tim Draper', handle: 'TimDraper', category: 'crypto', followerCount: '400K', description: 'Draper Associates 창업자. 비트코인 강세론자', estimatedDailyTweets: 3, alertOnNewPost: false, priority: 'medium' },

  // === 미디어/교육 인플루언서 ===
  { name: 'Andreas Antonopoulos', handle: 'aantonop', category: 'crypto', followerCount: '700K', description: '"Mastering Bitcoin" 저자. 비트코인 교육자', estimatedDailyTweets: 3, alertOnNewPost: false, priority: 'medium' },
  { name: 'Ivan on Tech', handle: 'IvanOnTech', category: 'crypto', followerCount: '400K', description: '크립토 교육 유튜버. 블록체인 개발 강의', estimatedDailyTweets: 4, alertOnNewPost: false, priority: 'low' },
  { name: 'Coin Bureau', handle: 'coinbureau', category: 'crypto', followerCount: '700K', description: '크립토 교육 채널. 공정한 코인 분석으로 유명', estimatedDailyTweets: 3, alertOnNewPost: false, priority: 'medium' },
  { name: 'DataDash', handle: 'Nicholas_Merten', category: 'trading', followerCount: '300K', description: '크립토 분석 유튜버. 시장 사이클 분석', estimatedDailyTweets: 3, alertOnNewPost: false, priority: 'low' },
  { name: 'Altcoin Daily', handle: 'AltcoinDailyio', category: 'crypto', followerCount: '400K', description: '알트코인 뉴스 및 분석. 일일 크립토 업데이트', estimatedDailyTweets: 5, alertOnNewPost: false, priority: 'low' },
  { name: 'Crypto Banter', handle: 'crypto_banter', category: 'crypto', followerCount: '300K', description: '크립토 라이브 방송 및 시장 분석', estimatedDailyTweets: 8, alertOnNewPost: false, priority: 'low' },

  // === NFT/메타버스 ===
  { name: 'Yuga Labs', handle: 'yugalabs', category: 'nft', followerCount: '500K', description: 'BAYC(Bored Ape Yacht Club) 창업사. NFT 최대 브랜드', estimatedDailyTweets: 3, alertOnNewPost: false, priority: 'medium' },
  { name: 'Dingaling', handle: 'dingalingts', category: 'nft', followerCount: '200K', description: 'NFT 대형 컬렉터. 크립토 아트 시장 영향력자', estimatedDailyTweets: 4, alertOnNewPost: false, priority: 'low' },
  { name: 'Zeneca', handle: 'Zeneca_33', category: 'nft', followerCount: '200K', description: 'NFT 교육자 및 컬렉터. Web3 커뮤니티 빌더', estimatedDailyTweets: 4, alertOnNewPost: false, priority: 'low' },
  { name: 'Farokh', handle: 'farokh', category: 'nft', followerCount: '200K', description: 'NFT 인플루언서. Rug Radio 창업자', estimatedDailyTweets: 5, alertOnNewPost: false, priority: 'low' },

  // === 거시경제/전통 금융 ===
  { name: 'Jim Cramer', handle: 'jimcramer', category: 'finance', followerCount: '2M', description: 'Mad Money 진행자. 역지표로 유명한 금융 방송인', estimatedDailyTweets: 10, alertOnNewPost: false, priority: 'medium' },
  { name: 'Warren Buffett', handle: 'WarrenBuffett', category: 'finance', followerCount: '3M', description: 'Berkshire Hathaway CEO. 비트코인 회의론자이나 시장 영향력 막대', estimatedDailyTweets: 1, alertOnNewPost: false, priority: 'medium' },
  { name: 'Peter Schiff', handle: 'PeterSchiff', category: 'finance', followerCount: '1M', description: '금 지지자. 비트코인 강력 비판가. 역지표', estimatedDailyTweets: 8, alertOnNewPost: false, priority: 'medium' },
  { name: 'Nouriel Roubini', handle: 'Nouriel', category: 'finance', followerCount: '500K', description: '"Dr. Doom". 크립토 강력 비판가. 역지표', estimatedDailyTweets: 5, alertOnNewPost: false, priority: 'low' },
  { name: 'Stanley Druckenmiller', handle: 'StanDruckenmiller', category: 'finance', followerCount: '200K', description: '전설적 헤지펀드 매니저. 비트코인 지지 발언', estimatedDailyTweets: 1, alertOnNewPost: false, priority: 'medium' },

  // === 아시아 크립토 인플루언서 ===
  { name: 'Dovey Wan', handle: 'DoveyWan', category: 'crypto', followerCount: '300K', description: 'Primitive Crypto 창업자. 중국 크립토 시장 전문가', estimatedDailyTweets: 4, alertOnNewPost: false, priority: 'medium' },
  { name: 'Mia Hoffman', handle: 'MiaHoffman_', category: 'crypto', followerCount: '200K', description: '아시아 크립토 인플루언서. Web3 교육자', estimatedDailyTweets: 3, alertOnNewPost: false, priority: 'low' },
  { name: 'Ran Neuner', handle: 'cryptomanran', category: 'crypto', followerCount: '500K', description: 'CNBC Crypto Trader 진행자. 남아공 크립토 인플루언서', estimatedDailyTweets: 6, alertOnNewPost: false, priority: 'medium' },
  { name: 'Crypto Dog', handle: 'TheCryptoDog', category: 'trading', followerCount: '300K', description: '크립토 트레이더. 알트코인 분석 전문가', estimatedDailyTweets: 5, alertOnNewPost: false, priority: 'low' },

  // === 프로토콜/프로젝트 창업자 ===
  { name: 'Sam Altman', handle: 'sama', category: 'crypto', followerCount: '2M', description: 'OpenAI CEO, Worldcoin 공동 창업자. AI+크립토 교차점', estimatedDailyTweets: 3, alertOnNewPost: true, priority: 'high' },
  { name: 'Chris Dixon', handle: 'cdixon', category: 'crypto', followerCount: '600K', description: 'a16z 크립토 파트너. Web3 투자 선구자', estimatedDailyTweets: 3, alertOnNewPost: false, priority: 'medium' },
  { name: 'Naval Ravikant', handle: 'naval', category: 'crypto', followerCount: '2M', description: 'AngelList 창업자. 크립토 철학자', estimatedDailyTweets: 2, alertOnNewPost: false, priority: 'medium' },
  { name: 'Tyler Winklevoss', handle: 'tyler', category: 'crypto', followerCount: '400K', description: 'Gemini 공동 창업자. 비트코인 초기 투자자', estimatedDailyTweets: 3, alertOnNewPost: false, priority: 'medium' },
  { name: 'Cameron Winklevoss', handle: 'cameron', category: 'crypto', followerCount: '400K', description: 'Gemini 공동 창업자. 비트코인 강세론자', estimatedDailyTweets: 3, alertOnNewPost: false, priority: 'medium' },
  { name: 'Jesse Powell', handle: 'jespow', category: 'crypto', followerCount: '200K', description: 'Kraken 창업자. 크립토 자유주의자', estimatedDailyTweets: 3, alertOnNewPost: false, priority: 'low' },
  { name: 'Barry Silbert', handle: 'barrysilbert', category: 'crypto', followerCount: '300K', description: 'Digital Currency Group(DCG) 창업자. GBTC 운영사', estimatedDailyTweets: 2, alertOnNewPost: false, priority: 'medium' },
  { name: 'Mike Novogratz', handle: 'novogratz', category: 'crypto', followerCount: '600K', description: 'Galaxy Digital CEO. 전 헤지펀드 매니저, 크립토 강세론자', estimatedDailyTweets: 4, alertOnNewPost: false, priority: 'medium' },

  // === 이더리움 생태계 ===
  { name: 'Ryan Sean Adams', handle: 'RyanSAdams', category: 'defi', followerCount: '300K', description: 'Bankless 공동 창업자. 이더리움 강세론자', estimatedDailyTweets: 5, alertOnNewPost: false, priority: 'medium' },
  { name: 'David Hoffman', handle: 'TrustlessState', category: 'defi', followerCount: '200K', description: 'Bankless 공동 창업자. ETH 스테이킹 전문가', estimatedDailyTweets: 4, alertOnNewPost: false, priority: 'low' },
  { name: 'Anthony Sassano', handle: 'sassal0x', category: 'defi', followerCount: '200K', description: 'The Daily Gwei 운영. 이더리움 교육자', estimatedDailyTweets: 5, alertOnNewPost: false, priority: 'low' },
  { name: 'Eric Conner', handle: 'econoar', category: 'defi', followerCount: '100K', description: '이더리움 개발자. EIP 기여자', estimatedDailyTweets: 3, alertOnNewPost: false, priority: 'low' },
  { name: 'Camila Russo', handle: 'CamiRusso', category: 'defi', followerCount: '200K', description: '"The Infinite Machine" 저자. The Defiant 창업자', estimatedDailyTweets: 4, alertOnNewPost: false, priority: 'low' },

  // === 솔라나 생태계 ===
  { name: 'Raj Gokal', handle: 'rajgokal', category: 'crypto', followerCount: '200K', description: 'Solana 공동 창업자. SOL 생태계 빌더', estimatedDailyTweets: 3, alertOnNewPost: false, priority: 'medium' },
  { name: 'Armani Ferrante', handle: 'armaniferrante', category: 'defi', followerCount: '100K', description: 'Anchor Protocol 창업자. Solana DeFi 개척자', estimatedDailyTweets: 3, alertOnNewPost: false, priority: 'low' },

  // === 미디어/뉴스 ===
  { name: 'Laura Shin', handle: 'laurashin', category: 'crypto', followerCount: '300K', description: 'Unchained 팟캐스트 진행자. 크립토 저널리스트', estimatedDailyTweets: 4, alertOnNewPost: false, priority: 'low' },
  { name: 'Nathaniel Whittemore', handle: 'nlw', category: 'crypto', followerCount: '200K', description: 'CoinDesk 팟캐스터. 크립토 거시경제 분석', estimatedDailyTweets: 3, alertOnNewPost: false, priority: 'low' },
  { name: 'CoinDesk', handle: 'CoinDesk', category: 'crypto', followerCount: '2M', description: '크립토 미디어 1위. 실시간 뉴스 및 분석', estimatedDailyTweets: 20, alertOnNewPost: false, priority: 'high' },
  { name: 'Cointelegraph', handle: 'Cointelegraph', category: 'crypto', followerCount: '3M', description: '크립토 미디어 2위. 글로벌 크립토 뉴스', estimatedDailyTweets: 25, alertOnNewPost: false, priority: 'high' },
  { name: 'The Block', handle: 'TheBlock__', category: 'crypto', followerCount: '500K', description: '크립토 리서치 미디어. 심층 분석 전문', estimatedDailyTweets: 15, alertOnNewPost: false, priority: 'medium' },
  { name: 'Decrypt', handle: 'decryptmedia', category: 'crypto', followerCount: '400K', description: '크립토 뉴스 미디어. 교육적 콘텐츠 제공', estimatedDailyTweets: 15, alertOnNewPost: false, priority: 'medium' },

  // === 한국/아시아 특화 ===
  { name: 'Upbit Korea', handle: 'upbitkorea', category: 'crypto', followerCount: '100K', description: '한국 최대 암호화폐 거래소 업비트 공식 계정', estimatedDailyTweets: 5, alertOnNewPost: false, priority: 'medium' },
  { name: 'Bithumb Korea', handle: 'BithumbOfficial', category: 'crypto', followerCount: '100K', description: '한국 주요 암호화폐 거래소 빗썸 공식 계정', estimatedDailyTweets: 5, alertOnNewPost: false, priority: 'medium' },
];

async function insertKOLs() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  // 기존 handle 목록 조회
  const [existing] = await conn.execute('SELECT handle FROM snsInfluencers');
  const existingSet = new Set(existing.map(r => r.handle.toLowerCase()));
  
  let inserted = 0;
  let skipped = 0;
  let sortOrder = 100; // 기존 데이터 이후부터 시작

  for (const kol of newKOLs) {
    if (existingSet.has(kol.handle.toLowerCase())) {
      console.log(`SKIP (exists): ${kol.name} @${kol.handle}`);
      skipped++;
      continue;
    }

    const avatarUrl = `https://unavatar.io/twitter/${kol.handle}`;
    const twitterUrl = `https://twitter.com/${kol.handle}`;
    
    await conn.execute(
      `INSERT INTO snsInfluencers 
        (name, handle, avatarUrl, twitterUrl, description, category, followerCount, 
         autoFetchEnabled, fetchIntervalHours, alertOnNewPost, estimatedDailyTweets,
         isActive, sortOrder, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        kol.name,
        kol.handle,
        avatarUrl,
        twitterUrl,
        kol.description || '',
        kol.category || 'crypto',
        kol.followerCount || '100K',
        kol.autoFetchEnabled ? 1 : 0,
        3, // fetchIntervalHours
        kol.alertOnNewPost ? 1 : 0,
        kol.estimatedDailyTweets || 5,
        1, // isActive
        sortOrder++,
      ]
    );
    console.log(`INSERT: ${kol.name} @${kol.handle} [${kol.category}]`);
    inserted++;
  }

  // 핵심 4명 alertOnNewPost = true, autoFetchEnabled = true 설정
  const coreHandles = ['elonmusk', 'realDonaldTrump', 'cz_binance', 'haileycrypto'];
  for (const h of coreHandles) {
    await conn.execute(
      'UPDATE snsInfluencers SET alertOnNewPost = 1, autoFetchEnabled = 1, fetchIntervalHours = 1 WHERE LOWER(handle) = ?',
      [h.toLowerCase()]
    );
    console.log(`CORE UPDATE: @${h} → alertOnNewPost=true, autoFetch=true, interval=1h`);
  }

  const [cnt] = await conn.execute('SELECT COUNT(*) as c FROM snsInfluencers');
  console.log(`\nDone! Inserted: ${inserted}, Skipped: ${skipped}, Total: ${cnt[0].c}`);
  await conn.end();
}

insertKOLs().catch(console.error);
