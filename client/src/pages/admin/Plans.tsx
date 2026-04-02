import { useState, useRef } from "react";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, GripVertical, TrendingUp, Upload, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

type AllPlanType = "investment" | "staking" | "golden" | "self" | "node" | "leader" | "meme" | "influencer";

const PLAN_TYPE_OPTIONS: { value: AllPlanType; label: string; emoji: string; color: string }[] = [
  { value: "golden",     label: "Golden Collection",  emoji: "🏆", color: "text-yellow-500" },
  { value: "self",       label: "Self Collection",    emoji: "⚡", color: "text-blue-500" },
  { value: "node",       label: "Node Products",      emoji: "🔷", color: "text-cyan-500" },
  { value: "leader",     label: "Leader Collection",  emoji: "👑", color: "text-purple-500" },
  { value: "meme",       label: "Meme Token",         emoji: "🚀", color: "text-pink-500" },
  { value: "influencer", label: "Influencer",         emoji: "⭐", color: "text-orange-500" },
  { value: "investment", label: "Investment",         emoji: "📈", color: "text-green-500" },
  { value: "staking",    label: "Staking",            emoji: "💎", color: "text-indigo-500" },
];

const getPlanTypeInfo = (type: string) =>
  PLAN_TYPE_OPTIONS.find(o => o.value === type) ?? { value: type, label: type, emoji: "📋", color: "text-muted-foreground" };

interface PlanForm {
  name: string;
  logoUrl: string;
  label: string;
  dailyRate: string;
  minAmount: string;
  maxAmount: string;
  duration: string;
  totalReturn: string;
  description: string;
  urlId: string;
  sortOrder: string;
  isActive: boolean;
  isMLM: boolean;
  planType: AllPlanType;
  tags: string;
  onepageUrl: string;
}

const defaultForm: PlanForm = {
  name: "", logoUrl: "", label: "", dailyRate: "0.5",
  minAmount: "100", maxAmount: "", duration: "30",
  totalReturn: "", description: "", urlId: "",
  sortOrder: "0", isActive: true, isMLM: false, planType: "self", tags: "",
  onepageUrl: "",
};

function PlanCard({ plan, onEdit, onDelete, onToggle, onLogoUpload, uploadingPlanId, onSectionChange }: {
  plan: any;
  onEdit: (plan: any) => void;
  onDelete: (id: number) => void;
  onToggle: (id: number, current: boolean) => void;
  onLogoUpload: (planId: number, file: File) => void;
  uploadingPlanId: number | null;
  onSectionChange: (id: number, planType: AllPlanType) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const isUploading = uploadingPlanId === plan.id;
  const typeInfo = getPlanTypeInfo(plan.planType);

  return (
    <div className="flex items-center gap-3 p-4 rounded-xl border border-border/40 bg-card hover:border-primary/30 transition-all group">
      <GripVertical className="w-4 h-4 text-muted-foreground/40 cursor-grab flex-shrink-0" />
      {/* 로고 영역 */}
      <div
        className={`w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden relative group/logo transition-all ${isUploading ? 'ring-2 ring-primary/60 cursor-wait' : 'cursor-pointer hover:ring-2 hover:ring-primary/40'}`}
        title={isUploading ? "업로드 중..." : "로고 업로드"}
        onClick={() => !isUploading && fileRef.current?.click()}
      >
        {plan.logoUrl ? (
          <img src={plan.logoUrl} alt={plan.name} className="w-full h-full object-cover rounded-lg" />
        ) : (
          <TrendingUp className="w-5 h-5 text-primary" />
        )}
        {isUploading ? (
          <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          </div>
        ) : (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/logo:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
            <Upload className="w-3.5 h-3.5 text-white" />
          </div>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) onLogoUpload(plan.id, file);
          e.target.value = "";
        }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className="font-semibold text-sm truncate">{plan.name}</span>
          {plan.label && (
            <Badge variant="outline" className="text-xs px-1.5 py-0 h-4 border-primary/30 text-primary">{plan.label}</Badge>
          )}
          {plan.onepageUrl && (
            <Badge variant="outline" className="text-xs px-1.5 py-0 h-4 border-blue-400/40 text-blue-400">1P</Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="text-primary font-medium">{plan.dailyRate}% daily</span>
          {plan.duration && <span>{plan.duration}d</span>}
          {plan.minAmount && <span>Min: ${Number(plan.minAmount).toLocaleString()}</span>}
        </div>
      </div>

      {/* 섹션 변경 셀렉트 */}
      <div className="flex-shrink-0">
        <Select
          value={plan.planType}
          onValueChange={(val) => onSectionChange(plan.id, val as AllPlanType)}
        >
          <SelectTrigger className="h-7 text-xs w-[140px] border-border/50 bg-muted/30">
            <span className={`flex items-center gap-1 ${typeInfo.color}`}>
              <span>{typeInfo.emoji}</span>
              <span>{typeInfo.label}</span>
            </span>
          </SelectTrigger>
          <SelectContent>
            {PLAN_TYPE_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                <span className={`flex items-center gap-1.5 ${opt.color}`}>
                  <span>{opt.emoji}</span>
                  <span>{opt.label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge className={plan.isActive ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-muted text-muted-foreground"}>
          {plan.isActive ? "Active" : "Inactive"}
        </Badge>
        {plan.isMLM && (
          <Badge className="bg-purple-500 text-white border-0 text-xs">MLM</Badge>
        )}
        <button
          onClick={() => onToggle(plan.id, plan.isActive)}
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          {plan.isActive ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5" />}
        </button>
        <button onClick={() => onEdit(plan)} className="text-muted-foreground hover:text-primary transition-colors">
          <Pencil className="w-4 h-4" />
        </button>
        <button onClick={() => onDelete(plan.id)} className="text-muted-foreground hover:text-destructive transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function Plans() {
  const [activeTab, setActiveTab] = useState<AllPlanType | "all">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [form, setForm] = useState<PlanForm>(defaultForm);
  const [uploadingPlanId, setUploadingPlanId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  // 전체 플랜 조회 (필터 없이)
  const { data: allPlans = [], isLoading } = trpc.plans.list.useQuery({});

  // 탭별 필터링
  const plans = activeTab === "all" ? allPlans : allPlans.filter((p: any) => p.planType === activeTab);

  const createMutation = trpc.plans.create.useMutation({
    onSuccess: () => { toast.success("Plan created successfully"); utils.plans.list.invalidate(); setDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.plans.update.useMutation({
    onSuccess: () => { toast.success("Plan updated successfully"); utils.plans.list.invalidate(); setDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.plans.delete.useMutation({
    onSuccess: () => { toast.success("Plan deleted"); utils.plans.list.invalidate(); setDeleteId(null); },
    onError: (e) => toast.error(e.message),
  });
  const uploadLogoMutation = trpc.plans.uploadLogo.useMutation({
    onSuccess: (data) => {
      toast.success("✅ 로고 업로드 완료!");
      setForm(f => ({ ...f, logoUrl: data.url }));
      setUploadingPlanId(null);
      utils.plans.list.invalidate();
    },
    onError: (e) => { toast.error(e.message); setUploadingPlanId(null); },
  });

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingPlan) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Image must be under 2MB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = (ev.target?.result as string).split(",")[1];
      uploadLogoMutation.mutate({ planId: editingPlan.id, base64, mimeType: file.type, fileName: file.name });
    };
    reader.readAsDataURL(file);
  };

  const openCreate = () => {
    setEditingPlan(null);
    setForm({ ...defaultForm, planType: activeTab === "all" ? "self" : activeTab });
    setDialogOpen(true);
  };

  const openEdit = (plan: any) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name ?? "",
      logoUrl: plan.logoUrl ?? "",
      label: plan.label ?? "",
      dailyRate: plan.dailyRate ?? "0.5",
      minAmount: plan.minAmount ?? "",
      maxAmount: plan.maxAmount ?? "",
      duration: plan.duration?.toString() ?? "",
      totalReturn: plan.totalReturn ?? "",
      description: plan.description ?? "",
      urlId: plan.urlId ?? "",
      sortOrder: plan.sortOrder?.toString() ?? "0",
      isActive: plan.isActive ?? true,
      isMLM: plan.isMLM ?? false,
      planType: plan.planType ?? "self",
      tags: Array.isArray(plan.tags) ? plan.tags.join(", ") : "",
      onepageUrl: plan.onepageUrl ?? "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const payload = {
      name: form.name,
      logoUrl: form.logoUrl || undefined,
      label: form.label || undefined,
      dailyRate: form.dailyRate,
      minAmount: form.minAmount || undefined,
      maxAmount: form.maxAmount || undefined,
      duration: form.duration ? Number(form.duration) : undefined,
      totalReturn: form.totalReturn || undefined,
      description: form.description || undefined,
      urlId: form.urlId || undefined,
      sortOrder: Number(form.sortOrder),
      isActive: form.isActive,
      isMLM: form.isMLM,
      planType: form.planType as any,
      tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : undefined,
    };
    if (editingPlan) {
      updateMutation.mutate({ id: editingPlan.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // 섹션 직접 변경 (카드에서 셀렉트로)
  const handleSectionChange = (id: number, planType: AllPlanType) => {
    updateMutation.mutate({ id, planType: planType as any }, {
      onSuccess: () => {
        const typeInfo = getPlanTypeInfo(planType);
        toast.success(`${typeInfo.emoji} ${typeInfo.label} 섹션으로 이동했습니다`);
        utils.plans.list.invalidate();
      },
    });
  };

  const TAB_OPTIONS: { value: AllPlanType | "all"; label: string; emoji: string }[] = [
    { value: "all",        label: "전체",               emoji: "📋" },
    { value: "golden",     label: "Golden",             emoji: "🏆" },
    { value: "self",       label: "Self",               emoji: "⚡" },
    { value: "node",       label: "Node",               emoji: "🔷" },
    { value: "leader",     label: "Leader",             emoji: "👑" },
    { value: "meme",       label: "Meme",               emoji: "🚀" },
    { value: "influencer", label: "Influencer",         emoji: "⭐" },
    { value: "investment", label: "Investment",         emoji: "📈" },
    { value: "staking",    label: "Staking",            emoji: "💎" },
  ];

  return (
    <AdminLayout title="Investment Plans">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">
              플랜 섹션 변경: 각 플랜 우측의 드롭다운에서 섹션을 바로 변경할 수 있습니다
            </p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Plan
          </Button>
        </div>

        {/* 섹션 탭 필터 */}
        <div className="flex flex-wrap gap-2">
          {TAB_OPTIONS.map(tab => {
            const count = tab.value === "all"
              ? allPlans.length
              : allPlans.filter((p: any) => p.planType === tab.value).length;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  activeTab === tab.value
                    ? "bg-primary/15 border-primary/40 text-primary"
                    : "border-border/40 text-muted-foreground hover:border-primary/20 hover:text-foreground"
                }`}
              >
                <span>{tab.emoji}</span>
                <span>{tab.label}</span>
                <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                  activeTab === tab.value ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                }`}>{count}</span>
              </button>
            );
          })}
        </div>

        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {plans.length}개 플랜
              {activeTab !== "all" && (
                <span className="ml-2">
                  — {getPlanTypeInfo(activeTab).emoji} {getPlanTypeInfo(activeTab).label}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 rounded-xl bg-muted/30 animate-pulse" />
                ))}
              </div>
            ) : plans.length > 0 ? (
              <div className="space-y-2">
                {plans.map((plan: any) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    onEdit={openEdit}
                    onDelete={(id) => setDeleteId(id)}
                    onToggle={(id, cur) => updateMutation.mutate({ id, isActive: !cur } as any)}
                    onLogoUpload={(planId, file) => {
                      if (file.size > 2 * 1024 * 1024) { toast.error("Image must be under 2MB"); return; }
                      setUploadingPlanId(planId);
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const base64 = (ev.target?.result as string).split(",")[1];
                        uploadLogoMutation.mutate({ planId, base64, mimeType: file.type, fileName: file.name });
                      };
                      reader.readAsDataURL(file);
                    }}
                    uploadingPlanId={uploadingPlanId}
                    onSectionChange={handleSectionChange}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <TrendingUp className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-sm">이 섹션에 플랜이 없습니다</p>
                <Button variant="outline" size="sm" onClick={openCreate} className="mt-3 gap-2">
                  <Plus className="w-3 h-3" />
                  플랜 추가
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display">{editingPlan ? "Edit Plan" : "Create New Plan"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground">Plan Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Gold Starter" className="mt-1 bg-input" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Logo</Label>
              <div className="mt-1 space-y-2">
                {form.logoUrl && (
                  <div className="flex items-center gap-2">
                    <img src={form.logoUrl} alt="logo" className="w-10 h-10 rounded-lg object-cover border border-border" />
                    <span className="text-xs text-muted-foreground truncate max-w-[180px]">{form.logoUrl.split("/").pop()}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <Input value={form.logoUrl} onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))} placeholder="https://..." className="bg-input text-xs" />
                  {editingPlan && (
                    <label className="cursor-pointer">
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoFileChange} />
                      <Button type="button" variant="outline" size="sm" className="gap-1.5 whitespace-nowrap" asChild>
                        <span>
                          {uploadLogoMutation.isPending ? (
                            <span className="text-xs">Uploading...</span>
                          ) : (
                            <><Upload className="w-3 h-3" /> Upload</>
                          )}
                        </span>
                      </Button>
                    </label>
                  )}
                </div>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Label / Badge</Label>
              <Input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="e.g. Popular, New" className="mt-1 bg-input" />
            </div>

            {/* 섹션(planType) 선택 - 핵심 기능 */}
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground font-semibold">섹션 (Section) *</Label>
              <p className="text-xs text-muted-foreground/70 mb-2">이 플랜이 홈 화면의 어느 섹션에 표시될지 선택하세요</p>
              <div className="grid grid-cols-4 gap-2">
                {PLAN_TYPE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, planType: opt.value }))}
                    className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg text-xs font-medium border transition-all ${
                      form.planType === opt.value
                        ? "bg-primary/15 border-primary/40 text-primary"
                        : "border-border/40 text-muted-foreground hover:border-primary/20 hover:text-foreground"
                    }`}
                  >
                    <span className="text-lg">{opt.emoji}</span>
                    <span className="leading-tight text-center">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Daily Rate (%) *</Label>
              <Input type="number" step="0.01" value={form.dailyRate} onChange={e => setForm(f => ({ ...f, dailyRate: e.target.value }))} className="mt-1 bg-input" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Duration (days)</Label>
              <Input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} placeholder="30" className="mt-1 bg-input" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Min Amount (USDT)</Label>
              <Input type="number" value={form.minAmount} onChange={e => setForm(f => ({ ...f, minAmount: e.target.value }))} placeholder="100" className="mt-1 bg-input" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Max Amount (USDT)</Label>
              <Input type="number" value={form.maxAmount} onChange={e => setForm(f => ({ ...f, maxAmount: e.target.value }))} placeholder="Unlimited" className="mt-1 bg-input" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Total Return (%)</Label>
              <Input type="number" step="0.01" value={form.totalReturn} onChange={e => setForm(f => ({ ...f, totalReturn: e.target.value }))} placeholder="Auto-calculated" className="mt-1 bg-input" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">URL ID</Label>
              <Input value={form.urlId} onChange={e => setForm(f => ({ ...f, urlId: e.target.value }))} placeholder="gold-starter" className="mt-1 bg-input font-mono" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Sort Order</Label>
              <Input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))} className="mt-1 bg-input" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">1page.to URL</Label>
              <Input value={form.onepageUrl} onChange={e => setForm(f => ({ ...f, onepageUrl: e.target.value }))} placeholder="https://1page.to/..." className="mt-1 bg-input" />
            </div>
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground">Tags (comma-separated)</Label>
              <Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="beginner, low-risk" className="mt-1 bg-input" />
            </div>
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground">Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Plan description..." className="mt-1 bg-input resize-none" rows={3} />
            </div>
            <div className="col-span-2 flex items-center gap-3">
              <Switch checked={form.isActive} onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))} />
              <Label className="text-sm">Active (visible to users)</Label>
            </div>
            <div className="col-span-2 flex items-center gap-3">
              <Switch checked={form.isMLM} onCheckedChange={v => setForm(f => ({ ...f, isMLM: v }))} />
              <Label className="text-sm">MLM (다단계 마케팅 플랜으로 표시)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingPlan ? "Update Plan" : "Create Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Plan</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. The plan will be permanently deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
