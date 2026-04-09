/**
 * KOL 105명 프로필 이미지 URL 업데이트 스크립트
 * Twitter/X 프로필 이미지를 _400x400 버전으로 사용
 * (공개 CDN URL 형식: https://pbs.twimg.com/profile_images/{userId}/{hash}_400x400.jpg)
 * 대안: unavatar.io 서비스 사용 (https://unavatar.io/twitter/{handle})
 */

import mysql from 'mysql2/promise';

const avatarMap = {
  // 정치/경제 리더
  'elonmusk': 'https://unavatar.io/twitter/elonmusk',
  'realDonaldTrump': 'https://unavatar.io/twitter/realDonaldTrump',
  'POTUS': 'https://unavatar.io/twitter/POTUS',
  'JoeBiden': 'https://unavatar.io/twitter/JoeBiden',
  'BarackObama': 'https://unavatar.io/twitter/BarackObama',
  'BillGates': 'https://unavatar.io/twitter/BillGates',
  'JeffBezos': 'https://unavatar.io/twitter/JeffBezos',
  'tim_cook': 'https://unavatar.io/twitter/tim_cook',
  'satyanadella': 'https://unavatar.io/twitter/satyanadella',
  'sundarpichai': 'https://unavatar.io/twitter/sundarpichai',
  'WarrenBuffett': 'https://unavatar.io/twitter/WarrenBuffett',
  'RayDalio': 'https://unavatar.io/twitter/RayDalio',
  'paulkrugman': 'https://unavatar.io/twitter/paulkrugman',
  'nouriel': 'https://unavatar.io/twitter/nouriel',
  'IMFNews': 'https://unavatar.io/twitter/IMFNews',
  'federalreserve': 'https://unavatar.io/twitter/federalreserve',
  'SecYellen': 'https://unavatar.io/twitter/SecYellen',
  'jpmorgan': 'https://unavatar.io/twitter/jpmorgan',
  'GoldmanSachs': 'https://unavatar.io/twitter/GoldmanSachs',
  'BlackRock': 'https://unavatar.io/twitter/BlackRock',
  'Larry_Fink': 'https://unavatar.io/twitter/Larry_Fink',
  'DavidSacks': 'https://unavatar.io/twitter/DavidSacks',
  'balajis': 'https://unavatar.io/twitter/balajis',
  'pmarca': 'https://unavatar.io/twitter/pmarca',
  'naval': 'https://unavatar.io/twitter/naval',
  'paulg': 'https://unavatar.io/twitter/paulg',

  // 암호화폐 핵심 인물
  'cz_binance': 'https://unavatar.io/twitter/cz_binance',
  'SBF_FTX': 'https://unavatar.io/twitter/SBF_FTX',
  'VitalikButerin': 'https://unavatar.io/twitter/VitalikButerin',
  'aantonop': 'https://unavatar.io/twitter/aantonop',
  'adam3us': 'https://unavatar.io/twitter/adam3us',
  'NickSzabo4': 'https://unavatar.io/twitter/NickSzabo4',
  'brian_armstrong': 'https://unavatar.io/twitter/brian_armstrong',
  'tyler': 'https://unavatar.io/twitter/tyler',
  'cameron': 'https://unavatar.io/twitter/cameron',
  'bgarlinghouse': 'https://unavatar.io/twitter/bgarlinghouse',
  'justinsuntron': 'https://unavatar.io/twitter/justinsuntron',
  'gavinandresen': 'https://unavatar.io/twitter/gavinandresen',
  'rogerkver': 'https://unavatar.io/twitter/rogerkver',
  'jespow': 'https://unavatar.io/twitter/jespow',
  'hasufl': 'https://unavatar.io/twitter/hasufl',
  'nic__carter': 'https://unavatar.io/twitter/nic__carter',
  'danheld': 'https://unavatar.io/twitter/danheld',
  'LynAldenContact': 'https://unavatar.io/twitter/LynAldenContact',
  'michael_saylor': 'https://unavatar.io/twitter/michael_saylor',
  'APompliano': 'https://unavatar.io/twitter/APompliano',
  'woonomic': 'https://unavatar.io/twitter/woonomic',
  '100trillionUSD': 'https://unavatar.io/twitter/100trillionUSD',
  'PeterLBrandt': 'https://unavatar.io/twitter/PeterLBrandt',
  'ToneVays': 'https://unavatar.io/twitter/ToneVays',
  'CryptoCobain': 'https://unavatar.io/twitter/CryptoCobain',
  'TheCryptoDog': 'https://unavatar.io/twitter/TheCryptoDog',
  'CryptoKaleo': 'https://unavatar.io/twitter/CryptoKaleo',
  'AltcoinDailyio': 'https://unavatar.io/twitter/AltcoinDailyio',
  'CryptoWendyO': 'https://unavatar.io/twitter/CryptoWendyO',
  'Sheldon_Sniper': 'https://unavatar.io/twitter/Sheldon_Sniper',
  'CryptoBull2020': 'https://unavatar.io/twitter/CryptoBull2020',
  'IvanOnTech': 'https://unavatar.io/twitter/IvanOnTech',
  'DataDash': 'https://unavatar.io/twitter/DataDash',
  'Crypto_Rand': 'https://unavatar.io/twitter/Crypto_Rand',
  'CryptoCred': 'https://unavatar.io/twitter/CryptoCred',
  'BitcoinBroski': 'https://unavatar.io/twitter/BitcoinBroski',
  'CryptoTony__': 'https://unavatar.io/twitter/CryptoTony__',
  'DonAlt': 'https://unavatar.io/twitter/DonAlt',
  'ScottMelker': 'https://unavatar.io/twitter/ScottMelker',
  'cryptobirb': 'https://unavatar.io/twitter/cryptobirb',
  'CredibleCrypto': 'https://unavatar.io/twitter/CredibleCrypto',
  'CryptoMichNL': 'https://unavatar.io/twitter/CryptoMichNL',
  'Pentosh1': 'https://unavatar.io/twitter/Pentosh1',
  'CryptoGodJohn': 'https://unavatar.io/twitter/CryptoGodJohn',
  'CryptoJack': 'https://unavatar.io/twitter/CryptoJack',
  'layah_heilpern': 'https://unavatar.io/twitter/layah_heilpern',
  'CryptoFaibik': 'https://unavatar.io/twitter/CryptoFaibik',
  'CryptoBanter': 'https://unavatar.io/twitter/CryptoBanter',
  'Ran_NeuNer': 'https://unavatar.io/twitter/Ran_NeuNer',
  'CryptoCapo_': 'https://unavatar.io/twitter/CryptoCapo_',
  'altcoin_daily': 'https://unavatar.io/twitter/altcoin_daily',
  'CryptoRover': 'https://unavatar.io/twitter/CryptoRover',
  'CryptoZombie': 'https://unavatar.io/twitter/CryptoZombie',
  'CryptoHustle': 'https://unavatar.io/twitter/CryptoHustle',
  'CryptoLifer': 'https://unavatar.io/twitter/CryptoLifer',
  'CryptoMoonShots': 'https://unavatar.io/twitter/CryptoMoonShots',
  'CryptoNewsFlash': 'https://unavatar.io/twitter/CryptoNewsFlash',
  'CryptoNewss': 'https://unavatar.io/twitter/CryptoNewss',
  'CryptoTrader': 'https://unavatar.io/twitter/CryptoTrader',
  'CryptoWhale': 'https://unavatar.io/twitter/CryptoWhale',
  'CryptoWolf': 'https://unavatar.io/twitter/CryptoWolf',
  'CryptoYoda': 'https://unavatar.io/twitter/CryptoYoda',
  'CryptoZen': 'https://unavatar.io/twitter/CryptoZen',
  'haileycrypto': 'https://unavatar.io/twitter/haileycrypto',
  'coinbureau': 'https://unavatar.io/twitter/coinbureau',
  'Cobie': 'https://unavatar.io/twitter/Cobie',
  'DegenSpartan': 'https://unavatar.io/twitter/DegenSpartan',
  'Tetranode': 'https://unavatar.io/twitter/Tetranode',
  'zhusu': 'https://unavatar.io/twitter/zhusu',
  'kyled116': 'https://unavatar.io/twitter/kyled116',
  'novogratz': 'https://unavatar.io/twitter/novogratz',
  'barrysilbert': 'https://unavatar.io/twitter/barrysilbert',
  'cburniske': 'https://unavatar.io/twitter/cburniske',
  'twobitidiot': 'https://unavatar.io/twitter/twobitidiot',
  'CathieDWood': 'https://unavatar.io/twitter/CathieDWood',
  'RaoulGMI': 'https://unavatar.io/twitter/RaoulGMI',
  'CryptoHayes': 'https://unavatar.io/twitter/CryptoHayes',
  'stablekwon': 'https://unavatar.io/twitter/stablekwon',
  'cmsholdings': 'https://unavatar.io/twitter/cmsholdings',
  'notthreadguy': 'https://unavatar.io/twitter/notthreadguy',
  'inversebrah': 'https://unavatar.io/twitter/inversebrah',
  'CryptoHamster': 'https://unavatar.io/twitter/CryptoHamster',
  'CryptoInsider': 'https://unavatar.io/twitter/CryptoInsider',
  'CryptoKing': 'https://unavatar.io/twitter/CryptoKing',
  'CryptoMaster': 'https://unavatar.io/twitter/CryptoMaster',
  'CryptoNinja': 'https://unavatar.io/twitter/CryptoNinja',
  'CryptoPanda': 'https://unavatar.io/twitter/CryptoPanda',
  'CryptoPhoenix': 'https://unavatar.io/twitter/CryptoPhoenix',
  'CryptoPirate': 'https://unavatar.io/twitter/CryptoPirate',
  'CryptoSage': 'https://unavatar.io/twitter/CryptoSage',
  'CryptoShark': 'https://unavatar.io/twitter/CryptoShark',
  'CryptoTiger': 'https://unavatar.io/twitter/CryptoTiger',
  'CryptoViper': 'https://unavatar.io/twitter/CryptoViper',
};

async function updateAvatars() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  // 모든 인플루언서 조회
  const [rows] = await conn.execute('SELECT id, handle, avatarUrl FROM snsInfluencers');
  
  let updated = 0;
  let skipped = 0;
  
  for (const row of rows) {
    const handle = row.handle;
    // unavatar.io 서비스 사용 - Twitter 핸들로 프로필 이미지 자동 조회
    const avatarUrl = `https://unavatar.io/twitter/${handle}`;
    
    await conn.execute(
      'UPDATE snsInfluencers SET avatarUrl = ? WHERE id = ?',
      [avatarUrl, row.id]
    );
    updated++;
    
    if (updated % 20 === 0) {
      console.log(`Updated ${updated}/${rows.length}...`);
    }
  }
  
  console.log(`\n✅ Done! Updated: ${updated}, Skipped: ${skipped}`);
  await conn.end();
}

updateAvatars().catch(console.error);
