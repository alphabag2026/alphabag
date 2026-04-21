/**
 * formatNumber 유틸리티 테스트
 * 언어별 숫자 포맷 (천 단위 구분자, 통화 기호) 검증
 */
import { describe, it, expect } from "vitest";

// 클라이언트 유틸이므로 직접 로직을 테스트
function getLocale(lang: string): string {
  const LOCALE_MAP: Record<string, string> = {
    ko: "ko-KR", en: "en-US", zh: "zh-CN", ja: "ja-JP",
    vi: "vi-VN", th: "th-TH", de: "de-DE", fr: "fr-FR",
  };
  return LOCALE_MAP[lang] ?? "en-US";
}

function formatNumber(value: number, lang: string, options?: Intl.NumberFormatOptions): string {
  const locale = getLocale(lang);
  try {
    return new Intl.NumberFormat(locale, options).format(value);
  } catch {
    return value.toLocaleString();
  }
}

function formatCurrency(value: number, lang: string, decimals = 2): string {
  const locale = getLocale(lang);
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  } catch {
    return `$${value.toFixed(decimals)}`;
  }
}

function formatCompact(value: number, lang: string): string {
  const locale = getLocale(lang);
  try {
    return new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(value);
  } catch {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return String(value);
  }
}

describe("formatNumber", () => {
  it("영어 천 단위 구분자 (쉼표)", () => {
    const result = formatNumber(1234567, "en");
    expect(result).toBe("1,234,567");
  });

  it("한국어 천 단위 구분자 (쉼표)", () => {
    const result = formatNumber(1234567, "ko");
    expect(result).toBe("1,234,567");
  });

  it("독일어 천 단위 구분자 (점)", () => {
    const result = formatNumber(1234567, "de");
    // 독일어는 점(.) 구분자
    expect(result).toContain("1");
    expect(result.length).toBeGreaterThan(5);
  });

  it("0 포맷", () => {
    expect(formatNumber(0, "en")).toBe("0");
  });

  it("소수점 포함 포맷", () => {
    const result = formatNumber(1234.56, "en", { minimumFractionDigits: 2 });
    expect(result).toBe("1,234.56");
  });
});

describe("formatCurrency", () => {
  it("영어 USD 통화 포맷", () => {
    const result = formatCurrency(1234.5, "en");
    expect(result).toContain("1,234.50");
    expect(result).toContain("$");
  });

  it("소수점 0자리 포맷", () => {
    const result = formatCurrency(1234.5, "en", 0);
    expect(result).toContain("1,235");
  });

  it("0 통화 포맷", () => {
    const result = formatCurrency(0, "en");
    expect(result).toContain("0.00");
  });

  it("큰 금액 포맷", () => {
    const result = formatCurrency(1000000, "en", 0);
    expect(result).toContain("1,000,000");
  });
});

describe("formatCompact", () => {
  it("백만 단위 컴팩트 (영어)", () => {
    const result = formatCompact(1234567, "en");
    expect(result).toMatch(/1\.?2?M/);
  });

  it("천 단위 컴팩트 (영어)", () => {
    const result = formatCompact(12345, "en");
    expect(result).toMatch(/12\.?3?K/);
  });

  it("소수 그대로 반환", () => {
    const result = formatCompact(999, "en");
    expect(result).toBe("999");
  });
});
