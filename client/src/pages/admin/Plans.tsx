import React, { useState, useRef } from "react";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, GripVertical, TrendingUp, Coins, Upload, Sparkles, FileText, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

type PlanType = "investment" | "staking";

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
  onepageUrl: string;
  sortOrder: string;
  isActive: boolean;
  isMLM: boolean;
  planType: PlanType;
  tags: string;
}

const defaultForm: PlanForm = {
  name: "", logoUrl: "", label: "", dailyRate: "0.5",
  minAmount: "100", maxAmount: "", duration: "30",
  totalReturn: "", description: "", urlId: "", onepageUrl: "",
  sortOrder: "0", isActive: true, isMLM: false, planType: "investment", tags: "",
};

function PlanCard({ plan, onEdit, onDelete, onToggle, onLogoUpload, uploadingPlanId, inlineEditId, inlineEditRate, setInlineEditId, setInlineEditRate, onUpdateRate }: {
  plan: any;
  onEdit: (plan: any) => void;
  onDelete: (id: number) => void;
  onToggle: (id: number, current: boolean) => void;
  onLogoUpload: (planId: number, file: File) => void;
  uploadingPlanId: number | null;
  inlineEditId: number | null;
  inlineEditRate: string;
  setInlineEditId: (id: number | null) => void;
  setInlineEditRate: (rate: string) => void;
  onUpdateRate: (id: number, rate: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const isUploading = uploadingPlanId === plan.id;
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl border border-border/40 bg-card hover:border-primary/30 transition-all group">
      <GripVertical className="w-4 h-4 text-muted-foreground/40 cursor-grab flex-shrink-0" />
      {/* 로고 영역 - 클릭하면 업로드 */}
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
        {/* 업로드 중 오버레이 */}
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
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-semibold text-sm truncate">{plan.name}</span>
          {plan.label && (
            <Badge variant="outline" className="text-xs px-1.5 py-0 h-4 border-primary/30 text-primary">{plan.label}</Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {inlineEditId === plan.id ? (
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <input
                type="number" step="0.01" value={inlineEditRate}
                onChange={e => setInlineEditRate(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    onUpdateRate(plan.id, inlineEditRate);
                  } else if (e.key === "Escape") { setInlineEditId(null); }
                }}
                autoFocus
                style={{ width: 70, padding: "0.15rem 0.4rem", borderRadius: 6, border: "1px solid #f59e0b", background: "var(--ab-bg)", color: "#f59e0b", fontSize: 12, fontWeight: 700 }}
              />
              <span style={{ fontSize: 11, color: "#888" }}>% daily</span>
              <button onClick={() => { onUpdateRate(plan.id, inlineEditRate); }}
                style={{ fontSize: 11, color: "#22c55e", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>✓</button>
              <button onClick={() => setInlineEditId(null)}
                style={{ fontSize: 11, color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>✕</button>
            </span>
          ) : (
            <span className="text-primary font-medium" style={{ cursor: "pointer" }}
              title="클릭하여 수익률 수정"
              onClick={() => { setInlineEditId(plan.id); setInlineEditRate(plan.dailyRate); }}>
              {plan.dailyRate}% daily ✎
            </span>
          )}
          {plan.duration && <span>{plan.duration}d</span>}
          {plan.minAmount && <span>Min: ${Number(plan.minAmount).toLocaleString()}</span>}
          {plan.urlId && <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{plan.urlId}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge className={plan.isActive ? "badge-active" : "badge-inactive"}>
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
  const [activeTab, setActiveTab] = useState<PlanType>("investment");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [form, setForm] = useState<PlanForm>(defaultForm);
  const [uploadingPlanId, setUploadingPlanId] = useState<number | null>(null);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiExtraPrompt, setAiExtraPrompt] = useState("");
  const [showAiPanel, setShowAiPanel] = useState(false);
  const aiFileRef = React.useRef<HTMLInputElement>(null);
  const [inlineEditId, setInlineEditId] = useState<number | null>(null);
  const [inlineEditRate, setInlineEditRate] = useState<string>("");

  const utils = trpc.useUtils();
  const { data: plans, isLoading } = trpc.plans.list.useQuery({ planType: activeTab });

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
  const [pendingLogoFile, setPendingLogoFile] = React.useState<File | null>(null);
  const uploadLogoMutation = trpc.plans.uploadLogo.useMutation({
    onSuccess: (data) => {
      toast.success("✅ 로고 업로드 완료!");
      setForm(f => ({ ...f, logoUrl: data.url }));
      setUploadingPlanId(null);
      setPendingLogoFile(null);
      utils.plans.list.invalidate();
    },
    onError: (e) => { toast.error(e.message); setUploadingPlanId(null); },
  });

  const analyzeFileMutation = trpc.plans.analyzeFile.useMutation({
    onSuccess: (data) => {
      const d = data.data;
      setForm(f => ({
        ...f,
        name: d.name || f.name,
        description: d.description || f.description,
        logoUrl: d.logoUrl || f.logoUrl,
        tags: d.tags?.join(", ") || f.tags,
      }));
      // 추가 필드 처리 - revenueModel, telegramUrl, youtubeUrl, twitterUrl, websiteUrl
      if (d.revenueModel) toast.info(`수익모델: ${d.revenueModel.substring(0, 80)}...`);
      if (d.telegramUrl) toast.info(`텔레그램: ${d.telegramUrl}`);
      if (d.youtubeUrl) toast.info(`유튜브: ${d.youtubeUrl}`);
      toast.success("✅ AI 분석 완료! 폼에 자동 입력되었습니다.");
      setAiAnalyzing(false);
      setShowAiPanel(false);
    },
    onError: (e) => { toast.error("AI 분석 실패: " + e.message); setAiAnalyzing(false); },
  });
  const handleAiAnalyze = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("파일은 10MB 이하여야 합니다."); return; }
    setAiAnalyzing(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const base64 = dataUrl.split(",")[1];
      analyzeFileMutation.mutate({
        base64,
        mimeType: file.type,
        fileName: file.name,
        extraPrompt: aiExtraPrompt || undefined,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Image must be under 2MB"); return; }
    if (!editingPlan) {
      // 신규 생성 시: 로컬 미리보기만 표시 (저장 후 업로드 안내)
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        setForm(f => ({ ...f, logoUrl: dataUrl }));
        setPendingLogoFile(file);
      };
      reader.readAsDataURL(file);
      return;
    }
    if (file.size > 2 * 1024 * 1024) { toast.error("Image must be under 2MB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = (ev.target?.result as string).split(",")[1];
      uploadLogoMutation.mutate({
        planId: editingPlan.id,
        base64,
        mimeType: file.type,
        fileName: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  const openCreate = () => {
    setEditingPlan(null);
    setForm({ ...defaultForm, planType: activeTab });
    setPendingLogoFile(null);
    setDialogOpen(true);
  };

  const openEdit = (plan: any) => {
    setEditingPlan(plan);
    setPendingLogoFile(null);
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
      onepageUrl: plan.onepageUrl ?? "",
      sortOrder: plan.sortOrder?.toString() ?? "0",
      isActive: plan.isActive ?? true,
      isMLM: plan.isMLM ?? false,
      planType: plan.planType ?? activeTab,
      tags: Array.isArray(plan.tags) ? plan.tags.join(", ") : "",
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
      onepageUrl: form.onepageUrl || undefined,
      sortOrder: Number(form.sortOrder),
      isActive: form.isActive,
      isMLM: form.isMLM,
      planType: form.planType,
      tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : undefined,
    };
    if (editingPlan) {
      updateMutation.mutate({ id: editingPlan.id, ...payload });
    } else {
      if (pendingLogoFile) {
        // 신규 생성 후 로고 업로드: 먼저 생성하고 ID를 받아서 업로드
        createMutation.mutate(payload, {
          onSuccess: () => {
            // 생성 후 목록 새로고침하여 새 플랜 ID 획득 후 업로드
            utils.plans.list.invalidate();
            setPendingLogoFile(null);
          }
        });
      } else {
        createMutation.mutate(payload);
      }
    }
  };

  const handleToggle = (id: number, current: boolean) => {
    updateMutation.mutate({ id, isActive: !current });
  };

  return (
    <AdminLayout title="Investment Plans">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">Manage investment and staking plans</p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Plan
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as PlanType)}>
          <TabsList className="bg-muted/50">
            <TabsTrigger value="investment" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Investment Plans
              <Badge variant="outline" className="ml-1 text-xs">
                {plans?.filter((p: any) => p.planType === "investment").length ?? 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="staking" className="gap-2">
              <Coins className="w-4 h-4" />
              Staking Plans
              <Badge variant="outline" className="ml-1 text-xs">
                {plans?.filter((p: any) => p.planType === "staking").length ?? 0}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {(["investment", "staking"] as PlanType[]).map((type) => (
            <TabsContent key={type} value={type} className="mt-4">
              <Card className="border-border/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {plans?.length ?? 0} plans configured
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {isLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 rounded-xl bg-muted/30 animate-pulse" />
                      ))}
                    </div>
                  ) : plans && plans.length > 0 ? (
                    <div className="space-y-2">
                      {plans.map((plan: any) => (
          <PlanCard
                key={plan.id}
                plan={plan}
                onEdit={openEdit}
                onDelete={(id) => setDeleteId(id)}
                onToggle={(id, cur) => updateMutation.mutate({ id, isActive: !cur })}
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
                inlineEditId={inlineEditId}
                inlineEditRate={inlineEditRate}
                setInlineEditId={setInlineEditId}
                setInlineEditRate={setInlineEditRate}
                onUpdateRate={(id, rate) => { updateMutation.mutate({ id, dailyRate: rate }); setInlineEditId(null); }}
              />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <TrendingUp className="w-10 h-10 text-muted-foreground/30 mb-3" />
                      <p className="text-muted-foreground text-sm">No {type} plans yet</p>
                      <Button variant="outline" size="sm" onClick={openCreate} className="mt-3 gap-2">
                        <Plus className="w-3 h-3" />
                        Create First Plan
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display">{editingPlan ? "Edit Plan" : "Create New Plan"}</DialogTitle>
          </DialogHeader>
          {/* AI 자동완성 패널 */}
          <div className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium text-amber-400">AI 자동완성</span>
                <span className="text-xs text-muted-foreground">PPT/PDF/이미지 업로드 시 자동 입력</span>
              </div>
              <Button type="button" variant="ghost" size="sm" className="h-7 gap-1.5 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                onClick={() => setShowAiPanel(v => !v)}>
                {showAiPanel ? <X className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                {showAiPanel ? "닫기" : "파일 선택"}
              </Button>
            </div>
            {showAiPanel && (
              <div className="space-y-2">
                <textarea
                  className="w-full text-xs bg-input border border-border rounded-lg p-2 resize-none text-foreground placeholder:text-muted-foreground"
                  rows={2}
                  placeholder="추가 정보 입력 (선택): 수익모델, 텔레그램, 유튜브 링크 등을 텍스트로 입력하면 AI가 함께 분석합니다."
                  value={aiExtraPrompt}
                  onChange={e => setAiExtraPrompt(e.target.value)}
                />
                <div className="flex gap-2">
                  <input ref={aiFileRef} type="file" accept="image/*,.pdf,.ppt,.pptx" className="hidden" onChange={handleAiAnalyze} />
                  <Button type="button" variant="outline" size="sm" className="gap-1.5 border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                    disabled={aiAnalyzing} onClick={() => aiFileRef.current?.click()}>
                    {aiAnalyzing ? (
                      <><span className="animate-spin">⟳</span> AI 분석 중...</>
                    ) : (
                      <><Upload className="w-3 h-3" /> 파일 업로드 & AI 분석</>
                    )}
                  </Button>
                  {aiExtraPrompt && (
                    <Button type="button" variant="outline" size="sm" className="gap-1.5 border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                      disabled={aiAnalyzing} onClick={() => {
                        if (!aiExtraPrompt.trim()) return;
                        setAiAnalyzing(true);
                        analyzeFileMutation.mutate({ base64: "", mimeType: "text/plain", fileName: "prompt.txt", extraPrompt: aiExtraPrompt });
                      }}>
                      <Sparkles className="w-3 h-3" /> 텍스트만으로 분석
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
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
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoFileChange} />
                    <Button type="button" variant="outline" size="sm" className="gap-1.5 whitespace-nowrap" asChild>
                      <span>
                        {uploadLogoMutation.isPending ? (
                          <span className="text-xs">Uploading...</span>
                        ) : (
                          <><Upload className="w-3 h-3" /> {pendingLogoFile ? "변경" : "Upload"}</>
                        )}
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Label / Badge</Label>
              <Input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="e.g. Popular, New" className="mt-1 bg-input" />
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
              <Label className="text-xs text-muted-foreground">1page.to URL</Label>
              <Input value={form.onepageUrl} onChange={e => setForm(f => ({ ...f, onepageUrl: e.target.value }))} placeholder="nice.1page.to" className="mt-1 bg-input font-mono text-xs" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Sort Order</Label>
              <Input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))} className="mt-1 bg-input" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Plan Type</Label>
              <div className="flex gap-2 mt-1">
                {(["investment", "staking"] as PlanType[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setForm(f => ({ ...f, planType: t }))}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                      form.planType === t
                        ? "bg-primary/15 border-primary/30 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/20"
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div>
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
