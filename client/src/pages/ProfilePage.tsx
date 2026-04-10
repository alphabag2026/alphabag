import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Link } from "wouter";
import { toast } from "sonner";
import {
  ArrowLeft, Loader2, Wallet, User, Shield, Copy,
  CheckCircle2, AlertCircle, Clock, Send, ExternalLink, Link2,
  MessageSquare, Lock, ChevronDown, ChevronUp, Trash2, Pencil, Bell,
  Plane, Hotel, FileText, Upload, Download, Plus, X, Calendar, StickyNote
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWallet } from "@/contexts/WalletContext";

export default function ProfilePage() {
  const { user, isAuthenticated, loading } = useAuth({ redirectOnUnauthenticated: true });
  const [walletInput, setWalletInput] = useState("");
  const [referralInput, setReferralInput] = useState("");
  const [telegramInput, setTelegramInput] = useState("");
  const { isConnected, address: walletAddress, openModal, isTronConnected, tronAddress, signAndAuth } = useWallet();
  const [signing, setSigning] = useState(false);

  const { data: profile, refetch } = trpc.user.profile.useQuery(undefined, { enabled: isAuthenticated });

  const updateWallet = trpc.user.updateWallet.useMutation({
    onSuccess: () => {
      toast.success("Wallet address updated!");
      setWalletInput("");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const registerReferral = trpc.user.registerReferral.useMutation({
    onSuccess: (data) => {
      toast.success(`Referral registered! Referred by: ${data.referrer?.name}`);
      setReferralInput("");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateTelegram = trpc.users.updateMyTelegramChatId.useMutation({
    onSuccess: () => {
      toast.success("Telegram Chat ID registered!");
      setTelegramInput("");
      refetch();
    },
    onError: (err: any) => toast.error(err.message),
  });

  // 내 Q&A
  const utils = trpc.useUtils();
  const { data: myQna, isLoading: qnaLoading } = trpc.qna.listMine.useQuery(undefined, { enabled: isAuthenticated });
  const [expandedQna, setExpandedQna] = useState<number | null>(null);
  const [editingQnaId, setEditingQnaId] = useState<number | null>(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editIsPrivate, setEditIsPrivate] = useState(false);
  const [editCategory, setEditCategory] = useState("general");
  const [deletingQnaId, setDeletingQnaId] = useState<number | null>(null);

  const deleteQna = trpc.qna.deleteMine.useMutation({
    onSuccess: () => {
      toast.success("질문이 삭제되었습니다.");
      setDeletingQnaId(null);
      utils.qna.listMine.invalidate();
    },
    onError: (err: any) => {
      toast.error(err.message || "삭제에 실패했습니다.");
      setDeletingQnaId(null);
    },
  });

  const updateQna = trpc.qna.updateMine.useMutation({
    onSuccess: () => {
      toast.success("질문이 수정되었습니다.");
      setEditingQnaId(null);
      utils.qna.listMine.invalidate();
    },
    onError: (err: any) => toast.error(err.message || "수정에 실패했습니다."),
  });

  // Q&A 알림 설정
  const updateQnaNotification = trpc.users.updateQnaNotification.useMutation({
    onSuccess: () => {
      toast.success("알림 설정이 저장되었습니다.");
      refetch();
    },
    onError: (err: any) => toast.error(err.message || "알림 설정 저장에 실패했습니다."),
  });

  // ─── Travel Documents (입국심사 체크리스트) ─────────────────────────────────
  const { data: travelDocs, refetch: refetchDocs } = trpc.travelDocs.list.useQuery(undefined, { enabled: isAuthenticated });
  const [docDialogOpen, setDocDialogOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<null | { id?: number; docType: string; title: string; fileUrl?: string; expiryDate?: string; note?: string }>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docUploading, setDocUploading] = useState(false);

  const upsertDoc = trpc.travelDocs.upsert.useMutation({
    onSuccess: () => {
      toast.success(editingDoc?.id ? "서류가 수정되었습니다." : "서류가 등록되었습니다.");
      setDocDialogOpen(false);
      setEditingDoc(null);
      setDocFile(null);
      refetchDocs();
    },
    onError: (err: any) => toast.error(err.message || "저장에 실패했습니다."),
  });

  const uploadDocFile = trpc.travelDocs.uploadFile.useMutation();

  const deleteDoc = trpc.travelDocs.delete.useMutation({
    onSuccess: () => {
      toast.success("서류가 삭제되었습니다.");
      refetchDocs();
    },
    onError: (err: any) => toast.error(err.message || "삭제에 실패했습니다."),
  });

  const docTypeConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    passport: { label: "여권", icon: <User className="w-4 h-4" />, color: "text-blue-400" },
    flight_ticket: { label: "항공권", icon: <Plane className="w-4 h-4" />, color: "text-sky-400" },
    hotel_voucher: { label: "호텔 바우처", icon: <Hotel className="w-4 h-4" />, color: "text-amber-400" },
    visa: { label: "비자", icon: <Shield className="w-4 h-4" />, color: "text-purple-400" },
    travel_insurance: { label: "여행자 보험", icon: <FileText className="w-4 h-4" />, color: "text-green-400" },
    other: { label: "기타", icon: <StickyNote className="w-4 h-4" />, color: "text-muted-foreground" },
  };

  const CHECKLIST_TYPES = ["passport", "flight_ticket", "hotel_voucher", "visa", "travel_insurance"];

  // PDF 생성 (파일 없는 서류의 정보를 텍스트 PDF로 생성)
  const handleGeneratePdf = (doc: { docType: string; title: string; expiryDate?: string | null; note?: string | null }) => {
    const cfg = docTypeConfig[doc.docType] ?? docTypeConfig.other;
    const content = [
      `AlphaBag - 여행 서류`,
      ``,
      `서류 종류: ${cfg.label}`,
      `제목: ${doc.title}`,
      doc.expiryDate ? `만료일: ${doc.expiryDate}` : '',
      doc.note ? `메모: ${doc.note}` : '',
      ``,
      `생성일시: ${new Date().toLocaleString('ko-KR')}`,
    ].filter(Boolean).join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cfg.label}_${doc.title.replace(/[^a-zA-Z0-9가-힣]/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('서류 정보가 다운로드되었습니다.');
  };

  const handleDocSave = async () => {
    if (!editingDoc) return;
    let fileUrl = editingDoc.fileUrl;
    if (docFile) {
      setDocUploading(true);
      try {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(docFile);
        });
        const result = await uploadDocFile.mutateAsync({
          fileName: docFile.name,
          fileType: docFile.type,
          fileBase64: base64,
        });
        fileUrl = result.url;
      } catch (e: any) {
        toast.error("파일 업로드 실패: " + e.message);
        setDocUploading(false);
        return;
      }
      setDocUploading(false);
    }
    upsertDoc.mutate({
      id: editingDoc.id,
      docType: editingDoc.docType as any,
      title: editingDoc.title,
      fileUrl,
      expiryDate: editingDoc.expiryDate,
      note: editingDoc.note,
    });
  };

  const generateCode = trpc.user.generateReferralCode.useMutation({
    onSuccess: (data) => {
      toast.success(`Code generated: ${data.code}`);
      refetch();
    },
  });

  const kycStatusConfig = {
    none: { label: "Not Submitted", icon: AlertCircle, color: "text-muted-foreground", bg: "bg-muted/30" },
    pending: { label: "Pending Review", icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/10" },
    approved: { label: "Approved", icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/10" },
    rejected: { label: "Rejected", icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10" },
  };

  const kycStatus = profile?.kycStatus ?? "none";
  const kycCfg = kycStatusConfig[kycStatus];

  const categoryLabel = (cat: string) => {
    const map: Record<string, string> = { general: '일반', investment: '투자', account: '계정', payment: '결제', technical: '기술' };
    return map[cat] ?? cat;
  };

  const startEdit = (q: { id: number; question: string; isPrivate: boolean; category: string }) => {
    setEditingQnaId(q.id);
    setEditQuestion(q.question);
    setEditIsPrivate(q.isPrivate);
    setEditCategory(q.category);
    setExpandedQna(q.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </Button>
          </Link>
          <span className="text-sm font-medium">My Profile</span>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        {/* Profile Info */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4 text-primary" /> Account Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-bold text-2xl">
                  {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                </span>
              </div>
              <div>
                <p className="font-semibold text-foreground text-lg">{user?.name ?? "—"}</p>
                <p className="text-sm text-muted-foreground">{user?.email ?? "—"}</p>
                <Badge variant="outline" className="mt-1 text-xs capitalize">{user?.role ?? "user"}</Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/30">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Invested</p>
                <p className="font-semibold text-foreground">${Number(profile?.totalInvested ?? 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Nodes</p>
                <p className="font-semibold text-foreground">{Number(profile?.totalNodes ?? 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KYC Status */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" /> KYC Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`flex items-center gap-3 p-4 rounded-lg ${kycCfg.bg}`}>
              <kycCfg.icon className={`w-5 h-5 ${kycCfg.color}`} />
              <div>
                <p className={`font-medium text-sm ${kycCfg.color}`}>{kycCfg.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {kycStatus === "none" && "Submit your KYC documents to unlock full platform access."}
                  {kycStatus === "pending" && "Your documents are under review. This usually takes 1-3 business days."}
                  {kycStatus === "approved" && "Your identity has been verified. Full platform access enabled."}
                  {kycStatus === "rejected" && "Your KYC was rejected. Please contact support for assistance."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Wallet */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="w-4 h-4 text-primary" /> 지갑 연결
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 현재 연결된 지갑 */}
            {isConnected && walletAddress && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-green-400 font-medium mb-0.5">
                    {isTronConnected ? "TronLink 연결됨 (TRON)" : "지갑 연결됨"}
                  </p>
                  <code className="text-xs font-mono text-foreground break-all">{walletAddress}</code>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 flex-shrink-0"
                  onClick={() => {
                    navigator.clipboard.writeText(walletAddress);
                    toast.success("주소가 복사되었습니다.");
                  }}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            )}

            {/* DB 저장된 지갑 주소 */}
            {profile?.walletAddress && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50 border border-border/30">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">등록된 지갑 주소</p>
                  <code className="text-sm font-mono text-foreground break-all">{profile.walletAddress}</code>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 flex-shrink-0"
                  onClick={() => {
                    navigator.clipboard.writeText(profile.walletAddress!);
                    toast.success("복사되었습니다!");
                  }}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            )}

            {/* 지갑 연결 버튼 */}
            {!isConnected ? (
              <Button
                className="w-full gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold"
                onClick={openModal}
              >
                <Link2 className="w-4 h-4" />
                지갑 연결하기 (MetaMask / TronLink / WalletConnect)
              </Button>
            ) : (
              !isTronConnected && (
                <Button
                  className="w-full gap-2"
                  onClick={async () => {
                    setSigning(true);
                    await signAndAuth();
                    setSigning(false);
                    refetch();
                  }}
                  disabled={signing}
                >
                  {signing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  서명으로 계정에 지갑 연결
                </Button>
              )
            )}

            {/* 수동 입력 */}
            <div className="pt-2 border-t border-border/30">
              <p className="text-xs text-muted-foreground mb-2">또는 직접 주소 입력</p>
              <div className="flex gap-2">
                <Input
                  placeholder="지갑 주소 입력 (0x... 또는 T...)"
                  value={walletInput}
                  onChange={(e) => setWalletInput(e.target.value)}
                  className="font-mono text-sm bg-background/50"
                />
                <Button
                  onClick={() => walletInput && updateWallet.mutate({ walletAddress: walletInput })}
                  disabled={!walletInput || updateWallet.isPending}
                  className="flex-shrink-0"
                >
                  {updateWallet.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "저장"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Telegram */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="w-4 h-4 text-primary" /> Telegram Notification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile?.telegramChatId ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-400">Telegram Connected</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">Chat ID: {profile.telegramChatId}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                <p className="text-sm text-yellow-400">Not connected. Register your Telegram Chat ID to receive notifications.</p>
              </div>
            )}
            <div className="p-3 rounded-lg bg-muted/30 border border-border/30 space-y-1">
              <p className="text-xs font-medium text-foreground">How to get your Chat ID:</p>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Open Telegram and search for <span className="font-mono text-primary">@userinfobot</span></li>
                <li>Send <span className="font-mono">/start</span> — it will reply with your Chat ID</li>
                <li>Paste the numeric ID below</li>
              </ol>
              <a
                href="https://t.me/userinfobot"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
              >
                Open @userinfobot <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Enter your Telegram Chat ID (numeric)"
                value={telegramInput}
                onChange={(e) => setTelegramInput(e.target.value)}
                className="font-mono text-sm bg-background/50"
              />
              <Button
                onClick={() => telegramInput && updateTelegram.mutate({ chatId: telegramInput })}
                disabled={!telegramInput || updateTelegram.isPending}
                className="flex-shrink-0"
              >
                {updateTelegram.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Referral */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Referral System</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* My Code */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">My Referral Code</Label>
              {profile?.referralCode ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <code className="flex-1 text-sm font-mono font-bold text-primary">{profile.referralCode}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => {
                      navigator.clipboard.writeText(profile.referralCode!);
                      toast.success("Code copied!");
                    }}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateCode.mutate()}
                  disabled={generateCode.isPending}
                >
                  {generateCode.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null}
                  Generate My Code
                </Button>
              )}
            </div>

            {/* Referred By */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Referred By</Label>
              {profile?.referredBy ? (
                <div className="p-3 rounded-lg bg-background/50 border border-border/30">
                  <code className="text-sm font-mono text-foreground">{profile.referredBy}</code>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter referral code"
                    value={referralInput}
                    onChange={(e) => setReferralInput(e.target.value)}
                    className="text-sm bg-background/50"
                  />
                  <Button
                    onClick={() => referralInput && registerReferral.mutate({ referralCode: referralInput })}
                    disabled={!referralInput || registerReferral.isPending}
                    variant="outline"
                    className="flex-shrink-0"
                  >
                    {registerReferral.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Apply"}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 내 Q&A */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" /> 내 Q&A
              {myQna && myQna.length > 0 && (
                <Badge variant="secondary" className="ml-auto text-xs">{myQna.length}개</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Q&A 알림 설정 */}
            <div className="p-3 rounded-lg bg-muted/20 border border-border/30 space-y-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Q&A 답변 알림 설정</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground">텔레그램 알림</p>
                  <p className="text-xs text-muted-foreground">답변 시 텔레그램 DM으로 알림</p>
                </div>
                <Switch
                  checked={profile?.qnaNotifyTelegram ?? true}
                  onCheckedChange={(checked) => updateQnaNotification.mutate({ qnaNotifyTelegram: checked })}
                  disabled={updateQnaNotification.isPending}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground">이메일 알림</p>
                  <p className="text-xs text-muted-foreground">답변 시 이메일로 알림</p>
                </div>
                <Switch
                  checked={profile?.qnaNotifyEmail ?? true}
                  onCheckedChange={(checked) => updateQnaNotification.mutate({ qnaNotifyEmail: checked })}
                  disabled={updateQnaNotification.isPending}
                />
              </div>
            </div>

            {/* Q&A 목록 */}
            {qnaLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : !myQna || myQna.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">아직 등록한 Q&A가 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myQna.map((q) => (
                  <div
                    key={q.id}
                    className="rounded-lg border border-border/40 bg-background/50 overflow-hidden"
                  >
                    {/* 헤더 버튼 */}
                    <button
                      className="w-full flex items-start gap-3 p-3 text-left hover:bg-muted/20 transition-colors"
                      onClick={() => {
                        if (editingQnaId === q.id) return;
                        setExpandedQna(expandedQna === q.id ? null : q.id);
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {q.isPrivate && <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {categoryLabel(q.category ?? 'general')}
                          </Badge>
                          {q.answer ? (
                            <Badge className="text-[10px] px-1.5 py-0 bg-green-500/20 text-green-400 border-green-500/30">답변완료</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-yellow-400 border-yellow-500/30">답변대기</Badge>
                          )}
                          <span className="text-[10px] text-muted-foreground ml-auto">
                            {new Date(q.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-foreground line-clamp-2">{q.question}</p>
                      </div>
                      {expandedQna === q.id ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      )}
                    </button>

                    {/* 펼쳐진 내용 */}
                    {expandedQna === q.id && (
                      <div className="px-3 pb-3 space-y-2 border-t border-border/30 pt-3">
                        {/* 수정 폼 */}
                        {editingQnaId === q.id ? (
                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs text-muted-foreground mb-1 block">질문 수정</Label>
                              <Textarea
                                value={editQuestion}
                                onChange={(e) => setEditQuestion(e.target.value)}
                                className="text-sm bg-background/50 min-h-[80px]"
                                placeholder="질문 내용을 입력하세요"
                              />
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <Label className="text-xs text-muted-foreground">카테고리</Label>
                                <select
                                  value={editCategory}
                                  onChange={(e) => setEditCategory(e.target.value)}
                                  className="text-xs bg-background border border-border/40 rounded px-2 py-1 text-foreground"
                                >
                                  <option value="general">일반</option>
                                  <option value="investment">투자</option>
                                  <option value="account">계정</option>
                                  <option value="payment">결제</option>
                                  <option value="technical">기술</option>
                                </select>
                              </div>
                              <div className="flex items-center gap-2">
                                <Label className="text-xs text-muted-foreground">비밀글</Label>
                                <Switch
                                  checked={editIsPrivate}
                                  onCheckedChange={setEditIsPrivate}
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => updateQna.mutate({ id: q.id, question: editQuestion, isPrivate: editIsPrivate, category: editCategory })}
                                disabled={updateQna.isPending || !editQuestion.trim()}
                                className="gap-1"
                              >
                                {updateQna.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                                저장
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingQnaId(null)}
                                disabled={updateQna.isPending}
                              >
                                취소
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="p-3 rounded-lg bg-muted/20">
                              <p className="text-xs text-muted-foreground mb-1 font-medium">질문</p>
                              <p className="text-sm text-foreground whitespace-pre-wrap">{q.question}</p>
                            </div>
                            {q.answer ? (
                              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                                <p className="text-xs text-primary mb-1 font-medium">관리자 답변</p>
                                <p className="text-sm text-foreground whitespace-pre-wrap">{q.answer}</p>
                                {q.answeredAt && (
                                  <p className="text-[10px] text-muted-foreground mt-2">
                                    {new Date(q.answeredAt).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                                <p className="text-xs text-yellow-400">아직 답변이 등록되지 않았습니다. 답변 시 텔레그램/이메일로 알림을 받으실 수 있습니다.</p>
                              </div>
                            )}
                            {/* 수정/삭제 버튼 (답변 전에만 표시) */}
                            {!q.answer && (
                              <div className="flex gap-2 pt-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1 text-xs h-7"
                                  onClick={() => startEdit({ id: q.id, question: q.question ?? '', isPrivate: q.isPrivate, category: q.category ?? 'general' })}
                                >
                                  <Pencil className="w-3 h-3" /> 수정
                                </Button>
                                {deletingQnaId === q.id ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">정말 삭제하시겠습니까?</span>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      className="gap-1 text-xs h-7"
                                      onClick={() => deleteQna.mutate({ id: q.id })}
                                      disabled={deleteQna.isPending}
                                    >
                                      {deleteQna.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "확인"}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs h-7"
                                      onClick={() => setDeletingQnaId(null)}
                                      disabled={deleteQna.isPending}
                                    >
                                      취소
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1 text-xs h-7 text-red-400 border-red-400/30 hover:bg-red-500/10"
                                    onClick={() => setDeletingQnaId(q.id)}
                                  >
                                    <Trash2 className="w-3 h-3" /> 삭제
                                  </Button>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        {/* 입국심사 체크리스트 */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Plane className="w-4 h-4 text-primary" /> 입국심사 체크리스트
              </CardTitle>
              <Button size="sm" variant="outline" className="gap-1" onClick={() => { setEditingDoc({ docType: 'passport', title: '' }); setDocDialogOpen(true); }}>
                <Plus className="w-3 h-3" /> 서류 등록
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 체크리스트 요약 */}
            <div className="grid grid-cols-5 gap-2">
              {CHECKLIST_TYPES.map((type) => {
                const cfg = docTypeConfig[type];
                const registered = travelDocs?.some(d => d.docType === type);
                return (
                  <div key={type} className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-center ${
                    registered ? 'border-green-500/40 bg-green-500/10' : 'border-border/40 bg-muted/20'
                  }`}>
                    <div className={`${registered ? 'text-green-400' : 'text-muted-foreground'}`}>
                      {registered ? <CheckCircle2 className="w-5 h-5" /> : cfg.icon}
                    </div>
                    <span className="text-[10px] text-muted-foreground leading-tight">{cfg.label}</span>
                    {registered && <span className="text-[9px] text-green-400 font-medium">등록완료</span>}
                  </div>
                );
              })}
            </div>

            {/* 등록된 서류 목록 */}
            {travelDocs && travelDocs.length > 0 ? (
              <div className="space-y-2">
                {travelDocs.map((doc) => {
                  const cfg = docTypeConfig[doc.docType] ?? docTypeConfig.other;
                  return (
                    <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/40 bg-muted/10 hover:bg-muted/20 transition-colors">
                      <div className={`${cfg.color} flex-shrink-0`}>{cfg.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">{cfg.label}</span>
                          {doc.expiryDate && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {doc.expiryDate}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium truncate">{doc.title}</p>
                        {doc.note && <p className="text-xs text-muted-foreground truncate">{doc.note}</p>}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {doc.fileUrl && (
                          <>
                            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                              <Button size="icon" variant="ghost" className="w-7 h-7" title="파일 보기">
                                <ExternalLink className="w-3 h-3" />
                              </Button>
                            </a>
                            <a href={doc.fileUrl} download>
                              <Button size="icon" variant="ghost" className="w-7 h-7" title="PDF/파일 다운로드">
                                <Download className="w-3 h-3" />
                              </Button>
                            </a>
                          </>
                        )}
                        {!doc.fileUrl && (
                          <Button size="icon" variant="ghost" className="w-7 h-7" title="PDF 생성" onClick={() => handleGeneratePdf(doc)}>
                            <Download className="w-3 h-3" />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => {
                          setEditingDoc({ id: doc.id, docType: doc.docType, title: doc.title, fileUrl: doc.fileUrl ?? undefined, expiryDate: doc.expiryDate ?? undefined, note: doc.note ?? undefined });
                          setDocDialogOpen(true);
                        }}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="w-7 h-7 text-destructive hover:text-destructive" onClick={() => deleteDoc.mutate({ id: doc.id })}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground text-sm">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>등록된 여행 서류가 없습니다.</p>
                <p className="text-xs mt-1">여권, 항공권, 호텔 바우처를 등록하세요.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 서류 등록/수정 다이얼로그 */}
      <Dialog open={docDialogOpen} onOpenChange={(open) => { if (!open) { setDocDialogOpen(false); setEditingDoc(null); setDocFile(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingDoc?.id ? '여행 서류 수정' : '여행 서류 등록'}</DialogTitle>
          </DialogHeader>
          {editingDoc && (
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>서류 종류</Label>
                <Select value={editingDoc.docType} onValueChange={(v) => setEditingDoc({ ...editingDoc, docType: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(docTypeConfig).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>제목 <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="예: 인천→하노이 왕복 항공권"
                  value={editingDoc.title}
                  onChange={(e) => setEditingDoc({ ...editingDoc, title: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>만료일 (선택)</Label>
                <Input
                  type="date"
                  value={editingDoc.expiryDate ?? ''}
                  onChange={(e) => setEditingDoc({ ...editingDoc, expiryDate: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>메모 (선택)</Label>
                <Textarea
                  placeholder="추가 메모..."
                  value={editingDoc.note ?? ''}
                  onChange={(e) => setEditingDoc({ ...editingDoc, note: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-1">
                <Label>파일 쳊부 (이미지/PDF, 선택)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    className="text-sm"
                    onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
                  />
                  {editingDoc.fileUrl && !docFile && (
                    <a href={editingDoc.fileUrl} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline" className="gap-1 flex-shrink-0">
                        <ExternalLink className="w-3 h-3" /> 보기
                      </Button>
                    </a>
                  )}
                </div>
                {docFile && <p className="text-xs text-muted-foreground">선택된 파일: {docFile.name}</p>}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDocDialogOpen(false); setEditingDoc(null); setDocFile(null); }}>취소</Button>
            <Button
              onClick={handleDocSave}
              disabled={!editingDoc?.title || upsertDoc.isPending || docUploading}
            >
              {(upsertDoc.isPending || docUploading) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingDoc?.id ? '수정' : '등록'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
