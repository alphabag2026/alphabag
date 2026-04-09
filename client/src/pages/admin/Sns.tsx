import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Plus, Pencil, Trash2, ChevronDown, ChevronUp, MessageSquare,
  Heart, Repeat2, MessagesSquare, ExternalLink, Users, RefreshCw,
  Send, Bot, Zap, DollarSign, TrendingUp, Bell, Activity, BarChart2,
  AlertTriangle, CheckCircle2,
} from "lucide-react";

type Influencer = {
  id: number;
  name: string;
  handle: string;
  avatarUrl: string | null;
  twitterUrl: string | null;
  description: string | null;
  category: string | null;
  followerCount: string | null;
  twitterUserId: string | null;
  autoFetchEnabled: boolean;
  lastFetchedAt: Date | string | null;
  snsTelegramChatId: string | null;
  isActive: boolean;
  sortOrder: number;
};

type Post = {
  id: number;
  influencerId: number;
  content: string;
  tweetUrl: string | null;
  likes: number;
  retweets: number;
  replies: number;
  translatedContent?: string | null;
  mediaUrls?: string[] | null;
  translatedAt?: Date | string | null;
  postedAt: Date | string;
  isActive: boolean;
  influencerName?: string;
  influencerHandle?: string;
};

const CATEGORIES = [
  { value: "crypto", label: "크립토" },
  { value: "defi", label: "DeFi" },
  { value: "trading", label: "트레이딩" },
  { value: "nft", label: "NFT" },
  { value: "web3", label: "Web3" },
  { value: "vc", label: "VC/투자" },
];

export default function SnsPage() {
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState<'influencers' | 'cost'>('influencers');
  const [translatingPostId, setTranslatingPostId] = useState<number | null>(null);
  const [translatedPosts, setTranslatedPosts] = useState<Record<number, string>>({});
  const [showTranslation, setShowTranslation] = useState<Record<number, boolean>>({});
  const translatePostMutation = trpc.sns.translatePost.useMutation();

  const { data: influencers = [], isLoading: infLoading } = trpc.sns.adminInfluencers.useQuery();
  const { data: snsStats } = trpc.sns.snsStats.useQuery();
  const [selectedInfId, setSelectedInfId] = useState<number | null>(null);
  const [expandedInfId, setExpandedInfId] = useState<number | null>(null);
  const { data: posts = [], isLoading: postsLoading } = trpc.sns.adminPosts.useQuery(
    { influencerId: selectedInfId ?? undefined },
    { enabled: true }
  );

  // ─── 인플루언서 다이얼로그
  const [infDialog, setInfDialog] = useState(false);
  const [editingInf, setEditingInf] = useState<Influencer | null>(null);
  const [infForm, setInfForm] = useState({
    name: "", handle: "", avatarUrl: "", twitterUrl: "",
    description: "", category: "crypto", followerCount: "",
    twitterUserId: "", autoFetchEnabled: false,
    fetchIntervalHours: 1, alertOnNewPost: false, estimatedDailyTweets: 5,
    snsTelegramChatId: "", sortOrder: 0,
  });

  // ─── 포스트 다이얼로그
  const [postDialog, setPostDialog] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [postInfluencerId, setPostInfluencerId] = useState<number | null>(null);
  const [postForm, setPostForm] = useState({
    content: "", tweetUrl: "", likes: 0, retweets: 0, replies: 0, postedAt: "", sendToTelegram: false,
  });

  // ─── 수동 수집 로딩 상태
  const [fetchingId, setFetchingId] = useState<number | null>(null);

  // ─── Mutations
  const createInf = trpc.sns.createInfluencer.useMutation({
    onSuccess: () => { utils.sns.adminInfluencers.invalidate(); toast.success("인플루언서 추가됨"); setInfDialog(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateInf = trpc.sns.updateInfluencer.useMutation({
    onSuccess: () => { utils.sns.adminInfluencers.invalidate(); toast.success("인플루언서 수정됨"); setInfDialog(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteInf = trpc.sns.deleteInfluencer.useMutation({
    onSuccess: () => { utils.sns.adminInfluencers.invalidate(); utils.sns.adminPosts.invalidate(); toast.success("인플루언서 삭제됨"); },
    onError: (e) => toast.error(e.message),
  });
  const manualFetch = trpc.sns.manualFetch.useMutation({
    onSuccess: (data) => {
      utils.sns.adminInfluencers.invalidate();
      utils.sns.adminPosts.invalidate();
      toast.success(`수집 완료! 새 트윗 ${data.newPosts}개`);
      setFetchingId(null);
    },
    onError: (e) => { toast.error(e.message); setFetchingId(null); },
  });
  const createPost = trpc.sns.createPost.useMutation({
    onSuccess: () => { utils.sns.adminPosts.invalidate(); toast.success("포스트 추가됨"); setPostDialog(false); },
    onError: (e) => toast.error(e.message),
  });
  const updatePost = trpc.sns.updatePost.useMutation({
    onSuccess: () => { utils.sns.adminPosts.invalidate(); toast.success("포스트 수정됨"); setPostDialog(false); },
    onError: (e) => toast.error(e.message),
  });
  const deletePost = trpc.sns.deletePost.useMutation({
    onSuccess: () => { utils.sns.adminPosts.invalidate(); toast.success("포스트 삭제됨"); },
    onError: (e) => toast.error(e.message),
  });

  // ─── 인플루언서 다이얼로그 열기
  const openInfDialog = (inf?: Influencer) => {
    if (inf) {
      setEditingInf(inf);
      setInfForm({
        name: inf.name, handle: inf.handle,
        avatarUrl: inf.avatarUrl || "", twitterUrl: inf.twitterUrl || "",
        description: inf.description || "", category: inf.category || "crypto",
        followerCount: inf.followerCount || "",
        twitterUserId: inf.twitterUserId || "",
        autoFetchEnabled: inf.autoFetchEnabled,
        fetchIntervalHours: (inf as any).fetchIntervalHours || 1,
        alertOnNewPost: (inf as any).alertOnNewPost || false,
        estimatedDailyTweets: (inf as any).estimatedDailyTweets || 5,
        snsTelegramChatId: inf.snsTelegramChatId || "",
        sortOrder: inf.sortOrder,
      });
    } else {
      setEditingInf(null);
      setInfForm({
        name: "", handle: "", avatarUrl: "", twitterUrl: "", description: "",
        category: "crypto", followerCount: "", twitterUserId: "",
        autoFetchEnabled: false, fetchIntervalHours: 1, alertOnNewPost: false,
        estimatedDailyTweets: 5, snsTelegramChatId: "", sortOrder: 0,
      });
    }
    setInfDialog(true);
  };

  const submitInf = () => {
    if (!infForm.name.trim() || !infForm.handle.trim()) { toast.error("이름과 핸들은 필수입니다"); return; }
    const payload = {
      ...infForm,
      avatarUrl: infForm.avatarUrl || undefined,
      twitterUrl: infForm.twitterUrl || undefined,
      description: infForm.description || undefined,
      followerCount: infForm.followerCount || undefined,
      twitterUserId: infForm.twitterUserId || undefined,
      snsTelegramChatId: infForm.snsTelegramChatId || undefined,
    };
    if (editingInf) updateInf.mutate({ id: editingInf.id, ...payload });
    else createInf.mutate(payload);
  };

  // ─── 포스트 다이얼로그 열기
  const openPostDialog = (infId: number, post?: Post) => {
    setPostInfluencerId(infId);
    if (post) {
      setEditingPost(post);
      setPostForm({
        content: post.content, tweetUrl: post.tweetUrl || "",
        likes: post.likes, retweets: post.retweets, replies: post.replies,
        postedAt: post.postedAt ? new Date(post.postedAt).toISOString().slice(0, 16) : "",
        sendToTelegram: false,
      });
    } else {
      setEditingPost(null);
      setPostForm({ content: "", tweetUrl: "", likes: 0, retweets: 0, replies: 0, postedAt: new Date().toISOString().slice(0, 16), sendToTelegram: false });
    }
    setPostDialog(true);
  };

  const submitPost = () => {
    if (!postForm.content.trim()) { toast.error("내용은 필수입니다"); return; }
    if (!postInfluencerId) return;
    if (editingPost) {
      updatePost.mutate({ id: editingPost.id, content: postForm.content, tweetUrl: postForm.tweetUrl || undefined, likes: postForm.likes, retweets: postForm.retweets, replies: postForm.replies });
    } else {
      createPost.mutate({
        influencerId: postInfluencerId,
        content: postForm.content,
        tweetUrl: postForm.tweetUrl || undefined,
        likes: postForm.likes,
        retweets: postForm.retweets,
        replies: postForm.replies,
        postedAt: postForm.postedAt || undefined,
        sendToTelegram: postForm.sendToTelegram,
      });
    }
  };

  const postCountByInf = (posts as Post[]).reduce((acc: Record<number, number>, p) => {
    acc[p.influencerId] = (acc[p.influencerId] || 0) + 1;
    return acc;
  }, {});

  const categoryLabel = (cat: string | null) => CATEGORIES.find(c => c.value === cat)?.label || cat || "-";

  const COST_PER_TWEET = 0.005;

  return (
    <AdminLayout title="SNS 인플루언서 관리">
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">📱 SNS 인플루언서</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              크립토 업계 인플루언서 계정과 소식을 관리합니다. X API 자동수집 및 텔레그램 발송을 지원합니다.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border overflow-hidden">
              <button
                onClick={() => setActiveTab('influencers')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === 'influencers'
                    ? 'bg-sky-600 text-white'
                    : 'bg-background text-muted-foreground hover:bg-muted'
                }`}
              >
                <Users className="w-3.5 h-3.5 inline mr-1" />인플루언서 ({(influencers as Influencer[]).length})
              </button>
              <button
                onClick={() => setActiveTab('cost')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === 'cost'
                    ? 'bg-sky-600 text-white'
                    : 'bg-background text-muted-foreground hover:bg-muted'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5 inline mr-1" />비용 정산
              </button>
            </div>
            {activeTab === 'influencers' && (
              <Button onClick={() => openInfDialog()} className="gap-2 bg-sky-600 hover:bg-sky-700 text-white">
                <Plus className="w-4 h-4" /> 인플루언서 추가
              </Button>
            )}
          </div>
        </div>

        {/* 비용 정산 탭 */}
        {activeTab === 'cost' && snsStats && (
          <div className="space-y-5">
            {/* 요약 카드 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="border rounded-xl p-4 bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                    <Users className="w-4 h-4 text-sky-600" />
                  </div>
                  <span className="text-xs text-muted-foreground">전체 KOL</span>
                </div>
                <div className="text-2xl font-bold text-foreground">{snsStats.totalInfluencers}</div>
                <div className="text-xs text-muted-foreground mt-0.5">활성 인플루언서</div>
              </div>
              <div className="border rounded-xl p-4 bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-xs text-muted-foreground">자동수집</span>
                </div>
                <div className="text-2xl font-bold text-foreground">{snsStats.autoFetchCount}</div>
                <div className="text-xs text-muted-foreground mt-0.5">API 수집 활성</div>
              </div>
              <div className="border rounded-xl p-4 bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-red-500" />
                  </div>
                  <span className="text-xs text-muted-foreground">실시간 알림</span>
                </div>
                <div className="text-2xl font-bold text-foreground">{snsStats.alertCount}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Stream 알림 설정</div>
              </div>
              <div className="border rounded-xl p-4 bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-yellow-600" />
                  </div>
                  <span className="text-xs text-muted-foreground">이번 달 수집</span>
                </div>
                <div className="text-2xl font-bold text-foreground">{snsStats.thisMonthPosts.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground mt-0.5">총 {snsStats.totalPosts.toLocaleString()}개</div>
              </div>
            </div>

            {/* 예상 비용 섹션 */}
            <div className="border rounded-xl p-5 bg-card">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-green-500" />
                <h3 className="font-semibold text-foreground">예상 월 API 비용</h3>
                <Badge className="ml-auto text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-0">
                  Twitter API Basic ($100/월)
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-muted/30 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    ${snsStats.estimatedMonthlyCost.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">예상 월 비용</div>
                  <div className="text-[10px] text-muted-foreground">(자동수집 KOL 기준)</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-sky-600 dark:text-sky-400">
                    {snsStats.estimatedMonthlyTweets.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">예상 월 트윗 수</div>
                  <div className="text-[10px] text-muted-foreground">(일 평균 × 30일)</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    ${COST_PER_TWEET}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">트윗당 비용</div>
                  <div className="text-[10px] text-muted-foreground">(X API Pay-per-use)</div>
                </div>
              </div>
              {/* 예산 대비 현황 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">월 예산 대비 예상 사용량</span>
                  <span className="font-medium">${snsStats.estimatedMonthlyCost.toFixed(2)} / $100.00</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      snsStats.estimatedMonthlyCost > 80 ? 'bg-red-500' :
                      snsStats.estimatedMonthlyCost > 50 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min((snsStats.estimatedMonthlyCost / 100) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  {snsStats.estimatedMonthlyCost > 80 ? (
                    <><AlertTriangle className="w-3.5 h-3.5 text-red-500" /><span className="text-red-500">예산 초과 위험. KOL 수 또는 수집 빈도를 줄이세요.</span></>
                  ) : snsStats.estimatedMonthlyCost > 50 ? (
                    <><AlertTriangle className="w-3.5 h-3.5 text-yellow-500" /><span className="text-yellow-600">예산의 50% 이상 사용 예정. 모니터링 필요.</span></>
                  ) : (
                    <><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /><span className="text-green-600">예산 범위 내. 안전한 수준입니다.</span></>
                  )}
                </div>
              </div>
            </div>

            {/* 카테고리별 비용 분석 */}
            <div className="border rounded-xl p-5 bg-card">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="w-5 h-5 text-sky-500" />
                <h3 className="font-semibold text-foreground">카테고리별 비용 분석</h3>
              </div>
              <div className="space-y-3">
                {Object.entries(snsStats.categoryBreakdown)
                  .sort((a, b) => b[1].monthlyCost - a[1].monthlyCost)
                  .map(([cat, data]) => {
                    const pct = snsStats.estimatedMonthlyCost > 0
                      ? (data.monthlyCost / snsStats.estimatedMonthlyCost) * 100
                      : 0;
                    const catLabel = CATEGORIES.find(c => c.value === cat)?.label || cat;
                    return (
                      <div key={cat}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">{catLabel}</Badge>
                            <span className="text-muted-foreground">{data.count}명 · {data.monthlyTweets.toLocaleString()}트윗/월</span>
                          </div>
                          <span className="font-medium">${data.monthlyCost.toFixed(2)} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-sky-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* KOL 개별 비용 목록 (자동수집 활성화된 것만) */}
            <div className="border rounded-xl p-5 bg-card">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold text-foreground">KOL 개별 비용 현황</h3>
                <span className="text-xs text-muted-foreground ml-auto">자동수집 활성화된 KOL만 표시</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 text-muted-foreground font-medium">KOL</th>
                      <th className="text-left py-2 text-muted-foreground font-medium">카테고리</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">일 트윗</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">월 트윗</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">월 비용</th>
                      <th className="text-center py-2 text-muted-foreground font-medium">알림</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {snsStats.influencers
                      .filter(inf => inf.autoFetchEnabled)
                      .sort((a, b) => (b.estimatedDailyTweets || 5) - (a.estimatedDailyTweets || 5))
                      .map(inf => {
                        const daily = inf.estimatedDailyTweets || 5;
                        const monthly = daily * 30;
                        const cost = monthly * COST_PER_TWEET;
                        return (
                          <tr key={inf.id} className="hover:bg-muted/20">
                            <td className="py-2">
                              <div className="font-medium text-foreground">{inf.name}</div>
                              <div className="text-muted-foreground">@{inf.handle}</div>
                            </td>
                            <td className="py-2">
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {CATEGORIES.find(c => c.value === inf.category)?.label || inf.category}
                              </Badge>
                            </td>
                            <td className="py-2 text-right">{daily}</td>
                            <td className="py-2 text-right">{monthly.toLocaleString()}</td>
                            <td className="py-2 text-right font-medium">${cost.toFixed(2)}</td>
                            <td className="py-2 text-center">
                              {inf.alertOnNewPost ? (
                                <Bell className="w-3.5 h-3.5 text-red-500 mx-auto" />
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 비용 절감 팁 */}
            <div className="border rounded-xl p-4 bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-1">💡 비용 최적화 가이드</div>
                  <ul className="text-xs text-blue-600 dark:text-blue-300 space-y-1">
                    <li>• <strong>핵심 4명</strong> (일론머스크, 트럼프, CZ, 허이)만 실시간 알림 설정 → 나머지는 1~3시간 주기 수집</li>
                    <li>• <strong>estimatedDailyTweets</strong>를 실제 트윗 빈도에 맞게 조정하면 예상 비용이 정확해집니다</li>
                    <li>• Twitter API Basic $100/월 플랜: 월 20,000건 트윗 읽기 포함 (초과 시 $0.005/건)</li>
                    <li>• 현재 예상 월 비용: <strong>${snsStats.estimatedMonthlyCost.toFixed(2)}</strong> (예산 $100 대비 {((snsStats.estimatedMonthlyCost / 100) * 100).toFixed(1)}%)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 인플루언서 목록 탭 */}
        {activeTab === 'influencers' && (
          <div>
        {/* 인플루언서 목록 */}
        {infLoading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">로딩 중...</div>
        ) : (influencers as Influencer[]).length === 0 ? (
          <div className="text-center py-16 border border-dashed rounded-xl">
            <div className="text-4xl mb-3">📱</div>
            <div className="text-sm font-medium text-foreground">등록된 인플루언서가 없습니다</div>
            <div className="text-xs text-muted-foreground mt-1 mb-4">CZ, 허이 등 업계 유명 인플루언서를 추가하세요</div>
            <Button onClick={() => openInfDialog()} size="sm" className="gap-1.5 bg-sky-600 hover:bg-sky-700 text-white">
              <Plus className="w-3.5 h-3.5" /> 첫 인플루언서 추가
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {(influencers as Influencer[]).map((inf) => {
              const isExpanded = expandedInfId === inf.id;
              const infPosts = (posts as Post[]).filter(p => p.influencerId === inf.id);
              return (
                <div key={inf.id} className="border rounded-xl overflow-hidden bg-card">
                  {/* 인플루언서 행 */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    {/* 아바타 */}
                    <div className="flex-shrink-0">
                      {inf.avatarUrl ? (
                        <img src={inf.avatarUrl} alt={inf.name} className="w-10 h-10 rounded-full object-cover border border-border" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-sky-600 dark:text-sky-400 font-bold text-sm">
                          {inf.name[0]}
                        </div>
                      )}
                    </div>
                    {/* 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground">{inf.name}</span>
                        <span className="text-xs text-muted-foreground">@{inf.handle}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{categoryLabel(inf.category)}</Badge>
                        {inf.autoFetchEnabled && (
                          <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
                            <Bot className="w-2.5 h-2.5 mr-0.5" /> 자동수집
                          </Badge>
                        )}
                        {(inf as any).alertOnNewPost && (
                          <Badge className="text-[10px] px-1.5 py-0 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0">
                            <Bell className="w-2.5 h-2.5 mr-0.5" /> 실시간
                          </Badge>
                        )}
                        {inf.snsTelegramChatId && (
                          <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0">
                            <Send className="w-2.5 h-2.5 mr-0.5" /> TG연동
                          </Badge>
                        )}
                        {!inf.isActive && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">비활성</Badge>}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        {inf.followerCount && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Users className="w-3 h-3" /> {inf.followerCount}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <MessageSquare className="w-3 h-3" /> 포스트 {postCountByInf[inf.id] || 0}개
                        </span>
                        {inf.lastFetchedAt && (
                          <span className="text-[10px] text-muted-foreground">
                            마지막 수집: {new Date(inf.lastFetchedAt).toLocaleString("ko-KR")}
                          </span>
                        )}
                        {inf.twitterUrl && (
                          <a href={inf.twitterUrl} target="_blank" rel="noopener noreferrer"
                            className="text-[10px] text-sky-500 hover:underline flex items-center gap-0.5">
                            <ExternalLink className="w-3 h-3" /> X 프로필
                          </a>
                        )}
                      </div>
                    </div>
                    {/* 액션 버튼 */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {/* 수동 수집 버튼 */}
                      <Button size="sm" variant="outline" onClick={() => {
                        setFetchingId(inf.id);
                        manualFetch.mutate({ influencerId: inf.id });
                      }} disabled={fetchingId === inf.id}
                        className="h-7 px-2.5 text-xs gap-1">
                        <RefreshCw className={`w-3 h-3 ${fetchingId === inf.id ? "animate-spin" : ""}`} />
                        {fetchingId === inf.id ? "수집중..." : "수집"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openPostDialog(inf.id)}
                        className="h-7 px-2.5 text-xs gap-1">
                        <Plus className="w-3 h-3" /> 포스트
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openInfDialog(inf)}
                        className="h-7 w-7 p-0">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => {
                        if (confirm(`"${inf.name}" 인플루언서와 모든 포스트를 삭제할까요?`)) deleteInf.mutate({ id: inf.id });
                      }} className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => {
                        setExpandedInfId(isExpanded ? null : inf.id);
                        setSelectedInfId(isExpanded ? null : inf.id);
                      }} className="h-7 w-7 p-0">
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </div>

                  {/* 포스트 목록 (접이식) */}
                  {isExpanded && (
                    <div className="border-t bg-muted/20">
                      {postsLoading ? (
                        <div className="text-center py-6 text-xs text-muted-foreground">로딩 중...</div>
                      ) : infPosts.length === 0 ? (
                        <div className="text-center py-6">
                          <div className="text-xs text-muted-foreground">포스트가 없습니다</div>
                          <Button size="sm" variant="outline" onClick={() => openPostDialog(inf.id)}
                            className="mt-2 h-7 text-xs gap-1">
                            <Plus className="w-3 h-3" /> 첫 포스트 추가
                          </Button>
                        </div>
                      ) : (
                        <div className="divide-y divide-border/50">
                          {infPosts.map((post) => {
                            const isTranslating = translatingPostId === post.id;
                            const translated = translatedPosts[post.id] || post.translatedContent;
                            const isShowingTranslation = showTranslation[post.id];
                            const displayContent = isShowingTranslation && translated ? translated : post.content;

                            const handleTranslate = async () => {
                              if (translated) {
                                setShowTranslation(prev => ({ ...prev, [post.id]: !prev[post.id] }));
                                return;
                              }
                              setTranslatingPostId(post.id);
                              try {
                                const result = await translatePostMutation.mutateAsync({ postId: post.id });
                                setTranslatedPosts(prev => ({ ...prev, [post.id]: result.translatedContent }));
                                setShowTranslation(prev => ({ ...prev, [post.id]: true }));
                                toast.success("번역 완료");
                              } catch (e) {
                                toast.error("번역 실패");
                              } finally {
                                setTranslatingPostId(null);
                              }
                            };

                            return (
                            <div key={post.id} className="px-4 py-3 flex gap-3">
                              <div className="flex-1 min-w-0">
                                {isShowingTranslation && translated && (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 mb-1">
                                    🤖 AI 한국어 번역
                                  </span>
                                )}
                                <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap line-clamp-4">{displayContent}</p>
                                {/* 미디어 이미지 */}
                                {post.mediaUrls && Array.isArray(post.mediaUrls) && post.mediaUrls.length > 0 && (
                                  <div className={`mt-2 grid gap-1 ${
                                    post.mediaUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                                  }`}>
                                    {post.mediaUrls.slice(0, 4).map((url: string, idx: number) => (
                                      <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                                        <img src={url} alt={`media-${idx}`}
                                          className="w-full rounded-lg object-cover max-h-40 hover:opacity-90 transition-opacity" />
                                      </a>
                                    ))}
                                  </div>
                                )}
                                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                    <Heart className="w-3 h-3" /> {post.likes?.toLocaleString()}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                    <Repeat2 className="w-3 h-3" /> {post.retweets?.toLocaleString()}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                    <MessagesSquare className="w-3 h-3" /> {post.replies?.toLocaleString()}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {new Date(post.postedAt).toLocaleDateString("ko-KR")}
                                  </span>
                                  {post.tweetUrl && (
                                    <a href={post.tweetUrl} target="_blank" rel="noopener noreferrer"
                                      className="text-[10px] text-sky-500 hover:underline flex items-center gap-0.5">
                                      <ExternalLink className="w-3 h-3" /> 원문
                                    </a>
                                  )}
                                  {/* 번역 버튼 */}
                                  <button
                                    onClick={handleTranslate}
                                    disabled={isTranslating}
                                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full border transition-all ${
                                      isShowingTranslation && translated
                                        ? "bg-emerald-100 border-emerald-300 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-400"
                                        : "bg-muted border-border text-muted-foreground hover:bg-accent"
                                    } disabled:opacity-50 disabled:cursor-wait`}
                                  >
                                    {isTranslating ? "⟳ 번역 중..."
                                      : isShowingTranslation && translated ? "🌐 원문"
                                      : translated ? "🌐 번역"
                                      : "🤖 한국어"}
                                  </button>
                                </div>
                              </div>
                              <div className="flex items-start gap-1 flex-shrink-0">
                                <Button size="sm" variant="ghost" onClick={() => openPostDialog(inf.id, post)}
                                  className="h-6 w-6 p-0">
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => {
                                  if (confirm("이 포스트를 삭제할까요?")) deletePost.mutate({ id: post.id });
                                }} className="h-6 w-6 p-0 text-destructive hover:text-destructive">
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
          </div>
        )}
      </div>

      {/* 인플루언서 다이얼로그 */}
      <Dialog open={infDialog} onOpenChange={setInfDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingInf ? "인플루언서 수정" : "인플루언서 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">이름 *</label>
                <Input placeholder="CZ" value={infForm.name} onChange={e => setInfForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">핸들 * (@제외)</label>
                <Input placeholder="cz_binance" value={infForm.handle} onChange={e => setInfForm(f => ({ ...f, handle: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">아바타 이미지 URL</label>
              <Input placeholder="https://..." value={infForm.avatarUrl} onChange={e => setInfForm(f => ({ ...f, avatarUrl: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">X(트위터) 프로필 URL</label>
              <Input placeholder="https://x.com/cz_binance" value={infForm.twitterUrl} onChange={e => setInfForm(f => ({ ...f, twitterUrl: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">카테고리</label>
                <Select value={infForm.category} onValueChange={v => setInfForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">팔로워 수</label>
                <Input placeholder="9.2M" value={infForm.followerCount} onChange={e => setInfForm(f => ({ ...f, followerCount: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">소개</label>
              <Textarea placeholder="인플루언서 소개..." value={infForm.description} onChange={e => setInfForm(f => ({ ...f, description: e.target.value }))} rows={2} />
            </div>

            {/* X API 자동수집 설정 */}
            <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="text-xs font-semibold text-foreground">X API 자동수집 설정</span>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Twitter User ID (X API v2)</label>
                <Input placeholder="숫자 ID (예: 123456789)" value={infForm.twitterUserId}
                  onChange={e => setInfForm(f => ({ ...f, twitterUserId: e.target.value }))} />
                <p className="text-[10px] text-muted-foreground mt-0.5">비워두면 핸들로 자동 조회됩니다</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-foreground">자동수집 활성화</div>
                  <div className="text-[10px] text-muted-foreground">주기적으로 최신 트윗 자동 수집</div>
                </div>
                <Switch
                  checked={infForm.autoFetchEnabled}
                  onCheckedChange={v => setInfForm(f => ({ ...f, autoFetchEnabled: v }))}
                />
              </div>
              {infForm.autoFetchEnabled && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">수집 주기 (시간)</label>
                    <Select value={String(infForm.fetchIntervalHours)} onValueChange={v => setInfForm(f => ({ ...f, fetchIntervalHours: parseInt(v) }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1시간</SelectItem>
                        <SelectItem value="2">2시간</SelectItem>
                        <SelectItem value="3">3시간</SelectItem>
                        <SelectItem value="6">6시간</SelectItem>
                        <SelectItem value="12">12시간</SelectItem>
                        <SelectItem value="24">24시간</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">일 평균 트윗 수</label>
                    <Input type="number" min={1} max={100} value={infForm.estimatedDailyTweets}
                      onChange={e => setInfForm(f => ({ ...f, estimatedDailyTweets: parseInt(e.target.value) || 5 }))} />
                    <p className="text-[10px] text-muted-foreground mt-0.5">비용 정산 기준값 (예상 일 트윗)</p>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-foreground">트윗 실시간 알림</div>
                  <div className="text-[10px] text-muted-foreground">Filtered Stream으로 즉시 알림 (핵심 KOL에만 권장)</div>
                </div>
                <Switch
                  checked={infForm.alertOnNewPost}
                  onCheckedChange={v => setInfForm(f => ({ ...f, alertOnNewPost: v }))}
                />
              </div>
            </div>

            {/* 텔레그램 연동 설정 */}
            <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-semibold text-foreground">텔레그램 자동 발송 설정</span>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">텔레그램 채널 Chat ID</label>
                <Input placeholder="-100xxxxxxxxxx" value={infForm.snsTelegramChatId}
                  onChange={e => setInfForm(f => ({ ...f, snsTelegramChatId: e.target.value }))} />
                <p className="text-[10px] text-muted-foreground mt-0.5">새 트윗 수집 시 이 채널로 자동 공유됩니다</p>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">정렬 순서</label>
              <Input type="number" value={infForm.sortOrder} onChange={e => setInfForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInfDialog(false)}>취소</Button>
            <Button onClick={submitInf} disabled={createInf.isPending || updateInf.isPending}
              className="bg-sky-600 hover:bg-sky-700 text-white">
              {editingInf ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 포스트 다이얼로그 */}
      <Dialog open={postDialog} onOpenChange={setPostDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPost ? "포스트 수정" : "포스트 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">내용 *</label>
              <Textarea
                placeholder="트윗 내용을 입력하세요..."
                value={postForm.content}
                onChange={e => setPostForm(f => ({ ...f, content: e.target.value }))}
                rows={5}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">원문 트윗 URL</label>
              <Input placeholder="https://x.com/..." value={postForm.tweetUrl} onChange={e => setPostForm(f => ({ ...f, tweetUrl: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">게시 일시</label>
              <Input type="datetime-local" value={postForm.postedAt} onChange={e => setPostForm(f => ({ ...f, postedAt: e.target.value }))} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">❤️ 좋아요</label>
                <Input type="number" value={postForm.likes} onChange={e => setPostForm(f => ({ ...f, likes: parseInt(e.target.value) || 0 }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">🔁 리트윗</label>
                <Input type="number" value={postForm.retweets} onChange={e => setPostForm(f => ({ ...f, retweets: parseInt(e.target.value) || 0 }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">💬 댓글</label>
                <Input type="number" value={postForm.replies} onChange={e => setPostForm(f => ({ ...f, replies: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
            {!editingPost && (
              <div className="flex items-center justify-between border rounded-lg p-3 bg-muted/30">
                <div>
                  <div className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-blue-500" /> 텔레그램 채널에 발송
                  </div>
                  <div className="text-[10px] text-muted-foreground">인플루언서에 채널이 설정된 경우 자동 공유</div>
                </div>
                <Switch
                  checked={postForm.sendToTelegram}
                  onCheckedChange={v => setPostForm(f => ({ ...f, sendToTelegram: v }))}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPostDialog(false)}>취소</Button>
            <Button onClick={submitPost} disabled={createPost.isPending || updatePost.isPending}
              className="bg-sky-600 hover:bg-sky-700 text-white">
              {editingPost ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
