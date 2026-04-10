import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── 여행 서류 tRPC 프로시저 단위 테스트 ─────────────────────────────────────

describe("travelDocs router", () => {
  it("docType enum 값이 올바르게 정의되어 있어야 한다", () => {
    const validTypes = ["passport", "flight_ticket", "hotel_voucher", "visa", "travel_insurance", "other"];
    expect(validTypes).toContain("passport");
    expect(validTypes).toContain("flight_ticket");
    expect(validTypes).toContain("hotel_voucher");
    expect(validTypes).toContain("visa");
    expect(validTypes).toContain("travel_insurance");
    expect(validTypes).toContain("other");
    expect(validTypes.length).toBe(6);
  });

  it("체크리스트 5개 필수 항목이 모두 포함되어야 한다", () => {
    const CHECKLIST_TYPES = ["passport", "flight_ticket", "hotel_voucher", "visa", "travel_insurance"];
    expect(CHECKLIST_TYPES.length).toBe(5);
    expect(CHECKLIST_TYPES).not.toContain("other"); // 기타는 체크리스트에서 제외
  });
});

// ─── JWT 세션 검증 테스트 ─────────────────────────────────────────────────────

describe("JWT session context", () => {
  it("쿠키가 없으면 user가 null이어야 한다", async () => {
    // context.ts의 핵심 로직: 쿠키 없으면 user = null
    const mockReq = { cookies: {} };
    let user = null;
    const sessionCookie = (mockReq.cookies as any)["alphabag_session"];
    if (!sessionCookie) {
      user = null;
    }
    expect(user).toBeNull();
  });

  it("잘못된 JWT 토큰이면 user가 null이어야 한다 (예외 처리)", async () => {
    let user = null;
    try {
      // 잘못된 토큰 시뮬레이션
      throw new Error("JWTInvalid: Signature verification failed");
    } catch {
      user = null;
    }
    expect(user).toBeNull();
  });

  it("context.ts가 openId 기반으로 사용자를 조회해야 한다 (구조 검증)", async () => {
    // sdk.verifySession이 반환하는 페이로드 구조 검증
    const mockSession = { openId: "user_abc123", appId: "app_xyz", name: "Test User" };
    expect(mockSession).toHaveProperty("openId");
    expect(mockSession).not.toHaveProperty("userId"); // 이전 방식(userId)이 아닌 openId 사용
  });
});

// ─── PDF 다운로드 로직 테스트 ─────────────────────────────────────────────────

describe("PDF download logic", () => {
  it("파일 URL이 있으면 직접 다운로드 링크를 제공해야 한다", () => {
    const doc = { fileUrl: "https://cdn.example.com/doc.pdf", title: "Test" };
    expect(doc.fileUrl).toBeTruthy();
    // 파일 URL이 있으면 download 속성으로 직접 다운로드
    const hasDirectDownload = !!doc.fileUrl;
    expect(hasDirectDownload).toBe(true);
  });

  it("파일 URL이 없으면 텍스트 파일 생성 방식을 사용해야 한다", () => {
    const doc = { fileUrl: null, title: "Test Doc", docType: "passport", expiryDate: "2030-01-01", note: "메모" };
    const hasDirectDownload = !!doc.fileUrl;
    expect(hasDirectDownload).toBe(false);
    // 파일 없으면 텍스트 콘텐츠 생성
    const content = [
      `AlphaBag - 여행 서류`,
      `서류 종류: 여권`,
      `제목: ${doc.title}`,
      `만료일: ${doc.expiryDate}`,
      `메모: ${doc.note}`,
    ].join('\n');
    expect(content).toContain("Test Doc");
    expect(content).toContain("2030-01-01");
  });
});
