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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Copy, Plus, Trash2, Activity, Key, RefreshCw, Power, BarChart2, List } from "lucide-react";

export default function ApiKeysPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);
  const [regenOpen, setRegenOpen] = useState(false);
  const [selectedKeyId, setSelectedKeyId] = useState<number | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [regenKey, setRegenKey] = useState<string | null>(null);
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
    { apiKeyId: selectedKeyId!, limit: 100 },
    { enabled: !!selectedKeyId && logsOpen }
  );
  const { data: stats } = trpc.apiKeysMgmt.stats.useQuery(
    { apiKeyId: undefined },
    { refetchInterval: 30000 }
  );

  const createMutation = trpc.apiKeysMgmt.create.useMutation({
    onSuccess: (data) => {
      setNewKey(data.key);
      utils.apiKeysMgmt.list.invalidate();
      toast.success("API 키 발급 완료 - 키를 안전한 곳에 저장하세요.");
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleMutation = trpc.apiKeysMgmt.toggle.useMutation({
    onSuccess: (_, vars) => {
      utils.apiKeysMgmt.list.invalidate();
      toast.success(vars.isActive ? "키 활성화됨" : "키 비활성화됨");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.apiKeysMgmt.delete.useMutation({
    onSuccess: () => {
      utils.apiKeysMgmt.list.invalidate();
      toast.success("삭제 완료");
    },
    onError: (e) => toast.error(e.message),
  });

  const regenerateMutation = trpc.apiKeysMgmt.regenerate.useMutation({
    onSuccess: (data) => {
      setRegenKey(data.key);
      utils.apiKeysMgmt.list.invalidate();
      toast.success("키 재발급 완료 - 기존 키는 즉시 무효화됩니다.");
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

  const handleRegenerate = (keyId: number) => {
    setSelectedKeyId(keyId);
    setRegenKey(null);
    setRegenOpen(true);
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

        {/* 탭: 키 목록 / 통계 */}
        <Tabs defaultValue="keys">
          <TabsList>
            <TabsTrigger value="keys" className="flex items-center gap-1"><List className="w-4 h-4" /> 키 목록</TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-1"><BarChart2 className="w-4 h-4" /> 사용량 통계</TabsTrigger>
            <TabsTrigger value="docs" className="flex items-center gap-1">📄 API 문서</TabsTrigger>
          </TabsList>

          {/* 키 목록 탭 */}
          <TabsContent value="keys">
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
                              {/* 활성화/비활성화 토글 */}
                              <Button
                                size="sm" variant="ghost"
                                onClick={() => toggleMutation.mutate({ id: key.id, isActive: !key.isActive })}
                                title={key.isActive ? "비활성화" : "활성화"}
                                className={key.isActive ? "text-green-400 hover:text-green-500" : "text-muted-foreground hover:text-green-400"}
                              >
                                <Power className="w-4 h-4" />
                              </Button>
                              {/* 재발급 */}
                              <Button
                                size="sm" variant="ghost"
                                onClick={() => handleRegenerate(key.id)}
                                title="키 재발급 (기존 키 무효화)"
                                className="text-amber-400 hover:text-amber-500"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                              {/* 로그 */}
                              <Button
                                size="sm" variant="ghost"
                                onClick={() => { setSelectedKeyId(key.id); setLogsOpen(true); }}
                                title="호출 로그"
                              >
                                <Activity className="w-4 h-4" />
                              </Button>
                              {/* 삭제 */}
                              <Button
                                size="sm" variant="ghost" className="text-red-400 hover:text-red-500"
                                onClick={() => { if (confirm(`"${key.name}" 키를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) deleteMutation.mutate({ id: key.id }); }}
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
          </TabsContent>

          {/* 통계 탭 */}
          <TabsContent value="stats" className="space-y-4">
            {/* 파트너별 호출 현황 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">파트너별 API 호출 현황</CardTitle>
              </CardHeader>
              <CardContent>
                {!stats?.partnerSummary || stats.partnerSummary.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">아직 API 호출 기록이 없습니다.</p>
                ) : (
                  <div className="space-y-3">
                    {stats.partnerSummary.map((p) => {
                      const maxCalls = Math.max(...(stats.partnerSummary?.map((x) => x.callCount || 0) ?? [1]));
                      const pct = maxCalls > 0 ? ((p.callCount || 0) / maxCalls) * 100 : 0;
                      return (
                        <div key={p.id} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{p.partnerName || p.name}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant={p.isActive ? "default" : "secondary"} className="text-xs">
                                {p.isActive ? "활성" : "비활성"}
                              </Badge>
                              <span className="text-amber-400 font-semibold">{(p.callCount || 0).toLocaleString()} 호출</span>
                            </div>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-400 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          {p.lastUsedAt && (
                            <p className="text-xs text-muted-foreground">마지막 사용: {new Date(p.lastUsedAt).toLocaleString()}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 엔드포인트별 호출 빈도 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">엔드포인트별 호출 빈도</CardTitle>
              </CardHeader>
              <CardContent>
                {!stats?.byEndpoint || stats.byEndpoint.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">아직 API 호출 기록이 없습니다.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>엔드포인트</TableHead>
                        <TableHead className="text-right">호출 수</TableHead>
                        <TableHead className="text-right">평균 응답시간</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.byEndpoint.map((ep) => (
                        <TableRow key={ep.endpoint}>
                          <TableCell className="font-mono text-xs">{ep.endpoint}</TableCell>
                          <TableCell className="text-right text-amber-400 font-semibold">{ep.count.toLocaleString()}</TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">
                            {ep.avgDuration ? `${Math.round(ep.avgDuration)}ms` : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* 일별 호출 추이 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">일별 API 호출 추이 (최근 30일)</CardTitle>
              </CardHeader>
              <CardContent>
                {!stats?.byDay || stats.byDay.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">아직 API 호출 기록이 없습니다.</p>
                ) : (
                  <div className="space-y-1">
                    {[...stats.byDay].reverse().map((d) => {
                      const maxDay = Math.max(...(stats.byDay?.map((x) => x.count || 0) ?? [1]));
                      const pct = maxDay > 0 ? ((d.count || 0) / maxDay) * 100 : 0;
                      return (
                        <div key={d.date} className="flex items-center gap-3 text-xs">
                          <span className="w-24 text-muted-foreground shrink-0">{d.date}</span>
                          <div className="flex-1 h-4 bg-muted rounded overflow-hidden">
                            <div className="h-full bg-amber-400/70 rounded transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-12 text-right text-amber-400 font-semibold">{d.count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* API 문서 탭 */}
          <TabsContent value="docs">
            <Card className="border-amber-200 dark:border-amber-800">
              <CardHeader>
                <CardTitle className="text-base">API 엔드포인트 목록</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                  {[
                    ["GET /api/v1/tabs/recommended", "추천 플랜 목록"],
                    ["GET /api/v1/tabs/bbag", "B-BAG 상품 목록"],
                    ["GET /api/v1/tabs/trending", "급등토큰 (CoinGecko)"],
                    ["GET /api/v1/tabs/airdrop", "에어드랍 목록"],
                    ["GET /api/v1/tabs/news", "뉴스 피드"],
                    ["GET /api/v1/tabs/sns", "SNS 인플루언서 피드"],
                    ["GET /api/v1/tabs/contents", "콘텐츠 목록"],
                    ["GET /api/v1/tabs/live", "라이브 방송"],
                    ["GET /api/v1/tabs/mlm", "MLM/레퍼럴 통계"],
                    ["GET /api/v1/tabs/meetup", "밋업 이벤트"],
                    ["GET /api/v1/tabs/expo", "엑스포 이벤트"],
                    ["GET /api/v1/tabs/favorites", "즐겨찾기 (사용자 JWT 필요)"],
                  ].map(([ep, desc]) => (
                    <div key={ep} className="flex gap-2 p-2 bg-muted/50 rounded">
                      <span className="text-green-500 shrink-0">GET</span>
                      <div>
                        <div>{ep.replace("GET ", "")}</div>
                        <div className="text-muted-foreground">{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-muted/50 rounded p-3 text-xs space-y-2">
                  <p className="font-semibold">인증 방법</p>
                  <code className="block bg-background rounded p-2">Authorization: Bearer {"{"}{"{"}api_key{"}"}{"}"}</code>
                  <p className="text-muted-foreground">즐겨찾기 탭은 추가로 사용자 JWT 토큰이 필요합니다:</p>
                  <code className="block bg-background rounded p-2">X-User-Token: {"{"}{"{"}user_jwt_token{"}"}{"}"}</code>
                </div>
                <div className="flex gap-2">
                  <a href="/api/docs" target="_blank">
                    <Button variant="outline" size="sm">📄 Swagger UI 열기</Button>
                  </a>
                  <a href="/api/docs.json" target="_blank">
                    <Button variant="outline" size="sm">{"{ }"} OpenAPI JSON</Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 재발급 다이얼로그 */}
        <Dialog open={regenOpen} onOpenChange={(o) => { setRegenOpen(o); if (!o) setRegenKey(null); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>API 키 재발급</DialogTitle>
            </DialogHeader>
            {regenKey ? (
              <div className="space-y-4">
                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-2">
                    ✅ 새 키가 발급되었습니다. 기존 키는 즉시 무효화됩니다.
                  </p>
                  <div className="flex items-center gap-2 bg-background rounded p-2 font-mono text-xs break-all">
                    <span className="flex-1">{regenKey}</span>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard(regenKey)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <Button className="w-full" onClick={() => setRegenOpen(false)}>확인 (닫기)</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    ⚠️ 재발급 시 기존 API 키는 즉시 사용 불가능해집니다. 연동된 앱/서비스에서 새 키로 업데이트해야 합니다.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setRegenOpen(false)}>취소</Button>
                  <Button
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-black"
                    onClick={() => selectedKeyId && regenerateMutation.mutate({ id: selectedKeyId })}
                    disabled={regenerateMutation.isPending}
                  >
                    {regenerateMutation.isPending ? "재발급 중..." : "재발급 확인"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* 로그 다이얼로그 */}
        <Dialog open={logsOpen} onOpenChange={setLogsOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>API 호출 로그 (최근 100건)</DialogTitle>
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
                      <TableCell className="text-xs">{log.responseTimeMs ? `${log.responseTimeMs}ms` : "-"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{log.ip || "-"}</TableCell>
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
