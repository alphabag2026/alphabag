import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useWallet } from "@/contexts/WalletContext";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  Star, ChevronRight, ChevronDown, Bell, Shield, Zap, Globe,
  Users, BarChart3, Menu, X, ShoppingCart, LogOut,
  Wallet, ExternalLink, Video, MessageSquare, Search,
  Sun, Moon, TrendingUp, TrendingDown, RefreshCw,
  ChevronLeft, Play, Newspaper, Tv, Rss
} from "lucide-react";
import { PlanDetailModal } from "@/components/PlanDetailModal";
import { ReferralMessageModal } from "@/components/ReferralMessageModal";
import { MeetingNoticeModal } from "@/components/MeetingNoticeModal";
import { useTheme } from "@/contexts/ThemeContext";

// CDN URLs
const ALPHABAG_LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663373200888/TGrbnQ7ygm6GBAS6CWnuGe/alphabag-logo_df90878d.png";
const AD_DOLLARS = "https://d2xsxph8kpxj0f.cloudfront.net/310519663373200888/TGrbnQ7ygm6GBAS6CWnuGe/ad-dollars_88f0319b.jpg";
const AD_TRADING = "https://d2xsxph8kpxj0f.cloudfront.net/310519663373200888/TGrbnQ7ygm6GBAS6CWnuGe/ad-trading_0ad7d05d.jpg";

// ─── 키워드 하이라이트 헬퍼 ─────────────────────────────────────────────────────
function HighlightText({ text, query, className }: { text: string; query: string; className?: string }) {
  if (!query.trim() || !text) return <span className={className}>{text}</span>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return (
    <span className={className}>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-amber-200 text-amber-900 rounded-sm px-0.5 not-italic font-semibold">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

// ─── 소메뉴 탭 정의 ──────────────────────────────────────────────────────────
const SUB_MENUS = [
  { id: "recommend", label: "추천", icon: "⭐" },
  { id: "bbag", label: "B bag", icon: "💰" },
  { id: "infoweb4", label: "infoweb4", icon: "🌐" },
  { id: "sns", label: "SNS", icon: "📱" },
  { id: "trending", label: "급등토큰", icon: "🚀" },
  { id: "airdrop", label: "에어드랍", icon: "🎁" },
  { id: "favorites", label: "즐겨찾기", icon: "❤️" },
  { id: "news", label: "news", icon: "📰" },
  { id: "contents", label: "콘텐츠", icon: "🎬" },
  { id: "live", label: "Live", icon: "🔴" },
];

// ─── 뷰 타입 ──────────────────────────────────────────────────────────────────
type ViewType = "A" | "B" | "C";

// ─── 카드 타입 A: 손글씨 B 스타일 ────────────────────────────────────────────
function PlanCardA({ plan, collectionColor }: { plan: any; collectionColor: string }) {
  const colorMap: Record<string, { accent: string; bg: string; border: string }> = {
    golden: { accent: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.3)" },
    self: { accent: "#3b82f6", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.3)" },
    node: { accent: "#8b5cf6", bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.3)" },
    leader: { accent: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.3)" },
    meme: { accent: "#ec4899", bg: "rgba(236,72,153,0.08)", border: "rgba(236,72,153,0.3)" },
    influencer: { accent: "#f97316", bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.3)" },
  };
  const c = colorMap[collectionColor] || colorMap.golden;

  return (
    <Link href={`/plan/${plan.id}`}>
      <div
        className="relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group"
        style={{ background: c.bg, border: `1.5px solid ${c.border}` }}
      >
        {/* 썸네일 배경 */}
        {Array.isArray(plan.thumbnailImages) && plan.thumbnailImages.length > 0 && (
          <img
            src={plan.thumbnailImages[0]}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-10 group-hover:opacity-20 transition-opacity duration-300"
          />
        )}
        <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 items-end">
          {plan.isHighlight && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold text-black" style={{ background: c.accent }}>HOT</span>
          )}
          {plan.isMLM && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-purple-500 text-white">MLM</span>
          )}
        </div>

        <div className="relative z-10 p-4">
          {/* 손글씨 스타일 이니셜 */}
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${c.accent}33, ${c.accent}11)`, border: `2px solid ${c.accent}44` }}
            >
              {plan.logoUrl ? (
                <img src={plan.logoUrl} alt={plan.name} className="w-full h-full object-contain p-1" />
              ) : (
                <span
                  className="font-black text-3xl"
                  style={{
                    color: c.accent,
                    fontFamily: "'Dancing Script', 'Caveat', cursive",
                    textShadow: `0 0 20px ${c.accent}66`,
                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
                  }}
                >
                  {plan.name.charAt(0)}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm truncate" style={{ color: c.accent }}>{plan.name}</div>
              {plan.strategy && <div className="text-xs text-gray-500 truncate">{plan.strategy}</div>}
            </div>
          </div>

          {/* 수익률 크게 표시 */}
          <div className="text-center py-2">
            <div className="text-3xl font-black" style={{ color: c.accent, fontFamily: "'Dancing Script', cursive" }}>
              {Number(plan.dailyRate).toFixed(2)}%
            </div>
            <div className="text-xs text-gray-500">Daily Return</div>
          </div>

          {/* 추천금액 */}
          {plan.recommendedAmount && (
            <div className="text-center text-xs text-gray-400 mt-1">
              추천: <span className="font-bold" style={{ color: c.accent }}>{Number(plan.recommendedAmount).toLocaleString()} USDT</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── 카드 타입 B: 게시판 한줄형 ──────────────────────────────────────────────
function PlanCardB({ plan, collectionColor }: { plan: any; collectionColor: string }) {
  const colorMap: Record<string, { accent: string; dot: string }> = {
    golden: { accent: "text-amber-400", dot: "bg-amber-400" },
    self: { accent: "text-blue-400", dot: "bg-blue-400" },
    node: { accent: "text-purple-400", dot: "bg-purple-400" },
    leader: { accent: "text-emerald-400", dot: "bg-emerald-400" },
    meme: { accent: "text-pink-400", dot: "bg-pink-400" },
    influencer: { accent: "text-orange-400", dot: "bg-orange-400" },
  };
  const c = colorMap[collectionColor] || colorMap.golden;

  return (
    <Link href={`/plan/${plan.id}`}>
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer border-b border-gray-100 dark:border-white/5 group">
        {/* 로고 */}
        <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-white/5">
          {plan.logoUrl ? (
            <img src={plan.logoUrl} alt={plan.name} className="w-full h-full object-contain p-0.5" />
          ) : (
            <div className={`w-full h-full flex items-center justify-center text-sm font-bold ${c.accent}`}>
              {plan.name.charAt(0)}
            </div>
          )}
        </div>

        {/* 이름 + 전략 */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate dark:text-white text-gray-900">{plan.name}</div>
          {plan.strategy && <div className="text-xs text-gray-500 truncate">{plan.strategy}</div>}
        </div>

        {/* 수익률 */}
        <div className="text-right flex-shrink-0">
          <div className={`text-sm font-bold ${c.accent}`}>{Number(plan.dailyRate).toFixed(2)}%</div>
          <div className="text-[10px] text-gray-500">Daily</div>
        </div>

        {/* HOT/MLM 배지 */}
        <div className="flex gap-1 flex-shrink-0">
          {plan.isHighlight && (
            <span className="text-[9px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">HOT</span>
          )}
          {plan.isMLM && (
            <span className="text-[9px] px-1 py-0.5 rounded bg-purple-500/20 text-purple-400 font-bold border border-purple-500/30">MLM</span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── 카드 타입 C: 현재 방식 (기존 PlanCard) ──────────────────────────────────
function PlanCardC({ plan, collectionColor, isDark = false }: { plan: any; collectionColor: string; isDark?: boolean }) {
  const badges: string[] = Array.isArray(plan.badgeLabels) ? plan.badgeLabels : [];
  const rating = Number(plan.rating) || 4.0;

  const colorMapDark: Record<string, { border: string; glow: string; badge: string; rate: string; btn: string; overlay: string }> = {
    golden: { border: "border-amber-500/30", glow: "hover:shadow-amber-500/40", badge: "bg-amber-500/20 text-amber-300 border-amber-500/30", rate: "text-amber-400", btn: "bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30", overlay: "from-amber-900/60" },
    self: { border: "border-blue-500/30", glow: "hover:shadow-blue-500/40", badge: "bg-blue-500/20 text-blue-300 border-blue-500/30", rate: "text-blue-400", btn: "bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30", overlay: "from-blue-900/60" },
    node: { border: "border-purple-500/30", glow: "hover:shadow-purple-500/40", badge: "bg-purple-500/20 text-purple-300 border-purple-500/30", rate: "text-purple-400", btn: "bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-purple-500/30", overlay: "from-purple-900/60" },
    leader: { border: "border-emerald-500/30", glow: "hover:shadow-emerald-500/40", badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", rate: "text-emerald-400", btn: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30", overlay: "from-emerald-900/60" },
    meme: { border: "border-pink-500/30", glow: "hover:shadow-pink-500/40", badge: "bg-pink-500/20 text-pink-300 border-pink-500/30", rate: "text-pink-400", btn: "bg-pink-500/20 text-pink-300 border-pink-500/30 hover:bg-pink-500/30", overlay: "from-pink-900/60" },
    influencer: { border: "border-orange-500/30", glow: "hover:shadow-orange-500/40", badge: "bg-orange-500/20 text-orange-300 border-orange-500/30", rate: "text-orange-400", btn: "bg-orange-500/20 text-orange-300 border-orange-500/30 hover:bg-orange-500/30", overlay: "from-orange-900/60" },
  };
  const colorMapLight: Record<string, { border: string; glow: string; badge: string; rate: string; btn: string; overlay: string }> = {
    golden: { border: "border-amber-400/60", glow: "hover:shadow-amber-400/30", badge: "bg-amber-100 text-amber-700 border-amber-300", rate: "text-amber-600", btn: "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100", overlay: "from-amber-100/80" },
    self: { border: "border-blue-400/60", glow: "hover:shadow-blue-400/30", badge: "bg-blue-100 text-blue-700 border-blue-300", rate: "text-blue-600", btn: "bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100", overlay: "from-blue-100/80" },
    node: { border: "border-purple-400/60", glow: "hover:shadow-purple-400/30", badge: "bg-purple-100 text-purple-700 border-purple-300", rate: "text-purple-600", btn: "bg-purple-50 text-purple-700 border-purple-300 hover:bg-purple-100", overlay: "from-purple-100/80" },
    leader: { border: "border-emerald-400/60", glow: "hover:shadow-emerald-400/30", badge: "bg-emerald-100 text-emerald-700 border-emerald-300", rate: "text-emerald-600", btn: "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100", overlay: "from-emerald-100/80" },
    meme: { border: "border-pink-400/60", glow: "hover:shadow-pink-400/30", badge: "bg-pink-100 text-pink-700 border-pink-300", rate: "text-pink-600", btn: "bg-pink-50 text-pink-700 border-pink-300 hover:bg-pink-100", overlay: "from-pink-100/80" },
    influencer: { border: "border-orange-400/60", glow: "hover:shadow-orange-400/30", badge: "bg-orange-100 text-orange-700 border-orange-300", rate: "text-orange-600", btn: "bg-orange-50 text-orange-700 border-orange-300 hover:bg-orange-100", overlay: "from-orange-100/80" },
  };
  const colorMap = isDark ? colorMapDark : colorMapLight;
  const c = colorMap[collectionColor] || colorMap.golden;

  return (
    <Link href={`/plan/${plan.id}`}>
      <div className={`relative border-2 ${c.border} rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${c.glow} group ${isDark ? "bg-[#0d0d0d]" : "bg-white shadow-sm"}`}>
        <div className="relative h-36 overflow-hidden">
          {Array.isArray(plan.thumbnailImages) && plan.thumbnailImages.length > 0 && (
            <img src={plan.thumbnailImages[0]} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30 transition-transform duration-500 group-hover:scale-110" />
          )}
          {plan.logoUrl ? (
            <img src={plan.logoUrl} alt={plan.name} className="relative z-10 w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-110" />
          ) : (
            <div className={`w-full h-full flex items-center justify-center`}>
              <span className={`text-5xl font-black opacity-30 ${c.rate}`}>{plan.name.charAt(0)}</span>
            </div>
          )}
          <div className={`absolute inset-0 bg-gradient-to-t ${c.overlay} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
          <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
            {plan.isHighlight && (
              <Badge className="text-[10px] px-1.5 py-0.5 bg-amber-500/90 text-black border-0 font-bold">HOT</Badge>
            )}
            {plan.isMLM && (
              <Badge className="text-[10px] px-1.5 py-0.5 bg-purple-500 text-white border-0 font-bold">MLM</Badge>
            )}
          </div>
        </div>
        <div className="p-4">
          <div className={`font-bold text-sm truncate mb-1 ${isDark ? "text-white" : "text-gray-900"}`}>{plan.name}</div>
          {plan.strategy && <div className="text-xs text-gray-500 truncate mb-2">{plan.strategy}</div>}
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {badges.slice(0, 3).map((b: string, idx: number) => (
                <span key={idx} className={`text-[10px] px-2 py-0.5 rounded-full border ${c.badge}`}>{b}</span>
              ))}
            </div>
          )}
          {(plan.ratioInfo || plan.yieldInfo) && (
            <div className="grid grid-cols-2 gap-1 mb-2">
              {plan.ratioInfo && <div className={`rounded-lg p-2 border ${isDark ? "bg-white/5 border-white/5" : "bg-gray-100 border-gray-200"}`}><div className={`text-[9px] mb-0.5 ${isDark ? "text-gray-500" : "text-gray-500"}`}>Ratio</div><div className={`text-[11px] font-bold ${isDark ? "text-white" : "text-gray-800"}`}>{plan.ratioInfo}</div></div>}
              {plan.yieldInfo && <div className={`rounded-lg p-2 border ${isDark ? "bg-white/5 border-white/5" : "bg-gray-100 border-gray-200"}`}><div className={`text-[9px] mb-0.5 ${isDark ? "text-gray-500" : "text-gray-500"}`}>Yield</div><div className={`text-[11px] font-bold ${c.rate}`}>{plan.yieldInfo}</div></div>}
            </div>
          )}
          <div className="mb-2">
            <div className={`text-2xl font-bold ${c.rate}`}>{Number(plan.dailyRate).toFixed(2)}%</div>
            <div className="text-xs text-gray-500">Daily Return</div>
          </div>
          {plan.recommendedAmount && (
            <div className={`text-xs mb-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>추천금액: <span className={`font-bold ${c.rate}`}>{Number(plan.recommendedAmount).toLocaleString()} USDT</span></div>
          )}
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className={`w-3 h-3 ${s <= Math.round(rating) ? "text-amber-400 fill-amber-400" : isDark ? "text-gray-600" : "text-gray-300"}`} />
            ))}
            <span className={`text-xs ml-1 ${isDark ? "text-gray-500" : "text-gray-500"}`}>{rating.toFixed(1)}</span>
          </div>
          <button className={`w-full py-2 rounded-lg text-xs font-semibold transition-all duration-200 border ${c.btn}`}>View Details →</button>
        </div>
      </div>
    </Link>
  );
}

// ─── 금융 위젯 ────────────────────────────────────────────────────────────────
function MarketWidget({ isDark, sidebar = false, mobileInline = false }: { isDark: boolean; sidebar?: boolean; mobileInline?: boolean }) {
  const { data: marketData, isLoading, refetch } = trpc.market.prices.useQuery(undefined, {
    refetchInterval: 60000,
    staleTime: 30000,
  });
  const [showBNB, setShowBNB] = useState(false);
  const [showSOL, setShowSOL] = useState(false);
  const [fxCollapsed, setFxCollapsed] = useState(true);
  const bgCard = isDark ? "bg-[#111111] border-white/10" : "bg-white border-gray-200 shadow-sm";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-500";
  if (isLoading) {
    return (
      <div className={`rounded-xl p-4 border ${bgCard} ${sidebar ? "" : "mb-4"}`}>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-amber-400" />
          <span className={`text-sm font-bold ${textPrimary}`}>금융 시장</span>
        </div>
        <div className="animate-pulse space-y-2">
          {[1, 2].map(i => <div key={i} className="h-10 bg-white/5 rounded-lg" />)}
        </div>
      </div>
    );
  }
  const crypto = marketData?.crypto;
  const fx = marketData?.fx;
  const allCoins = crypto ? [
    { symbol: "BTC", price: crypto.BTC.usd, change: crypto.BTC.change24h, icon: "₿", color: "bg-orange-500/20 text-orange-400", always: true },
    { symbol: "ETH", price: crypto.ETH.usd, change: crypto.ETH.change24h, icon: "Ξ", color: "bg-blue-500/20 text-blue-400", always: true },
    { symbol: "BNB", price: crypto.BNB.usd, change: crypto.BNB.change24h, icon: "B", color: "bg-yellow-500/20 text-yellow-500", always: false, show: showBNB },
    { symbol: "SOL", price: crypto.SOL.usd, change: crypto.SOL.change24h, icon: "◎", color: "bg-purple-500/20 text-purple-400", always: false, show: showSOL },
  ] : [];
  const cryptoItems = allCoins.filter(c => c.always || c.show);

  return (
    <div className={`rounded-xl border ${bgCard} ${sidebar ? "" : "mb-4"} overflow-hidden`}>
      <div className={`px-4 py-3 flex items-center justify-between border-b ${isDark ? "border-white/5" : "border-gray-100"}`}>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-amber-400" />
          <span className={`text-sm font-bold ${textPrimary}`}>금융 시장</span>
          {fx && (
            <span className={`text-xs ${textSecondary}`}>USD/KRW ₩{fx.KRW?.toLocaleString()}</span>
          )}
        </div>
        <button onClick={() => refetch()} className="text-gray-500 hover:text-amber-400 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 코인 토글 */}
      <div className={`px-3 pt-2 pb-1 flex items-center gap-2`}>
        {[{ label: "BNB", active: showBNB, toggle: () => setShowBNB(v => !v) }, { label: "SOL", active: showSOL, toggle: () => setShowSOL(v => !v) }].map(t => (
          <button key={t.label} onClick={t.toggle} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
            t.active
              ? isDark ? "bg-amber-500/20 border-amber-500/40 text-amber-300" : "bg-amber-100 border-amber-300 text-amber-700"
              : isDark ? "bg-white/5 border-white/10 text-gray-500" : "bg-gray-100 border-gray-200 text-gray-400"
          }`}>
            <span className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${t.active ? "bg-amber-400 border-amber-400" : isDark ? "border-gray-600" : "border-gray-300"}`} />
            {t.label}
          </button>
        ))}
        <span className={`text-[9px] ml-auto ${textSecondary}`}>코인 선택</span>
      </div>
      {/* 암호화폐 가격 */}
      <div className="px-3 pb-2">
        <div className={`grid gap-2 ${cryptoItems.length > 2 ? "grid-cols-2" : "grid-cols-2"}`}>
          {cryptoItems.map((item) => (
            <div key={item.symbol} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${
              isDark ? "bg-white/4 border border-white/8" : "bg-gray-50 border border-gray-100"
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 ${item.color}`}>
                {item.icon}
              </div>
              <div className="min-w-0">
                <div className={`text-xs font-bold ${textPrimary}`}>{item.symbol}</div>
                <div className={`text-xs font-semibold ${textPrimary}`}>
                  ${item.price >= 1000 ? item.price.toLocaleString() : item.price.toFixed(2)}
                </div>
                <div className={`text-[10px] flex items-center gap-0.5 font-medium ${
                  item.change >= 0 ? "text-emerald-500" : "text-red-500"
                }`}>
                  {item.change >= 0 ? "+" : ""}{Math.abs(item.change).toFixed(2)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 환율 접기/펼치기 */}
      {fx && (
        <div className={`border-t ${isDark ? "border-white/5" : "border-gray-100"}`}>
          <button
            onClick={() => setFxCollapsed(v => !v)}
            className={`w-full px-4 py-2 flex items-center justify-between text-[10px] ${textSecondary} hover:${isDark ? "text-white" : "text-gray-700"} transition-colors`}
          >
            <span>주요 환율 (1 USD 기준)</span>
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${fxCollapsed ? "" : "rotate-180"}`} />
          </button>
          {!fxCollapsed && (
            <div className="px-4 pb-2.5">
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "KRW", value: `₩${fx.KRW?.toLocaleString()}` },
                  { label: "JPY", value: `¥${fx.JPY?.toFixed(0)}` },
                  { label: "EUR", value: `€${fx.EUR?.toFixed(3)}` },
                  { label: "CNY", value: `¥${fx.CNY?.toFixed(2)}` },
                ].map((item) => (
                  <div key={item.label} className={`text-center p-1.5 rounded-lg ${isDark ? "bg-white/5" : "bg-gray-50"}`}>
                    <div className={`text-[9px] ${textSecondary}`}>{item.label}</div>
                    <div className={`text-[10px] font-bold ${textPrimary}`}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── 모바일 1줄 금융 바 ─────────────────────────────────────────────────────
function MobileMarketBar({ isDark }: { isDark: boolean }) {
  const { data: marketData } = trpc.market.prices.useQuery(undefined, {
    refetchInterval: 60000,
    staleTime: 30000,
  });
  const crypto = marketData?.crypto;
  const bgCard = isDark ? "bg-[#111111] border-white/10" : "bg-white border-gray-200 shadow-sm";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  if (!crypto) return null;
  const coins = [
    { symbol: "BTC", price: crypto.BTC.usd, change: crypto.BTC.change24h, icon: "₿", color: "text-orange-400" },
    { symbol: "ETH", price: crypto.ETH.usd, change: crypto.ETH.change24h, icon: "Ξ", color: "text-blue-400" },
  ];
  return (
    <div className={`rounded-xl border px-3 py-2 flex items-center gap-3 overflow-x-auto scrollbar-hide ${bgCard}`}>
      <TrendingUp className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
      {coins.map(c => (
        <div key={c.symbol} className="flex items-center gap-1.5 flex-shrink-0">
          <span className={`text-xs font-bold ${c.color}`}>{c.icon} {c.symbol}</span>
          <span className={`text-xs font-semibold ${textPrimary}`}>${c.price >= 1000 ? c.price.toLocaleString() : c.price.toFixed(2)}</span>
          <span className={`text-[10px] font-medium ${c.change >= 0 ? "text-emerald-500" : "text-red-500"}`}>{c.change >= 0 ? "+" : ""}{c.change.toFixed(2)}%</span>
        </div>
      ))}
    </div>
  );
}

// ─── 오늘의 추천 플랜 사이드바 위젯 ─────────────────────────────────────────
function TodayRecommendWidget({ isDark, onSelectPlan }: { isDark: boolean; onSelectPlan: (id: number) => void }) {
  const { data: plans } = trpc.public.plans.useQuery({ limit: 3, highlightOnly: true });
  const bgCard = isDark ? "bg-[#111111] border-white/10" : "bg-white border-gray-200 shadow-sm";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-500";
  if (!plans || plans.length === 0) return null;
  return (
    <div className={`rounded-xl border overflow-hidden ${bgCard}`}>
      <div className={`px-4 py-3 border-b ${isDark ? "border-white/5" : "border-gray-100"} flex items-center gap-2`}>
        <span className="text-amber-400">⭐</span>
        <span className={`text-sm font-bold ${textPrimary}`}>오늘의 추천 플랜</span>
      </div>
      <div className="divide-y divide-gray-100/10">
        {plans.slice(0, 3).map((plan: any) => (
          <button
            key={plan.id}
            onClick={() => onSelectPlan(plan.id)}
            className={`w-full px-4 py-3 text-left hover:${isDark ? "bg-white/5" : "bg-gray-50"} transition-colors`}
          >
            <div className={`text-xs font-semibold ${textPrimary} truncate`}>{plan.name}</div>
            <div className="flex items-center justify-between mt-1">
              <span className={`text-[10px] ${textSecondary}`}>{plan.strategy || plan.planType}</span>
              <span className="text-[10px] font-bold text-amber-500">{plan.dailyRate ? `${(parseFloat(plan.dailyRate)*100).toFixed(2)}%` : "HOT"}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── 광고 슬라이더 ────────────────────────────────────────────────────────────
function AdSlider({ adImages }: { adImages: { src: string; title: string; link: string }[] }) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const length = adImages.length;
  const next = useCallback(() => setCurrent(c => (c + 1) % length), [length]);
  const prev = useCallback(() => setCurrent(c => (c - 1 + length) % length), [length]);

  useEffect(() => {
    if (length === 0) return;
    const id = setInterval(() => setCurrent(c => (c + 1) % length), 4000);
    return () => clearInterval(id);
  }, [length]);

  if (adImages.length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-xl mb-4" style={{ aspectRatio: "16/6" }}>
      {adImages.map((ad, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-700 ${i === current ? "opacity-100" : "opacity-0"}`}
        >
          <img src={ad.src} alt={ad.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      ))}

      {/* 이전/다음 버튼 */}
      <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors">
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors">
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* 인디케이터 */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
        {adImages.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1 rounded-full transition-all duration-300 ${i === current ? "w-4 bg-white" : "w-1 bg-white/50"}`}
          />
        ))}
      </div>
    </div>
  );
}

// ─── 컬렉션 섹션 ──────────────────────────────────────────────────────────────
function CollectionSection({
  title, subtitle, plans, color, href, icon, viewType, isDark,
}: {
  title: string; subtitle: string; plans: any[];
  color: string; href: string; icon: React.ReactNode;
  viewType: ViewType; isDark: boolean;
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

  if (plans.length === 0) {
    return (
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${c.dot}`} />
            <h2 className={`text-base font-bold ${c.title} flex items-center gap-1.5`}>{icon} {title}</h2>
          </div>
        </div>
        <div className={`rounded-xl p-6 text-center border ${isDark ? "bg-[#111111] border-white/5" : "bg-gray-50 border-gray-200"}`}>
          <div className="text-gray-500 text-sm">Coming Soon</div>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${c.dot} animate-pulse`} />
          <div>
            <h2 className={`text-base font-bold ${c.title} flex items-center gap-1.5`}>{icon} {title}</h2>
            <p className="text-[10px] text-gray-500">{subtitle}</p>
          </div>
        </div>
        <Link href={href}>
          <button className={`flex items-center gap-1 text-xs border rounded-lg px-2.5 py-1 transition-colors ${c.btn}`}>
            전체보기 <ChevronRight className="w-3 h-3" />
          </button>
        </Link>
      </div>

      {/* 뷰 타입에 따른 렌더링 */}
      {viewType === "B" ? (
        <div className={`rounded-xl border overflow-hidden ${isDark ? "bg-[#0d0d0d] border-white/5" : "bg-white border-gray-200"}`}>
          {plans.slice(0, 6).map((plan) => (
            <PlanCardB key={plan.id} plan={plan} collectionColor={color} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {plans.slice(0, 4).map((plan) => (
            viewType === "A"
              ? <PlanCardA key={plan.id} plan={plan} collectionColor={color} />
              : <PlanCardC key={plan.id} plan={plan} collectionColor={color} isDark={isDark} />
          ))}
        </div>
      )}
    </section>
  );
}

// ─── 메인 홈 컴포넌트 ─────────────────────────────────────────────────────────
export default function Home() {
  const { t } = useTranslation();
  const { user: authUser, isAuthenticated } = useAuth();
  const { isConnected, address, openModal, disconnectWallet } = useWallet();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileAboutOpen, setMobileAboutOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [meetingNotice, setMeetingNotice] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("recommend");
  const [viewType, setViewType] = useState<ViewType>("C");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // 데이터 로드
  const { data: goldenPlans = [] } = trpc.public.goldenPlans.useQuery();
  const { data: selfPlans = [] } = trpc.public.selfPlans.useQuery();
  const { data: nodePlans = [] } = trpc.public.nodePlans.useQuery();
  const { data: leaderPlans = [] } = trpc.public.leaderPlans.useQuery();
  const { data: memePlans = [] } = trpc.public.memePlans.useQuery();
  const { data: influencerPlans = [] } = trpc.public.influencerPlans.useQuery();
  const { data: notices = [] } = trpc.public.notices.useQuery();
  const { data: banners = [] } = trpc.public.banners.useQuery();
  const allPlansInput = useMemo(() => ({}), []);
  const { data: allPlansRaw } = trpc.public.plans.useQuery(allPlansInput);
  const allPlans = useMemo(() => allPlansRaw ?? [], [allPlansRaw]);
  // 급등 토큰 + 에어드랍
  const { data: trendingTokens = [], isLoading: trendingLoading } = trpc.market.trending.useQuery(undefined, { staleTime: 5 * 60 * 1000 });
  const { data: trendingCoins = [], isLoading: trendingCoinsLoading } = trpc.market.trendingCoins.useQuery(undefined, { staleTime: 5 * 60 * 1000 });
  const { data: airdropList = [] } = trpc.airdropSection.list.useQuery();
  const { data: favoritesList = [], refetch: refetchFavorites } = trpc.favorites.list.useQuery(undefined, { enabled: isAuthenticated });
  const toggleFavoriteMutation = trpc.favorites.toggle.useMutation({ onSuccess: () => refetchFavorites() });
  // SNS 인플루언서
  const [selectedInfluencerId, setSelectedInfluencerId] = useState<number | null>(null);
  const [snsCategory, setSnsCategory] = useState<string>("all");
  const { data: snsInfluencers = [] } = trpc.sns.influencers.useQuery();
  const snsPostsInput = useMemo(() => ({ influencerId: selectedInfluencerId ?? undefined, limit: 30 }), [selectedInfluencerId]);
  const { data: snsPosts = [], isLoading: snsPostsLoading } = trpc.sns.posts.useQuery(snsPostsInput);
  // 카테고리 필터 적용
  const filteredSnsPosts = useMemo(() => {
    if (snsCategory === "all") return snsPosts as any[];
    const catInfluencerIds = new Set(
      (snsInfluencers as any[]).filter((inf: any) => inf.category === snsCategory).map((inf: any) => inf.id)
    );
    return (snsPosts as any[]).filter((p: any) => catInfluencerIds.has(p.influencerId));
  }, [snsPosts, snsInfluencers, snsCategory]);
  // 카테고리 목록 (실제 인플루언서 카테고리 기반)
  const snsCategories = useMemo(() => {
    const cats = new Set((snsInfluencers as any[]).map((inf: any) => inf.category).filter(Boolean));
    return Array.from(cats) as string[];
  }, [snsInfluencers]);
  const snsCategoryLabels: Record<string, string> = { crypto: "크립토", defi: "DeFi", trading: "트레이딩", nft: "NFT", web3: "Web3", vc: "VC/투자" };
  // 장바구니 (로칼스토리지))
  const [cartCount, setCartCount] = useState(0);
  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem("alphabag-cart") || "[]");
    setCartCount(cart.length);
  }, []);

  // 검색 기능
  useEffect(() => {
    if (searchQuery.trim().length < 1) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    const q = searchQuery.toLowerCase();
    const results = (allPlans as any[]).filter((p: any) =>
      p.name?.toLowerCase().includes(q) ||
      p.strategy?.toLowerCase().includes(q) ||
      (Array.isArray(p.badgeLabels) && p.badgeLabels.some((b: string) => b.toLowerCase().includes(q))) ||
      (p.isMLM && (q === "mlm" || q.includes("mlm") || "mlm".includes(q)))
    );
    setSearchResults(results.slice(0, 8));
    setShowSearchResults(true);
  }, [searchQuery, allPlans]);

  // 외부 클릭 시 검색 결과 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // 광고 이미지
  const adImages = (banners as any[]).length > 0
    ? (banners as any[]).slice(0, 3).map((b: any) => ({ src: b.imageUrl || AD_DOLLARS, link: b.linkUrl || "#", title: b.title }))
    : [
        { src: AD_DOLLARS, link: "#", title: "Investment Opportunities" },
        { src: AD_TRADING, link: "#", title: "Crypto Trading" },
      ];

  // 테마 색상
  const bg = isDark ? "bg-[#0a0a0a]" : "bg-gray-50";
  const navBg = isDark ? "bg-[#0a0a0a]/95 border-white/5" : "bg-white/95 border-gray-200";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-500";
  const cardBg = isDark ? "bg-[#111111] border-white/10" : "bg-white border-gray-200 shadow-sm";
  const searchBg = isDark ? "bg-[#1a1a1a] border-white/10 text-white placeholder-gray-500" : "bg-white border-gray-300 text-gray-900 placeholder-gray-400";
  const tabActiveBg = isDark ? "bg-[#1a1a1a] text-white" : "bg-white text-gray-900 shadow-sm";
  const tabInactiveBg = isDark ? "text-gray-500 hover:text-gray-300" : "text-gray-500 hover:text-gray-700";

  return (
    <div className={`min-h-screen ${bg} ${textPrimary} transition-colors duration-300`}>
      {/* ─── 상단 네비게이션 ─── */}
      <nav className={`sticky top-0 z-50 backdrop-blur-xl border-b ${navBg}`}>
        <div className="max-w-7xl mx-auto px-3">
          <div className="h-14 flex items-center justify-between gap-3">
            {/* 로고 */}
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer flex-shrink-0">
                <img src={ALPHABAG_LOGO} alt="AlphaBag" className="w-8 h-8 rounded-lg object-contain bg-black" />
                <div className="hidden sm:block">
                  <div className={`font-black text-sm leading-tight ${textPrimary}`}>AlphaBag</div>
                  <div className="text-[9px] text-amber-400/70 leading-tight">Multi-Asset</div>
                </div>
              </div>
            </Link>

            {/* 데스크탑 메뉴 - 햄버거 */}
            <div className="hidden md:flex items-center gap-0.5">
              {/* About B-BAG 드롭다운 */}
              <div className="relative group">
                <button className={`flex items-center gap-1 px-3 py-1.5 text-xs ${textSecondary} rounded-lg transition-colors hover:text-amber-400`}>
                  About B-BAG
                  <ChevronDown className="w-3 h-3 group-hover:rotate-180 transition-transform" />
                </button>
                <div className={`absolute top-full left-0 mt-1 w-52 rounded-xl border shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all z-50 ${
                  isDark ? "bg-[#111] border-white/10" : "bg-white border-gray-200"
                }`}>
                  {[
                    { href: "/golden", label: "🏆 Golden Collection", color: "text-amber-500" },
                    { href: "/self", label: "⚡ Self Collection", color: "text-blue-500" },
                    { href: "/leader", label: "👑 Leader Collection", color: "text-emerald-500" },
                    { href: "/influencer", label: "⭐ Influencer", color: "text-purple-500" },
                    { href: "/meme", label: "🚀 Meme Token", color: "text-pink-500" },
                    { href: "/cbag", label: "💎 C-BAG", color: "text-cyan-500" },
                  ].map((sub) => (
                    <Link key={sub.href} href={sub.href}>
                      <div className={`px-4 py-2.5 text-xs ${sub.color} font-medium hover:bg-amber-50/50 cursor-pointer first:rounded-t-xl last:rounded-b-xl transition-colors`}>{sub.label}</div>
                    </Link>
                  ))}
                </div>
              </div>
              <Link href="/airdrop"><button className={`px-3 py-1.5 text-xs ${textSecondary} rounded-lg transition-colors hover:text-emerald-400`}>Airdrop</button></Link>
              <Link href="/partners"><button className={`px-3 py-1.5 text-xs ${textSecondary} rounded-lg transition-colors hover:text-blue-400`}>Partners</button></Link>
              <Link href="/notices"><button className={`px-3 py-1.5 text-xs ${textSecondary} rounded-lg transition-colors`}>Notices</button></Link>
              <Link href="/listing"><button className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                isDark ? "text-amber-400 hover:bg-amber-400/10" : "text-amber-600 hover:bg-amber-50"
              }`}>리스팅 신청</button></Link>
            </div>

            {/* 우측 액션 */}
            <div className="flex items-center gap-1.5">
              <LanguageSwitcher />

              {/* 테마 토글 */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-colors ${isDark ? "text-gray-400 hover:text-amber-400 hover:bg-amber-400/10" : "text-gray-500 hover:text-amber-500 hover:bg-amber-50"}`}
                title={isDark ? "라이트 모드" : "다크 모드"}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* 지갑 연결 */}
              {isConnected ? (
                <button
                  onClick={disconnectWallet}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-medium hover:bg-amber-500/30 transition-all"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </button>
              ) : (
                <button
                  onClick={openModal}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all"
                >
                  <Wallet className="w-3 h-3" />
                  <span className="hidden sm:inline">지갑 연결</span>
                </button>
              )}

              {/* 장바구니 */}
              <Link href="/cart">
                <button className={`relative flex items-center h-8 px-2.5 rounded-lg border transition-all ${isDark ? "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20" : "border-amber-400/40 bg-amber-50 text-amber-600 hover:bg-amber-100"}`}>
                  <ShoppingCart className="w-3.5 h-3.5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-500 text-black text-[10px] font-bold flex items-center justify-center">{cartCount}</span>
                  )}
                </button>
              </Link>

              {/* 모바일 메뉴 */}
              <button className={`md:hidden p-1.5 ${textSecondary}`} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* 모바일 메뉴 */}
        {mobileMenuOpen && (
          <div className={`md:hidden border-t px-4 py-3 space-y-1 ${isDark ? "border-white/5 bg-[#0d0d0d]" : "border-gray-100 bg-white"}`}>
            {/* About B-BAG 접이식 */}
            <div>
              <button
                onClick={() => setMobileAboutOpen(!mobileAboutOpen)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm font-semibold ${textPrimary} hover:bg-amber-50/50 rounded-lg transition-colors`}
              >
                About B-BAG
                <ChevronDown className={`w-4 h-4 transition-transform ${mobileAboutOpen ? "rotate-180" : ""}`} />
              </button>
              {mobileAboutOpen && (
                <div className="pl-4 space-y-0.5 mt-1">
                  {[
                    { href: "/golden", label: "🏆 Golden Collection", color: "text-amber-500" },
                    { href: "/self", label: "⚡ Self Collection", color: "text-blue-500" },
                    { href: "/leader", label: "👑 Leader Collection", color: "text-emerald-500" },
                    { href: "/influencer", label: "⭐ Influencer", color: "text-purple-500" },
                    { href: "/meme", label: "🚀 Meme Token", color: "text-pink-500" },
                    { href: "/cbag", label: "💎 C-BAG", color: "text-cyan-500" },
                  ].map((sub) => (
                    <Link key={sub.href} href={sub.href}>
                      <button className={`w-full text-left px-3 py-2 text-sm ${sub.color} hover:bg-white/5 rounded-lg transition-colors`} onClick={() => setMobileMenuOpen(false)}>{sub.label}</button>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            {[
              { href: "/airdrop", label: "🎁 Airdrop", color: "text-emerald-400" },
              { href: "/partners", label: "🤝 Partners", color: "text-blue-400" },
              { href: "/notices", label: "📢 Notices", color: textSecondary },
              { href: "/listing", label: "📝 리스팅 신청", color: "text-amber-500" },
              { href: "/dashboard", label: "📊 Dashboard", color: textSecondary },
            ].map((item) => (
              <Link key={item.href} href={item.href}>
                <button className={`w-full text-left px-3 py-2 text-sm ${item.color} hover:bg-white/5 rounded-lg transition-colors`} onClick={() => setMobileMenuOpen(false)}>
                  {item.label}
                </button>
              </Link>
            ))}
          </div>
        )}
      </nav>

      <div className="max-w-7xl mx-auto px-3 py-4">

        {/* ─── 검색바 (네이버 스타일) ─── */}
        <div ref={searchRef} className="relative mb-4">
          <div className={`flex items-center gap-2 rounded-2xl border px-4 py-3 ${searchBg} shadow-sm`}>
            <img src={ALPHABAG_LOGO} alt="α" className="w-5 h-5 rounded object-contain bg-black flex-shrink-0" />
            <input
              type="text"
              placeholder="AlphaBag 플랜, 전략 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery && setShowSearchResults(true)}
              className="flex-1 bg-transparent outline-none text-sm"
            />
            <button
              className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 hover:bg-amber-400 transition-colors"
              onClick={() => searchQuery && setShowSearchResults(true)}
            >
              <Search className="w-4 h-4 text-black" />
            </button>
          </div>

          {/* 검색 결과 드롭다운 */}
          {showSearchResults && searchResults.length > 0 && (
            <div className={`absolute top-full left-0 right-0 mt-1 rounded-xl border shadow-xl z-50 overflow-hidden ${isDark ? "bg-[#111111] border-white/10" : "bg-white border-gray-200"}`}>
              {searchResults.map((plan: any) => (
                <Link key={plan.id} href={`/plan/${plan.id}`}>
                  <div
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${isDark ? "hover:bg-white/5" : "hover:bg-gray-50"}`}
                    onClick={() => { setShowSearchResults(false); setSearchQuery(""); }}
                  >
                    {plan.logoUrl ? (
                      <img src={plan.logoUrl} alt={plan.name} className="w-7 h-7 rounded-lg object-contain bg-black/20" />
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 text-xs font-bold">{plan.name.charAt(0)}</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <HighlightText text={plan.name} query={searchQuery} className={`text-sm font-semibold truncate block ${textPrimary}`} />
                        {plan.isMLM && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500 text-white font-bold flex-shrink-0">MLM</span>}
                      </div>
                      {plan.strategy && <HighlightText text={plan.strategy} query={searchQuery} className={`text-xs truncate block ${textSecondary}`} />}
                    </div>
                    <div className="text-amber-400 text-sm font-bold">{Number(plan.dailyRate).toFixed(2)}%</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {showSearchResults && searchResults.length === 0 && searchQuery.trim().length > 0 && (
            <div className={`absolute top-full left-0 right-0 mt-1 rounded-xl border shadow-xl z-50 px-4 py-3 text-sm ${textSecondary} ${isDark ? "bg-[#111111] border-white/10" : "bg-white border-gray-200"}`}>
              "{searchQuery}" 검색 결과가 없습니다.
            </div>
          )}
        </div>

        {/* ─── 공지 + 광고 슬라이더 ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
          {/* 공지 박스 */}
          <div className={`lg:col-span-2 rounded-xl border p-4 ${cardBg}`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`font-bold text-sm ${textPrimary}`}>공지</span>
              <Badge className={`text-[10px] px-2 py-0.5 ${isDark ? "bg-amber-500/20 text-amber-300 border-amber-500/30" : "bg-amber-100 text-amber-700 border-amber-300"}`}>NOTICE</Badge>
            </div>
            {(notices as any[]).length > 0 ? (
              <div className="space-y-2 mb-3">
                {(notices as any[]).slice(0, 3).map((n: any, i: number) => (
                  <div key={n.id} className={`flex items-start gap-2 text-xs ${textSecondary}`}>
                    <span className="text-amber-400 font-bold flex-shrink-0">{i + 1})</span>
                    <span className="leading-relaxed">{n.title}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2 mb-3">
                {["Golden / Self / Node / CS 는 별도 페이지입니다.", "광고는 이미지 전용(텍스트 없음)입니다.", "지갑 연결 후 Add / Go / Cart 사용 가능합니다."].map((text, i) => (
                  <div key={i} className={`flex items-start gap-2 text-xs ${textSecondary}`}>
                    <span className="text-amber-400 font-bold flex-shrink-0">{i + 1})</span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            )}
            <div className={`flex flex-wrap items-center gap-3 pt-2 border-t ${isDark ? "border-white/5" : "border-gray-100"}`}>
              <Link href="/golden"><button className={`text-xs hover:text-amber-400 transition-colors ${textSecondary}`}>골든 컬렉션</button></Link>
              <Link href="/notices"><button className={`text-xs hover:text-amber-400 transition-colors ${textSecondary}`}>커뮤니티</button></Link>
              <button onClick={() => {
                const meeting = (notices as any[]).find((n: any) => n.type === "meeting" && n.isActive);
                setMeetingNotice(meeting || { id: 0, title: "온라인 회의 안내", content: "현재 예정된 온라인 회의가 없습니다.", meetingPlatform: "zoom" });
              }} className={`flex items-center gap-1 text-xs hover:text-amber-400 transition-colors ${textSecondary}`}>
                <Video className="w-3 h-3" /> 줌/온라인 회의
              </button>
              <button onClick={() => setShowReferralModal(true)} className={`flex items-center gap-1 text-xs hover:text-amber-400 transition-colors ${textSecondary}`}>
                <MessageSquare className="w-3 h-3" /> 추천글 선택
              </button>
            </div>
          </div>

          {/* 광고 슬라이더 */}
          <div className="lg:col-span-3">
            <AdSlider adImages={adImages} />
          </div>
        </div>

        {/* ─── 메인 + 사이드바 2열 레이아웃 ─── */}
        <div className="flex gap-4 items-start">
          {/* 왼쪽 메인 콘텐츠 */}
          <div className="flex-1 min-w-0">
        {/* ─── 모바일 전용 1줄 금융 위젯 ─── */}
        <div className="lg:hidden mb-3">
          <MobileMarketBar isDark={isDark} />
        </div>
        {/* ─── 소메뉴 탭 (네이버 스타일) ─── */}
        <div className={`rounded-xl border mb-4 overflow-hidden ${cardBg}`}>
          <div className="flex overflow-x-auto scrollbar-hide">
            {SUB_MENUS.map((menu) => (
              <button
                key={menu.id}
                onClick={() => setActiveTab(menu.id)}
                className={`flex-shrink-0 flex flex-col items-center gap-1 px-4 py-3 text-xs font-medium transition-all border-b-2 ${
                  activeTab === menu.id
                    ? `border-amber-400 text-amber-400 ${isDark ? "bg-amber-400/5" : "bg-amber-50"}`
                    : `border-transparent ${tabInactiveBg}`
                }`}
              >
                <span className="text-base">{menu.icon}</span>
                <span>{menu.label}</span>
              </button>
            ))}
          </div>

          {/* 탭 콘텐츠 */}
          <div className="p-4">
            {activeTab === "recommend" && (
              <div>
                <div className={`text-xs font-bold mb-3 ${textPrimary}`}>⭐ 추천 플랜</div>
                <div className="space-y-0">
                  {(goldenPlans as any[]).filter((p: any) => p.isHighlight).slice(0, 4).map((plan: any) => (
                    <PlanCardB key={plan.id} plan={plan} collectionColor="golden" />
                  ))}
                  {(goldenPlans as any[]).filter((p: any) => p.isHighlight).length === 0 && (
                    <div className={`text-xs ${textSecondary} text-center py-4`}>추천 플랜이 없습니다.</div>
                  )}
                </div>
              </div>
            )}
            {activeTab === "bbag" && (
              <div>
                <div className={`text-xs font-bold mb-3 ${textPrimary}`}>💰 B Bag 컬렉션</div>
                <div className="space-y-0">
                  {(goldenPlans as any[]).slice(0, 5).map((plan: any) => (
                    <PlanCardB key={plan.id} plan={plan} collectionColor="golden" />
                  ))}
                </div>
              </div>
            )}
            {activeTab === "infoweb4" && (
              <div>
                <div className={`text-xs font-bold mb-3 ${textPrimary}`}>🌐 InfoWeb4 플랜</div>
                <div className="space-y-0">
                  {(allPlans as any[]).filter((p: any) => p.infoweb4Url).slice(0, 5).map((plan: any) => (
                    <PlanCardB key={plan.id} plan={plan} collectionColor="self" />
                  ))}
                  {(allPlans as any[]).filter((p: any) => p.infoweb4Url).length === 0 && (
                    <div className={`text-xs ${textSecondary} text-center py-4`}>infoweb4 연동 플랜이 없습니다.</div>
                  )}
                </div>
              </div>
            )}
            {activeTab === "sns" && (
              <div>
                {/* 카테고리 필터 탭 */}
                {snsCategories.length > 1 && (
                  <div className="flex items-center gap-1.5 mb-3 overflow-x-auto scrollbar-hide pb-1">
                    <button
                      onClick={() => { setSnsCategory("all"); setSelectedInfluencerId(null); }}
                      className={`flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                        snsCategory === "all"
                          ? isDark ? "bg-sky-500/20 border-sky-500/40 text-sky-300" : "bg-sky-100 border-sky-300 text-sky-700"
                          : isDark ? "bg-white/5 border-white/10 text-gray-400" : "bg-gray-100 border-gray-200 text-gray-500"
                      }`}
                    >
                      전체
                    </button>
                    {snsCategories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => { setSnsCategory(cat); setSelectedInfluencerId(null); }}
                        className={`flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                          snsCategory === cat
                            ? isDark ? "bg-sky-500/20 border-sky-500/40 text-sky-300" : "bg-sky-100 border-sky-300 text-sky-700"
                            : isDark ? "bg-white/5 border-white/10 text-gray-400" : "bg-gray-100 border-gray-200 text-gray-500"
                        }`}
                      >
                        {snsCategoryLabels[cat] || cat}
                      </button>
                    ))}
                  </div>
                )}
                {/* 인플루언서 필터 리스트 */}
                <div className="flex items-center gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
                  <button
                    onClick={() => setSelectedInfluencerId(null)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      selectedInfluencerId === null
                        ? isDark ? "bg-sky-500/20 border-sky-500/40 text-sky-300" : "bg-sky-100 border-sky-300 text-sky-700"
                        : isDark ? "bg-white/5 border-white/10 text-gray-400" : "bg-gray-100 border-gray-200 text-gray-500"
                    }`}
                  >
                    📱 전체
                  </button>
                  {(snsInfluencers as any[])
                    .filter((inf: any) => snsCategory === "all" || inf.category === snsCategory)
                    .map((inf: any) => (
                    <button
                      key={inf.id}
                      onClick={() => setSelectedInfluencerId(inf.id)}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        selectedInfluencerId === inf.id
                          ? isDark ? "bg-sky-500/20 border-sky-500/40 text-sky-300" : "bg-sky-100 border-sky-300 text-sky-700"
                          : isDark ? "bg-white/5 border-white/10 text-gray-400" : "bg-gray-100 border-gray-200 text-gray-500"
                      }`}
                    >
                      {inf.avatarUrl ? (
                        <img src={inf.avatarUrl} alt={inf.name} className="w-4 h-4 rounded-full object-cover" />
                      ) : (
                        <span className="w-4 h-4 rounded-full bg-sky-400/30 flex items-center justify-center text-[9px] font-bold">{inf.name[0]}</span>
                      )}
                      {inf.name}
                    </button>
                  ))}
                </div>

                {/* 포스트 피드 */}
                {snsPostsLoading ? (
                  <div className={`text-xs ${textSecondary} text-center py-8`}>로딩 중...</div>
                ) : filteredSnsPosts.length === 0 ? (
                  <div className={`text-center py-8`}>
                    <div className="text-3xl mb-2">📱</div>
                    <div className={`text-xs ${textSecondary}`}>{snsCategory !== "all" ? `${snsCategoryLabels[snsCategory] || snsCategory} 카테고리 소식이 없습니다.` : "등록된 SNS 소식이 없습니다."}</div>
                    <div className={`text-[10px] ${textSecondary} mt-1`}>관리자가 인플루언서 소식을 등록하면 여기에 표시됩니다.</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredSnsPosts.map((post: any) => (
                      <div
                        key={post.id}
                        className={`rounded-xl border p-3.5 transition-all hover:shadow-md ${
                          isDark ? "bg-white/3 border-white/8 hover:border-sky-500/30" : "bg-white border-gray-100 hover:border-sky-300/50 shadow-sm"
                        }`}
                      >
                        {/* 인플루언서 헤더 */}
                        <div className="flex items-center justify-between mb-2.5">
                          <div className="flex items-center gap-2">
                            {post.influencerAvatarUrl ? (
                              <img src={post.influencerAvatarUrl} alt={post.influencerName} className="w-8 h-8 rounded-full object-cover border-2 border-sky-400/30" />
                            ) : (
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                isDark ? "bg-sky-500/20 text-sky-300" : "bg-sky-100 text-sky-600"
                              }`}>
                                {post.influencerName?.[0] || "?"}
                              </div>
                            )}
                            <div>
                              <div className={`text-xs font-bold ${textPrimary}`}>{post.influencerName}</div>
                              <div className={`text-[10px] ${textSecondary}`}>@{post.influencerHandle}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] ${textSecondary}`}>
                              {new Date(post.postedAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                            </span>
                            {post.tweetUrl && (
                              <a
                                href={post.tweetUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-0.5 text-[10px] font-medium px-2 py-0.5 rounded-full transition-colors ${
                                  isDark ? "bg-sky-500/15 text-sky-400 hover:bg-sky-500/25" : "bg-sky-50 text-sky-600 hover:bg-sky-100"
                                }`}
                                onClick={e => e.stopPropagation()}
                              >
                                🐦 X
                              </a>
                            )}
                          </div>
                        </div>
                        {/* 포스트 내용 */}
                        <p className={`text-xs leading-relaxed ${textPrimary} whitespace-pre-wrap`}>{post.content}</p>
                        {/* 에끄 지표 */}
                        <div className={`flex items-center gap-4 mt-2.5 pt-2.5 border-t ${
                          isDark ? "border-white/5" : "border-gray-100"
                        }`}>
                          <span className={`flex items-center gap-1 text-[10px] ${textSecondary}`}>
                            ❤️ {post.likes?.toLocaleString() || 0}
                          </span>
                          <span className={`flex items-center gap-1 text-[10px] ${textSecondary}`}>
                            🔁 {post.retweets?.toLocaleString() || 0}
                          </span>
                          <span className={`flex items-center gap-1 text-[10px] ${textSecondary}`}>
                            💬 {post.replies?.toLocaleString() || 0}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeTab === "news" && (
              <div>
                <div className={`text-xs font-bold mb-3 ${textPrimary}`}>📰 최신 뉴스</div>
                <div className="space-y-3">
                  {[
                    { title: "AlphaBag 새로운 Golden Collection 출시", time: "2시간 전", category: "공지" },
                    { title: "BTC 신고가 경신 - 암호화폐 시장 동향", time: "4시간 전", category: "시장" },
                    { title: "Node 스테이킹 수익률 업데이트", time: "1일 전", category: "업데이트" },
                    { title: "커뮤니티 미팅 일정 안내", time: "2일 전", category: "이벤트" },
                  ].map((news, i) => (
                    <div key={i} className={`flex items-start gap-3 pb-3 border-b last:border-0 ${isDark ? "border-white/5" : "border-gray-100"}`}>
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                        <Newspaper className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-medium ${textPrimary} leading-relaxed`}>{news.title}</div>
                        <div className={`text-[10px] ${textSecondary} mt-0.5`}>{news.category} · {news.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeTab === "contents" && (
              <div>
                <div className={`text-xs font-bold mb-3 ${textPrimary}`}>🎬 콘텐츠</div>
                <div className="grid grid-cols-2 gap-3">
                  {(allPlans as any[]).filter((p: any) => p.videoUrl).slice(0, 4).map((plan: any) => (
                    <a key={plan.id} href={plan.videoUrl} target="_blank" rel="noopener noreferrer">
                      <div className={`rounded-xl overflow-hidden border ${isDark ? "border-white/10" : "border-gray-200"} group cursor-pointer`}>
                        <div className="relative aspect-video bg-black/20 flex items-center justify-center">
                          {plan.thumbnailImages?.[0] ? (
                            <img src={plan.thumbnailImages[0]} alt={plan.name} className="w-full h-full object-cover opacity-70" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-amber-900/30 to-black" />
                          )}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-colors">
                              <Play className="w-4 h-4 text-white fill-white" />
                            </div>
                          </div>
                        </div>
                        <div className="p-2">
                          <div className={`text-xs font-medium truncate ${textPrimary}`}>{plan.name}</div>
                        </div>
                      </div>
                    </a>
                  ))}
                  {(allPlans as any[]).filter((p: any) => p.videoUrl).length === 0 && (
                    <div className={`col-span-2 text-xs ${textSecondary} text-center py-4`}>콘텐츠가 없습니다.</div>
                  )}
                </div>
              </div>
            )}
            {activeTab === "trending" && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`text-xs font-bold ${textPrimary}`}>🚀 급등 토큰 감지</div>
                  <span className={`text-[10px] ${textSecondary}`}>CoinGecko · 24h +5%이상</span>
                </div>
                {trendingLoading ? (
                  <div className={`text-xs ${textSecondary} text-center py-6`}>데이터 로딩 중...</div>
                ) : trendingTokens.length === 0 ? (
                  <div className={`text-xs ${textSecondary} text-center py-6`}>현재 급등 토큰이 없습니다.</div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {(trendingTokens as any[]).map((token: any) => (
                      <a key={token.id} href={`https://www.coingecko.com/en/coins/${token.id}`} target="_blank" rel="noopener noreferrer"
                        className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all hover:scale-[1.02] ${
                          isDark ? "bg-white/4 border-white/8 hover:border-emerald-500/40" : "bg-gray-50 border-gray-100 hover:border-emerald-400/40"
                        }`}>
                        {token.image ? (
                          <img src={token.image} alt={token.symbol} className="w-8 h-8 rounded-full flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-emerald-400">{token.symbol[0]}</span>
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className={`text-xs font-bold ${textPrimary} truncate`}>{token.symbol}</div>
                          <div className={`text-[10px] ${textSecondary} truncate`}>{token.name}</div>
                          <div className="flex items-center gap-1">
                            <span className={`text-[10px] font-semibold ${textPrimary}`}>
                              ${token.currentPrice >= 1 ? token.currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 }) : token.currentPrice.toFixed(6)}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-400">
                              +{token.priceChange24h?.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
                {/* 트렌딩 코인 섯션 */}
                <div className="mt-4">
                  <div className={`text-xs font-bold mb-2 ${textPrimary}`}>🔥 트렌딩 코인</div>
                  {trendingCoinsLoading ? (
                    <div className={`text-xs ${textSecondary} text-center py-3`}>로딩 중...</div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {(trendingCoins as any[]).map((coin: any) => (
                        <a key={coin.id} href={`https://www.coingecko.com/en/coins/${coin.id}`} target="_blank" rel="noopener noreferrer"
                          className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all hover:scale-[1.02] ${
                            isDark ? "bg-white/4 border-white/8 hover:border-amber-500/40" : "bg-gray-50 border-gray-100 hover:border-amber-400/40"
                          }`}>
                          {coin.image ? (
                            <img src={coin.image} alt={coin.symbol} className="w-8 h-8 rounded-full flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-amber-400">{coin.symbol[0]}</span>
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className={`text-xs font-bold ${textPrimary} truncate`}>{coin.symbol}</div>
                            <div className={`text-[10px] ${textSecondary} truncate`}>{coin.name}</div>
                            <div className={`text-[10px] font-bold ${
                              coin.priceChange24h >= 0 ? "text-emerald-400" : "text-red-400"
                            }`}>
                              {coin.priceChange24h >= 0 ? "+" : ""}{coin.priceChange24h?.toFixed(1)}%
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeTab === "airdrop" && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`text-xs font-bold ${textPrimary}`}>🎁 에어드랍</div>
                  <span className={`text-[10px] ${textSecondary}`}>활성 에어드랍</span>
                </div>
                {airdropList.length === 0 ? (
                  <div className={`rounded-xl border p-8 text-center ${
                    isDark ? "bg-[#0d0d0d] border-white/5" : "bg-gray-50 border-gray-200"
                  }`}>
                    <div className="text-3xl mb-2">🎁</div>
                    <div className={`text-xs font-semibold ${textPrimary} mb-1`}>예정된 에어드랍이 없습니다</div>
                    <div className={`text-[10px] ${textSecondary}`}>새로운 에어드랍이 등록되면 알림을 드립니다</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(airdropList as any[]).map((drop: any) => (
                      <div key={drop.id} className={`rounded-xl border overflow-hidden ${
                        isDark ? "bg-white/3 border-white/8" : "bg-white border-gray-200"
                      }`}>
                        {drop.imageUrl && (
                          <img src={drop.imageUrl} alt={drop.name} className="w-full h-24 object-cover" />
                        )}
                        <div className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-1">
                                {drop.isHot && (
                                  <span className="text-[9px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-full">🔥 HOT</span>
                                )}
                                <span className={`text-xs font-bold ${textPrimary} truncate`}>{drop.name}</span>
                              </div>
                              <div className={`text-[10px] ${textSecondary} mb-2 line-clamp-2`}>{drop.description}</div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                                  {drop.tokenSymbol}
                                </span>
                                <span className={`text-[10px] ${textSecondary}`}>{drop.totalAmount} 총지급</span>
                              </div>
                            </div>
                          </div>
                          {drop.participateUrl && (
                            <a href={drop.participateUrl} target="_blank" rel="noopener noreferrer"
                              className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-colors">
                              🎁 에어드랍 참여하기
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeTab === "favorites" && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`text-xs font-bold ${textPrimary}`}>❤️ 즐겨찾기 콜렉션</div>
                  <span className={`text-[10px] ${textSecondary}`}>{favoritesList.length}개 저장됨</span>
                </div>
                {!isAuthenticated ? (
                  <div className={`rounded-xl border p-8 text-center ${isDark ? "bg-[#0d0d0d] border-white/5" : "bg-gray-50 border-gray-200"}`}>
                    <div className="text-3xl mb-2">❤️</div>
                    <div className={`text-xs font-semibold ${textPrimary} mb-1`}>로그인이 필요합니다</div>
                    <div className={`text-[10px] ${textSecondary}`}>즐겨찾기를 사용하려면 로그인하세요</div>
                  </div>
                ) : favoritesList.length === 0 ? (
                  <div className={`rounded-xl border p-8 text-center ${isDark ? "bg-[#0d0d0d] border-white/5" : "bg-gray-50 border-gray-200"}`}>
                    <div className="text-3xl mb-2">❤️</div>
                    <div className={`text-xs font-semibold ${textPrimary} mb-1`}>즐겨찾기가 없습니다</div>
                    <div className={`text-[10px] ${textSecondary}`}>플랜 상세에서 ♥ 버튼을 눌러 즐겨찾기를 저장하세요</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(favoritesList as any[]).map((fav: any) => {
                      const plan = fav.plan;
                      if (!plan) return null;
                      return (
                        <div key={fav.favoriteId} className={`rounded-xl border overflow-hidden transition-all hover:scale-[1.01] ${isDark ? "bg-white/3 border-white/8 hover:border-pink-500/30" : "bg-white border-gray-200 hover:border-pink-300"}`}>
                          <div className="flex items-center gap-3 p-3">
                            {plan.logoUrl ? (
                              <img src={plan.logoUrl} alt={plan.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center flex-shrink-0">
                                <span className="text-lg">❤️</span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                {plan.label && (
                                  <span className="text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-full">{plan.label}</span>
                                )}
                                <span className={`text-xs font-bold ${textPrimary} truncate`}>{plan.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-emerald-400">일 {parseFloat(plan.dailyRate || "0").toFixed(2)}%</span>
                                {plan.duration && <span className={`text-[10px] ${textSecondary}`}>{plan.duration}일</span>}
                                {plan.minAmount && <span className={`text-[10px] ${textSecondary}`}>최소 {parseFloat(plan.minAmount).toLocaleString()}</span>}
                              </div>
                              {plan.description && (
                                <div className={`text-[10px] ${textSecondary} truncate mt-0.5`}>{plan.description}</div>
                              )}
                            </div>
                            <button
                              onClick={() => toggleFavoriteMutation.mutate({ planId: plan.id })}
                              className="flex-shrink-0 p-1.5 rounded-lg text-pink-400 hover:bg-pink-500/10 transition-colors"
                              title="즐겨찾기 제거"
                            >
                              ♥
                            </button>
                          </div>
                          {plan.badgeLabels && Array.isArray(plan.badgeLabels) && plan.badgeLabels.length > 0 && (
                            <div className="px-3 pb-2 flex flex-wrap gap-1">
                              {(plan.badgeLabels as string[]).map((badge: string, i: number) => (
                                <span key={i} className={`text-[9px] px-1.5 py-0.5 rounded-full border ${isDark ? "border-white/10 text-white/50" : "border-gray-200 text-gray-400"}`}>{badge}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {activeTab === "live" && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className={`text-xs font-bold ${textPrimary}`}>🔴 Live</span>
                </div>
                <div className={`rounded-xl border p-6 text-center ${isDark ? "bg-[#0d0d0d] border-white/5" : "bg-gray-50 border-gray-200"}`}>
                  <Tv className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                  <div className={`text-xs ${textSecondary}`}>라이브 방송 준비 중입니다.</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── 뷰 타입 선택 + 통계 ─── */}
        <div className="flex items-center justify-between mb-4">
          <div className={`text-xs font-bold ${textPrimary}`}>투자 플랜</div>
          <div className={`flex items-center gap-1 rounded-xl p-1 ${isDark ? "bg-[#111111] border border-white/10" : "bg-gray-100 border border-gray-200"}`}>
            {([
              { type: "A" as ViewType, label: "A", title: "손글씨" },
              { type: "B" as ViewType, label: "B", title: "목록형" },
              { type: "C" as ViewType, label: "C", title: "카드형" },
            ] as const).map((v) => (
              <button
                key={v.type}
                onClick={() => setViewType(v.type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewType === v.type
                    ? `${isDark ? "bg-amber-500 text-black" : "bg-amber-500 text-black"} shadow-sm`
                    : `${tabInactiveBg}`
                }`}
                title={v.title}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* ─── 골든 컬렉션 상장 신청 CTA 배너 ─── */}
        <div className={`relative overflow-hidden rounded-2xl mb-4 p-5 border ${isDark ? "bg-gradient-to-r from-amber-900/30 via-yellow-900/20 to-amber-900/30 border-amber-500/30" : "bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border-amber-300"}`}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🏆</div>
              <div>
                <div className={`text-sm font-bold mb-0.5 ${isDark ? "text-amber-300" : "text-amber-700"}`}>골든 컬렉션 상장 신청</div>
                <div className={`text-xs ${isDark ? "text-amber-400/70" : "text-amber-600/80"}`}>알파백 노드 투표로 선정 · 상장비용 500 USDT · 투표 노드에 수익 분배</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/vote">
                <button className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${isDark ? "border-amber-500/40 text-amber-400 hover:bg-amber-500/10" : "border-amber-400 text-amber-700 hover:bg-amber-100"}`}>
                  투표 참여
                </button>
              </Link>
              <Link href="/submit-plan">
                <button className="text-xs px-4 py-1.5 rounded-lg bg-amber-500 text-black font-bold hover:bg-amber-400 transition-all shadow-sm">
                  상장 신청하기 →
                </button>
              </Link>
            </div>
          </div>
          {/* 배경 장식 */}
          <div className="absolute -right-4 -top-4 text-6xl opacity-10 pointer-events-none">🏆</div>
          <div className="absolute -right-8 -bottom-4 text-8xl opacity-5 pointer-events-none">⭐</div>
        </div>

        {/* ─── 컬렉션 섹션들 ─── */}
        <CollectionSection title="Golden Collection" subtitle="BINANCE Alpha · Insurance(Hedge) · Daily Returns" plans={goldenPlans as any[]} color="golden" href="/golden" icon={<span>🏆</span>} viewType={viewType} isDark={isDark} />
        <CollectionSection title="Self Collection" subtitle="Custom Strategy · Flexible · Self-managed" plans={selfPlans as any[]} color="self" href="/self" icon={<span>⚡</span>} viewType={viewType} isDark={isDark} />
        <CollectionSection title="Node Products" subtitle="Node Infrastructure · Deposit · External DApp" plans={nodePlans as any[]} color="node" href="/node" icon={<span>🔷</span>} viewType={viewType} isDark={isDark} />
        <CollectionSection title="Leader Collection" subtitle="리더 추천 · 검증된 전략 · 커뮤니티 선택" plans={leaderPlans as any[]} color="leader" href="/leader" icon={<span>👑</span>} viewType={viewType} isDark={isDark} />
        <CollectionSection title="Meme Token" subtitle="밈토큰 · 고수익 · 커뮤니티 드리븐" plans={memePlans as any[]} color="meme" href="/meme" icon={<span>🚀</span>} viewType={viewType} isDark={isDark} />
        <CollectionSection title="Influencer" subtitle="인플루언서 추천 · 트렌딩 · 소셜 검증" plans={influencerPlans as any[]} color="influencer" href="/influencer" icon={<span>⭐</span>} viewType={viewType} isDark={isDark} />

        {/* ─── 특징 섹션 ─── */}
        <section className="mt-4 mb-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: <Shield className="w-5 h-5" />, title: "Secure", desc: "Multi-sig protection", color: "text-green-400", bg: "bg-green-400/10" },
              { icon: <Zap className="w-5 h-5" />, title: "Daily Payouts", desc: "Automated distribution", color: "text-amber-400", bg: "bg-amber-400/10" },
              { icon: <Globe className="w-5 h-5" />, title: "Global Access", desc: "21 languages", color: "text-blue-400", bg: "bg-blue-400/10" },
              { icon: <Users className="w-5 h-5" />, title: "Referral Rewards", desc: "Earn from network", color: "text-purple-400", bg: "bg-purple-400/10" },
            ].map((f) => (
              <div key={f.title} className={`rounded-xl p-4 text-center border transition-colors ${isDark ? "bg-[#111111] border-white/5 hover:border-white/10" : "bg-white border-gray-200 hover:border-gray-300 shadow-sm"}`}>
                <div className={`w-10 h-10 rounded-xl ${f.bg} ${f.color} flex items-center justify-center mx-auto mb-3`}>{f.icon}</div>
                <div className={`text-sm font-semibold mb-1 ${textPrimary}`}>{f.title}</div>
                <div className={`text-xs ${textSecondary}`}>{f.desc}</div>
              </div>
            ))}
          </div>
        </section>
          </div>{/* end main */}
          {/* 오른쪽 사이드바 */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-20 space-y-3">
              <MarketWidget isDark={isDark} sidebar />
              <TodayRecommendWidget isDark={isDark} onSelectPlan={setSelectedPlanId} />
            </div>
          </div>
        </div>{/* end 2열 */}
      </div>

      {/* ─── 모달들 ─── */}
      {selectedPlanId && <PlanDetailModal planId={selectedPlanId} onClose={() => setSelectedPlanId(null)} />}
      {showReferralModal && <ReferralMessageModal onClose={() => setShowReferralModal(false)} />}
      {meetingNotice && <MeetingNoticeModal notice={meetingNotice} onClose={() => setMeetingNotice(null)} />}

      {/* ─── 푸터 ─── */}
      <footer className={`border-t py-6 ${isDark ? "border-white/5 bg-[#050505]" : "border-gray-200 bg-white"}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <img src={ALPHABAG_LOGO} alt="AlphaBag" className="w-7 h-7 rounded object-contain bg-black" />
              <div>
                <div className={`text-sm font-bold ${isDark ? "text-gray-400" : "text-gray-600"}`}>AlphaBag</div>
                <div className="text-[10px] text-gray-500">Multi-Asset Investment Platform</div>
              </div>
            </div>
            <div className={`flex items-center gap-5 text-xs ${textSecondary}`}>
              <Link href="/golden"><span className="hover:text-amber-400 cursor-pointer transition-colors">Golden</span></Link>
              <Link href="/self"><span className="hover:text-blue-400 cursor-pointer transition-colors">Self</span></Link>
              <Link href="/notices"><span className="hover:text-amber-400 cursor-pointer transition-colors">Notices</span></Link>
              <Link href="/#airdrop"><span className="hover:text-emerald-400 cursor-pointer transition-colors">Airdrop</span></Link>
            </div>
            <div className={`text-xs ${textSecondary}`}>© 2025 AlphaBag. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
