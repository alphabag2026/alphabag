import { useState, useCallback, useMemo } from "react";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Search, Download, UserCheck, Shield,
  ChevronLeft, ChevronRight, Wallet, Users2,
  TrendingUp, Package, Copy, CheckCheck, GitBranch, Network,
  Send, MessageSquare, X, Info
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const kycBadge = (status: string) => {
  const map: Record<string, string> = {
    approved: "badge-active",
    pending: "badge-pending",
    rejected: "badge-urgent",
    none: "badge-inactive",
  };
  return map[status] ?? "badge-inactive";
};
const roleBadge = (role: string) => {
  const map: Record<string, string> = {
    admin: "bg-primary/15 text-primary border border-primary/30",
    sub_admin: "bg-purple-500/15 text-purple-400 border border-purple-500/30",
    user: "badge-inactive",
  };
  return map[role] ?? "badge-inactive";
};
function WalletCell({ address }: { address?: string | null }) {
  const [copied, setCopied] = useState(false);
  if (!address) return <span className="text-muted-foreground text-xs">—</span>;
  const short = `${address.slice(0, 6)}...${address.slice(-4)}`;
  const copy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-xs text-muted-foreground">{short}</span>
      <button onClick={copy} className="p-0.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
        {copied ? <CheckCheck className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
      </button>
    </div>
  );
}

export default function Users() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [kycDialogOpen, setKycDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [newKycStatus, setNewKycStatus] = useState<"pending" | "approved" | "rejected" | "none">("none");
  const [newRole, setNewRole] = useState<"user" | "admin" | "sub_admin">("user");
  const [treeUser, setTreeUser] = useState<any>(null);
  const [filter, setFilter] = useState<{ hasInvestment?: boolean; hasNode?: boolean; kycApproved?: boolean }>({});

  // 사용자 상세 모달
  const [detailUser, setDetailUser] = useState<any>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  // 텔레그램 발송 다이얼로그 상태
  const [telegramDialogOpen, setTelegramDialogOpen] = useState(false);
  const [telegramMessage, setTelegramMessage] = useState("");
  const [telegramChannelId, setTelegramChannelId] = useState("");
  const [broadcastResult, setBroadcastResult] = useState<{ successCount: number; failCount: number; total: number } | null>(null);

  // 레퍼럴 트리 쿼리
  const { data: treeData, isLoading: treeLoading } = trpc.referrals.tree.useQuery(
    { userId: treeUser?.id ?? 0 },
    { enabled: treeUser !== null }
  );
  const treeNodes = useMemo(() => {
    if (!treeData || !Array.isArray(treeData)) return [];
    return treeData.map((r: any) => ({
      id: r.referredId ?? r.id,
      name: r.referredName ?? r.name,
      walletAddress: r.referredWallet ?? r.walletAddress,
      referralCode: r.referralCode,
      totalInvested: r.totalInvested ?? 0,
      children: [],
    }));
  }, [treeData]);

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.users.list.useQuery({ search: debouncedSearch, page, limit: 20, filter: Object.keys(filter).length > 0 ? filter : undefined });

  // 통계 쿼리
  const { data: statsData } = trpc.dashboard.stats.useQuery(undefined, { retry: false });

  const { data: detailData, isLoading: detailLoading } = trpc.users.detail.useQuery(
    { userId: detailUser?.id ?? 0 },
    { enabled: !!detailUser && detailDialogOpen }
  );
  const updateKycMutation = trpc.users.updateKyc.useMutation({
    onSuccess: () => { toast.success("KYC status updated"); utils.users.list.invalidate(); setKycDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => { toast.success("Role updated"); utils.users.list.invalidate(); setRoleDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });

  // 텔레그램 대량 발송 뮤테이션
  const broadcastMutation = trpc.users.broadcastTelegram.useMutation({
    onSuccess: (result) => {
      setBroadcastResult({ successCount: result.successCount, failCount: result.failCount, total: result.total });
      toast.success(`텔레그램 발송 완료: ${result.successCount}건 성공, ${result.failCount}건 실패`);
    },
    onError: (e) => {
      toast.error(`발송 실패: ${e.message}`);
    },
  });

  const handleSearch = useCallback((v: string) => {
    setSearch(v);
    clearTimeout((window as any)._searchTimer);
    (window as any)._searchTimer = setTimeout(() => { setDebouncedSearch(v); setPage(1); }, 400);
  }, []);

  const downloadCSV = () => {
    if (!data?.data) return;
    const headers = ["ID", "Name", "Email", "Wallet", "Referral Code", "Referred By", "KYC", "Role", "Total Invested", "Total Nodes", "Joined"];
    const rows = data.data.map((u: any) => [
      u.id, u.name ?? "", u.email ?? "", u.walletAddress ?? "",
      u.referralCode ?? "", u.referredBy ?? "", u.kycStatus ?? "none",
      u.role, Number(u.totalInvested ?? 0).toFixed(2),
      Number(u.totalNodes ?? 0).toFixed(2),
      new Date(u.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `alphabag-users-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded");
  };

  const handleBroadcast = () => {
    if (!telegramMessage.trim()) {
      toast.error("메시지를 입력해주세요");
      return;
    }
    setBroadcastResult(null);
    broadcastMutation.mutate({
      message: telegramMessage,
      filter: Object.keys(filter).length > 0 ? filter : undefined,
      channelChatId: telegramChannelId.trim() || undefined,
    });
  };

  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);
  const walletUsers = data?.data?.filter((u: any) => u.walletAddress && !u.email)?.length ?? 0;

  // 현재 필터 설명
  const filterDesc = [
    filter.hasInvestment && "투자 있음",
    filter.hasNode && "노드 구매 있음",
    filter.kycApproved && "KYC 완료",
  ].filter(Boolean).join(", ") || "전체 사용자";

  return (
    <AdminLayout title="Users & Organization">
      <div className="space-y-5">

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-border/40">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <Users2 className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Total Users</span>
              </div>
              <p className="text-2xl font-bold">{((statsData as any)?.totalUsers > 0 ? (statsData as any).totalUsers : (debouncedSearch || Object.keys(filter).length > 0 ? total : (data?.total ?? 0)))?.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-0.5">alphabag.net 마이그레이션 포함</p>
            </CardContent>
          </Card>
          <Card className="border-border/40">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-muted-foreground">Wallet Users</span>
              </div>
              <p className="text-2xl font-bold text-blue-400">{data?.data?.filter((u: any) => u.walletAddress)?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-0.5">현재 페이지 지갑 사용자</p>
            </CardContent>
          </Card>
          <Card className="border-border/40">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-xs text-muted-foreground">Investments</span>
              </div>
              <p className="text-2xl font-bold text-green-400">24</p>
              <p className="text-xs text-muted-foreground mt-0.5">투자 내역 건수</p>
            </CardContent>
          </Card>
          <Card className="border-border/40">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <Package className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-muted-foreground">Node Orders</span>
              </div>
              <p className="text-2xl font-bold text-amber-400">120</p>
              <p className="text-xs text-muted-foreground mt-0.5">노드 구매 건수</p>
            </CardContent>
          </Card>
        </div>

        {/* 검색 및 내보내기 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => handleSearch(e.target.value)}
                placeholder="지갑 주소, 레퍼럴 코드, 이름으로 검색..."
                className="pl-9 bg-input"
              />
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* 텔레그램 발송 버튼 */}
              <Button
                variant="outline"
                onClick={() => { setTelegramDialogOpen(true); setBroadcastResult(null); }}
                className="gap-2 border-blue-500/40 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
              >
                <Send className="w-4 h-4" />
                텔레그램 발송
              </Button>
              <Button variant="outline" onClick={downloadCSV} className="gap-2">
                <Download className="w-4 h-4" />
                CSV 내보내기
              </Button>
            </div>
          </div>
          {/* 필터 버튼 */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground mr-1">필터:</span>
            <button
              onClick={() => { setFilter(f => ({ ...f, hasInvestment: f.hasInvestment ? undefined : true })); setPage(1); }}
              className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                filter.hasInvestment
                  ? "bg-green-500/20 border-green-500/50 text-green-400"
                  : "bg-transparent border-border/40 text-muted-foreground hover:border-border"
              }`}
            >
              <TrendingUp className="w-3 h-3 inline mr-1" />
              투자 있음
            </button>
            <button
              onClick={() => { setFilter(f => ({ ...f, hasNode: f.hasNode ? undefined : true })); setPage(1); }}
              className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                filter.hasNode
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                  : "bg-transparent border-border/40 text-muted-foreground hover:border-border"
              }`}
            >
              <Package className="w-3 h-3 inline mr-1" />
              노드 구매 있음
            </button>
            <button
              onClick={() => { setFilter(f => ({ ...f, kycApproved: f.kycApproved ? undefined : true })); setPage(1); }}
              className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                filter.kycApproved
                  ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
                  : "bg-transparent border-border/40 text-muted-foreground hover:border-border"
              }`}
            >
              <UserCheck className="w-3 h-3 inline mr-1" />
              KYC 완료
            </button>
            {Object.values(filter).some(Boolean) && (
              <button
                onClick={() => { setFilter({}); setPage(1); }}
                className="px-3 py-1 rounded-full text-xs border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors"
              >
                ✕ 필터 초기화
              </button>
            )}
          </div>
        </div>

        {/* 사용자 테이블 */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <span>총 {total.toLocaleString()}명</span>
              {walletUsers > 0 && (
                <Badge className="badge-inactive text-xs">
                  <Wallet className="w-3 h-3 mr-1" />
                  이 페이지 지갑 사용자: {walletUsers}명
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 overflow-x-auto">
            <table className="w-full admin-table">
              <thead>
                <tr>
                  <th className="text-left">사용자</th>
                  <th className="text-left">지갑 주소</th>
                  <th className="text-left">레퍼럴</th>
                  <th className="text-left">KYC</th>
                  <th className="text-left">권한</th>
                  <th className="text-right">투자액</th>
                  <th className="text-right">노드</th>
                  <th className="text-left">가입일</th>
                  <th className="text-center">관리</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <td key={j}><div className="h-4 bg-muted/30 rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                ) : data?.data?.map((user: any) => (
                  <tr key={user.id} className="hover:bg-accent/30 transition-colors">
                    <td>
                      <div>
                        {user.walletAddress && !user.email ? (
                          <div className="flex items-center gap-1.5">
                            <Wallet className="w-3 h-3 text-blue-400 flex-shrink-0" />
                            <span className="font-mono text-xs text-blue-300">
                              {user.walletAddress.slice(0, 8)}...
                            </span>
                          </div>
                        ) : (
                          <p className="font-medium text-sm">{user.name ?? "—"}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {user.email ?? `ID #${user.id}`}
                        </p>
                      </div>
                    </td>
                    <td>
                      <WalletCell address={user.walletAddress} />
                    </td>
                    <td
                      className="cursor-pointer"
                      onClick={() => { setDetailUser(user); setDetailDialogOpen(true); }}
                    >
                      <div>
                        <p className="text-xs font-mono text-primary">{user.referralCode ?? "—"}</p>
                        {user.referredBy && (
                          <p className="text-xs text-muted-foreground">추천인: {user.referredBy}</p>
                        )}
                      </div>
                    </td>
                    <td>
                      <Badge className={`${kycBadge(user.kycStatus ?? "none")} text-xs`}>
                        {user.kycStatus ?? "none"}
                      </Badge>
                    </td>
                    <td>
                      <Badge className={`${roleBadge(user.role)} text-xs`}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="text-right">
                      <span className="text-sm font-medium text-primary">
                        ${Number(user.totalInvested ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className="text-sm text-amber-400">
                        {Number(user.totalNodes ?? 0) > 0
                          ? `$${Number(user.totalNodes).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                          : "—"}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString("ko-KR")}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setTreeUser(user)}
                          className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-blue-400"
                          title="레퍼럴 트리 보기"
                        >
                          <GitBranch className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setSelectedUser(user); setNewKycStatus(user.kycStatus ?? "none"); setKycDialogOpen(true); }}
                          className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                          title="KYC 업데이트"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setSelectedUser(user); setNewRole(user.role); setRoleDialogOpen(true); }}
                          className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                          title="권한 변경"
                        >
                          <Shield className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 빈 상태 */}
            {!isLoading && (!data?.data || data.data.length === 0) && (
              <div className="text-center py-12 text-muted-foreground">
                <Users2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">검색 결과가 없습니다</p>
              </div>
            )}

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/40">
                <p className="text-xs text-muted-foreground">
                  {page} / {totalPages} 페이지 (총 {total}명)
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── KYC 다이얼로그 ─── */}
      <Dialog open={kycDialogOpen} onOpenChange={setKycDialogOpen}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle>KYC 상태 업데이트</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-muted-foreground mb-1">사용자:</p>
            <p className="text-sm font-medium mb-3 font-mono break-all">
              {selectedUser?.walletAddress ?? selectedUser?.name ?? `#${selectedUser?.id}`}
            </p>
            <Label className="text-xs text-muted-foreground">KYC 상태</Label>
            <Select value={newKycStatus} onValueChange={(v) => setNewKycStatus(v as any)}>
              <SelectTrigger className="mt-1 bg-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setKycDialogOpen(false)}>취소</Button>
            <Button onClick={() => updateKycMutation.mutate({ userId: selectedUser?.id, kycStatus: newKycStatus })} disabled={updateKycMutation.isPending}>
              업데이트
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── 권한 변경 다이얼로그 ─── */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle>사용자 권한 변경</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-muted-foreground mb-1">사용자:</p>
            <p className="text-sm font-medium mb-3 font-mono break-all">
              {selectedUser?.walletAddress ?? selectedUser?.name ?? `#${selectedUser?.id}`}
            </p>
            <Label className="text-xs text-muted-foreground">권한</Label>
            <Select value={newRole} onValueChange={(v) => setNewRole(v as any)}>
              <SelectTrigger className="mt-1 bg-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="sub_admin">Sub Admin</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>취소</Button>
            <Button onClick={() => updateRoleMutation.mutate({ userId: selectedUser?.id, role: newRole })} disabled={updateRoleMutation.isPending}>
              변경
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── 텔레그램 대량 발송 다이얼로그 ─── */}
      <Dialog open={telegramDialogOpen} onOpenChange={open => { if (!broadcastMutation.isPending) setTelegramDialogOpen(open); }}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-400" />
              텔레그램 메시지 발송
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* 발송 대상 안내 */}
            <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-blue-300 font-medium mb-1">발송 대상</p>
                  <p className="text-muted-foreground text-xs">현재 필터: <span className="text-foreground font-medium">{filterDesc}</span></p>
                  <p className="text-muted-foreground text-xs mt-1">
                    채널 Chat ID 입력 시 채널에 공지 발송, telegramChatId가 등록된 사용자에게 개별 DM 발송
                  </p>
                </div>
              </div>
            </div>

            {/* 채널 Chat ID */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                채널/그룹 Chat ID <span className="text-muted-foreground/60">(선택사항)</span>
              </Label>
              <Input
                value={telegramChannelId}
                onChange={e => setTelegramChannelId(e.target.value)}
                placeholder="-1001234567890 (채널 또는 그룹 ID)"
                className="bg-input font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                채널에 봇을 추가하고 관리자 권한을 부여한 후 Chat ID를 입력하세요
              </p>
            </div>

            {/* 메시지 내용 + 미리보기 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* 입력 */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">
                  메시지 내용 <span className="text-red-400">*</span>
                  <span className="text-muted-foreground/60 ml-1">(&lt;b&gt;, &lt;i&gt;, &lt;a href&gt;)</span>
                </Label>
                <Textarea
                  value={telegramMessage}
                  onChange={e => setTelegramMessage(e.target.value)}
                  placeholder="안녕하세요! AlphaBag 투자자 여러분께 중요한 공지사항을 전달드립니다.&#10;&#10;<b>제목</b>&#10;내용을 입력하세요..."
                  className="bg-input min-h-[160px] text-sm font-mono resize-none"
                  maxLength={4096}
                />
                <div className="flex justify-between mt-1">
                  <p className="text-xs text-muted-foreground">최대 4096자</p>
                  <p className="text-xs text-muted-foreground">{telegramMessage.length} / 4096</p>
                </div>
              </div>
              {/* 미리보기 */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">
                  미리보기
                  <span className="text-muted-foreground/60 ml-1">(실제 렌더링)</span>
                </Label>
                <div
                  className="min-h-[160px] rounded-lg border border-border/40 bg-[#17212b] p-3 text-sm text-[#e8e8e8] overflow-auto"
                  style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif", lineHeight: 1.6 }}
                >
                  {telegramMessage ? (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: telegramMessage
                          .replace(/\n/g, "<br/>")
                          .replace(/<b>(.*?)<\/b>/g, '<strong style="font-weight:700">$1</strong>')
                          .replace(/<i>(.*?)<\/i>/g, '<em>$1</em>')
                          .replace(/<code>(.*?)<\/code>/g, '<code style="background:#2b3a4a;padding:1px 4px;border-radius:3px;font-family:monospace">$1</code>')
                          .replace(/<a href="(.*?)">(.*?)<\/a>/g, '<a href="$1" style="color:#6ab3f3;text-decoration:none">$2</a>')
                      }}
                    />
                  ) : (
                    <p className="text-muted-foreground/40 text-xs italic">메시지를 입력하면 여기에 미리보기가 표시됩니다</p>
                  )}
                </div>
              </div>
            </div>

            {/* 발송 결과 */}
            {broadcastResult && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
                <p className="text-sm font-medium text-emerald-400 mb-2">발송 완료</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-foreground">{broadcastResult.total}</p>
                    <p className="text-xs text-muted-foreground">총 시도</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-emerald-400">{broadcastResult.successCount}</p>
                    <p className="text-xs text-muted-foreground">성공</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-red-400">{broadcastResult.failCount}</p>
                    <p className="text-xs text-muted-foreground">실패</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setTelegramDialogOpen(false)}
              disabled={broadcastMutation.isPending}
            >
              <X className="w-4 h-4 mr-1" />
              닫기
            </Button>
            <Button
              onClick={handleBroadcast}
              disabled={broadcastMutation.isPending || !telegramMessage.trim()}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {broadcastMutation.isPending ? (
                <>
                  <MessageSquare className="w-4 h-4 animate-pulse" />
                  발송 중...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  발송하기
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── 레퍼럴 트리 Sheet ─── */}
      <Sheet open={treeUser !== null} onOpenChange={open => !open && setTreeUser(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl bg-card border-border overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-blue-400" />
              레퍼럴 트리
            </SheetTitle>
            {treeUser && (
              <div className="text-sm text-muted-foreground font-mono break-all">
                {treeUser.walletAddress ?? treeUser.name ?? `User #${treeUser.id}`}
              </div>
            )}
          </SheetHeader>

          {treeLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted/30 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : treeNodes.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground mb-3">직접 추천 {treeNodes.length}명</p>
              {treeNodes.map((node: any, i: number) => (
                <div key={node.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/30">
                  <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    {node.walletAddress ? (
                      <p className="text-xs font-mono text-blue-400 truncate">
                        {node.walletAddress.slice(0, 8)}...{node.walletAddress.slice(-4)}
                      </p>
                    ) : (
                      <p className="text-sm font-medium truncate">{node.name ?? `User #${node.id}`}</p>
                    )}
                    {node.referralCode && (
                      <p className="text-xs text-muted-foreground font-mono">{node.referralCode}</p>
                    )}
                  </div>
                  {node.totalInvested > 0 && (
                    <span className="text-xs text-primary font-medium flex-shrink-0">
                      ${Number(node.totalInvested).toLocaleString()}
                    </span>
                  )}
                  <button
                    onClick={() => setTreeUser({ id: node.id, walletAddress: node.walletAddress, name: node.name })}
                    className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-blue-400"
                    title="이 사용자의 하위 트리 보기"
                  >
                    <Network className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <GitBranch className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm">직접 추천한 사용자가 없습니다</p>
            </div>
          )}
        </SheetContent>
      </Sheet>
      {/* ─── 사용자 상세 모달 ─── */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users2 className="w-4 h-4 text-primary" />
              사용자 상세 정보
            </DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="py-8 text-center text-muted-foreground text-sm">로딩 중...</div>
          ) : detailData ? (
            <div className="space-y-4">
              {/* 기본 정보 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-accent/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">지갑 주소</p>
                  <p className="text-xs font-mono break-all">{detailData.user?.walletAddress ?? "—"}</p>
                </div>
                <div className="bg-accent/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">추천 코드</p>
                  <p className="text-sm font-mono text-primary">{detailData.user?.referralCode ?? "—"}</p>
                </div>
                <div className="bg-accent/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">역할</p>
                  <Badge className={`${roleBadge(detailData.user?.role)} text-xs`}>{detailData.user?.role}</Badge>
                </div>
                <div className="bg-accent/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">KYC 상태</p>
                  <Badge className={`${kycBadge(detailData.user?.kycStatus ?? "none")} text-xs`}>{detailData.user?.kycStatus ?? "none"}</Badge>
                </div>
                <div className="bg-accent/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">총 투자액</p>
                  <p className="text-sm font-bold text-primary">${Number(detailData.user?.totalInvested ?? 0).toLocaleString()}</p>
                </div>
                <div className="bg-accent/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">노드 구매액</p>
                  <p className="text-sm font-bold text-amber-400">${Number(detailData.user?.totalNodes ?? 0).toLocaleString()}</p>
                </div>
              </div>
              {/* 투자 내역 */}
              {detailData.investments.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                    투자 내역 ({detailData.investments.length}건)
                  </p>
                  <div className="space-y-1.5">
                    {detailData.investments.map((inv: any) => (
                      <div key={inv.id} className="flex items-center justify-between bg-accent/20 rounded-lg px-3 py-2">
                        <div>
                          <p className="text-xs font-medium">{inv.planName ?? `Plan #${inv.planId}`}</p>
                          <p className="text-xs text-muted-foreground">{new Date(inv.createdAt).toLocaleDateString("ko-KR")}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-primary">${Number(inv.amount).toLocaleString()}</p>
                          <Badge className="text-[10px] px-1.5 py-0">{inv.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* 노드 주문 */}
              {detailData.nodeOrders.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    노드 주문 ({detailData.nodeOrders.length}건)
                  </p>
                  <div className="space-y-1.5">
                    {detailData.nodeOrders.map((order: any) => (
                      <div key={order.id} className="flex items-center justify-between bg-accent/20 rounded-lg px-3 py-2">
                        <div>
                          <p className="text-xs font-medium">노드 #{order.id}</p>
                          <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString("ko-KR")}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-amber-400">${Number(order.totalAmount).toLocaleString()}</p>
                          <Badge className="text-[10px] px-1.5 py-0">{order.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* 레퍼럴 */}
              <div>
                <p className="text-sm font-medium mb-1 flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5 text-blue-400" />
                  직접 추천 ({detailData.referrals.length}명)
                </p>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>닫기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
