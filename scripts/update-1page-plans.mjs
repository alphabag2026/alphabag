import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

console.log('Connected to DB');

try {
  // 1. NEXUS 2140 삭제 (id: 90003)
  const [del1] = await conn.execute('DELETE FROM investmentPlans WHERE id = 90003');
  console.log('DELETE NEXUS 2140:', del1.affectedRows, 'rows deleted');

  // 2. XPLAY (id: 90001) - self collection
  const [u1] = await conn.execute(
    `UPDATE investmentPlans SET
      logoUrl = ?,
      collectionType = 'self',
      label = 'DeFi / Revenue Platform',
      description = 'DeFi Revenue Analysis Platform - Staking, Gaming, Referral programs',
      tags = ?,
      isActive = 1,
      isHidden = 0,
      onepageUrl = 'https://xplay.1page.to'
    WHERE id = 90001`,
    [
      'https://d2xsxph8kpxj0f.cloudfront.net/310519663373200888/EpEA9QsFSK7L7cGqDuapK6/logo-xplay-hjvxRcUWwXtTna4zA2RmHe.webp',
      '["DeFi","Revenue","Web3"]'
    ]
  );
  console.log('UPDATE XPLAY:', u1.affectedRows);

  // 3. OpenOcto (id: 90002) - node collection
  const [u2] = await conn.execute(
    `UPDATE investmentPlans SET
      logoUrl = ?,
      collectionType = 'node',
      label = 'AI / On-Chain Trading',
      description = 'AI On-Chain Trading Ecosystem - AI DEX & digital finance platform',
      tags = ?,
      isActive = 1,
      isHidden = 0,
      onepageUrl = 'https://openocto.1page.to'
    WHERE id = 90002`,
    [
      'https://d2xsxph8kpxj0f.cloudfront.net/310519663373200888/EpEA9QsFSK7L7cGqDuapK6/logo-openocto-gZfzhbL6efZSYfZ79N97pL.webp',
      '["AI","DEX","Trading"]'
    ]
  );
  console.log('UPDATE OpenOcto:', u2.affectedRows);

  // 4. BENEFER (id: 90004) - self collection
  const [u3] = await conn.execute(
    `UPDATE investmentPlans SET
      logoUrl = ?,
      collectionType = 'self',
      label = 'Web3 / AI DeFi',
      description = 'AI tracking application chain. Token Mixing and Quant Trading auto revenue 24h',
      tags = ?,
      isActive = 1,
      isHidden = 0,
      onepageUrl = 'https://benefer.1page.to'
    WHERE id = 90004`,
    [
      'https://d2xsxph8kpxj0f.cloudfront.net/310519663373200888/EpEA9QsFSK7L7cGqDuapK6/benefer-logo_70490d92.png',
      '["AI","DeFi","Trading"]'
    ]
  );
  console.log('UPDATE BENEFER:', u3.affectedRows);

  // 5. HABIBIDECK (id: 90005) - presale collection
  const [u4] = await conn.execute(
    `UPDATE investmentPlans SET
      logoUrl = ?,
      collectionType = 'node',
      label = 'RWA / Web3 Ecosystem',
      description = 'Web3 ecosystem connecting RWA - Digital economy platform based on real asset mapping',
      tags = ?,
      isActive = 1,
      isHidden = 0,
      onepageUrl = 'https://habibi.1page.to'
    WHERE id = 90005`,
    [
      'https://d2xsxph8kpxj0f.cloudfront.net/310519663373200888/Smzj32CPBzWyRzRkSUn4HG/habibideck-hero-2cR98yKZNNTGgYoXBL7sHk.webp',
      '["RWA","Web3","Blockchain"]'
    ]
  );
  console.log('UPDATE HABIBIDECK:', u4.affectedRows);

  // 6. SquidVerse (id: 90006) - self collection
  const [u5] = await conn.execute(
    `UPDATE investmentPlans SET
      logoUrl = ?,
      collectionType = 'self',
      label = 'DeFi / NFT / GameFi',
      description = 'Web3 ecosystem connecting DeFi engine, NFT identity economy, and GameFi scenarios',
      tags = ?,
      isActive = 1,
      isHidden = 0,
      onepageUrl = 'https://squidverse.1page.to'
    WHERE id = 90006`,
    [
      'https://files.manuscdn.com/user_upload_by_module/session_file/310519663373200888/cugSwBMUoeHHVgXA.svg',
      '["DeFi","NFT","GameFi"]'
    ]
  );
  console.log('UPDATE SquidVerse:', u5.affectedRows);

  // 7. ARAI Systems (id: 90007) - node collection
  const [u6] = await conn.execute(
    `UPDATE investmentPlans SET
      logoUrl = ?,
      collectionType = 'node',
      label = 'AI / Web3 / RWA',
      description = 'Innovative Web3 infrastructure platform integrating AI-based automation and decentralized finance',
      tags = ?,
      isActive = 1,
      isHidden = 0,
      onepageUrl = 'https://arai.1page.to'
    WHERE id = 90007`,
    [
      'https://d2xsxph8kpxj0f.cloudfront.net/310519663373200888/4pxxAVjbdWEkvuECKZGnHB/arai-hero-bg-dzgpsTMEbJjFFUHHgjpmgk.webp',
      '["AI","Web3","RWA"]'
    ]
  );
  console.log('UPDATE ARAI Systems:', u6.affectedRows);

  // 8. NICE 추가 (id: 90008) - self collection
  const [i1] = await conn.execute(
    `INSERT INTO investmentPlans (id, name, logoUrl, collectionType, planType, label, description, tags, isActive, isHidden, onepageUrl, dailyRate, minAmount, maxAmount, duration, totalReturn, sortOrder, createdAt, updatedAt)
    VALUES (90008, 'NICE', ?, 'self', 'self', 'DeFi / Staking Ecosystem',
      'DeFi Staking Ecosystem - USDT staking-based yield system',
      ?, 1, 0, 'https://nice.1page.to',
      0.65, 100, 100000, 365, 130, 90008,
      NOW(), NOW())
    ON DUPLICATE KEY UPDATE
      logoUrl = VALUES(logoUrl), collectionType = VALUES(collectionType),
      label = VALUES(label), description = VALUES(description),
      tags = VALUES(tags), onepageUrl = VALUES(onepageUrl),
      isActive = 1, isHidden = 0`,
    [
      'https://d2xsxph8kpxj0f.cloudfront.net/310519663373200888/EpEA9QsFSK7L7cGqDuapK6/logo-nice-9eWPfR6Hwjns48zZxHsVEq.webp',
      '["DeFi","Staking","USDT"]'
    ]
  );
  console.log('INSERT/UPDATE NICE:', i1.affectedRows);

  // 9. PINDex 추가 (id: 90009) - self collection
  const [i2] = await conn.execute(
    `INSERT INTO investmentPlans (id, name, logoUrl, collectionType, planType, label, description, tags, isActive, isHidden, onepageUrl, dailyRate, minAmount, maxAmount, duration, totalReturn, sortOrder, createdAt, updatedAt)
    VALUES (90009, 'PINDex', ?, 'self', 'self', 'DeFi / Decentralized Derivatives Exchange',
      'Next-generation decentralized perpetual futures trading platform with AI built into the blockchain core',
      ?, 1, 0, 'https://pindex.1page.to',
      0.8, 100, 100000, 365, 130, 90009,
      NOW(), NOW())
    ON DUPLICATE KEY UPDATE
      logoUrl = VALUES(logoUrl), collectionType = VALUES(collectionType),
      label = VALUES(label), description = VALUES(description),
      tags = VALUES(tags), onepageUrl = VALUES(onepageUrl),
      isActive = 1, isHidden = 0`,
    [
      'https://d2xsxph8kpxj0f.cloudfront.net/310519663373200888/9jQGzefzQstehDUagwHYVf/pindex-hero-bg-9NDvXK6pfXn8yhRCTKk7DL.webp',
      '["DeFi","AI Trading","DEX"]'
    ]
  );
  console.log('INSERT/UPDATE PINDex:', i2.affectedRows);

  // 결과 확인
  const [rows] = await conn.execute(
    'SELECT id, name, collectionType, onepageUrl FROM investmentPlans WHERE id >= 90001 ORDER BY id'
  );
  console.log('\n=== Final Result ===');
  rows.forEach(r => console.log(`[${r.id}] ${r.name} | ${r.collectionType} | ${r.onepageUrl}`));

} catch (err) {
  console.error('Error:', err.message);
} finally {
  await conn.end();
}
