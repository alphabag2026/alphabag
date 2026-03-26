# AlphaBag v2 TODO

## DB Schema
- [x] users 테이블 확장 (walletAddress, referralCode, referredBy, kycStatus)
- [x] investmentPlans 테이블 (이름, 로고, 라벨, 일일수익률, 상태, 순서, urlId)
- [x] stakingPlans 테이블 (planType으로 분리)
- [x] nodes 테이블 (이름, 가격, 색상, 지갑주소, 설명, 태그)
- [x] investments 테이블 (사용자, 플랜, 금액, 날짜)
- [x] nodeOrders 테이블 (사용자, 노드, 수량, 금액)
- [x] notices 테이블 (제목, 내용, 활성화, 날짜)
- [x] announcements 테이블 (제목, 내용, 타입)
- [x] eventBanners 테이블 (이미지, 링크, 활성화)
- [x] adImages 테이블 (이미지, 링크, 활성화)
- [x] supportTickets 테이블 (사용자, 제목, 내용, 상태, 답변)
- [x] airdrops 테이블 (캠페인명, 토큰, 총량, 상태)
- [x] airdropParticipants 테이블 (에어드롭, 사용자, 금액, 상태)
- [x] referrals 테이블 (추천인, 피추천인, 수익)
- [x] auditLogs 테이블 (관리자, 액션, 대상, 날짜)

## API Routers
- [x] dashboard router (통계, 차트 데이터, 투자 트렌드, 분포, 상위 투자자)
- [x] plans router (Investment/Staking CRUD)
- [x] nodes router (CRUD, 수익 현황)
- [x] users router (목록, 검색, KYC, CSV 다운로드)
- [x] content router (공지, 알림, 배너, 광고)
- [x] tickets router (CRUD, 답변)
- [x] airdrops router (CRUD, 참여자 관리)
- [x] subAdmins router (promote/demote, 권한 설정)
- [x] referrals router (추천 관계, 수익 계산, stats)
- [x] analytics (dashboard에 통합)
- [x] auditLogs router

## Frontend Pages
- [x] AdminLayout (사이드바, 헤더, 골드+네이비 다크 테마)
- [x] Dashboard 페이지 (통계 카드, 차트, 상위 투자자)
- [x] Plans 페이지 (Investment/Staking 탭 분리)
- [x] Nodes 페이지 (노드 관리, 수익 현황)
- [x] Users 페이지 (사용자 목록, 검색, KYC, CSV)
- [x] Content 페이지 (공지, 알림, 배너, 광고)
- [x] Tickets 페이지 (티켓 관리, 답변)
- [x] Airdrops 페이지 (캠페인 관리)
- [x] SubAdmins 페이지 (부관리자 관리)
- [x] Analytics 페이지 (7/14/30일 트렌드, 분포, 랭킹)
- [x] Referrals 페이지 (추천 관계, 수익)

## Design System
- [x] 우아한 다크 테마 (딥 네이비 + 골드 액센트)
- [x] 반응형 사이드바 레이아웃
- [x] 통계 카드 컴포넌트
- [x] 데이터 테이블 컴포넌트 (admin-table)
- [x] 차트 컴포넌트 (Recharts - Area, Bar, Pie)
- [x] 모달/다이얼로그 컴포넌트
- [x] 폼 컴포넌트

## Tests
- [x] Auth API 테스트 (로그인/로그아웃)
- [x] dashboard API 테스트
- [x] investmentPlans CRUD 테스트
- [x] nodes CRUD 테스트
- [x] users 검색 테스트
- [x] tickets 답변 테스트
- [x] airdrops 테스트
- [x] referrals stats 테스트
- [x] subAdmins 테스트

## Phase 2 - 데이터 마이그레이션 & 사용자 페이지

### 1. 데이터 마이그레이션
- [x] alphabag.net API에서 투자 플랜 데이터 추출 및 삽입
- [x] alphabag.net API에서 노드 데이터 추출 및 삽입
- [x] 샘플 사용자 데이터 생성

### 2. 사용자 프론트엔드 페이지
- [x] 랜딩 페이지 (홈) - 플랫폼 소개, CTA, 통계
- [x] 투자 플랜 조회 페이지 - 플랜 목록, 상세, 투자 신청
- [x] 노드 구매 페이지 - 노드 목록, 상세, 구매
- [x] 사용자 대시보드 - 투자 현황, 수익, 노드 현황
- [x] 추천 시스템 페이지 - 추천 코드, 추천 트리, 수익
- [x] 사용자 프로필 페이지 - 지갑 연결, KYC, 설정
- [x] 공지사항 페이지 - 공지 목록, 상세
- [x] 지원 티켓 페이지 - 티켓 생성, 목록

## Phase 3 - 지갑 연결 고도화 & 관리자 로그인 & 다국어

### 1. 지갑 연결 고도화 (wagmi + WalletConnect)
- [ ] wagmi, viem, @wagmi/connectors 패키지 설치
- [ ] WalletConnect ProjectID 설정
- [ ] WalletProvider 컨텍스트 구현 (MetaMask, WalletConnect, TrustWallet, OKX, Binance)
- [ ] 지갑 연결 모달 컴포넌트 (WalletConnectModal)
- [ ] 서명 기반 인증 (Sign-In With Ethereum)
- [ ] 지갑 연결 후 DB 자동 저장
- [ ] 노드 구매 온체인 트랜잭션 처리

### 2. 관리자 전용 로그인 (ID/PW + JWT)
- [ ] DB에 adminAccounts 테이블 추가
- [ ] 관리자 로그인 API (POST /api/admin/login)
- [ ] JWT 기반 관리자 세션 관리
- [ ] /admin/login 로그인 페이지 (admin/admin321)
- [ ] AdminLayout에 관리자 인증 미들웨어 적용
- [ ] 기본 관리자 계정 시드 데이터

### 3. 다국어(i18n) 지원 (한국어/영어/중국어)
- [ ] react-i18next 패키지 설치
- [ ] 번역 파일 생성 (ko, en, zh)
- [ ] I18nProvider 설정
- [ ] 언어 전환 컴포넌트 (국기 아이콘 포함)
- [ ] 랜딩 페이지 번역 적용
- [ ] 사용자 페이지 번역 적용
- [ ] 언어 설정 localStorage 저장

## Phase 4 - alphabag-live 스타일 전체 페이지 재구성

- [x] DB 스키마 업데이트 (planType: golden/self/node, rating, tags, videoUrl, docsUrl, blogUrl, telegramUrl, twitterUrl, recommendedAmount, allocation)
- [x] tRPC public API 업데이트 (Golden/Self/Node 분리 조회)
- [x] 메인 홈 페이지 전면 재구현 (상단 네비, 히어로+공지, 광고배너, 골든/셀프/노드 카드 그리드)
- [x] 골든 컬렉션 전체보기 페이지 (/golden)
- [x] 셀프 컬렉션 전체보기 페이지 (/self)
- [x] 노드 상품 전체보기 페이지 (/node)
- [ ] 상품 상세 페이지 (/plan/:id)
- [ ] 장바구니 페이지 (/cart)
- [x] App.tsx 라우팅 업데이트
- [x] 공유 MainNav 컴포넌트 구현
- [x] Golden/Self/Node 컬렉션 샘플 데이터 삽입

## Phase 5 - UI 개선 (레퍼런스 이미지 기반)

- [x] AlphaBag 로고 이미지 CDN 업로드 및 적용
- [x] 광고 이미지 (달러/트레이딩 사진) CDN 업로드 및 적용
- [x] Home.tsx 레이아웃 개편 (좌: 타이틀+설명, 우: 공지박스)
- [x] 공지 박스 구현 (NOTICE 배지, 공지 텍스트, 골든콜렉션/커뮤니티 링크)
- [x] 광고 이미지 섹션 (2열 레이아웃 - 달러 이미지 + 트레이딩 이미지)
- [x] MainNav 개선 (AlphaBag 로고, 지갑 연결 버튼 황금색, 장바구니 아이콘)
- [x] 카드 호버 효과 (이미지 확대 + 황금 그림자)
- [x] 콜렉션 페이지 정렬 필터에 '최신 출시 순' 추가 (기본값)
- [x] 지갑 연결 모달 개선 (MetaMask, WalletConnect 등)

## Phase 6 - 플랜 상세 모달 + 새 컬렉션 + 공지 기능

- [x] DB 스키마 확장 (planType: leader/meme/influencer, videoUrl2, docsUrl2, infoweb4Url, zoomUrl, zoomDate, referralMessages)
- [x] 플랜 상세 페이지 (/plan/:id) - 고유 URL, 공유 가능
- [x] 플랜 상세 모달 - 개요/비디오/자료 탭
- [x] 개요 탭: 로고, 별점, 배지, 추천금액, 추천코드 입력, Ratio/Yield 박스, 썸네일 이미지
- [x] 비디오 탭: YouTube 임베드 플레이어
- [x] 자료 탭: 자료 링크 목록 (PDF, 링크 등)
- [x] 카드 하단 버튼: 비디오/자료/Blog/상세/담기/이동
- [x] 홈페이지 새 컬렉션 섹션: 리더 컬렉션 (Leader)
- [x] 홈페이지 새 컬렉션 섹션: 밈토큰 (Meme Token)
- [x] 홈페이지 새 컬렉션 섹션: 인플루언서 (Influencer)
- [x] LeaderPage (/leader), MemePage (/meme), InfluencerPage (/influencer) 라우팅
- [x] 줌/온라인 회의 공지 모달 (공지 박스 클릭 시)
- [x] 추천글 선택 모달 (소개 시 추천글 선택 기능)
- [x] infoweb4 원페이지 링크 연결 (외부 사이트 iframe 또는 새탭)
- [x] 커뮤니티 활동 섹션 (API 연동 placeholder)
- [x] App.tsx 라우팅 업데이트
