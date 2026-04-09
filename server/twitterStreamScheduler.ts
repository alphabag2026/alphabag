/**
 * TwitterStreamScheduler
 * - X API v2 Filtered Stream을 사용하여 핵심 KOL의 트윗을 실시간(~6초 이내) 수신
 * - 새 트윗 수신 시 DB 저장 + 텔레그램 알림 발송
 * - 서버 시작 시 자동 연결, 연결 끊김 시 지수 백오프로 재연결
 * - alertOnNewPost=true 인 인플루언서만 스트림 필터에 등록
 */

import { getDb } from "./db";
import { snsInfluencers, snsPosts } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { autoTranslatePost } from "./tweetTranslationHelper";

const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_ALERT_CHAT_ID = process.env.TELEGRAM_ALERT_CHAT_ID || process.env.TELEGRAM_CHAT_ID;

const STREAM_URL = "https://api.twitter.com/2/tweets/search/stream";
const RULES_URL = "https://api.twitter.com/2/tweets/search/stream/rules";

interface StreamRule {
  id?: string;
  value: string;
  tag?: string;
}

interface StreamRulesResponse {
  data?: StreamRule[];
  errors?: Array<{ message: string }>;
}

interface StreamMedia {
  media_key: string;
  type: "photo" | "video" | "animated_gif";
  url?: string;
  preview_image_url?: string;
}

interface StreamTweet {
  data: {
    id: string;
    text: string;
    author_id?: string;
    created_at?: string;
    attachments?: {
      media_keys?: string[];
    };
  };
  matching_rules?: Array<{ id: string; tag?: string }>;
  includes?: {
    users?: Array<{ id: string; name: string; username: string }>;
    media?: StreamMedia[];
  };
}

let streamController: AbortController | null = null;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let reconnectDelay = 5000; // 초기 재연결 대기 5초
const MAX_RECONNECT_DELAY = 5 * 60 * 1000; // 최대 5분

/**
 * 텔레그램 알림 발송
 */
async function sendTelegramAlert(chatId: string, message: string): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN || !chatId) return;
  try {
    await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
          disable_web_page_preview: false,
        }),
      }
    );
  } catch (e) {
    console.error("[TwitterStream] Telegram send error:", e);
  }
}

/**
 * 현재 스트림 필터 룰 조회
 */
async function getStreamRules(): Promise<StreamRule[]> {
  if (!TWITTER_BEARER_TOKEN) return [];
  try {
    const res = await fetch(RULES_URL, {
      headers: { Authorization: `Bearer ${TWITTER_BEARER_TOKEN}` },
    });
    if (!res.ok) {
      console.error(`[TwitterStream] Failed to get rules: ${res.status}`);
      return [];
    }
    const json = (await res.json()) as StreamRulesResponse;
    return json.data ?? [];
  } catch (e) {
    console.error("[TwitterStream] Error getting rules:", e);
    return [];
  }
}

/**
 * 기존 스트림 필터 룰 전체 삭제
 */
async function deleteAllStreamRules(rules: StreamRule[]): Promise<void> {
  if (!TWITTER_BEARER_TOKEN || !rules.length) return;
  const ids = rules.map((r) => r.id).filter(Boolean) as string[];
  if (!ids.length) return;
  try {
    const res = await fetch(RULES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TWITTER_BEARER_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ delete: { ids } }),
    });
    if (!res.ok) {
      console.error(`[TwitterStream] Failed to delete rules: ${res.status}`);
    } else {
      console.log(`[TwitterStream] Deleted ${ids.length} existing rules`);
    }
  } catch (e) {
    console.error("[TwitterStream] Error deleting rules:", e);
  }
}

/**
 * 스트림 필터 룰 추가
 * X API Basic 플랜: 최대 25개 룰, 각 룰 512자 제한
 */
async function addStreamRules(rules: Array<{ value: string; tag: string }>): Promise<void> {
  if (!TWITTER_BEARER_TOKEN || !rules.length) return;
  try {
    const res = await fetch(RULES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TWITTER_BEARER_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ add: rules }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`[TwitterStream] Failed to add rules: ${res.status} - ${text}`);
    } else {
      const json = await res.json() as { data?: StreamRule[] };
      console.log(`[TwitterStream] Added ${json.data?.length ?? 0} stream rules`);
    }
  } catch (e) {
    console.error("[TwitterStream] Error adding rules:", e);
  }
}

/**
 * alertOnNewPost=true 인플루언서 목록 조회 후 스트림 룰 설정
 */
async function setupStreamRules(): Promise<Map<string, { id: number; name: string; handle: string; snsTelegramChatId: string | null }>> {
  const db = await getDb();
  const influencerMap = new Map<string, { id: number; name: string; handle: string; snsTelegramChatId: string | null }>();

  if (!db) return influencerMap;

  const alertInfluencers = await db
    .select({
      id: snsInfluencers.id,
      name: snsInfluencers.name,
      handle: snsInfluencers.handle,
      snsTelegramChatId: snsInfluencers.snsTelegramChatId,
    })
    .from(snsInfluencers)
    .where(
      and(
        eq(snsInfluencers.isActive, true),
        eq(snsInfluencers.alertOnNewPost, true)
      )
    );

  if (!alertInfluencers.length) {
    console.log("[TwitterStream] No influencers with alertOnNewPost=true");
    return influencerMap;
  }

  console.log(`[TwitterStream] Setting up stream rules for ${alertInfluencers.length} influencers`);

  // 기존 룰 삭제
  const existingRules = await getStreamRules();
  if (existingRules.length > 0) {
    await deleteAllStreamRules(existingRules);
  }

  // 새 룰 추가 (X API Basic: 최대 25개)
  // 여러 핸들을 하나의 룰로 묶어서 효율화
  const handles = alertInfluencers.map((inf) => inf.handle);
  
  // 핸들 맵 구성 (handle → influencer info)
  for (const inf of alertInfluencers) {
    influencerMap.set(inf.handle.toLowerCase(), inf);
  }

  // 룰 생성: 최대 25개 핸들을 OR로 묶기
  // 각 룰은 512자 제한이므로 여러 룰로 분할
  const RULE_SIZE = 10; // 룰당 핸들 수
  const newRules: Array<{ value: string; tag: string }> = [];
  
  for (let i = 0; i < handles.length; i += RULE_SIZE) {
    const batch = handles.slice(i, i + RULE_SIZE);
    const value = batch.map((h) => `from:${h}`).join(" OR ");
    newRules.push({
      value,
      tag: `kol_alert_batch_${Math.floor(i / RULE_SIZE) + 1}`,
    });
  }

  await addStreamRules(newRules);
  return influencerMap;
}

/**
 * 새 트윗 처리: DB 저장 + 텔레그램 알림
 */
async function processTweet(
  tweet: StreamTweet,
  influencerMap: Map<string, { id: number; name: string; handle: string; snsTelegramChatId: string | null }>
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // matching_rules의 tag에서 핸들 추출 또는 includes.users에서 조회
  const authorUser = tweet.includes?.users?.[0];
  if (!authorUser) return;

  const handle = authorUser.username.toLowerCase();
  const influencer = influencerMap.get(handle);
  if (!influencer) return;

  const tweetId = tweet.data.id;
  const tweetUrl = `https://x.com/${authorUser.username}/status/${tweetId}`;
  const content = tweet.data.text;
  const postedAt = tweet.data.created_at ? new Date(tweet.data.created_at) : new Date();

  // 중복 체크
  const existing = await db
    .select({ id: snsPosts.id })
    .from(snsPosts)
    .where(eq(snsPosts.tweetId, tweetId))
    .limit(1);

  if (existing.length > 0) return;

  // 미디어 URL 수집
  const mediaUrls: string[] = [];
  if (tweet.data.attachments?.media_keys && tweet.includes?.media) {
    const mediaMap = new Map<string, string>();
    for (const media of tweet.includes.media) {
      const url = media.url || media.preview_image_url;
      if (url) mediaMap.set(media.media_key, url);
    }
    for (const key of tweet.data.attachments.media_keys) {
      const url = mediaMap.get(key);
      if (url) mediaUrls.push(url);
    }
  }

  // DB 저장
  const inserted = await db.insert(snsPosts).values({
    influencerId: influencer.id,
    content,
    tweetId,
    tweetUrl,
    likes: 0,
    retweets: 0,
    replies: 0,
    mediaUrls: mediaUrls.length > 0 ? mediaUrls : null,
    postedAt,
    isActive: true,
  });

  // 자동 번역 (비동기)
  const insertId = (inserted as any).insertId ?? (inserted as any)[0]?.insertId;
  if (insertId) {
    autoTranslatePost(insertId, content).catch((e) =>
      console.error(`[TwitterStream] Auto-translate error for post #${insertId}:`, e)
    );
  }

  console.log(`[TwitterStream] 🔴 LIVE: @${authorUser.username}: ${content.substring(0, 80)}...`);

  // 텔레그램 알림 발송
  const alertMsg =
    `🚨 <b>실시간 알림</b>\n` +
    `📱 <b>${influencer.name}</b> (@${authorUser.username})\n\n` +
    `${content}\n\n` +
    `<a href="${tweetUrl}">🔗 원문 보기</a>`;

  // 인플루언서별 채널 알림
  if (influencer.snsTelegramChatId) {
    await sendTelegramAlert(influencer.snsTelegramChatId, alertMsg);
  }

  // 전체 알림 채널 (TELEGRAM_ALERT_CHAT_ID)
  if (TELEGRAM_ALERT_CHAT_ID && TELEGRAM_ALERT_CHAT_ID !== influencer.snsTelegramChatId) {
    await sendTelegramAlert(TELEGRAM_ALERT_CHAT_ID, alertMsg);
  }
}

/**
 * Filtered Stream 연결 및 수신
 */
async function connectStream(
  influencerMap: Map<string, { id: number; name: string; handle: string; snsTelegramChatId: string | null }>
): Promise<void> {
  if (!TWITTER_BEARER_TOKEN) {
    console.log("[TwitterStream] TWITTER_BEARER_TOKEN not set, stream disabled");
    return;
  }

  if (influencerMap.size === 0) {
    console.log("[TwitterStream] No alert influencers configured, stream not started");
    return;
  }

  streamController = new AbortController();
  const { signal } = streamController;

  const params = new URLSearchParams({
    "tweet.fields": "created_at,author_id,attachments",
    "user.fields": "username,name",
    "media.fields": "url,preview_image_url,type",
    expansions: "author_id,attachments.media_keys",
  });

  console.log(`[TwitterStream] Connecting to filtered stream...`);

  try {
    const res = await fetch(`${STREAM_URL}?${params}`, {
      headers: { Authorization: `Bearer ${TWITTER_BEARER_TOKEN}` },
      signal,
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[TwitterStream] Stream connection failed: ${res.status} - ${text}`);
      scheduleReconnect(influencerMap);
      return;
    }

    console.log("[TwitterStream] ✅ Connected to filtered stream");
    reconnectDelay = 5000; // 성공 시 재연결 딜레이 리셋

    const reader = res.body?.getReader();
    if (!reader) {
      console.error("[TwitterStream] No response body reader");
      scheduleReconnect(influencerMap);
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log("[TwitterStream] Stream ended");
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue; // heartbeat (빈 줄)

        try {
          const tweet = JSON.parse(trimmed) as StreamTweet;
          if (tweet.data) {
            await processTweet(tweet, influencerMap);
          }
        } catch {
          // JSON 파싱 오류 무시 (부분 데이터)
        }
      }
    }
  } catch (e: unknown) {
    if (e instanceof Error && e.name === "AbortError") {
      console.log("[TwitterStream] Stream aborted (intentional)");
      return;
    }
    console.error("[TwitterStream] Stream error:", e);
  }

  scheduleReconnect(influencerMap);
}

/**
 * 지수 백오프 재연결 스케줄링
 */
function scheduleReconnect(
  influencerMap: Map<string, { id: number; name: string; handle: string; snsTelegramChatId: string | null }>
): void {
  if (reconnectTimeout) clearTimeout(reconnectTimeout);

  console.log(`[TwitterStream] Reconnecting in ${reconnectDelay / 1000}s...`);
  reconnectTimeout = setTimeout(() => {
    reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY);
    connectStream(influencerMap).catch((e) =>
      console.error("[TwitterStream] Reconnect error:", e)
    );
  }, reconnectDelay);
}

/**
 * 스트림 중지
 */
export function stopTwitterStream(): void {
  if (streamController) {
    streamController.abort();
    streamController = null;
  }
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  console.log("[TwitterStream] Stream stopped");
}

/**
 * 스트림 스케줄러 시작 (서버 초기화 시 호출)
 */
export async function startTwitterStreamScheduler(): Promise<void> {
  if (!TWITTER_BEARER_TOKEN) {
    console.log("[TwitterStream] TWITTER_BEARER_TOKEN not set, stream scheduler disabled");
    return;
  }

  console.log("[TwitterStream] Initializing filtered stream scheduler...");

  // 서버 안정화 후 60초 뒤 시작 (TwitterFetchScheduler와 겹치지 않게)
  setTimeout(async () => {
    try {
      const influencerMap = await setupStreamRules();
      if (influencerMap.size > 0) {
        console.log(`[TwitterStream] Starting stream for ${influencerMap.size} alert influencers`);
        await connectStream(influencerMap);
      }
    } catch (e) {
      console.error("[TwitterStream] Init error:", e);
    }
  }, 60_000);

  // 6시간마다 룰 재설정 (새로 추가된 인플루언서 반영)
  setInterval(async () => {
    console.log("[TwitterStream] Refreshing stream rules...");
    stopTwitterStream();
    await new Promise((r) => setTimeout(r, 2000));
    try {
      const influencerMap = await setupStreamRules();
      if (influencerMap.size > 0) {
        await connectStream(influencerMap);
      }
    } catch (e) {
      console.error("[TwitterStream] Rule refresh error:", e);
    }
  }, 6 * 60 * 60 * 1000);
}
