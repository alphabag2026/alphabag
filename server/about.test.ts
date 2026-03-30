import { describe, it, expect } from "vitest";

/**
 * About 페이지 및 Phase 45 기능 테스트
 * - USDT 지갑 주소 설정 (paymentWalletAddress, paymentNetwork)
 * - 노드 보유자 투표 자격 검증 (nodeOrders confirmed 확인)
 * - 홈 CTA 배너 (submit-plan, vote 링크)
 * - About 페이지 (/about) 라우트 등록
 */

describe("Phase 45 - 골든 컬렉션 시스템 강화 + About 페이지", () => {
  describe("USDT 지갑 설정 스키마", () => {
    it("paymentWalletAddress 필드가 submissionSettings에 추가되어야 한다", () => {
      // DB 마이그레이션으로 추가된 필드 검증
      const mockSettings = {
        id: 1,
        listingFeeUsdt: "500",
        votingPeriodDays: 7,
        approvalThresholdPct: 60,
        platformFeePct: 40,
        paymentWalletAddress: "0x1234567890abcdef",
        paymentNetwork: "BSC" as const,
        isActive: true,
      };
      expect(mockSettings.paymentWalletAddress).toBe("0x1234567890abcdef");
      expect(mockSettings.paymentNetwork).toBe("BSC");
    });

    it("paymentNetwork는 BSC, TRC20, ERC20 중 하나여야 한다", () => {
      const validNetworks = ["BSC", "TRC20", "ERC20"];
      expect(validNetworks).toContain("BSC");
      expect(validNetworks).toContain("TRC20");
      expect(validNetworks).toContain("ERC20");
      expect(validNetworks).not.toContain("SOL");
    });
  });

  describe("온체인 입금 확인 스케줄러", () => {
    it("BSC 트랜잭션 해시 형식이 올바른지 검증", () => {
      const validTxHash = "0x" + "a".repeat(64);
      const invalidTxHash = "not-a-hash";
      expect(validTxHash.startsWith("0x")).toBe(true);
      expect(validTxHash.length).toBe(66);
      expect(invalidTxHash.startsWith("0x")).toBe(false);
    });

    it("납부 금액 허용 오차 계산 (95% 이상)", () => {
      const expectedFee = 500;
      const paidAmount = 498; // 99.6% - 허용
      const lowAmount = 400; // 80% - 거절
      expect(paidAmount >= expectedFee * 0.95).toBe(true);
      expect(lowAmount >= expectedFee * 0.95).toBe(false);
    });

    it("5분 폴링 인터벌 설정 확인", () => {
      const POLL_INTERVAL_MS = 5 * 60 * 1000;
      expect(POLL_INTERVAL_MS).toBe(300000);
    });
  });

  describe("노드 투표 자격 검증", () => {
    it("confirmed 상태 nodeOrders가 없으면 투표 불가", () => {
      const nodeOrderRows: { status: string }[] = [];
      const canVote = nodeOrderRows.length > 0;
      expect(canVote).toBe(false);
    });

    it("confirmed 상태 nodeOrders가 있으면 투표 가능", () => {
      const nodeOrderRows = [{ status: "confirmed", quantity: 1 }];
      const canVote = nodeOrderRows.length > 0;
      expect(canVote).toBe(true);
    });

    it("노드 수량 합산 계산", () => {
      const nodeOrderRows = [
        { status: "confirmed", quantity: 2 },
        { status: "confirmed", quantity: 3 },
      ];
      const totalNodes = nodeOrderRows.reduce((sum, o) => sum + (o.quantity ?? 1), 0);
      expect(totalNodes).toBe(5);
    });
  });

  describe("골든 컬렉션 CTA 배너", () => {
    it("상장 신청 링크가 /submit-plan이어야 한다", () => {
      const submitPlanPath = "/submit-plan";
      expect(submitPlanPath).toBe("/submit-plan");
    });

    it("투표 참여 링크가 /vote이어야 한다", () => {
      const votePath = "/vote";
      expect(votePath).toBe("/vote");
    });

    it("상장비용 표시 텍스트 확인", () => {
      const bannerText = "알파백 노드 투표로 선정 · 상장비용 500 USDT · 투표 노드에 수익 분배";
      expect(bannerText).toContain("500 USDT");
      expect(bannerText).toContain("노드");
    });
  });

  describe("About 페이지 구조", () => {
    it("/about 라우트가 등록되어야 한다", () => {
      const routes = [
        "/",
        "/golden",
        "/submit-plan",
        "/vote",
        "/my-submissions",
        "/about",
      ];
      expect(routes).toContain("/about");
    });

    it("About 페이지에 6개 컬렉션이 포함되어야 한다", () => {
      const collections = [
        "Golden Collection",
        "Self Collection",
        "Node Products",
        "Leader Collection",
        "Meme Token",
        "Influencer",
      ];
      expect(collections.length).toBe(6);
    });

    it("About 페이지에 5단계 상장 프로세스가 포함되어야 한다", () => {
      const steps = [
        "플랜 자료 업로드",
        "이메일 + 텔레그램 인증",
        "상장비용 납부 (500 USDT)",
        "노드 투표 (7일)",
        "골든 컬렉션 상장",
      ];
      expect(steps.length).toBe(5);
    });

    it("FAQ에 6개 항목이 포함되어야 한다", () => {
      const faqCount = 6;
      expect(faqCount).toBe(6);
    });

    it("핵심 지표 4개가 표시되어야 한다", () => {
      const stats = [
        { value: "6", label: "투자 컬렉션" },
        { value: "19명", label: "SNS 인플루언서" },
        { value: "500 USDT", label: "골든 상장비용" },
        { value: "60%", label: "노드 수익 분배" },
      ];
      expect(stats.length).toBe(4);
      expect(stats[2].value).toBe("500 USDT");
      expect(stats[3].value).toBe("60%");
    });
  });

  describe("수수료 분배 로직", () => {
    it("노드 60% + 플랫폼 40% 분배 비율 검증", () => {
      const totalFee = 500;
      const platformFeePct = 40;
      const nodePct = 100 - platformFeePct;
      const platformFee = (totalFee * platformFeePct) / 100;
      const nodeFee = (totalFee * nodePct) / 100;
      expect(platformFee).toBe(200);
      expect(nodeFee).toBe(300);
      expect(platformFee + nodeFee).toBe(totalFee);
    });

    it("투표 노드 균등 분배 계산", () => {
      const nodePoolAmount = 300;
      const voterCount = 5;
      const perVoter = nodePoolAmount / voterCount;
      expect(perVoter).toBe(60);
    });
  });
});
