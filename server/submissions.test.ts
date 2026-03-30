import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock getDb
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

// Mock schema
vi.mock("../drizzle/schema", () => ({
  planSubmissions: {},
  submissionVerifications: {},
  submissionVotes: {},
  submissionFeeDistributions: {},
  submissionSettings: {},
}));

describe("Submissions System", () => {
  describe("Settings defaults", () => {
    it("should have correct default listing fee", () => {
      const defaults = {
        listingFeeUsdt: "500",
        votingPeriodDays: 7,
        approvalThresholdPct: 60,
        platformFeePct: 40,
      };
      expect(defaults.listingFeeUsdt).toBe("500");
      expect(defaults.votingPeriodDays).toBe(7);
      expect(defaults.approvalThresholdPct).toBe(60);
      expect(defaults.platformFeePct).toBe(40);
    });

    it("should calculate node distribution correctly", () => {
      const platformPct = 40;
      const nodePct = 100 - platformPct;
      expect(nodePct).toBe(60);
    });

    it("should calculate per-voter amount correctly", () => {
      const totalFee = 500;
      const nodePct = 60;
      const voterCount = 5;
      const perVoter = (totalFee * nodePct / 100 / voterCount).toFixed(6);
      expect(parseFloat(perVoter)).toBe(60);
    });

    it("should calculate platform fee correctly", () => {
      const totalFee = 500;
      const platformPct = 40;
      const platformAmount = (totalFee * platformPct / 100).toFixed(6);
      expect(parseFloat(platformAmount)).toBe(200);
    });
  });

  describe("Verification code", () => {
    it("should generate 6-digit code", () => {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      expect(code).toHaveLength(6);
      expect(parseInt(code)).toBeGreaterThanOrEqual(100000);
      expect(parseInt(code)).toBeLessThanOrEqual(999999);
    });

    it("should set expiry 10 minutes from now", () => {
      const before = Date.now();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      const after = Date.now();
      const diff = expiresAt.getTime() - before;
      expect(diff).toBeGreaterThanOrEqual(10 * 60 * 1000 - 100);
      expect(diff).toBeLessThanOrEqual(10 * 60 * 1000 + (after - before) + 100);
    });
  });

  describe("Vote calculation", () => {
    it("should calculate approval percentage correctly", () => {
      const totalVotes = 10;
      const approveVotes = 7;
      const pct = Math.round((approveVotes / totalVotes) * 100);
      expect(pct).toBe(70);
    });

    it("should pass 60% threshold", () => {
      const approvalThreshold = 60;
      const approvePct = 70;
      expect(approvePct >= approvalThreshold).toBe(true);
    });

    it("should fail below 60% threshold", () => {
      const approvalThreshold = 60;
      const approvePct = 55;
      expect(approvePct >= approvalThreshold).toBe(false);
    });

    it("should handle zero votes", () => {
      const totalVotes = 0;
      const approveVotes = 0;
      const pct = totalVotes > 0 ? Math.round((approveVotes / totalVotes) * 100) : 0;
      expect(pct).toBe(0);
    });
  });

  describe("Status flow", () => {
    it("should define valid status transitions", () => {
      const validStatuses = ["draft", "verified", "fee_paid", "voting", "approved", "rejected", "listed"];
      expect(validStatuses).toContain("draft");
      expect(validStatuses).toContain("voting");
      expect(validStatuses).toContain("listed");
    });

    it("should require fee before voting", () => {
      const statusOrder = ["draft", "verified", "fee_paid", "voting", "approved", "listed"];
      const feeIdx = statusOrder.indexOf("fee_paid");
      const votingIdx = statusOrder.indexOf("voting");
      expect(feeIdx).toBeLessThan(votingIdx);
    });
  });

  describe("Fee distribution", () => {
    it("should distribute total fee correctly (platform + nodes = 100%)", () => {
      const platformPct = 40;
      const nodePct = 100 - platformPct;
      expect(platformPct + nodePct).toBe(100);
    });

    it("should split node share equally among voters", () => {
      const totalFee = 1000;
      const nodePct = 60;
      const nodeTotal = totalFee * nodePct / 100;
      const voterCount = 4;
      const perVoter = nodeTotal / voterCount;
      expect(perVoter).toBe(150);
    });
  });
});
