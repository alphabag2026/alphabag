import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Shield, Sparkles, Save, RefreshCw, Settings, Package } from "lucide-react";

export default function AdminCbag() {
  const utils = trpc.useUtils();

  // CBAG 설정 조회
  const { data: settings, isLoading: settingsLoading } = trpc.cbag.settings.useQuery();
  const { data: cbagPlans = [], isLoading: plansLoading } = trpc.cbag.plans.useQuery();
  // 설정 폼 상태
  const [name, setName] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [defaultPercent, setDefaultPercent] = useState("10");
  const [minPercent, setMinPercent] = useState("1");
  const [maxPercent, setMaxPercent] = useState("50");
  const [goldenRequired, setGoldenRequired] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // LLM 자동 생성 결과
  const [llmResult, setLlmResult] = useState<{ description: string; highlights: string[] } | null>(null);

  // 설정 로드 후 폼 초기화
  if (settings && !initialized) {
    setName(settings.name || "C-BAG Insurance");
    setSubtitle(settings.subtitle || "");
    setDescription(settings.description || "");
    setIsActive(settings.isActive ?? true);
    setDefaultPercent(String(settings.defaultPercent || "10"));
    setMinPercent(String(settings.minPercent || "1"));
    setMaxPercent(String(settings.maxPercent || "50"));
    setGoldenRequired(settings.goldenRequired ?? true);
    setInitialized(true);
  }

  const updateSettings = trpc.cbag.updateSettings.useMutation({
    onSuccess: () => {
      toast.success("CBAG 설정이 저장되었습니다.");
      utils.cbag.settings.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const autoDescribe = trpc.cbag.autoDescribe.useMutation({
    onSuccess: (data) => {
      setLlmResult(data);
      setDescription(data.description);
      toast.success("LLM이 설명을 자동 생성했습니다!");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSave = () => {
    updateSettings.mutate({
      name,
      subtitle,
      description,
      isActive,
      defaultPercent,
      minPercent,
      maxPercent,
      goldenRequired,
    });
  };

  const handleAutoDescribe = () => {
    autoDescribe.mutate({ planId: undefined });
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">C-BAG 보험 콜렉션 관리</h1>
              <p className="text-sm text-gray-400">CBAG 이름, 설명, 투자 비율 범위를 설정합니다</p>
            </div>
          </div>
          <Badge variant="secondary" className={`${isActive ? "bg-cyan-500/20 text-cyan-300" : "bg-gray-500/20 text-gray-400"}`}>
            {isActive ? "활성" : "비활성"}
          </Badge>
        </div>

        {/* 기본 설정 */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-cyan-400" />
              기본 설정
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">CBAG 이름</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="C-BAG Insurance"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">부제목</label>
                <Input
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Crypto Bag Insurance Collection"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-gray-400">설명</label>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-xs border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                  onClick={handleAutoDescribe}
                  disabled={autoDescribe.isPending}
                >
                  {autoDescribe.isPending ? (
                    <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                  ) : (
                    <Sparkles className="w-3 h-3 mr-1" />
                  )}
                  LLM 자동 생성
                </Button>
              </div>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="CBAG 보험 콜렉션에 대한 설명을 입력하세요..."
                className="bg-white/5 border-white/10 text-white min-h-[100px]"
              />
            </div>

            {/* LLM 결과 하이라이트 */}
            {llmResult && llmResult.highlights.length > 0 && (
              <div className="bg-cyan-500/5 rounded-lg p-3 border border-cyan-500/20">
                <div className="text-xs text-cyan-400 font-semibold mb-2">🤖 AI 생성 하이라이트</div>
                <div className="space-y-1">
                  {llmResult.highlights.map((h, i) => (
                    <div key={i} className="text-xs text-gray-300 flex items-start gap-2">
                      <span className="text-cyan-500 mt-0.5">•</span>
                      {h}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator className="bg-white/10" />

            {/* 활성/비활성 및 골든 필수 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                <div>
                  <div className="text-sm text-white font-medium">CBAG 활성화</div>
                  <div className="text-xs text-gray-400">투자 시 CBAG 옵션 표시</div>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                <div>
                  <div className="text-sm text-white font-medium">골든 섹션 필수</div>
                  <div className="text-xs text-gray-400">골든 투자 시 CBAG 강조 표시</div>
                </div>
                <Switch checked={goldenRequired} onCheckedChange={setGoldenRequired} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 비율 설정 */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              투자 비율 설정
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">기본 비율 (%)</label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={defaultPercent}
                  onChange={(e) => setDefaultPercent(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
                <div className="text-xs text-gray-500 mt-1">슬라이더 초기값</div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">최소 비율 (%)</label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={minPercent}
                  onChange={(e) => setMinPercent(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
                <div className="text-xs text-gray-500 mt-1">슬라이더 최솟값</div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">최대 비율 (%)</label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={maxPercent}
                  onChange={(e) => setMaxPercent(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
                <div className="text-xs text-gray-500 mt-1">슬라이더 최댓값</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CBAG 상품 목록 */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-cyan-400" />
                CBAG 상품 목록
              </CardTitle>
              <a
                href="/admin/plans"
                className="text-xs text-cyan-400 hover:text-cyan-300 underline"
              >
                상품 관리 페이지 →
              </a>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              상품 추가/수정은 상품 관리 페이지에서 카테고리를 "C-BAG"으로 설정하세요.
            </p>
          </CardHeader>
          <CardContent>
            {plansLoading ? (
              <div className="text-center py-8 text-gray-400 text-sm">로딩 중...</div>
            ) : (cbagPlans as any[]).length === 0 ? (
              <div className="text-center py-8">
                <Shield className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <div className="text-sm text-gray-400">등록된 CBAG 상품이 없습니다.</div>
                <div className="text-xs text-gray-500 mt-1">
                  상품 관리 페이지에서 카테고리를 "C-BAG"으로 설정하여 상품을 추가하세요.
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {(cbagPlans as any[]).map((plan: any) => (
                  <div key={plan.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center gap-3">
                      {plan.logoUrl && (
                        <img src={plan.logoUrl} alt={plan.name} className="w-8 h-8 rounded-lg object-contain bg-black/20" />
                      )}
                      <div>
                        <div className="text-sm font-medium text-white">{plan.name}</div>
                        <div className="text-xs text-gray-400">일일 {Number(plan.dailyRate).toFixed(2)}% · 최소 ${plan.minAmount}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-300 text-xs">
                        CBAG
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-white/20 text-gray-300 hover:bg-white/10"
                        onClick={() => {
                          autoDescribe.mutate({ planId: plan.id });
                        }}
                        disabled={autoDescribe.isPending}
                      >
                        {autoDescribe.isPending ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 저장 버튼 */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={updateSettings.isPending}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-6"
          >
            {updateSettings.isPending ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            설정 저장
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
