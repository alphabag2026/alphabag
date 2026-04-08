import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  ThumbsUp, ThumbsDown, Clock, Users, CheckCircle, XCircle,
  Star, FileText, Loader2, Lock, ChevronDown, ChevronUp, Timer, TrendingUp
} from "lucide-react";
import { getLoginUrl } from "@/const";
import { useTranslation } from "react-i18next";

// 실시간 카운트다운 훅
function useCountdown(endDate: Date | null) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    if (!endDate) return;
    const tick = () => {
      const diff = endDate.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, minutes, seconds });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endDate]);

  return timeLeft;
}

function VoteCard({ submission }: { submission: any }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [comment, setComment] = useState("");
  const [voting, setVoting] = useState(false);

  const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    draft: { label: t("vote.draft"), color: "bg-slate-500/20 text-slate-400" },
    verified: { label: t("vote.verified"), color: "bg-blue-500/20 text-blue-400" },
    fee_paid: { label: t("vote.feePaid"), color: "bg-purple-500/20 text-purple-400" },
    voting: { label: t("vote.voting"), color: "bg-amber-500/20 text-amber-400" },
    approved: { label: t("vote.approved"), color: "bg-green-500/20 text-green-400" },
    rejected: { label: t("vote.rejected"), color: "bg-red-500/20 text-red-400" },
    listed: { label: t("vote.listed"), color: "bg-emerald-500/20 text-emerald-400" },
  };

  const voteStatus = trpc.submissions.getVoteStatus.useQuery({ submissionId: submission.id });
  const voteMutation = trpc.submissions.vote.useMutation({
    onSuccess: () => {
      voteStatus.refetch();
      toast.success(t("vote.voteSuccess"));
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
  const THRESHOLD = 60;

  const now = new Date();
  const votingEnd = submission.votingEndAt ? new Date(submission.votingEndAt) : null;
  const isVotingOpen = submission.status === "voting" && (!votingEnd || votingEnd > now);
  const countdown = useCountdown(isVotingOpen ? votingEnd : null);

  const handleVote = async (vote: "approve" | "reject") => {
    if (!user) return toast.error(t("vote.loginRequired"));
    setVoting(true);
    try {
      await voteMutation.mutateAsync({ submissionId: submission.id, vote, comment: comment || undefined });
    } finally {
      setVoting(false);
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
      <CardContent className="p-3.5 sm:p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-white font-bold text-lg truncate">
                {planData?.name ?? `#${submission.id}`}
              </h3>
              <Badge className={STATUS_LABELS[submission.status]?.color ?? "bg-slate-500/20 text-slate-400"}>
                {STATUS_LABELS[submission.status]?.label ?? submission.status}
              </Badge>
            </div>
            <p className="text-slate-400 text-sm">{planData?.label ?? ""}</p>
            <p className="text-slate-500 text-xs mt-1">{t("vote.applicant")}: {submission.applicantName}</p>
          </div>
          {planData?.logoUrl && (
            <img src={planData.logoUrl} alt="" className="w-12 h-12 rounded-full shrink-0" />
          )}
        </div>

        {/* Plan info */}
        {planData && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-slate-700/50 rounded-lg p-2.5 text-center">
              <div className="text-slate-400 text-xs mb-0.5">Daily Return</div>
              <div className="text-amber-400 font-bold">{planData.dailyRate ?? "0"}%</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-2.5 text-center">
              <div className="text-slate-400 text-xs mb-0.5">{t("vote.minInvestment")}</div>
              <div className="text-white font-bold">{planData.minAmount ?? "0"} USDT</div>
            </div>
          </div>
        )}

        {/* Vote status */}
        {(submission.status === "voting" || submission.status === "approved" || submission.status === "rejected") && (
          <div className="space-y-3 mb-4">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-sm">
                <span className="text-green-400 flex items-center gap-1 font-medium">
                  <ThumbsUp className="w-3.5 h-3.5" /> {t("vote.approve")} {approveVotes}
                </span>
                <span className="text-slate-300 font-bold text-base">{approvePct}%</span>
                <span className="text-red-400 flex items-center gap-1 font-medium">
                  {t("vote.reject")} {rejectVotes} <ThumbsDown className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="relative h-3 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    approvePct >= THRESHOLD ? "bg-green-500" : "bg-amber-500"
                  }`}
                  style={{ width: `${approvePct}%` }}
                />
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white/60"
                  style={{ left: `${THRESHOLD}%` }}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">{t("vote.totalVotes").replace("{n}", String(totalVotes))}</span>
                <span className={`flex items-center gap-1 font-medium ${
                  approvePct >= THRESHOLD ? "text-green-400" : "text-slate-400"
                }`}>
                  <TrendingUp className="w-3 h-3" />
                  {t("vote.threshold").replace("{n}", String(THRESHOLD))} {approvePct >= THRESHOLD ? t("vote.thresholdReached") : t("vote.remaining").replace("{n}", String(THRESHOLD - approvePct))}
                </span>
              </div>
            </div>

            {/* Countdown timer */}
            {isVotingOpen && countdown && (
              <div className="bg-slate-700/50 border border-amber-500/20 rounded-xl p-2.5 sm:p-3">
                <div className="flex items-center gap-1.5 text-amber-400 text-xs font-medium mb-2">
                  <Timer className="w-3.5 h-3.5" /> {t("vote.voteUntil")}
                </div>
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                  {[
                    { val: countdown.days, unit: t("vote.days") },
                    { val: countdown.hours, unit: t("vote.hours") },
                    { val: countdown.minutes, unit: t("vote.minutes") },
                    { val: countdown.seconds, unit: t("vote.seconds") },
                  ].map(({ val, unit }) => (
                    <div key={unit} className="bg-slate-800 rounded-lg p-1.5 sm:p-2 text-center">
                      <div className="text-white font-bold text-lg sm:text-xl tabular-nums leading-none">
                        {String(val).padStart(2, "0")}
                      </div>
                      <div className="text-slate-500 text-xs mt-0.5">{unit}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {isVotingOpen && !countdown && (
              <div className="flex items-center gap-1 text-amber-400 text-xs">
                <Clock className="w-3 h-3" /> {t("vote.voting")}
              </div>
            )}
          </div>
        )}

        {/* Details toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-slate-400 hover:text-slate-300 text-sm transition-colors mb-3"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {expanded ? t("vote.detailsHide") : t("vote.detailsShow")}
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

        {/* Vote buttons */}
        {isVotingOpen && (
          <div className="space-y-3">
            {user ? (
              <>
                <Textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder={t("vote.voteComment")}
                  className="bg-slate-700 border-slate-600 text-white text-sm resize-none h-16"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleVote("approve")}
                    disabled={voting || voteMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {voting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <ThumbsUp className="w-4 h-4 mr-1" />}
                    {t("vote.approve")}
                  </Button>
                  <Button
                    onClick={() => handleVote("reject")}
                    disabled={voting || voteMutation.isPending}
                    variant="outline"
                    className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10"
                  >
                    {voting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <ThumbsDown className="w-4 h-4 mr-1" />}
                    {t("vote.reject")}
                  </Button>
                </div>
              </>
            ) : (
              <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                <Lock className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                <p className="text-slate-400 text-sm mb-2">{t("vote.nodeHolderOnly")}</p>
                <Button
                  onClick={() => window.dispatchEvent(new CustomEvent("open-wallet-modal"))}
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600 text-black font-bold"
                >
                  {t("vote.loginToVote")}
                </Button>
              </div>
            )}
          </div>
        )}

        {submission.status === "approved" && (
          <div className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 rounded-lg p-2.5">
            <CheckCircle className="w-4 h-4" /> {t("vote.approvalComplete")}
          </div>
        )}
        {submission.status === "rejected" && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 rounded-lg p-2.5">
            <XCircle className="w-4 h-4" /> {t("vote.rejectionComplete")}
            {submission.adminNote && <span className="text-slate-400">: {submission.adminNote}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function VotePage() {
  const { t } = useTranslation();
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-8 sm:py-12 px-3 sm:px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-7 sm:mb-10">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-3 sm:px-4 py-1.5 text-amber-400 text-xs sm:text-sm font-medium mb-3 sm:mb-4">
            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Golden Collection
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{t("vote.header")}</h1>
          <p className="text-slate-400 text-xs sm:text-sm">{t("vote.headerDesc")}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
          {[
            { label: t("vote.inVoting"), value: votingCount, icon: <Clock className="w-4 h-4 sm:w-5 sm:h-5" />, color: "text-amber-400" },
            { label: t("vote.approvedCount"), value: approvedCount, icon: <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />, color: "text-green-400" },
            { label: t("vote.totalSubmissions"), value: submissions?.length ?? 0, icon: <FileText className="w-4 h-4 sm:w-5 sm:h-5" />, color: "text-blue-400" },
          ].map(stat => (
            <Card key={stat.label} className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-2.5 sm:p-4 text-center">
                <div className={`${stat.color} flex justify-center mb-0.5 sm:mb-1`}>{stat.icon}</div>
                <div className={`text-xl sm:text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-slate-400 text-xs leading-tight">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Node holder notice */}
        {!user && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-amber-300 font-medium text-sm">{t("vote.nodeHolderOnly")}</p>
              <p className="text-slate-400 text-xs mt-0.5">{t("vote.nodeHolderDesc")}</p>
            </div>
            <Button
              onClick={() => window.dispatchEvent(new CustomEvent("open-wallet-modal"))}
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-black font-bold shrink-0"
            >
              {t("vote.login")}
            </Button>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { key: "all", label: t("vote.filterAll") },
            { key: "voting", label: t("vote.filterVoting") },
            { key: "approved", label: t("vote.filterApproved") },
            { key: "rejected", label: t("vote.filterRejected") },
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

        {/* Submission list */}
        {isLoading ? (
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto mb-3" />
            <p className="text-slate-400">{t("vote.loading")}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">{t("vote.noSubmissions")}</p>
            <p className="text-slate-500 text-sm mt-1">{t("vote.noSubmissionsDesc")}</p>
            <Button
              onClick={() => window.location.href = "/submit-plan"}
              className="mt-4 bg-amber-500 hover:bg-amber-600 text-black font-bold"
            >
              {t("vote.submitPlan")}
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
