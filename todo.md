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
