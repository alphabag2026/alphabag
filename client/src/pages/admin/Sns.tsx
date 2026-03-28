import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Plus, Pencil, Trash2, ChevronDown, ChevronUp, MessageSquare,
  Heart, Repeat2, MessagesSquare, ExternalLink, Users,
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

  // ─── 인플루언서 목록
  const { data: influencers = [], isLoading: infLoading } = trpc.sns.adminInfluencers.useQuery();

  // ─── 선택된 인플루언서의 포스트 목록
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
    description: "", category: "crypto", followerCount: "", sortOrder: 0,
  });

  // ─── 포스트 다이얼로그
  const [postDialog, setPostDialog] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [postInfluencerId, setPostInfluencerId] = useState<number | null>(null);
  const [postForm, setPostForm] = useState({
    content: "", tweetUrl: "", likes: 0, retweets: 0, replies: 0, postedAt: "",
  });

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
        followerCount: inf.followerCount || "", sortOrder: inf.sortOrder,
      });
    } else {
      setEditingInf(null);
      setInfForm({ name: "", handle: "", avatarUrl: "", twitterUrl: "", description: "", category: "crypto", followerCount: "", sortOrder: 0 });
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
      });
    } else {
      setEditingPost(null);
      setPostForm({ content: "", tweetUrl: "", likes: 0, retweets: 0, replies: 0, postedAt: new Date().toISOString().slice(0, 16) });
    }
    setPostDialog(true);
  };

  const submitPost = () => {
    if (!postForm.content.trim()) { toast.error("내용은 필수입니다"); return; }
    if (!postInfluencerId) return;
    const payload = {
      influencerId: postInfluencerId,
      content: postForm.content,
      tweetUrl: postForm.tweetUrl || undefined,
      likes: postForm.likes,
      retweets: postForm.retweets,
      replies: postForm.replies,
      postedAt: postForm.postedAt || undefined,
    };
    if (editingPost) updatePost.mutate({ id: editingPost.id, content: payload.content, tweetUrl: payload.tweetUrl, likes: payload.likes, retweets: payload.retweets, replies: payload.replies });
    else createPost.mutate(payload);
  };

  // 인플루언서별 포스트 수 계산
  const postCountByInf = (posts as Post[]).reduce((acc: Record<number, number>, p) => {
    acc[p.influencerId] = (acc[p.influencerId] || 0) + 1;
    return acc;
  }, {});

  const categoryLabel = (cat: string | null) => CATEGORIES.find(c => c.value === cat)?.label || cat || "-";

  return (
    <AdminLayout title="SNS 인플루언서 관리">
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">📱 SNS 인플루언서</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              크립토 업계 인플루언서 계정과 소식을 관리합니다.
            </p>
          </div>
          <Button onClick={() => openInfDialog()} className="gap-2 bg-sky-600 hover:bg-sky-700 text-white">
            <Plus className="w-4 h-4" /> 인플루언서 추가
          </Button>
        </div>

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
                        {!inf.isActive && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">비활성</Badge>}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {inf.followerCount && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Users className="w-3 h-3" /> {inf.followerCount}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <MessageSquare className="w-3 h-3" /> 포스트 {postCountByInf[inf.id] || 0}개
                        </span>
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
                          {infPosts.map((post) => (
                            <div key={post.id} className="px-4 py-3 flex gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap line-clamp-3">{post.content}</p>
                                <div className="flex items-center gap-4 mt-1.5">
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
                          ))}
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

      {/* 인플루언서 다이얼로그 */}
      <Dialog open={infDialog} onOpenChange={setInfDialog}>
        <DialogContent className="max-w-md">
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
