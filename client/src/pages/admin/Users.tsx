import { useState, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Search, Download, UserCheck, Shield,
  ChevronLeft, ChevronRight, Wallet, Users2,
  TrendingUp, Package, Copy, CheckCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

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
  const [detailOpen, setDetailOpen] = useState(false);
  const [newKycStatus, setNewKycStatus] = useState<"pending" | "approved" | "rejected" | "none">("none");
  const [newRole, setNewRole] = useState<"user" | "admin" | "sub_admin">("user");

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.users.list.useQuery({ search: debouncedSearch, page, limit: 20 });

  // 통계 쿼리
  const { data: statsData } = trpc.dashboard.stats.useQuery(undefined, { retry: false });

  const updateKycMutation = trpc.users.updateKyc.useMutation({
    onSuccess: () => { toast.success("KYC status updated"); utils.users.list.invalidate(); setKycDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => { toast.success("Role updated"); utils.users.list.invalidate(); setRoleDialogOpen(false); },
    onError: (e) => toast.error(e.message),
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

  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  // 지갑 주소 기반 사용자 수 (마이그레이션된 사용자)
  const walletUsers = data?.data?.filter((u: any) => u.walletAddress && !u.email)?.length ?? 0;

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
              <p className="text-2xl font-bold">{(statsData as any)?.totalUsers?.toLocaleString() ?? total.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-0.5">alphabag.net 마이그레이션 포함</p>
            </CardContent>
          </Card>
          <Card className="border-border/40">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-muted-foreground">Wallet Users</span>
              </div>
              <p className="text-2xl font-bold text-blue-400">663</p>
              <p className="text-xs text-muted-foreground mt-0.5">지갑 주소 기반 사용자</p>
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
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="지갑 주소, 레퍼럴 코드, 이름으로 검색..."
              className="pl-9 bg-input"
            />
          </div>
          <Button variant="outline" onClick={downloadCSV} className="gap-2 flex-shrink-0">
            <Download className="w-4 h-4" />
            CSV 내보내기
          </Button>
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
                    <td>
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
                  {/* 페이지 번호 버튼 */}
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

      {/* KYC 다이얼로그 */}
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

      {/* 권한 변경 다이얼로그 */}
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
    </AdminLayout>
  );
}
