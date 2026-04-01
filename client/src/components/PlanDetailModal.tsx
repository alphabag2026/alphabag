import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useWallet } from "@/contexts/WalletContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import {
  X, Star, Play, FileText, ExternalLink, Share2,
  Eye, Plus, Check, Globe, Heart, ChevronLeft, ChevronRight, ZoomIn
} from "lucide-react";

interface PlanDetailModalProps {
  planId: number;
  onClose: () => void;
}

const COLLECTION_COLORS: Record<string, { bg: string; text: string; border: string; btn: string }> = {
  golden:     { bg: "bg-amber-100",   text: "text-amber-700",   border: "border-amber-300",   btn: "bg-amber-500 hover:bg-amber-400" },
  self:       { bg: "bg-blue-100",    text: "text-blue-700",    border: "border-blue-300",    btn: "bg-blue-500 hover:bg-blue-400" },
  node:       { bg: "bg-purple-100",  text: "text-purple-700",  border: "border-purple-300",  btn: "bg-purple-500 hover:bg-purple-400" },
  leader:     { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-300", btn: "bg-emerald-500 hover:bg-emerald-400" },
  meme:       { bg: "bg-pink-100",    text: "text-pink-700",    border: "border-pink-300",    btn: "bg-pink-500 hover:bg-pink-400" },
  influencer: { bg: "bg-orange-100",  text: "text-orange-700",  border: "border-orange-300",  btn: "bg-orange-500 hover:bg-orange-400" },
};

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
  return match ? match[1] : null;
}

export function PlanDetailModal({ planId, onClose }: PlanDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "video" | "docs">("overview");
  const [referralCode, setReferralCode] = useState("");
  const [referralSaved, setReferralSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFavorite, setIsFavorite] = useState(() => {
    const favs = JSON.parse(localStorage.getItem("alphabag_favorites") || "[]");
    return favs.includes(planId);
  });
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const { isAuthenticated } = useAuth();
  const { isConnected, openModal } = useWallet();

  const { data: plan, isLoading } = trpc.public.planDetail.useQuery({ id: planId });

  const toggleFavorite = useCallback(() => {
    const favs: number[] = JSON.parse(localStorage.getItem("alphabag_favorites") || "[]");
    const newFavs = isFavorite ? favs.filter((id) => id !== planId) : [...favs, planId];
    localStorage.setItem("alphabag_favorites", JSON.stringify(newFavs));
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? "즐겨찾기에서 제거되었습니다" : "즐겨찾기에 추가되었습니다");
  }, [isFavorite, planId]);

  const invest = trpc.user.invest.useMutation({
    onSuccess: () => {
      toast.success("투자 신청이 완료되었습니다!");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSaveReferral = () => {
    if (!referralCode.trim()) return;
    localStorage.setItem(`referral_${planId}`, referralCode.trim().toUpperCase());
    setReferralSaved(true);
    toast.success("추천코드가 저장되었습니다.");
  };

  const handleAddToCart = () => {
    if (!isConnected) { openModal(); return; }
    const cart = JSON.parse(localStorage.getItem("alphabag_cart") || "[]");
    if (!cart.find((item: any) => item.id === planId)) {
      cart.push({ id: planId, name: plan?.name, addedAt: Date.now() });
      localStorage.setItem("alphabag_cart", JSON.stringify(cart));
    }
    toast.success("장바구니에 추가되었습니다.");
  };

  const handleInvest = () => {
    if (!isConnected) { openModal(); return; }
    if (!isAuthenticated) { window.dispatchEvent(new CustomEvent("open-wallet-modal")); return; }
    const amount = prompt("투자 금액을 입력하세요 (USDT):");
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;
    invest.mutate({ planId, amount });
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/plan/${planId}`;
    const refCode = localStorage.getItem(`referral_${planId}`) || "";
    const shareUrl = refCode ? `${url}?ref=${refCode}` : url;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("링크가 복사되었습니다!");
    } catch {
      toast.error("복사 실패");
    }
  };

  const handleGo = () => {
    if (plan?.infoweb4Url) {
      window.open(plan.infoweb4Url, "_blank");
    } else if (plan?.telegramUrl) {
      window.open(plan.telegramUrl, "_blank");
    } else {
      toast.info("이동 링크가 설정되지 않았습니다.");
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="w-16 h-16 border-4 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!plan) return null;

  const colType = (plan as any).collectionType || "golden";
  const colColor = COLLECTION_COLORS[colType] || COLLECTION_COLORS.golden;
  const rating = Number((plan as any).rating) || 4.0;
  const badges: string[] = Array.isArray((plan as any).badgeLabels) ? (plan as any).badgeLabels : [];
  const thumbnails: string[] = Array.isArray((plan as any).thumbnailImages) ? (plan as any).thumbnailImages : [];
  const videoId = extractYouTubeId((plan as any).videoUrl || "");
  const videoId2 = extractYouTubeId((plan as any).videoUrl2 || "");
  const docsLinks: string[] = [];
  if ((plan as any).docsUrl) docsLinks.push((plan as any).docsUrl);
  if ((plan as any).docsUrl2) docsLinks.push((plan as any).docsUrl2);
  const blogUrl = (plan as any).blogUrl;
  const infoweb4Url = (plan as any).infoweb4Url;

  return (
    <>
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative bg-background border border-border rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/60">
          <div>
            <div className="text-xs text-muted-foreground">Detail</div>
            <div className="font-black text-foreground text-lg">{plan.name}</div>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 탭 */}
        <div className="flex gap-1 px-5 pt-3 border-b border-border/60">
          {[
            { key: "overview", label: "개요" },
            { key: "video", label: "비디오" },
            { key: "docs", label: "자료" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.key
                  ? `${colColor.bg} ${colColor.text} border-b-2 ${colColor.border}`
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col md:flex-row gap-0 h-full">
            {/* 좌측 패널 */}
            <div className="md:w-[340px] flex-shrink-0 p-5 border-r border-border/40 space-y-4">
              {/* 플랜 정보 */}
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
                  {(plan as any).logoUrl ? (
                    <img src={(plan as any).logoUrl} alt={plan.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-black text-muted-foreground">
                      {plan.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-bold text-foreground">{plan.name}</div>
                  {(plan as any).allocation && (
                    <div className="text-xs text-muted-foreground">+{(plan as any).allocation}</div>
                  )}
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-3 h-3 ${s <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-gray-300"}`} />
                    ))}
                    <span className="text-xs text-muted-foreground ml-1">{rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              {/* 배지 */}
              <div className="flex flex-wrap gap-1.5">
                {badges.map((b, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground bg-muted">{b}</span>
                ))}
                {colType && (
                  <span className={`text-xs px-2.5 py-1 rounded-full border ${colColor.border} ${colColor.bg} ${colColor.text} font-medium capitalize`}>
                    {colType.charAt(0).toUpperCase() + colType.slice(1)}
                  </span>
                )}
              </div>

              {/* 추천금액 */}
              {(plan as any).recommendedAmount && (
                <div className="text-sm">
                  <span className="text-muted-foreground">추천금액: </span>
                  <span className="text-amber-600 font-bold">
                    {Number((plan as any).recommendedAmount).toLocaleString()} USDT
                  </span>
                </div>
              )}

              {/* 추천코드 입력 */}
              <div className="bg-muted/50 rounded-xl p-3 space-y-2 border border-border/40">
                <div className="text-xs text-muted-foreground font-medium">추천코드 (Project)</div>
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => { setReferralCode(e.target.value.toUpperCase()); setReferralSaved(false); }}
                  placeholder="e.g. ABC123"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-amber-400 transition-colors"
                />
                <button
                  onClick={handleSaveReferral}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold transition-all"
                >
                  저장
                </button>
                <div className="text-[10px] text-muted-foreground">Add 확정 전까지 수정 가능 / Add 확정 시 즉시 잠금</div>
              </div>

              {/* 썸네일 갤러리 */}
              {thumbnails.length > 0 && (
                <div className="space-y-2">
                  <div
                    className="relative rounded-xl overflow-hidden bg-muted cursor-pointer group"
                    style={{ aspectRatio: "16/9" }}
                    onClick={() => setLightboxOpen(true)}
                  >
                    <img
                      src={thumbnails[galleryIndex]}
                      alt={`thumbnail-${galleryIndex}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {thumbnails.length > 1 && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); setGalleryIndex((i) => (i - 1 + thumbnails.length) % thumbnails.length); }}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setGalleryIndex((i) => (i + 1) % thumbnails.length); }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                          {thumbnails.map((_, i) => (
                            <button
                              key={i}
                              onClick={(e) => { e.stopPropagation(); setGalleryIndex(i); }}
                              className={`h-1 rounded-full transition-all duration-300 ${i === galleryIndex ? "w-4 bg-white" : "w-1 bg-white/50"}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  {thumbnails.length > 1 && (
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {thumbnails.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setGalleryIndex(i)}
                          className={`flex-shrink-0 w-14 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                            i === galleryIndex ? "border-amber-400" : "border-border hover:border-border/80"
                          }`}
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 우측 패널 - 탭 콘텐츠 */}
            <div className="flex-1 p-5">
              {activeTab === "overview" && (
                <div className="space-y-4">
                  {plan.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{plan.description}</p>
                  )}

                  {/* Ratio / Yield 박스 */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/50 rounded-xl p-4 border border-border/40">
                      <div className="text-xs text-muted-foreground mb-1">Ratio</div>
                      <div className="font-bold text-foreground text-sm">
                        {(plan as any).ratioInfo || (plan as any).allocation || "—"}
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-4 border border-border/40">
                      <div className="text-xs text-muted-foreground mb-1">Yield</div>
                      <div className="font-bold text-foreground text-sm">
                        {(plan as any).yieldInfo || `Daily: ${Number(plan.dailyRate).toFixed(2)}%`}
                      </div>
                    </div>
                  </div>

                  {/* 상세 정보 */}
                  <div className="space-y-2 bg-muted/30 rounded-xl p-4 border border-border/30">
                    {plan.minAmount && Number(plan.minAmount) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">최소 투자</span>
                        <span className="text-foreground font-medium">${Number(plan.minAmount).toLocaleString()} USDT</span>
                      </div>
                    )}
                    {plan.duration && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">기간</span>
                        <span className="text-foreground font-medium">{plan.duration}일</span>
                      </div>
                    )}
                    {plan.totalReturn && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">총 수익률</span>
                        <span className={`${colColor.text} font-bold`}>{Number(plan.totalReturn).toFixed(0)}%</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm pt-1 border-t border-border/30">
                      <span className="text-muted-foreground">일일 수익률</span>
                      <span className={`${colColor.text} font-black text-base`}>{Number(plan.dailyRate).toFixed(2)}%</span>
                    </div>
                  </div>

                  {/* infoweb4 링크 */}
                  {infoweb4Url && (
                    <div className="border border-border rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-2 bg-muted/50">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Globe className="w-3.5 h-3.5" />
                          원페이지 소개
                        </div>
                        <a href={infoweb4Url} target="_blank" rel="noopener noreferrer" className="text-xs text-amber-600 hover:text-amber-500 flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" />
                          새탭으로 열기
                        </a>
                      </div>
                      <iframe
                        src={infoweb4Url}
                        className="w-full h-48 border-0"
                        title="Plan Info"
                        sandbox="allow-scripts allow-same-origin allow-popups"
                      />
                    </div>
                  )}
                </div>
              )}

              {activeTab === "video" && (
                <div className="space-y-4">
                  {videoId ? (
                    <div className="rounded-xl overflow-hidden bg-black aspect-video">
                      <iframe
                        src={`https://www.youtube.com/embed/${videoId}`}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={plan.name}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                      <Play className="w-12 h-12 mb-3 opacity-20" />
                      <div className="text-sm">등록된 비디오가 없습니다</div>
                      <div className="text-xs mt-1 opacity-60">(추후 API 연동 예정)</div>
                    </div>
                  )}
                  {videoId2 && (
                    <div className="rounded-xl overflow-hidden bg-black aspect-video">
                      <iframe
                        src={`https://www.youtube.com/embed/${videoId2}`}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={`${plan.name} - 2`}
                      />
                    </div>
                  )}
                </div>
              )}

              {activeTab === "docs" && (
                <div className="space-y-3">
                  {docsLinks.length > 0 ? (
                    docsLinks.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border/40 hover:border-amber-300 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-foreground font-medium">자료 {i + 1}</div>
                          <div className="text-xs text-muted-foreground truncate">{url}</div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-amber-600 transition-colors" />
                      </a>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                      <FileText className="w-12 h-12 mb-3 opacity-20" />
                      <div className="text-sm">등록된 자료가 없습니다</div>
                      <div className="text-xs mt-1 opacity-60">(추후 API 연동 예정)</div>
                    </div>
                  )}
                  {blogUrl && (
                    <a
                      href={blogUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border/40 hover:border-blue-300 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Globe className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-foreground font-medium">Blog</div>
                        <div className="text-xs text-muted-foreground truncate">{blogUrl}</div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-blue-600 transition-colors" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 하단 액션 버튼 */}
        <div className="border-t border-border/60 px-5 py-3 flex flex-wrap items-center gap-2 bg-muted/20">
          <button
            onClick={() => setActiveTab("video")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === "video"
                ? `${colColor.bg} ${colColor.text} border ${colColor.border}`
                : "text-muted-foreground hover:text-foreground border border-border/40 hover:border-border"
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            비디오
          </button>

          <button
            onClick={() => setActiveTab("docs")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === "docs"
                ? `${colColor.bg} ${colColor.text} border ${colColor.border}`
                : "text-muted-foreground hover:text-foreground border border-border/40 hover:border-border"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            자료
          </button>

          {blogUrl && (
            <a
              href={blogUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground border border-border/40 hover:border-border transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Blog
            </a>
          )}

          <button
            onClick={toggleFavorite}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
              isFavorite
                ? "bg-red-100 text-red-600 border-red-300"
                : "text-muted-foreground hover:text-red-500 border-border/40 hover:border-red-300"
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorite ? "fill-red-500" : ""}`} />
            {isFavorite ? "저장됨" : "저장"}
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground border border-border/40 hover:border-border transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Share2 className="w-3.5 h-3.5" />}
            {copied ? "복사됨" : "공유"}
          </button>

          <div className="flex-1" />

          <button
            onClick={() => setActiveTab("overview")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground border border-border/40 hover:border-border transition-all"
          >
            <Eye className="w-3.5 h-3.5" />
            상세
          </button>

          <button
            onClick={handleAddToCart}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground border border-border/40 hover:border-border transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            담기
          </button>

          <button
            onClick={handleGo}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white transition-all ${colColor.btn}`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            이동
          </button>
        </div>
      </div>
    </div>

    {/* 라이트박스 */}
    {lightboxOpen && thumbnails.length > 0 && (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm"
        onClick={() => setLightboxOpen(false)}
      >
        <button
          onClick={() => setLightboxOpen(false)}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>
        {thumbnails.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); setGalleryIndex((i) => (i - 1 + thumbnails.length) % thumbnails.length); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setGalleryIndex((i) => (i + 1) % thumbnails.length); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
        <img
          src={thumbnails[galleryIndex]}
          alt=""
          className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl"
          onClick={(e) => e.stopPropagation()}
        />
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-sm">
          {galleryIndex + 1} / {thumbnails.length}
        </div>
      </div>
    )}
    </>
  );
}
