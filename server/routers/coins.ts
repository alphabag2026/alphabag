import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

async function cgFetch(path: string) {
  const url = `${COINGECKO_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "x-cg-demo-api-key": process.env.COINGECKO_API_KEY ?? "",
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `CoinGecko API error ${res.status}: ${text.slice(0, 200)}`,
    });
  }
  return res.json();
}

export const coinsRouter = router({
  // 코인 목록 (시가총액 순, 페이지네이션)
  list: publicProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        perPage: z.number().int().min(1).max(250).default(100),
        currency: z.string().default("usd"),
        category: z.string().optional(),
        order: z
          .enum([
            "market_cap_desc",
            "market_cap_asc",
            "volume_desc",
            "volume_asc",
            "id_asc",
            "id_desc",
          ])
          .default("market_cap_desc"),
      })
    )
    .query(async ({ input }) => {
      const params = new URLSearchParams({
        vs_currency: input.currency,
        order: input.order,
        per_page: String(input.perPage),
        page: String(input.page),
        sparkline: "true",
        price_change_percentage: "1h,24h,7d",
      });
      if (input.category) params.set("category", input.category);
      const data = await cgFetch(`/coins/markets?${params}`);
      return data as CoinMarket[];
    }),

  // 코인 검색
  search: publicProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ input }) => {
      const data = await cgFetch(
        `/search?query=${encodeURIComponent(input.query)}`
      );
      return (data.coins ?? []) as SearchCoin[];
    }),

  // 코인 상세 정보
  detail: publicProcedure
    .input(
      z.object({
        id: z.string(),
        currency: z.string().default("usd"),
      })
    )
    .query(async ({ input }) => {
      const params = new URLSearchParams({
        localization: "false",
        tickers: "false",
        market_data: "true",
        community_data: "false",
        developer_data: "false",
        sparkline: "false",
      });
      const data = await cgFetch(`/coins/${input.id}?${params}`);
      return data as CoinDetail;
    }),

  // 코인 가격 차트 (OHLC)
  chart: publicProcedure
    .input(
      z.object({
        id: z.string(),
        currency: z.string().default("usd"),
        days: z.enum(["1", "7", "14", "30", "90", "180", "365", "max"]).default("7"),
      })
    )
    .query(async ({ input }) => {
      const data = await cgFetch(
        `/coins/${input.id}/market_chart?vs_currency=${input.currency}&days=${input.days}`
      );
      return data as { prices: [number, number][]; market_caps: [number, number][]; total_volumes: [number, number][] };
    }),

  // 글로벌 시장 통계
  global: publicProcedure.query(async () => {
    const data = await cgFetch("/global");
    return data.data as GlobalData;
  }),

  // 카테고리 목록
  categories: publicProcedure.query(async () => {
    const data = await cgFetch("/coins/categories/list");
    return data as { category_id: string; name: string }[];
  }),

  // 트렌딩 코인
  trending: publicProcedure.query(async () => {
    const data = await cgFetch("/search/trending");
    return (data.coins ?? []).map((c: any) => c.item) as TrendingCoin[];
  }),
});

// ─── 타입 정의 ────────────────────────────────────────────────────────────────
export interface CoinMarket {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number | null;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  price_change_percentage_1h_in_currency: number;
  price_change_percentage_7d_in_currency: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  sparkline_in_7d: { price: number[] };
  last_updated: string;
}

export interface SearchCoin {
  id: string;
  name: string;
  api_symbol: string;
  symbol: string;
  market_cap_rank: number;
  thumb: string;
  large: string;
}

export interface CoinDetail {
  id: string;
  symbol: string;
  name: string;
  description: { en: string; ko?: string };
  image: { thumb: string; small: string; large: string };
  market_cap_rank: number;
  links: {
    homepage: string[];
    blockchain_site: string[];
    official_forum_url: string[];
    chat_url: string[];
    announcement_url: string[];
    twitter_screen_name: string;
    telegram_channel_identifier: string;
    subreddit_url: string;
    repos_url: { github: string[]; bitbucket: string[] };
  };
  market_data: {
    current_price: Record<string, number>;
    market_cap: Record<string, number>;
    total_volume: Record<string, number>;
    high_24h: Record<string, number>;
    low_24h: Record<string, number>;
    price_change_24h: number;
    price_change_percentage_24h: number;
    price_change_percentage_7d: number;
    price_change_percentage_30d: number;
    price_change_percentage_1y: number;
    market_cap_change_24h: number;
    market_cap_change_percentage_24h: number;
    circulating_supply: number;
    total_supply: number | null;
    max_supply: number | null;
    ath: Record<string, number>;
    ath_change_percentage: Record<string, number>;
    ath_date: Record<string, string>;
    atl: Record<string, number>;
    atl_change_percentage: Record<string, number>;
    atl_date: Record<string, string>;
  };
  genesis_date: string | null;
  categories: string[];
  last_updated: string;
}

export interface GlobalData {
  active_cryptocurrencies: number;
  upcoming_icos: number;
  ongoing_icos: number;
  ended_icos: number;
  markets: number;
  total_market_cap: Record<string, number>;
  total_volume: Record<string, number>;
  market_cap_percentage: Record<string, number>;
  market_cap_change_percentage_24h_usd: number;
  updated_at: number;
}

export interface TrendingCoin {
  id: string;
  coin_id: number;
  name: string;
  symbol: string;
  market_cap_rank: number;
  thumb: string;
  small: string;
  large: string;
  slug: string;
  price_btc: number;
  score: number;
  data: {
    price: string;
    price_btc: string;
    price_change_percentage_24h: Record<string, number>;
    market_cap: string;
    market_cap_btc: string;
    total_volume: string;
    total_volume_btc: string;
    sparkline: string;
  };
}
