import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useWallet } from "@/contexts/WalletContext";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Star, ChevronRight, Bell, Shield, Zap, Globe,
  Users, BarChart3, Menu, X, ShoppingCart, LogOut,
  Wallet, ExternalLink, Video, MessageSquare
} from "lucide-react";
import { PlanDetailModal } from "@/components/PlanDetailModal";
import { ReferralMessageModal } from "@/components/ReferralMessageModal";
import { MeetingNoticeModal } from "@/components/MeetingNoticeModal";

// CDN URLs
const ALPHABAG_LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663373200888/TGrbnQ7ygm6GBAS6CWnuGe/alphabag-logo_df90878d.png";
const AD_DOLLARS = "https://d2xsxph8kpxj0f.cloudfront.net/310519663373200888/TGrbnQ7ygm6GBAS6CWnuGe/ad-dollars_88f0319b.jpg";
const AD_TRADING = "https://d2xsxph8kpxj0f.cloudfront.net/310519663373200888/TGrbnQ7ygm6GBAS6CWnuGe/ad-trading_0ad7d05d.jpg";

// ─── 플랜 카드 컴포넌트 ────────────────────────────────────────────────────────
function PlanCard({ plan, collectionColor }: { plan: any; collectionColor: string }) {
  const badges: string[] = Array.isArray(plan.badgeLabels) ? plan.badgeLabels : [];
  const rating = Number(plan.rating) || 4.0;

  const colorMap: Record<string, { border: string; glow: string; badge: string; rate: string; btn: string; overlay: string }> = {
    golden: {
      border: "border-amber-500/30",
      glow: "hover:shadow-amber-500/40",
      badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      rate: "text-amber-400",
      btn: "bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30",
      overlay: "from-amber-900/60",
    },
    self: {
      border: "border-blue-500/30",
      glow: "hover:shadow-blue-500/40",
      badge: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      rate: "text-blue-400",
      btn: "bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30",
      overlay: "from-blue-900/60",
    },
    node: {
      border: "border-purple-500/30",
      glow: "hover:shadow-purple-500/40",
      badge: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      rate: "text-purple-400",
      btn: "bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-purple-500/30",
      overlay: "from-purple-900/60",
    },
    leader: {
      border: "border-emerald-500/30",
      glow: "hover:shadow-emerald-500/40",
      badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      rate: "text-emerald-400",
      btn: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30",
      overlay: "from-emerald-900/60",
    },
    meme: {
      border: "border-pink-500/30",
      glow: "hover:shadow-pink-500/40",
      badge: "bg-pink-500/20 text-pink-300 border-pink-500/30",
      rate: "text-pink-400",
      btn: "bg-pink-500/20 text-pink-300 border-pink-500/30 hover:bg-pink-500/30",
      overlay: "from-pink-900/60",
    },
    influencer: {
      border: "border-orange-500/30",
      glow: "hover:shadow-orange-500/40",
      badge: "bg-orange-500/20 text-orange-300 border-orange-500/30",
      rate: "text-orange-400",
      btn: "bg-orange-500/20 text-orange-300 border-orange-500/30 hover:bg-orange-500/30",
      overlay: "from-orange-900/60",
    },
  };

  const c = colorMap[collectionColor] || colorMap.golden;

  return (
    <Link href={`/plan/${plan.id}`}>
      <div
        className={`relative bg-[#0d0d0d] border ${c.border} rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${c.glow} group`}
      >
        {/* 카드 이미지 영역 - 호버 시 확대 */}
        <div className="relative h-36 overflow-hidden">
          {plan.logoUrl ? (
            <img
              src={plan.logoUrl}
              alt={plan.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center transition-transform duration-500 group-hover:scale-110 ${
              collectionColor === "golden" ? "bg-gradient-to-br from-amber-900/40 to-amber-600/20" :
              collectionColor === "self" ? "bg-gradient-to-br from-blue-900/40 to-blue-600/20" :
              "bg-gradient-to-br from-purple-900/40 to-purple-600/20"
            }`}>
              <span className={`text-5xl font-black opacity-30 ${c.rate}`}>
                {plan.name.charAt(0)}
              </span>
            </div>
          )}
          {/* 오버레이 그라디언트 */}
          <div className={`absolute inset-0 bg-gradient-to-t ${c.overlay} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
          {/* 하이라이트 배지 */}
          {plan.isHighlight && (
            <div className="absolute top-2 right-2">
              <Badge className="text-[10px] px-1.5 py-0.5 bg-amber-500/90 text-black border-0 font-bold">HOT</Badge>
            </div>
          )}
        </div>

        {/* 카드 내용 */}
        <div className="p-4">
          {/* 상단 라인 (하이라이트) */}
          {plan.isHighlight && (
            <div className={`absolute top-0 left-0 right-0 h-[2px] ${
              collectionColor === "golden" ? "bg-gradient-to-r from-transparent via-amber-400 to-transparent" :
              collectionColor === "self" ? "bg-gradient-to-r from-transparent via-blue-400 to-transparent" :
              "bg-gradient-to-r from-transparent via-purple-400 to-transparent"
            }`} />
          )}

          {/* 이름 */}
          <div className="font-bold text-white text-sm truncate mb-1">{plan.name}</div>
          {plan.strategy && (
            <div className="text-xs text-gray-500 truncate mb-2">{plan.strategy}</div>
          )}

          {/* 배지 태그 */}
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {badges.slice(0, 3).map((b: string, idx: number) => (
                <span key={idx} className={`text-[10px] px-2 py-0.5 rounded-full border ${c.badge}`}>
                  {b}
                </span>
              ))}
            </div>
          )}

          {/* 수익률 */}
          <div className="mb-3">
            <div className={`text-2xl font-bold ${c.rate}`}>
              {Number(plan.dailyRate).toFixed(2)}%
            </div>
            <div className="text-xs text-gray-500">Daily Return</div>
          </div>

          {/* 별점 */}
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-3 h-3 ${s <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-gray-600"}`}
              />
            ))}
            <span className="text-xs text-gray-500 ml-1">{rating.toFixed(1)}</span>
          </div>

          {/* 버튼 */}
          <button className={`w-full py-2 rounded-lg text-xs font-semibold transition-all duration-200 border ${c.btn}`}>
            View Details →
          </button>
        </div>
      </div>
    </Link>
  );
}

// ─── 컬렉션 섹션 ──────────────────────────────────────────────────────────────
function CollectionSection({
  title, subtitle, plans, color, href, icon,
}: {
  title: string; subtitle: string; plans: any[];
  color: string; href: string; icon: React.ReactNode;
}) {
  const colorMap: Record<string, { title: string; dot: string; btn: string }> = {
    golden: { title: "text-amber-400", dot: "bg-amber-400", btn: "text-amber-400 border-amber-400/30 hover:bg-amber-400/10" },
    self: { title: "text-blue-400", dot: "bg-blue-400", btn: "text-blue-400 border-blue-400/30 hover:bg-blue-400/10" },
    node: { title: "text-purple-400", dot: "bg-purple-400", btn: "text-purple-400 border-purple-400/30 hover:bg-purple-400/10" },
    leader: { title: "text-emerald-400", dot: "bg-emerald-400", btn: "text-emerald-400 border-emerald-400/30 hover:bg-emerald-400/10" },
    meme: { title: "text-pink-400", dot: "bg-pink-400", btn: "text-pink-400 border-pink-400/30 hover:bg-pink-400/10" },
    influencer: { title: "text-orange-400", dot: "bg-orange-400", btn: "text-orange-400 border-orange-400/30 hover:bg-orange-400/10" },
  };
  const c = colorMap[color] || colorMap.golden;

  return (
    <section className="mb-14">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${c.dot} animate-pulse`} />
          <div>
            <h2 className={`text-xl font-bold ${c.title} flex items-center gap-2`}>
              {icon} {title}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
          </div>
        </div>
        <Link href={href}>
          <button className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${c.btn}`}>
            View All <ChevronRight className="w-3 h-3 inline" />
          </button>
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {plans.slice(0, 4).map((plan: any) => (
          <PlanCard key={plan.id} plan={plan} collectionColor={color} />
        ))}
      </div>
    </section>
  );
}

// ─── 메인 홈 페이지 ───────────────────────────────────────────────────────────
export default function Home() {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const { isConnected, address, openModal, disconnectWallet } = useWallet();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [noticeIndex, setNoticeIndex] = useState(0);
  const [cartCount] = useState(0);

  const { data: goldenPlans = [] } = trpc.public.goldenPlans.useQuery();
  const { data: selfPlans = [] } = trpc.public.selfPlans.useQuery();
  const { data: nodePlans = [] } = trpc.public.nodePlans.useQuery();
  const { data: leaderPlans = [] } = trpc.public.leaderPlans.useQuery();
  const { data: memePlans = [] } = trpc.public.memePlans.useQuery();
  const { data: influencerPlans = [] } = trpc.public.influencerPlans.useQuery();
  const { data: notices = [] } = trpc.public.notices.useQuery();
  const { data: banners = [] } = trpc.public.banners.useQuery();
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [meetingNotice, setMeetingNotice] = useState<any | null>(null);

  // 공지 롤링
  useEffect(() => {
    if (notices.length <= 1) return;
    const timer = setInterval(() => {
      setNoticeIndex((i) => (i + 1) % notices.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [notices.length]);

  const currentNotice = notices[noticeIndex];

  // 미팅 공지 자동 표시 (type === 'meeting'인 최신 공지)
  useEffect(() => {
    const meetingNotices = (notices as any[]).filter((n: any) => n.type === 'meeting' && n.isActive);
    if (meetingNotices.length > 0 && !meetingNotice) {
      // 자동 팝업은 하지 않고 버튼으로만 표시
    }
  }, [notices]);

  // 광고 배너 이미지 (DB 배너 없으면 기본 이미지 사용)
  const adImages = (banners as any[]).length > 0
    ? (banners as any[]).slice(0, 2).map((b: any) => ({ src: b.imageUrl || AD_DOLLARS, link: b.linkUrl || "#", title: b.title }))
    : [
        { src: AD_DOLLARS, link: "#", title: "Investment Opportunities" },
        { src: AD_TRADING, link: "#", title: "Crypto Trading" },
      ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* ─── 상단 네비게이션 ─── */}
      <nav className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="h-16 flex items-center justify-between gap-4">
            {/* 로고 */}
            <Link href="/">
              <div className="flex items-center gap-2.5 cursor-pointer flex-shrink-0">
                <img
                  src={ALPHABAG_LOGO}
                  alt="AlphaBag"
                  className="w-9 h-9 rounded-lg object-contain bg-black"
                />
                <div>
                  <div className="font-black text-white text-base leading-tight">AlphaBag</div>
                  <div className="text-[10px] text-amber-400/70 leading-tight">Multi-Asset</div>
                </div>
              </div>
            </Link>

            {/* 데스크탑 메뉴 */}
            <div className="hidden md:flex items-center gap-0.5">
              {[
                { href: "/golden", label: "Golden", cls: "hover:text-amber-400 hover:bg-amber-400/5" },
                { href: "/self", label: "Self", cls: "hover:text-blue-400 hover:bg-blue-400/5" },
                { href: "/node", label: "Node", cls: "hover:text-purple-400 hover:bg-purple-400/5" },
                { href: "/notices", label: "Notices", cls: "hover:text-white hover:bg-white/5" },
              ].map((item) => (
                <Link key={item.href} href={item.href}>
                  <button className={`px-3 py-1.5 text-xs text-gray-400 rounded-lg transition-colors ${item.cls}`}>
                    {item.label}
                  </button>
                </Link>
              ))}
            </div>

            {/* 우측 액션 */}
            <div className="flex items-center gap-2">
              {/* 언어 전환 */}
              <LanguageSwitcher />

              {/* 지갑 연결 버튼 */}
              {isConnected ? (
                <button
                  onClick={disconnectWallet}
                  className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-medium hover:bg-amber-500/30 transition-all"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </button>
              ) : (
                <button
                  onClick={openModal}
                  className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  지갑 연결
                </button>
              )}

              {/* 장바구니 */}
              <Link href="/cart">
                <button className="relative flex items-center gap-1.5 h-9 px-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-medium hover:bg-amber-500/20 transition-all">
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">장바구니</span>
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-500 text-black text-[10px] font-bold flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </button>
              </Link>

              {/* 대시보드 (로그인 시) */}
              {isAuthenticated && (
                <Link href="/dashboard">
                  <Button size="sm" variant="ghost" className="text-xs text-gray-400 hover:text-white h-9 px-2">
                    <BarChart3 className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              )}

              {/* 모바일 메뉴 */}
              <button
                className="md:hidden p-1.5 text-gray-400 hover:text-white"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* 모바일 메뉴 */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/5 bg-[#0d0d0d] px-4 py-3 space-y-1">
            {[
              { href: "/golden", label: "Golden Collection", color: "text-amber-400" },
              { href: "/self", label: "Self Collection", color: "text-blue-400" },
              { href: "/node", label: "Node Products", color: "text-purple-400" },
              { href: "/notices", label: "Notices", color: "text-gray-300" },
              { href: "/dashboard", label: "Dashboard", color: "text-gray-300" },
            ].map((item) => (
              <Link key={item.href} href={item.href}>
                <button
                  className={`w-full text-left px-3 py-2 text-sm ${item.color} hover:bg-white/5 rounded-lg transition-colors`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </button>
              </Link>
            ))}
          </div>
        )}
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* ─── 히어로 + 공지 섹션 (2열 레이아웃) ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 좌측: 타이틀 + 설명 */}
          <div className="flex flex-col justify-center">
            <h1 className="text-3xl md:text-4xl font-black mb-3 leading-tight">
              <span className="text-amber-400">AlphaBag</span>
              <span className="text-white"> • Multi-Asset Platform</span>
            </h1>
            <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-md">
              AlphaBag is a community investment platform focused on long-term asset growth through safe diversification.
            </p>

            {/* 통계 */}
            <div className="flex items-center gap-6">
              {[
                { label: "Total Users", value: "663+" },
                { label: "Total Invested", value: "$214K+" },
                { label: "Active Plans", value: "17" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-lg font-bold text-amber-400">{stat.value}</div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 우측: 공지 박스 */}
          <div className="bg-[#111111] border border-white/10 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white font-bold text-base">공지</span>
              <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs px-2 py-0.5">
                NOTICE
              </Badge>
            </div>

            {/* 공지 내용 */}
            {(notices as any[]).length > 0 ? (
              <div className="space-y-2 mb-4">
                {(notices as any[]).slice(0, 3).map((n: any, i: number) => (
                  <div key={n.id} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-amber-400 font-bold flex-shrink-0">{i + 1})</span>
                    <span className="leading-relaxed">{n.title}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2 mb-4">
                <div className="flex items-start gap-2 text-sm text-gray-300">
                  <span className="text-amber-400 font-bold flex-shrink-0">1)</span>
                  <span>Golden / Self / Node / CS 는 별도 페이지입니다.</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-gray-300">
                  <span className="text-amber-400 font-bold flex-shrink-0">2)</span>
                  <span>광고는 이미지 전용(텍스트 없음)입니다.</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-gray-300">
                  <span className="text-amber-400 font-bold flex-shrink-0">3)</span>
                  <span>지갑 연결 후 Add / Go / Cart 사용 가능합니다.</span>
                </div>
              </div>
            )}

            {/* 하단 링크 */}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-white/5">
              <Link href="/golden">
                <button className="text-sm text-gray-400 hover:text-amber-400 transition-colors">
                  골든 컬렉션
                </button>
              </Link>
              <Link href="/notices">
                <button className="text-sm text-gray-400 hover:text-white transition-colors">
                  커뮤니티
                </button>
              </Link>
              <button
                onClick={() => {
                  const meeting = (notices as any[]).find((n: any) => n.type === 'meeting' && n.isActive);
                  if (meeting) setMeetingNotice(meeting);
                  else {
                    setMeetingNotice({ id: 0, title: '온라인 회의 안내', content: '현재 예정된 온라인 회의가 없습니다.\n새로운 일정이 공지되면 알려드리겠습니다.', meetingPlatform: 'zoom' });
                  }
                }}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-amber-400 transition-colors"
              >
                <Video className="w-3 h-3" />
                줌/온라인 회의
              </button>
              <button
                onClick={() => setShowReferralModal(true)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-amber-400 transition-colors"
              >
                <MessageSquare className="w-3 h-3" />
                추천글 선택
              </button>
            </div>
          </div>
        </div>

        {/* ─── 광고 이미지 섹션 ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {/* 첫 번째 광고 이미지 (작은 것) */}
          <div className="relative overflow-hidden rounded-xl aspect-[4/3] md:aspect-auto md:h-56 group cursor-pointer">
            <img
              src={adImages[0].src}
              alt={adImages[0].title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>

          {/* 두 번째 광고 이미지 (큰 것) */}
          <div className="relative overflow-hidden rounded-xl aspect-[4/3] md:aspect-auto md:h-56 md:col-span-2 group cursor-pointer">
            <img
              src={adImages[1].src}
              alt={adImages[1].title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        </div>

        {/* ─── 골든 컬렉션 ─── */}
        <CollectionSection
          title="Golden Collection"
          subtitle="BINANCE Alpha · Insurance(Hedge) · Daily Returns"
          plans={goldenPlans as any[]}
          color="golden"
          href="/golden"
          icon={<span className="text-base">🏆</span>}
        />

        {/* ─── 셀프 컬렉션 ─── */}
        <CollectionSection
          title="Self Collection"
          subtitle="Custom Strategy · Flexible · Self-managed"
          plans={selfPlans as any[]}
          color="self"
          href="/self"
          icon={<span className="text-base">⚡</span>}
        />

        {/* ─── 노드 컬렉션 ─── */}
        <CollectionSection
          title="Node Products"
          subtitle="Node Infrastructure · Deposit · External DApp"
          plans={nodePlans as any[]}
          color="node"
          href="/node"
          icon={<span className="text-base">🔷</span>}
        />

        {/* ─── 리더 컬렉션 ─── */}
        {(leaderPlans as any[]).length > 0 && (
          <CollectionSection
            title="Leader Collection"
            subtitle="리더 추천 · 검증된 전략 · 커뮤니티 선택"
            plans={leaderPlans as any[]}
            color="leader"
            href="/leader"
            icon={<span className="text-base">👑</span>}
          />
        )}

        {/* ─── 밈토큰 컬렉션 ─── */}
        {(memePlans as any[]).length > 0 && (
          <CollectionSection
            title="Meme Token"
            subtitle="밈토큰 · 고수익 · 커뮤니티 드리븐"
            plans={memePlans as any[]}
            color="meme"
            href="/meme"
            icon={<span className="text-base">🚀</span>}
          />
        )}

        {/* ─── 인플루언서 섹션 ─── */}
        {(influencerPlans as any[]).length > 0 && (
          <CollectionSection
            title="Influencer"
            subtitle="인플루언서 추천 · 트렌딩 · 소셜 검증"
            plans={influencerPlans as any[]}
            color="influencer"
            href="/influencer"
            icon={<span className="text-base">⭐</span>}
          />
        )}

        {/* ─── 특징 섹션 ─── */}
        <section className="mt-4 mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <Shield className="w-5 h-5" />, title: "Secure", desc: "Multi-sig protection", color: "text-green-400", bg: "bg-green-400/10" },
              { icon: <Zap className="w-5 h-5" />, title: "Daily Payouts", desc: "Automated distribution", color: "text-amber-400", bg: "bg-amber-400/10" },
              { icon: <Globe className="w-5 h-5" />, title: "Global Access", desc: "21 languages supported", color: "text-blue-400", bg: "bg-blue-400/10" },
              { icon: <Users className="w-5 h-5" />, title: "Referral Rewards", desc: "Earn from your network", color: "text-purple-400", bg: "bg-purple-400/10" },
            ].map((f) => (
              <div key={f.title} className="bg-[#111111] border border-white/5 rounded-xl p-4 text-center hover:border-white/10 transition-colors">
                <div className={`w-10 h-10 rounded-xl ${f.bg} ${f.color} flex items-center justify-center mx-auto mb-3`}>
                  {f.icon}
                </div>
                <div className="text-sm font-semibold text-white mb-1">{f.title}</div>
                <div className="text-xs text-gray-500">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ─── 모달들 ─── */}
      {selectedPlanId && (
        <PlanDetailModal
          planId={selectedPlanId}
          onClose={() => setSelectedPlanId(null)}
        />
      )}
      {showReferralModal && (
        <ReferralMessageModal onClose={() => setShowReferralModal(false)} />
      )}
      {meetingNotice && (
        <MeetingNoticeModal
          notice={meetingNotice}
          onClose={() => setMeetingNotice(null)}
        />
      )}

      {/* ─── 푸터 ─── */}
      <footer className="border-t border-white/5 bg-[#050505] py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <img src={ALPHABAG_LOGO} alt="AlphaBag" className="w-7 h-7 rounded object-contain bg-black" />
              <div>
                <div className="text-sm font-bold text-gray-400">AlphaBag</div>
                <div className="text-[10px] text-gray-600">Multi-Asset Investment Platform</div>
              </div>
            </div>
            <div className="flex items-center gap-6 text-xs text-gray-500">
              <Link href="/golden"><span className="hover:text-amber-400 cursor-pointer transition-colors">Golden</span></Link>
              <Link href="/self"><span className="hover:text-blue-400 cursor-pointer transition-colors">Self</span></Link>
              <Link href="/node"><span className="hover:text-purple-400 cursor-pointer transition-colors">Node</span></Link>
              <Link href="/notices"><span className="hover:text-white cursor-pointer transition-colors">Notices</span></Link>
              <Link href="/tickets"><span className="hover:text-white cursor-pointer transition-colors">Support</span></Link>
            </div>
            <div className="text-xs text-gray-600">© 2025 AlphaBag. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
