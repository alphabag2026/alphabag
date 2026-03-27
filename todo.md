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

## Phase 7 - 컬렉션 확장 + 상세 페이지 + 지갑 프로필

- [x] 홈페이지 리더 컬렉션 섹션 추가
- [x] 홈페이지 노드 컬렉션 섹션 추가
- [x] 홈페이지 밈토큰 컬렉션 섹션 추가
- [x] 홈페이지 인플루언서 컬렉션 섹션 추가
- [x] 플랜 상세 페이지 (/plan/:id) - 고유 URL, 공유 버튼
- [x] 각 컬렉션 페이지 (LeaderPage, NodePage, MemePage, InfluencerPage) 라우팅
- [x] 지갑 연결 후 MainNav에 사용자 프로필 표시 (주소 축약 + 드롭다운)
- [x] 지갑 연결 상태에 따른 프로필 정보 표시

## Phase 8 - V2 원본 데이터 마이그레이션

- [ ] V2 원본 API 엔드포인트 탐색 (alphabag-live.vercel.app)
- [ ] 투자 플랜 데이터 추출 및 마이그레이션
- [ ] 노드 데이터 추출 및 마이그레이션
- [ ] 유저 데이터 추출 및 마이그레이션
- [ ] 공지/배너/광고 데이터 추출 및 마이그레이션
- [ ] 프로젝트 정보(통계, 설정) 추출 및 마이그레이션
- [ ] 마이그레이션 결과 검증

## Phase 9 - 플랜 카드 로고 이미지 추가
- [x] V2 원본 사이트에서 각 플랜 로고 이미지 수집
- [x] 로고 이미지 CDN 업로드 (13개 로고 생성)
- [x] DB에 각 플랜 logoUrl 업데이트 (17개 플랜)
- [x] 플랜 카드 UI에 로고 이미지 표시

## Phase 10 - 관리자 이미지 업로드 관리
- [ ] 관리자 플랜 편집 페이지에 로고 이미지 업로드 기능
- [ ] 관리자 플랜 편집 페이지에 썸네일 이미지 업로드 기능
- [ ] S3 이미지 업로드 tRPC 프로시저 구현
- [ ] 드래그앤드롭 + 클릭 업로드 UI 컴포넌트
- [ ] 업로드 미리보기 및 삭제 기능
- [ ] 이미지 파일 타입/크기 검증

## Phase 11 - 실제 공식 로고 및 썸네일 이미지 교체
- [ ] B BAG MAXFI 공식 로고 수집 및 교체
- [ ] B BAG LOOMX 공식 로고 수집 및 교체
- [ ] B BAG CodexField 공식 로고 수집 및 교체
- [ ] Self Basket 시리즈 로고 교체
- [ ] Node 시리즈 로고 교체
- [ ] 트레이딩/차트 썸네일 이미지 수집 및 CDN 업로드
- [ ] DB thumbnailUrl 컬럼 추가 및 마이그레이션
- [ ] 카드 UI에 thumbnailUrl 배경 이미지 지원
- [ ] DB logoUrl 및 thumbnailUrl 업데이트

## Phase 13 - alphabag.net Firebase 고객 데이터 마이그레이션 (2026-03-27)
- [x] Firebase Firestore 데이터 추출 (numine-dev-e4ec1)
- [x] users 663명 → MySQL 임포트 완료
- [x] investments 24건 → MySQL 임포트 완료
- [x] nodeOrders 120건 → MySQL 임포트 완료
- [x] referrals 1013건 → MySQL 임포트 완료
- [x] notices 3건 → MySQL 임포트 완료

## Phase 12 - 네이버 모바일 스타일 홈페이지 개편 (2026-03-27)
- [x] 홈페이지 상단 검색바 추가 (네이버 스타일, AlphaBag 플랜 검색)
- [x] 광고 배너 자동 슬라이더 구현
- [x] 소메뉴 탭 구현: 추천 / B bag / infoweb4 / SNN / news / 컨텐츠 / Live
- [x] 금융시장 위젯: BTC/ETH/BNB 가격 + 주요 환율 (USD/KRW 등) 실시간 표시
- [x] 3가지 카드 뷰 타입: A(손글씨B 스타일) / B(게시판 한줄형) / C(현재 카드형)
- [x] 라이트/다크 테마 토글 버튼 추가
- [x] App.tsx ThemeProvider switchable=true 설정
- [x] 금융 데이터 백엔드 라우터 추가 (CoinGecko 공개 API)
- [x] 소메뉴 탭별 콘텐츠 섹션 연동

## Phase 14 - Firebase 데이터 추가 임포트 및 관리자 페이지 개선 (2026-03-27)
- [x] Firebase investment_plans 17건 → MySQL investmentPlans 매핑 및 임포트
- [x] investments 24건 planId 정확한 플랜으로 재연결 (21건 성공)
- [x] Firebase referral_users 251건 → MySQL users 추가 임포트 (이미 포함된 동일 지갑 주소)
- [x] 관리자 페이지 Users 탭 지갑 주소 기반 사용자 목록 표시 개선 (통계 카드, 복사 버튼, 한국어 UI)

## Phase 15 - 플랜 로고 CDN 이전, 레퍼럴 트리, 노드 연결 (2026-03-27)
- [x] Firebase 플랜 로고 17개 Cloudinary → Manus CDN 이전
- [x] Firebase nodes 데이터 추출 및 nodeOrders nodeId 재연결 (120건, 7개 노드 타입)
- [x] 관리자 Referrals 탭 레퍼럴 트리 시각화 (트리 탭 + 테이블 탭, 지갑 주소 기반)
- [x] db.ts getTopReferrers에 users JOIN 추가 (userName, userWallet, referralCode, totalEarnings)

## Phase 16 - 레퍼럴 트리 확장, 노드 통계, 플랜 로고 UI (2026-03-27)
- [x] 레퍼럴 2단계 재귀 트리 백엔드 (getReferralTree 재귀 쿼리, 최대 5단계)
- [x] 레퍼럴 트리 프론트엔드 - 재귀 TreeNode 컴포넌트 (자식 lazy-load)
- [x] 노드별 판매 통계 차트 (관리자 Dashboard - 막대/파이 차트)
- [x] 플랜 로고 이미지 업로드 UI (Plans 탭 - 로고 교체 버튼, S3 업로드)

## Phase 17 - 레퍼럴 트리 연결, 노드 상세, 플랜 로고 일괄 (2026-03-27)
- [x] Users 탭 → Referrals 트리 연결 (사용자 행 GitBranch 아이콘 클릭 시 우측 Sheet 표시)
- [x] 노드 판매 상세 백엔드 API (getNodePurchasers, nodes.purchasers 프로시저)
- [x] 노드 판매 상세 드릴다운 UI (Nodes 카드 구매자 N명 버튼 → 우측 Sheet)
- [x] Plans 탭 카드 로고 영역 호버 시 Upload 아이콘 → 클릭 시 직접 S3 업로드

## Phase 18 - CSV 개선, 노드 총계, 로고 스피너 (2026-03-27)
- [x] Users CSV에 walletAddress, referralCode, totalInvested 컨럼 확인 (이미 포함되어 있음)
- [x] 노드 구매자 Sheet 상단 총 매출 + 평균 구매금액 요약 카드 (총 구매자/총 매출/평균 구매 3개 카드)
- [x] Plans 카드 로고 업로드 중 스피너 표시 + 완료 시 ✅ 토스트 피드백

## Phase 19 - 관리자 로그인, Users 필터, 노드 CSV (2026-03-27)
- [x] adminAccounts DB 테이블 추가 (id, username, passwordHash, role, createdAt) - 이미 존재
- [x] /api/admin/login POST 엔드포인트 (bcrypt 검증, JWT 발급) - adminAuth.login 프로시저
- [x] /admin/login 로그인 페이지 (ID/PW 입력, 기본 admin/admin321) - 이미 구현됨
- [x] AdminLayout에 adminToken 쿠키 기반 인증 미들웨어 적용
- [x] Users 탭 필터 버튼: 투자 있음 / 노드 구매 있음 / KYC 완료 (토글 방식, 필터 초기화 버튼 포함)
- [x] users.list 백엔드에 filter 파라미터 추가 (hasInvestment, hasNode, kycApproved)
- [x] 노드 구매자 Sheet에 CSV 다운로드 버튼 추가 (지갑주소/이름/이메일/금액/상태/날짜/TxHash)

## Phase 20 - SubAdmins 계정 관리, 노드 일괄 업데이트 (2026-03-27)
- [x] SubAdmins 탭 관리자 계정 추가/수정/비활성화 UI (비밀번호 변경, 권한 설정, 삭제)
- [x] 노드 구매자 Sheet에 pending → confirmed 일괄 업데이트 버튼 추가 (체크박스 선택 방식)
- [x] nodes.bulkUpdateStatus 백엔드 프로시저 (inArray로 일괄 UPDATE, confirmed/cancelled 지원)

## Phase 21 - BSCScan TxHash 검증, Audit Log, 대량 발송 (2026-03-27)
- [ ] BSCScan API 연동 (nodes.verifyTxHash 프로시저 - TxHash 상태 조회)
- [ ] pending nodeOrders 일괄 검증 버튼 (Nodes 구매자 Sheet)
- [x] bulkUpdateStatus에 createAuditLog 연동
- [ ] adminAuth CRUD에 createAuditLog 연동
- [ ] Users 탭 선택된 사용자에게 텔레그램 메시지 발송 UI
- [ ] users.sendMessage 백엔드 프로시저 (텔레그램 봇 연동)

## Phase 21 (확장) - 텔레그램 대량 발송 시스템 (2026-03-27)
- [x] users 테이블에 telegramChatId 컬럼 추가 (DB 마이그레이션)
- [x] drizzle/schema.ts 업데이트 (telegramChatId 필드 추가)
- [x] users.broadcastTelegram 백엔드 프로시저 (필터 조건 + 채널 발송 + 개별 DM)
- [x] TELEGRAM_BOT_TOKEN 환경변수 설정
- [x] Users 탭 "텔레그램 발송" 버튼 추가 (필터 버튼 옆)
- [x] 텔레그램 메시지 작성 다이얼로그 (제목/내용/대상 필터 표시)
- [x] 발송 결과 표시 (성공/실패 건수)
- [x] bulkUpdateStatus에 createAuditLog 연동

## Phase 22 - 텔레그램 연동 고도화 (2026-03-27)
- [x] 마이페이지 텔레그램 Chat ID 등록 카드 UI
- [x] users.updateMyTelegramChatId 프로시저 (본인 Chat ID 등록)
- [x] 봇 연동 안내 (봇 이름 표시, /start 명령어 안내)
- [x] Audit Log 탭 BROADCAST_TELEGRAM 액션 필터 버튼 추가
- [x] Audit Log 상세보기 다이얼로그 (발송 메시지 전문 확인)
- [x] telegramSchedules DB 테이블 생성 (예약 발송)
- [x] 예약 발송 백엔드 스케줄러 (cron 기반, 1분 주기 체크)
- [x] telegram.schedules CRUD 프로시저 (list/create/delete)
- [x] 예약 발송 관리 UI (백오피스 - 새 탭 또는 텔레그램 발송 다이얼로그 내 탭)
- [x] 예약 발송 결과 기록 (실행 후 lastRunAt, lastResult 업데이트)

## Phase 23 - 텔레그램 웹훅·Audit Log 개선·즉시 발송 (2026-03-27)
- [x] 텔레그램 봇 웹훅 엔드포인트 (/api/telegram/webhook) - /start 수신 시 Chat ID 자동 DB 저장
- [x] 웹훅 URL 등록 안내 (ProfilePage에 봇 링크 + 웹훅 설정 방법 표시)
- [x] Audit Logs auditLogs.list 프로시저에 adminAccounts JOIN → adminUsername 반환
- [x] AuditLogs.tsx 테이블에 Admin ID 대신 username 표시
- [x] telegramSchedules.runNow 프로시저 (즉시 실행)
- [x] TelegramSchedules.tsx 카드에 "지금 발송" 버튼 추가

## Phase 24 - 웹훅 자동등록·다국어봇·Audit 날짜필터 (2026-03-27)
- [x] TelegramSchedules 페이지 상단에 "웹훅 등록" 버튼 추가
- [x] POST /api/telegram/webhook/register 호출 → 현재 도메인 자동 등록
- [x] 웹훅 현재 상태 표시 (GET /api/telegram/webhook/info)
- [x] telegramWebhook.ts /start 다국어 응답 (한국어/영어/중국어/일본어/베트남어/태국어/인도네시아어)
- [x] 언어 감지: Telegram from.language_code 기반 자동 선택
- [x] auditLogs.list 프로시저에 dateRange 파라미터 추가 (today/week/month/all)
- [x] AuditLogs.tsx 날짜 범위 필터 버튼 UI (오늘/이번 주/이번 달/전체)

## Phase 25 - 급등토큰·에어드랍·화이트테마·이미지업로드·즐겨찾기·텔봇확장 (2026-03-27)
- [x] DB: userFavorites 테이블 (userId, planId)
- [x] DB: airdrops 테이블 (title, description, projectName, rewardAmount, endDate, status, imageUrl)
- [x] DB: mediaAssets 테이블 (filename, url, mimeType, size, uploadedBy)
- [x] 급등 토큰 감지 섯션 (홈페이지 - CoinGecko API 기반 급등 토큰 표시)
- [x] 에어드랍 섯션 (홈페이지 - 골든 콜렉션과 같은 별도 섯션)
- [x] 에어드랍 백오피스 관리 (CRUD)
- [x] 화이트 라이트 테마 - 완전한 화이트 배경으로 수정 (index.css)
- [x] 관리자 이미지 업로드 + CDN URL 생성 (백오피스 Media 탭)
- [x] 플랜 상세 모달 썸네일 갤러리 + 핵심 정보 표시
- [x] 사용자 즐겨찾기 추가/제거 기능 (플랜 카드 하트 버튼)
- [x] 즐겨찾기 모아보기 탭 (홈페이지 탭에 추가)
- [x] 텔레그램 봇 /status 명령어 (투자 현황 조회)
- [x] 텔레그램 봇 /help 명령어 (안내 메시지)
- [x] Audit Logs CSV 내보내기 버튼 (필터 조건 적용)
- [x] 텔레그램 발송 HTML 미리보기 패널
- [x] 토큰 목록 1줄에 여러 개 그리드 레이아웃 (2~4개/줄 카드형)

## Phase 26 - 에어드랍CRUD·즐겨찾기탭·급등알림 (2026-03-27)
- [x] 에어드랍 백오피스 CRUD 페이지 (admin/Airdrops.tsx) - 이전 세션에서 완료
- [x] airdrops.list/create/update/delete 프로시저 추가 - 이전 세션에서 완료
- [x] AdminLayout에 Airdrops 메뉴 추가 - 이전 세션에서 완료
- [x] App.tsx에 /admin/airdrops 라우트 추가 - 이전 세션에서 완료
- [x] 즐겨찾기 모아보기 탭 (홈페이지 소메뉴 "❤️ 즐겨찾기" 탭)
- [x] favorites.list 프로시저 개선 (userFavorites LEFT JOIN investmentPlans)
- [x] 급등 토큰 텔레그램 자동 알림 스케줄러 (trendingAlertScheduler.ts)
- [x] trendingAlertSettings DB 테이블 생성 (임계값/주기/채널/DM/템플릿)
- [x] 관리자 설정 UI (admin/TrendingAlerts.tsx - 알림 임계값/주기/채널 설정)
- [x] 스케줄러에서 급등 감지 시 텔레그램 발송 (채널 + DM 옵션)

## Phase 27 - 홈페이지 UI 개선 (2026-03-27)
- [x] 금융 시장 위젯 1줄 가로 레이아웃 (BTC/ETH/BNB/SOL 4개 가로 나열)
- [x] 상단 네비에서 Node 메뉴 삭제, Airdrop 메뉴 추가
- [x] 소메뉴 탭에 에어드랍 탭 추가 (기존 탭에 이미 포함됨)
- [x] 전체 테마 화이트/라이트 계열로 변경 (기본 테마 light 설정, 카드/섹션 라이트 스타일 적용)
