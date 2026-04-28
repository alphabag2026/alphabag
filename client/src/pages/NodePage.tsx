import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { normalize1pageUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Loader2, Star, Filter, ShoppingCart, Globe } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useWallet } from "@/contexts/WalletContext";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { MainNav } from "@/components/MainNav";

const ALPHABAG_LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663373200888/TGrbnQ7ygm6GBAS6CWnuGe/alphabag-logo_df90878d.png";

function PlanCard({ plan }: { plan: any }) {
  const { isAuthenticated } = useAuth();
  const { isConnected, openModal } = useWallet();
  const invest = trpc.user.invest.useMutation({
    onSuccess: () => toast.success("Investment submitted!"),
    onError: (e) => toast.error(e.message),
  });

  const handleInvest = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isConnected) { openModal(); return; }
    if (!isAuthenticated) { window.dispatchEvent(new CustomEvent("open-wallet-modal")); return; }
    const amount = prompt("Enter investment amount (USDT):");
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;
    invest.mutate({ planId: plan.id, amount });
  };

  const badges: string[] = Array.isArray(plan.badgeLabels) ? plan.badgeLabels : [];
  const rating = Number(plan.rating) || 4.0;

  return (
    <Link href={`/plan/${plan.id}`}>
      <div className="relative bg-[#0d0d0d] border border-purple-500/20 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/40 hover:border-purple-400/60 group flex flex-col">
        {/* 카드 이미지 영역 */}
        <div className="relative h-40 overflow-hidden bg-[#050505]">
          {plan.logoUrl ? (
            <img
              src={plan.logoUrl}
              alt={plan.name}
              className="w-full h-full object-contain p-3 transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-900/40 to-purple-600/20 flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
              <span className="text-6xl font-black text-purple-400/20">{plan.name.charAt(0)}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-purple-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {plan.isHighlight && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-purple-500/90 text-white border-0 text-[10px] font-bold">HOT</Badge>
            </div>
          )}
          {plan.isHighlight && (
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-400 to-transparent" />
          )}
        </div>

        <div className="p-4 flex flex-col flex-1">
          <div className="font-bold text-white text-sm truncate mb-1">{plan.name}</div>
          {plan.strategy && <div className="text-xs text-gray-500 truncate mb-2">{plan.strategy}</div>}

          {badges.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {badges.slice(0, 4).map((b: string, i: number) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">{b}</span>
              ))}
            </div>
          )}

          <div className="mb-3">
            <div className="text-3xl font-black text-purple-400">{Number(plan.dailyRate).toFixed(2)}%</div>
            <div className="text-xs text-gray-500">Daily Return</div>
          </div>

          <div className="space-y-1.5 mb-3 text-xs flex-1">
            {plan.minAmount && Number(plan.minAmount) > 0 && (
              <div className="flex justify-between"><span className="text-gray-500">Min</span><span className="text-gray-300">${Number(plan.minAmount).toLocaleString()}</span></div>
            )}
            {plan.duration && (
              <div className="flex justify-between"><span className="text-gray-500">Duration</span><span className="text-gray-300">{plan.duration} days</span></div>
            )}
            {plan.totalReturn && (
              <div className="flex justify-between"><span className="text-gray-500">Total Return</span><span className="text-purple-400 font-bold">{Number(plan.totalReturn).toFixed(0)}%</span></div>
            )}
          </div>

          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className={`w-3 h-3 ${s <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-gray-600"}`} />
            ))}
            <span className="text-xs text-gray-500 ml-1">{rating.toFixed(1)}</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleInvest}
              disabled={invest.isPending}
              className="flex-1 py-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 text-sm font-semibold transition-all"
            >
              {invest.isPending ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}
              View Details →
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                const cart = JSON.parse(localStorage.getItem("alphabag_cart") || "[]");
                if (!cart.find((item: any) => item.id === plan.id)) {
                  cart.push({ id: plan.id, name: plan.name, logoUrl: plan.logoUrl, dailyRate: plan.dailyRate, addedAt: Date.now() });
                  localStorage.setItem("alphabag_cart", JSON.stringify(cart));
                  window.dispatchEvent(new Event("cart-updated"));
                }
                toast.success("장바구니에 추가되었습니다!");
              }}
              className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 flex items-center justify-center transition-all flex-shrink-0 border border-purple-500/30"
              title="장바구니에 담기"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          </div>
          {plan.onepageUrl && (
            <a
              href={normalize1pageUrl(plan.onepageUrl)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="mt-2 w-full py-1.5 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-xs font-semibold transition-all flex items-center justify-center gap-1 border border-amber-500/20"
            >
              <Globe className="w-3 h-3" />
              1page.to 보기
            </a>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function NodePage() {
  const [sortBy, setSortBy] = useState<"newest" | "rate" | "rating" | "min">("newest");
  const { data: rawPlans = [], isLoading } = trpc.public.nodePlans.useQuery();

  const plans = [...(rawPlans as any[])].sort((a, b) => {
    if (sortBy === "newest") return (b.id || 0) - (a.id || 0);
    if (sortBy === "rate") return Number(b.dailyRate) - Number(a.dailyRate);
    if (sortBy === "rating") return Number(b.rating) - Number(a.rating);
    if (sortBy === "min") return Number(a.minAmount) - Number(b.minAmount);
    return 0;
  });

  const avgRate = plans.length > 0
    ? (plans.reduce((s: number, p: any) => s + Number(p.dailyRate), 0) / plans.length).toFixed(2)
    : "0.00";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <MainNav />

      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-xs text-purple-400 font-medium uppercase tracking-widest">Node Infrastructure</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
            🔷 <span className="text-purple-400">Node</span> Products
          </h1>
          <p className="text-gray-400 text-sm max-w-xl">
            Node Infrastructure · Deposit · External DApp integration — Power the network and earn consistent rewards.
          </p>

          <div className="flex items-center gap-6 mt-6 pt-6 border-t border-white/5">
            <div><div className="text-lg font-bold text-purple-400">{plans.length}</div><div className="text-xs text-gray-500">Total Plans</div></div>
            <div><div className="text-lg font-bold text-white">{avgRate}%</div><div className="text-xs text-gray-500">Avg Daily Rate</div></div>
            <div><div className="text-lg font-bold text-white">{plans.filter((p: any) => p.isHighlight).length}</div><div className="text-xs text-gray-500">Featured</div></div>
          </div>
        </div>

        {/* 정렬 필터 */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-xs text-gray-500">Sort by:</span>
          {[
            { key: "newest", label: "최신 출시 순" },
            { key: "rate", label: "Daily Rate" },
            { key: "rating", label: "Rating" },
            { key: "min", label: "Min Amount" },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSortBy(opt.key as any)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                sortBy === opt.key
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                  : "text-gray-500 hover:text-gray-300 border border-white/5 hover:border-white/10"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-purple-400" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {plans.map((plan: any) => <PlanCard key={plan.id} plan={plan} />)}
          </div>
        )}

        {!isLoading && plans.length === 0 && (
          <div className="text-center py-20"><div className="text-4xl mb-4">🔷</div><div className="text-gray-400 text-sm">No Node products available</div></div>
        )}
      </div>

      <footer className="border-t border-white/5 bg-[#050505] py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <img src={ALPHABAG_LOGO} alt="AlphaBag" className="w-7 h-7 rounded object-contain bg-black" />
              <span className="text-sm font-bold text-gray-400">AlphaBag</span>
            </div>
          </Link>
          <div className="text-xs text-gray-600">© 2026 AlphaBag. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
