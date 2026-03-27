import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { MainNav } from "@/components/MainNav";
import { PlanDetailModal } from "@/components/PlanDetailModal";
import { Star, Rocket, Heart } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

const ALPHABAG_LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663373200888/TGrbnQ7ygm6GBAS6CWnuGe/alphabag-logo_df90878d.png";

type SortKey = "newest" | "rate" | "rating" | "min";

export default function MemePage() {
  const [sort, setSort] = useState<SortKey>("newest");
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const { data: favList = [] } = trpc.favorites.list.useQuery(undefined, { enabled: isAuthenticated });
  const toggleFav = trpc.favorites.toggle.useMutation({
    onSuccess: () => utils.favorites.list.invalidate(),
    onError: () => toast.error("로그인이 필요합니다."),
  });

  const { data: plans = [], isLoading } = trpc.public.memePlans.useQuery();

  const sorted = [...(plans as any[])].sort((a, b) => {
    if (sort === "newest") return (b.id || 0) - (a.id || 0);
    if (sort === "rate") return Number(b.dailyRate) - Number(a.dailyRate);
    if (sort === "rating") return Number(b.rating || 4) - Number(a.rating || 4);
    if (sort === "min") return Number(a.minAmount) - Number(b.minAmount);
    return 0;
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MainNav />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
            <h1 className="text-2xl font-black text-pink-600 flex items-center gap-2">
              <Rocket className="w-6 h-6" />
              Meme Token
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">밈토큰 · 고수익 · 커뮤니티 드리븐</p>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { key: "newest", label: "최신 출시 순" },
            { key: "rate", label: "일일 수익률" },
            { key: "rating", label: "별점 순" },
            { key: "min", label: "최소 금액 순" },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => setSort(s.key as SortKey)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                sort === s.key
                  ? "bg-pink-100 text-pink-700 border border-pink-300"
                  : "text-muted-foreground border border-border/40 hover:border-border"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <Rocket className="w-16 h-16 mb-4 opacity-20" />
            <div className="text-lg font-medium">등록된 밈토큰 컬렉션이 없습니다</div>
            <div className="text-sm mt-1">곧 업데이트될 예정입니다.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sorted.map((plan: any) => {
              const rating = Number(plan.rating) || 4.0;
              const badges: string[] = Array.isArray(plan.badgeLabels) ? plan.badgeLabels : [];
              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className="relative bg-card border border-pink-200/60 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-pink-200/60 hover:border-pink-400/80 group"
                >
                  <div className="relative h-36 overflow-hidden">
                    {plan.logoUrl ? (
                      <img src={plan.logoUrl} alt={plan.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-pink-50 to-pink-100 flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
                        <span className="text-5xl font-black text-pink-300">{plan.name.charAt(0)}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-pink-100/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
                        toggleFav.mutate({ planId: plan.id });
                      }}
                      className={`absolute bottom-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all z-10 ${
                        (favList as any[]).some((f: any) => f.planId === plan.id) ? "bg-red-500 text-white shadow-md" : "bg-white/80 text-gray-400 hover:text-red-400 hover:bg-white"
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${(favList as any[]).some((f: any) => f.planId === plan.id) ? "fill-white" : ""}`} />
                    </button>
                  </div>
                  <div className="p-4">
                    <div className="font-bold text-foreground text-sm truncate mb-1">{plan.name}</div>
                    {plan.strategy && <div className="text-xs text-muted-foreground truncate mb-2">{plan.strategy}</div>}
                    {badges.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {badges.slice(0, 3).map((b: string, i: number) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 border border-pink-200">{b}</span>
                        ))}
                      </div>
                    )}
                    <div className="mb-3">
                      <div className="text-2xl font-bold text-pink-600">{Number(plan.dailyRate).toFixed(2)}%</div>
                      <div className="text-xs text-muted-foreground">Daily Return</div>
                    </div>
                    <div className="flex items-center gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-3 h-3 ${s <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-gray-300"}`} />
                      ))}
                      <span className="text-xs text-muted-foreground ml-1">{rating.toFixed(1)}</span>
                    </div>
                    <button className="w-full py-2 rounded-lg text-xs font-semibold transition-all duration-200 bg-pink-500 text-white hover:bg-pink-400">
                      View Details →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <footer className="border-t border-border/40 bg-muted/30 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src={ALPHABAG_LOGO} alt="AlphaBag" className="w-7 h-7 rounded object-contain" />
            <div className="text-sm font-bold text-muted-foreground">AlphaBag</div>
          </div>
          <div className="text-xs text-muted-foreground">© 2025 AlphaBag. All rights reserved.</div>
        </div>
      </footer>

      {selectedPlanId && (
        <PlanDetailModal planId={selectedPlanId} onClose={() => setSelectedPlanId(null)} />
      )}
    </div>
  );
}
