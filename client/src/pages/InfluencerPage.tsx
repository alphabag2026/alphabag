import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { MainNav } from "@/components/MainNav";
import { PlanDetailModal } from "@/components/PlanDetailModal";
import { Star, Heart, UserPlus, UserCheck, Bell, BellOff, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const ALPHABAG_LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663373200888/TGrbnQ7ygm6GBAS6CWnuGe/alphabag-logo_df90878d.png";

type SortKey = "newest" | "rate" | "rating" | "min";
const PAGE_SIZE = 12;

export default function InfluencerPage() {
  const [sort, setSort] = useState<SortKey>("newest");
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"plans" | "alerts">("plans");
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [newCoin, setNewCoin] = useState("");
  const [newThreshold, setNewThreshold] = useState(10);
  const loaderRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const { data: favList = [] } = trpc.favorites.list.useQuery(undefined, { enabled: isAuthenticated });
  const toggleFav = trpc.favorites.toggle.useMutation({
    onSuccess: () => utils.favorites.list.invalidate(),
    onError: () => toast.error("로그인이 필요합니다."),
  });
  const { data: followedList = [] } = (trpc as any).listFollowedInfluencers?.useQuery(undefined, { enabled: isAuthenticated }) ?? { data: [] };
  const followMutation = (trpc as any).followInfluencer?.useMutation({
    onSuccess: (data: any) => { utils.invalidate(); toast.success(data?.followed ? "팔로우했습니다" : "팔로우 취소"); },
    onError: () => toast.error("로그인이 필요합니다."),
  });
  const { data: coinAlerts = [] } = (trpc as any).listCoinAlerts?.useQuery(undefined, { enabled: isAuthenticated }) ?? { data: [] };
  const saveCoinAlert = (trpc as any).saveCoinAlert?.useMutation({
    onSuccess: () => { utils.invalidate(); toast.success("알림 설정 저장됨"); setNewCoin(""); },
    onError: (e: any) => toast.error(e.message),
  });
  const deleteCoinAlert = (trpc as any).deleteCoinAlert?.useMutation({
    onSuccess: () => { utils.invalidate(); toast.success("알림 삭제됨"); },
  });

  const { data: plans = [], isLoading } = trpc.public.influencerPlans.useQuery();

  const sorted = [...(plans as any[])].sort((a, b) => {
    if (sort === "newest") return (b.id || 0) - (a.id || 0);
    if (sort === "rate") return Number(b.dailyRate) - Number(a.dailyRate);
    if (sort === "rating") return Number(b.rating || 4) - Number(a.rating || 4);
    if (sort === "min") return Number(a.minAmount) - Number(b.minAmount);
    return 0;
  });
  const displayed = sorted.slice(0, displayCount);
  const hasMore = displayCount < sorted.length;

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry.isIntersecting && hasMore) setDisplayCount(prev => prev + PAGE_SIZE);
  }, [hasMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [handleObserver]);

  const followedSet = new Set((followedList as any[]).map((f: any) => f.planId));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MainNav />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <h1 className="text-2xl font-black text-orange-600 flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              Influencer
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">인플루언서 추천 · 트렌딩 · 소셜 검증</p>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex gap-1 mb-6 border-b border-border">
          {[{ id: "plans", label: "플랜 목록" }, { id: "alerts", label: "코인 알림 설정" }].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id ? "border-orange-500 text-orange-600" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>{tab.label}</button>
          ))}
        </div>

        {activeTab === "plans" && <>
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { key: "newest", label: "최신순" },
            { key: "rate", label: "수익률순" },
            { key: "rating", label: "평점순" },
            { key: "min", label: "최소금액순" },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => { setSort(s.key as SortKey); setDisplayCount(PAGE_SIZE); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                sort === s.key
                  ? "bg-orange-500 text-white shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {s.label}
            </button>
          ))}
          <span className="ml-auto text-xs text-muted-foreground self-center">{sorted.length}개 · {displayCount}개 표시 중</span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <span className="text-6xl mb-4 opacity-20">⭐</span>
            <div className="text-lg font-medium">등록된 인플루언서 컬렉션이 없습니다</div>
            <div className="text-sm mt-1">곧 업데이트될 예정입니다.</div>
          </div>
        ) : (
          <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayed.map((plan: any) => {
              const rating = Number(plan.rating) || 4.0;
              const badges: string[] = Array.isArray(plan.badgeLabels) ? plan.badgeLabels : [];
              const isFollowed = followedSet.has(plan.id);
              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className="relative bg-card border border-orange-200/60 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-orange-200/60 hover:border-orange-400/80 group"
                >
                  <div className="relative h-36 overflow-hidden">
                    {plan.logoUrl ? (
                      <img src={plan.logoUrl} alt={plan.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
                        <span className="text-5xl font-black text-orange-300">{plan.name.charAt(0)}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-orange-100/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isAuthenticated) { window.dispatchEvent(new CustomEvent("open-wallet-modal")); return; }
                        toggleFav.mutate({ planId: plan.id });
                      }}
                      className={`absolute bottom-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all z-10 ${
                        (favList as any[]).some((f: any) => f.planId === plan.id) ? "bg-red-500 text-white shadow-md" : "bg-white/80 text-gray-400 hover:text-red-400 hover:bg-white"
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${(favList as any[]).some((f: any) => f.planId === plan.id) ? "fill-white" : ""}`} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isAuthenticated) { window.dispatchEvent(new CustomEvent("open-wallet-modal")); return; }
                        followMutation?.mutate({ planId: plan.id });
                      }}
                      className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all z-10 ${
                        isFollowed ? "bg-orange-500 text-white shadow-md" : "bg-white/80 text-gray-400 hover:text-orange-400 hover:bg-white"
                      }`}
                    >
                      {isFollowed ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="p-4">
                    <div className="font-bold text-foreground text-sm truncate mb-1">{plan.name}</div>
                    {plan.strategy && <div className="text-xs text-muted-foreground truncate mb-2">{plan.strategy}</div>}
                    {badges.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {badges.slice(0, 3).map((b: string, i: number) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">{b}</span>
                        ))}
                      </div>
                    )}
                    <div className="mb-3">
                      <div className="text-2xl font-bold text-orange-600">{Number(plan.dailyRate).toFixed(2)}%</div>
                      <div className="text-xs text-muted-foreground">Daily Return</div>
                    </div>
                    <div className="flex items-center gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-3 h-3 ${s <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-gray-300"}`} />
                      ))}
                      <span className="text-xs text-muted-foreground ml-1">{rating.toFixed(1)}</span>
                    </div>
                    <button className="w-full py-2 rounded-lg text-xs font-semibold transition-all duration-200 bg-orange-500 text-white hover:bg-orange-400">
                      View Details →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {/* 무한 스크롤 로더 */}
          <div ref={loaderRef} className="flex justify-center py-8">
            {hasMore ? (
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            ) : sorted.length > PAGE_SIZE ? (
              <span className="text-xs text-muted-foreground">모든 플랜을 불러왔습니다</span>
            ) : null}
          </div>
          </>
        )}
        </>
        }

        {activeTab === "alerts" && (
          <div className="max-w-lg">
            <div className="mb-6">
              <h2 className="text-base font-bold mb-1">코인 트렌딩 알림 설정</h2>
              <p className="text-sm text-muted-foreground">관심 코인의 가격 변동이 설정한 임계값을 초과하면 알림을 받습니다.</p>
            </div>
            {!isAuthenticated ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">로그인 후 알림을 설정할 수 있습니다.</p>
              </div>
            ) : (
              <>
                <div className="bg-card border border-border rounded-xl p-4 mb-4">
                  <h3 className="text-sm font-semibold mb-3">새 알림 추가</h3>
                  <div className="flex gap-2 mb-2">
                    <Input placeholder="코인 심볼 (예: BTC, ETH)" value={newCoin} onChange={e => setNewCoin(e.target.value.toUpperCase())} className="flex-1 text-sm" />
                    <div className="flex items-center gap-1 border border-border rounded-md px-2 min-w-[90px]">
                      <span className="text-xs text-muted-foreground">±</span>
                      <input type="number" min={1} max={100} value={newThreshold} onChange={e => setNewThreshold(Number(e.target.value))} className="w-12 text-sm bg-transparent outline-none" />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                  </div>
                  <Button size="sm" className="w-full bg-orange-500 hover:bg-orange-400 text-white"
                    onClick={() => { if (!newCoin.trim()) return toast.error("코인 심볼을 입력하세요"); saveCoinAlert?.mutate({ coinSymbol: newCoin, priceChangeThreshold: newThreshold, isEnabled: true }); }}
                    disabled={saveCoinAlert?.isPending}>
                    <Plus className="w-3.5 h-3.5 mr-1" />알림 추가
                  </Button>
                </div>
                {(coinAlerts as any[]).length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <BellOff className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">설정된 알림이 없습니다</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(coinAlerts as any[]).map((alert: any) => (
                      <div key={alert.id} className="flex items-center gap-3 bg-card border border-border rounded-lg px-3 py-2.5">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-orange-600">{alert.coinSymbol.slice(0, 3)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm">{alert.coinSymbol}</div>
                          <div className="text-xs text-muted-foreground">±{Number(alert.priceChangeThreshold).toFixed(0)}% 변동 시 알림</div>
                        </div>
                        <Badge variant={alert.isEnabled ? "default" : "secondary"} className="text-[10px]">{alert.isEnabled ? "활성" : "비활성"}</Badge>
                        <button onClick={() => deleteCoinAlert?.mutate({ id: alert.id })} className="text-muted-foreground hover:text-red-500 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <footer className="border-t border-border/40 bg-muted/30 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src={ALPHABAG_LOGO} alt="AlphaBag" className="w-7 h-7 rounded object-contain" />
            <div className="text-sm font-bold text-muted-foreground">AlphaBag</div>
          </div>
          <div className="text-xs text-muted-foreground">© 2026 AlphaBag. All rights reserved.</div>
        </div>
      </footer>

      {selectedPlanId && (
        <PlanDetailModal planId={selectedPlanId} onClose={() => setSelectedPlanId(null)} />
      )}
    </div>
  );
}
