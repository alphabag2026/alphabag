/**
 * TwitterFetchScheduler
 * - 1시간마다 autoFetchEnabled=true 인플루언서의 최신 트윗을 X API v2로 수집
 * - 미디어 URL 수집: 트윗에 첨부된 사진/동영상 URL을 mediaUrls 컬럼에 저장
 * - 자동 번역: autoTranslate=true인 인플루언서의 새 트윗을 LLM으로 자동 번역
 * - 중복 방지: tweetId 기준으로 이미 저장된 트윗은 스킵
 * - 텔레그램 발송: snsTelegramChatId가 설정된 인플루언서의 새 트윗은 텔레그램으로 공유
 */

import { getDb } from "./db";
import { snsInfluencers, snsPosts } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";

const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const FETCH_INTERVAL_MS = 60 * 60 * 1000; // 1시간

const LANG_NAMES: Record<string, string> = {
  ko: "Korean", zh: "Chinese (Simplified)", ja: "Japanese", vi: "Vietnamese",
  th: "Thai", id: "Indonesian", ms: "Malay", ru: "Russian",
  ar: "Arabic", es: "Spanish", pt: "Portuguese", fr: "French",
  de: "German", it: "Italian", tr: "Turkish", hi: "Hindi",
  nl: "Dutch", pl: "Polish", uk: "Ukrainian", sv: "Swedish",
  da: "Danish", fi: "Finnish",
};

interface TwitterMedia {
  media_key: string;
  type: "photo" | "video" | "animated_gif";
  url?: string; // photo URL
  preview_image_url?: string; // video thumbnail
}

interface TwitterTweet {
  id: string;
  text: string;
  created_at?: string;
  attachments?: { media_keys?: string[] };
  public_metrics?: {
    like_count: number;
    retweet_count: number;
    reply_count: number;
    quote_count: number;
  };
}

interface TwitterUserResponse {
  data?: { id: string; name: string; username: string };
  errors?: Array<{ message: string }>;
}

interface TwitterTimelineResponse {
  data?: TwitterTweet[];
  includes?: { media?: TwitterMedia[] };
  errors?: Array<{ message: string }>;
}

/**
 * X API v2: 사용자 핸들 → userId 조회
 */
async function fetchTwitterUserId(handle: string): Promise<string | null> {
  if (!TWITTER_BEARER_TOKEN) return null;
  try {
    const res = await fetch(
      `https://api.twitter.com/2/users/by/username/${handle}`,
      { headers: { Authorization: `Bearer ${TWITTER_BEARER_TOKEN}` } }
    );
    if (!res.ok) {
      console.error(`[TwitterFetch] Failed to fetch userId for @${handle}: ${res.status}`);
      return null;
    }
    const json = (await res.json()) as TwitterUserResponse;
    return json.data?.id ?? null;
  } catch (e) {
    console.error(`[TwitterFetch] Error fetching userId for @${handle}:`, e);
    return null;
  }
}

/**
 * X API v2: userId → 최신 트윗 목록 (최대 10개, 미디어 포함)
 */
async function fetchLatestTweets(userId: string): Promise<{ tweets: TwitterTweet[]; mediaMap: Map<string, string> }> {
  if (!TWITTER_BEARER_TOKEN) return { tweets: [], mediaMap: new Map() };
  try {
    const params = new URLSearchParams({
      max_results: "10",
      "tweet.fields": "created_at,public_metrics,attachments",
      "expansions": "attachments.media_keys",
      "media.fields": "url,preview_image_url,type",
      exclude: "retweets,replies",
    });
    const res = await fetch(
      `https://api.twitter.com/2/users/${userId}/tweets?${params}`,
      { headers: { Authorization: `Bearer ${TWITTER_BEARER_TOKEN}` } }
    );
    if (!res.ok) {
      console.error(`[TwitterFetch] Failed to fetch tweets for userId=${userId}: ${res.status}`);
      return { tweets: [], mediaMap: new Map() };
    }
    const json = (await res.json()) as TwitterTimelineResponse;
    
    // 미디어 키 → URL 매핑 생성
    const mediaMap = new Map<string, string>();
    if (json.includes?.media) {
      for (const media of json.includes.media) {
        const url = media.url || media.preview_image_url;
        if (url) mediaMap.set(media.media_key, url);
      }
    }
    
    return { tweets: json.data ?? [], mediaMap };
  } catch (e) {
    console.error(`[TwitterFetch] Error fetching tweets for userId=${userId}:`, e);
    return { tweets: [], mediaMap: new Map() };
  }
}

/**
 * LLM으로 트윗 번역
 */
async function translateTweet(content: string, targetLang: string): Promise<string | null> {
  const langName = LANG_NAMES[targetLang] || "Korean";
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a professional crypto/finance translator. Translate the following tweet to ${langName}. Keep hashtags ($BTC, #Bitcoin), @mentions, URLs, and emojis unchanged. Return ONLY the translated text, no explanation.`,
        },
        { role: "user", content },
      ],
    });
    const translated = (response.choices[0].message.content as string)?.trim();
    return translated || null;
  } catch (e) {
    console.error(`[TwitterFetch] Translation error:`, e);
    return null;
  }
}

/**
 * 텔레그램 채널에 새 트윗 공유
 */
async function sendToTelegram(chatId: string, text: string): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN) return;
  try {
    await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: false,
        }),
      }
    );
  } catch (e) {
    console.error(`[TwitterFetch] Telegram send error to ${chatId}:`, e);
  }
}

/**
 * 단일 인플루언서 트윗 수집 처리
 */
async function fetchForInfluencer(influencer: {
  id: number;
  name: string;
  handle: string;
  twitterUserId: string | null;
  snsTelegramChatId: string | null;
  autoTranslate?: boolean;
  autoTranslateLang?: string | null;
}): Promise<number> {
  let userId = influencer.twitterUserId;

  // userId가 없으면 핸들로 조회 후 저장
  if (!userId) {
    userId = await fetchTwitterUserId(influencer.handle);
    if (!userId) return 0;
    const db2 = await getDb();
    if (!db2) return 0;
    await db2
      .update(snsInfluencers)
      .set({ twitterUserId: userId })
      .where(eq(snsInfluencers.id, influencer.id));
  }

  const { tweets, mediaMap } = await fetchLatestTweets(userId);
  if (!tweets.length) return 0;

  // 기존 tweetId 목록 조회 (중복 방지)
  const db = await getDb();
  if (!db) return 0;
  const existingPosts = await db
    .select({ tweetId: snsPosts.tweetId })
    .from(snsPosts)
    .where(eq(snsPosts.influencerId, influencer.id));
  const existingTweetIds = new Set(existingPosts.map((p: { tweetId: string | null }) => p.tweetId).filter(Boolean));

  const shouldAutoTranslate = influencer.autoTranslate === true;
  const targetLang = influencer.autoTranslateLang || "ko";

  let newCount = 0;
  for (const tweet of tweets) {
    if (existingTweetIds.has(tweet.id)) continue;

    const postedAt = tweet.created_at ? new Date(tweet.created_at) : new Date();
    const tweetUrl = `https://x.com/${influencer.handle}/status/${tweet.id}`;

    // 미디어 URL 수집
    let mediaUrlsJson: string | null = null;
    if (tweet.attachments?.media_keys?.length) {
      const urls = tweet.attachments.media_keys
        .map((key) => mediaMap.get(key))
        .filter(Boolean) as string[];
      if (urls.length) mediaUrlsJson = JSON.stringify(urls);
    }

    // 자동 번역
    let translatedContent: string | null = null;
    let translatedAt: Date | null = null;
    if (shouldAutoTranslate && tweet.text) {
      translatedContent = await translateTweet(tweet.text, targetLang);
      if (translatedContent) translatedAt = new Date();
      // LLM rate limit 방지
      await new Promise((r) => setTimeout(r, 300));
    }

    await db.insert(snsPosts).values({
      influencerId: influencer.id,
      content: tweet.text,
      tweetId: tweet.id,
      tweetUrl,
      likes: tweet.public_metrics?.like_count ?? 0,
      retweets: tweet.public_metrics?.retweet_count ?? 0,
      replies: tweet.public_metrics?.reply_count ?? 0,
      postedAt,
      isActive: true,
      mediaUrls: mediaUrlsJson,
      translatedContent,
      translatedAt,
    });

    // 텔레그램 발송
    if (influencer.snsTelegramChatId) {
      const msg =
        `📱 <b>${influencer.name}</b> (@${influencer.handle})\n\n` +
        `${tweet.text}\n\n` +
        `<a href="${tweetUrl}">🔗 원문 보기</a>`;
      await sendToTelegram(influencer.snsTelegramChatId, msg);
    }

    newCount++;
  }

  // lastFetchedAt 업데이트
  await db
    .update(snsInfluencers)
    .set({ lastFetchedAt: new Date() })
    .where(eq(snsInfluencers.id, influencer.id));

  return newCount;
}

/**
 * 전체 자동수집 실행
 */
async function runFetch(): Promise<void> {
  if (!TWITTER_BEARER_TOKEN) {
    console.log("[TwitterFetch] TWITTER_BEARER_TOKEN not set, skipping");
    return;
  }

  console.log("[TwitterFetch] Starting auto-fetch run...");

  const db = await getDb();
  if (!db) {
    console.log("[TwitterFetch] DB not available, skipping");
    return;
  }

  const tbl = snsInfluencers as any;
  const activeInfluencers = await db
    .select({
      id: snsInfluencers.id,
      name: snsInfluencers.name,
      handle: snsInfluencers.handle,
      twitterUserId: snsInfluencers.twitterUserId,
      snsTelegramChatId: snsInfluencers.snsTelegramChatId,
      autoTranslate: tbl.autoTranslate,
      autoTranslateLang: tbl.autoTranslateLang,
    })
    .from(snsInfluencers)
    .where(
      and(
        eq(snsInfluencers.isActive, true),
        eq(snsInfluencers.autoFetchEnabled, true)
      )
    );

  console.log(`[TwitterFetch] Found ${activeInfluencers.length} influencers with auto-fetch enabled`);

  let totalNew = 0;
  for (const inf of activeInfluencers) {
    const count = await fetchForInfluencer(inf);
    if (count > 0) {
      console.log(`[TwitterFetch] @${inf.handle}: +${count} new tweets`);
      totalNew += count;
    }
    // Rate limit 방지: 인플루언서 간 1초 대기
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(`[TwitterFetch] Run complete. Total new posts: ${totalNew}`);
}

/**
 * 스케줄러 시작 (서버 초기화 시 호출)
 */
export function startTwitterFetchScheduler(): void {
  console.log("[TwitterFetchScheduler] Started - fetching every 1 hour");

  // 서버 시작 후 30초 뒤 첫 실행 (서버 안정화 대기)
  setTimeout(() => {
    runFetch().catch((e) => console.error("[TwitterFetch] Run error:", e));
  }, 30_000);

  // 이후 1시간마다 반복
  setInterval(() => {
    runFetch().catch((e) => console.error("[TwitterFetch] Run error:", e));
  }, FETCH_INTERVAL_MS);
}

export { fetchForInfluencer, fetchLatestTweets, fetchTwitterUserId };
