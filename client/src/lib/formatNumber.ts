/**
 * 언어 코드별 숫자 포맷 유틸리티
 * - formatNumber: 천 단위 구분자 적용 (언어별 로케일)
 * - formatCurrency: 통화 기호 + 천 단위 구분자 (USD 기준, 언어별 표기)
 */

/** 언어 코드 → BCP 47 로케일 매핑 */
const LOCALE_MAP: Record<string, string> = {
  ko: "ko-KR",
  en: "en-US",
  zh: "zh-CN",
  ja: "ja-JP",
  vi: "vi-VN",
  th: "th-TH",
  id: "id-ID",
  ru: "ru-RU",
  ar: "ar-SA",
  es: "es-ES",
  pt: "pt-BR",
  fr: "fr-FR",
  de: "de-DE",
  tr: "tr-TR",
  hi: "hi-IN",
  ms: "ms-MY",
  tl: "tl-PH",
  uk: "uk-UA",
  pl: "pl-PL",
  nl: "nl-NL",
  sv: "sv-SE",
};

function getLocale(lang: string): string {
  return LOCALE_MAP[lang] ?? "en-US";
}

/**
 * 정수/소수 숫자를 현재 언어에 맞는 천 단위 구분자로 포맷
 * @example formatNumber(1234567, "ko") → "1,234,567"
 * @example formatNumber(1234567, "de") → "1.234.567"
 */
export function formatNumber(
  value: number,
  lang: string,
  options?: Intl.NumberFormatOptions
): string {
  const locale = getLocale(lang);
  try {
    return new Intl.NumberFormat(locale, options).format(value);
  } catch {
    return value.toLocaleString();
  }
}

/**
 * USD 통화 포맷 (언어별 기호/위치 자동 적용)
 * @example formatCurrency(1234.5, "ko") → "US$1,234.50"
 * @example formatCurrency(1234.5, "en") → "$1,234.50"
 * @example formatCurrency(1234.5, "de") → "1.234,50 $"
 */
export function formatCurrency(
  value: number,
  lang: string,
  decimals = 2
): string {
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

/**
 * 컴팩트 숫자 포맷 (K, M, B 단위)
 * @example formatCompact(1234567, "en") → "1.2M"
 * @example formatCompact(1234567, "ko") → "123만"
 */
export function formatCompact(value: number, lang: string): string {
  const locale = getLocale(lang);
  try {
    return new Intl.NumberFormat(locale, {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  } catch {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return String(value);
  }
}
