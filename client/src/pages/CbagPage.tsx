import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { MainNav } from "@/components/MainNav";
import { PlanDetailModal } from "@/components/PlanDetailModal";
import { Star, Gem, TrendingUp, Shield, Zap } from "lucide-react";

type SortKey = "newest" | "rate" | "rating" | "min";

export default function CbagPage() {
  const [sort, setSort] = useState<SortKey>("newest");
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const { data: plans = [], isLoading } = trpc.public.cbagPlans.useQuery();

  const sorted = [...(plans as any[])].sort((a, b) => {
    if (sort === "newest") return (b.id || 0) - (a.id || 0);
    if (sort === "rate") return Number(b.dailyRate) - Number(a.dailyRate);
    if (sort === "rating") return Number(b.rating || 4) - Number(a.rating || 4);
    if (sort === "min") return Number(a.minInvestment) - Number(b.minInvestment);
    return 0;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-blue-50">
      <MainNav />

      {/* 히어로 섹션 */}
      <div className="relative overflow-hidden bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-700 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-20 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-0 right-10 w-96 h-96 rounded-full bg-cyan-300/20 blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 py-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Gem className="w-6 h-6 text-cyan-200" />
            </div>
            <span className="text-cyan-200 text-sm font-semibold tracking-widest uppercase">C-BAG Collection</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            💎 C-BAG
            <span className="block text-cyan-200 text-2xl font-medium mt-1">Premium Crypto Bag Strategy</span>
          </h1>
          <p className="text-white/80 text-lg max-w-2xl mb-8">
            다양한 암호화폐 포트폴리오를 최적화된 전략으로 운용하는 C-BAG 컬렉션입니다.
            안정적인 수익과 함께 포트폴리오를 다각화하세요.
          </p>
          <div className="flex flex-wrap gap-4">
            {[
              { icon: <TrendingUp className="w-4 h-4" />, label: "Daily 0.3~1.5%" },
              { icon: <Shield className="w-4 h-4" />, label: "Multi-Asset Hedge" },
              { icon: <Zap className="w-4 h-4" />, label: "Auto Rebalancing" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full text-sm">
                {item.icon}
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 정렬 & 필터 */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="text-gray-600 text-sm">
            총 <span className="font-bold text-cyan-600">{sorted.length}</span>개 플랜
          </div>
          <div className="flex gap-2">
            {([["newest", "최신순"], ["rate", "수익률순"], ["rating", "평점순"], ["min", "최소금액순"]] as [SortKey, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSort(key)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                  sort === key
                    ? "bg-cyan-600 text-white font-semibold"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-cyan-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-24">
            <Gem className="w-16 h-16 text-cyan-200 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">C-BAG 플랜을 준비 중입니다</p>
            <p className="text-gray-300 text-sm mt-2">Coming Soon</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sorted.map((plan: any) => (
              <div
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className="bg-white rounded-2xl border border-cyan-100 shadow-sm hover:shadow-lg hover:border-cyan-300 transition-all cursor-pointer group overflow-hidden"
              >
                {plan.imageUrl && (
                  <div className="h-40 overflow-hidden">
                    <img src={plan.imageUrl} alt={plan.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900">{plan.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{plan.strategy || "Multi-Asset Strategy"}</p>
                    </div>
                    {plan.isHot && (
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-xs font-bold rounded-full">HOT</span>
                    )}
                  </div>
                  <div className="text-2xl font-black text-cyan-600 mb-1">
                    {plan.dailyRate ? `${plan.dailyRate}%` : "—"}
                    <span className="text-sm font-normal text-gray-400 ml-1">/ day</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
                    <span>최소 {plan.minInvestment ? `${Number(plan.minInvestment).toLocaleString()} USDT` : "—"}</span>
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < Math.round(Number(plan.rating || 4)) ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"}`} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedPlanId && (
        <PlanDetailModal planId={selectedPlanId} onClose={() => setSelectedPlanId(null)} />
      )}
    </div>
  );
}
