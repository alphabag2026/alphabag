import { MainNav } from "@/components/MainNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWallet } from "@/contexts/WalletContext";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Interface, parseUnits } from "ethers";
import { ArrowLeftRight, ArrowUpRight, CheckCircle2, CircleDollarSign, Coins, ExternalLink, Loader2, LockKeyhole, ShieldCheck, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

type Network = "BSC" | "ERC20" | "TRC20";

const EVM_ERC20_ABI = ["function approve(address spender,uint256 amount) returns (bool)", "function transfer(address to,uint256 amount) returns (bool)"];
const EVM_MARKET_ABI = [
  "function createOrder(uint256 pointAmount,uint256 minFillAmount,uint256 priceUsdtPerPoint,uint256 expiresAt) returns (uint256)",
  "function fillOrder(uint256 orderId,uint256 pointAmount)",
];
const EVM_CHECKOUT_ABI = ["function checkout(uint256 paymentReference,uint256 planId,uint256 policyVersion,uint256 nominalUsdtAmount)"];

function networkLabel(network: Network) {
  return network === "BSC" ? "BSC (BEP-20)" : network === "ERC20" ? "Ethereum (ERC-20)" : "TRON (TRC-20)";
}

function displayAmount(value?: string | null, digits = 4) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed.toLocaleString(undefined, { maximumFractionDigits: digits }) : "0";
}

function EvmActionNotice() {
  return <p className="text-xs text-amber-200/85 leading-relaxed">지갑 서명은 AlphaBag가 아닌 사용자의 지갑 앱에서 직접 승인됩니다. 개인키·시드문구는 절대 입력하지 마세요.</p>;
}

export default function PointsMarket() {
  const { isAuthenticated, user } = useAuth();
  const { address, chainId, isConnected, openModal, switchChain, tronAddress } = useWallet();
  const utils = trpc.useUtils();
  const [selectedNetwork, setSelectedNetwork] = useState<Network>("BSC");
  const [recipient, setRecipient] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [sellAmount, setSellAmount] = useState("");
  const [minFillAmount, setMinFillAmount] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [expiryHours, setExpiryHours] = useState("24");
  const [fillAmounts, setFillAmounts] = useState<Record<number, string>>({});
  const [fillOrderId, setFillOrderId] = useState<number | null>(null);
  const [checkoutPlanId, setCheckoutPlanId] = useState("");

  const overview = trpc.points.getOverview.useQuery(undefined, { enabled: isAuthenticated });
  const orders = trpc.pointMarket.listOrders.useQuery({ network: selectedNetwork, limit: 50 });
  const transferPreparation = trpc.points.getTransferPreparation.useQuery(
    { network: selectedNetwork, recipient, amount: transferAmount || "0" },
    { enabled: false, retry: false },
  );

  const requestWalletChallenge = trpc.points.requestWalletChallenge.useMutation();
  const verifyEvmWallet = trpc.points.verifyEvmWallet.useMutation({ onSuccess: () => { toast.success("지갑 소유권이 확인되었습니다."); utils.points.getOverview.invalidate(); } });
  const createOrderDraft = trpc.pointMarket.createOrderDraft.useMutation();
  const reportOrderTransaction = trpc.pointMarket.reportOrderTransaction.useMutation();
  const fillQuote = trpc.pointMarket.getFillQuote.useQuery(
    { orderId: fillOrderId ?? 0, pointAmount: fillOrderId ? (fillAmounts[fillOrderId] || "0") : "0" },
    { enabled: false, retry: false },
  );
  const checkoutQuote = trpc.pointCheckout.getQuote.useQuery({ planId: Number(checkoutPlanId || 0) }, { enabled: false, retry: false });
  const createCheckoutIntent = trpc.pointCheckout.createIntent.useMutation();
  const reportCheckoutTransaction = trpc.pointCheckout.reportCheckoutTransaction.useMutation();

  const config = useMemo(() => overview.data?.configs?.find((item: any) => item.network === selectedNetwork), [overview.data?.configs, selectedNetwork]);
  const activeWallet = selectedNetwork === "TRC20" ? tronAddress : address;
  const selectedChainId = selectedNetwork === "BSC" ? 56 : selectedNetwork === "ERC20" ? 1 : undefined;
  const isCorrectNetwork = selectedNetwork === "TRC20" ? Boolean(tronAddress) : chainId === selectedChainId;
  const isLive = Boolean(config?.isLive && config?.pointTokenAddress && config?.marketEscrowAddress && config?.usdtTokenAddress);

  const requireConnection = () => {
    if (!isAuthenticated || !isConnected) { openModal(); return false; }
    if (selectedNetwork !== "TRC20" && !isCorrectNetwork) { switchChain(selectedChainId!); return false; }
    return true;
  };

  const verifyWallet = async () => {
    if (!requireConnection() || !activeWallet) return;
    if (selectedNetwork === "TRC20") { toast.info("TRON 서명 검증 모듈은 계약 배포와 함께 활성화됩니다."); return; }
    try {
      const challenge = await requestWalletChallenge.mutateAsync({ network: selectedNetwork as "BSC" | "ERC20", address: activeWallet });
      const ethereum = (window as any).ethereum;
      if (!ethereum) throw new Error("EVM 지갑 공급자를 찾을 수 없습니다.");
      const signature = await ethereum.request({ method: "personal_sign", params: [challenge.message, activeWallet] });
      await verifyEvmWallet.mutateAsync({ network: selectedNetwork as "BSC" | "ERC20", address: activeWallet, signature, nonce: challenge.nonce });
    } catch (error: any) { toast.error(error?.message ?? "지갑 소유권 검증에 실패했습니다."); }
  };

  const sendTransfer = async () => {
    if (!requireConnection()) return;
    try {
      const result = await transferPreparation.refetch();
      const prep = result.data;
      if (!prep) return;
      if (selectedNetwork === "TRC20") {
        const tronWeb = (window as any).tronWeb;
        if (!tronWeb) throw new Error("TronLink 지갑을 찾을 수 없습니다.");
        const contract = await tronWeb.contract().at(prep.pointTokenAddress);
        const txHash = await contract.transfer(prep.recipient, parseUnits(prep.amount, prep.pointDecimals).toString()).send();
        toast.success(`포인트 전송 요청이 제출되었습니다: ${String(txHash).slice(0, 10)}…`);
      } else {
        const ethereum = (window as any).ethereum;
        const data = new Interface(EVM_ERC20_ABI).encodeFunctionData("transfer", [prep.recipient, parseUnits(prep.amount, prep.pointDecimals)]);
        const txHash = await ethereum.request({ method: "eth_sendTransaction", params: [{ from: activeWallet, to: prep.pointTokenAddress, data, value: "0x0" }] });
        toast.success(`포인트 전송 요청이 제출되었습니다: ${String(txHash).slice(0, 10)}…`);
      }
      setRecipient(""); setTransferAmount("");
    } catch (error: any) { toast.error(error?.message ?? "포인트 전송 요청에 실패했습니다."); }
  };

  const createSellOrder = async () => {
    if (!requireConnection()) return;
    if (!isLive) { toast.error("보안감사와 계약 검증이 완료된 네트워크에서만 주문을 생성할 수 있습니다."); return; }
    try {
      const hours = Number(expiryHours);
      const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
      const draft = await createOrderDraft.mutateAsync({ network: selectedNetwork, pointAmount: sellAmount, minFillAmount, priceUsdtPerPoint: sellPrice, expiresAt });
      if (selectedNetwork === "TRC20") throw new Error("TRON 시장 계약 호출은 TRON 전용 계약 주소가 검증된 후 활성화됩니다.");
      const ethereum = (window as any).ethereum;
      const data = new Interface(EVM_MARKET_ABI).encodeFunctionData("createOrder", [
        parseUnits(sellAmount, config!.pointDecimals),
        parseUnits(minFillAmount, config!.pointDecimals),
        parseUnits(sellPrice, config!.usdtDecimals),
        BigInt(Math.floor(new Date(expiresAt).getTime() / 1000)),
      ]);
      const txHash = await ethereum.request({ method: "eth_sendTransaction", params: [{ from: activeWallet, to: draft.escrowAddress, data, value: "0x0" }] });
      await reportOrderTransaction.mutateAsync({ orderId: draft.orderId, txHash });
      toast.success("매도 주문 생성 트랜잭션이 제출되었습니다. 체인 확정 후 시장에 표시됩니다.");
      setSellAmount(""); setMinFillAmount(""); setSellPrice("");
      utils.pointMarket.myOrders.invalidate();
    } catch (error: any) { toast.error(error?.message ?? "매도 주문 생성에 실패했습니다."); }
  };

  const requestFillQuote = async (orderId: number) => {
    setFillOrderId(orderId);
    await new Promise(resolve => setTimeout(resolve, 0));
    const result = await fillQuote.refetch();
    if (result.error) toast.error(result.error.message);
  };

  const approveUsdtForFill = async () => {
    const data = fillQuote.data;
    if (!data || !requireConnection() || selectedNetwork === "TRC20") return;
    try {
      const ethereum = (window as any).ethereum;
      const rawAmount = parseUnits(data.quote.grossUsdt, data.config.usdtDecimals);
      const payload = new Interface(EVM_ERC20_ABI).encodeFunctionData("approve", [data.config.marketEscrowAddress, rawAmount]);
      const txHash = await ethereum.request({ method: "eth_sendTransaction", params: [{ from: activeWallet, to: data.config.usdtTokenAddress, data: payload, value: "0x0" }] });
      toast.success(`USDT 승인 요청이 제출되었습니다: ${String(txHash).slice(0, 10)}…`);
    } catch (error: any) { toast.error(error?.message ?? "USDT 승인에 실패했습니다."); }
  };

  const executeFill = async () => {
    const data = fillQuote.data;
    if (!data || !requireConnection()) return;
    if (selectedNetwork === "TRC20") { toast.info("TRON 체결 호출은 TRON 전용 에스크로 계약이 검증된 후 활성화됩니다."); return; }
    try {
      if (!data.order.chainOrderId) throw new Error("온체인 주문 식별자가 아직 동기화되지 않았습니다.");
      const ethereum = (window as any).ethereum;
      const payload = new Interface(EVM_MARKET_ABI).encodeFunctionData("fillOrder", [BigInt(data.order.chainOrderId), parseUnits(data.quote.pointAmount, data.config.pointDecimals)]);
      const txHash = await ethereum.request({ method: "eth_sendTransaction", params: [{ from: activeWallet, to: data.config.marketEscrowAddress, data: payload, value: "0x0" }] });
      toast.success(`P2P 체결 요청이 제출되었습니다: ${String(txHash).slice(0, 10)}…`);
      utils.pointMarket.listOrders.invalidate();
    } catch (error: any) { toast.error(error?.message ?? "P2P 주문 체결에 실패했습니다."); }
  };

  const requestCheckoutQuote = async () => {
    if (!checkoutPlanId || Number(checkoutPlanId) < 1) { toast.error("결제 정책을 확인할 투자 플랜 ID를 입력해 주세요."); return; }
    const result = await checkoutQuote.refetch();
    if (result.error) toast.error(result.error.message);
  };

  const approveHybridAssets = async () => {
    const data = checkoutQuote.data;
    if (!data || !requireConnection()) return;
    if (data.config.network === "TRC20") { toast.info("TRON 복합 결제는 TRON 전용 결제 계약 검증 후 활성화됩니다."); return; }
    if (!data.config.isLive || !data.config.checkoutAddress || !data.config.usdtTokenAddress || !data.config.pointTokenAddress) { toast.error("이 결제 정책의 체인 계약이 아직 활성화되지 않았습니다."); return; }
    try {
      const ethereum = (window as any).ethereum;
      const erc20 = new Interface(EVM_ERC20_ABI);
      const usdtApproval = erc20.encodeFunctionData("approve", [data.config.checkoutAddress, parseUnits(data.quote.usdtAmount, data.config.usdtDecimals)]);
      await ethereum.request({ method: "eth_sendTransaction", params: [{ from: activeWallet, to: data.config.usdtTokenAddress, data: usdtApproval, value: "0x0" }] });
      const pointApproval = erc20.encodeFunctionData("approve", [data.config.checkoutAddress, parseUnits(data.quote.pointAmount, data.config.pointDecimals)]);
      await ethereum.request({ method: "eth_sendTransaction", params: [{ from: activeWallet, to: data.config.pointTokenAddress, data: pointApproval, value: "0x0" }] });
      toast.success("USDT와 ABP 사용 승인이 제출되었습니다. 지갑에서 다음 결제 단계를 실행하세요.");
    } catch (error: any) { toast.error(error?.message ?? "결제 자산 승인에 실패했습니다."); }
  };

  const executeHybridCheckout = async () => {
    const data = checkoutQuote.data;
    if (!data || !requireConnection()) return;
    if (data.config.network === "TRC20") { toast.info("TRON 복합 결제는 TRON 전용 결제 계약 검증 후 활성화됩니다."); return; }
    try {
      const intent = await createCheckoutIntent.mutateAsync({ planId: Number(checkoutPlanId), policyId: data.policy.id });
      const ethereum = (window as any).ethereum;
      const payload = new Interface(EVM_CHECKOUT_ABI).encodeFunctionData("checkout", [
        BigInt(intent.receiptId),
        BigInt(Number(checkoutPlanId)),
        BigInt(intent.policyVersion),
        parseUnits(data.quote.nominalUsdt, intent.contract.usdtDecimals),
      ]);
      const txHash = await ethereum.request({ method: "eth_sendTransaction", params: [{ from: activeWallet, to: intent.contract.checkoutAddress, data: payload, value: "0x0" }] });
      await reportCheckoutTransaction.mutateAsync({ receiptId: intent.receiptId, txHash });
      toast.success("복합 결제 트랜잭션이 제출되었습니다. 체인 확정 후 투자 상태가 갱신됩니다.");
    } catch (error: any) { toast.error(error?.message ?? "복합 결제 실행에 실패했습니다."); }
  };

  return <div className="min-h-screen bg-background text-foreground"><MainNav />
    <main className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between mb-8">
        <div><Badge className="mb-3 border-emerald-500/30 bg-emerald-500/10 text-emerald-400"><Coins className="h-3 w-3 mr-1" /> On-chain point economy</Badge>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">ABP Point Wallet & Market</h1>
          <p className="mt-2 max-w-2xl text-sm sm:text-base text-muted-foreground">개인 지갑에서 포인트를 보관·전송하고, 판매자가 정한 가격으로 동일 네트워크 내 USDT P2P 거래를 준비합니다.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["BSC", "ERC20", "TRC20"] as Network[]).map(network => <Button key={network} size="sm" variant={selectedNetwork === network ? "default" : "outline"} onClick={() => setSelectedNetwork(network)}>{networkLabel(network)}</Button>)}
        </div>
      </div>

      <Card className="mb-6 border-amber-500/30 bg-amber-500/5"><CardContent className="flex gap-3 p-4"><ShieldCheck className="h-5 w-5 mt-0.5 flex-none text-amber-400" /><div><p className="text-sm font-semibold">메인넷 안전장치</p><p className="mt-1 text-xs text-muted-foreground leading-relaxed">계약 주소, 독립 보안감사, 멀티시그 및 관리자 활성화가 완료된 체인에서만 실제 전송과 P2P 주문이 가능합니다. 현재 상태: <strong className={isLive ? "text-emerald-400" : "text-amber-400"}>{isLive ? "활성화됨" : "설정 또는 감사 대기"}</strong>.</p></div></CardContent></Card>

      {!isAuthenticated ? <Card><CardContent className="py-12 text-center"><Wallet className="h-10 w-10 mx-auto mb-3 text-primary" /><h2 className="font-bold">지갑 연결이 필요합니다</h2><p className="text-sm text-muted-foreground mt-2">포인트 잔액과 주문 관리를 위해 지갑 연결 및 서명 로그인 후 이용할 수 있습니다.</p><Button className="mt-5" onClick={openModal}>지갑 연결</Button></CardContent></Card> :
      <Tabs defaultValue="wallet" className="space-y-6"><TabsList className="grid w-full grid-cols-4 max-w-2xl"><TabsTrigger value="wallet">포인트 지갑</TabsTrigger><TabsTrigger value="market">P2P 시장</TabsTrigger><TabsTrigger value="checkout">복합 결제</TabsTrigger><TabsTrigger value="transfer">지갑 전송</TabsTrigger></TabsList>
        <TabsContent value="wallet" className="space-y-5"><div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2"><CardHeader><CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5 text-primary" /> 내 포인트 지갑</CardTitle></CardHeader><CardContent className="space-y-4">
            <div className="rounded-xl border border-border/50 bg-muted/30 p-4"><p className="text-xs text-muted-foreground">연결된 지갑</p><p className="font-mono text-sm mt-1 truncate">{activeWallet ?? "지갑을 연결해 주세요"}</p><p className="text-xs text-muted-foreground mt-1">{networkLabel(selectedNetwork)} · {isCorrectNetwork ? "올바른 네트워크" : "네트워크 전환 필요"}</p></div>
            <div className="grid gap-3 sm:grid-cols-3">{(["BSC", "ERC20", "TRC20"] as Network[]).map(network => <div key={network} className="rounded-xl border border-border/50 p-4"><p className="text-xs text-muted-foreground">{network}</p><p className="mt-1 text-xl font-bold">{displayAmount(overview.data?.totals?.[network])} <span className="text-xs text-primary">ABP</span></p><p className="mt-1 text-[11px] text-muted-foreground">표시용 온체인 원장 기준</p></div>)}</div>
            <Button variant="outline" onClick={verifyWallet} disabled={requestWalletChallenge.isPending || verifyEvmWallet.isPending}>{requestWalletChallenge.isPending || verifyEvmWallet.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />} 현재 지갑 소유권 확인</Button>
          </CardContent></Card>
          <Card><CardHeader><CardTitle className="text-base">지갑 상태</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">KYC</span><Badge variant="outline">{user?.kycStatus ?? "none"}</Badge></div><div className="flex justify-between"><span className="text-muted-foreground">연결 지갑</span><span>{overview.data?.wallets?.length ?? 0}</span></div><div className="flex justify-between"><span className="text-muted-foreground">체인 구성</span><span>{config?.isLive ? "Live" : "Pending"}</span></div><Link href="/nodes"><Button variant="outline" className="w-full mt-2">노드 혜택 보기 <ExternalLink className="ml-2 h-3.5 w-3.5" /></Button></Link></CardContent></Card>
        </div>
        <Card><CardHeader><CardTitle className="text-base">포인트 원장</CardTitle></CardHeader><CardContent>{overview.isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : overview.data?.ledger?.length ? <div className="divide-y divide-border/50">{overview.data.ledger.map((entry: any) => <div key={entry.id} className="flex items-center justify-between gap-4 py-3 text-sm"><div><p className="font-medium">{entry.entryType.replaceAll("_", " ")}</p><p className="text-xs text-muted-foreground">{entry.network} · {new Date(entry.occurredAt).toLocaleString()}</p></div><div className="text-right"><p className={entry.direction === "credit" ? "text-emerald-400" : "text-rose-400"}>{entry.direction === "credit" ? "+" : "-"}{displayAmount(entry.amount)} ABP</p><p className="text-xs text-muted-foreground">{entry.status}</p></div></div>)}</div> : <p className="py-6 text-sm text-muted-foreground text-center">확정된 포인트 원장 항목이 없습니다. 체인 이벤트가 동기화되면 여기에 표시됩니다.</p>}</CardContent></Card></TabsContent>

        <TabsContent value="market" className="space-y-5"><div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]"><Card><CardHeader><CardTitle className="flex items-center gap-2"><ArrowLeftRight className="h-5 w-5 text-primary" /> {networkLabel(selectedNetwork)} 매도 주문</CardTitle></CardHeader><CardContent>{orders.isLoading ? <div className="py-16 flex justify-center"><Loader2 className="animate-spin" /></div> : orders.data?.length ? <div className="divide-y divide-border/50">{orders.data.map((order: any) => <div key={order.id} className="py-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-center"><div><div className="flex items-center gap-2"><p className="font-semibold">{displayAmount(order.remainingPointAmount)} ABP</p><Badge variant="outline">{order.status}</Badge></div><p className="mt-1 text-sm text-muted-foreground">1 ABP = {displayAmount(order.priceUsdtPerPoint, 6)} USDT · 최소 {displayAmount(order.minFillAmount)} ABP</p><p className="mt-1 font-mono text-xs text-muted-foreground">판매자 {String(order.sellerWalletAddress).slice(0, 8)}…{String(order.sellerWalletAddress).slice(-6)}</p></div><div className="flex gap-2"><Input className="w-24" placeholder="ABP" value={fillAmounts[order.id] ?? ""} onChange={e => setFillAmounts(old => ({ ...old, [order.id]: e.target.value }))} /><Button size="sm" onClick={() => requestFillQuote(order.id)} disabled={!fillAmounts[order.id]}>견적</Button></div></div>)}</div> : <div className="py-16 text-center"><CircleDollarSign className="h-10 w-10 mx-auto text-muted-foreground/40" /><p className="mt-3 text-sm text-muted-foreground">현재 체결 가능한 매도 주문이 없습니다.</p><p className="mt-1 text-xs text-muted-foreground">계약이 활성화된 후 판매자가 포인트를 에스크로에 예치하면 이곳에 표시됩니다.</p></div>}</CardContent></Card>
          <Card><CardHeader><CardTitle className="text-base">판매 주문 만들기</CardTitle></CardHeader><CardContent className="space-y-4"><div><Label>판매할 ABP</Label><Input className="mt-1" value={sellAmount} onChange={e => setSellAmount(e.target.value)} placeholder="예: 300" /></div><div><Label>최소 체결 ABP</Label><Input className="mt-1" value={minFillAmount} onChange={e => setMinFillAmount(e.target.value)} placeholder="예: 50" /></div><div><Label>판매가 (USDT / 1 ABP)</Label><Input className="mt-1" value={sellPrice} onChange={e => setSellPrice(e.target.value)} placeholder="판매자가 직접 설정" /></div><div><Label>주문 유효시간 (시간)</Label><Input className="mt-1" type="number" min="1" value={expiryHours} onChange={e => setExpiryHours(e.target.value)} /></div><div className="rounded-lg bg-muted/40 p-3"><EvmActionNotice /></div><Button className="w-full" onClick={createSellOrder} disabled={createOrderDraft.isPending || !isLive}>{createOrderDraft.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LockKeyhole className="h-4 w-4 mr-2" />} 포인트 예치 후 주문 생성</Button>{!isLive && <p className="text-xs text-amber-500">선택한 체인의 계약·보안감사 활성화 전에는 주문을 만들 수 없습니다.</p>}</CardContent></Card></div>
          {fillQuote.data && <Card className="border-primary/30"><CardHeader><CardTitle className="text-base">체결 견적</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><div className="grid grid-cols-2 gap-3"><div><p className="text-muted-foreground">수령 포인트</p><p className="font-bold">{displayAmount(fillQuote.data.quote.pointAmount)} ABP</p></div><div><p className="text-muted-foreground">총 지불 USDT</p><p className="font-bold">{displayAmount(fillQuote.data.quote.grossUsdt, 6)} USDT</p></div><div><p className="text-muted-foreground">플랫폼 수수료</p><p>{displayAmount(fillQuote.data.quote.feeUsdt, 6)} USDT</p></div><div><p className="text-muted-foreground">판매자 수령</p><p>{displayAmount(fillQuote.data.quote.sellerNetUsdt, 6)} USDT</p></div></div><p className="rounded-lg bg-amber-500/10 p-3 text-xs text-amber-200/85">1) 먼저 필요한 USDT 승인만 허용하고, 2) 승인 확인 후 체결을 실행합니다. P2P 체결은 네트워크 확정 후 되돌릴 수 없습니다.</p><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={approveUsdtForFill} disabled={selectedNetwork === "TRC20"}>1. USDT 승인</Button><Button onClick={executeFill}>2. 체결 실행</Button></div></CardContent></Card>}</TabsContent>

        <TabsContent value="checkout" className="space-y-5"><Card className="max-w-3xl"><CardHeader><CardTitle className="flex items-center gap-2"><CircleDollarSign className="h-5 w-5 text-primary" /> 투자 USDT + ABP 복합 결제</CardTitle></CardHeader><CardContent className="space-y-5"><p className="text-sm text-muted-foreground">관리자가 플랜별로 설정한 정책에 따라 명목 투자금의 <strong className="text-foreground">70~95%는 USDT</strong>, <strong className="text-foreground">5~30%는 ABP 포인트</strong>로 동시에 결제합니다. 금액은 화면이 아닌 체인 계약에서 다시 계산됩니다.</p><div className="flex gap-2"><Input type="number" min="1" value={checkoutPlanId} onChange={e => setCheckoutPlanId(e.target.value)} placeholder="투자 플랜 ID" /><Button onClick={requestCheckoutQuote} disabled={checkoutQuote.isFetching}>{checkoutQuote.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : "정책 견적 확인"}</Button></div>{checkoutQuote.data && <div className="space-y-4 rounded-xl border border-primary/30 bg-primary/5 p-5"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold">정책 v{checkoutQuote.data.policy.version}</p><p className="mt-1 text-xs text-muted-foreground">{checkoutQuote.data.config.network} · ABP 기준가 {displayAmount(checkoutQuote.data.policy.checkoutPointUsdtRate, 6)} USDT</p></div><Badge variant="outline">{checkoutQuote.data.policy.usdtShareBps / 100}% USDT + {checkoutQuote.data.policy.pointShareBps / 100}% ABP</Badge></div><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-lg bg-background/60 p-3"><p className="text-xs text-muted-foreground">명목 투자금</p><p className="mt-1 font-bold">{displayAmount(checkoutQuote.data.quote.nominalUsdt, 6)} USDT</p></div><div className="rounded-lg bg-background/60 p-3"><p className="text-xs text-muted-foreground">USDT 결제액</p><p className="mt-1 font-bold text-emerald-400">{displayAmount(checkoutQuote.data.quote.usdtAmount, 6)} USDT</p></div><div className="rounded-lg bg-background/60 p-3"><p className="text-xs text-muted-foreground">ABP 결제액</p><p className="mt-1 font-bold text-primary">{displayAmount(checkoutQuote.data.quote.pointAmount)} ABP</p></div></div><div className="rounded-lg bg-amber-500/10 p-3"><EvmActionNotice /></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={approveHybridAssets} disabled={!checkoutQuote.data.config.isLive}>1. USDT·ABP 승인</Button><Button onClick={executeHybridCheckout} disabled={!checkoutQuote.data.config.isLive || createCheckoutIntent.isPending}>{createCheckoutIntent.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 2. 복합 결제 실행</Button></div>{!checkoutQuote.data.config.isLive && <p className="text-xs text-amber-500">체인 계약·보안감사 활성화가 완료될 때까지 실제 결제는 차단됩니다.</p>}</div>}</CardContent></Card></TabsContent>
        <TabsContent value="transfer"><Card className="max-w-2xl"><CardHeader><CardTitle className="flex items-center gap-2"><ArrowUpRight className="h-5 w-5 text-primary" /> ABP 포인트 지갑 전송</CardTitle></CardHeader><CardContent className="space-y-5"><div><Label>수신 지갑 주소</Label><Input className="mt-1 font-mono" value={recipient} onChange={e => setRecipient(e.target.value)} placeholder={selectedNetwork === "TRC20" ? "T..." : "0x..."} /></div><div><Label>전송할 ABP</Label><Input className="mt-1" value={transferAmount} onChange={e => setTransferAmount(e.target.value)} placeholder="예: 100" /></div><div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4"><p className="text-sm font-medium">전송 전 확인</p><ul className="mt-2 space-y-1 text-xs text-muted-foreground list-disc pl-4"><li>선택한 네트워크와 수신 지갑 주소가 일치하는지 확인하세요.</li><li>가스비를 위한 BNB·ETH·TRX 잔액이 필요할 수 있습니다.</li><li>확정된 온체인 전송은 취소 또는 복구할 수 없습니다.</li></ul></div><Button className="w-full" onClick={sendTransfer} disabled={!isLive || transferPreparation.isFetching}>{transferPreparation.isFetching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ArrowUpRight className="h-4 w-4 mr-2" />} 지갑에서 전송 승인</Button>{!isLive && <p className="text-center text-xs text-amber-500">계약 주소와 보안 운영 설정이 활성화된 뒤 전송할 수 있습니다.</p>}</CardContent></Card></TabsContent>
      </Tabs>}
    </main>
  </div>;
}
