import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  FileText, Clock, CheckCircle, XCircle, DollarSign,
  Users, Star, Loader2, Search, ThumbsUp, ThumbsDown, RefreshCw
} from "lucide-react";

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
        {/* 헤더 */}
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

        {/* 진행 단계 */}
        {!isRejected && (
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              {STEPS.map((step, i) => (
                <div key={step.key} className="flex items-center flex-1">
                  <div className={`flex-1 flex flex-col items-center gap-1`}>
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

        {/* 투표 현황 */}
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

        {/* 수수료 분배 내역 */}
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

        {/* 플랜 정보 요약 */}
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

export default function MySubmissions() {
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
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-1.5 text-amber-400 text-sm font-medium mb-4">
            <FileText className="w-4 h-4" /> 내 신청 현황
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">마이페이지</h1>
          <p className="text-slate-400 text-sm">신청 이메일로 조회하면 신청 현황과 투표 결과를 확인할 수 있습니다</p>
        </div>

        {/* 이메일 검색 */}
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

        {/* 결과 */}
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
