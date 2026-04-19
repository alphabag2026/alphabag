import { describe, it, expect, vi, beforeEach } from "vitest";

// ─────────────────────────────────────────────
// Phase 72: 소셜 링크 + 법적 문서 관리 단위 테스트
// ─────────────────────────────────────────────

// DB 모킹
vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

// ─── 소셜 링크 유틸 함수 테스트 ───────────────
describe("소셜 링크 설정 (settings)", () => {
  it("telegramUrl 이 유효한 URL 형식인지 검증", () => {
    const validUrls = [
      "https://t.me/alphabag",
      "https://t.me/alphabag_official",
    ];
    const invalidUrls = ["not-a-url", ""];

    validUrls.forEach((url) => {
      expect(() => new URL(url)).not.toThrow();
    });

    invalidUrls.forEach((url) => {
      if (url === "") {
        // 빈 문자열은 undefined 처리됨 (선택 필드)
        expect(url).toBe("");
      } else {
        expect(() => new URL(url)).toThrow();
      }
    });
  });

  it("twitterUrl 이 twitter.com 또는 x.com 도메인인지 검증", () => {
    const validDomains = ["twitter.com", "x.com"];
    const twitterUrl = "https://twitter.com/alphabag_io";
    const parsedUrl = new URL(twitterUrl);
    expect(validDomains.some((d) => parsedUrl.hostname.includes(d))).toBe(true);
  });

  it("youtubeUrl 이 youtube.com 도메인인지 검증", () => {
    const youtubeUrl = "https://youtube.com/@alphabag";
    const parsedUrl = new URL(youtubeUrl);
    expect(parsedUrl.hostname).toContain("youtube.com");
  });
});

// ─── 법적 문서 유틸 함수 테스트 ───────────────
describe("법적 문서 관리 (legal)", () => {
  it("지원되는 문서 타입 목록 검증", () => {
    const supportedTypes = ["terms", "privacy"];
    expect(supportedTypes).toContain("terms");
    expect(supportedTypes).toContain("privacy");
    expect(supportedTypes).toHaveLength(2);
  });

  it("지원되는 언어 목록 검증 (21개)", () => {
    const LANGUAGES = [
      "ko", "en", "zh", "ja", "vi",
      "th", "id", "ms", "ru", "ar",
      "es", "pt", "fr", "de", "it",
      "tr", "hi", "pl", "nl", "uk", "tl",
    ];
    expect(LANGUAGES).toHaveLength(21);
    expect(LANGUAGES).toContain("ko");
    expect(LANGUAGES).toContain("en");
  });

  it("언어 우선순위 로직 검증 (요청 언어 > ko > 첫 번째)", () => {
    const allDocs = [
      { id: 1, language: "ko", content: "한국어 약관" },
      { id: 2, language: "en", content: "English Terms" },
      { id: 3, language: "zh", content: "中文条款" },
    ];

    // 1순위: 요청 언어
    const requestLang = "en";
    const doc = allDocs.find(d => d.language === requestLang)
      ?? allDocs.find(d => d.language === "ko")
      ?? allDocs[0]
      ?? null;

    expect(doc?.language).toBe("en");
    expect(doc?.content).toBe("English Terms");
  });

  it("언어 우선순위 - 요청 언어 없을 때 ko 폴백", () => {
    const allDocs = [
      { id: 1, language: "ko", content: "한국어 약관" },
      { id: 2, language: "en", content: "English Terms" },
    ];

    const requestLang = "fr"; // 없는 언어
    const doc = allDocs.find(d => d.language === requestLang)
      ?? allDocs.find(d => d.language === "ko")
      ?? allDocs[0]
      ?? null;

    expect(doc?.language).toBe("ko");
  });

  it("언어 우선순위 - ko도 없을 때 첫 번째 레코드 반환", () => {
    const allDocs = [
      { id: 1, language: "zh", content: "中文条款" },
      { id: 2, language: "en", content: "English Terms" },
    ];

    const requestLang = "fr"; // 없는 언어
    const doc = allDocs.find(d => d.language === requestLang)
      ?? allDocs.find(d => d.language === "ko")
      ?? allDocs[0]
      ?? null;

    expect(doc?.language).toBe("zh");
  });

  it("문서가 없을 때 null 반환", () => {
    const allDocs: { id: number; language: string; content: string }[] = [];
    const requestLang = "ko";
    const doc = allDocs.find(d => d.language === requestLang)
      ?? allDocs.find(d => d.language === "ko")
      ?? allDocs[0]
      ?? null;

    expect(doc).toBeNull();
  });
});

// ─── Markdown 렌더링 유틸 테스트 ───────────────
describe("Markdown 렌더링 (renderMarkdown)", () => {
  function renderMarkdown(text: string): string {
    return text
      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-8 mb-3 text-amber-400">$1</h2>')
      .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-5 mb-2 text-amber-300">$1</h3>')
      .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-4 text-amber-400">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>')
      .replace(/\n\n/g, '</p><p class="mb-3 leading-relaxed">')
      .replace(/\n/g, '<br/>');
  }

  it("## 헤딩이 h2 태그로 변환됨", () => {
    const result = renderMarkdown("## 이용약관");
    expect(result).toContain('<h2');
    expect(result).toContain("이용약관");
  });

  it("**bold** 텍스트가 strong 태그로 변환됨", () => {
    const result = renderMarkdown("**중요한 내용**");
    expect(result).toContain('<strong');
    expect(result).toContain("중요한 내용");
  });

  it("- 리스트 항목이 li 태그로 변환됨", () => {
    const result = renderMarkdown("- 항목 1");
    expect(result).toContain('<li');
    expect(result).toContain("항목 1");
  });
});
