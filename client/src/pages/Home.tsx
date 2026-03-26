import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  Star, TrendingUp, ChevronRight, Wallet, Bell,
  Shield, Zap, Globe, Users, BarChart3, Menu, X,
  ShoppingCart, Search, LogOut
} from "lucide-react";

// ─── 컬렉션 카드 컴포넌트 ─────────────────────────────────────────────────────
function PlanCard({ plan, collectionColor }: { plan: any; collectionColor: string }) {
  const badges: string[] = Array.isArray(plan.badgeLabels) ? plan.badgeLabels : [];
  const rating = Number(plan.rating) || 4.0;

  const colorMap: Record<string, { border: string; glow: string; badge: string; rate: string }> = {
    golden: {
      border: "border-amber-500/30 hover:border-amber-400/60",
      glow: "hover:shadow-amber-500/10",
      badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      rate: "text-amber-400",
    },
    self: {
      border: "border-blue-500/30 hover:border-blue-400/60",
      glow: "hover:shadow-blue-500/10",
      badge: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      rate: "text-blue-400",
    },
    node: {
      border: "border-purple-500/30 hover:border-purple-400/60",
      glow: "hover:shadow-purple-500/10",
      badge: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      rate: "text-purple-400",
    },
  };

  const c = colorMap[collectionColor] || colorMap.golden;

  return (
    <Link href={`/plan/${plan.id}`}>
      <div
        className={`relative bg-[#0d0d0d] border ${c.border} rounded-xl p-4 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${c.glow} group`}
      >
        {/* 하이라이트 상단 라인 */}
        {plan.isHighlight && (
          <div className={`absolute top-0 left-0 right-0 h-[2px] rounded-t-xl ${
            collectionColor === "golden" ? "bg-gradient-to-r from-transparent via-amber-400 to-transparent" :
            collectionColor === "self" ? "bg-gradient-to-r from-transparent via-blue-400 to-transparent" :
            "bg-gradient-to-r from-transparent via-purple-400 to-transparent"
          }`} />
        )}

        {/* 로고 + 이름 */}
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold ${
            collectionColor === "golden" ? "bg-amber-500/20 text-amber-400" :
            collectionColor === "self" ? "bg-blue-500/20 text-blue-400" :
            "bg-purple-500/20 text-purple-400"
          }`}>
            {plan.logoUrl ? (
              <img src={plan.logoUrl} alt={plan.name} className="w-8 h-8 rounded object-cover" />
            ) : (
              plan.name.charAt(0)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-white text-sm truncate">{plan.name}</div>
            {plan.strategy && (
              <div className="text-xs text-gray-500 truncate">{plan.strategy}</div>
            )}
          </div>
          {plan.isHighlight && (
            <Badge className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 flex-shrink-0">
              HOT
            </Badge>
          )}
        </div>

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

        {/* 추천 금액 */}
        {plan.recommendedAmount && (
          <div className="flex justify-between text-xs mb-3">
            <span className="text-gray-500">Recommended</span>
            <span className="text-gray-300 font-medium">${Number(plan.recommendedAmount).toLocaleString()} USDT</span>
          </div>
        )}

        {/* 할당 비율 */}
        {plan.allocation && (
          <div className="flex justify-between text-xs mb-3">
            <span className="text-gray-500">Allocation</span>
            <span className="text-gray-300">{plan.allocation}</span>
          </div>
        )}

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
        <button className={`w-full py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
          collectionColor === "golden"
            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30"
            : collectionColor === "self"
            ? "bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30"
            : "bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30"
        }`}>
          View Details →
        </button>
      </div>
    </Link>
  );
}

// ─── 컬렉션 섹션 컴포넌트 ─────────────────────────────────────────────────────
function CollectionSection({
  title,
  subtitle,
  plans,
  color,
  href,
  icon,
}: {
  title: string;
  subtitle: string;
  plans: any[];
  color: string;
  href: string;
  icon: React.ReactNode;
}) {
  const colorMap: Record<string, { title: string; dot: string; btn: string }> = {
    golden: { title: "text-amber-400", dot: "bg-amber-400", btn: "text-amber-400 border-amber-400/30 hover:bg-amber-400/10" },
    self: { title: "text-blue-400", dot: "bg-blue-400", btn: "text-blue-400 border-blue-400/30 hover:bg-blue-400/10" },
    node: { title: "text-purple-400", dot: "bg-purple-400", btn: "text-purple-400 border-purple-400/30 hover:bg-purple-400/10" },
  };
  const c = colorMap[color] || colorMap.golden;

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${c.dot}`} />
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [noticeIndex, setNoticeIndex] = useState(0);

  const { data: goldenPlans = [] } = trpc.public.goldenPlans.useQuery();
  const { data: selfPlans = [] } = trpc.public.selfPlans.useQuery();
  const { data: nodePlans = [] } = trpc.public.nodePlans.useQuery();
  const { data: notices = [] } = trpc.public.notices.useQuery();
  const { data: banners = [] } = trpc.public.banners.useQuery();

  // 공지 롤링
  useEffect(() => {
    if (notices.length <= 1) return;
    const timer = setInterval(() => {
      setNoticeIndex((i) => (i + 1) % notices.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [notices.length]);

  const currentNotice = notices[noticeIndex];

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      {/* ─── 상단 네비게이션 ─── */}
      <nav className="sticky top-0 z-50 bg-[#080808]/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="h-14 flex items-center justify-between gap-4">
            {/* 로고 */}
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                  <span className="text-black font-black text-xs">AB</span>
                </div>
                <span className="font-bold text-white text-sm tracking-wide">AlphaBag</span>
              </div>
            </Link>

            {/* 데스크탑 메뉴 */}
            <div className="hidden md:flex items-center gap-1">
              <Link href="/golden">
                <button className="px-3 py-1.5 text-xs text-gray-400 hover:text-amber-400 transition-colors rounded-lg hover:bg-amber-400/5">
                  Golden
                </button>
              </Link>
              <Link href="/self">
                <button className="px-3 py-1.5 text-xs text-gray-400 hover:text-blue-400 transition-colors rounded-lg hover:bg-blue-400/5">
                  Self
                </button>
              </Link>
              <Link href="/nodes">
                <button className="px-3 py-1.5 text-xs text-gray-400 hover:text-purple-400 transition-colors rounded-lg hover:bg-purple-400/5">
                  Node
                </button>
              </Link>
              <Link href="/notices">
                <button className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5">
                  Notices
                </button>
              </Link>
            </div>

            {/* 우측 액션 */}
            <div className="flex items-center gap-2">
              <LanguageSwitcher />

              {isAuthenticated ? (
                <>
                  <Link href="/dashboard">
                    <Button size="sm" variant="ghost" className="text-xs text-gray-400 hover:text-white h-8 px-3">
                      <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                      <span className="hidden sm:inline">Dashboard</span>
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-gray-400 hover:text-red-400 h-8 px-2"
                    onClick={() => logout()}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  className="h-8 px-4 text-xs bg-amber-500 hover:bg-amber-400 text-black font-semibold"
                  onClick={() => window.location.href = getLoginUrl()}
                >
                  <Wallet className="w-3.5 h-3.5 mr-1.5" />
                  Connect
                </Button>
              )}

              {/* 모바일 메뉴 버튼 */}
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
              { href: "/nodes", label: "Node Products", color: "text-purple-400" },
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

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* ─── 공지 배너 ─── */}
        {currentNotice && (
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5 mb-5">
            <Bell className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-xs text-amber-300 font-medium mr-2">[Notice]</span>
              <span className="text-xs text-gray-300 truncate">{(currentNotice as any).title}</span>
            </div>
            {notices.length > 1 && (
              <span className="text-xs text-gray-500 flex-shrink-0">{noticeIndex + 1}/{notices.length}</span>
            )}
          </div>
        )}

        {/* ─── 광고 배너 ─── */}
        {(banners as any[]).length > 0 && (
          <div className="mb-6 overflow-hidden rounded-xl">
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
              {(banners as any[]).map((b: any) => (
                <a key={b.id} href={b.linkUrl || "#"} target="_blank" rel="noopener noreferrer"
                  className="flex-shrink-0 w-full max-w-sm">
                  <div className="h-24 bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/20 rounded-xl flex items-center justify-center">
                    {b.imageUrl ? (
                      <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <span className="text-amber-400 text-sm font-medium">{b.title}</span>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ─── 히어로 섹션 ─── */}
        <div className="text-center mb-12 py-8">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs text-amber-300 font-medium">Multi-Asset Investment Platform</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
            <span className="text-white">Alpha</span>
            <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">Bag</span>
          </h1>
          <p className="text-gray-400 text-sm md:text-base max-w-lg mx-auto mb-8 leading-relaxed">
            Discover curated investment collections across Golden, Self, and Node strategies.
            Earn daily returns with transparent, secure asset management.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/golden">
              <Button className="h-10 px-6 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm">
                Explore Collections
              </Button>
            </Link>
            {!isAuthenticated && (
              <Button
                variant="outline"
                className="h-10 px-6 border-white/10 text-gray-300 hover:text-white hover:border-white/20 text-sm"
                onClick={() => window.location.href = getLoginUrl()}
              >
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
              </Button>
            )}
          </div>

          {/* 통계 */}
          <div className="flex items-center justify-center gap-8 mt-10 pt-8 border-t border-white/5">
            {[
              { label: "Total Users", value: "663+" },
              { label: "Total Invested", value: "$214K+" },
              { label: "Active Plans", value: "17" },
              { label: "Daily Returns", value: "Up to 3%" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-lg font-bold text-white">{stat.value}</div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </div>
            ))}
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
          href="/nodes"
          icon={<span className="text-base">🔷</span>}
        />

        {/* ─── 특징 섹션 ─── */}
        <section className="mt-4 mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <Shield className="w-5 h-5" />, title: "Secure", desc: "Multi-sig protection", color: "text-green-400" },
              { icon: <Zap className="w-5 h-5" />, title: "Daily Payouts", desc: "Automated distribution", color: "text-amber-400" },
              { icon: <Globe className="w-5 h-5" />, title: "Global Access", desc: "21 languages supported", color: "text-blue-400" },
              { icon: <Users className="w-5 h-5" />, title: "Referral Rewards", desc: "Earn from your network", color: "text-purple-400" },
            ].map((f) => (
              <div key={f.title} className="bg-[#0d0d0d] border border-white/5 rounded-xl p-4 text-center">
                <div className={`${f.color} flex justify-center mb-2`}>{f.icon}</div>
                <div className="text-sm font-semibold text-white mb-1">{f.title}</div>
                <div className="text-xs text-gray-500">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ─── 푸터 ─── */}
      <footer className="border-t border-white/5 bg-[#050505] py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <span className="text-black font-black text-[10px]">AB</span>
              </div>
              <span className="text-sm font-bold text-gray-400">AlphaBag</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-gray-500">
              <Link href="/golden"><span className="hover:text-amber-400 cursor-pointer transition-colors">Golden</span></Link>
              <Link href="/self"><span className="hover:text-blue-400 cursor-pointer transition-colors">Self</span></Link>
              <Link href="/nodes"><span className="hover:text-purple-400 cursor-pointer transition-colors">Node</span></Link>
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
