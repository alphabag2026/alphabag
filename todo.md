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

## Phase 28 - 에어드랍 관리자 추가 기능 + 카드 가독성 (2026-03-27)
- [x] 에어드랍 관리자 페이지 신규 아이템 추가 폼 개선 (projectName/imageUrl/participateUrl/isHot/sortOrder 필드 추가, 4섹션 구조화)
- [x] 라이트 테마 투자 플랜 카드(C형) 색상/테두리 진하게 조정 (border-2, 라이트 colorMap 별도 정의)

## Phase 29 - 금융 시장 위젯 2개 컴팩트 (2026-03-27)
- [x] MarketWidget BTC/ETH 2개만 표시, 컴팩트 2열 스타일로 축소

## Phase 30 - 금융 위젯 사이드바 이동 + 코인 토글 (2026-03-27)
- [x] 금융 위젯을 오른쪽 사이드바로 이동 (lg 이상 화면에서 sticky 사이드바로 표시)
- [x] BNB/SOL 코인 토글 스위치 추가 (코인 선택 버튼으로 토글)
## Phase 31 - 햄버거 메뉴 + 별도 페이지 + 리스팅 신청 + 샘플 데이터 (2026-03-27)
- [x] DB: investmentPlans에 isHidden 필드 추가, listingRequests/partners 테이블 생성
- [x] 햄버거 메뉴 네비 (About B-BAG 접이식 서브메뉴: Golden/Self/Leader/Influencer/MemeToken)
- [x] 핵심 파트너 메뉴 추가 (/partners)
- [x] 별도 페이지: C-BAG(/cbag), Airdrop(/airdrop), Partners(/partners), Listing(/listing)
- [x] 프로젝트 리스팅 신청 페이지 (/listing) - 신청 폼 + 백오피스 관리
- [x] 백오피스 프로젝트 숨기기 기능 (isHidden 토글, admin/Plans)
- [x] 샘플 데이터 자동 생성 (C-BAG 플랜 3개, 파트너 3개, 에어드랍 3개)
- [x] 사이드바: 오늘의 추천 플랜 미니 카드 (TodayRecommendWidget)
- [x] 사이드바: 환율 접기/펼치기 토글 추가
- [x] 모바일 금융 위젯 1줄 인라인 표시 (MobileMarketBar 컴포넌트)

## Phase 32 - 컬렉션 페이지 DB 연결 + 파트너 로고 + 리스팅 알림 (2026-03-28)
- [x] Golden/Self/Leader/Influencer/MemeToken 컬렉션 페이지 DB 데이터 연결 (leaderPlans/influencerPlans/memePlans 라우터 이미 구현, 샘플 데이터 삽입)
- [x] 파트너 데이터 중복 정리 (8개 고유 파트너 유지, cryptologos.cc CDN URL 적용)
- [x] 파트너 어드민 이미지 업로드 기능 추가 (파일 업로드 + URL 직접 입력 병행)
- [x] 리스팅 신청 시 notifyOwner 알림 연동 (카테고리/프로젝트명/담당자/이메일/텔레그램/웹사이트 포함)
- [x] 테스트 추가 (listing/partners/collection plans 25개 테스트 통과)

## Phase 33 - 파트너 편집·리스팅 이메일 알림·컬렉션 라이트 테마 (2026-03-28)
- [x] 파트너 어드민 인라인 편집 기능 (행 클릭 → 로고/이름/설명/웹사이트 편집 모드, 파일 업로드 + URL 입력 병행)
- [x] partners.update 백엔드 프로시저 추가
- [x] 리스팅 상태 변경 시 관리자 notifyOwner 알림 + 이메일 복사 버튼 UI 제공
- [x] listing.updateStatus 백엔드 프로시저 + notifyOwner 알림 연동
- [x] 컬렉션 페이지 라이트 테마 적용 (GoldenPage/SelfPage/LeaderPage/InfluencerPage/MemePage 5개)
- [x] MainNav 라이트 테마 전환 (bg-background/95, semantic 토큰 전체 적용)

## Phase 34 - 플랜 상세 라이트 테마·파트너 설명·리스팅 대시보드 (2026-03-28)
- [x] /plan/:id 상세 페이지 라이트 테마 전환 (bg-background, text-foreground)
- [x] PlanDetailModal 라이트 테마 전환 (콜렉션별 액센트 색상, semantic 토큰 전체 적용)
- [x] 파트너 8개 설명 텍스트 실제 파트너십 내용으로 DB 업데이트 (Binance/OKX/Uniswap/Aave/Chainlink/Polygon/OpenSea/CoinGecko)
- [x] 리스팅 신청 현황 대시보드 상태별 요약 카드 (전체/대기중/검토중/승인/거절 5개 카드, 클릭 시 필터 연동)
- [x] 25개 테스트 통과

## Phase 35 - 즐겨찾기 페이지·월별 차트·검색 하이라이트 (2026-03-28)
- [x] /favorites 즐겨찾기 페이지 생성 (DB 기반, 콜렉션별 색상 카드, 호버 시 삭제 버튼, 전체 삭제)
- [x] favorites DB 테이블(userFavorites) + 백엔드 프로시저 (list/toggle) - 이미 구현되어 있음
- [x] MainNav 프로필 드롭다운에 즐겨찾기 링크 추가 (Heart 아이콘)
- [x] App.tsx /favorites 라우트 등록
- [x] 리스팅 신청 대시보드 월별 바 차트 추가 (recharts, 승인/거절/대기 스택 바, 최근 6개월)
- [x] 홈 검색 결과 키워드 하이라이트 구현 (HighlightText 컴포넌트, amber-200 배경)
- [x] 25개 테스트 통과

## Phase 37 - 백오피스 전체 에러 수정 (2026-03-28)
- [x] 서버 로그 및 TypeScript 에러 전체 파악
- [x] Home.tsx allPlans useQuery({}) 무한루프 수정 (useMemo로 안정화)
- [x] media 라우터 storagePut import 경로 수정 (../server/storage → ./storage)
- [x] TrendingAlerts.tsx AdminLayout 누락 추가
- [x] AdminLayout 사이드바 /admin/assets → /admin/nodes 수정, Analytics/Referrals 메뉴 추가
- [x] App.tsx /admin/dashboard 라우트 추가
- [x] 전체 백오피스 페이지 AdminLayout 사용 확인 (Login 제외 전체 적용)
- [x] 모든 trpc 프로시저 존재 확인 (airdrops/nodes/plans/users/content/tickets/partners/listing/adminAuth/trendingAlert/telegramSchedules/media/referrals 전체 정상)
- [x] 25개 테스트 통과, TypeScript 0 errors

## Phase 38 - 내 계정 설정·리스팅 파이 차트·하트 토글 (2026-03-28)
- [ ] 백오피스 /admin/my-account 페이지 생성 (비밀번호 변경, 현재 사용자명 표시)
- [ ] AdminLayout 사이드바 하단에 '내 계정' 링크 추가 (User 아이콘)
- [ ] adminAuth.changePassword 프로시저 본인 비밀번호 변경 연동
- [ ] 리스팅 신청 관리 페이지 카테고리별 파이 차트 추가 (recharts PieChart)
- [ ] 컬렉션 페이지 플랜 카드 하트 토글 버튼 (Golden/Self/Leader/Influencer/Meme 5개)

## Phase 38 - 내 계정 설정·리스팅 파이 차트·하트 토글 버튼 (2026-03-28)
- [x] 백오피스 /admin/my-account 페이지 생성 (현재 계정 정보 표시 + 비밀번호 변경)
- [x] App.tsx에 /admin/my-account 라우트 추가
- [x] AdminLayout 사이드바 하단에 내 계정 설정 링크 추가 (User 아이콘)
- [x] 리스팅 신청 관리 페이지 카테고리별 파이 차트 추가 (recharts PieChart, 도넛 스타일)
- [x] 월별 바 차트 + 카테고리 파이 차트 2열 그리드 레이아웃으로 나란히 배치
- [x] Golden/Self/Leader/Influencer/Meme 5개 컬렉션 페이지 플랜 카드 하트 토글 버튼 추가
- [x] 미로그인 시 로그인 페이지 이동, 로그인 시 즐겨찾기 DB 토글 + 빨간 하트 표시
- [x] 25개 테스트 통과

## Phase 39 - SNS 인플루언서 피드 탭 (2026-03-28)

- [x] DB 스키마에 snsInfluencers 테이블 추가 (name, handle, avatarUrl, twitterUrl, description, category, sortOrder, isActive)
- [x] DB 스키마에 snsPosts 테이블 추가 (influencerId, content, tweetUrl, postedAt, likes, retweets, isManual)
- [x] 마이그레이션 SQL 실행
- [x] 백엔드: public.snsInfluencers.list 프로시저 추가
- [x] 백엔드: public.snsPosts.list 프로시저 추가
- [x] 백엔드: admin SNS CRUD 프로시저 추가 (create/update/delete influencer, create/update/delete post)
- [x] 홈 페이지 SNN 탭 → SNS 탭으로 교체 (아이콘 📱, 라벨 SNS)
- [x] 홈 SNS 탭 UI: 인플루언서 카드 + 최신 포스트 피드
- [x] 어드민 /admin/sns 페이지 추가 (인플루언서 + 포스트 관리)
- [x] AdminLayout 사이드바에 SNS 메뉴 추가
- [x] 샘플 데이터 삽입 (CZ, 허이, Vitalik, Elon 등)
- [x] 테스트 추가 및 체크포인트 저장
## Phase 40 - SNS 탭 기능 강화 (2026-03-30)

- [x] X API v2 자동 트윗 수집 스케줄러 (twitterFetchScheduler.ts) 구현
- [x] snsInfluencers 테이블에 twitterUserId, autoFetchEnabled, lastFetchedAt, snsTelegramChatId 컬럼 추가
- [x] DB 마이그레이션 실행 (0014_overconfident_lionheart.sql)
- [x] server/_core/index.ts에 startTwitterFetchScheduler() 초기화 추가
- [x] sns.manualFetch 어드민 프로시저 추가 (수동 트윗 수집 트리거)
- [x] sns.updateInfluencer에 autoFetchEnabled, twitterUserId, snsTelegramChatId 필드 추가
- [x] sns.createPost에 sendToTelegram 플래그 추가 (등록 시 텔레그램 채널 자동 발송)
- [x] 어드민 SNS 페이지 전면 재구성 (X API 설정 UI, 텔레그램 채널 설정, 수동수집 버튼)
- [x] 홈 SNS 탭 카테고리 필터 탭 UI 추가 (크립토/DeFi/트레이딩/NFT 등)
- [x] 인플루언서 필터가 카테고리 선택에 따라 동적 필터링
- [x] filteredSnsPosts 카테고리 기반 포스트 필터링 로직
- [x] 테스트 추가 (manualFetch, updateInfluencer 새 필드, createPost.sendToTelegram) - 37개 전체 통과

## Phase 41 - SNS 인플루언서 확장 및 X API 연동 (2026-03-30)

- [x] X API Bearer Token Secrets 등록 (TWITTER_BEARER_TOKEN)
- [x] DeFi 유명 인플루언서 5명 DB 삽입 (Andre Cronje, Hayden Adams, Stani Kulechov, Rune Christensen, Kain Warwick)
- [x] NFT 유명 인플루언서 5명 DB 삽입 (Beeple, Gary Vee, Pranksy, Gmoney, Punk6529)
- [x] 체크포인트 저장

## Phase 42 - 인플루언서 이미지·Trading 카테고리·자동수집 (2026-03-30)

- [x] 인플루언서 16명 프로필 이미지 URL 수집 및 DB 업데이트
- [x] Trading 카테고리 전문가 3명 추가 (Peter Brandt, Willy Woo, Tone Vays)
- [x] 전체 인플루언서 twitterUserId 수집 및 DB 업데이트
- [x] 모든 인플루언서 autoFetchEnabled = 1 활성화
- [x] 체크포인트 저장

## Phase 43 - AI 플랜 자동 등록 기능 (2026-03-30)

- [ ] 백엔드: 이미지/PDF/PPT 파일 업로드 → S3 저장 프로시저
- [ ] 백엔드: LLM Vision으로 이미지에서 플랜 정보 추출 프로시저 (parsePlanFromImage)
- [ ] 백엔드: 텍스트 프롬프트에서 플랜 정보 추출 프로시저 (parsePlanFromText)
- [ ] 백엔드: PDF/PPT 텍스트 추출 후 LLM 파싱 프로시저 (parsePlanFromFile)
- [ ] 백엔드: 파싱된 데이터로 플랜 자동 생성 프로시저 (createPlanFromParsed)
- [ ] 어드민 /admin/ai-plan-import 페이지 생성 (탭: 프롬프트/이미지/파일)
- [ ] 프롬프트 탭: 텍스트 입력 → LLM 파싱 → 미리보기 카드 → 등록 확인
- [ ] 이미지 탭: 이미지 업로드 → LLM Vision 파싱 → 미리보기 카드 → 등록 확인
- [ ] 파일 탭: PDF/PPT 업로드 → 텍스트 추출 → LLM 파싱 → 미리보기 카드 → 등록 확인
- [ ] AdminLayout 사이드바에 "AI 플랜 등록" 메뉴 추가
- [ ] App.tsx에 /admin/ai-plan-import 라우트 추가
- [ ] 테스트 작성 및 체크포인트 저장

## Phase 43 - AI 플랜 자동 등록 기능 (2026-03-30)
- [x] 백엔드 aiPlanImport 라우터 추가 (parseFromText, parseFromImage, parseFromFile, createFromParsed)
- [x] pdf-parse, officeparser 패키지 설치
- [x] LLM Vision 이미지 분석 → 플랜 구조 자동 추출
- [x] PDF/PPT 텍스트 추출 → LLM 파싱
- [x] 텍스트 프롬프트 → LLM 파싱
- [x] 어드민 /admin/ai-plan-import 페이지 구현 (3탭: 텍스트/이미지/파일)
- [x] 파싱 결과 미리보기 카드 (실제 플랜 카드 스타일)
- [x] 수정 모드 (EditablePlanForm)
- [x] 확인 후 플랜 등록 확정 버튼
- [x] AdminLayout 사이드바에 "AI 플랜 등록" 메뉴 추가
- [x] App.tsx 라우트 추가
- [x] aiPlanImport.test.ts 테스트 작성 (45개 전체 통과)
- [x] 체크포인트 저장

## Phase 44 - 공개 플랜 등록 시스템 (2026-03-30)
- [ ] DB: planSubmissions 테이블 (신청자 정보, 이메일, 텔레그램, 상태, 파일URL, 파싱결과, 상장비용)
- [ ] DB: submissionVerifications 테이블 (이메일/텔레그램 인증 코드, 만료시간)
- [ ] DB: submissionVotes 테이블 (신청ID, 노드보유자ID, 찬반, 투표일시)
- [ ] DB: submissionFeeDistributions 테이블 (신청ID, 수령자, 금액, 비율, 상태)
- [ ] DB: submissionSettings 테이블 (상장비용, 투표기간, 상장기준점수, 알파백수수료비율)
- [ ] 마이그레이션 SQL 실행
- [ ] 백엔드: 이메일 인증 코드 발송/확인 프로시저
- [ ] 백엔드: 텔레그램 인증 코드 발송/확인 프로시저
- [ ] 백엔드: 플랜 신청 CRUD (create, list, getById, cancel)
- [ ] 백엔드: PPT/PDF/이미지 업로드 + AI 파싱 프로시저
- [ ] 백엔드: 노드 보유자 투표 프로시저 (vote, getVoteStatus)
- [ ] 백엔드: 투표 마감 및 상장 결정 스케줄러
- [ ] 백엔드: 상장비용 분배 프로시저 (노드 60% + 알파백 40%)
- [ ] 프론트: /submit-plan 공개 신청 페이지 (이메일+텔레그램 인증 → 파일업로드 → AI파싱 → 미리보기 → 상장비용 안내 → 제출)
- [ ] 프론트: /vote 노드 투표 페이지 (신청 목록, 찬반 투표, 진행 현황)
- [ ] 프론트: /my-submissions 등록자 마이페이지 (신청 현황, 투표 결과, 분배 내역)
- [ ] 어드민: /admin/submissions 신청 관리 페이지 (설정, 승인/거절, 분배 실행)
- [ ] AdminLayout 사이드바에 신청 관리 메뉴 추가
- [ ] App.tsx 라우트 추가
- [ ] 테스트 작성 및 체크포인트 저장

## Phase 45 - 골든 컬렉션 시스템 강화 + 플랫폼 소개 페이지

- [ ] USDT 지갑 주소 설정 (어드민 submissionSettings에 paymentWalletAddress 필드 추가)
- [ ] 온체인 입금 확인 폴링 스케줄러 (TronScan/BSCScan API 활용)
- [ ] 노드 보유자 투표 자격 검증 강화 (nodes 테이블에서 userId 확인)
- [ ] 홈 화면 골든 컬렉션 CTA 배너 추가
- [ ] /about 플랫폼 소개 및 기능 소개 텍스트 페이지 구현
- [ ] 테스트 및 체크포인트 저장

## Phase 46 - 노드 투표 보상 시스템 + 다크 테마 단일화

- [ ] DB 스키마: voteRewards 테이블 (userId, submissionId, voteId, rewardUsdt, status, paidAt)
- [ ] DB 스키마: rewardWithdrawals 테이블 (userId, amount, walletAddress, network, status, txHash)
- [ ] 마이그레이션 SQL 실행
- [ ] 백엔드: rewards.myRewards (누적 보상, 미지급 잔액, 투표별 보상 내역)
- [ ] 백엔드: rewards.requestWithdrawal (출금 신청)
- [ ] 백엔드: rewards.myWithdrawals (출금 내역)
- [ ] 백엔드: admin.rewards.list (전체 보상 내역)
- [ ] 백엔드: admin.rewards.processWithdrawal (출금 승인/거절)
- [ ] 마이페이지(/my-submissions) 투표 보상 현황 섹션 추가 (누적 USDT, 미지급 잔액, 투표별 보상, 출금 신청 폼)
- [ ] 어드민 보상 관리 페이지 (/admin/rewards)
- [ ] 전체 페이지 다크 테마 단일화 (ThemeProvider defaultTheme="dark", index.css 다크 변수 정리, 모든 페이지 일관 적용)
- [ ] 테스트 작성 및 체크포인트 저장

## Phase 47 - 출금 주소 검증 + 투표 카운트다운 + 보상 텔레그램 알림

- [x] 마이페이지 출금 신청 - BSC/TRC20/ERC20 주소 형식 자동 감지 및 유효성 검사
- [x] 투표 페이지 - 마감 카운트다운 타이머 실시간 표시
- [x] 투표 페이지 - 찬성/반대 실시간 프로그레스 바 시각화
- [x] 백엔드 보상 지급 시 텔레그램 봇 자동 알림 발송
- [x] 테스트 및 체크포인트

## Phase 48 - 투표 마감 자동화 스케줄러 (2026-03-30)

- [x] voteDeadlineScheduler.ts 생성 (5분 주기 크론)
- [x] 마감 시간 지난 voting_period 상태 투표 자동 집계
- [x] 찬성 비율 >= approvalThresholdPct → approved, 미달 → rejected
- [x] 상태 변경 시 createAuditLog 기록
- [x] server/index.ts에 스케줄러 등록

## Phase 49 - 신청자 이메일 자동 알림 (2026-03-30)

- [x] 이메일 발송 헬퍼 함수 구현 (내장 Forge API)
- [x] 투표 결과 승인 시 신청자 이메일 자동 발송
- [x] 투표 결과 거절 시 신청자 이메일 자동 발송
- [x] 이메일 템플릿 (한국어, 플랜명/결과/안내 포함)
- [x] 스케줄러와 연동 + 어드민 수동 승인/거절 시에도 자동 발송

## Phase 50 - 모바일 최적화 (2026-03-30)

- [x] VotePage 모바일 레이아웃 최적화 (카운트다운 타이머 모바일 폰트/간격)
- [x] VotePage 프로그레스 바 모바일 최적화 (터치 영역, 레이블 크기)
- [x] SubmitPlanPage 모바일 최적화 (스텝 인디케이터, 폼 입력 영역)
- [x] MySubmissionsPage 모바일 최적화 (카드 레이아웃, 출금 신청 폼)

## Phase 53 - 멀티 지갑 연결 (MetaMask/TronLink/WalletConnect) [완료]

- [x] DB users 테이블 walletAddress 필드 확인 (기존 데이터 활용)
- [x] WalletContext.tsx TronLink 연결 감지 및 자동 DB 저장
- [x] 로그인 후 DB 지갑 주소 자동 복원 표시 (dbWalletAddress)
- [x] WalletConnectModal 9개 지갑 목록 (MetaMask/TronLink/WalletConnect/TrustWallet/TokenPocket/OKX/Binance/Gate/Coinbase)
- [x] 헤더 MainNav 지갑 연결 버튼 (이미 구현됨)
- [x] ProfilePage 지갑 섹션 원클릭 연결 버튼 추가
- [x] TronLink 연결 시 DB 자동 저장 및 표시
- [x] 테스트 88개 전체 통과

## Phase 54 - 사용자 대시보드 모바일 최적화 (2026-03-31)

- [x] DashboardLayout 모바일 사이드바 오버레이 방식으로 수정 (콘텐츠 영역 가림 현상 제거)
- [x] 모바일에서 사이드바 기본 닫힌 상태로 시작
- [x] 햄버거 메뉴 버튼 추가 (모바일 헤더 좌상단)
- [x] 사이드바 열릴 때 배경 오버레이(dimming) 추가
- [x] 사이드바 외부 클릭 시 자동 닫힌
- [x] 대시보드 통계 카드 모바일 2열 그리드
- [x] 테스트 88개 전체 통과 및 체크포인트

## Phase 배포 - Manus OAuth 제거 및 독립 인증 시스템 구축 (2026-04-02)

### 목표: 일반 사용자 = 지갑 로그인, 어드민 = 별도 비밀번호 로그인

- [ ] server/_core/context.ts - Manus SDK 제거, 자체 JWT 검증으로 교체
- [ ] server/_core/oauth.ts 삭제 또는 비활성화
- [ ] server/routers.ts - auth.walletLogin 프로시저 추가 (지갑 서명 검증)
- [ ] server/routers.ts - auth.adminLogin 프로시저 수정 (이미 adminAuth.login 존재)
- [ ] client/src/const.ts - getLoginUrl() 제거 (Manus OAuth URL 생성 제거)
- [ ] client/src/_core/hooks/useAuth.ts - 지갑 로그인 지원으로 수정
- [ ] client/src/components/MainNav.tsx - 지갑 연결 버튼으로 로그인 대체
- [ ] Vultr 서버 재배포

## Phase 배포 완료 - Manus OAuth 완전 제거 (2026-04-02)
- [x] client/src/const.ts - getLoginUrl() Manus OAuth → 지갑 모달 이벤트로 교체
- [x] client/src/main.tsx - Manus OAuth 리다이렉트 제거
- [x] client/src/_core/hooks/useAuth.ts - Manus OAuth 리다이렉트 제거
- [x] client/src/components/DashboardLayout.tsx - getLoginUrl 제거
- [x] client/src/contexts/WalletContext.tsx - open-wallet-modal 전역 이벤트 리스너 추가
- [x] 모든 페이지 getLoginUrl 교체 완료
- [x] pnpm build 성공
- [x] Vultr 서버 (45.76.149.113) 배포 완료

## Phase MLM 배지 및 검색 기능 (2026-04-02)
- [x] DB: investmentPlans에 isMLM boolean 필드 추가
- [x] DB: 마이그레이션 SQL 실행 (Vultr MySQL)
- [x] drizzle/schema.ts에 isMLM 필드 추가
- [x] 플랜 카드 UI에 MLM 배지 표시 (별도 색상 배지)
- [x] 검색 기능에 MLM 키워드 연동 (isMLM=true 플랜 검색 결과 포함)
- [x] 백오피스 플랜 편집에 MLM 토글 추가
- [x] 빌드 및 Vultr 배포

## MLM 전용 탭 추가
- [x] 소메뉴 탭 목록에 MLM 탭 추가
- [x] mlmPlans 쿼리 추가
- [x] MLM 탭 콘텐츠 섹션 구현
- [x] 빌드 및 Vultr 배포

## Introduction 소개 페이지 추가
- [ ] Introduction.tsx 페이지 생성 (이전 버전 내용 카피)
- [ ] App.tsx에 /introduction 라우트 추가
- [ ] 상단 네비게이션에 About B-BAG 드롭다운에 소개 링크 추가
- [ ] 빌드 및 Vultr 배포

## 버그 수정 - 드롭다운 및 지갑 자동팝업 (2026-04-02)
- [x] About B-BAG 드롭다운 메뉴 클릭 불가 버그 수정 (gap 제거)
- [x] 지갑 연결 자동 팝업 제거 (API 401 오류 시 자동 모달 오픈 제거)

## 마이그레이션 완료

- [x] alphabag.net에서 17개 플랜 데이터 수집
- [x] 13개 로고 이미지 CDN 업로드
- [x] Vultr DB 더미 데이터(29개) 삭제
- [x] Manus 개발 DB 더미 데이터(29개) 삭제
- [x] 현재 사이트 DB 정리 완료 (17개 플랜 유지)

## 버그 수정 및 로고 추가 (2차)

- [ ] About B-BAG 드롭다운 하위 메뉴 클릭 버그 수정
- [ ] 페이지 진입 시 지갑 연결 모달 자동 팝업 제거
- [ ] WALLX/NGP/PINDEX/LTF 플랜 로고 이미지 추가

## 베타테스트 공지 팝업
- [x] 세련된 베타테스트 공지 팝업 컴포넌트 제작 (BetaNoticeModal.tsx)
- [x] Home.tsx에 팝업 적용 (최초 방문 시 1회 표시, localStorage로 닫기 상태 저장)

## Phase 50 - 1page.to 연동 + 모달 이미지 짤림 수정 (2026-04-02)
- [ ] 플랜 상세 모달 이미지 짤림 수정 (스크롤 가능하도록 개선)
- [ ] DB plans 테이블에 onepageUrl 컬럼 추가
- [ ] 1page.to 10개 프로젝트 URL DB 업데이트
- [ ] 플랜 카드 "상세페이지 보기" → "1page 보기" 버튼으로 교체 (onepageUrl 있는 경우)
- [ ] 플랜 상세 모달에 "1page 보기" 버튼 추가
- [ ] Vultr 서버 빌드 및 배포

## Phase 50 - 1page.to 연동 + 모달 이미지 짤림 수정 (2026-04-02)
- [x] 모달 이미지 짤림 수정 (overflow-y-auto + min-h-0 적용)
- [x] DB onepageUrl 컬럼 추가 (investmentPlans 테이블)
- [x] 1page.to 10개 프로젝트 로고 CDN 업로드
- [x] 7개 신규 프로젝트 DB 삽입 (XPLAY, OpenOcto, NEXUS 2140, BENEFER, HABIBIDECK, SquidVerse, ARAI Systems)
- [x] 기존 3개 플랜 onepageUrl 연결 (NICE, B BAG LOOMX, PINDEX)
- [x] PlanDetailModal에 1page 보기 버튼 추가 (개요 탭 + 하단 액션바)
- [x] drizzle schema에 onepageUrl 컬럼 추가 및 마이그레이션
- [x] Vultr 서버 배포 완료

## Phase 51 - 언어 변경 기능 완전 수정 (2026-04-02)
- [ ] 언어 드롭다운 선택 시 번역 적용 안 되는 문제 수정
- [ ] 컴포넌트 하드코딩 한국어 → t() 키로 교체 (Home.tsx, MainNav.tsx 등)
- [ ] 한국어 5번째 순서 확인
- [ ] Vultr 배포

## Phase 51 (계속) - 언어 변경 미작동 문제 분석 (2026-04-02)
- [x] i18n.ts에 21개 언어 home 섹션 완성 (searchPlaceholder: "Search AlphaBag plans, strategies..." 등)
- [x] Home.tsx에서 `t("home.searchPlaceholder")` 사용 확인
- [x] main.tsx에 I18nextProvider 추가
- [x] Vultr 서버 배포 완료
- [ ] **문제:** localStorage.i18nextLng = "en"인데도 화면은 한국어로 표시됨
- [ ] **원인:** `t()` 함수가 `en` 번역을 찾지 못하고 `ko`로 fallback
- [ ] **해결 필요:** i18n 초기화 시 언어 리소스 로드 실패 또는 useTranslation 훅 리렌더링 문제

## Phase 51 - 언어 변경 기능 완전 수정 (2026-04-02)
- [x] 한국어 5번째 순서 (en, zh, ja, vi, ko, th...)
- [x] i18n.ts에 21개 언어 home 섹션 추가 (searchPlaceholder, tabs, tabTitles 등)
- [x] Home.tsx 하드코딩 한국어 → t() 키로 교체
- [x] MainNav.tsx 하드코딩 한국어 → t() 키로 교체
- [x] main.tsx에 I18nextProvider 추가
- [x] Docker 컨테이너 내부 /app/dist에 최신 빌드 tar 해제 (경로 수정)
- [x] 언어 변경 시 리렌더링 정상 작동 확인 (영어 선택 시 전체 UI 영어로 변경)

## 버그 수정 및 기능 개선 (2026-04-08)
- [x] 공지 항목 클릭 시 상세 모달 표시 (NoticeDetailModal 컴포넌트 추가)
- [x] 번역 누락 키 수정 - 20개 언어에 meetup/expo 탭 번역 추가
- [x] WALLX 로고 이미지 업데이트 (id=4)
- [x] PINDEX 로고 이미지 업데이트 (id=16)
- [x] LTF 로고 이미지 업데이트 (id=17)
- [x] AWS Lightsail 서버 배포 (alphabag.net)

## Phase 55 - FAQ/Q&A 기능 강화 (2026-04-08)
- [x] Q&A 답변 시 텔레그램 알림 (qna.answer 프로시저에 텔레그램 DM 발송)
- [x] 관리자 Content 페이지 FAQ 카테고리 필터 (일반/투자/계정/결제/기술)
- [x] 관리자 Content 페이지 Q&A 상태 필터 (전체/미답변/답변완료)
- [x] 사용자 FAQ 페이지 카테고리 한국어 표시 (getCategoryLabel)
- [x] 사용자 Q&A 탭 텔레그램 알림 안내 메시지 추가
- [x] FAQ/Q&A 테스트 8개 추가 (총 96개 통과)

## Phase 56 - FAQ 번역 버튼 + Q&A 카테고리 필터 (2026-04-08)
- [x] 관리자 Content FAQ 탭 - 각 항목 옆 번역 버튼 추가 (faq.translate 프로시저 연동, 이미 구현됨)
- [x] 사용자 FAQ 페이지 Q&A 탭 - 카테고리 필터 추가 (일반/투자/계정/결제/기술)

## Phase 57 - Q&A 검색/페이지네이션 + FAQ 순서 관리 (2026-04-08)
- [x] 사용자 Q&A 탭 키워드 검색 기능 (질문/답변 내용 검색)
- [x] 관리자 FAQ 탭 드래그앤드롭 순서 변경 (sortOrder 업데이트)
- [x] 사용자 Q&A 탭 더 보기 페이지네이션 (10개씩 로드)

## Phase 58 - 공지사항 번역 표시 버그 수정 (2026-04-08)
- [ ] 공지사항 notices 번역 필드 DB 구조 확인 (titleZh, titleEn 등)
- [ ] 공지사항 list 프로시저에서 번역 필드 반환 여부 확인
- [ ] 홈페이지/공지사항 페이지 다국어 필드 적용 수정

## Phase 59 - 공지사항 페이지 FAQ/Q&A 탭 + 번역 수정 (2026-04-08)
- [x] Home.tsx 공지 박스에 공지/FAQ/Q&A 탭 추가 (탭 전환 UI)
- [x] Home.tsx 공지 목록 번역 필드 적용 (getLocalizedField 헬퍼)
- [x] NoticeDetailModal.tsx 번역 필드 적용 (title/content 언어별 표시)
- [x] Home.tsx FAQ/Q&A 탭에서 trpc.faq.list, trpc.qna.listPublic 데이터 로드

## Phase 60 - 번역 UX 개선 + 공지 박스 높이 고정 (2026-04-08)
- [x] 관리자 Content 공지사항 탭 - 번역 버튼 상태(번역중/완료/재번역) 표시 + 번역됨 배지
- [x] 관리자 Content FAQ 탭 - 번역 버튼 상태(번역중/완료/재번역) 표시 + 번역됨 배지
- [x] 홈페이지 공지 박스 min-h-[200px] 고정 (탭 전환 시 레이아웃 안정화)

## Phase 61 - 일괄 번역 + 탭 다국어 + Q&A 배지 (2026-04-08)
- [ ] 관리자 Content 공지사항 탭 상단 "미번역 일괄 번역" 버튼
- [ ] 관리자 Content FAQ 탭 상단 "미번역 일괄 번역" 버튼
- [ ] 홈 공지 박스 탭 라벨 i18n 다국어화 (공지/FAQ/Q&A → 언어별)
- [ ] 홈 공지 박스 Q&A 탭 버튼 옆 미답변 카운트 빨간 배지

## Phase 61 - 일괄 번역 + 탭 다국어 + Q&A 미답변 배지 (2026-04-08)
- [x] 관리자 Content 공지/FAQ 탭 - 미번역 일괄 번역 버튼 추가 (translateAll 프로시저)
- [x] 홈 공지 박스 탭 라벨 i18n 다국어화 (21개 언어 tabNotice/tabFaq/tabQna 키 추가)
- [x] Q&A 탭 미답변 카운트 빨간 배지 (미답변 수 실시간 표시)

## Phase 62 - 번역 UX 개선 + Q&A 이메일 알림 (2026-04-08)
- [x] 관리자 Content 공지/FAQ 탭 번역 완료 수/전체 수 표시 (번역됨 N/M 형식)
- [x] Q&A 답변 시 이메일 알림 기능 (BUILT_IN_FORGE_API /v1/email/send 활용)
- [x] Q&A 답변 시 텔레그램 + 이메일 동시 알림 (둘 다 지원)

## Phase 63 - 내 Q&A 마이페이지 + 번역 UX (2026-04-08)
- [x] 서버 qna.listMine 프로시저 확인 (이미 구현됨)
- [x] 마이페이지(ProfilePage.tsx)에 '내 Q&A' 섹션 추가 (아코디언 펼치기, 비밀글 잠금 아이콘, 답변완료/답변대기 배지)
- [x] 질문 클릭 시 질문+답변 상세 표시 (답변 시간 포함)

## Phase 64 - Q&A 삭제/수정 + 알림 설정 토글 (2026-04-08)
- [ ] 서버 qna.deleteMine 프로시저 (답변 전 본인 질문 삭제)
- [ ] 서버 qna.updateMine 프로시저 (답변 전 본인 질문 수정)
- [ ] DB users 테이블에 qnaNotifyTelegram, qnaNotifyEmail 컬럼 추가
- [ ] 서버 user.updateQnaNotification 프로시저 추가
- [ ] 마이페이지 내 Q&A - 삭제/수정 버튼 UI 추가
- [ ] 마이페이지 - Q&A 알림 설정 토글 (텔레그램/이메일 선택)

## Phase 58 - Twitter 수집 주기 차등 설정
- [ ] DB snsInfluencers 테이블에 fetchIntervalHours 필드 추가
- [ ] 핵심 4명(elonmusk/realDonaldTrump/cz_binance/haileycrypto) fetchIntervalHours=1 설정
- [ ] 나머지 인플루언서 fetchIntervalHours=3 설정
- [ ] twitterFetchScheduler.ts 로직 변경 (개별 인플루언서 lastFetchedAt + fetchIntervalHours 기반 차등 수집)
- [ ] 프로덕션 DB 마이그레이션 및 배포

## Phase 58 - 핵심 인플루언서 트윗 자동 알림 + 차등 수집 주기
- [ ] DB snsInfluencers에 fetchIntervalHours(int, default 3), alertOnNewPost(boolean, default false) 필드 추가
- [ ] DB 마이그레이션 실행
- [ ] 핵심 4명(elonmusk/realDonaldTrump/cz_binance/허이) fetchIntervalHours=1, alertOnNewPost=true 설정
- [ ] twitterFetchScheduler: lastFetchedAt + fetchIntervalHours 기반 차등 수집 로직
- [ ] 신규 트윗 감지 시 alertOnNewPost=true 인플루언서만 텔레그램 채널 자동 알림 발송
- [ ] 알림 메시지 포맷: 인플루언서명 + 트윗 내용 + 원문 링크
- [ ] 프로덕션 배포

## Phase 59 - KOL 100명 Filtered Stream 실시간 수집 + 백오피스 비용 정산 UI
- [ ] 글로벌 금융/암호화폐 주요 KOL 100명 조사 (일론머스크, 트럼프, CZ, 허이 포함)
- [ ] DB snsInfluencers에 fetchIntervalHours, alertOnNewPost 필드 추가 및 마이그레이션
- [ ] KOL 100명 twitterUserId 포함하여 DB 삽입
- [ ] twitterFetchScheduler → Filtered Stream 방식으로 전환 (실시간 수집)
- [ ] 신규 트윗 감지 시 alertOnNewPost=true 인플루언서 텔레그램 자동 알림
- [ ] 백오피스 KOL 관리 페이지에 비용 정산 섹션 추가
  - KOL 1명 추가 시 월 예상 비용 표시 ($0.005 × 평균 트윗 수 × 30일)
  - 전체 KOL 월 총 예상 비용 실시간 계산
  - 실제 누적 트윗 수 기반 이번 달 비용 표시
- [ ] 프로덕션 배포

## Phase 59 완료 - KOL 100명 + 비용 정산 UI
- [x] KOL 105명 DB 삽입 (기존 27명 + 신규 78명)
- [x] 핵심 4명 alertOnNewPost=true, autoFetchEnabled=true 설정
- [x] twitterStreamScheduler.ts 구현 (Filtered Stream 실시간 수집)
- [x] 서버 인덱스에 startTwitterStreamScheduler 등록
- [x] sns.snsStats 프로시저 추가 (비용 정산 데이터)
- [x] updateInfluencer에 fetchIntervalHours, alertOnNewPost, estimatedDailyTweets 필드 추가
- [x] 백오피스 SNS 페이지에 비용 정산 탭 추가
  - [x] KOL 요약 카드 (전체/자동수집/실시간알림/이번달수집)
  - [x] 예상 월 API 비용 + 예산 대비 진행률 바
  - [x] 카테고리별 비용 분석
  - [x] KOL 개별 비용 현황 테이블
  - [x] 비용 최적화 가이드
- [x] 인플루언서 다이얼로그에 수집주기/일평균트윗/실시간알림 필드 추가
- [x] 인플루언서 목록에 실시간 알림 배지 추가

## Phase 62 - 일괄 번역 버튼 + 동영상 오버레이 + KOL 트윗 수 컬럼
- [ ] 서버: translateAllPosts 프로시저 (미번역 트윗 일괄 번역)
- [ ] 백오피스 Sns.tsx: 일괄 번역 실행 버튼 + 진행 상태 표시
- [ ] 백오피스 Sns.tsx: KOL 목록에 수집된 트윗 수 컬럼 추가
- [ ] Home.tsx: 동영상 미디어 재생 버튼 오버레이 UI
- [ ] Sns.tsx: 동영상 미디어 재생 버튼 오버레이 UI

## Phase 62 완료 - 일괄 번역 버튼 + 동영상 오버레이 + KOL 트윗 수 컬럼
- [x] 서버: translateAllPosts 프로시저 (미번역 트윗 일괄 번역, batchSize 지원)
- [x] 서버: translatePost 프로시저 (targetLang 파라미터 지원)
- [x] DB: snsPosts에 translatedContent, mediaUrls, translatedAt 컬럼 추가
- [x] 백오피스 Sns.tsx: 일괄 번역 버튼 (보라색, 스피너 애니메이션)
- [x] 백오피스 Sns.tsx: 번역 결과 배너 (완료 개수 + 남은 미번역 개수)
- [x] 백오피스 Sns.tsx: 포스트별 번역 버튼 + 동영상 오버레이 (재생 버튼)
- [x] Home.tsx: SNS 피드 동영상 재생 버튼 오버레이 (backdrop-blur 원형 버튼)
- [x] Home.tsx: 미디어 이미지 그리드 (1개=1컬, 2개+=2컬)
- [x] Home.tsx: 사용자 언어 기준 번역 버튼 (영어 사용자 제외)

## Phase 63 - 번역 언어 드롭다운 + 자동 번역 토글 + twitterUserId 일괄 등록
- [ ] DB: snsInfluencers에 autoTranslate(boolean), autoTranslateLang(varchar) 컬럼 추가
- [ ] 서버: translateAllPosts에 targetLang 파라미터 추가
- [ ] 서버: updateInfluencer에 autoTranslate, autoTranslateLang 필드 추가
- [ ] 서버: twitterFetchScheduler/StreamScheduler에 autoTranslate KOL 자동 번역 연동
- [ ] 서버: bulkUpdateTwitterIds 프로시저 (쉼표 구분 일괄 등록)
- [ ] 백오피스 Sns.tsx: 일괄 번역 버튼 옆 언어 선택 드롭다운 (한국어/중국어/일본어/영어 등)
- [ ] 백오피스 Sns.tsx: KOL 편집 다이얼로그에 자동 번역 토글 + 번역 언어 선택
- [ ] 백오피스 Sns.tsx: twitterUserId 일괄 등록 UI (쉼표 구분 입력창 + 등록 버튼)

## Phase 63 완료 - 번역 언어 드롭다운 + 자동 번역 토글 + twitterUserId 일괄 등록
- [x] DB: snsInfluencers에 autoTranslate(boolean), autoTranslateLang(varchar) 컬럼 추가
- [x] 서버: updateInfluencer에 autoTranslate, autoTranslateLang 필드 추가
- [x] 서버: bulkUpdateTwitterIds 프로시저 (핸들,ID 쌍 일괄 업데이트)
- [x] 서버: twitterFetchScheduler - 미디어 URL 수집 (photo/video/gif) + autoTranslate 연동
- [x] 백오피스 Sns.tsx: 번역 언어 드롭다운 (15개 언어: 한/중/일/영/베/태/인도네/러/아랍/스/포/불/독/터/힌)
- [x] 백오피스 Sns.tsx: 일괄 번역 버튼이 선택된 언어로 번역 실행
- [x] 백오피스 Sns.tsx: KOL 설정 다이얼로그에 자동 번역 토글 + 번역 언어 선택 추가
- [x] 백오피스 Sns.tsx: ID 일괄 등록 버튼 (주황색) + 다이얼로그 (핸들,ID 형식 입력)
- [x] 백오피스 Sns.tsx: 일괄 등록 결과 토스트 (업데이트 수 + 미발견 핸들 표시)

## Phase 64 완료 - infoweb4 → 1page.to 브랜딩 교체
- [x] i18n.ts: 25개 언어 전체에서 InfoWeb4 → 1page.to 텍스트 교체
- [x] Home.tsx: infoweb4 탭 아이콘 🌐 → 1page 텍스트 로고로 교체
- [x] Home.tsx: infoweb4 탭 섹션 내 링크/텍스트 1page.to로 통일
- [x] PlanDetailModal.tsx: infoweb4 주석 → 1page.to 주석 교체
- [x] TypeScript 오류 없음 확인

## Phase 65 - SNS 번역 버튼 버그 수정 (2026-04-10)
- [x] translatePost 프로시저를 adminProcedure → publicProcedure로 변경 (로그인 없이 번역 가능)
- [x] 번역 완료 후 로컬 캐시(snsLocalTranslations)에 즉시 저장하여 UI 즉시 업데이트
- [x] 번역 버튼 표시 조건 개선: isNonEnglish 기준으로 항상 표시, 로컬 캐시 우선 참조
- [x] onError 핸들러에 console.error 추가 (디버깅 개선)

## Phase 67 - CBAG 보험 컬렉션 구현 (2026-04-11)
- [x] DB: investments 테이블에 cbagPlanId, cbagPercent, cbagAmount 필드 추가
- [x] DB: cbagSettings 테이블 추가 (CBAG 전역 이름/설명/활성화 설정)
- [x] tRPC: cbag.settings, cbag.updateSettings, cbag.autoDescribe(LLM) 프로시저
- [x] tRPC: invest 프로시저에 cbagPlanId, cbagPercent 파라미터 추가
- [x] UI: 투자 플로우 마지막에 CBAG 추가 여부 모달 (% 직접 설정)
- [x] UI: 골든 섹션에 CBAG 필수 포함 배너/섹션
- [ ] UI: CbagPage 개선 (보험 컬렉션 컨셉으로 리디자인)
- [x] 백오피스: CBAG 전용 관리 탭 (이름 설정, 상품 관리, LLM 자동 정리)
- [ ] 백오피스: Plans.tsx에 CBAG 탭 추가

## Phase 68 - 전체 탭 REST API + API 키 인증 시스템 (2026-04-11)
- [x] DB: apiKeys 테이블 (id, name, key, partnerId, isActive, callCount, lastUsedAt)
- [x] DB: apiLogs 테이블 (id, apiKeyId, endpoint, method, statusCode, createdAt)
- [x] 서버: API 키 인증 미들웨어 (Bearer 토큰 검증, 로그 기록)
- [x] REST API: GET /api/v1/tabs/recommended (추천 플랜)
- [x] REST API: GET /api/v1/tabs/bbag (B-BAG 상품)
- [x] REST API: GET /api/v1/tabs/sns (SNS 피드)
- [x] REST API: GET /api/v1/tabs/trending (급등토큰 - CoinGecko)
- [x] REST API: GET /api/v1/tabs/airdrop (에어드럽)
- [x] REST API: GET /api/v1/tabs/news (뉴스)
- [x] REST API: GET /api/v1/tabs/contents (콘텐츠)
- [x] REST API: GET /api/v1/tabs/live (라이브)
- [x] REST API: GET /api/v1/tabs/mlm (MLM/레퍼럴)
- [x] REST API: GET /api/v1/tabs/meetup (밋업)
- [x] REST API: GET /api/v1/tabs/expo (엑스포)
- [x] 백오피스: /admin/api-keys 페이지 (키 발급/비활성화/사용량 통계)
- [x] 문서: GET /api/docs (OpenAPI JSON + AI 친화적 마크다운 문서 페이지)
- [x] AdminLayout에 API 키 관리 메뉴 추가

## Phase 69 - API 키 고도화 + 즐겨찾기 탭 API (2026-04-11)
- [x] 백오피스: API 키 비활성화/재활성화 토글 버튼
- [x] 백오피스: API 키 재발급 버튼 (기존 키 무효화 + 새 키 발급)
- [x] tRPC: apiKeys.toggleActive 프로시저 (활성화/비활성화)
- [x] tRPC: apiKeys.regenerate 프로시저 (재발급)
- [x] 백오피스: 파트너사별 일별/시간별 API 호출량 차트
- [x] 백오피스: 엔드포인트별 호출 빈도 통계 테이블
- [x] tRPC: apiKeys.logs 프로시저 (apiLogs 집계 조회)
- [x] REST API: GET /api/v1/tabs/favorites (사용자 JWT 토큰 기반 즐겨찾기)
- [x] DB: userFavorites 테이블 이미 존재 (userId, planId, createdAt)
- [ ] REST API: POST /api/v1/tabs/favorites (즐겨찾기 추가) - 추후 구현
- [ ] REST API: DELETE /api/v1/tabs/favorites/:planId (즐겨찾기 삭제) - 추후 구현
- [x] /api/v1/info 엔드포인트 목록에 favorites 추가

## Phase 71 - 푸터 고도화 (다국어/약관/소셜)
- [x] i18n: footer.disclaimer, footer.philosophy 번역 키 추가 (21개 언어)
- [x] 이용약관 페이지 (/terms)
- [x] 개인정보처리방침 페이지 (/privacy)
- [x] App.tsx에 /terms, /privacy 라우트 등록
- [x] 푸터 소셜 링크 아이콘 (텔레그램, 트위터, 유튜브)
- [x] 푸터 하단에 이용약관/개인정보처리방침 링크 추가

## Phase 72 - 소셜 링크 백오피스 관리 + 약관 백오피스 편집 + Terms/Privacy 다국어 (2026-04-19)
- [x] DB: siteSettings 테이블 추가 (telegramUrl, twitterUrl, youtubeUrl)
- [x] DB: legalDocuments 테이블 추가 (type, language, content, updatedAt)
- [x] DB 마이그레이션 실행
- [x] tRPC: settings.getSocialLinks (publicProcedure)
- [x] tRPC: settings.updateSocialLinks (adminProcedure)
- [x] tRPC: legal.getDocument (publicProcedure)
- [x] tRPC: legal.updateDocument (adminProcedure)
- [x] tRPC: legal.autoGenerate (adminProcedure, LLM 자동 생성)
- [x] 백오피스: /admin/site-settings 페이지 (소셜 링크 편집)
- [x] 백오피스: /admin/legal 페이지 (약관/개인정보처리방침 편집 + LLM 버튼)
- [x] AdminLayout: 사이트 설정, 법적 문서 메뉴 추가
- [x] Home.tsx: 소셜 링크 하드코딩 → DB 동적 로드
- [x] i18n: terms/privacy 다국어 번역 키 추가 (21개 언어)
- [x] Terms.tsx: i18n 다국어 + DB 동적 콘텐츠 렌더링
- [x] Privacy.tsx: i18n 다국어 + DB 동적 콘텐츠 렌더링
- [x] App.tsx: /admin/site-settings, /admin/legal 라우트 등록
- [x] 테스트 작성 (125개 모두 통과)

## Phase 73 - AI 자동화 플랜 등록 고도화 (2026-04-21)
- [x] tRPC: aiPlanImport.generateLogo (AI 로고 자동 생성 - 플랜명 기반)
- [x] tRPC: aiPlanImport.searchYouTube (YouTube 관련 영상 자동 검색)
- [x] tRPC: aiPlanImport.parseFromUrl (원페이지 URL 크롤링 + LLM 파싱)
- [x] tRPC: aiPlanImport.fullAutoFill (PPT/이미지/텍스트 → 전체 필드 + 로고 + 영상 한번에)
- [x] AiPlanImport.tsx 전면 개편: 3단계 마법사 UI (파싱 → 로고/영상 → 최종 등록)
- [x] 로고 AI 생성 탭: 생성된 로고 3개 옵션 중 선택
- [x] YouTube 영상 검색 탭: 검색 결과 카드에서 선택 → videoUrl/videoUrl2 자동 채우기
- [x] 원페이지 URL 입력 탭: URL 붙여넣기 → 자동 파싱
- [x] 전체 필드 미리보기 편집기: 파싱된 결과 모든 필드 인라인 수정 가능
- [x] planType 자동 감지 (golden/self/leader/influencer/meme/node)
- [x] 등록 완료 후 플랜 상세 페이지 바로가기 링크
- [x] 테스트 작성 (138개 모두 통과)

## Phase 74 - 백오피스 사이드바 수정 + 메뉴 다국어 (2026-04-22)
- [x] AdminLayout 사이드바 스크롤 수정 (메뉴 잊림 방지, overflow-y-auto)
- [x] AdminLayout 메뉴 전체 한국어/영어 혼재 → i18n 다국어 처리
- [x] 백오피스 사이드바에 언어 선택기 추가 (21개 언어 드롭다운)
- [x] i18n.ts 21개 언어 adminNav 번역 키 추가
- [x] 테스트 확인 및 체크포인트 저장

## Phase 75 - 백오피스 AdminLayout 전면 개편 (2026-04-22)
- [x] 사이드바 메뉴를 4개 카테고리로 그룹화 (플랜 관리 / 콘텐츠 / 사용자 / 시스템)
- [x] 카테고리별 접기/펼치기 (accordion) 기능
- [x] 모바일 반응형: 햄버거 버튼 + 오버레이 사이드바
- [x] 모바일 상단 topbar에 햄버거 버튼 추가
- [x] 다국어 UI: 카테고리 레이블 i18n 처리
- [x] i18n.ts 21개 언어에 adminNav.catPlan/catContent/catUsers/catSystem 번역 키 추가
- [x] TypeScript 오류 0개 확인
- [x] 체크포인트 저장

## Phase 76 - 메인↔백오피스 매칭 + 전체 기능 상용화 (2026-04-22)

### 분석 결과: 메인 페이지 탭 vs 백오피스 매칭 현황
- recommend/bbag/mlm → 플랜 관리로 커버됨 ✅
- sns → /admin/sns ✅
- trending → /admin/trending-alerts ✅
- airdrop → /admin/airdrops ✅
- news → 백오피스 없음 ❌
- contents → 백오피스 없음 ❌
- live → 백오피스 없음 ❌
- meetup → 백오피스 없음 ❌
- expo → 백오피스 없음 ❌
- infoweb4(1page.to) → 백오피스 없음 ❌
- faq/qna → /admin/content 내 FAQ 탭 있음 ✅
- about/introduction → 백오피스 없음 ❌
- favorites → 사용자 기능 (백오피스 불필요)
- cbag → /admin/cbag ✅
- partners → /admin/partners ✅
- listing → /admin/listing-requests ✅

### 백오피스 추가 기능
- [ ] 대시보드 숫자 포맷 i18n (천 단위 구분자, 통화 기호)
- [ ] 사이드바 카테고리 접기/펼치기 상태 localStorage 저장
- [ ] 사이드바 알림 배지 (미처리 티켓/신청/노드 주문 수)
- [ ] /admin/news - 뉴스 관리 페이지 (news 탭 콘텐츠 관리)
- [ ] /admin/contents - 콘텐츠/영상 관리 페이지 (contents 탭)
- [ ] /admin/live - 라이브 방송 관리 (라이브 스트림 URL 관리)
- [ ] /admin/meetup - 밋업/행사 일정 관리
- [ ] /admin/expo - 엑스포/컨퍼런스 관리
- [ ] /admin/about - About/Introduction 페이지 콘텐츠 관리
- [ ] AdminLayout에 위 메뉴 추가 (콘텐츠 카테고리)
- [ ] App.tsx에 위 라우트 등록
- [ ] URL 파싱 오류 수정 (parseFromUrl CORS 우회)
- [ ] 이미지 업로드 오류 수정 (AI 로고 생성)
- [ ] 전체 기능 테스트 및 오류 수정
- [ ] 체크포인트 저장

## Phase 76 완료 - 메인↔백오피스 매칭 + Home.tsx DB 연동 (2026-04-22)
- [x] AdminLayout.tsx catContent에 뉴스/라이브/이벤트 메뉴 항목 추가 (Newspaper/Tv/Calendar 아이콘)
- [x] i18n.ts 21개 언어에 newsLabel/liveLabel/eventsLabel 번역 키 추가
- [x] Home.tsx news 탭 → DB 동적 연동 (newsItems 쿼리, 빈 상태/로딩 처리)
- [x] Home.tsx live 탭 → DB 동적 연동 (liveStreamItems 쿼리, 썸네일/LIVE 배지)
- [x] Home.tsx meetup 탭 → DB 동적 연동 (meetupItems 쿼리, 이미지/날짜/장소)
- [x] Home.tsx expo 탭 → DB 동적 연동 (expoItems 쿼리) + NEXUS 2140 고정 카드 유지
- [x] events.list 라우터에 type 필터링 실제 적용 (and() 조건 추가)
- [x] server/news.live.events.test.ts 테스트 파일 추가 (8개 테스트 통과)
- [x] 전체 테스트 146개 통과 (TypeScript 오류 0개)

## Phase 77 - 백오피스 UX 3종 개선 (2026-04-22)
- [x] 백엔드: dashboard.adminBadges 프로시저 (미처리 티켓/대기 노드주문/신규 신청 카운트) - 이미 구현됨
- [x] AdminLayout.tsx: trpc.dashboard.adminBadges 쿼리 (60초 주기 폴링)
- [x] AdminLayout.tsx: Tickets/Nodes/Submissions 메뉴 옆 빨간 숫자 배지 표시 (99+ 처리)
- [x] AdminLayout.tsx: 카테고리 접기/펼치기 상태 localStorage 저장 (페이지 이동 후 유지) - 이미 구현됨
- [x] 숫자 포맷 i18n 유틸 함수 (formatNumber, formatCurrency, formatCompact) - 언어별 Intl.NumberFormat
- [x] 백오피스 Dashboard.tsx 통계 카드/차트 tooltip/테이블 금액에 formatCurrency/formatNumber 적용
- [x] 백오피스 Analytics.tsx 통계 카드/차트/테이블 금액에 formatCurrency/formatNumber 적용
- [x] formatNumber.test.ts 테스트 12개 추가 (전체 158개 통과)
