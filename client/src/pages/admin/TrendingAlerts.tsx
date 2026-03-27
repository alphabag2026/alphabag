import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Zap, Send, RefreshCw, Bell, BellOff } from "lucide-react";

export default function TrendingAlerts() {
  const { data: settings, refetch } = trpc.trendingAlert.getSettings.useQuery();

  const [isEnabled, setIsEnabled] = useState<boolean | null>(null);
  const [threshold, setThreshold] = useState<string | null>(null);
  const [intervalMinutes, setIntervalMinutes] = useState<number | null>(null);
  const [channelChatId, setChannelChatId] = useState<string | null>(null);
  const [sendToDm, setSendToDm] = useState<boolean | null>(null);
  const [filterHasInvestment, setFilterHasInvestment] = useState<boolean | null>(null);
  const [messageTemplate, setMessageTemplate] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<any>(null);

  const updateMutation = trpc.trendingAlert.updateSettings.useMutation({
    onSuccess: () => {
      toast.success("설정 저장 완료");
      refetch();
    },
    onError: (err) => toast.error("저장 실패: " + err.message),
  });

  const runNowMutation = trpc.trendingAlert.runNow.useMutation({
    onSuccess: (data) => {
      setRunResult(data);
      toast.success("테스트 실행 완료: " + data.message);
    },
    onError: (err) => toast.error("실행 실패: " + err.message),
  });

  // 현재 값 (로컬 상태 우선, 없으면 DB 값)
  const currentEnabled = isEnabled !== null ? isEnabled : (settings?.isEnabled ?? false);
  const currentThreshold = threshold !== null ? threshold : (settings?.priceChangeThreshold ?? "10.00");
  const currentInterval = intervalMinutes !== null ? intervalMinutes : (settings?.intervalMinutes ?? 60);
  const currentChannelChatId = channelChatId !== null ? channelChatId : (settings?.channelChatId ?? "");
  const currentSendToDm = sendToDm !== null ? sendToDm : (settings?.sendToDm ?? false);
  const currentFilterHasInvestment = filterHasInvestment !== null ? filterHasInvestment : (settings?.filterHasInvestment ?? false);
  const currentMessageTemplate = messageTemplate !== null ? messageTemplate : (settings?.messageTemplate ?? "");

  function handleSave() {
    updateMutation.mutate({
      isEnabled: currentEnabled,
      priceChangeThreshold: currentThreshold,
      intervalMinutes: currentInterval,
      channelChatId: currentChannelChatId || null,
      sendToDm: currentSendToDm,
      filterHasInvestment: currentFilterHasInvestment,
      messageTemplate: currentMessageTemplate || null,
    });
  }

  const lastResult = settings?.lastResult as any;

  return (
    <AdminLayout title="Trending Alerts">
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-400" />
            급등 토큰 알림 설정
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            CoinGecko API 기반 급등 토큰 감지 후 텔레그램 자동 알림
          </p>
        </div>
        <div className="flex items-center gap-2">
          {currentEnabled ? (
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              <Bell className="w-3 h-3 mr-1" /> 활성화
            </Badge>
          ) : (
            <Badge variant="secondary">
              <BellOff className="w-3 h-3 mr-1" /> 비활성화
            </Badge>
          )}
        </div>
      </div>

      {/* 기본 설정 카드 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">기본 설정</CardTitle>
          <CardDescription>알림 활성화 여부 및 감지 조건을 설정합니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* 활성화 토글 */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">알림 활성화</Label>
              <p className="text-xs text-muted-foreground">자동 급등 토큰 감지 및 텔레그램 알림 발송</p>
            </div>
            <Switch
              checked={currentEnabled}
              onCheckedChange={(v) => setIsEnabled(v)}
            />
          </div>

          {/* 임계값 */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">급등 임계값 (%)</Label>
            <p className="text-xs text-muted-foreground">24시간 기준 이 값 이상 상승한 토큰에 알림 발송</p>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                max="100"
                step="0.5"
                value={currentThreshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="w-32"
              />
              <span className="text-sm text-muted-foreground">% 이상</span>
            </div>
          </div>

          {/* 체크 주기 */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">알림 발송 주기 (분)</Label>
            <p className="text-xs text-muted-foreground">같은 토큰에 대해 이 주기 내에는 중복 알림 없음</p>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="5"
                max="1440"
                step="5"
                value={currentInterval}
                onChange={(e) => setIntervalMinutes(parseInt(e.target.value) || 60)}
                className="w-32"
              />
              <span className="text-sm text-muted-foreground">분마다</span>
            </div>
            <div className="flex gap-2 mt-1">
              {[30, 60, 120, 240].map(m => (
                <button
                  key={m}
                  onClick={() => setIntervalMinutes(m)}
                  className={`text-xs px-2 py-1 rounded border transition-colors ${
                    currentInterval === m
                      ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                      : "border-border text-muted-foreground hover:border-amber-500/30"
                  }`}
                >
                  {m < 60 ? `${m}분` : `${m / 60}시간`}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 발송 대상 카드 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">발송 대상</CardTitle>
          <CardDescription>알림을 받을 채널 및 사용자를 설정합니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* 채널 Chat ID */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">텔레그램 채널/그룹 Chat ID</Label>
            <p className="text-xs text-muted-foreground">채널은 @channel_name 또는 -100xxxxxxxxxx 형식</p>
            <Input
              placeholder="예: @alphabag_channel 또는 -1001234567890"
              value={currentChannelChatId}
              onChange={(e) => setChannelChatId(e.target.value)}
            />
          </div>

          {/* 개별 DM 발송 */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">개별 DM 발송</Label>
              <p className="text-xs text-muted-foreground">텔레그램 Chat ID가 등록된 사용자에게 DM 발송</p>
            </div>
            <Switch
              checked={currentSendToDm}
              onCheckedChange={(v) => setSendToDm(v)}
            />
          </div>

          {/* 투자자 필터 */}
          {currentSendToDm && (
            <div className="flex items-center justify-between pl-4 border-l-2 border-amber-500/30">
              <div>
                <Label className="text-sm font-medium">투자자만 발송</Label>
                <p className="text-xs text-muted-foreground">투자 이력이 있는 사용자에게만 DM 발송</p>
              </div>
              <Switch
                checked={currentFilterHasInvestment}
                onCheckedChange={(v) => setFilterHasInvestment(v)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 메시지 템플릿 카드 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">메시지 템플릿 (선택)</CardTitle>
          <CardDescription>
            비워두면 기본 템플릿 사용. <code className="text-xs bg-muted px-1 rounded">{"{tokens}"}</code> 위치에 토큰 목록이 삽입됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder={`예시:\n🚀 <b>급등 토큰 알림</b>\n\n{tokens}\n\n<i>AlphaBag 투자 플랫폼</i>`}
            value={currentMessageTemplate}
            onChange={(e) => setMessageTemplate(e.target.value)}
            rows={6}
            className="font-mono text-xs"
          />
          <p className="text-xs text-muted-foreground mt-1.5">HTML 태그 지원: &lt;b&gt;, &lt;i&gt;, &lt;code&gt;</p>
        </CardContent>
      </Card>

      {/* 저장 버튼 */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => runNowMutation.mutate()}
          disabled={runNowMutation.isPending}
          className="flex items-center gap-2"
        >
          {runNowMutation.isPending ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          지금 테스트 실행
        </Button>
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="flex items-center gap-2"
        >
          {updateMutation.isPending ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Zap className="w-4 h-4" />
          )}
          설정 저장
        </Button>
      </div>

      {/* 테스트 실행 결과 */}
      {runResult && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              테스트 실행 결과
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">{runResult.message}</p>
            {runResult.tokens && runResult.tokens.length > 0 && (
              <div className="space-y-1">
                {runResult.tokens.map((t: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-amber-400">{t.symbol.toUpperCase()}</span>
                    <span className="text-emerald-400">+{t.change?.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 마지막 실행 정보 */}
      {settings?.lastRunAt && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">마지막 실행 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">마지막 실행</span>
              <span>{new Date(settings.lastRunAt).toLocaleString("ko-KR")}</span>
            </div>
            {settings.nextRunAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">다음 실행 예정</span>
                <span>{new Date(settings.nextRunAt).toLocaleString("ko-KR")}</span>
              </div>
            )}
            {lastResult && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">감지된 토큰</span>
                  <span>{lastResult.totalDetected ?? 0}개</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">신규 알림</span>
                  <span>{lastResult.newTokens ?? 0}개</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">발송 성공/실패</span>
                  <span className="text-emerald-400">{lastResult.successCount ?? 0}</span>
                  <span className="text-red-400">/ {lastResult.failCount ?? 0}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
    </AdminLayout>
  );
}
