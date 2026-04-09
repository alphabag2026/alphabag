import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart, Trash2, ArrowLeft, ExternalLink,
  Sun, Moon, TrendingUp, Star, Package, ChevronRight
} from "lucide-react";
import { toast } from "sonner";

const ALPHABAG_LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663373200888/TGrbnQ7ygm6GBAS6CWnuGe/alphabag-logo_df90878d.png";

interface CartItem {
  id: number;
  name: string;
  addedAt: number;
}

const COLLECTION_COLOR_MAP: Record<string, string> = {
  golden: "text-amber-500",
  self: "text-blue-500",
  node: "text-purple-500",
  leader: "text-emerald-500",
  meme: "text-pink-500",
  influencer: "text-orange-500",
};

const COLLECTION_BG_MAP: Record<string, string> = {
  golden: "bg-amber-500/10 border-amber-500/20",
  self: "bg-blue-500/10 border-blue-500/20",
  node: "bg-purple-500/10 border-purple-500/20",
  leader: "bg-emerald-500/10 border-emerald-500/20",
  meme: "bg-pink-500/10 border-pink-500/20",
  influencer: "bg-orange-500/10 border-orange-500/20",
};

export default function CartPage() {
  const { t } = useTranslation();
  const { theme, toggleTheme, switchable } = useTheme();
  const isDark = theme === "dark";
  const [, navigate] = useLocation();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [planIds, setPlanIds] = useState<number[]>([]);

  // localStorage에서 카트 로드
  useEffect(() => {
    const raw = localStorage.getItem("alphabag_cart");
    const parsed: CartItem[] = raw ? JSON.parse(raw) : [];
    setCartItems(parsed);
    setPlanIds(parsed.map((i) => i.id));
  }, []);

  // 플랜 상세 정보 로드
  const { data: allPlans = [], isLoading } = trpc.public.plans.useQuery({});

  // 카트에 담긴 플랜만 필터
  const cartPlans = (allPlans as any[]).filter((p: any) => planIds.includes(p.id));

  const removeFromCart = (id: number) => {
    const updated = cartItems.filter((item) => item.id !== id);
    setCartItems(updated);
    setPlanIds(updated.map((i) => i.id));
    localStorage.setItem("alphabag_cart", JSON.stringify(updated));
    toast.success("카트에서 제거했습니다.");
    // 카트 카운트 갱신 이벤트
    window.dispatchEvent(new Event("cart-updated"));
  };

  const clearCart = () => {
    setCartItems([]);
    setPlanIds([]);
    localStorage.setItem("alphabag_cart", JSON.stringify([]));
    toast.success("카트를 비웠습니다.");
    window.dispatchEvent(new Event("cart-updated"));
  };

  // 테마 클래스
  const bg = isDark ? "bg-[#0a0a0f]" : "bg-gray-50";
  const navBg = isDark ? "bg-black/80 border-white/10" : "bg-white/90 border-gray-200";
  const cardBg = isDark ? "bg-white/5 border-white/10" : "bg-white border-gray-200";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-500";

  return (
    <div className={`min-h-screen ${bg} ${textPrimary} transition-colors duration-300`}>
      {/* 네비게이션 */}
      <nav className={`sticky top-0 z-50 backdrop-blur-xl border-b ${navBg}`}>
        <div className="max-w-5xl mx-auto px-4">
          <div className="h-14 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link href="/">
                <div className="flex items-center gap-2 cursor-pointer">
                  <img src={ALPHABAG_LOGO} alt="AlphaBag" className="w-8 h-8 rounded-lg object-contain bg-black" />
                  <span className="font-black text-sm text-amber-500 hidden sm:block">AlphaBag</span>
                </div>
              </Link>
              <span className={`text-xs ${textSecondary}`}>/</span>
              <span className="text-sm font-semibold flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4 text-amber-500" />
                관심 플랜
              </span>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              {switchable && (
                <button
                  onClick={toggleTheme}
                  className={`p-1.5 rounded-lg transition-colors ${isDark ? "hover:bg-white/10 text-gray-400" : "hover:bg-gray-100 text-gray-600"}`}
                >
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              )}
              <Link href="/">
                <Button variant="outline" size="sm" className="text-xs gap-1.5">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  홈으로
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-amber-500" />
              관심 플랜 목록
            </h1>
            <p className={`text-sm ${textSecondary} mt-1`}>
              관심 있는 투자 플랜을 모아보세요. 총 <span className="text-amber-500 font-bold">{cartItems.length}</span>개
            </p>
          </div>
          {cartItems.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearCart}
              className="text-xs gap-1.5 text-red-500 border-red-500/30 hover:bg-red-500/10"
            >
              <Trash2 className="w-3.5 h-3.5" />
              전체 삭제
            </Button>
          )}
        </div>

        {/* 빈 카트 */}
        {cartItems.length === 0 && (
          <div className={`rounded-2xl border ${cardBg} p-16 text-center`}>
            <div className="text-6xl mb-4">🛒</div>
            <div className="text-lg font-bold mb-2">관심 플랜이 없습니다</div>
            <p className={`text-sm ${textSecondary} mb-6`}>
              플랜 상세 페이지에서 "담기" 버튼을 눌러 관심 플랜을 추가해보세요.
            </p>
            <Link href="/">
              <Button className="bg-amber-500 hover:bg-amber-600 text-black font-bold gap-2">
                <Package className="w-4 h-4" />
                플랜 둘러보기
              </Button>
            </Link>
          </div>
        )}

        {/* 카트 아이템 목록 */}
        {cartItems.length > 0 && (
          <div className="space-y-3">
            {isLoading ? (
              Array.from({ length: cartItems.length }).map((_, i) => (
                <div key={i} className={`rounded-xl border ${cardBg} p-4 animate-pulse`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl ${isDark ? "bg-white/10" : "bg-gray-100"}`} />
                    <div className="flex-1 space-y-2">
                      <div className={`h-4 w-32 rounded ${isDark ? "bg-white/10" : "bg-gray-100"}`} />
                      <div className={`h-3 w-24 rounded ${isDark ? "bg-white/10" : "bg-gray-100"}`} />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              cartItems.map((item) => {
                const plan = cartPlans.find((p: any) => p.id === item.id);
                const collectionType = plan?.collectionType || "golden";
                const accentColor = COLLECTION_COLOR_MAP[collectionType] || "text-amber-500";
                const cardAccent = COLLECTION_BG_MAP[collectionType] || "bg-amber-500/10 border-amber-500/20";

                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border ${cardBg} p-4 transition-all hover:shadow-md group`}
                  >
                    <div className="flex items-center gap-4">
                      {/* 로고 */}
                      <div className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center border ${cardAccent} overflow-hidden`}>
                        {plan?.logoUrl ? (
                          <img src={plan.logoUrl} alt={plan.name} className="w-full h-full object-contain p-1" />
                        ) : (
                          <span className={`text-xl font-black ${accentColor}`}>
                            {item.name.charAt(0)}
                          </span>
                        )}
                      </div>

                      {/* 플랜 정보 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm truncate">{plan?.name || item.name}</span>
                          {plan?.isHighlight && (
                            <Badge className="text-[10px] px-1.5 py-0 bg-amber-500/20 text-amber-500 border-amber-500/30">HOT</Badge>
                          )}
                          {plan?.collectionType && (
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${accentColor} border-current/30`}>
                              {plan.collectionType.charAt(0).toUpperCase() + plan.collectionType.slice(1)}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          {plan ? (
                            <>
                              <span className={`text-xs font-bold ${accentColor} flex items-center gap-0.5`}>
                                <TrendingUp className="w-3 h-3" />
                                {Number(plan.dailyRate).toFixed(2)}% Daily
                              </span>
                              {plan.minAmount && Number(plan.minAmount) > 0 && (
                                <span className={`text-xs ${textSecondary}`}>
                                  Min: {Number(plan.minAmount).toLocaleString()} USDT
                                </span>
                              )}
                              {plan.rating && (
                                <span className={`text-xs ${textSecondary} flex items-center gap-0.5`}>
                                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                  {Number(plan.rating).toFixed(1)}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className={`text-xs ${textSecondary}`}>플랜 정보 로딩 중...</span>
                          )}
                        </div>
                        <div className={`text-[10px] ${textSecondary} mt-0.5`}>
                          추가일: {new Date(item.addedAt).toLocaleDateString()}
                        </div>
                      </div>

                      {/* 액션 버튼 */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Link href={`/plan/${item.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className={`text-xs gap-1 ${accentColor} border-current/30 hover:bg-current/10`}
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span className="hidden sm:inline">상세보기</span>
                          </Button>
                        </Link>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className={`p-1.5 rounded-lg transition-colors text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* 하단 요약 */}
        {cartItems.length > 0 && !isLoading && cartPlans.length > 0 && (
          <div className={`mt-6 rounded-xl border ${cardBg} p-5`}>
            <div className="text-sm font-bold mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              관심 플랜 요약
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-black text-amber-500">{cartPlans.length}</div>
                <div className={`text-xs ${textSecondary}`}>총 플랜 수</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-emerald-500">
                  {cartPlans.length > 0
                    ? (cartPlans.reduce((sum: number, p: any) => sum + Number(p.dailyRate), 0) / cartPlans.length).toFixed(2)
                    : "0.00"}%
                </div>
                <div className={`text-xs ${textSecondary}`}>평균 Daily Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-blue-500">
                  {cartPlans.filter((p: any) => p.isHighlight).length}
                </div>
                <div className={`text-xs ${textSecondary}`}>HOT 플랜</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-purple-500">
                  {cartPlans.filter((p: any) => p.isMLM).length}
                </div>
                <div className={`text-xs ${textSecondary}`}>MLM 플랜</div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border/40 flex flex-col sm:flex-row gap-2">
              <Link href="/" className="flex-1">
                <Button variant="outline" className="w-full text-sm gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  더 둘러보기
                </Button>
              </Link>
              <Link href="/golden" className="flex-1">
                <Button className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold text-sm gap-2">
                  🏆 Golden Collection 보기
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* 푸터 */}
      <footer className={`border-t border-border/40 ${isDark ? "bg-black/30" : "bg-white/50"} py-8 mt-12`}>
        <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <img src={ALPHABAG_LOGO} alt="AlphaBag" className="w-7 h-7 rounded object-contain" />
              <span className={`text-sm font-bold ${textSecondary}`}>AlphaBag</span>
            </div>
          </Link>
          <div className={`text-xs ${textSecondary}`}>© 2026 AlphaBag. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
