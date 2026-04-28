import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { normalize1pageUrl } from "@/lib/utils";
import { useWallet } from "@/contexts/WalletContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import {
  X, Star, Play, FileText, ExternalLink, Share2,
  Eye, Plus, Check, Globe, Heart, ChevronLeft, ChevronRight, ZoomIn,
  MessageCircle, Twitter, Send, ShoppingCart, Sparkles, Copy, RefreshCw
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
  const [activeTab, setActiveTab] = useState<"overview" | "video" | "docs" | "chart" | "reviews">("overview");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewHover, setReviewHover] = useState(0);
  const { data: allPlans } = trpc.public.plans.useQuery({});
  const [referralCode, setReferralCode] = useState("");
  const [referralSaved, setReferralSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShareOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const [isFavorite, setIsFavorite] = useState(() => {
    const favs = JSON.parse(localStorage.getItem("alphabag_favorites") || "[]");
    return favs.includes(planId);
  });
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [recommendTexts, setRecommendTexts] = useState<string[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [recommendLang, setRecommendLang] = useState("ko");

  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { isConnected, openModal } = useWallet();

  const { data: plan, isLoading } = trpc.public.planDetail.useQuery({ id: planId });
  const { data: reviewData, refetch: refetchReviews } = trpc.public.planReviews.useQuery({ planId }, { enabled: !!planId });
  const { data: myReview } = trpc.user.myReview.useQuery({ planId }, { enabled: isAuthenticated && !!planId });
  const upsertReview = trpc.user.upsertReview.useMutation({
    onSuccess: () => {
      toast.success("리뷰가 저장되었습니다!");
      refetchReviews();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const chartData = useMemo(() => {
    if (!plan) return [];
    const daily = Number(plan.dailyRate) || 0;
    const months = plan.duration ? Math.min(Math.ceil(plan.duration / 30), 12) : 12;
    return Array.from({ length: months + 1 }, (_, i) => {
      const days = i * 30;
      const compound = 100 * Math.pow(1 + daily / 100, days);
      return { month: i === 0 ? "시작" : `${i}개월`, value: parseFloat(compound.toFixed(2)), days };
    });
  }, [plan]);

  const similarPlans = useMemo(() => {
    if (!plan || !allPlans) return [];
    return (allPlans as any[])
      .filter((p) => p.id !== plan.id && p.collectionType === (plan as any).collectionType)
      .slice(0, 3);
  }, [plan, allPlans]);

  const generateRecommend = (trpc.public as any).generateRecommendText.useMutation({
    onSuccess: (data: any) => {
      setRecommendTexts(data.texts);
      toast.success(t("planDetail.aiRecommend") + " ✓");
    },
    onError: () => toast.error("Error"),
  });

  const handleCopyRecommend = async (text: string, idx: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
    toast.success(t("planDetail.copied") + " ✓");
  };

  const toggleFavorite = useCallback(() => {
    const favs: number[] = JSON.parse(localStorage.getItem("alphabag_favorites") || "[]");
    const newFavs = isFavorite ? favs.filter((id) => id !== planId) : [...favs, planId];
    localStorage.setItem("alphabag_favorites", JSON.stringify(newFavs));
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? t("planDetail.save") + " -" : t("planDetail.save") + " +");
  }, [isFavorite, planId]);

  const invest = trpc.user.invest.useMutation({
    onSuccess: () => {
      toast.success(t("plans.investNow") + " ✓");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSaveReferral = () => {
    if (!referralCode.trim()) return;
    localStorage.setItem(`referral_${planId}`, referralCode.trim().toUpperCase());
    setReferralSaved(true);
    toast.success(t("planDetail.referralSaved"));
  };

  const handleAddToCart = () => {
    if (!isConnected) { openModal(); return; }
    const cart = JSON.parse(localStorage.getItem("alphabag_cart") || "[]");
    if (!cart.find((item: any) => item.id === planId)) {
      cart.push({ id: planId, name: plan?.name, addedAt: Date.now() });
      localStorage.setItem("alphabag_cart", JSON.stringify(cart));
    }
    toast.success(t("planDetail.addToCart") + " ✓");
  };

  const handleInvest = () => {
    if (!isConnected) { openModal(); return; }
    if (!isAuthenticated) { window.dispatchEvent(new CustomEvent("open-wallet-modal")); return; }
    const amount = prompt(t("planDetail.minInvestment") + " (USDT):");
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;
    invest.mutate({ planId, amount });
  };

  const getShareUrl = () => {
    const url = `${window.location.origin}/plan/${planId}`;
    const refCode = localStorage.getItem(`referral_${planId}`) || "";
    return refCode ? `${url}?ref=${refCode}` : url;
  };

  const handleShare = async () => {
    const shareUrl = getShareUrl();
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success(t("planDetail.copied") + " ✓");
    } catch {
      toast.error("Copy failed");
    }
  };

  const handleShareTelegram = () => {
    const shareUrl = getShareUrl();
    const text = encodeURIComponent(`${plan?.name} - AlphaBag\n${Number((plan as any)?.dailyRate || 0).toFixed(2)}% Daily Return\n\n`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${text}`, "_blank");
    setShareOpen(false);
  };

  const handleShareTwitter = () => {
    const shareUrl = getShareUrl();
    const text = encodeURIComponent(`${plan?.name} - ${Number((plan as any)?.dailyRate || 0).toFixed(2)}% Daily Return on AlphaBag`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`, "_blank");
    setShareOpen(false);
  };

  const handleShareKakao = () => {
    const shareUrl = getShareUrl();
    window.open(`https://story.kakao.com/share?url=${encodeURIComponent(shareUrl)}`, "_blank");
    setShareOpen(false);
  };

  const handleGo = () => {
    if (plan?.infoweb4Url) {
      window.open(plan.infoweb4Url, "_blank");
    } else if (plan?.telegramUrl) {
      window.open(plan.telegramUrl, "_blank");
    } else {
      toast.info(t("planDetail.noGoUrl"));
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
  const onepageUrl = normalize1pageUrl((plan as any).onepageUrl);

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
            { key: "overview", label: t("planDetail.overview") },
            { key: "chart", label: "차트" },
            { key: "video", label: t("planDetail.video") },
            { key: "docs", label: t("planDetail.docs") },
            { key: "reviews", label: "리뷰" },
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
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="flex flex-col md:flex-row gap-0">
            {/* 좌측 패널 */}
            <div className="md:w-[340px] flex-shrink-0 p-5 border-r border-border/40 space-y-4 overflow-y-auto">
              {/* 플랜 정보 */}
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-950">
                  {(plan as any).logoUrl ? (
                    <img src={(plan as any).logoUrl} alt={plan.name} className="w-full h-full object-contain p-1" />
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
                {(plan as any).isMLM && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500 text-white font-bold">MLM</span>
                )}
              </div>

              {/* 추천금액 */}
              {(plan as any).recommendedAmount && (
                <div className="text-sm">
                  <span className="text-muted-foreground">{t("planDetail.recommendedAmount")}: </span>
                  <span className="text-amber-600 font-bold">
                    {Number((plan as any).recommendedAmount).toLocaleString()} USDT
                  </span>
                </div>
              )}

              {/* 추천코드 입력 */}
              <div className="bg-muted/50 rounded-xl p-3 space-y-2 border border-border/40">
                <div className="text-xs text-muted-foreground font-medium">{t("planDetail.referralCode")}</div>
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
                  {t("planDetail.saveBtn")}
                </button>
                <div className="text-[10px] text-muted-foreground">{t("planDetail.referralNote")}</div>
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
                  {/* 텍스트 요약 */}
                  {plan.description && (
                    <div className="bg-gradient-to-br from-muted/60 to-muted/30 rounded-xl p-4 border border-border/40">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-base">📋</span>
                        <span className="text-xs font-bold text-foreground uppercase tracking-wide">{t("planDetail.projectSummary")}</span>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{plan.description}</p>
                    </div>
                  )}

                  {/* 추천문구 자동생성 */}
                  <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 rounded-xl p-4 border border-amber-400/30">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-bold text-foreground">{t("planDetail.aiRecommend")}</span>
                      </div>
                      <select
                        value={recommendLang}
                        onChange={(e) => setRecommendLang(e.target.value)}
                        className="text-xs bg-background border border-border rounded-lg px-2 py-1 text-foreground focus:outline-none focus:border-amber-400"
                      >
                        <option value="ko">🇰🇷 Korean</option>
                        <option value="en">🇺🇸 English</option>
                        <option value="zh">🇨🇳 中文</option>
                        <option value="ja">🇯🇵 日本語</option>
                        <option value="vi">🇻🇳 Tiếng Việt</option>
                        <option value="th">🇹🇭 ภาษาไทย</option>
                        <option value="id">🇮🇩 Bahasa</option>
                      </select>
                    </div>
                    <button
                      onClick={() => generateRecommend.mutate({ planId, lang: recommendLang })}
                      disabled={generateRecommend.isPending}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-sm font-bold transition-all"
                    >
                      {generateRecommend.isPending ? (
                        <><RefreshCw className="w-4 h-4 animate-spin" /> {t("planDetail.generating")}</>
                      ) : (
                        <><Sparkles className="w-4 h-4" /> {t("planDetail.generateRecommend")}</>
                      )}
                    </button>
                    {recommendTexts.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {recommendTexts.map((text, idx) => (
                          <div key={idx} className="flex items-start gap-2 bg-background/60 rounded-lg p-3 border border-border/40">
                            <p className="flex-1 text-sm text-foreground leading-relaxed">{text}</p>
                            <button
                              onClick={() => handleCopyRecommend(text, idx)}
                              className="flex-shrink-0 p-1.5 rounded-md hover:bg-muted transition-colors"
                            >
                              {copiedIdx === idx ? (
                                <Check className="w-3.5 h-3.5 text-green-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

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
                        <span className="text-muted-foreground">{t("planDetail.minInvestment")}</span>
                        <span className="text-foreground font-medium">${Number(plan.minAmount).toLocaleString()} USDT</span>
                      </div>
                    )}
                    {plan.duration && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t("planDetail.duration")}</span>
                        <span className="text-foreground font-medium">{plan.duration} {t("planDetail.days")}</span>
                      </div>
                    )}
                    {plan.totalReturn && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t("planDetail.totalReturn")}</span>
                        <span className={`${colColor.text} font-bold`}>{Number(plan.totalReturn).toFixed(0)}%</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm pt-1 border-t border-border/30">
                      <span className="text-muted-foreground">{t("planDetail.dailyRate")}</span>
                      <span className={`${colColor.text} font-black text-base`}>{Number(plan.dailyRate).toFixed(2)}%</span>
                    </div>
                  </div>

                  {/* 1page.to 링크 */}
                  {onepageUrl && (
                    <a
                      href={onepageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-400/40 hover:border-amber-400 transition-all group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
                        <Globe className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-foreground">1page</div>
                        <div className="text-xs text-muted-foreground truncate">{onepageUrl}</div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-amber-500 group-hover:text-amber-400 transition-colors" />
                    </a>
                  )}

                  {/* 1page.to 링크 */}
                  {infoweb4Url && (
                    <div className="border border-border rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-2 bg-muted/50">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Globe className="w-3.5 h-3.5" />
                          {t("planDetail.onepageIntro")}
                        </div>
                        <a href={infoweb4Url} target="_blank" rel="noopener noreferrer" className="text-xs text-amber-600 hover:text-amber-500 flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" />
                          {t("planDetail.openNewTab")}
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
                      <div className="text-sm">{t("planDetail.noVideo")}</div>
                      <div className="text-xs mt-1 opacity-60">{t("planDetail.noVideoDesc")}</div>
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

              {activeTab === "chart" && (
                <div className="space-y-6 p-2">
                  {/* 복리 수익 차트 */}
                  <div className="bg-muted/30 rounded-xl p-4 border border-border/40">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-base">📈</span>
                      <span className="text-sm font-bold text-foreground">복리 수익 시뮬레이션</span>
                      <span className="text-xs text-muted-foreground ml-auto">초기 투자 $100 기준</span>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} width={50} />
                        <Tooltip
                          contentStyle={{ background: "#1a1a2e", border: "1px solid #374151", borderRadius: "8px", fontSize: 12 }}
                          formatter={(value: number) => [`$${value.toFixed(2)}`, "자산"]}
                        />
                        <Area type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2} fill="url(#colorValue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-3 gap-3 mt-4">
                      {chartData.length > 1 && [
                        { label: "1개월 후", idx: 1 },
                        { label: "3개월 후", idx: Math.min(3, chartData.length - 1) },
                        { label: `${chartData.length - 1}개월 후`, idx: chartData.length - 1 },
                      ].map((item) => (
                        <div key={item.label} className="bg-background/60 rounded-lg p-3 border border-border/40 text-center">
                          <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
                          <div className="text-sm font-bold text-amber-500">${chartData[item.idx]?.value.toFixed(2)}</div>
                          <div className="text-xs text-emerald-500">+{((chartData[item.idx]?.value ?? 100) - 100).toFixed(1)}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* 일일 수익률 정보 */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/30 rounded-xl p-4 border border-border/40 text-center">
                      <div className="text-xs text-muted-foreground mb-1">일일 수익률</div>
                      <div className={`text-2xl font-black ${colColor.text}`}>{Number(plan.dailyRate).toFixed(2)}%</div>
                    </div>
                    <div className="bg-muted/30 rounded-xl p-4 border border-border/40 text-center">
                      <div className="text-xs text-muted-foreground mb-1">월 환산 수익률</div>
                      <div className="text-2xl font-black text-emerald-500">{(Number(plan.dailyRate) * 30).toFixed(1)}%</div>
                    </div>
                  </div>
                  {/* 유사 플랜 추천 */}
                  {similarPlans.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-base">🔗</span>
                        <span className="text-sm font-bold text-foreground">유사 플랜 추천</span>
                      </div>
                      <div className="space-y-2">
                        {similarPlans.map((p: any) => (
                          <div key={p.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border/40 hover:border-amber-400/50 transition-colors cursor-pointer" onClick={() => { onClose(); setTimeout(() => window.dispatchEvent(new CustomEvent("open-plan", { detail: { planId: p.id } })), 100); }}>
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-900 flex-shrink-0">
                              {p.logoUrl ? <img src={p.logoUrl} alt={p.name} className="w-full h-full object-contain p-1" /> : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground">{p.name?.charAt(0)}</div>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-foreground truncate">{p.name}</div>
                              <div className="text-xs text-muted-foreground">{p.planType === "staking" ? "Staking" : "Investment"}</div>
                            </div>
                            <div className={`text-sm font-black ${colColor.text}`}>{Number(p.dailyRate).toFixed(2)}%</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "reviews" && (
                <div className="space-y-4 p-1">
                  <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl border border-border/40">
                    <div className="text-center">
                      <div className="text-4xl font-black text-foreground">{reviewData?.avgRating?.toFixed(1) || "0.0"}</div>
                      <div className="flex gap-0.5 justify-center mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < Math.round(reviewData?.avgRating || 0) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{reviewData?.count || 0}개 리뷰</div>
                    </div>
                    <div className="flex-1">
                      {[5,4,3,2,1].map((star) => {
                        const cnt = (reviewData?.reviews || []).filter((r: any) => r.rating === star).length;
                        const pct = reviewData?.count ? Math.round((cnt / reviewData.count) * 100) : 0;
                        return (
                          <div key={star} className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-muted-foreground w-3">{star}</span>
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground w-6">{cnt}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {isAuthenticated ? (
                    <div className="p-4 bg-muted/20 rounded-xl border border-border/40">
                      <div className="text-sm font-semibold text-foreground mb-3">{myReview ? "내 리뷰 수정" : "리뷰 작성"}</div>
                      <div className="flex gap-1 mb-3">
                        {[1,2,3,4,5].map((star) => (
                          <button key={star} onMouseEnter={() => setReviewHover(star)} onMouseLeave={() => setReviewHover(0)} onClick={() => setReviewRating(star)} className="transition-transform hover:scale-110">
                            <Star className={`w-7 h-7 ${star <= (reviewHover || (myReview ? myReview.rating : reviewRating)) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                          </button>
                        ))}
                      </div>
                      <textarea className="w-full text-sm bg-background border border-border/60 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-amber-400/60 text-foreground placeholder:text-muted-foreground" rows={3} placeholder="이 플랜에 대한 의견을 남겨주세요... (선택사항)" value={reviewComment || (myReview?.comment ?? "")} onChange={(e) => setReviewComment(e.target.value)} />
                      <button onClick={() => upsertReview.mutate({ planId, rating: reviewRating, comment: reviewComment || undefined })} disabled={upsertReview.isPending} className="mt-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-sm transition-all disabled:opacity-50">
                        {upsertReview.isPending ? "저장 중..." : myReview ? "수정하기" : "리뷰 등록"}
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 text-center bg-muted/20 rounded-xl border border-border/40">
                      <p className="text-sm text-muted-foreground mb-2">리뷰를 작성하려면 로그인이 필요합니다.</p>
                      <button onClick={() => window.dispatchEvent(new CustomEvent("open-wallet-modal"))} className="px-4 py-2 bg-amber-500 text-black font-bold rounded-lg text-sm">로그인</button>
                    </div>
                  )}
                  <div className="space-y-3">
                    {(reviewData?.reviews || []).length === 0 && (
                      <div className="text-center py-8 text-muted-foreground text-sm">아직 리뷰가 없습니다. 첫 번째 리뷰를 남겨보세요!</div>
                    )}
                    {(reviewData?.reviews || []).map((r: any) => (
                      <div key={r.id} className="p-3 bg-muted/20 rounded-xl border border-border/30">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700">{(r.userName || "?").charAt(0).toUpperCase()}</div>
                          <span className="text-xs font-medium text-foreground">{r.userName || "익명"}</span>
                          <div className="flex gap-0.5 ml-auto">{Array.from({ length: 5 }).map((_, i) => (<Star key={i} className={`w-3 h-3 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`} />))}</div>
                        </div>
                        {r.comment && <p className="text-xs text-muted-foreground leading-relaxed">{r.comment}</p>}
                        <div className="text-[10px] text-muted-foreground/50 mt-1">{new Date(r.createdAt).toLocaleDateString()}</div>
                      </div>
                    ))}
                  </div>
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
                          <div className="text-sm text-foreground font-medium">{t("planDetail.docs")} {i + 1}</div>
                          <div className="text-xs text-muted-foreground truncate">{url}</div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-amber-600 transition-colors" />
                      </a>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                      <FileText className="w-12 h-12 mb-3 opacity-20" />
                      <div className="text-sm">{t("planDetail.noDocs")}</div>
                      <div className="text-xs mt-1 opacity-60">{t("planDetail.noVideoDesc")}</div>
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
            {t("planDetail.video")}
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
            {t("planDetail.docs")}
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
            {isFavorite ? t("planDetail.saved") : t("planDetail.save")}
          </button>

          {/* 공유 드롭다운 */}
          <div className="relative" ref={shareRef}>
            <button
              onClick={() => setShareOpen(!shareOpen)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground border border-border/40 hover:border-border transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Share2 className="w-3.5 h-3.5" />}
              {copied ? t("planDetail.copied") : t("planDetail.share")}
            </button>
            {shareOpen && (
              <div className="absolute bottom-full mb-2 left-0 bg-background border border-border rounded-xl shadow-xl p-2 min-w-[160px] z-10">
                <button
                  onClick={handleShare}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs hover:bg-muted transition-colors text-left"
                >
                  <Check className="w-3.5 h-3.5 text-green-600" />
                  {t("planDetail.copied")}
                </button>
                <button
                  onClick={handleShareTelegram}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs hover:bg-muted transition-colors text-left"
                >
                  <Send className="w-3.5 h-3.5 text-blue-500" />
                  {t("planDetail.telegramShare")}
                </button>
                <button
                  onClick={handleShareTwitter}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs hover:bg-muted transition-colors text-left"
                >
                  <Twitter className="w-3.5 h-3.5 text-sky-500" />
                  {t("planDetail.twitterShare")}
                </button>
                <button
                  onClick={handleShareKakao}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs hover:bg-muted transition-colors text-left"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-yellow-500" />
                  {t("planDetail.kakaoShare")}
                </button>
              </div>
            )}
          </div>

          <div className="flex-1" />

          {onepageUrl && (
            <a
              href={onepageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black transition-all"
            >
              <Globe className="w-3.5 h-3.5" />
               1page
            </a>
          )}

          <button
            onClick={() => setActiveTab("overview")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground border border-border/40 hover:border-border transition-all"
          >
            <Eye className="w-3.5 h-3.5" />
            {t("planDetail.details")}
          </button>

          <button
            onClick={handleAddToCart}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground border border-border/40 hover:border-border transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            {t("planDetail.addToCart")}
          </button>

          <button
            onClick={handleGo}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white transition-all ${colColor.btn}`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {t("planDetail.go")}
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
