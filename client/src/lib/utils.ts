import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 1page.to URL을 서브도메인 형식으로 정규화합니다.
 * 예: https://1page.to/nice → https://nice.1page.to
 * 예: https://nice.1page.to → https://nice.1page.to (변경 없음)
 */
export function normalize1pageUrl(url: string): string {
  if (!url) return url;
  // https://1page.to/subdomain 형식 감지
  const match = url.match(/^(https?:\/\/)1page\.to\/([^/?#]+)(.*)?$/);
  if (match) {
    const [, protocol, subdomain, rest] = match;
    return `${protocol}${subdomain}.1page.to${rest ?? ""}`;
  }
  return url;
}
