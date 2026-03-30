import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  FileText, Clock, CheckCircle, XCircle, DollarSign,
  Users, Star, Loader2, Search, ThumbsUp, ThumbsDown, RefreshCw,
  Coins, TrendingUp, Wallet, ArrowDownToLine, Gift, AlertCircle
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

const STATUS_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: "검토 대기", color: "bg-slate-500/20 text-slate-400 border-slate-500/30", icon: <Clock className="w-3.5 h-3.5" /> },
  verified: { label: "인증 완료", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  fee_paid: { label: "비용 납부", color: "bg-purple-500/20 text-purple-400 border-purple-500/30", icon: <DollarSign className="w-3.5 h-3.5" /> },
  voting: { label: "투표 진행 중", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: <Users className="w-3.5 h-3.5" /> },
  approved: { label: "상장 승인", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  rejected: { label: "상장 거절", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: <XCircle className="w-3.5 h-3.5" /> },
  listed: { label: "상장 완료", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: <Star className="w-3.5 h-3.5" /> },
};

const STEPS = [
  { key: "draft", label: "신청 접수" },
  { key: "verified", label: "인증 완료" },
  { key: "fee_paid", label: "비용 납부" },
  { key: "voting", label: "투표 진행" },
  { key: "approved", label: "상장 완료" },
];

const REWARD_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: "지급 대기", color: "text-amber-400" },
  approved: { label: "승인됨", color: "text-blue-400" },
  paid: { label: "지급 완료", color: "text-green-400" },
  rejected: { label: "거절됨", color: "text-red-400" },
};

const WITHDRAWAL_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: "검토 중", color: "text-amber-400" },
  approved: { label: "승인됨", color: "text-blue-400" },
  completed: { label: "완료", color: "text-green-400" },
  rejected: { label: "거절됨", color: "text-red-400" },
};

function SubmissionCard({ submission }: { submission: any }) {
  const planData = (submission.finalPlanData ?? submission.parsedPlanData) as any;
  const voteStatus = trpc.submissions.getVoteStatus.useQuery({ submissionId: submission.id });
  const voteData = voteStatus.data;
  const totalVotes = voteData?.totalVotes ?? 0;
  const approveVotes = voteData?.approveVotes ?? 0;
  const approvePct = totalVotes > 0 ? Math.round((approveVotes / totalVotes) * 100) : 0;

  const statusInfo = STATUS_LABELS[submission.status] ?? STATUS_LABELS.draft;
  const stepIdx = STEPS.findIndex(s => s.key === submission.status);
  const isRejected = submission.status === "rejected";

  const now = new Date();
  const votingEnd = submission.votingEndAt ? new Date(submission.votingEndAt) : null;
  const daysLeft = votingEnd ? Math.max(0, Math.ceil((votingEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-white font-bold">{planData?.name ?? `신청 #${submission.id}`}</h3>
              <Badge className={`${statusInfo.color} flex items-center gap-1 text-xs`}>
                {statusInfo.icon} {statusInfo.label}
              </Badge>
            </div>
            <p className="text-slate-500 text-xs">신청 ID: #{submission.id} · {new Date(submission.createdAt).toLocaleDateString("ko-KR")}</p>
          </div>
        </div>

        {!isRejected && (
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              {STEPS.map((step, i) => (
                <div key={step.key} className="flex items-center flex-1">
                  <div className="flex-1 flex flex-col items-center gap-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      i < stepIdx ? "bg-amber-500 text-black" :
                      i === stepIdx ? "bg-amber-500 text-black ring-2 ring-amber-500/40" :
                      "bg-slate-700 text-slate-500"
                    }`}>
                      {i < stepIdx ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
                    </div>
                    <span className={`text-[10px] text-center leading-tight ${i <= stepIdx ? "text-amber-400" : "text-slate-600"}`}>
                      {step.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`h-0.5 flex-1 mb-4 ${i < stepIdx ? "bg-amber-500" : "bg-slate-700"}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {isRejected && submission.adminNote && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm">
            <p className="text-red-400 font-medium mb-1">거절 사유</p>
            <p className="text-slate-300">{submission.adminNote}</p>
          </div>
        )}

        {(submission.status === "voting" || submission.status === "approved" || submission.status === "rejected") && totalVotes > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-green-400 flex items-center gap-1">
                <ThumbsUp className="w-3 h-3" /> 찬성 {approveVotes}표 ({approvePct}%)
              </span>
              <span className="text-red-400 flex items-center gap-1">
                {totalVotes - approveVotes}표 <ThumbsDown className="w-3 h-3" /> 반대
              </span>
            </div>
            <Progress value={approvePct} className="h-1.5 bg-slate-700" />
            <div className="flex justify-between text-xs text-slate-500">
              <span>총 {totalVotes}표 참여</span>
              {submission.status === "voting" && votingEnd && (
                <span className="text-amber-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {daysLeft}일 남음
                </span>
              )}
            </div>
          </div>
        )}

        {submission.feeDistributed && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 space-y-1">
            <p className="text-green-400 font-medium text-sm flex items-center gap-1">
              <DollarSign className="w-4 h-4" /> 상장비용 분배 완료
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-slate-300">노드 분배: <span className="text-green-400 font-medium">{submission.nodeDistributionUsdt ?? "—"} USDT</span></div>
              <div className="text-slate-300">운영비: <span className="text-amber-400 font-medium">{submission.platformFeeUsdt ?? "—"} USDT</span></div>
            </div>
          </div>
        )}

        {planData && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="bg-slate-700/50 rounded-lg p-2 text-center">
              <div className="text-slate-400 text-xs">Daily Return</div>
              <div className="text-amber-400 font-bold text-sm">{planData.dailyRate ?? "0"}%</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-2 text-center">
              <div className="text-slate-400 text-xs">최소 투자</div>
              <div className="text-white font-bold text-sm">{planData.minAmount ?? "0"} USDT</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function WithdrawalDialog({ pendingBalance, onSuccess }: { pendingBalance: number; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [wallet, setWallet] = useState("");
  const [network, setNetwork] = useState<"BSC" | "TRC20" | "ERC20">("BSC");

  const requestWithdrawal = trpc.rewards.requestWithdrawal.useMutation({
    onSuccess: () => {
      toast.success("출금 신청이 접수되었습니다. 어드민 검토 후 처리됩니다.");
      setOpen(false);
      setAmount("");
      setWallet("");
      onSuccess();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return toast.error("출금 금액을 입력해주세요.");
    if (amt > pendingBalance) return toast.error(`미지급 잔액(${pendingBalance.toFixed(2)} USDT)을 초과합니다.`);
    if (!wallet || wallet.length < 10) return toast.error("지갑 주소를 입력해주세요.");
    requestWithdrawal.mutate({ amountUsdt: amt, walletAddress: wallet, network });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          disabled={pendingBalance <= 0}
          className="bg-amber-500 hover:bg-amber-600 text-black font-bold"
        >
          <ArrowDownToLine className="w-4 h-4 mr-2" /> 출금 신청
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-amber-400" /> USDT 출금 신청
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm">
            <p className="text-amber-400 font-medium">출금 가능 잔액</p>
            <p className="text-2xl font-bold text-white mt-1">{pendingBalance.toFixed(2)} <span className="text-amber-400 text-base">USDT</span></p>
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">출금 금액 (USDT)</Label>
            <Input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder={`최대 ${pendingBalance.toFixed(2)} USDT`}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">네트워크</Label>
            <Select value={network} onValueChange={(v) => setNetwork(v as any)}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="BSC">BSC (BEP-20)</SelectItem>
                <SelectItem value="TRC20">TRC20 (TRON)</SelectItem>
                <SelectItem value="ERC20">ERC20 (Ethereum)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">수령 지갑 주소</Label>
            <Input
              value={wallet}
              onChange={e => setWallet(e.target.value)}
              placeholder="0x... 또는 T..."
              className="bg-slate-700 border-slate-600 text-white font-mono text-sm"
            />
          </div>
          <div className="bg-slate-700/50 rounded-lg p-3 text-xs text-slate-400 space-y-1">
            <p className="flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 text-amber-400" /> 출금 신청 후 어드민 검토(1~3 영업일)가 필요합니다.</p>
            <p>지갑 주소와 네트워크를 정확히 입력하세요. 오입력 시 복구가 불가합니다.</p>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={requestWithdrawal.isPending}
            className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold"
          >
            {requestWithdrawal.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowDownToLine className="w-4 h-4 mr-2" />}
            출금 신청하기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RewardsSection() {
  const { data: rewardData, isLoading, refetch } = trpc.rewards.myRewards.useQuery();
  const { data: withdrawals, refetch: refetchW } = trpc.rewards.myWithdrawals.useQuery();

  const handleSuccess = () => {
    refetch();
    refetchW();
  };

  if (isLoading) return (
    <div className="flex justify-center py-8">
      <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
    </div>
  );

  const totalEarned = rewardData?.totalEarned ?? 0;
  const pendingBalance = rewardData?.pendingBalance ?? 0;
  const paidBalance = rewardData?.paidBalance ?? 0;
  const rewards = rewardData?.rewards ?? [];

  return (
    <div className="space-y-4">
      {/* 보상 요약 카드 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
          <TrendingUp className="w-5 h-5 text-amber-400 mx-auto mb-2" />
          <div className="text-slate-400 text-xs mb-1">총 누적 보상</div>
          <div className="text-white font-bold text-lg">{totalEarned.toFixed(2)}</div>
          <div className="text-amber-400 text-xs">USDT</div>
        </div>
        <div className="bg-slate-800/50 border border-amber-500/30 rounded-xl p-4 text-center">
          <Coins className="w-5 h-5 text-amber-400 mx-auto mb-2" />
          <div className="text-slate-400 text-xs mb-1">출금 가능</div>
          <div className="text-amber-400 font-bold text-lg">{pendingBalance.toFixed(2)}</div>
          <div className="text-amber-400 text-xs">USDT</div>
        </div>
        <div className="bg-slate-800/50 border border-green-500/30 rounded-xl p-4 text-center">
          <CheckCircle className="w-5 h-5 text-green-400 mx-auto mb-2" />
          <div className="text-slate-400 text-xs mb-1">지급 완료</div>
          <div className="text-green-400 font-bold text-lg">{paidBalance.toFixed(2)}</div>
          <div className="text-green-400 text-xs">USDT</div>
        </div>
      </div>

      {/* 보상 안내 */}
      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Gift className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-400 font-medium text-sm mb-1">투표 보상 시스템</p>
            <p className="text-slate-300 text-xs leading-relaxed">
              골든 컬렉션 상장 투표에 참여하면 상장비용의 <strong className="text-amber-400">60%</strong>를 투표 참여 노드들이 균등 분배합니다.
              상장비용 500 USDT 기준, 투표자 10명 참여 시 1인당 <strong className="text-amber-400">30 USDT</strong> 보상.
            </p>
          </div>
        </div>
      </div>

      {/* 출금 신청 버튼 */}
      <div className="flex justify-end">
        <WithdrawalDialog pendingBalance={pendingBalance} onSuccess={handleSuccess} />
      </div>

      {/* 보상 내역 */}
      {rewards.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-slate-300 font-medium text-sm flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-400" /> 보상 내역 ({rewards.length}건)
          </h3>
          {rewards.map((r: any) => (
            <div key={r.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {r.submissionTitle ? `${r.submissionTitle} 상장 투표` : `신청 #${r.submissionId} 투표 참여`}
                </p>
                <p className="text-slate-500 text-xs mt-0.5">
                  {new Date(r.createdAt).toLocaleDateString("ko-KR")}
                  {r.paidAt && ` · 지급: ${new Date(r.paidAt).toLocaleDateString("ko-KR")}`}
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-amber-400 font-bold">+{parseFloat(r.rewardUsdt).toFixed(2)} USDT</div>
                <div className={`text-xs ${REWARD_STATUS[r.status]?.color ?? "text-slate-400"}`}>
                  {REWARD_STATUS[r.status]?.label ?? r.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-slate-800/30 rounded-xl border border-slate-700/50">
          <Coins className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">아직 투표 보상이 없습니다</p>
          <p className="text-slate-500 text-xs mt-1">골든 컬렉션 투표에 참여하면 USDT 보상을 받을 수 있습니다</p>
          <Button
            onClick={() => window.location.href = "/vote"}
            className="mt-4 bg-amber-500 hover:bg-amber-600 text-black font-bold"
            size="sm"
          >
            <Users className="w-4 h-4 mr-2" /> 투표 참여하기
          </Button>
        </div>
      )}

      {/* 출금 내역 */}
      {withdrawals && withdrawals.length > 0 && (
        <div className="space-y-2 mt-4">
          <h3 className="text-slate-300 font-medium text-sm flex items-center gap-2">
            <ArrowDownToLine className="w-4 h-4 text-amber-400" /> 출금 내역 ({withdrawals.length}건)
          </h3>
          {withdrawals.map((w: any) => (
            <div key={w.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">{w.network} 출금 신청</p>
                <p className="text-slate-500 text-xs mt-0.5 font-mono truncate">{w.walletAddress}</p>
                <p className="text-slate-500 text-xs">{new Date(w.createdAt).toLocaleDateString("ko-KR")}</p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-white font-bold">{parseFloat(w.amountUsdt).toFixed(2)} USDT</div>
                <div className={`text-xs ${WITHDRAWAL_STATUS[w.status]?.color ?? "text-slate-400"}`}>
                  {WITHDRAWAL_STATUS[w.status]?.label ?? w.status}
                </div>
                {w.txHash && (
                  <p className="text-slate-600 text-[10px] font-mono truncate max-w-[120px]">{w.txHash}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MySubmissions() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"submissions" | "rewards">("submissions");
  const [email, setEmail] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("email") ?? "";
  });
  const [searchEmail, setSearchEmail] = useState(email);
  const [searched, setSearched] = useState(!!email);

  const { data: submissions, isLoading, refetch } = trpc.submissions.listByEmail.useQuery(
    { email: searchEmail },
    { enabled: searched && !!searchEmail }
  );

  const handleSearch = () => {
    if (!email) return toast.error("이메일을 입력해주세요.");
    setSearchEmail(email);
    setSearched(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-1.5 text-amber-400 text-sm font-medium mb-4">
            <FileText className="w-4 h-4" /> 마이페이지
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">내 활동 현황</h1>
          <p className="text-slate-400 text-sm">신청 현황과 투표 보상을 한눈에 확인하세요</p>
        </div>

        {/* 탭 */}
        <div className="flex bg-slate-800/50 border border-slate-700 rounded-xl p-1 mb-6">
          <button
            onClick={() => setActiveTab("submissions")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "submissions"
                ? "bg-amber-500 text-black"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FileText className="w-4 h-4" /> 플랜 신청 현황
          </button>
          <button
            onClick={() => setActiveTab("rewards")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "rewards"
                ? "bg-amber-500 text-black"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Coins className="w-4 h-4" /> 투표 보상
            {user && <span className="bg-amber-500/20 text-amber-400 text-xs px-1.5 py-0.5 rounded-full">NEW</span>}
          </button>
        </div>

        {/* 플랜 신청 현황 탭 */}
        {activeTab === "submissions" && (
          <div>
            <Card className="bg-slate-800/50 border-slate-700 mb-6">
              <CardContent className="p-4">
                <div className="flex gap-2">
                  <Input
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSearch()}
                    placeholder="신청 시 사용한 이메일 주소"
                    type="email"
                    className="bg-slate-700 border-slate-600 text-white flex-1"
                  />
                  <Button onClick={handleSearch} className="bg-amber-500 hover:bg-amber-600 text-black font-bold shrink-0">
                    <Search className="w-4 h-4 mr-1" /> 조회
                  </Button>
                  {searched && (
                    <Button onClick={() => refetch()} variant="outline" className="border-slate-600 text-slate-300 shrink-0" size="icon">
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {!searched ? (
              <div className="text-center py-16">
                <Search className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">이메일을 입력하여 신청 현황을 조회하세요</p>
              </div>
            ) : isLoading ? (
              <div className="text-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto mb-3" />
                <p className="text-slate-400">조회 중...</p>
              </div>
            ) : !submissions?.length ? (
              <div className="text-center py-16">
                <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">해당 이메일로 등록된 신청이 없습니다</p>
                <Button
                  onClick={() => window.location.href = "/submit-plan"}
                  className="mt-4 bg-amber-500 hover:bg-amber-600 text-black font-bold"
                >
                  플랜 신청하기
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-slate-400 text-sm">총 <strong className="text-white">{submissions.length}건</strong>의 신청</p>
                  <Button
                    onClick={() => window.location.href = "/submit-plan"}
                    size="sm"
                    className="bg-amber-500 hover:bg-amber-600 text-black font-bold"
                  >
                    + 새 신청
                  </Button>
                </div>
                {submissions.map(s => <SubmissionCard key={s.id} submission={s} />)}
              </div>
            )}
          </div>
        )}

        {/* 투표 보상 탭 */}
        {activeTab === "rewards" && (
          <div>
            {!user ? (
              <div className="text-center py-16 bg-slate-800/30 rounded-xl border border-slate-700/50">
                <Coins className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-300 font-medium mb-1">로그인이 필요합니다</p>
                <p className="text-slate-500 text-sm mb-4">투표 보상을 확인하려면 로그인해주세요</p>
                <Button
                  onClick={() => window.location.href = "/vote"}
                  className="bg-amber-500 hover:bg-amber-600 text-black font-bold"
                >
                  <Users className="w-4 h-4 mr-2" /> 투표 페이지로 이동
                </Button>
              </div>
            ) : (
              <RewardsSection />
            )}
          </div>
        )}

        {/* 하단 링크 */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-slate-500 text-sm">투표에 참여하고 싶으신가요?</p>
          <Button
            onClick={() => window.location.href = "/vote"}
            variant="outline"
            className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
          >
            <Users className="w-4 h-4 mr-2" /> 노드 투표 페이지로 이동
          </Button>
        </div>
      </div>
    </div>
  );
}
