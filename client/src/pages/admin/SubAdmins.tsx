import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Shield, UserPlus, Trash2, Crown, ShieldCheck, KeyRound, ToggleLeft, ToggleRight, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const roleBadge = (role: string, isActive: boolean) => {
  if (!isActive) return "bg-muted/30 text-muted-foreground border border-border/40";
  if (role === "admin") return "bg-primary/15 text-primary border border-primary/30";
  if (role === "sub_admin") return "bg-purple-500/15 text-purple-400 border border-purple-500/30";
  return "badge-inactive";
};

const roleIcon = (role: string) => {
  if (role === "admin") return Crown;
  if (role === "sub_admin") return ShieldCheck;
  return Shield;
};

export default function SubAdmins() {
  const [createOpen, setCreateOpen] = useState(false);
  const [pwDialogId, setPwDialogId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // 생성 폼
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "sub_admin">("sub_admin");
  const [showNewPw, setShowNewPw] = useState(false);

  // 비밀번호 변경 폼
  const [changePw, setChangePw] = useState("");
  const [showChangePw, setShowChangePw] = useState(false);

  const utils = trpc.useUtils();
  const { data: accounts, isLoading } = trpc.adminAuth.list.useQuery();

  const createMutation = trpc.adminAuth.create.useMutation({
    onSuccess: () => {
      toast.success("관리자 계정이 생성되었습니다");
      utils.adminAuth.list.invalidate();
      setCreateOpen(false);
      setNewUsername(""); setNewPassword(""); setNewRole("sub_admin");
    },
    onError: (e) => toast.error(e.message),
  });

  const changePasswordMutation = trpc.adminAuth.changePassword.useMutation({
    onSuccess: () => {
      toast.success("비밀번호가 변경되었습니다");
      setPwDialogId(null); setChangePw("");
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleActiveMutation = trpc.adminAuth.toggleActive.useMutation({
    onSuccess: (_, vars) => {
      toast.success(vars.isActive ? "계정이 활성화되었습니다" : "계정이 비활성화되었습니다");
      utils.adminAuth.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.adminAuth.delete.useMutation({
    onSuccess: () => {
      toast.success("계정이 삭제되었습니다");
      utils.adminAuth.list.invalidate();
      setDeleteId(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const pwTarget = accounts?.find((a: any) => a.id === pwDialogId);
  const deleteTarget = accounts?.find((a: any) => a.id === deleteId);

  return (
    <AdminLayout title="관리자 계정 관리">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            관리자 계정을 추가하고 권한을 관리합니다. 총 <span className="text-foreground font-medium">{accounts?.length ?? 0}개</span> 계정
          </p>
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <UserPlus className="w-4 h-4" />
            계정 추가
          </Button>
        </div>

        {/* 계정 목록 */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              관리자 계정 목록
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 bg-muted/30 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : accounts && accounts.length > 0 ? (
              <div className="space-y-2">
                {accounts.map((account: any) => {
                  const RoleIcon = roleIcon(account.role);
                  return (
                    <div
                      key={account.id}
                      className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                        account.isActive
                          ? "border-border/40 hover:border-primary/20"
                          : "border-border/20 bg-muted/10 opacity-60"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        !account.isActive ? "bg-muted/20" :
                        account.role === "admin" ? "bg-primary/10" : "bg-purple-500/10"
                      }`}>
                        <RoleIcon className={`w-5 h-5 ${
                          !account.isActive ? "text-muted-foreground" :
                          account.role === "admin" ? "text-primary" : "text-purple-400"
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-sm font-mono">{account.username}</span>
                          <Badge className={`${roleBadge(account.role, account.isActive)} text-xs`}>
                            {account.role === "admin" ? "Admin" : "Sub-Admin"}
                          </Badge>
                          {!account.isActive && (
                            <Badge className="bg-red-500/15 text-red-400 border border-red-500/30 text-xs">비활성</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          생성: {new Date(account.createdAt).toLocaleDateString("ko-KR")}
                          {account.lastLoginAt && (
                            <span className="ml-2">마지막 로그인: {new Date(account.lastLoginAt).toLocaleDateString("ko-KR")}</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* 비밀번호 변경 */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPwDialogId(account.id)}
                          className="h-8 px-2 gap-1 text-xs"
                          title="비밀번호 변경"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </Button>
                        {/* 활성/비활성 토글 */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleActiveMutation.mutate({ id: account.id, isActive: !account.isActive })}
                          className={`h-8 px-2 gap-1 text-xs ${account.isActive ? "hover:border-amber-500/50 hover:text-amber-400" : "hover:border-green-500/50 hover:text-green-400"}`}
                          title={account.isActive ? "비활성화" : "활성화"}
                          disabled={toggleActiveMutation.isPending}
                        >
                          {account.isActive
                            ? <ToggleRight className="w-3.5 h-3.5 text-green-400" />
                            : <ToggleLeft className="w-3.5 h-3.5 text-muted-foreground" />
                          }
                        </Button>
                        {/* 삭제 (admin 계정은 보호) */}
                        {account.username !== "admin" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteId(account.id)}
                            className="h-8 px-2 hover:border-destructive/50 hover:text-destructive"
                            title="계정 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Shield className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-sm">관리자 계정이 없습니다</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 권한 안내 */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              권한 안내
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
                <div className="flex items-center gap-2 mb-1.5">
                  <Crown className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">Admin</span>
                </div>
                <p className="text-xs text-muted-foreground">모든 기능 접근 가능. 관리자 계정 생성/삭제, 시스템 설정 변경 포함.</p>
              </div>
              <div className="p-3 rounded-lg border border-purple-500/20 bg-purple-500/5">
                <div className="flex items-center gap-2 mb-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-semibold text-purple-400">Sub-Admin</span>
                </div>
                <p className="text-xs text-muted-foreground">사용자 관리, 콘텐츠 관리, 지원 티켓 처리 가능. 계정 관리 및 시스템 설정 제외.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 계정 생성 다이얼로그 */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary" />
              새 관리자 계정 추가
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs text-muted-foreground">아이디 *</Label>
              <Input
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                placeholder="영문/숫자 3~64자"
                className="mt-1 bg-input font-mono"
                autoComplete="off"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">비밀번호 * (최소 6자)</Label>
              <div className="relative mt-1">
                <Input
                  type={showNewPw ? "text" : "password"}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="비밀번호 입력"
                  className="bg-input pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">권한</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as any)}>
                <SelectTrigger className="mt-1 bg-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="sub_admin">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-purple-400" />
                      Sub-Admin (제한된 접근)
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-primary" />
                      Admin (전체 접근)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>취소</Button>
            <Button
              onClick={() => createMutation.mutate({ username: newUsername, password: newPassword, role: newRole })}
              disabled={createMutation.isPending || !newUsername.trim() || newPassword.length < 6}
            >
              {createMutation.isPending ? "생성 중..." : "계정 생성"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 비밀번호 변경 다이얼로그 */}
      <Dialog open={pwDialogId !== null} onOpenChange={() => setPwDialogId(null)}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-400" />
              비밀번호 변경
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-muted-foreground mb-3">
              <span className="font-mono font-semibold text-foreground">{pwTarget?.username}</span> 계정의 비밀번호를 변경합니다.
            </p>
            <Label className="text-xs text-muted-foreground">새 비밀번호 * (최소 6자)</Label>
            <div className="relative mt-1">
              <Input
                type={showChangePw ? "text" : "password"}
                value={changePw}
                onChange={e => setChangePw(e.target.value)}
                placeholder="새 비밀번호 입력"
                className="bg-input pr-10"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowChangePw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showChangePw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwDialogId(null)}>취소</Button>
            <Button
              onClick={() => pwDialogId && changePasswordMutation.mutate({ id: pwDialogId, newPassword: changePw })}
              disabled={changePasswordMutation.isPending || changePw.length < 6}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {changePasswordMutation.isPending ? "변경 중..." : "비밀번호 변경"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>계정 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-mono font-semibold text-foreground">{deleteTarget?.username}</span> 계정을 삭제합니다. 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
