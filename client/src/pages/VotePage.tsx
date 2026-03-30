import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  ThumbsUp, ThumbsDown, Clock, Users, CheckCircle, XCircle,
  Star, FileText, Loader2, Lock, ChevronDown, ChevronUp
} from "lucide-react";
import { getLoginUrl } from "@/const";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "검토 대기", color: "bg-slate-500/20 text-slate-400" },
  verified: { label: "인증 완료", color: "bg-blue-500/20 text-blue-400" },
  fee_paid: { label: "비용 납부", color: "bg-purple-500/20 text-purple-400" },
  voting: { label: "투표 진행 중", color: "bg-amber-500/20 text-amber-400" },
  approved: { label: "상장 승인", color: "bg-green-500/20 text-green-400" },
  rejected: { label: "상장 거절", color: "bg-red-500/20 text-red-400" },
  listed: { label: "상장 완료", color: "bg-emerald-500/20 text-emerald-400" },
};

function VoteCard({ submission }: { submission: any }) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [comment, setComment] = useState("");
  const [voting, setVoting] = useState(false);

  const voteStatus = trpc.submissions.getVoteStatus.useQuery({ submissionId: submission.id });
  const voteMutation = trpc.submissions.vote.useMutation({
    onSuccess: () => {
      voteStatus.refetch();
      toast.success("투표가 완료되었습니다!");
      setComment("");
    },
    onError: (e) => toast.error(e.message),
  });

  const planData = (submission.finalPlanData ?? submission.parsedPlanData) as any;
  const voteData = voteStatus.data;
  const totalVotes = voteData?.totalVotes ?? 0;
  const approveVotes = voteData?.approveVotes ?? 0;
  const rejectVotes = voteData?.rejectVotes ?? 0;
  const approvePct = totalVotes > 0 ? Math.round((approveVotes / totalVotes) * 100) : 0;

  // 투표 마감 여부
  const now = new Date();
  const votingEnd = submission.votingEndAt ? new Date(submission.votingEndAt) : null;
  const isVotingOpen = submission.status === "voting" && (!votingEnd || votingEnd > now);
  const daysLeft = votingEnd ? Math.max(0, Math.ceil((votingEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;

  const handleVote = async (vote: "approve" | "reject") => {
    if (!user) return toast.error("투표하려면 로그인이 필요합니다.");
    setVoting(true);
    try {
      await voteMutation.mutateAsync({ submissionId: submission.id, vote, comment: comment || undefined });
    } finally {
      setVoting(false);
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
      <CardContent className="p-5">
        {/* 헤더 */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-white font-bold text-lg truncate">
                {planData?.name ?? `신청 #${submission.id}`}
              </h3>
              <Badge className={STATUS_LABELS[submission.status]?.color ?? "bg-slate-500/20 text-slate-400"}>
                {STATUS_LABELS[submission.status]?.label ?? submission.status}
              </Badge>
            </div>
            <p className="text-slate-400 text-sm">{planData?.label ?? ""}</p>
            <p className="text-slate-500 text-xs mt-1">신청자: {submission.applicantName}</p>
          </div>
          {planData?.logoUrl && (
            <img src={planData.logoUrl} alt="" className="w-12 h-12 rounded-full shrink-0" />
          )}
        </div>

        {/* 플랜 정보 */}
        {planData && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-slate-700/50 rounded-lg p-2.5 text-center">
              <div className="text-slate-400 text-xs mb-0.5">Daily Return</div>
              <div className="text-amber-400 font-bold">{planData.dailyRate ?? "0"}%</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-2.5 text-center">
              <div className="text-slate-400 text-xs mb-0.5">최소 투자</div>
              <div className="text-white font-bold">{planData.minAmount ?? "0"} USDT</div>
            </div>
          </div>
        )}

        {/* 투표 현황 */}
        {(submission.status === "voting" || submission.status === "approved" || submission.status === "rejected") && (
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-green-400 flex items-center gap-1">
                <ThumbsUp className="w-3.5 h-3.5" /> 찬성 {approveVotes}표 ({approvePct}%)
              </span>
              <span className="text-red-400 flex items-center gap-1">
                {rejectVotes}표 <ThumbsDown className="w-3.5 h-3.5" /> 반대
              </span>
            </div>
            <Progress value={approvePct} className="h-2 bg-slate-700" />
            <div className="flex justify-between text-xs text-slate-500">
              <span>총 {totalVotes}표</span>
              {isVotingOpen && <span className="flex items-center gap-1 text-amber-400"><Clock className="w-3 h-3" /> {daysLeft}일 남음</span>}
            </div>
          </div>
        )}

        {/* 상세 토글 */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-slate-400 hover:text-slate-300 text-sm transition-colors mb-3"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {expanded ? "상세 정보 접기" : "상세 정보 보기"}
        </button>

        {expanded && planData?.description && (
          <div className="bg-slate-700/30 rounded-lg p-3 mb-4">
            <p className="text-slate-300 text-sm">{planData.description}</p>
            {planData.badgeLabels?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {planData.badgeLabels.map((b: string) => (
                  <Badge key={b} variant="outline" className="text-xs border-slate-600 text-slate-400">{b}</Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 투표 버튼 */}
        {isVotingOpen && (
          <div className="space-y-3">
            {user ? (
              <>
                <Textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="투표 의견 (선택사항)"
                  className="bg-slate-700 border-slate-600 text-white text-sm resize-none h-16"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleVote("approve")}
                    disabled={voting || voteMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {voting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <ThumbsUp className="w-4 h-4 mr-1" />}
                    찬성
                  </Button>
                  <Button
                    onClick={() => handleVote("reject")}
                    disabled={voting || voteMutation.isPending}
                    variant="outline"
                    className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10"
                  >
                    {voting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <ThumbsDown className="w-4 h-4 mr-1" />}
                    반대
                  </Button>
                </div>
              </>
            ) : (
              <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                <Lock className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                <p className="text-slate-400 text-sm mb-2">노드 보유자만 투표할 수 있습니다</p>
                <Button
                  onClick={() => window.location.href = getLoginUrl()}
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600 text-black font-bold"
                >
                  로그인하여 투표
                </Button>
              </div>
            )}
          </div>
        )}

        {submission.status === "approved" && (
          <div className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 rounded-lg p-2.5">
            <CheckCircle className="w-4 h-4" /> 상장 승인 완료
          </div>
        )}
        {submission.status === "rejected" && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 rounded-lg p-2.5">
            <XCircle className="w-4 h-4" /> 상장 거절
            {submission.adminNote && <span className="text-slate-400">: {submission.adminNote}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function VotePage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<"all" | "voting" | "approved" | "rejected">("all");

  const { data: submissions, isLoading } = trpc.submissions.listPublic.useQuery();

  const filtered = submissions?.filter(s => {
    if (filter === "all") return true;
    return s.status === filter;
  }) ?? [];

  const votingCount = submissions?.filter(s => s.status === "voting").length ?? 0;
  const approvedCount = submissions?.filter(s => s.status === "approved" || s.status === "listed").length ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-1.5 text-amber-400 text-sm font-medium mb-4">
            <Star className="w-4 h-4" /> 골든 컬렉션 투표
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">노드 투표</h1>
          <p className="text-slate-400 text-sm">알파백 노드 보유자는 신규 플랜 상장에 투표하고 상장비용을 분배받습니다</p>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "투표 진행 중", value: votingCount, icon: <Clock className="w-5 h-5" />, color: "text-amber-400" },
            { label: "상장 승인", value: approvedCount, icon: <CheckCircle className="w-5 h-5" />, color: "text-green-400" },
            { label: "전체 신청", value: submissions?.length ?? 0, icon: <FileText className="w-5 h-5" />, color: "text-blue-400" },
          ].map(stat => (
            <Card key={stat.label} className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 text-center">
                <div className={`${stat.color} flex justify-center mb-1`}>{stat.icon}</div>
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-slate-400 text-xs">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 노드 보유자 안내 */}
        {!user && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-amber-300 font-medium text-sm">노드 보유자 전용 투표</p>
              <p className="text-slate-400 text-xs mt-0.5">로그인 후 노드 보유 여부가 확인되면 투표에 참여할 수 있습니다</p>
            </div>
            <Button
              onClick={() => window.location.href = getLoginUrl()}
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-black font-bold shrink-0"
            >
              로그인
            </Button>
          </div>
        )}

        {/* 필터 탭 */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { key: "all", label: "전체" },
            { key: "voting", label: "투표 중" },
            { key: "approved", label: "승인됨" },
            { key: "rejected", label: "거절됨" },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as any)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                filter === f.key
                  ? "bg-amber-500 text-black"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* 신청 목록 */}
        {isLoading ? (
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto mb-3" />
            <p className="text-slate-400">로딩 중...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">현재 투표 가능한 신청이 없습니다</p>
            <p className="text-slate-500 text-sm mt-1">새로운 플랜을 신청해보세요!</p>
            <Button
              onClick={() => window.location.href = "/submit-plan"}
              className="mt-4 bg-amber-500 hover:bg-amber-600 text-black font-bold"
            >
              플랜 신청하기
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(s => <VoteCard key={s.id} submission={s} />)}
          </div>
        )}
      </div>
    </div>
  );
}
