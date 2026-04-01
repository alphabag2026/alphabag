export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Manus OAuth 제거 - 지갑 연결 모달 이벤트로 교체
// 기존 코드 호환성을 위해 함수 시그니처 유지
export const getLoginUrl = () => {
  // 직접 리다이렉트 대신 지갑 연결 모달 이벤트 발생
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("open-wallet-modal"));
  }
  return "#wallet-connect";
};

// 지갑 연결 모달 열기 (명시적 호출용)
export const openWalletModal = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("open-wallet-modal"));
  }
};
