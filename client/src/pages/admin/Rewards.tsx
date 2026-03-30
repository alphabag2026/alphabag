import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Coins, CheckCircle, XCircle, Loader2, RefreshCw,
  DollarSign, Users, ArrowDownToLine, TrendingUp, Search
} from "lucide-react";

const REWARD_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: "지급 대기", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  approved: { label: "승인됨", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  paid: { label: "지급 완료", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  rejected: { label: "거절됨", color: "bg-red-500/20 text-red-400 border-red-500/30" },
};

const WITHDRAWAL_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: "검토 중", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  approved: { label: "승인됨", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  completed: { label: "완료", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  rejected: { label: "거절됨", color: "bg-red-500/20 text-red-400 border-red-500/30" },
};

export default function AdminRewards() {
  const [activeTab, setActiveTab] = useState<"rewards" | "withdrawals">("rewards");
  const [txHash, setTxHash] = useState<Record<number, string>>({});

  const { data: adminData, isLoading: rewardsLoading, refetch: refetchRewards } = trpc.rewards.adminList.useQuery();
  const rewards = adminData?.rewards ?? [];
  const withdrawals = adminData?.withdrawals ?? [];
  const refetchWithdrawals = refetchRewards;

  const processWithdrawal = trpc.rewards.adminProcessWithdrawal.useMutation({
    onSuccess: () => { toast.success("출금 신청이 처리되었습니다."); refetchRewards(); },
    onError: (e: any) => toast.error(e.message),
  });

  const distributeRewards = trpc.rewards.adminDistributeRewards.useMutation({
    onSuccess: () => { toast.success("보상이 분배되었습니다."); refetchRewards(); },
    onError: (e: any) => toast.error(e.message),
  });

  const totalPendingRewards = rewards.filter((r: any) => r.status === "pending").reduce((sum: number, r: any) => sum + parseFloat(r.rewardUsdt), 0);
  const totalPaidRewards = rewards.filter((r: any) => r.status === "paid").reduce((sum: number, r: any) => sum + parseFloat(r.rewardUsdt), 0);
  const pendingWithdrawals = withdrawals.filter((w: any) => w.status === "pending").length;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Coins className="w-6 h-6 text-amber-400" /> 보상 관리
            </h1>
            <p className="text-slate-400 text-sm mt-1">노드 투표 보상 지급 및 출금 신청 관리</p>
          </div>
          <Button
            onClick={() => { refetchRewards(); refetchWithdrawals(); }}
            variant="outline"
            className="border-slate-600 text-slate-300"
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-1" /> 새로고침
          </Button>
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Coins className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">지급 대기 보상</p>
                <p className="text-white font-bold text-lg">{totalPendingRewards.toFixed(2)} <span className="text-amber-400 text-sm">USDT</span></p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">총 지급 완료</p>
                <p className="text-white font-bold text-lg">{totalPaidRewards.toFixed(2)} <span className="text-green-400 text-sm">USDT</span></p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <ArrowDownToLine className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">출금 신청 대기</p>
                <p className="text-white font-bold text-lg">{pendingWithdrawals} <span className="text-blue-400 text-sm">건</span></p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 탭 */}
        <div className="flex bg-slate-800/50 border border-slate-700 rounded-xl p-1">
          <button
            onClick={() => setActiveTab("rewards")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "rewards" ? "bg-amber-500 text-black" : "text-slate-400 hover:text-white"
            }`}
          >
            <Coins className="w-4 h-4" /> 보상 내역 ({rewards?.length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab("withdrawals")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "withdrawals" ? "bg-amber-500 text-black" : "text-slate-400 hover:text-white"
            }`}
          >
            <ArrowDownToLine className="w-4 h-4" /> 출금 신청
            {pendingWithdrawals > 0 && (
              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingWithdrawals}</span>
            )}
          </button>
        </div>

        {/* 보상 내역 탭 */}
        {activeTab === "rewards" && (
          <div className="space-y-3">
            {rewardsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-400" /></div>
            ) : !rewards?.length ? (
              <div className="text-center py-12 text-slate-400">
                <Coins className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p>보상 내역이 없습니다</p>
              </div>
            ) : (
              rewards.map(r => (
                <Card key={r.id} className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-white font-medium text-sm">
                            신청 #{r.submissionId} 투표 보상
                          </span>
                          <Badge className={`${REWARD_STATUS[r.status]?.color ?? ""} text-xs`}>
                            {REWARD_STATUS[r.status]?.label ?? r.status}
                          </Badge>
                        </div>
                        <p className="text-slate-400 text-xs">
                          사용자: {r.userId} · {new Date(r.createdAt).toLocaleDateString("ko-KR")}
                        </p>

                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-amber-400 font-bold text-lg">{parseFloat(r.rewardUsdt).toFixed(2)} USDT</div>
                        <div className="flex gap-1 mt-2 justify-end">
                          {r.status === "pending" && (
                            <Button
                              size="sm"
                              onClick={() => distributeRewards.mutate({ submissionId: r.submissionId })}
                              disabled={distributeRewards.isPending}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-7 px-2"
                            >
                              <DollarSign className="w-3 h-3 mr-1" /> 보상 지급
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* 출금 신청 탭 */}
        {activeTab === "withdrawals" && (
          <div className="space-y-3">
            {rewardsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-400" /></div>
            ) : !withdrawals.length ? (
              <div className="text-center py-12 text-slate-400">
                <ArrowDownToLine className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p>출금 신청이 없습니다</p>
              </div>
            ) : (
              withdrawals.map(w => (
                <Card key={w.id} className={`border-slate-700 ${w.status === "pending" ? "bg-amber-500/5 border-amber-500/20" : "bg-slate-800/50"}`}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-white font-medium text-sm">출금 신청 #{w.id}</span>
                          <Badge className={`${WITHDRAWAL_STATUS[w.status]?.color ?? ""} text-xs`}>
                            {WITHDRAWAL_STATUS[w.status]?.label ?? w.status}
                          </Badge>
                          <Badge className="bg-slate-700 text-slate-300 border-slate-600 text-xs">{w.network}</Badge>
                        </div>
                        <p className="text-slate-400 text-xs">사용자: {w.userId}</p>
                        <p className="text-slate-400 text-xs mt-0.5">신청일: {new Date(w.createdAt).toLocaleDateString("ko-KR")}</p>
                        <div className="mt-2 bg-slate-700/50 rounded-lg p-2">
                          <p className="text-slate-400 text-xs mb-1">수령 지갑 주소</p>
                          <p className="text-white text-xs font-mono break-all">{w.walletAddress}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-white font-bold text-xl">{parseFloat(w.amountUsdt).toFixed(2)}</div>
                        <div className="text-amber-400 text-sm">USDT</div>
                      </div>
                    </div>

                    {w.status === "approved" && (
                      <div className="flex gap-2">
                        <Input
                          value={txHash[w.id] ?? ""}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTxHash(prev => ({ ...prev, [w.id]: e.target.value }))}
                          placeholder="트랜잭션 해시 (선택)"
                          className="bg-slate-700 border-slate-600 text-white text-xs h-8 font-mono"
                        />
                        <Button
                          size="sm"
                          onClick={() => processWithdrawal.mutate({ withdrawalId: w.id, action: "complete", txHash: txHash[w.id] })}
                          disabled={processWithdrawal.isPending}
                          className="bg-green-600 hover:bg-green-700 text-white text-xs h-8 px-3 shrink-0"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" /> 완료 처리
                        </Button>
                      </div>
                    )}

                    {w.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => processWithdrawal.mutate({ withdrawalId: w.id, action: "approve" })}
                          disabled={processWithdrawal.isPending}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 px-3"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" /> 승인
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => processWithdrawal.mutate({ withdrawalId: w.id, action: "reject" })}
                          disabled={processWithdrawal.isPending}
                          variant="outline"
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs h-8 px-3"
                        >
                          <XCircle className="w-3 h-3 mr-1" /> 거절
                        </Button>
                      </div>
                    )}

                    {w.txHash && (
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2">
                        <p className="text-green-400 text-xs font-mono break-all">TX: {w.txHash}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
