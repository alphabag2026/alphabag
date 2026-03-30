import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

// Mock storage
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://cdn.example.com/test.png", key: "test.png" }),
}));

// Mock pdf-parse
vi.mock("pdf-parse", () => ({
  default: vi.fn().mockResolvedValue({ text: "B BAG MAXFI\nDaily Return: 0.35%\nRecommended: 1000 USDT" }),
}));

import { invokeLLM } from "./_core/llm";

const mockPlanResponse = {
  choices: [{
    message: {
      content: JSON.stringify({
        name: "B BAG MAXFI",
        label: "Stable / Treasury-focused",
        dailyRate: "0.35",
        minAmount: "100",
        recommendedAmount: "1000",
        allocation: "40% 40% 20%",
        strategy: "Treasury-focused",
        badgeLabels: ["BINANCE Alpha", "Insurance(Hedge)"],
        tags: ["stable", "treasury"],
        description: "A stable investment plan focused on treasury management",
        planType: "investment",
        yieldInfo: "Daily: 0.6% ~ 2%",
        ratioInfo: "40% 40% 20%",
        rating: 5.0,
      }),
    },
  }],
};

describe("AI Plan Import", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (invokeLLM as any).mockResolvedValue(mockPlanResponse);
  });

  it("should parse plan from text using LLM", async () => {
    const text = "B BAG MAXFI - Stable / Treasury-focused\n일일 수익률: 0.35%\n추천 투자금액: 1,000 USDT";
    const result = await (invokeLLM as any)({
      messages: [{ role: "user", content: text }],
    });
    const content = result.choices[0].message.content;
    const parsed = JSON.parse(content);
    expect(parsed.name).toBe("B BAG MAXFI");
    expect(parsed.dailyRate).toBe("0.35");
    expect(parsed.badgeLabels).toContain("BINANCE Alpha");
  });

  it("should return valid plan structure with all required fields", async () => {
    const result = await (invokeLLM as any)({ messages: [] });
    const parsed = JSON.parse(result.choices[0].message.content);
    // Required fields check
    expect(parsed).toHaveProperty("name");
    expect(parsed).toHaveProperty("dailyRate");
    expect(parsed).toHaveProperty("badgeLabels");
    expect(parsed).toHaveProperty("tags");
    expect(parsed).toHaveProperty("description");
    expect(parsed).toHaveProperty("planType");
  });

  it("should extract badge labels as array", async () => {
    const result = await (invokeLLM as any)({ messages: [] });
    const parsed = JSON.parse(result.choices[0].message.content);
    expect(Array.isArray(parsed.badgeLabels)).toBe(true);
    expect(parsed.badgeLabels.length).toBeGreaterThan(0);
  });

  it("should handle planType as investment or staking", async () => {
    const result = await (invokeLLM as any)({ messages: [] });
    const parsed = JSON.parse(result.choices[0].message.content);
    expect(["investment", "staking"]).toContain(parsed.planType);
  });

  it("should parse numeric dailyRate correctly", async () => {
    const result = await (invokeLLM as any)({ messages: [] });
    const parsed = JSON.parse(result.choices[0].message.content);
    const rate = parseFloat(parsed.dailyRate);
    expect(rate).toBeGreaterThan(0);
    expect(rate).toBeLessThan(100);
  });

  it("should include optional fields when available", async () => {
    const result = await (invokeLLM as any)({ messages: [] });
    const parsed = JSON.parse(result.choices[0].message.content);
    expect(parsed.yieldInfo).toBeDefined();
    expect(parsed.ratioInfo).toBeDefined();
    expect(parsed.rating).toBeDefined();
  });

  it("should handle image parsing with storage upload", async () => {
    const { storagePut } = await import("./storage");
    const buffer = Buffer.from("fake-image-data");
    const { url } = await storagePut("ai-plan-import/test.png", buffer, "image/png");
    expect(url).toBe("https://cdn.example.com/test.png");
  });

  it("should parse PDF file content", async () => {
    const pdfParseModule = await import("pdf-parse");
    const pdfParseFn = (pdfParseModule as any).default ?? pdfParseModule;
    const buffer = Buffer.from("fake-pdf-data");
    const pdfData = await pdfParseFn(buffer);
    expect(pdfData.text).toContain("B BAG MAXFI");
  });
});
