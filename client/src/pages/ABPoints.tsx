import { useMemo, useState } from "react";
import { ArrowRightLeft, Banknote, CheckCircle2, Coins, Loader2, Send, ShieldCheck, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { MainNav } from "@/components/MainNav";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useWallet } from "@/contexts/WalletContext";
import { trpc } from "@/lib/trpc";

type Network = "BSC" | "ERC20" | "TRC20";

function money(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number.toLocaleString(undefined, { maximumFractionDigits: 4 }) : "0";
}

const statusTone: Record<string, string> = {
  approved: "bg-emerald-500/15 text-emerald-300",
  completed: "bg-emerald-500/15 text-emerald-300",
  paid: "bg-emerald-500/15 text-emerald-300",
  requested: "bg-amber-500/15 text-amber-300",
  intent: "bg-blue-500/15 text-blue-300",
  rejected: "bg-red-500/15 text-red-300",
};

export default function ABPoints() {
  const { isAuthenticated } = useAuth();
  const { openModal, address } = useWallet();
  const utils = trpc.useUtils();
  const overview = trpc.internalPoints.overview.useQuery(undefined, { enabled: isAuthenticated });
  const [recipientQuery, setRecipientQuery] = useState("");
  const recipient = trpc.internalPoints.findRecipient.useQuery({ query: recipientQuery }, { enabled: isAuthenticated && recipientQuery.trim().length >= 3 });
  const [transfer, setTransfer] = useState({ amount: "", memo: "" });
  const [investment, setInvestment] = useState({ planId: "", amount: "1000", usdtShareBps: "7000" });
  const [conversion, setConversion] = useState({ planId: "", saleAmountUsdt: "1000", conversionBps: "500", evidenceUrl: "", memo: "" });
  const [withdrawal, setWithdrawal] = useState({ amountB: "", network: "BSC" as Network, walletAddress: address ?? "" });

  const invalidate = () => utils.internalPoints.overview.invalidate();
  const transferA = trpc.internalPoints.transferA.useMutation({ onSuccess: () => { toast.success("A포인트를 전송했습니다."); setTransfer({ amount: "", memo: "" }); setRecipientQuery(""); invalidate(); }, onError: error => toast.error(error.message) });
  const createInvestment = trpc.internalPoints.createInvestmentUse.useMutation({ onSuccess: data => { toast.success(`투자 결제 의도 생성: ${data.usdtAmount} USDT + ${data.aPointAmount} A`); invalidate(); }, onError: error => toast.error(error.message) });
  const requestConversion = trpc.internalPoints.requestFullUsdtConversion.useMutation({ onSuccess: data => { toast.success(`${data.aPointAmount} A → B 전환 심사를 신청했습니다.`); setConversion(old => ({ ...old, evidenceUrl: "", memo: "" })); invalidate(); }, onError: error => toast.error(error.message) });
  const requestWithdrawal = trpc.internalPoints.requestBWithdrawal.useMutation({ onSuccess: data => { toast.success(`${data.usdtAmount} USDT 출금 심사를 신청했습니다.`); setWithdrawal(old => ({ ...old, amountB: "" })); invalidate(); }, onError: error => toast.error(error.message) });

  const quote = useMemo(() => {
    const amount = Number(investment.amount || 0);
    const usdtBps = Number(investment.usdtShareBps);
    return { usdt: amount * usdtBps / 10_000, a: amount * (10_000 - usdtBps) / 10_000 };
  }, [investment]);
  const conversionAmount = Number(conversion.saleAmountUsdt || 0) * Number(conversion.conversionBps) / 10_000;

  return <div className="min-h-screen bg-background text-foreground"><MainNav /><main className="mx-auto max-w-7xl px-4 py-10">
    <section className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.18),transparent_38%),linear-gradient(135deg,#111827,#020617)] p-6 sm:p-10">
      <div className="relative z-10 max-w-3xl"><Badge className="bg-amber-500/15 text-amber-300 hover:bg-amber-500/15">Internal dual-point ledger</Badge><h1 className="mt-4 text-3xl font-black text-white sm:text-5xl">AlphaBag A·B 포인트 센터</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">A포인트는 회원 간 전송과 투자 결제에 사용하고, 승인된 투자 완료 또는 100% USDT 매출을 통해 B포인트로 전환합니다. B포인트는 준비금 심사 후 USDT 출금을 신청할 수 있습니다.</p></div>
      <div className="mt-7 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs text-slate-400">A포인트 기준</p><p className="mt-1 text-xl font-bold text-amber-300">1 A = 1 USDT</p></div><div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs text-slate-400">B포인트 기준</p><p className="mt-1 text-xl font-bold text-emerald-300">1 B = 1 USDT</p></div><div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs text-slate-400">투자 조합</p><p className="mt-1 text-xl font-bold text-blue-300">USDT 70~95%</p></div></div>
    </section>

    {!isAuthenticated ? <Card className="mx-auto mt-8 max-w-xl border-amber-500/30 bg-card"><CardContent className="flex flex-col items-center py-12 text-center"><WalletCards className="h-12 w-12 text-amber-500" /><h2 className="mt-4 text-xl font-bold">지갑 로그인 필요</h2><p className="mt-2 text-sm text-muted-foreground">A/B 포인트 잔액과 거래 기능을 이용하려면 지갑 연결과 서명 로그인이 필요합니다.</p><Button className="mt-6 bg-amber-500 text-black hover:bg-amber-400" onClick={openModal}>지갑 연결</Button></CardContent></Card> : <>
      <div className="mt-8 grid gap-4 md:grid-cols-4"><Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">사용 가능 A</p><p className="mt-2 text-3xl font-black text-amber-500">{money(overview.data?.account.aAvailable)}</p></CardContent></Card><Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">예약 A</p><p className="mt-2 text-3xl font-black">{money(overview.data?.account.aHeld)}</p></CardContent></Card><Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">출금 가능 B</p><p className="mt-2 text-3xl font-black text-emerald-500">{money(overview.data?.account.bAvailable)}</p></CardContent></Card><Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">출금 심사 B</p><p className="mt-2 text-3xl font-black">{money(overview.data?.account.bReserved)}</p></CardContent></Card></div>
      <Alert className="mt-6 border-amber-500/30 bg-amber-500/5"><ShieldCheck className="h-4 w-4 text-amber-500" /><AlertTitle>출금 준비금 안전장치</AlertTitle><AlertDescription>B포인트는 즉시 송금되는 스테이블코인이 아닙니다. KYC, 준비금 잔액, 관리자 승인 및 온체인 TxHash 확인 후 USDT 출금이 완료됩니다.</AlertDescription></Alert>

      <Tabs defaultValue="transfer" className="mt-8"><TabsList className="grid h-auto grid-cols-2 gap-1 bg-muted p-1 sm:grid-cols-4"><TabsTrigger value="transfer">A 전송</TabsTrigger><TabsTrigger value="invest">투자 사용</TabsTrigger><TabsTrigger value="convert">A→B 전환</TabsTrigger><TabsTrigger value="withdraw">B 출금</TabsTrigger></TabsList>
        <TabsContent value="transfer"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Send className="h-5 w-5 text-amber-500" /> 지인에게 A포인트 전송</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2"><div className="space-y-4"><div><Label>수신자 추천코드 또는 이메일</Label><Input className="mt-1" value={recipientQuery} onChange={e => setRecipientQuery(e.target.value)} placeholder="추천코드 또는 이메일" /></div><div className="rounded-xl border bg-muted/40 p-4 text-sm">{recipient.isFetching ? <Loader2 className="animate-spin" /> : recipient.data ? <><p className="font-semibold">{recipient.data.name ?? "AlphaBag 회원"}</p><p className="text-muted-foreground">추천코드: {recipient.data.referralCode ?? "없음"}</p></> : <p className="text-muted-foreground">일치하는 활성 회원을 확인하면 전송할 수 있습니다.</p>}</div></div><div className="space-y-4"><div><Label>A포인트 수량</Label><Input className="mt-1" value={transfer.amount} onChange={e => setTransfer({ ...transfer, amount: e.target.value })} placeholder="100" /></div><div><Label>메모</Label><Textarea className="mt-1" value={transfer.memo} onChange={e => setTransfer({ ...transfer, memo: e.target.value })} placeholder="전송 사유" /></div><Button className="w-full" disabled={!recipient.data || !transfer.amount || transferA.isPending} onClick={() => recipient.data && transferA.mutate({ recipientUserId: recipient.data.id, amount: transfer.amount, memo: transfer.memo || undefined })}>{transferA.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} A포인트 전송</Button></div></CardContent></Card></TabsContent>

        <TabsContent value="invest"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Coins className="h-5 w-5 text-blue-500" /> USDT + A포인트 투자 사용</CardTitle></CardHeader><CardContent className="grid gap-6 md:grid-cols-2"><div className="space-y-4"><div><Label>투자 플랜 ID</Label><Input className="mt-1" type="number" value={investment.planId} onChange={e => setInvestment({ ...investment, planId: e.target.value })} /></div><div><Label>명목 투자금(USDT)</Label><Input className="mt-1" value={investment.amount} onChange={e => setInvestment({ ...investment, amount: e.target.value })} /></div><div><Label>결제 비율</Label><Select value={investment.usdtShareBps} onValueChange={value => setInvestment({ ...investment, usdtShareBps: value })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{[70,75,80,85,90,95].map(value => <SelectItem key={value} value={String(value * 100)}>{value}% USDT / {100-value}% A</SelectItem>)}</SelectContent></Select></div></div><div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6"><p className="text-sm font-semibold">결제 견적</p><div className="mt-5 space-y-3"><div className="flex justify-between"><span className="text-muted-foreground">USDT 결제</span><strong>{money(quote.usdt)} USDT</strong></div><div className="flex justify-between"><span className="text-muted-foreground">A포인트 사용</span><strong>{money(quote.a)} A</strong></div></div><p className="mt-5 text-xs leading-5 text-muted-foreground">생성 시 A포인트가 예약됩니다. 관리자가 투자 완료를 승인하면 예약 A가 같은 수량의 B로 전환됩니다.</p><Button className="mt-5 w-full" disabled={!investment.planId || createInvestment.isPending} onClick={() => createInvestment.mutate({ planId: Number(investment.planId), nominalUsdtAmount: investment.amount, usdtShareBps: Number(investment.usdtShareBps) })}>{createInvestment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 투자 사용 의도 생성</Button></div></CardContent></Card></TabsContent>

        <TabsContent value="convert"><Card><CardHeader><CardTitle className="flex items-center gap-2"><ArrowRightLeft className="h-5 w-5 text-emerald-500" /> 100% USDT 매출 A→B 전환</CardTitle></CardHeader><CardContent className="grid gap-6 md:grid-cols-2"><div className="space-y-4"><div><Label>매출액(USDT)</Label><Input className="mt-1" value={conversion.saleAmountUsdt} onChange={e => setConversion({ ...conversion, saleAmountUsdt: e.target.value })} /></div><div><Label>전환 비율</Label><Select value={conversion.conversionBps} onValueChange={value => setConversion({ ...conversion, conversionBps: value })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{[5,10,15,20,25,30].map(value => <SelectItem key={value} value={String(value * 100)}>{value}%</SelectItem>)}</SelectContent></Select></div><div><Label>플랜 ID(선택)</Label><Input className="mt-1" type="number" value={conversion.planId} onChange={e => setConversion({ ...conversion, planId: e.target.value })} /></div></div><div className="space-y-4"><div className="rounded-xl border bg-muted/40 p-4"><p className="text-xs text-muted-foreground">심사 요청 전환량</p><p className="mt-2 text-3xl font-black text-emerald-500">{money(conversionAmount)} A → B</p></div><div><Label>100% USDT 매출 증빙 URL</Label><Input className="mt-1" value={conversion.evidenceUrl} onChange={e => setConversion({ ...conversion, evidenceUrl: e.target.value })} placeholder="https://..." /></div><div><Label>설명</Label><Textarea className="mt-1" value={conversion.memo} onChange={e => setConversion({ ...conversion, memo: e.target.value })} /></div><Button className="w-full" disabled={!conversion.evidenceUrl || requestConversion.isPending} onClick={() => requestConversion.mutate({ planId: conversion.planId ? Number(conversion.planId) : undefined, saleAmountUsdt: conversion.saleAmountUsdt, conversionBps: Number(conversion.conversionBps), evidenceUrl: conversion.evidenceUrl, memo: conversion.memo || undefined })}>{requestConversion.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 전환 심사 신청</Button></div></CardContent></Card></TabsContent>

        <TabsContent value="withdraw"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Banknote className="h-5 w-5 text-emerald-500" /> B포인트 USDT 출금 신청</CardTitle></CardHeader><CardContent className="grid gap-6 md:grid-cols-2"><div className="space-y-4"><div><Label>출금 B포인트</Label><Input className="mt-1" value={withdrawal.amountB} onChange={e => setWithdrawal({ ...withdrawal, amountB: e.target.value })} placeholder="100" /></div><div><Label>네트워크</Label><Select value={withdrawal.network} onValueChange={value => setWithdrawal({ ...withdrawal, network: value as Network })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="BSC">BSC (BEP-20)</SelectItem><SelectItem value="ERC20">Ethereum (ERC-20)</SelectItem><SelectItem value="TRC20">TRON (TRC-20)</SelectItem></SelectContent></Select></div><div><Label>USDT 수령 지갑</Label><Input className="mt-1 font-mono text-xs" value={withdrawal.walletAddress} onChange={e => setWithdrawal({ ...withdrawal, walletAddress: e.target.value })} placeholder={withdrawal.network === "TRC20" ? "T..." : "0x..."} /></div></div><div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6"><p className="text-sm font-semibold">출금 신청액</p><p className="mt-3 text-4xl font-black text-emerald-500">{money(withdrawal.amountB)} USDT</p><p className="mt-4 text-xs leading-5 text-muted-foreground">신청 즉시 해당 B포인트가 예약됩니다. 준비금과 KYC 심사 후 관리자가 USDT를 송금하고 TxHash를 등록해야 완료됩니다.</p><Button className="mt-5 w-full" disabled={!withdrawal.amountB || !withdrawal.walletAddress || requestWithdrawal.isPending} onClick={() => requestWithdrawal.mutate(withdrawal)}>{requestWithdrawal.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 출금 심사 신청</Button></div></CardContent></Card></TabsContent>
      </Tabs>

      <Card className="mt-8"><CardHeader><CardTitle>최근 처리 이력</CardTitle></CardHeader><CardContent>{overview.isLoading ? <Loader2 className="animate-spin" /> : overview.data?.ledger.length ? <div className="space-y-2">{overview.data.ledger.slice(0, 20).map(row => <div key={row.id} className="flex flex-col gap-2 rounded-xl border p-3 text-sm sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-muted-foreground" /><div><p className="font-medium">{row.pointType} · {row.actionType}</p><p className="text-xs text-muted-foreground">{new Date(row.createdAt).toLocaleString()}</p></div></div><div className="text-right"><p className={row.direction === "credit" ? "font-bold text-emerald-500" : "font-bold text-amber-500"}>{row.direction === "credit" ? "+" : "-"}{money(row.amount)} {row.pointType}</p><p className="text-xs text-muted-foreground">잔액 {money(row.balanceAfter)}</p></div></div>)}</div> : <p className="py-8 text-center text-sm text-muted-foreground">아직 포인트 처리 이력이 없습니다.</p>}</CardContent></Card>
    </>}
  </main></div>;
}
