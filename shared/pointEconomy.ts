export const BASIS_POINTS = 10_000;
export const MIN_USDT_SHARE_BPS = 7_000;
export const MAX_USDT_SHARE_BPS = 9_500;
export const MIN_POINT_SHARE_BPS = 500;
export const MAX_POINT_SHARE_BPS = 3_000;

export type PointNetwork = "BSC" | "ERC20" | "TRC20";

export type HybridPaymentSplit = {
  usdtShareBps: number;
  pointShareBps: number;
};

export type MarketFillQuote = {
  grossUsdtBaseUnits: bigint;
  feeUsdtBaseUnits: bigint;
  sellerNetUsdtBaseUnits: bigint;
};

export type HybridCheckoutQuote = {
  usdtAmountBaseUnits: bigint;
  pointValueUsdtBaseUnits: bigint;
  pointAmountBaseUnits: bigint;
};

const INTEGER_RE = /^\d+$/;
const DECIMAL_RE = /^(0|[1-9]\d*)(?:\.\d+)?$/;
const ZERO = BigInt(0);

function powerOfTen(exponent: number): bigint {
  let result = BigInt(1);
  for (let index = 0; index < exponent; index += 1) result *= BigInt(10);
  return result;
}

/**
 * 포인트 결제 정책은 USDT 70~95%, 포인트 5~30%이며 합계는 항상 100%여야 한다.
 */
export function assertValidHybridPaymentSplit(split: HybridPaymentSplit): void {
  if (!Number.isInteger(split.usdtShareBps) || !Number.isInteger(split.pointShareBps)) {
    throw new Error("Payment shares must be whole basis-point values.");
  }
  if (split.pointShareBps < MIN_POINT_SHARE_BPS || split.pointShareBps > MAX_POINT_SHARE_BPS) {
    throw new Error("Point share must be between 5% and 30%.");
  }
  if (split.usdtShareBps < MIN_USDT_SHARE_BPS || split.usdtShareBps > MAX_USDT_SHARE_BPS) {
    throw new Error("USDT share must be between 70% and 95%.");
  }
  if (split.usdtShareBps + split.pointShareBps !== BASIS_POINTS) {
    throw new Error("USDT and point shares must sum to 100%.");
  }
}

export function assertValidFeeBps(feeBps: number): void {
  if (!Number.isInteger(feeBps) || feeBps < 0 || feeBps > 1_000) {
    throw new Error("Market fee must be an integer between 0 and 1,000 basis points.");
  }
}

export function assertPositiveBaseUnits(value: bigint, label: string): void {
  if (value <= ZERO) throw new Error(`${label} must be greater than zero.`);
}

/** Converts an end-user decimal string to chain base units without floating point. */
export function decimalToBaseUnits(value: string, decimals: number): bigint {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 36) {
    throw new Error("Decimals must be an integer between 0 and 36.");
  }
  const normalized = value.trim();
  if (!DECIMAL_RE.test(normalized)) throw new Error("Amount must be a non-negative decimal value.");
  const [whole, fraction = ""] = normalized.split(".");
  if (fraction.length > decimals) throw new Error(`Amount supports at most ${decimals} decimal places.`);
  const paddedFraction = fraction.padEnd(decimals, "0");
  return BigInt(`${whole}${paddedFraction}`);
}

/** Formats chain base units as a compact decimal string without loss of precision. */
export function baseUnitsToDecimal(value: bigint, decimals: number): string {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 36) {
    throw new Error("Decimals must be an integer between 0 and 36.");
  }
  const sign = value < ZERO ? "-" : "";
  const digits = (value < ZERO ? -value : value).toString().padStart(decimals + 1, "0");
  if (decimals === 0) return `${sign}${digits}`;
  const whole = digits.slice(0, -decimals);
  const fraction = digits.slice(-decimals).replace(/0+$/, "");
  return fraction ? `${sign}${whole}.${fraction}` : `${sign}${whole}`;
}

/**
 * `priceUsdtPerPointBaseUnits` is USDT base units paid for one whole ABP.
 * `pointAmountBaseUnits` is expressed in ABP base units.
 */
export function calculateMarketFillQuote(params: {
  pointAmountBaseUnits: bigint;
  pointDecimals: number;
  priceUsdtPerPointBaseUnits: bigint;
  feeBps: number;
}): MarketFillQuote {
  const { pointAmountBaseUnits, pointDecimals, priceUsdtPerPointBaseUnits, feeBps } = params;
  assertPositiveBaseUnits(pointAmountBaseUnits, "Point amount");
  assertPositiveBaseUnits(priceUsdtPerPointBaseUnits, "Point price");
  assertValidFeeBps(feeBps);
  const pointScale = powerOfTen(pointDecimals);
  const grossUsdtBaseUnits = (pointAmountBaseUnits * priceUsdtPerPointBaseUnits) / pointScale;
  assertPositiveBaseUnits(grossUsdtBaseUnits, "Gross USDT amount");
  const feeUsdtBaseUnits = (grossUsdtBaseUnits * BigInt(feeBps)) / BigInt(BASIS_POINTS);
  return {
    grossUsdtBaseUnits,
    feeUsdtBaseUnits,
    sellerNetUsdtBaseUnits: grossUsdtBaseUnits - feeUsdtBaseUnits,
  };
}

/**
 * 투자 복합 결제의 USDT·ABP 요구액을 산정한다. 명목 투자금과 ABP 기준가는
 * USDT base units이며, 반환되는 ABP 금액은 지정한 ABP base units이다.
 */
export function calculateHybridCheckoutQuote(params: {
  nominalUsdtBaseUnits: bigint;
  usdtShareBps: number;
  pointShareBps: number;
  checkoutPointUsdtRateBaseUnits: bigint;
  pointDecimals: number;
}): HybridCheckoutQuote {
  assertValidHybridPaymentSplit({ usdtShareBps: params.usdtShareBps, pointShareBps: params.pointShareBps });
  assertPositiveBaseUnits(params.nominalUsdtBaseUnits, "Nominal investment amount");
  assertPositiveBaseUnits(params.checkoutPointUsdtRateBaseUnits, "Checkout point rate");
  const usdtAmountBaseUnits = (params.nominalUsdtBaseUnits * BigInt(params.usdtShareBps)) / BigInt(BASIS_POINTS);
  const pointValueUsdtBaseUnits = params.nominalUsdtBaseUnits - usdtAmountBaseUnits;
  const pointAmountBaseUnits = (pointValueUsdtBaseUnits * powerOfTen(params.pointDecimals)) / params.checkoutPointUsdtRateBaseUnits;
  assertPositiveBaseUnits(pointAmountBaseUnits, "Required point amount");
  return { usdtAmountBaseUnits, pointValueUsdtBaseUnits, pointAmountBaseUnits };
}

export function assertValidOrderAmounts(params: {
  pointAmountBaseUnits: bigint;
  minFillAmountBaseUnits: bigint;
  priceUsdtPerPointBaseUnits: bigint;
  expiresAtMs: number;
  nowMs?: number;
}): void {
  const nowMs = params.nowMs ?? Date.now();
  assertPositiveBaseUnits(params.pointAmountBaseUnits, "Point amount");
  assertPositiveBaseUnits(params.minFillAmountBaseUnits, "Minimum fill amount");
  assertPositiveBaseUnits(params.priceUsdtPerPointBaseUnits, "Point price");
  if (params.minFillAmountBaseUnits > params.pointAmountBaseUnits) {
    throw new Error("Minimum fill amount cannot exceed listed point amount.");
  }
  const minExpiryMs = nowMs + 10 * 60 * 1_000;
  const maxExpiryMs = nowMs + 30 * 24 * 60 * 60 * 1_000;
  if (!Number.isFinite(params.expiresAtMs) || params.expiresAtMs < minExpiryMs || params.expiresAtMs > maxExpiryMs) {
    throw new Error("Order expiry must be between 10 minutes and 30 days from now.");
  }
}

export function isValidTxHash(txHash: string, network: PointNetwork): boolean {
  const value = txHash.trim();
  if (network === "TRC20") return /^[0-9a-fA-F]{64}$/.test(value) || /^0x[0-9a-fA-F]{64}$/.test(value);
  return /^0x[0-9a-fA-F]{64}$/.test(value);
}

export function normalizeWalletAddress(address: string, network: PointNetwork): string {
  const value = address.trim();
  if (network === "TRC20") {
    if (!/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(value)) throw new Error("Invalid TRON wallet address.");
    return value;
  }
  if (!/^0x[0-9a-fA-F]{40}$/.test(value)) throw new Error("Invalid EVM wallet address.");
  return value.toLowerCase();
}

export function isIntegerString(value: string): boolean {
  return INTEGER_RE.test(value);
}
