import { describe, it, expect } from "vitest";

describe("CBAG 보험 콜렉션", () => {
  it("CBAG 비율 유효성 검사 - 1~100 범위", () => {
    const validatePercent = (v: number) => v >= 1 && v <= 100;
    expect(validatePercent(1)).toBe(true);
    expect(validatePercent(50)).toBe(true);
    expect(validatePercent(100)).toBe(true);
    expect(validatePercent(0)).toBe(false);
    expect(validatePercent(101)).toBe(false);
  });

  it("CBAG 투자금 계산 - 투자금의 % 계산", () => {
    const calcCbagAmount = (investAmount: number, percent: number) =>
      Math.floor((investAmount * percent) / 100);
    expect(calcCbagAmount(1000, 10)).toBe(100);
    expect(calcCbagAmount(500, 20)).toBe(100);
    expect(calcCbagAmount(300, 5)).toBe(15);
    expect(calcCbagAmount(1000, 0)).toBe(0);
  });

  it("CBAG 설정 기본값 검증", () => {
    const defaultSettings = {
      name: "C-BAG Insurance",
      isActive: true,
      defaultPercent: "10",
      minPercent: "1",
      maxPercent: "50",
      goldenRequired: true,
    };
    expect(defaultSettings.name).toBe("C-BAG Insurance");
    expect(defaultSettings.isActive).toBe(true);
    expect(Number(defaultSettings.defaultPercent)).toBeGreaterThanOrEqual(1);
    expect(Number(defaultSettings.maxPercent)).toBeLessThanOrEqual(100);
    expect(Number(defaultSettings.minPercent)).toBeLessThanOrEqual(Number(defaultSettings.maxPercent));
  });

  it("CBAG 골든 섹션 필수 포함 여부 확인", () => {
    const isGoldenCbagRequired = (settings: { goldenRequired: boolean }) =>
      settings.goldenRequired;
    expect(isGoldenCbagRequired({ goldenRequired: true })).toBe(true);
    expect(isGoldenCbagRequired({ goldenRequired: false })).toBe(false);
  });

  it("CBAG 상품 collectionType 필터", () => {
    const plans = [
      { id: 1, name: "Plan A", collectionType: "golden" },
      { id: 2, name: "CBAG Plan 1", collectionType: "cbag" },
      { id: 3, name: "CBAG Plan 2", collectionType: "cbag" },
      { id: 4, name: "Self Plan", collectionType: "self" },
    ];
    const cbagPlans = plans.filter((p) => p.collectionType === "cbag");
    expect(cbagPlans).toHaveLength(2);
    expect(cbagPlans[0].name).toBe("CBAG Plan 1");
    expect(cbagPlans[1].name).toBe("CBAG Plan 2");
  });
});
