import mysql from 'mysql2/promise';

const conn = await mysql.createPool(process.env.DATABASE_URL);

// 1. eventBanners에 XPLAY 프로모션 + NEXUS 2140 베트남 행사 배너 추가
const banners = [
  {
    title: 'XPLAY Launch Promotion',
    imageUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663373200888/TGrbnQ7ygm6GBAS6CWnuGe/xplay-promo-banner-XbpneFAquqppYek83kLMzJ.webp',
    linkUrl: 'https://1page.to/xplay',
    isActive: 1,
    sortOrder: 1,
  },
  {
    title: 'NEXUS 2140 Vietnam - 한국어',
    imageUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663373200888/TGrbnQ7ygm6GBAS6CWnuGe/nexus2140-banner-ko-GDoo6k4jBwrNBcU64jx7eB.webp',
    linkUrl: 'https://nexus2140.org/',
    isActive: 1,
    sortOrder: 2,
  },
  {
    title: 'NEXUS 2140 Vietnam - English',
    imageUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663373200888/TGrbnQ7ygm6GBAS6CWnuGe/nexus2140-banner-en-ekn9NJTBoRGqyBfj6jKYUJ.webp',
    linkUrl: 'https://nexus2140.org/',
    isActive: 1,
    sortOrder: 3,
  },
  {
    title: 'NEXUS 2140 Vietnam - 中文',
    imageUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663373200888/TGrbnQ7ygm6GBAS6CWnuGe/nexus2140-banner-zh-8vG52GGW5uTqTUXVqVfebF.webp',
    linkUrl: 'https://nexus2140.org/',
    isActive: 1,
    sortOrder: 4,
  },
  {
    title: 'NEXUS 2140 Vietnam - 日本語',
    imageUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663373200888/TGrbnQ7ygm6GBAS6CWnuGe/nexus2140-banner-ja-Exfc3HxoxdVcpsMvGW54V7.webp',
    linkUrl: 'https://nexus2140.org/',
    isActive: 1,
    sortOrder: 5,
  },
  {
    title: 'NEXUS 2140 Vietnam - Tiếng Việt',
    imageUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663373200888/TGrbnQ7ygm6GBAS6CWnuGe/nexus2140-banner-vi-cbL5AKFUMseARRyESyFntP.webp',
    linkUrl: 'https://nexus2140.org/',
    isActive: 1,
    sortOrder: 6,
  },
];

for (const b of banners) {
  await conn.execute(
    'INSERT INTO eventBanners (title, imageUrl, linkUrl, isActive, sortOrder, createdAt) VALUES (?, ?, ?, ?, ?, NOW())',
    [b.title, b.imageUrl, b.linkUrl, b.isActive, b.sortOrder]
  );
  console.log('✅ Banner added:', b.title);
}

// 2. notices에 공지글 추가
const notices = [
  {
    title: '🚀 XPLAY 런칭 기념 프로모션 - AlphaBag 독점 혜택',
    content: 'XPLAY가 공식 런칭되었습니다! AlphaBag에서 XPLAY 플랜에 투자하시면 런칭 기념 특별 혜택을 받으실 수 있습니다. 일일 수익률 0.50% · 최소 투자 $100 · AlphaBag 공식 파트너. 지금 바로 Self Collection에서 확인하세요!',
    isActive: 1,
    isPinned: 1,
    sortOrder: 1,
  },
  {
    title: '🏆 AlphaBag, NEXUS 2140 베트남 하롱베이 행사 공식 스폰서 선정',
    content: 'AlphaBag이 2026년 5월 12일 베트남 하롱베이에서 개최되는 NEXUS 2140 AI×WEB4 글로벌 포럼의 공식 스폰서로 선정되었습니다. 전 세계 16개국 블록체인·AI 리더들이 참여하는 이 행사에서 AlphaBag의 혁신적인 투자 플랫폼을 소개합니다. 자세한 내용은 홈 탭 > 엑스포 메뉴에서 확인하세요.',
    isActive: 1,
    isPinned: 1,
    sortOrder: 2,
  },
];

for (const n of notices) {
  await conn.execute(
    'INSERT INTO notices (title, content, isActive, isPinned, sortOrder, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
    [n.title, n.content, n.isActive, n.isPinned, n.sortOrder]
  );
  console.log('✅ Notice added:', n.title);
}

console.log('\n🎉 All done!');
process.exit(0);
