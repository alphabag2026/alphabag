import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Loader2, Star, Filter, Heart, ShoppingCart, Globe } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useWallet } from "@/contexts/WalletContext";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { MainNav } from "@/components/MainNav";

const ALPHABAG_LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663373200888/TGrbnQ7ygm6GBAS6CWnuGe/alphabag-logo_df90878d.png";

function PlanCard({ plan }: { plan: any }) {
  const { isAuthenticated } = useAuth();
  const { isConnected, openModal } = useWallet();
  const utils = trpc.useUtils();
  const { data: favList = [] } = trpc.favorites.list.useQuery(undefined, { enabled: isAuthenticated });
  const isFav = (favList as any[]).some((f: any) => f.planId === plan.id);
  const toggleFav = trpc.favorites.toggle.useMutation({
    onSuccess: () => utils.favorites.list.invalidate(),
    onError: () => toast.error("로그인이 필요합니다."),
  });
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
      <div className="relative bg-card border border-blue-200/60 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-blue-200/60 hover:border-blue-400/80 group flex flex-col">
        <div className="relative h-40 overflow-hidden bg-gray-950">
          {plan.logoUrl ? (
            <img src={plan.logoUrl} alt={plan.name} className="w-full h-full object-contain p-3 transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
              <span className="text-6xl font-black text-blue-300">{plan.name.charAt(0)}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-blue-100/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {plan.isHighlight && (
            <>
              <div className="absolute top-2 right-2">
                <Badge className="bg-blue-500 text-white border-0 text-[10px] font-bold">HOT</Badge>
              </div>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent" />
            </>
          )}
          {/* 하트 버튼 */}
          <button
            onClick={(e) => {
              e.preventDefault();
              if (!isAuthenticated) { window.dispatchEvent(new CustomEvent("open-wallet-modal")); return; }
              toggleFav.mutate({ planId: plan.id });
            }}
            className={`absolute bottom-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all z-10 ${
              isFav ? "bg-red-500 text-white shadow-md" : "bg-white/80 text-gray-400 hover:text-red-400 hover:bg-white"
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isFav ? "fill-white" : ""}`} />
          </button>
        </div>

        <div className="p-4 flex flex-col flex-1">
          <div className="font-bold text-foreground text-sm truncate mb-1">{plan.name}</div>
          {plan.strategy && <div className="text-xs text-muted-foreground truncate mb-2">{plan.strategy}</div>}

          {badges.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {badges.slice(0, 4).map((b: string, i: number) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">{b}</span>
              ))}
            </div>
          )}

          <div className="mb-3">
            <div className="text-3xl font-black text-blue-600">{Number(plan.dailyRate).toFixed(2)}%</div>
            <div className="text-xs text-muted-foreground">Daily Return</div>
          </div>

          <div className="space-y-1.5 mb-3 text-xs flex-1">
            {plan.minAmount && Number(plan.minAmount) > 0 && (
              <div className="flex justify-between"><span className="text-muted-foreground">Min</span><span className="text-foreground">${Number(plan.minAmount).toLocaleString()}</span></div>
            )}
            {plan.duration && (
              <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span className="text-foreground">{plan.duration} days</span></div>
            )}
            {plan.totalReturn && (
              <div className="flex justify-between"><span className="text-muted-foreground">Total Return</span><span className="text-blue-600 font-bold">{Number(plan.totalReturn).toFixed(0)}%</span></div>
            )}
          </div>

          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className={`w-3 h-3 ${s <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-gray-300"}`} />
            ))}
            <span className="text-xs text-muted-foreground ml-1">{rating.toFixed(1)}</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleInvest}
              disabled={invest.isPending}
              className="flex-1 py-2.5 rounded-xl bg-blue-500 text-white hover:bg-blue-400 text-sm font-semibold transition-all"
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
              className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 hover:bg-blue-200 flex items-center justify-center transition-all flex-shrink-0"
              title="장바구니에 담기"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          </div>
          {plan.onepageUrl && (
            <a
              href={plan.onepageUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="mt-2 w-full py-1.5 rounded-xl bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 text-xs font-semibold transition-all flex items-center justify-center gap-1 border border-amber-300/40"
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

export default function SelfPage() {
  const [sortBy, setSortBy] = useState<"newest" | "rate" | "rating" | "min">("newest");
  const { data: rawPlans = [], isLoading } = trpc.public.selfPlans.useQuery();

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
    <div className="min-h-screen bg-background text-foreground">
      <MainNav />

      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs text-blue-600 font-medium uppercase tracking-widest">Self-Managed Strategy</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-foreground mb-2">
            ⚡ <span className="text-blue-600">Self</span> Collection
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl">
            Custom Strategy · Flexible · Self-managed — Take control with flexible self-directed investment strategies.
          </p>

          <div className="flex items-center gap-6 mt-6 pt-6 border-t border-border/40">
            <div><div className="text-lg font-bold text-blue-600">{plans.length}</div><div className="text-xs text-muted-foreground">Total Plans</div></div>
            <div><div className="text-lg font-bold text-foreground">{avgRate}%</div><div className="text-xs text-muted-foreground">Avg Daily Rate</div></div>
            <div><div className="text-lg font-bold text-foreground">{plans.filter((p: any) => p.isHighlight).length}</div><div className="text-xs text-muted-foreground">Featured</div></div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Sort by:</span>
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
                  ? "bg-blue-100 text-blue-700 border border-blue-300"
                  : "text-muted-foreground hover:text-foreground border border-border/40 hover:border-border"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {plans.map((plan: any) => <PlanCard key={plan.id} plan={plan} />)}
          </div>
        )}

        {!isLoading && plans.length === 0 && (
          <div className="text-center py-20"><div className="text-4xl mb-4">⚡</div><div className="text-muted-foreground text-sm">No Self plans available</div></div>
        )}
      </div>

      <footer className="border-t border-border/40 bg-muted/30 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <img src={ALPHABAG_LOGO} alt="AlphaBag" className="w-7 h-7 rounded object-contain" />
              <span className="text-sm font-bold text-muted-foreground">AlphaBag</span>
            </div>
          </Link>
          <div className="text-xs text-muted-foreground">© 2025 AlphaBag. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
