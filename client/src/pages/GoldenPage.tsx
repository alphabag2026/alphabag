import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Star, Filter, TrendingUp, ChevronRight } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { MainNav } from "@/components/MainNav";

function PlanCard({ plan }: { plan: any }) {
  const { isAuthenticated } = useAuth();
  const invest = trpc.user.invest.useMutation({
    onSuccess: () => toast.success("Investment submitted!"),
    onError: (e) => toast.error(e.message),
  });

  const handleInvest = () => {
    if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
    const amount = prompt("Enter investment amount (USDT):");
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;
    invest.mutate({ planId: plan.id, amount });
  };

  const badges: string[] = Array.isArray(plan.badgeLabels) ? plan.badgeLabels : [];
  const rating = Number(plan.rating) || 4.0;

  return (
    <div className="relative bg-[#0d0d0d] border border-amber-500/20 hover:border-amber-400/50 rounded-xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/10 group flex flex-col">
      {plan.isHighlight && (
        <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
      )}

      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-lg flex-shrink-0">
          {plan.logoUrl
            ? <img src={plan.logoUrl} alt={plan.name} className="w-9 h-9 rounded-lg object-cover" />
            : plan.name.charAt(0)
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-white text-sm truncate">{plan.name}</div>
          {plan.strategy && <div className="text-xs text-gray-500 truncate">{plan.strategy}</div>}
        </div>
        {plan.isHighlight && (
          <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] flex-shrink-0">HOT</Badge>
        )}
      </div>

      {/* 배지 */}
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {badges.slice(0, 4).map((b: string, i: number) => (
            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">{b}</span>
          ))}
        </div>
      )}

      {/* 수익률 */}
      <div className="mb-4">
        <div className="text-3xl font-black text-amber-400">{Number(plan.dailyRate).toFixed(2)}%</div>
        <div className="text-xs text-gray-500">Daily Return</div>
      </div>

      {/* 상세 정보 */}
      <div className="space-y-2 mb-4 text-xs flex-1">
        {plan.minAmount && Number(plan.minAmount) > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-500">Min Amount</span>
            <span className="text-gray-300">${Number(plan.minAmount).toLocaleString()}</span>
          </div>
        )}
        {plan.maxAmount && (
          <div className="flex justify-between">
            <span className="text-gray-500">Max Amount</span>
            <span className="text-gray-300">${Number(plan.maxAmount).toLocaleString()}</span>
          </div>
        )}
        {plan.duration && (
          <div className="flex justify-between">
            <span className="text-gray-500">Duration</span>
            <span className="text-gray-300">{plan.duration} days</span>
          </div>
        )}
        {plan.totalReturn && (
          <div className="flex justify-between">
            <span className="text-gray-500">Total Return</span>
            <span className="text-amber-400 font-bold">{Number(plan.totalReturn).toFixed(0)}%</span>
          </div>
        )}
        {plan.recommendedAmount && (
          <div className="flex justify-between">
            <span className="text-gray-500">Recommended</span>
            <span className="text-gray-300">${Number(plan.recommendedAmount).toLocaleString()} USDT</span>
          </div>
        )}
      </div>

      {/* 별점 */}
      <div className="flex items-center gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star key={s} className={`w-3 h-3 ${s <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-gray-600"}`} />
        ))}
        <span className="text-xs text-gray-500 ml-1">{rating.toFixed(1)}</span>
      </div>

      {/* 투자 버튼 */}
      <button
        onClick={handleInvest}
        disabled={invest.isPending}
        className="w-full py-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 text-sm font-semibold transition-all"
      >
        {invest.isPending ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}
        Invest Now
      </button>
    </div>
  );
}

export default function GoldenPage() {
  const [sortBy, setSortBy] = useState<"rate" | "rating" | "min">("rate");
  const { data: rawPlans = [], isLoading } = trpc.public.goldenPlans.useQuery();

  const plans = [...(rawPlans as any[])].sort((a, b) => {
    if (sortBy === "rate") return Number(b.dailyRate) - Number(a.dailyRate);
    if (sortBy === "rating") return Number(b.rating) - Number(a.rating);
    if (sortBy === "min") return Number(a.minAmount) - Number(b.minAmount);
    return 0;
  });

  const highlightPlans = plans.filter((p: any) => p.isHighlight);
  const avgRate = plans.length > 0
    ? (plans.reduce((s: number, p: any) => s + Number(p.dailyRate), 0) / plans.length).toFixed(2)
    : "0.00";

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <MainNav />

      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* 헤더 */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs text-amber-400 font-medium uppercase tracking-widest">Premium Collection</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
            🏆 <span className="text-amber-400">Golden</span> Collection
          </h1>
          <p className="text-gray-400 text-sm max-w-xl">
            BINANCE Alpha · Insurance(Hedge) · Daily Returns — Premium curated investment strategies with verified performance.
          </p>

          {/* 통계 */}
          <div className="flex items-center gap-6 mt-6 pt-6 border-t border-white/5">
            <div>
              <div className="text-lg font-bold text-amber-400">{plans.length}</div>
              <div className="text-xs text-gray-500">Total Plans</div>
            </div>
            <div>
              <div className="text-lg font-bold text-white">{avgRate}%</div>
              <div className="text-xs text-gray-500">Avg Daily Rate</div>
            </div>
            <div>
              <div className="text-lg font-bold text-white">{highlightPlans.length}</div>
              <div className="text-xs text-gray-500">Featured</div>
            </div>
          </div>
        </div>

        {/* 정렬 필터 */}
        <div className="flex items-center gap-2 mb-6">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-xs text-gray-500">Sort by:</span>
          {[
            { key: "rate", label: "Daily Rate" },
            { key: "rating", label: "Rating" },
            { key: "min", label: "Min Amount" },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSortBy(opt.key as any)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                sortBy === opt.key
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "text-gray-500 hover:text-gray-300 border border-white/5 hover:border-white/10"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* 플랜 그리드 */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {plans.map((plan: any) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        )}

        {!isLoading && plans.length === 0 && (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">🏆</div>
            <div className="text-gray-400 text-sm">No Golden plans available</div>
          </div>
        )}
      </div>

      {/* 푸터 */}
      <footer className="border-t border-white/5 bg-[#050505] py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <span className="text-black font-black text-[10px]">AB</span>
              </div>
              <span className="text-sm font-bold text-gray-400">AlphaBag</span>
            </div>
          </Link>
          <div className="text-xs text-gray-600">© 2025 AlphaBag. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
