import { useState, useCallback, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, TrendingUp, TrendingDown, Globe, ExternalLink,
  Twitter, MessageCircle, Github, ArrowLeft, Loader2,
  BarChart2, Flame, Star
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Link } from "wouter";

// ─── 숫자 포맷 유틸 ────────────────────────────────────────────────────────────
function fmtPrice(n: number, currency = "usd") {
  if (!n && n !== 0) return "—";
  if (n < 0.0001) return `$${n.toExponential(2)}`;
  if (n < 1) return `$${n.toFixed(6)}`;
  if (n < 100) return `$${n.toFixed(4)}`;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase(), maximumFractionDigits: 2 }).format(n);
}

function fmtLargeNum(n: number) {
  if (!n) return "—";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

function PctBadge({ value }: { value: number | null | undefined }) {
  if (value == null) return <span className="text-gray-400 text-xs">—</span>;
  const isPos = value >= 0;
  return (
    <span className={`text-xs font-semibold flex items-center gap-0.5 ${isPos ? "text-green-400" : "text-red-400"}`}>
      {isPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {Math.abs(value).toFixed(2)}%
    </span>
  );
}

// ─── 미니 스파크라인 ────────────────────────────────────────────────────────────
function Sparkline({ prices, positive }: { prices: number[]; positive: boolean }) {
  if (!prices || prices.length < 2) return null;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const w = 80, h = 30;
  const pts = prices.map((p, i) => {
    const x = (i / (prices.length - 1)) * w;
    const y = h - ((p - min) / range) * h;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={positive ? "#4ade80" : "#f87171"} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

// ─── 코인 상세 모달 ─────────────────────────────────────────────────────────────
function CoinDetailModal({ coinId, onClose }: { coinId: string; onClose: () => void }) {
  const [chartDays, setChartDays] = useState<"1" | "7" | "30" | "90" | "365">("7");
  const { data: detail, isLoading } = trpc.coins.detail.useQuery({ id: coinId });
  const { data: chart } = trpc.coins.chart.useQuery({ id: coinId, days: chartDays });

  const md = detail?.market_data;
  const price = md?.current_price?.usd;
  const pct24h = md?.price_change_percentage_24h;
  const pct7d = md?.price_change_percentage_7d;
  const pct30d = md?.price_change_percentage_30d;
  const pct1y = md?.price_change_percentage_1y;

  // 차트 데이터 → SVG 폴리라인
  const chartSvg = useMemo(() => {
    if (!chart?.prices || chart.prices.length < 2) return null;
    const prices = chart.prices.map(([, p]) => p);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const W = 400, H = 100;
    const pts = prices.map((p, i) => {
      const x = (i / (prices.length - 1)) * W;
      const y = H - ((p - min) / range) * H;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
    const isPos = prices[prices.length - 1] >= prices[0];
    return { pts, isPos, W, H };
  }, [chart]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          </div>
        ) : detail ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <img src={detail.image.small} alt={detail.name} className="w-8 h-8 rounded-full" />
                <div>
                  <span className="text-white font-bold text-lg">{detail.name}</span>
                  <span className="text-slate-400 text-sm ml-2 uppercase">{detail.symbol}</span>
                </div>
                {detail.market_cap_rank && (
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                    #{detail.market_cap_rank}
                  </Badge>
                )}
              </DialogTitle>
            </DialogHeader>

            {/* 가격 요약 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
              <div className="bg-slate-800/60 rounded-lg p-3 text-center">
                <div className="text-slate-400 text-xs mb-1">현재가</div>
                <div className="text-white font-bold text-sm">{fmtPrice(price ?? 0)}</div>
              </div>
              <div className="bg-slate-800/60 rounded-lg p-3 text-center">
                <div className="text-slate-400 text-xs mb-1">24h</div>
                <PctBadge value={pct24h} />
              </div>
              <div className="bg-slate-800/60 rounded-lg p-3 text-center">
                <div className="text-slate-400 text-xs mb-1">7일</div>
                <PctBadge value={pct7d} />
              </div>
              <div className="bg-slate-800/60 rounded-lg p-3 text-center">
                <div className="text-slate-400 text-xs mb-1">30일</div>
                <PctBadge value={pct30d} />
              </div>
            </div>

            {/* 차트 */}
            <div className="mt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300 text-xs font-medium">가격 차트</span>
                <div className="flex gap-1">
                  {(["1", "7", "30", "90", "365"] as const).map(d => (
                    <button
                      key={d}
                      onClick={() => setChartDays(d)}
                      className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                        chartDays === d
                          ? "bg-amber-500 text-black"
                          : "bg-slate-700 text-slate-400 hover:text-white"
                      }`}
                    >
                      {d === "1" ? "1일" : d === "7" ? "7일" : d === "30" ? "1달" : d === "90" ? "3달" : "1년"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-slate-800/60 rounded-xl p-3 h-28 flex items-center justify-center">
                {chartSvg ? (
                  <svg
                    viewBox={`0 0 ${chartSvg.W} ${chartSvg.H}`}
                    className="w-full h-full"
                    preserveAspectRatio="none"
                  >
                    <polyline
                      points={chartSvg.pts}
                      fill="none"
                      stroke={chartSvg.isPos ? "#4ade80" : "#f87171"}
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                )}
              </div>
            </div>

            {/* 시장 데이터 */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="bg-slate-800/60 rounded-lg p-3">
                <div className="text-slate-400 text-xs mb-1">시가총액</div>
                <div className="text-white text-sm font-medium">{fmtLargeNum(md?.market_cap?.usd ?? 0)}</div>
              </div>
              <div className="bg-slate-800/60 rounded-lg p-3">
                <div className="text-slate-400 text-xs mb-1">24h 거래량</div>
                <div className="text-white text-sm font-medium">{fmtLargeNum(md?.total_volume?.usd ?? 0)}</div>
              </div>
              <div className="bg-slate-800/60 rounded-lg p-3">
                <div className="text-slate-400 text-xs mb-1">ATH (역대 최고)</div>
                <div className="text-white text-sm font-medium">{fmtPrice(md?.ath?.usd ?? 0)}</div>
                <PctBadge value={md?.ath_change_percentage?.usd} />
              </div>
              <div className="bg-slate-800/60 rounded-lg p-3">
                <div className="text-slate-400 text-xs mb-1">ATL (역대 최저)</div>
                <div className="text-white text-sm font-medium">{fmtPrice(md?.atl?.usd ?? 0)}</div>
                <PctBadge value={md?.atl_change_percentage?.usd} />
              </div>
              <div className="bg-slate-800/60 rounded-lg p-3">
                <div className="text-slate-400 text-xs mb-1">유통 공급량</div>
                <div className="text-white text-sm font-medium">
                  {md?.circulating_supply ? md.circulating_supply.toLocaleString() : "—"}
                </div>
              </div>
              <div className="bg-slate-800/60 rounded-lg p-3">
                <div className="text-slate-400 text-xs mb-1">최대 공급량</div>
                <div className="text-white text-sm font-medium">
                  {md?.max_supply ? md.max_supply.toLocaleString() : "무제한"}
                </div>
              </div>
            </div>

            {/* 연간 수익률 */}
            <div className="bg-slate-800/60 rounded-lg p-3 mt-2">
              <div className="text-slate-400 text-xs mb-2">연간 수익률</div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-xs">1년:</span>
                <PctBadge value={pct1y} />
              </div>
            </div>

            {/* 설명 */}
            {detail.description?.en && (
              <div className="mt-3">
                <div className="text-slate-300 text-xs font-medium mb-1">프로젝트 소개</div>
                <p className="text-slate-400 text-xs leading-relaxed line-clamp-4"
                  dangerouslySetInnerHTML={{ __html: detail.description.en.replace(/<[^>]*>/g, "").slice(0, 400) + "..." }}
                />
              </div>
            )}

            {/* 링크 */}
            <div className="flex flex-wrap gap-2 mt-3">
              {detail.links?.homepage?.[0] && (
                <a href={detail.links.homepage[0]} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs text-slate-300 transition-colors">
                  <Globe className="w-3 h-3" /> 공식 사이트
                </a>
              )}
              {detail.links?.twitter_screen_name && (
                <a href={`https://twitter.com/${detail.links.twitter_screen_name}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs text-slate-300 transition-colors">
                  <Twitter className="w-3 h-3" /> Twitter
                </a>
              )}
              {detail.links?.telegram_channel_identifier && (
                <a href={`https://t.me/${detail.links.telegram_channel_identifier}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs text-slate-300 transition-colors">
                  <MessageCircle className="w-3 h-3" /> Telegram
                </a>
              )}
              {detail.links?.repos_url?.github?.[0] && (
                <a href={detail.links.repos_url.github[0]} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs text-slate-300 transition-colors">
                  <Github className="w-3 h-3" /> GitHub
                </a>
              )}
              <a href={`https://www.coingecko.com/en/coins/${detail.id}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 rounded text-xs text-amber-400 transition-colors">
                <ExternalLink className="w-3 h-3" /> CoinGecko
              </a>
            </div>

            {/* 카테고리 */}
            {detail.categories?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {detail.categories.slice(0, 5).map(cat => (
                  <Badge key={cat} className="bg-slate-700 text-slate-300 border-slate-600 text-xs">{cat}</Badge>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-slate-400">코인 정보를 불러올 수 없습니다.</div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── 메인 코인정보 페이지 ───────────────────────────────────────────────────────
export default function CoinsPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCoin, setSelectedCoin] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [order, setOrder] = useState<"market_cap_desc" | "volume_desc" | "market_cap_asc">("market_cap_desc");
  const [currency] = useState("usd");

  const bg = isDark ? "bg-slate-950" : "bg-gray-50";
  const cardBg = isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-gray-200";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-slate-400" : "text-gray-500";

  // 디바운스 검색
  const handleSearchChange = useCallback((val: string) => {
    setSearchQuery(val);
    const t = setTimeout(() => setDebouncedSearch(val), 400);
    return () => clearTimeout(t);
  }, []);

  const { data: coins, isLoading } = trpc.coins.list.useQuery(
    { page, perPage: 100, currency, order },
    { enabled: !debouncedSearch, staleTime: 30_000 }
  );

  const { data: searchResults, isLoading: isSearching } = trpc.coins.search.useQuery(
    { query: debouncedSearch },
    { enabled: !!debouncedSearch, staleTime: 10_000 }
  );

  const { data: globalData } = trpc.coins.global.useQuery(undefined, { staleTime: 60_000 });
  const { data: trending } = trpc.coins.trending.useQuery(undefined, { staleTime: 60_000 });

  const displayCoins = debouncedSearch ? null : coins;
  const totalMktCap = globalData?.total_market_cap?.usd;
  const btcDom = globalData?.market_cap_percentage?.btc;
  const ethDom = globalData?.market_cap_percentage?.eth;

  return (
    <div className={`min-h-screen ${bg} py-6 px-3 sm:px-4`}>
      <div className="max-w-5xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-4">
          <Link href="/">
            <button className={`flex items-center gap-1 text-xs ${textSecondary} hover:text-amber-400 transition-colors`}>
              <ArrowLeft className="w-3.5 h-3.5" /> 홈으로
            </button>
          </Link>
          <h1 className={`text-xl sm:text-2xl font-bold ${textPrimary} flex items-center gap-2`}>
            🪙 코인정보
          </h1>
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">CoinGecko</Badge>
        </div>

        {/* 글로벌 통계 */}
        {globalData && (
          <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 p-3 rounded-xl border ${cardBg}`}>
            <div className="text-center">
              <div className={`text-[10px] ${textSecondary} mb-0.5`}>전체 시가총액</div>
              <div className={`text-xs font-bold ${textPrimary}`}>{fmtLargeNum(totalMktCap ?? 0)}</div>
            </div>
            <div className="text-center">
              <div className={`text-[10px] ${textSecondary} mb-0.5`}>24h 변동</div>
              <PctBadge value={globalData.market_cap_change_percentage_24h_usd} />
            </div>
            <div className="text-center">
              <div className={`text-[10px] ${textSecondary} mb-0.5`}>BTC 도미넌스</div>
              <div className={`text-xs font-bold text-amber-400`}>{btcDom?.toFixed(1)}%</div>
            </div>
            <div className="text-center">
              <div className={`text-[10px] ${textSecondary} mb-0.5`}>ETH 도미넌스</div>
              <div className={`text-xs font-bold text-blue-400`}>{ethDom?.toFixed(1)}%</div>
            </div>
          </div>
        )}

        {/* 트렌딩 코인 */}
        {trending && trending.length > 0 && !debouncedSearch && (
          <div className="mb-4">
            <div className={`text-xs font-bold mb-2 flex items-center gap-1 ${textPrimary}`}>
              <Flame className="w-3.5 h-3.5 text-orange-400" /> 트렌딩 코인
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {trending.slice(0, 7).map(coin => (
                <button
                  key={coin.id}
                  onClick={() => setSelectedCoin(coin.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-colors ${
                    isDark
                      ? "bg-slate-800/60 border-slate-700 hover:border-amber-500/50 text-slate-300"
                      : "bg-white border-gray-200 hover:border-amber-400 text-gray-700"
                  }`}
                >
                  <img src={coin.thumb} alt={coin.name} className="w-4 h-4 rounded-full" />
                  <span className="font-medium">{coin.symbol}</span>
                  {coin.data?.price_change_percentage_24h?.usd != null && (
                    <PctBadge value={coin.data.price_change_percentage_24h.usd} />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 검색 + 정렬 */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${textSecondary}`} />
            <Input
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="코인 이름 또는 심볼 검색... (예: bitcoin, BTC)"
              className={`pl-9 text-sm ${isDark ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" : "bg-white border-gray-300"}`}
            />
          </div>
          {!debouncedSearch && (
            <Select value={order} onValueChange={v => { setOrder(v as any); setPage(1); }}>
              <SelectTrigger className={`w-36 text-xs ${isDark ? "bg-slate-800 border-slate-700 text-white" : ""}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={isDark ? "bg-slate-800 border-slate-700" : ""}>
                <SelectItem value="market_cap_desc">시가총액 ↓</SelectItem>
                <SelectItem value="market_cap_asc">시가총액 ↑</SelectItem>
                <SelectItem value="volume_desc">거래량 ↓</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {/* 검색 결과 */}
        {debouncedSearch && (
          <div className="mb-4">
            <div className={`text-xs font-bold mb-2 flex items-center gap-1 ${textPrimary}`}>
              <Search className="w-3.5 h-3.5" /> 검색 결과
              {isSearching && <Loader2 className="w-3 h-3 animate-spin text-slate-400 ml-1" />}
            </div>
            {searchResults && searchResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {searchResults.slice(0, 20).map(coin => (
                  <button
                    key={coin.id}
                    onClick={() => setSelectedCoin(coin.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all hover:border-amber-500/50 ${cardBg}`}
                  >
                    <img src={coin.large || coin.thumb} alt={coin.name} className="w-8 h-8 rounded-full" />
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold ${textPrimary} truncate`}>{coin.name}</div>
                      <div className={`text-xs ${textSecondary} uppercase`}>{coin.symbol}</div>
                    </div>
                    {coin.market_cap_rank && (
                      <Badge className="bg-slate-700 text-slate-300 border-slate-600 text-xs shrink-0">
                        #{coin.market_cap_rank}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            ) : !isSearching ? (
              <div className={`text-center py-8 ${textSecondary} text-sm`}>검색 결과가 없습니다.</div>
            ) : null}
          </div>
        )}

        {/* 코인 목록 테이블 */}
        {!debouncedSearch && (
          <>
            {/* 헤더 행 */}
            <div className={`hidden sm:grid grid-cols-[2rem_1fr_8rem_8rem_8rem_8rem_5rem] gap-2 px-3 py-2 text-[11px] font-semibold ${textSecondary} border-b ${isDark ? "border-slate-700" : "border-gray-200"} mb-1`}>
              <span>#</span>
              <span>코인</span>
              <span className="text-right">현재가</span>
              <span className="text-right">1h</span>
              <span className="text-right">24h</span>
              <span className="text-right">7일</span>
              <span className="text-right">시가총액</span>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
              </div>
            ) : displayCoins && displayCoins.length > 0 ? (
              <div className="space-y-0.5">
                {displayCoins.map(coin => {
                  const isPos = (coin.price_change_percentage_24h ?? 0) >= 0;
                  const sparkPrices = coin.sparkline_in_7d?.price ?? [];
                  return (
                    <button
                      key={coin.id}
                      onClick={() => setSelectedCoin(coin.id)}
                      className={`w-full grid grid-cols-[2rem_1fr_auto] sm:grid-cols-[2rem_1fr_8rem_8rem_8rem_8rem_5rem] gap-2 items-center px-3 py-2.5 rounded-lg border transition-all text-left hover:border-amber-500/40 ${cardBg}`}
                    >
                      {/* 순위 */}
                      <span className={`text-xs ${textSecondary} font-mono`}>{coin.market_cap_rank}</span>

                      {/* 코인 이름 */}
                      <div className="flex items-center gap-2 min-w-0">
                        <img src={coin.image} alt={coin.name} className="w-6 h-6 rounded-full shrink-0" />
                        <div className="min-w-0">
                          <div className={`text-xs font-semibold ${textPrimary} truncate`}>{coin.name}</div>
                          <div className={`text-[10px] ${textSecondary} uppercase`}>{coin.symbol}</div>
                        </div>
                      </div>

                      {/* 모바일: 가격 + 등락 */}
                      <div className="sm:hidden text-right">
                        <div className={`text-xs font-bold ${textPrimary}`}>{fmtPrice(coin.current_price)}</div>
                        <PctBadge value={coin.price_change_percentage_24h} />
                      </div>

                      {/* 데스크탑: 각 컬럼 */}
                      <span className={`hidden sm:block text-xs font-bold ${textPrimary} text-right`}>{fmtPrice(coin.current_price)}</span>
                      <span className="hidden sm:flex justify-end"><PctBadge value={coin.price_change_percentage_1h_in_currency} /></span>
                      <span className="hidden sm:flex justify-end"><PctBadge value={coin.price_change_percentage_24h} /></span>
                      <div className="hidden sm:flex justify-end items-center gap-1">
                        <Sparkline prices={sparkPrices.slice(-20)} positive={isPos} />
                        <PctBadge value={coin.price_change_percentage_7d_in_currency} />
                      </div>
                      <span className={`hidden sm:block text-xs ${textSecondary} text-right`}>{fmtLargeNum(coin.market_cap)}</span>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {/* 페이지네이션 */}
            {!isLoading && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <Button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  variant="outline"
                  size="sm"
                  className={`text-xs ${isDark ? "border-slate-700 text-slate-300 hover:bg-slate-700" : ""}`}
                >
                  이전
                </Button>
                <span className={`text-xs ${textSecondary}`}>{page} 페이지</span>
                <Button
                  onClick={() => setPage(p => p + 1)}
                  variant="outline"
                  size="sm"
                  className={`text-xs ${isDark ? "border-slate-700 text-slate-300 hover:bg-slate-700" : ""}`}
                >
                  다음
                </Button>
              </div>
            )}
          </>
        )}

        {/* CoinGecko 크레딧 */}
        <div className="text-center mt-6">
          <a href="https://www.coingecko.com" target="_blank" rel="noopener noreferrer"
            className={`text-xs ${textSecondary} hover:text-amber-400 transition-colors flex items-center justify-center gap-1`}>
            <BarChart2 className="w-3 h-3" /> 데이터 제공: CoinGecko
          </a>
        </div>
      </div>

      {/* 코인 상세 모달 */}
      {selectedCoin && (
        <CoinDetailModal coinId={selectedCoin} onClose={() => setSelectedCoin(null)} />
      )}
    </div>
  );
}
