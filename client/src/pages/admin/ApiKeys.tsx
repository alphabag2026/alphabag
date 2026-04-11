import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Copy, Plus, Trash2, Eye, EyeOff, Activity, Key } from "lucide-react";

export default function ApiKeysPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);
  const [selectedKeyId, setSelectedKeyId] = useState<number | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    partnerName: "",
    partnerEmail: "",
    note: "",
    expiresAt: "",
  });

  const utils = trpc.useUtils();
  const { data: keys = [], isLoading } = trpc.apiKeysMgmt.list.useQuery();
  const { data: logs = [] } = trpc.apiKeysMgmt.logs.useQuery(
    { apiKeyId: selectedKeyId!, limit: 50 },
    { enabled: !!selectedKeyId && logsOpen }
  );

  const createMutation = trpc.apiKeysMgmt.create.useMutation({
    onSuccess: (data) => {
      setNewKey(data.key);
      utils.apiKeysMgmt.list.invalidate();
      toast.success("API 키 발급 완료 - 키를 안전한 곳에 저장하세요. 다시 표시되지 않습니다.");
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleMutation = trpc.apiKeysMgmt.toggle.useMutation({
    onSuccess: () => utils.apiKeysMgmt.list.invalidate(),
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.apiKeysMgmt.delete.useMutation({
    onSuccess: () => {
      utils.apiKeysMgmt.list.invalidate();
      toast.success("삭제 완료");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleCreate = () => {
    if (!form.name.trim()) return toast.error("이름을 입력하세요");
    createMutation.mutate({
      name: form.name,
      partnerName: form.partnerName || undefined,
      partnerEmail: form.partnerEmail || undefined,
      note: form.note || undefined,
      expiresAt: form.expiresAt || undefined,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("복사됨");
  };

  const totalCalls = keys.reduce((sum, k) => sum + (k.callCount || 0), 0);
  const activeKeys = keys.filter((k) => k.isActive).length;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Key className="w-6 h-6 text-amber-400" />
              API 키 관리
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              파트너 및 외부 앱에 AlphaBag REST API 접근 권한을 부여합니다.
            </p>
          </div>
          <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) { setNewKey(null); setForm({ name: "", partnerName: "", partnerEmail: "", note: "", expiresAt: "" }); } }}>
            <DialogTrigger asChild>
              <Button className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
                <Plus className="w-4 h-4 mr-2" /> 새 API 키 발급
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>새 API 키 발급</DialogTitle>
              </DialogHeader>
              {newKey ? (
                <div className="space-y-4">
                  <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-2">
                      ⚠️ 이 키는 지금만 표시됩니다. 반드시 복사해 안전한 곳에 저장하세요.
                    </p>
                    <div className="flex items-center gap-2 bg-background rounded p-2 font-mono text-xs break-all">
                      <span className="flex-1">{newKey}</span>
                      <Button size="sm" variant="ghost" onClick={() => copyToClipboard(newKey)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <Button className="w-full" onClick={() => setCreateOpen(false)}>확인 (닫기)</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label>키 이름 *</Label>
                    <Input placeholder="예: MobileApp_v1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <Label>파트너명</Label>
                    <Input placeholder="예: ACME Corp" value={form.partnerName} onChange={(e) => setForm({ ...form, partnerName: e.target.value })} />
                  </div>
                  <div>
                    <Label>파트너 이메일</Label>
                    <Input type="email" placeholder="partner@example.com" value={form.partnerEmail} onChange={(e) => setForm({ ...form, partnerEmail: e.target.value })} />
                  </div>
                  <div>
                    <Label>만료일 (선택)</Label>
                    <Input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
                  </div>
                  <div>
                    <Label>메모</Label>
                    <Textarea placeholder="용도 설명" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={2} />
                  </div>
                  <Button className="w-full bg-amber-500 hover:bg-amber-600 text-black" onClick={handleCreate} disabled={createMutation.isPending}>
                    {createMutation.isPending ? "발급 중..." : "API 키 발급"}
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">전체 키</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{keys.length}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">활성 키</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-green-500">{activeKeys}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">총 API 호출</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-amber-400">{totalCalls.toLocaleString()}</p></CardContent>
          </Card>
        </div>

        {/* API 엔드포인트 안내 */}
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">API 엔드포인트</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-1 text-xs font-mono text-muted-foreground">
              {[
                "GET /api/v1/tabs/recommended",
                "GET /api/v1/tabs/bbag",
                "GET /api/v1/tabs/trending",
                "GET /api/v1/tabs/airdrop",
                "GET /api/v1/tabs/news",
                "GET /api/v1/tabs/sns",
                "GET /api/v1/tabs/contents",
                "GET /api/v1/tabs/live",
                "GET /api/v1/tabs/mlm",
                "GET /api/v1/tabs/meetup",
                "GET /api/v1/tabs/expo",
                "GET /api/v1/tabs/nodes",
              ].map((ep) => (
                <div key={ep} className="flex items-center gap-1">
                  <span className="text-green-500">GET</span>
                  <span>{ep.replace("GET ", "")}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              인증: <code className="bg-muted px-1 rounded">Authorization: Bearer {"{"}{"{"}api_key{"}"}{"}"}</code>
              &nbsp;|&nbsp;
              <a href="/api/docs" target="_blank" className="text-amber-400 hover:underline">📄 AI 문서 보기 →</a>
            </div>
          </CardContent>
        </Card>

        {/* 키 목록 테이블 */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>키 프리픽스</TableHead>
                  <TableHead>파트너</TableHead>
                  <TableHead>호출 수</TableHead>
                  <TableHead>마지막 사용</TableHead>
                  <TableHead>만료일</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">로딩 중...</TableCell></TableRow>
                ) : keys.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">발급된 API 키가 없습니다.</TableCell></TableRow>
                ) : (
                  keys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium">{key.name}</TableCell>
                      <TableCell><code className="text-xs bg-muted px-1 rounded">{key.keyPrefix}...</code></TableCell>
                      <TableCell>
                        <div className="text-sm">{key.partnerName || "-"}</div>
                        {key.partnerEmail && <div className="text-xs text-muted-foreground">{key.partnerEmail}</div>}
                      </TableCell>
                      <TableCell className="text-amber-400 font-semibold">{(key.callCount || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : "없음"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {key.expiresAt ? (
                          <span className={new Date(key.expiresAt) < new Date() ? "text-red-400" : "text-muted-foreground"}>
                            {new Date(key.expiresAt).toLocaleDateString()}
                          </span>
                        ) : "무제한"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={key.isActive ? "default" : "secondary"} className={key.isActive ? "bg-green-500/20 text-green-400 border-green-500/30" : ""}>
                          {key.isActive ? "활성" : "비활성"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm" variant="ghost"
                            onClick={() => toggleMutation.mutate({ id: key.id, isActive: !key.isActive })}
                            title={key.isActive ? "비활성화" : "활성화"}
                          >
                            {key.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          <Button
                            size="sm" variant="ghost"
                            onClick={() => { setSelectedKeyId(key.id); setLogsOpen(true); }}
                            title="호출 로그"
                          >
                            <Activity className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm" variant="ghost" className="text-red-400 hover:text-red-500"
                            onClick={() => { if (confirm("삭제하시겠습니까?")) deleteMutation.mutate({ id: key.id }); }}
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 로그 다이얼로그 */}
        <Dialog open={logsOpen} onOpenChange={setLogsOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>API 호출 로그</DialogTitle>
            </DialogHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>엔드포인트</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>응답시간</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>시간</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-4 text-muted-foreground">로그 없음</TableCell></TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">{log.endpoint}</TableCell>
                      <TableCell>
                        <Badge variant={log.statusCode === 200 ? "default" : "destructive"} className="text-xs">
                          {log.statusCode}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{log.responseTimeMs}ms</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{log.ip}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
