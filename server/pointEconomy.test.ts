import { describe, expect, it } from "vitest";
import {
  assertValidHybridPaymentSplit,
  assertValidOrderAmounts,
  baseUnitsToDecimal,
  calculateHybridCheckoutQuote,
  calculateMarketFillQuote,
  decimalToBaseUnits,
  normalizeWalletAddress,
} from "../shared/pointEconomy";

describe("point economy payment split", () => {
  it("accepts the required 70% USDT and 30% point split", () => {
    expect(() => assertValidHybridPaymentSplit({ usdtShareBps: 7_000, pointShareBps: 3_000 })).not.toThrow();
  });

  it("accepts the required 95% USDT and 5% point split", () => {
    expect(() => assertValidHybridPaymentSplit({ usdtShareBps: 9_500, pointShareBps: 500 })).not.toThrow();
  });

  it("rejects a split that does not add up to 100%", () => {
    expect(() => assertValidHybridPaymentSplit({ usdtShareBps: 7_000, pointShareBps: 2_000 })).toThrow("sum to 100%");
  });

  it("rejects a point component outside the 5% to 30% policy", () => {
    expect(() => assertValidHybridPaymentSplit({ usdtShareBps: 9_700, pointShareBps: 300 })).toThrow("Point share must be between 5% and 30%");
  });
});

describe("point economy decimal accuracy", () => {
  it("converts amounts to and from base units without JavaScript floating point arithmetic", () => {
    const value = decimalToBaseUnits("123456789.123456", 6);
    expect(value.toString()).toBe("123456789123456");
    expect(baseUnitsToDecimal(value, 6)).toBe("123456789.123456");
  });

  it("rejects an amount with more decimal places than the token permits", () => {
    expect(() => decimalToBaseUnits("1.0000001", 6)).toThrow("at most 6 decimal places");
  });
});

describe("point market fill quote", () => {
  it("calculates gross amount, fee, and seller net amount in base units", () => {
    const quote = calculateMarketFillQuote({
      pointAmountBaseUnits: decimalToBaseUnits("250", 18),
      pointDecimals: 18,
      priceUsdtPerPointBaseUnits: decimalToBaseUnits("0.4", 6),
      feeBps: 100,
    });
    expect(baseUnitsToDecimal(quote.grossUsdtBaseUnits, 6)).toBe("100");
    expect(baseUnitsToDecimal(quote.feeUsdtBaseUnits, 6)).toBe("1");
    expect(baseUnitsToDecimal(quote.sellerNetUsdtBaseUnits, 6)).toBe("99");
  });

  it("rejects a P2P order with an invalid fill minimum or expiry", () => {
    const now = Date.UTC(2026, 7, 30, 0, 0, 0);
    expect(() => assertValidOrderAmounts({
      pointAmountBaseUnits: decimalToBaseUnits("10", 18),
      minFillAmountBaseUnits: decimalToBaseUnits("11", 18),
      priceUsdtPerPointBaseUnits: decimalToBaseUnits("1", 6),
      expiresAtMs: now + 60 * 60 * 1000,
      nowMs: now,
    })).toThrow("cannot exceed");
    expect(() => assertValidOrderAmounts({
      pointAmountBaseUnits: decimalToBaseUnits("10", 18),
      minFillAmountBaseUnits: decimalToBaseUnits("1", 18),
      priceUsdtPerPointBaseUnits: decimalToBaseUnits("1", 6),
      expiresAtMs: now + 60_000,
      nowMs: now,
    })).toThrow("between 10 minutes and 30 days");
  });
});

describe("hybrid investment checkout quote", () => {
  it("splits a 1,000 USDT investment into 700 USDT and 300 ABP at a 1 USDT ABP policy rate", () => {
    const quote = calculateHybridCheckoutQuote({
      nominalUsdtBaseUnits: decimalToBaseUnits("1000", 6),
      usdtShareBps: 7_000,
      pointShareBps: 3_000,
      checkoutPointUsdtRateBaseUnits: decimalToBaseUnits("1", 6),
      pointDecimals: 18,
    });
    expect(baseUnitsToDecimal(quote.usdtAmountBaseUnits, 6)).toBe("700");
    expect(baseUnitsToDecimal(quote.pointValueUsdtBaseUnits, 6)).toBe("300");
    expect(baseUnitsToDecimal(quote.pointAmountBaseUnits, 18)).toBe("300");
  });
});

describe("wallet address normalization", () => {
  it("normalizes EVM wallet addresses and preserves valid TRON base58 addresses", () => {
    expect(normalizeWalletAddress("0xAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa", "BSC")).toBe("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    expect(normalizeWalletAddress("TQXj8A3QmR3JrN9Gh6Wc3TPNfn5DmYTtzR", "TRC20")).toBe("TQXj8A3QmR3JrN9Gh6Wc3TPNfn5DmYTtzR");
  });
});
