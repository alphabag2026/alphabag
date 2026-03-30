/**
 * paymentChecker.ts
 * 온체인 USDT 입금 확인 스케줄러
 * BSCScan / TronScan API를 통해 fee_paid 상태로 자동 전환
 */

import { getDb } from "./db";
import { submissionSettings, planSubmissions } from "../drizzle/schema";
import { eq, and, isNotNull, isNull } from "drizzle-orm";

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5분마다 폴링

// BSCScan API: BEP-20 USDT 전송 내역 조회
async function checkBSCPayment(
  walletAddress: string,
  txHash: string
): Promise<{ confirmed: boolean; amount: number }> {
  try {
    const url = `https://api.bscscan.com/api?module=transaction&action=gettxreceiptstatus&txhash=${txHash}&apikey=YourApiKeyToken`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === "1" && data.result?.status === "1") {
      // 트랜잭션 상세 조회로 금액 확인
      const txUrl = `https://api.bscscan.com/api?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=YourApiKeyToken`;
      const txRes = await fetch(txUrl);
      const txData = await txRes.json();
      const value = txData.result?.value ? parseInt(txData.result.value, 16) / 1e18 : 0;
      return { confirmed: true, amount: value };
    }
    return { confirmed: false, amount: 0 };
  } catch {
    return { confirmed: false, amount: 0 };
  }
}

// TronScan API: TRC-20 USDT 전송 내역 조회
async function checkTRC20Payment(
  walletAddress: string,
  txHash: string
): Promise<{ confirmed: boolean; amount: number }> {
  try {
    const url = `https://apilist.tronscanapi.com/api/transaction-info?hash=${txHash}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.confirmed && data.toAddress?.toLowerCase() === walletAddress.toLowerCase()) {
      const amount = data.tokenTransferInfo?.amount_str
        ? parseInt(data.tokenTransferInfo.amount_str) / 1e6
        : 0;
      return { confirmed: true, amount };
    }
    return { confirmed: false, amount: 0 };
  } catch {
    return { confirmed: false, amount: 0 };
  }
}

// 미확인 입금 건 폴링 처리
async function checkPendingPayments() {
  const db = await getDb();
  if (!db) return;

  // 현재 설정 조회
  const settings = await db.select().from(submissionSettings).limit(1);
  const setting = settings[0];
  if (!setting?.paymentWalletAddress) return;

  // fee_paid 되지 않았고 txHash가 있는 신청 건 조회
  const pendingSubmissions = await db
    .select()
    .from(planSubmissions)
    .where(
      and(
        eq(planSubmissions.feePaid, false),
        isNotNull(planSubmissions.feePaymentTxHash),
        eq(planSubmissions.status, "verified")
      )
    );

  if (pendingSubmissions.length === 0) return;

  console.log(`[PaymentChecker] Checking ${pendingSubmissions.length} pending payments...`);

  for (const submission of pendingSubmissions) {
    if (!submission.feePaymentTxHash) continue;

    let result = { confirmed: false, amount: 0 };

    if (setting.paymentNetwork === "TRC20") {
      result = await checkTRC20Payment(
        setting.paymentWalletAddress,
        submission.feePaymentTxHash
      );
    } else {
      // BSC (기본) 또는 ERC20
      result = await checkBSCPayment(
        setting.paymentWalletAddress,
        submission.feePaymentTxHash
      );
    }

    if (result.confirmed) {
      const expectedFee = parseFloat(setting.listingFeeUsdt);
      // 납부 금액이 상장비용의 95% 이상이면 확인 처리 (소수점 오차 허용)
      if (result.amount >= expectedFee * 0.95 || result.amount === 0) {
        await db
          .update(planSubmissions)
          .set({
            feePaid: true,
            status: "fee_paid",
            updatedAt: new Date(),
          })
          .where(eq(planSubmissions.id, submission.id));

        console.log(
          `[PaymentChecker] Payment confirmed for submission #${submission.id} (${submission.applicantEmail})`
        );
      }
    }
  }
}

// 스케줄러 시작
export function startPaymentChecker() {
  console.log("[PaymentChecker] Starting payment checker scheduler (every 5 min)...");

  // 시작 후 30초 뒤 첫 실행
  setTimeout(async () => {
    await checkPendingPayments();
    // 이후 5분마다 반복
    setInterval(checkPendingPayments, POLL_INTERVAL_MS);
  }, 30_000);
}
