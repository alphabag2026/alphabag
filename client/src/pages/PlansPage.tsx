import { useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { toast } from "sonner";
import {
  TrendingUp, ArrowLeft, Loader2, CheckCircle2, ChevronRight, GitCompare, X, Check, Search
} from "lucide-react";

export default function PlansPage() {
  const { isAuthenticated } = useAuth();
  const [planType, setPlanType] = useState<"investment" | "staking">("investment");
  const { data: plans, isLoading } = trpc.public.plans.useQuery({ planType });
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const invest = trpc.user.invest.useMutation({
    onSuccess: () => {
      toast.success("Investment request submitted successfully!");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleInvest = (planId: number) => {
    if (!isAuthenticated) {
      window.dispatchEvent(new CustomEvent("open-wallet-modal"));
      return;
    }
    const amount = prompt("Enter investment amount (USD):");
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;
    invest.mutate({ planId, amount });
  };

  const toggleCompare = (id: number) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) { toast.warning("최대 3개까지 비교할 수 있습니다."); return prev; }
      return [...prev, id];
    });
  };

  const comparePlans = plans?.filter((p: any) => compareIds.includes(p.id)) || [];
  const filteredPlans: any[] = searchQuery.trim()
    ? (plans || []).filter((p: any) =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.collectionType?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : (plans || []);
  const autocompleteSuggestions: any[] = searchQuery.trim().length >= 1
    ? (plans || []).filter((p: any) =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  const COMPARE_ROWS = [
    { label: "일일 수익률", key: "dailyRate", format: (v: any) => `${Number(v).toFixed(2)}%` },
    { label: "월 환산 수익률", key: "dailyRate", format: (v: any) => `${(Number(v) * 30).toFixed(1)}%` },
    { label: "최소 투자금", key: "minAmount", format: (v: any) => v ? `$${Number(v).toLocaleString()}` : "-" },
    { label: "최대 투자금", key: "maxAmount", format: (v: any) => v ? `$${Number(v).toLocaleString()}` : "-" },
    { label: "투자 기간", key: "duration", format: (v: any) => v ? `${v}일` : "-" },
    { label: "총 수익률", key: "totalReturn", format: (v: any) => v ? `${Number(v).toFixed(0)}%` : "-" },
    { label: "플랜 유형", key: "planType", format: (v: any) => v === "staking" ? "Staking" : "Investment" },
    { label: "컬렉션", key: "collectionType", format: (v: any) => v || "-" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
            </Link>
            <span className="text-sm font-medium">Investment Plans</span>
          </div>
          <div className="flex items-center gap-2">
            {compareIds.length >= 2 && (
              <Button size="sm" variant="outline" className="gap-2 border-amber-400/60 text-amber-500 hover:bg-amber-500/10" onClick={() => setCompareOpen(true)}>
                <GitCompare className="w-4 h-4" /> 비교 ({compareIds.length})
              </Button>
            )}
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="sm" variant="outline" className="gap-2">
                  Dashboard <ChevronRight className="w-3 h-3" />
                </Button>
              </Link>
            ) : (
              <Button size="sm" onClick={() => window.dispatchEvent(new CustomEvent("open-wallet-modal"))}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <Badge variant="outline" className="mb-4 border-primary/40 text-primary bg-primary/5">
            <TrendingUp className="w-3 h-3 mr-1" /> Investment Plans
          </Badge>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Choose Your Plan
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Select from our curated investment plans with transparent daily returns.
          </p>
          {compareIds.length > 0 && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-amber-500">
              <GitCompare className="w-4 h-4" />
              <span>{compareIds.length}개 플랜 선택됨 (최대 3개) — 비교하려면 상단 버튼을 클릭하세요</span>
              <button onClick={() => setCompareIds([])} className="text-muted-foreground hover:text-foreground ml-2"><X className="w-3.5 h-3.5" /></button>
            </div>
          )}
        </div>

        {/* 검색 자동완성 */}
        <div className="flex justify-center mb-6">
          <div className="relative w-full max-w-md" ref={searchRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                placeholder="플랜 이름 검색..."
                className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-border/60 bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {searchFocused && autocompleteSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border/60 rounded-xl shadow-xl z-50 overflow-hidden">
                {autocompleteSuggestions.map((p: any) => (
                  <button
                    key={p.id}
                    onMouseDown={() => { setSearchQuery(p.name); setSearchFocused(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/60 transition-colors text-left"
                  >
                    <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-foreground">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{Number(p.dailyRate).toFixed(2)}% 일일 수익률</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <Tabs value={planType} onValueChange={(v) => setPlanType(v as "investment" | "staking")}>
            <TabsList className="bg-card border border-border/40">
              <TabsTrigger value="investment">Investment Plans</TabsTrigger>
              <TabsTrigger value="staking">Staking Plans</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Plans Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="border border-border/40 rounded-xl overflow-hidden animate-pulse">
                <div className="h-32 bg-muted/40" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-muted/40 rounded w-3/4" />
                  <div className="h-3 bg-muted/30 rounded w-1/2" />
                  <div className="flex gap-2">
                    <div className="h-6 bg-muted/40 rounded-full w-16" />
                    <div className="h-6 bg-muted/40 rounded-full w-20" />
                  </div>
                  <div className="h-8 bg-muted/30 rounded w-full mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {searchQuery.trim() && filteredPlans.length === 0 ? (
              <div className="col-span-full text-center py-16 text-muted-foreground">
                <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>'{searchQuery}'에 해당하는 플랜이 없습니다.</p>
              </div>
            ) : null}
            {filteredPlans.map((plan: any, i: number) => {
              const isSelected = compareIds.includes(plan.id);
              return (
                <Card
                  key={plan.id}
                  className={`relative overflow-hidden border-border/40 hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 ${i % 5 === 2 ? "border-primary/50 shadow-md shadow-primary/10" : ""} ${isSelected ? "border-amber-400/70 shadow-amber-400/10 shadow-md" : ""}`}
                >
                  {i % 5 === 2 && !isSelected && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
                  )}
                  {isSelected && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                  )}
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-sm leading-tight truncate">{plan.name}</h3>
                        {plan.label && (
                          <Badge variant="secondary" className="mt-1.5 text-xs">{plan.label}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                        {i % 5 === 2 && (
                          <Badge className="bg-primary text-primary-foreground text-xs">Hot</Badge>
                        )}
                        {/* 비교 체크박스 */}
                        <button
                          onClick={() => toggleCompare(plan.id)}
                          className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${isSelected ? "bg-amber-500 border-amber-500 text-white" : "border-border/60 hover:border-amber-400/60 text-transparent hover:text-amber-400/40"}`}
                          title="비교에 추가"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Daily Rate */}
                    <div className="mb-5">
                      <div className="text-3xl font-bold text-primary">{Number(plan.dailyRate).toFixed(2)}%</div>
                      <div className="text-xs text-muted-foreground">Daily Return</div>
                    </div>

                    {/* Plan Details */}
                    <div className="space-y-2 mb-5 text-xs">
                      {plan.minAmount && Number(plan.minAmount) > 0 && (
                        <div className="flex justify-between text-muted-foreground">
                          <span>Min. Amount</span>
                          <span className="text-foreground font-medium">${Number(plan.minAmount).toLocaleString()}</span>
                        </div>
                      )}
                      {plan.maxAmount && (
                        <div className="flex justify-between text-muted-foreground">
                          <span>Max. Amount</span>
                          <span className="text-foreground font-medium">${Number(plan.maxAmount).toLocaleString()}</span>
                        </div>
                      )}
                      {plan.duration && (
                        <div className="flex justify-between text-muted-foreground">
                          <span>Duration</span>
                          <span className="text-foreground font-medium">{plan.duration} days</span>
                        </div>
                      )}
                      {plan.totalReturn && (
                        <div className="flex justify-between text-muted-foreground">
                          <span>Total Return</span>
                          <span className="text-primary font-bold">{Number(plan.totalReturn).toFixed(0)}%</span>
                        </div>
                      )}
                    </div>

                    {/* Features */}
                    <div className="space-y-1.5 mb-5">
                      {["Daily payouts", "Transparent tracking", "Secure investment"].map((f) => (
                        <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0" />
                          {f}
                        </div>
                      ))}
                    </div>

                    <Button
                      className="w-full text-sm"
                      variant={i % 5 === 2 ? "default" : "outline"}
                      onClick={() => handleInvest(plan.id)}
                      disabled={invest.isPending}
                    >
                      {invest.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null}
                      Invest Now
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {!isLoading && (!plans || plans.length === 0) && (
          <div className="text-center py-20">
            <TrendingUp className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No plans available in this category</p>
          </div>
        )}
      </div>

      {/* 비교 모달 */}
      {compareOpen && comparePlans.length >= 2 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={(e) => e.target === e.currentTarget && setCompareOpen(false)}>
          <div className="bg-background border border-border rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
              <div className="flex items-center gap-2">
                <GitCompare className="w-5 h-5 text-amber-500" />
                <span className="font-bold text-foreground">플랜 비교</span>
                <Badge variant="outline" className="text-xs">{comparePlans.length}개</Badge>
              </div>
              <button onClick={() => setCompareOpen(false)} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* 비교 테이블 */}
            <div className="overflow-auto flex-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40">
                    <th className="text-left px-6 py-3 text-muted-foreground font-medium w-36">항목</th>
                    {comparePlans.map((p: any) => (
                      <th key={p.id} className="px-4 py-3 text-center">
                        <div className="font-bold text-foreground">{p.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{p.planType === "staking" ? "Staking" : "Investment"}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_ROWS.map((row, idx) => {
                    const values = comparePlans.map((p: any) => row.format(p[row.key]));
                    const numericVals = comparePlans.map((p: any) => Number(p[row.key as string]) || 0);
                    const maxVal = Math.max(...numericVals);
                    return (
                      <tr key={idx} className={`border-b border-border/20 ${idx % 2 === 0 ? "bg-muted/20" : ""}`}>
                        <td className="px-6 py-3 text-muted-foreground font-medium">{row.label}</td>
                        {comparePlans.map((p: any, pi: number) => {
                          const numVal = Number(p[row.key]) || 0;
                          const isBest = numVal > 0 && numVal === maxVal && numericVals.filter((v: number) => v === maxVal).length === 1;
                          return (
                            <td key={p.id} className={`px-4 py-3 text-center font-semibold ${isBest ? "text-amber-500" : "text-foreground"}`}>
                              {values[pi]}
                              {isBest && <span className="ml-1 text-xs text-amber-400">★</span>}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* 푸터 */}
            <div className="px-6 py-4 border-t border-border/40 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">★ 표시는 해당 항목에서 가장 높은 값을 나타냅니다.</p>
              <Button size="sm" variant="outline" onClick={() => { setCompareOpen(false); setCompareIds([]); }}>
                초기화
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
