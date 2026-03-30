import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle, XCircle, Clock, Users, DollarSign, Star,
  Settings, Loader2, ThumbsUp, ThumbsDown, Play, RefreshCw, ChevronDown, ChevronUp
} from "lucide-react";
import AdminLayout from "@/components/AdminLayout";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "검토 대기", color: "bg-slate-500/20 text-slate-400" },
  verified: { label: "인증 완료", color: "bg-blue-500/20 text-blue-400" },
  fee_paid: { label: "비용 납부", color: "bg-purple-500/20 text-purple-400" },
  voting: { label: "투표 진행 중", color: "bg-amber-500/20 text-amber-400" },
  approved: { label: "상장 승인", color: "bg-green-500/20 text-green-400" },
  rejected: { label: "상장 거절", color: "bg-red-500/20 text-red-400" },
  listed: { label: "상장 완료", color: "bg-emerald-500/20 text-emerald-400" },
};

function SubmissionRow({ submission, onRefresh }: { submission: any; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [adminNote, setAdminNote] = useState(submission.adminNote ?? "");
  const [processing, setProcessing] = useState(false);

  const voteStatus = trpc.submissions.getVoteStatus.useQuery({ submissionId: submission.id });
  const updateStatus = trpc.submissions.adminUpdateStatus.useMutation({
    onSuccess: () => { onRefresh(); toast.success("상태가 업데이트되었습니다."); },
    onError: (e: any) => toast.error(e.message),
  });
  const startVoting = trpc.submissions.adminUpdateStatus.useMutation({
    onSuccess: () => { onRefresh(); toast.success("투표가 시작되었습니다!"); },
    onError: (e: any) => toast.error(e.message),
  });
  const distributeFee = trpc.submissions.distributeListingFee.useMutation({
    onSuccess: () => { onRefresh(); toast.success("수수료 분배가 완료되었습니다!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const planData = (submission.finalPlanData ?? submission.parsedPlanData) as any;
  const voteData = voteStatus.data;
  const totalVotes = voteData?.totalVotes ?? 0;
  const approveVotes = voteData?.approveVotes ?? 0;
  const approvePct = totalVotes > 0 ? Math.round((approveVotes / totalVotes) * 100) : 0;
  const statusInfo = STATUS_LABELS[submission.status] ?? STATUS_LABELS.draft;

  const handleAction = async (action: string) => {
    setProcessing(true);
    try {
      if (action === "start_voting") {
        await startVoting.mutateAsync({ submissionId: submission.id, status: "voting" });
      } else if (action === "approve") {
        await updateStatus.mutateAsync({ submissionId: submission.id, status: "approved", adminNote });
      } else if (action === "reject") {
        if (!adminNote) return toast.error("거절 사유를 입력해주세요.");
        await updateStatus.mutateAsync({ submissionId: submission.id, status: "rejected", adminNote });
      } else if (action === "list") {
        await updateStatus.mutateAsync({ submissionId: submission.id, status: "listed", adminNote });
      } else if (action === "distribute") {
        await distributeFee.mutateAsync({ submissionId: submission.id });
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-white font-bold">{planData?.name ?? `신청 #${submission.id}`}</span>
              <Badge className={`${statusInfo.color} text-xs`}>{statusInfo.label}</Badge>
              {submission.feeDistributed && (
                <Badge className="bg-green-500/20 text-green-400 text-xs">분배 완료</Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-slate-400">
              <span>신청자: {submission.applicantName}</span>
              <span>{submission.applicantEmail}</span>
              {submission.applicantTelegram && <span>TG: {submission.applicantTelegram}</span>}
              <span>{new Date(submission.createdAt).toLocaleDateString("ko-KR")}</span>
            </div>
          </div>
          <button onClick={() => setExpanded(!expanded)} className="text-slate-400 hover:text-white transition-colors">
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {/* 투표 현황 (간략) */}
        {totalVotes > 0 && (
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-green-400">{approveVotes}표 찬성 ({approvePct}%)</span>
              <span className="text-red-400">{totalVotes - approveVotes}표 반대</span>
            </div>
            <Progress value={approvePct} className="h-1 bg-slate-700" />
          </div>
        )}

        {expanded && (
          <div className="mt-4 space-y-4 border-t border-slate-700 pt-4">
            {/* 플랜 데이터 */}
            {planData && (
              <div className="bg-slate-700/30 rounded-lg p-3 text-sm space-y-1">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-slate-400">Daily Rate: <span className="text-amber-400">{planData.dailyRate}%</span></div>
                  <div className="text-slate-400">최소 투자: <span className="text-white">{planData.minAmount} USDT</span></div>
                </div>
                {planData.description && <p className="text-slate-300 text-xs mt-1">{planData.description}</p>}
              </div>
            )}

            {/* 어드민 메모 */}
            <div>
              <label className="text-slate-300 text-xs mb-1 block">어드민 메모 / 거절 사유</label>
              <Textarea
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                placeholder="승인/거절 사유 또는 메모"
                className="bg-slate-700 border-slate-600 text-white text-sm resize-none h-16"
              />
            </div>

            {/* 액션 버튼 */}
            <div className="flex flex-wrap gap-2">
              {submission.status === "fee_paid" && (
                <Button onClick={() => handleAction("start_voting")} disabled={processing}
                  className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-sm">
                  {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Play className="w-3.5 h-3.5 mr-1" />}
                  투표 시작
                </Button>
              )}
              {submission.status === "voting" && (
                <>
                  <Button onClick={() => handleAction("approve")} disabled={processing}
                    className="bg-green-600 hover:bg-green-700 text-white text-sm">
                    <CheckCircle className="w-3.5 h-3.5 mr-1" /> 상장 승인
                  </Button>
                  <Button onClick={() => handleAction("reject")} disabled={processing}
                    variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10 text-sm">
                    <XCircle className="w-3.5 h-3.5 mr-1" /> 상장 거절
                  </Button>
                </>
              )}
              {submission.status === "approved" && (
                <Button onClick={() => handleAction("list")} disabled={processing}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm">
                  <Star className="w-3.5 h-3.5 mr-1" /> 정식 상장 처리
                </Button>
              )}
              {(submission.status === "approved" || submission.status === "listed") && !submission.feeDistributed && (
                <Button onClick={() => handleAction("distribute")} disabled={processing}
                  variant="outline" className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10 text-sm">
                  <DollarSign className="w-3.5 h-3.5 mr-1" /> 수수료 분배 실행
                </Button>
              )}
              {["draft", "verified"].includes(submission.status) && (
                <Button onClick={() => handleAction("reject")} disabled={processing}
                  variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10 text-sm">
                  <XCircle className="w-3.5 h-3.5 mr-1" /> 거절
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminSubmissions() {
  const [filter, setFilter] = useState<string>("all");
  const [showSettings, setShowSettings] = useState(false);
  const [listingFee, setListingFee] = useState("");
  const [platformFee, setPlatformFee] = useState("");
  const [votingDays, setVotingDays] = useState("");
  const [approvalPct, setApprovalPct] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  const { data: submissions, isLoading, refetch } = trpc.submissions.adminList.useQuery();
  const { data: settings, refetch: refetchSettings } = trpc.submissions.getSettings.useQuery();
  const updateSettings = trpc.submissions.adminUpdateSettings.useMutation({
    onSuccess: () => { refetchSettings(); toast.success("설정이 저장되었습니다."); setShowSettings(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = submissions?.filter(s => filter === "all" || s.status === filter) ?? [];

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await updateSettings.mutateAsync({
        listingFeeUsdt: listingFee ? listingFee : undefined,
        platformFeePct: platformFee ? parseInt(platformFee) : undefined,
        votingPeriodDays: votingDays ? parseInt(votingDays) : undefined,
        approvalThresholdPct: approvalPct ? parseInt(approvalPct) : undefined,
      });
    } finally {
      setSavingSettings(false);
    }
  };

  const counts = {
    all: submissions?.length ?? 0,
    draft: submissions?.filter(s => s.status === "draft").length ?? 0,
    fee_paid: submissions?.filter(s => s.status === "fee_paid").length ?? 0,
    voting: submissions?.filter(s => s.status === "voting").length ?? 0,
    approved: submissions?.filter(s => s.status === "approved" || s.status === "listed").length ?? 0,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">골든 컬렉션 신청 관리</h1>
            <p className="text-slate-400 text-sm mt-1">플랜 상장 신청 검토, 투표 시작, 수수료 분배를 관리합니다</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => refetch()} variant="outline" className="border-slate-600 text-slate-300" size="icon">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button onClick={() => setShowSettings(!showSettings)} variant="outline" className="border-slate-600 text-slate-300">
              <Settings className="w-4 h-4 mr-2" /> 설정
            </Button>
          </div>
        </div>

        {/* 설정 패널 */}
        {showSettings && (
          <Card className="bg-slate-800/50 border-amber-500/30">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-400" /> 상장 시스템 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-slate-300 text-sm mb-1.5 block">상장비용 (USDT)</label>
                <Input
                  value={listingFee || (settings?.listingFeeUsdt?.toString() ?? "500")}
                  onChange={e => setListingFee(e.target.value)}
                  type="number"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <label className="text-slate-300 text-sm mb-1.5 block">플랫폼 수수료 (%)</label>
                <Input
                  value={platformFee || (settings?.platformFeePct?.toString() ?? "40")}
                  onChange={e => setPlatformFee(e.target.value)}
                  type="number"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <label className="text-slate-300 text-sm mb-1.5 block">투표 기간 (일)</label>
                <Input
                  value={votingDays || (settings?.votingPeriodDays?.toString() ?? "7")}
                  onChange={e => setVotingDays(e.target.value)}
                  type="number"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <label className="text-slate-300 text-sm mb-1.5 block">상장 승인 기준 (%)</label>
                <Input
                  value={approvalPct || (settings?.approvalThresholdPct?.toString() ?? "60")}
                  onChange={e => setApprovalPct(e.target.value)}
                  type="number"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="col-span-2 flex justify-end gap-2">
                <Button onClick={() => setShowSettings(false)} variant="outline" className="border-slate-600 text-slate-300">취소</Button>
                <Button onClick={handleSaveSettings} disabled={savingSettings} className="bg-amber-500 hover:bg-amber-600 text-black font-bold">
                  {savingSettings ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} 저장
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 현재 설정 요약 */}
        {settings && (
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "상장비용", value: `${settings.listingFeeUsdt} USDT`, icon: <DollarSign className="w-4 h-4" />, color: "text-amber-400" },
              { label: "플랫폼 수수료", value: `${settings.platformFeePct}%`, icon: <Star className="w-4 h-4" />, color: "text-purple-400" },
              { label: "노드 분배", value: `${100 - settings.platformFeePct}%`, icon: <Users className="w-4 h-4" />, color: "text-green-400" },
              { label: "투표 기간", value: `${settings.votingPeriodDays}일`, icon: <Clock className="w-4 h-4" />, color: "text-blue-400" },
            ].map(item => (
              <Card key={item.label} className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-3 text-center">
                  <div className={`${item.color} flex justify-center mb-1`}>{item.icon}</div>
                  <div className={`font-bold ${item.color}`}>{item.value}</div>
                  <div className="text-slate-400 text-xs">{item.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 필터 탭 */}
        <div className="flex gap-2 flex-wrap">
          {[
            { key: "all", label: `전체 (${counts.all})` },
            { key: "draft", label: `검토 대기 (${counts.draft})` },
            { key: "fee_paid", label: `비용 납부 (${counts.fee_paid})` },
            { key: "voting", label: `투표 중 (${counts.voting})` },
            { key: "approved", label: `승인됨 (${counts.approved})` },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                filter === f.key ? "bg-amber-500 text-black" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* 신청 목록 */}
        {isLoading ? (
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto mb-3" />
            <p className="text-slate-400">로딩 중...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-400">해당 상태의 신청이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(s => <SubmissionRow key={s.id} submission={s} onRefresh={refetch} />)}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
