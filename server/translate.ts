import { translate } from "@vitalets/google-translate-api";

// 지원 언어 코드 (영어 제외 20개 언어)
export const SUPPORTED_LANGS = [
  { code: "zh-CN", key: "zh" },
  { code: "ja", key: "ja" },
  { code: "ko", key: "ko" },
  { code: "vi", key: "vi" },
  { code: "th", key: "th" },
  { code: "id", key: "id" },
  { code: "ms", key: "ms" },
  { code: "ru", key: "ru" },
  { code: "ar", key: "ar" },
  { code: "es", key: "es" },
  { code: "pt", key: "pt" },
  { code: "fr", key: "fr" },
  { code: "de", key: "de" },
  { code: "it", key: "it" },
  { code: "tr", key: "tr" },
  { code: "hi", key: "hi" },
  { code: "pl", key: "pl" },
  { code: "nl", key: "nl" },
  { code: "uk", key: "uk" },
  { code: "tl", key: "tl" },
];

/**
 * 단일 텍스트를 여러 언어로 번역
 * @param text 원문 텍스트
 * @returns { zh: "...", ja: "...", ... }
 */
export async function translateToAllLanguages(text: string): Promise<Record<string, string>> {
  const results: Record<string, string> = {};

  // 병렬 번역 (최대 5개씩 배치 처리로 IP 차단 방지)
  const batchSize = 5;
  for (let i = 0; i < SUPPORTED_LANGS.length; i += batchSize) {
    const batch = SUPPORTED_LANGS.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async ({ code, key }) => {
        try {
          const res = await translate(text, { to: code });
          results[key] = res.text;
        } catch (e) {
          console.warn(`[translate] Failed for ${code}:`, e);
          results[key] = text; // 실패 시 원문 유지
        }
      })
    );
    // 배치 간 딜레이 (IP 차단 방지)
    if (i + batchSize < SUPPORTED_LANGS.length) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  return results;
}

/**
 * 제목+내용 쌍을 번역
 */
export async function translateTitleContent(
  title: string,
  content: string
): Promise<{ titles: Record<string, string>; contents: Record<string, string> }> {
  const [titles, contents] = await Promise.all([
    translateToAllLanguages(title),
    translateToAllLanguages(content),
  ]);
  return { titles, contents };
}

/**
 * 질문+답변 쌍을 번역
 */
export async function translateQuestionAnswer(
  question: string,
  answer: string
): Promise<{ questions: Record<string, string>; answers: Record<string, string> }> {
  const [questions, answers] = await Promise.all([
    translateToAllLanguages(question),
    translateToAllLanguages(answer),
  ]);
  return { questions, answers };
}
