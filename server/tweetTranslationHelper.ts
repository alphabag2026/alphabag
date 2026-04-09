/**
 * TweetTranslationHelper
 * - 트윗 텍스트를 대상 언어로 자동 번역
 * - 언어 코드 → 언어명 매핑 (i18n.language 기준)
 * - 번역 결과를 snsPosts.translatedContent에 저장
 */

import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { snsPosts } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * i18n 언어 코드 → 번역 대상 언어명 매핑
 * X 트윗은 주로 영어이므로, 영어 사용자는 원문 유지
 */
export const LANG_CODE_TO_NAME: Record<string, string> = {
  ko: "Korean",
  zh: "Chinese (Simplified)",
  "zh-CN": "Chinese (Simplified)",
  "zh-TW": "Chinese (Traditional)",
  ja: "Japanese",
  vi: "Vietnamese",
  th: "Thai",
  id: "Indonesian",
  ms: "Malay",
  ar: "Arabic",
  ru: "Russian",
  de: "German",
  fr: "French",
  es: "Spanish",
  pt: "Portuguese",
  it: "Italian",
  tr: "Turkish",
  hi: "Hindi",
  bn: "Bengali",
  uk: "Ukrainian",
  pl: "Polish",
  nl: "Dutch",
};

/**
 * 번역이 필요한 언어인지 확인 (영어는 원문 유지)
 */
export function needsTranslation(langCode: string): boolean {
  const base = langCode.split("-")[0].toLowerCase();
  return base !== "en" && LANG_CODE_TO_NAME[langCode] !== undefined || LANG_CODE_TO_NAME[base] !== undefined;
}

/**
 * 언어 코드로 언어명 조회
 */
export function getLangName(langCode: string): string | null {
  if (!langCode) return null;
  const exact = LANG_CODE_TO_NAME[langCode];
  if (exact) return exact;
  const base = langCode.split("-")[0].toLowerCase();
  return LANG_CODE_TO_NAME[base] ?? null;
}

/**
 * 트윗 텍스트를 대상 언어로 번역
 * @param content 원문 트윗 텍스트
 * @param targetLang 대상 언어명 (예: "Korean", "Chinese (Simplified)")
 * @returns 번역된 텍스트 또는 null (실패 시)
 */
export async function translateTweet(content: string, targetLang: string): Promise<string | null> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a professional translator specializing in cryptocurrency, blockchain, finance, and tech news. 
Translate the following tweet/post to ${targetLang}.
Rules:
- Keep $TICKER, #hashtag, @mention, URLs, numbers, and proper nouns as-is
- Maintain the original tone (formal/casual)
- Do NOT add explanations or notes
- Return ONLY the translated text, nothing else`,
        },
        { role: "user", content },
      ],
    });
    const raw = response.choices?.[0]?.message?.content;
    return typeof raw === "string" ? raw.trim() : null;
  } catch (e) {
    console.error("[TweetTranslation] LLM error:", e);
    return null;
  }
}

/**
 * 새로 삽입된 트윗 ID에 대해 자동 번역 실행 후 DB 업데이트
 * - 기본 번역 언어: Korean (서비스 기본 언어)
 * - 영어 트윗만 번역 대상 (이미 한국어인 경우 스킵)
 */
export async function autoTranslatePost(postId: number, content: string): Promise<void> {
  // 기본 번역 대상: Korean (서비스 주 사용자 언어)
  const targetLang = "Korean";

  // 이미 한국어인지 간단 체크 (한글 포함 여부)
  const hasKorean = /[\uAC00-\uD7A3]/.test(content);
  if (hasKorean) return; // 이미 한국어면 스킵

  try {
    const translated = await translateTweet(content, targetLang);
    if (!translated) return;

    const db = await getDb();
    if (!db) return;

    await db.update(snsPosts).set({
      translatedContent: translated,
      translatedAt: new Date(),
    }).where(eq(snsPosts.id, postId));

    console.log(`[TweetTranslation] ✅ Auto-translated post #${postId} to ${targetLang}`);
  } catch (e) {
    console.error(`[TweetTranslation] Failed to auto-translate post #${postId}:`, e);
  }
}
