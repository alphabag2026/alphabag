import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Coins, ExternalLink, Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    draft: "badge-inactive",
    active: "badge-active",
    completed: "badge-resolved",
    cancelled: "badge-urgent",
  };
  return map[status] ?? "badge-inactive";
};

const defaultForm = {
  name: "", description: "", tokenSymbol: "USDT", totalAmount: "",
  perUserAmount: "", maxParticipants: "", startDate: "", endDate: "",
  status: "draft", requiresKyc: false, requiresMinInvestment: false,
  minInvestmentAmount: "",
  // 홈 에어드랍 탭 표시용 필드
  projectName: "", imageUrl: "", participateUrl: "", isHot: false, sortOrder: "0",
};

export default function Airdrops() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(defaultForm);

  const utils = trpc.useUtils();
  const { data: campaigns, isLoading } = trpc.airdrops.list.useQuery();

  const createMutation = trpc.airdrops.create.useMutation({
    onSuccess: () => { toast.success("에어드랍 캠페인이 생성되었습니다"); utils.airdrops.list.invalidate(); setDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.airdrops.update.useMutation({
    onSuccess: () => { toast.success("캠페인이 수정되었습니다"); utils.airdrops.list.invalidate(); setDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.airdrops.delete.useMutation({
    onSuccess: () => { toast.success("캠페인이 삭제되었습니다"); utils.airdrops.list.invalidate(); setDeleteId(null); },
    onError: (e) => toast.error(e.message),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (campaign: any) => {
    setEditing(campaign);
    setForm({
      name: campaign.name ?? "",
      description: campaign.description ?? "",
      tokenSymbol: campaign.tokenSymbol ?? "USDT",
      totalAmount: campaign.totalAmount ?? "",
      perUserAmount: campaign.perUserAmount ?? "",
      maxParticipants: campaign.maxParticipants?.toString() ?? "",
      startDate: campaign.startDate ? new Date(campaign.startDate).toISOString().slice(0, 16) : "",
      endDate: campaign.endDate ? new Date(campaign.endDate).toISOString().slice(0, 16) : "",
      status: campaign.status ?? "draft",
      requiresKyc: campaign.requiresKyc ?? false,
      requiresMinInvestment: campaign.requiresMinInvestment ?? false,
      minInvestmentAmount: campaign.minInvestmentAmount ?? "",
      projectName: campaign.projectName ?? "",
      imageUrl: campaign.imageUrl ?? "",
      participateUrl: campaign.participateUrl ?? "",
      isHot: campaign.isHot ?? false,
      sortOrder: campaign.sortOrder?.toString() ?? "0",
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) { toast.error("캠페인 이름을 입력해주세요"); return; }
    if (!form.totalAmount) { toast.error("총 풀 금액을 입력해주세요"); return; }
    const payload = {
      name: form.name,
      description: form.description || undefined,
      tokenSymbol: form.tokenSymbol || "USDT",
      totalAmount: form.totalAmount,
      perUserAmount: form.perUserAmount || undefined,
      maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : undefined,
      startDate: form.startDate ? new Date(form.startDate) : undefined,
      endDate: form.endDate ? new Date(form.endDate) : undefined,
      status: form.status,
      requiresKyc: form.requiresKyc,
      requiresMinInvestment: form.requiresMinInvestment,
      minInvestmentAmount: form.minInvestmentAmount || undefined,
      projectName: form.projectName || undefined,
      imageUrl: form.imageUrl || undefined,
      participateUrl: form.participateUrl || undefined,
      isHot: form.isHot,
      sortOrder: form.sortOrder ? Number(form.sortOrder) : 0,
    };
    editing ? updateMutation.mutate({ id: editing.id, ...payload }) : createMutation.mutate(payload);
  };

  const setF = (key: string, value: any) => setForm((f: any) => ({ ...f, [key]: value }));

  return (
    <AdminLayout title="에어드랍 관리">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">에어드랍 캠페인을 등록하면 홈 화면 에어드랍 탭에 표시됩니다 (status: active)</p>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            신규 캠페인 추가
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-muted/30 animate-pulse" />
            ))}
          </div>
        ) : campaigns && campaigns.length > 0 ? (
          <div className="space-y-3">
            {campaigns.map((campaign: any) => (
              <Card key={campaign.id} className="border-border/40 hover:border-primary/20 transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {/* 이미지 또는 아이콘 */}
                    {campaign.imageUrl ? (
                      <img src={campaign.imageUrl} alt={campaign.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-border/40" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Coins className="w-6 h-6 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-sm">{campaign.name}</h3>
                        {campaign.projectName && campaign.projectName !== campaign.name && (
                          <span className="text-xs text-muted-foreground">({campaign.projectName})</span>
                        )}
                        <Badge className={`${statusBadge(campaign.status)} text-xs`}>{campaign.status}</Badge>
                        {campaign.isHot && (
                          <Badge className="bg-orange-500/15 text-orange-500 border-orange-500/30 text-xs gap-1">
                            <Flame className="w-2.5 h-2.5" /> HOT
                          </Badge>
                        )}
                        {campaign.requiresKyc && <Badge variant="outline" className="text-xs">KYC</Badge>}
                      </div>
                      {campaign.description && (
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{campaign.description}</p>
                      )}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground">총 풀</p>
                          <p className="text-sm font-semibold text-primary">{Number(campaign.totalAmount).toLocaleString()} {campaign.tokenSymbol}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">1인당</p>
                          <p className="text-sm font-semibold">{campaign.perUserAmount ? `${Number(campaign.perUserAmount).toLocaleString()} ${campaign.tokenSymbol}` : "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">참여자</p>
                          <p className="text-sm font-semibold">{campaign.currentParticipants ?? 0}{campaign.maxParticipants ? ` / ${campaign.maxParticipants}` : ""}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">정렬순서</p>
                          <p className="text-sm font-semibold">{campaign.sortOrder ?? 0}</p>
                        </div>
                      </div>
                      {(campaign.startDate || campaign.endDate) && (
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {campaign.startDate && `시작: ${new Date(campaign.startDate).toLocaleDateString("ko-KR")}`}
                          {campaign.startDate && campaign.endDate && " · "}
                          {campaign.endDate && `종료: ${new Date(campaign.endDate).toLocaleDateString("ko-KR")}`}
                        </p>
                      )}
                      {campaign.participateUrl && (
                        <a href={campaign.participateUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1">
                          <ExternalLink className="w-3 h-3" /> 참여 링크
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button variant="outline" size="sm" onClick={() => openEdit(campaign)} className="h-8 gap-1.5 text-xs">
                        <Pencil className="w-3 h-3" /> 수정
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setDeleteId(campaign.id)} className="h-8 px-2 hover:border-destructive/50 hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border/40 rounded-xl">
            <Coins className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">등록된 에어드랍 캠페인이 없습니다</p>
            <p className="text-xs text-muted-foreground/60 mt-1 mb-3">신규 캠페인을 추가하면 홈 화면 에어드랍 탭에 표시됩니다</p>
            <Button variant="outline" size="sm" onClick={openCreate} className="gap-2">
              <Plus className="w-3 h-3" /> 첫 캠페인 추가
            </Button>
          </div>
        )}
      </div>

      {/* 생성/수정 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display">{editing ? "캠페인 수정" : "신규 에어드랍 캠페인 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">

            {/* 섹션 1: 기본 정보 */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">기본 정보</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">캠페인 이름 *</Label>
                  <Input value={form.name} onChange={e => setF("name", e.target.value)} placeholder="예: Genesis Airdrop" className="mt-1 bg-input" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">프로젝트명 (홈 표시용)</Label>
                  <Input value={form.projectName} onChange={e => setF("projectName", e.target.value)} placeholder="예: AlphaBag" className="mt-1 bg-input" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">상태</Label>
                  <Select value={form.status} onValueChange={v => setF("status", v)}>
                    <SelectTrigger className="mt-1 bg-input"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="draft">Draft (비공개)</SelectItem>
                      <SelectItem value="active">Active (홈 노출)</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">설명</Label>
                  <Textarea value={form.description} onChange={e => setF("description", e.target.value)} className="mt-1 bg-input resize-none" rows={2} placeholder="에어드랍 참여 조건 및 안내 내용" />
                </div>
              </div>
            </div>

            {/* 섹션 2: 홈 노출 설정 */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">홈 화면 노출 설정</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">프로젝트 이미지 URL</Label>
                  <Input value={form.imageUrl} onChange={e => setF("imageUrl", e.target.value)} placeholder="https://..." className="mt-1 bg-input" />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">참여 링크 URL</Label>
                  <Input value={form.participateUrl} onChange={e => setF("participateUrl", e.target.value)} placeholder="https://..." className="mt-1 bg-input" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">정렬 순서 (높을수록 상단)</Label>
                  <Input type="number" value={form.sortOrder} onChange={e => setF("sortOrder", e.target.value)} placeholder="0" className="mt-1 bg-input" />
                </div>
                <div className="flex items-center gap-3 pt-5">
                  <Switch checked={form.isHot} onCheckedChange={v => setF("isHot", v)} />
                  <Label className="text-sm flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-orange-500" /> HOT 배지 표시
                  </Label>
                </div>
              </div>
            </div>

            {/* 섹션 3: 토큰 배분 설정 */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">토큰 배분 설정</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">토큰 심볼</Label>
                  <Input value={form.tokenSymbol} onChange={e => setF("tokenSymbol", e.target.value)} placeholder="USDT" className="mt-1 bg-input" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">총 풀 금액 *</Label>
                  <Input type="number" value={form.totalAmount} onChange={e => setF("totalAmount", e.target.value)} placeholder="10000" className="mt-1 bg-input" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">1인당 지급량</Label>
                  <Input type="number" value={form.perUserAmount} onChange={e => setF("perUserAmount", e.target.value)} placeholder="100" className="mt-1 bg-input" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">최대 참여자 수</Label>
                  <Input type="number" value={form.maxParticipants} onChange={e => setF("maxParticipants", e.target.value)} placeholder="제한 없음" className="mt-1 bg-input" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">시작일</Label>
                  <Input type="datetime-local" value={form.startDate} onChange={e => setF("startDate", e.target.value)} className="mt-1 bg-input" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">종료일</Label>
                  <Input type="datetime-local" value={form.endDate} onChange={e => setF("endDate", e.target.value)} className="mt-1 bg-input" />
                </div>
              </div>
            </div>

            {/* 섹션 4: 참여 조건 */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">참여 조건</p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Switch checked={form.requiresKyc} onCheckedChange={v => setF("requiresKyc", v)} />
                  <Label className="text-sm">KYC 인증 필요</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={form.requiresMinInvestment} onCheckedChange={v => setF("requiresMinInvestment", v)} />
                  <Label className="text-sm">최소 투자금액 조건</Label>
                </div>
                {form.requiresMinInvestment && (
                  <div>
                    <Label className="text-xs text-muted-foreground">최소 투자금액</Label>
                    <Input type="number" value={form.minInvestmentAmount} onChange={e => setF("minInvestmentAmount", e.target.value)} placeholder="100" className="mt-1 bg-input" />
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>취소</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? "저장 중..." : editing ? "수정 저장" : "캠페인 생성"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>캠페인 삭제</AlertDialogTitle>
            <AlertDialogDescription>이 작업은 되돌릴 수 없습니다. 캠페인을 영구 삭제하시겠습니까?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive" onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}>삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
