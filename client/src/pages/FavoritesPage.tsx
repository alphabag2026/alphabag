import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { MainNav } from "@/components/MainNav";
import { Badge } from "@/components/ui/badge";
import { Loader2, Heart, HeartOff, Star, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const COLLECTION_COLORS: Record<string, { accent: string; bg: string; badge: string; border: string }> = {
  golden:    { accent: "text-amber-600",   bg: "from-amber-50 to-amber-100",   badge: "bg-amber-100 text-amber-700 border-amber-200",   border: "border-amber-200/60 hover:border-amber-400/80 hover:shadow-amber-200/60" },
  self:      { accent: "text-blue-600",    bg: "from-blue-50 to-blue-100",     badge: "bg-blue-100 text-blue-700 border-blue-200",       border: "border-blue-200/60 hover:border-blue-400/80 hover:shadow-blue-200/60" },
  leader:    { accent: "text-emerald-600", bg: "from-emerald-50 to-emerald-100", badge: "bg-emerald-100 text-emerald-700 border-emerald-200", border: "border-emerald-200/60 hover:border-emerald-400/80 hover:shadow-emerald-200/60" },
  influencer:{ accent: "text-orange-600",  bg: "from-orange-50 to-orange-100", badge: "bg-orange-100 text-orange-700 border-orange-200", border: "border-orange-200/60 hover:border-orange-400/80 hover:shadow-orange-200/60" },
  meme:      { accent: "text-pink-600",    bg: "from-pink-50 to-pink-100",     badge: "bg-pink-100 text-pink-700 border-pink-200",       border: "border-pink-200/60 hover:border-pink-400/80 hover:shadow-pink-200/60" },
  node:      { accent: "text-purple-600",  bg: "from-purple-50 to-purple-100", badge: "bg-purple-100 text-purple-700 border-purple-200", border: "border-purple-200/60 hover:border-purple-400/80 hover:shadow-purple-200/60" },
};

function FavoritePlanCard({ item, onRemove }: { item: any; onRemove: (planId: number) => void }) {
  const plan = item.plan;
  const col = COLLECTION_COLORS[plan?.collectionType || plan?.planType] || COLLECTION_COLORS.golden;
  const badges: string[] = Array.isArray(plan?.badgeLabels) ? plan.badgeLabels : [];
  const rating = Number(plan?.rating) || 4.0;

  return (
    <div className="relative group">
      <Link href={`/plan/${plan.id}`}>
        <div className={`bg-card border ${col.border} rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col`}>
          {/* 이미지 */}
          <div className="relative h-36 overflow-hidden">
            {plan.logoUrl ? (
              <img src={plan.logoUrl} alt={plan.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${col.bg} flex items-center justify-center`}>
                <span className={`text-5xl font-black ${col.accent} opacity-30`}>{plan.name?.charAt(0)}</span>
              </div>
            )}
            {plan.isHighlight && (
              <div className="absolute top-2 right-2">
                <Badge className="bg-amber-500 text-white border-0 text-[10px] font-bold">HOT</Badge>
              </div>
            )}
          </div>

          <div className="p-3 flex flex-col flex-1">
            <div className="font-bold text-foreground text-sm truncate mb-0.5">{plan.name}</div>
            {plan.strategy && <div className="text-xs text-muted-foreground truncate mb-2">{plan.strategy}</div>}

            {badges.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {badges.slice(0, 3).map((b: string, i: number) => (
                  <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded-full border ${col.badge}`}>{b}</span>
                ))}
              </div>
            )}

            <div className="mb-2">
              <div className={`text-2xl font-black ${col.accent}`}>{Number(plan.dailyRate).toFixed(2)}%</div>
              <div className="text-[10px] text-muted-foreground">Daily Return</div>
            </div>

            <div className="flex items-center gap-0.5 mt-auto">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-3 h-3 ${i < Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
              ))}
              <span className="text-[10px] text-muted-foreground ml-1">{rating.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </Link>

      {/* 삭제 버튼 */}
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(plan.id); }}
        className="absolute top-2 left-2 w-7 h-7 rounded-full bg-white/90 border border-red-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:border-red-400 shadow-sm"
        title="즐겨찾기 해제"
      >
        <HeartOff className="w-3.5 h-3.5 text-red-500" />
      </button>
    </div>
  );
}

export default function FavoritesPage() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const { data: favorites = [], isLoading } = trpc.favorites.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const toggle = trpc.favorites.toggle.useMutation({
    onSuccess: (data) => {
      utils.favorites.list.invalidate();
      if (!data.favorited) toast.success("즐겨찾기에서 제거되었습니다.");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleRemove = (planId: number) => {
    toggle.mutate({ planId });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <MainNav />
        <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-2xl bg-amber-100 flex items-center justify-center mb-6">
            <Heart className="w-10 h-10 text-amber-500" />
          </div>
          <h2 className="text-2xl font-black text-foreground mb-2">로그인이 필요합니다</h2>
          <p className="text-muted-foreground text-sm mb-6">즐겨찾기 기능을 이용하려면 지갑을 연결해 주세요.</p>
          <button onClick={() => window.dispatchEvent(new CustomEvent("open-wallet-modal"))} className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-sm transition-all">
            지갑 연결하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate("/")}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500 fill-red-500" />
              <h1 className="text-2xl font-black text-foreground">즐겨찾기</h1>
              {!isLoading && (
                <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-700 rounded-full">
                  {(favorites as any[]).length}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">저장한 투자 플랜 목록입니다</p>
          </div>
        </div>

        {/* 로딩 */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        )}

        {/* 빈 상태 */}
        {!isLoading && (favorites as any[]).length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-6">
              <Heart className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">즐겨찾기가 없습니다</h3>
            <p className="text-sm text-muted-foreground mb-6">
              플랜 상세 페이지에서 ♥ 버튼을 눌러 즐겨찾기에 추가해 보세요.
            </p>
            <Link href="/">
              <button className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-sm transition-all">
                플랜 둘러보기
              </button>
            </Link>
          </div>
        )}

        {/* 플랜 그리드 */}
        {!isLoading && (favorites as any[]).length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {(favorites as any[]).map((item: any) => (
                <FavoritePlanCard key={item.favoriteId} item={item} onRemove={handleRemove} />
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
              <p className="text-xs text-muted-foreground">총 {(favorites as any[]).length}개의 플랜이 저장되어 있습니다</p>
              <button
                onClick={() => {
                  if (confirm("즐겨찾기를 모두 삭제하시겠습니까?")) {
                    (favorites as any[]).forEach((item: any) => toggle.mutate({ planId: item.planId }));
                  }
                }}
                disabled={toggle.isPending}
                className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                전체 삭제
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
