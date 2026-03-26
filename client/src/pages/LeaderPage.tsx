import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { MainNav } from "@/components/MainNav";
import { PlanDetailModal } from "@/components/PlanDetailModal";
import { Star, Crown, ChevronRight } from "lucide-react";

const ALPHABAG_LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663373200888/TGrbnQ7ygm6GBAS6CWnuGe/alphabag-logo_df90878d.png";

type SortKey = "newest" | "rate" | "rating" | "min";

export default function LeaderPage() {
  const [sort, setSort] = useState<SortKey>("newest");
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

  const { data: plans = [], isLoading } = trpc.public.leaderPlans.useQuery();

  const sorted = [...(plans as any[])].sort((a, b) => {
    if (sort === "newest") return (b.id || 0) - (a.id || 0);
    if (sort === "rate") return Number(b.dailyRate) - Number(a.dailyRate);
    if (sort === "rating") return Number(b.rating || 4) - Number(a.rating || 4);
    if (sort === "min") return Number(a.minAmount) - Number(b.minAmount);
    return 0;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <MainNav />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="text-2xl font-black text-emerald-400 flex items-center gap-2">
              <Crown className="w-6 h-6" />
              Leader Collection
            </h1>
          </div>
          <p className="text-gray-400 text-sm">리더 추천 · 검증된 전략 · 커뮤니티 선택</p>
        </div>

        {/* 정렬 필터 */}
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
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "text-gray-400 border border-white/10 hover:border-white/20"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* 카드 그리드 */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-64 bg-[#111] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-600">
            <Crown className="w-16 h-16 mb-4 opacity-20" />
            <div className="text-lg font-medium">등록된 리더 컬렉션이 없습니다</div>
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
                  className="relative bg-[#0d0d0d] border border-emerald-500/30 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-500/40 group"
                >
                  <div className="relative h-36 overflow-hidden">
                    {plan.logoUrl ? (
                      <img src={plan.logoUrl} alt={plan.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-900/40 to-emerald-600/20 flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
                        <span className="text-5xl font-black opacity-30 text-emerald-400">{plan.name.charAt(0)}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="p-4">
                    <div className="font-bold text-white text-sm truncate mb-1">{plan.name}</div>
                    {plan.strategy && <div className="text-xs text-gray-500 truncate mb-2">{plan.strategy}</div>}
                    {badges.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {badges.slice(0, 3).map((b: string, i: number) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded-full border bg-emerald-500/20 text-emerald-300 border-emerald-500/30">{b}</span>
                        ))}
                      </div>
                    )}
                    <div className="mb-3">
                      <div className="text-2xl font-bold text-emerald-400">{Number(plan.dailyRate).toFixed(2)}%</div>
                      <div className="text-xs text-gray-500">Daily Return</div>
                    </div>
                    <div className="flex items-center gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-3 h-3 ${s <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-gray-600"}`} />
                      ))}
                      <span className="text-xs text-gray-500 ml-1">{rating.toFixed(1)}</span>
                    </div>
                    <button className="w-full py-2 rounded-lg text-xs font-semibold transition-all duration-200 border bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30">
                      View Details →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 푸터 */}
      <footer className="border-t border-white/5 bg-[#050505] py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src={ALPHABAG_LOGO} alt="AlphaBag" className="w-7 h-7 rounded object-contain bg-black" />
            <div className="text-sm font-bold text-gray-400">AlphaBag</div>
          </div>
          <div className="text-xs text-gray-600">© 2025 AlphaBag. All rights reserved.</div>
        </div>
      </footer>

      {selectedPlanId && (
        <PlanDetailModal planId={selectedPlanId} onClose={() => setSelectedPlanId(null)} />
      )}
    </div>
  );
}
