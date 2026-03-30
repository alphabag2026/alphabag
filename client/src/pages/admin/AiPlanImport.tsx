import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Sparkles, Upload, FileText, Image, CheckCircle, Edit2, Plus } from "lucide-react";

interface ParsedPlan {
  name: string;
  label?: string;
  dailyRate: string;
  minAmount?: string;
  recommendedAmount?: string;
  allocation?: string;
  strategy?: string;
  badgeLabels?: string[];
  tags?: string[];
  description?: string;
  planType: string;
  yieldInfo?: string;
  ratioInfo?: string;
  rating?: number;
  logoUrl?: string;
}

function PlanPreviewCard({ plan }: { plan: ParsedPlan }) {
  const dailyRateNum = parseFloat(plan.dailyRate || "0");
  return (
    <div className="border-2 border-yellow-400 rounded-xl overflow-hidden bg-card shadow-lg max-w-sm">
      {/* 플랜 헤더 이미지 영역 */}
      <div className="relative h-36 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
        {plan.logoUrl ? (
          <img src={plan.logoUrl} alt={plan.name} className="h-20 w-20 object-contain rounded-lg" />
        ) : (
          <div className="h-20 w-20 rounded-lg bg-yellow-400/20 flex items-center justify-center text-yellow-400 text-2xl font-bold">
            {plan.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <span className="absolute top-3 right-3 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded">HOT</span>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-lg">{plan.name}</h3>
          {plan.label && <p className="text-sm text-muted-foreground">{plan.label}</p>}
        </div>
        {/* 배지 */}
        {plan.badgeLabels && plan.badgeLabels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {plan.badgeLabels.map((badge, i) => (
              <Badge key={i} variant="outline" className="text-xs border-yellow-400/50 text-yellow-600">{badge}</Badge>
            ))}
          </div>
        )}
        {/* Ratio & Yield */}
        <div className="grid grid-cols-2 gap-2">
          <div className="border rounded-lg p-2 bg-muted/30">
            <p className="text-xs text-muted-foreground">Ratio</p>
            <p className="text-sm font-semibold">{plan.ratioInfo || plan.allocation || "-"}</p>
          </div>
          <div className="border rounded-lg p-2 bg-muted/30">
            <p className="text-xs text-muted-foreground">Yield</p>
            <p className="text-sm font-semibold text-yellow-500">{plan.yieldInfo || `Daily: ${plan.dailyRate}%`}</p>
          </div>
        </div>
        {/* Daily Return */}
        <div>
          <p className="text-3xl font-bold text-yellow-500">{dailyRateNum.toFixed(2)}%</p>
          <p className="text-xs text-muted-foreground">Daily Return</p>
        </div>
        {plan.recommendedAmount && (
          <p className="text-sm">추천금액: <span className="font-bold text-yellow-500">{plan.recommendedAmount} USDT</span></p>
        )}
        {/* 별점 */}
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className={`text-sm ${i < Math.round(plan.rating ?? 4) ? "text-yellow-400" : "text-gray-300"}`}>★</span>
          ))}
          <span className="text-sm text-muted-foreground ml-1">{plan.rating ?? 4.0}</span>
        </div>
        {plan.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{plan.description}</p>
        )}
      </div>
    </div>
  );
}

function EditablePlanForm({ plan, onChange }: { plan: ParsedPlan; onChange: (p: ParsedPlan) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-1">
        <Label>플랜명 *</Label>
        <Input value={plan.name} onChange={e => onChange({ ...plan, name: e.target.value })} />
      </div>
      <div className="space-y-1">
        <Label>라벨/부제목</Label>
        <Input value={plan.label ?? ""} onChange={e => onChange({ ...plan, label: e.target.value })} />
      </div>
      <div className="space-y-1">
        <Label>일일 수익률 (%) *</Label>
        <Input value={plan.dailyRate} onChange={e => onChange({ ...plan, dailyRate: e.target.value })} placeholder="예: 0.35" />
      </div>
      <div className="space-y-1">
        <Label>추천 투자금액 (USDT)</Label>
        <Input value={plan.recommendedAmount ?? ""} onChange={e => onChange({ ...plan, recommendedAmount: e.target.value })} placeholder="예: 1000" />
      </div>
      <div className="space-y-1">
        <Label>최소 투자금액 (USDT)</Label>
        <Input value={plan.minAmount ?? ""} onChange={e => onChange({ ...plan, minAmount: e.target.value })} placeholder="예: 100" />
      </div>
      <div className="space-y-1">
        <Label>Ratio 정보</Label>
        <Input value={plan.ratioInfo ?? plan.allocation ?? ""} onChange={e => onChange({ ...plan, ratioInfo: e.target.value })} placeholder="예: 40% 40% 20%" />
      </div>
      <div className="space-y-1">
        <Label>Yield 정보</Label>
        <Input value={plan.yieldInfo ?? ""} onChange={e => onChange({ ...plan, yieldInfo: e.target.value })} placeholder="예: Daily: 0.6% ~ 2%" />
      </div>
      <div className="space-y-1">
        <Label>전략</Label>
        <Input value={plan.strategy ?? ""} onChange={e => onChange({ ...plan, strategy: e.target.value })} placeholder="예: Stable / Treasury-focused" />
      </div>
      <div className="space-y-1 md:col-span-2">
        <Label>배지 태그 (쉼표로 구분)</Label>
        <Input
          value={(plan.badgeLabels ?? []).join(", ")}
          onChange={e => onChange({ ...plan, badgeLabels: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
          placeholder="예: BINANCE Alpha, Insurance(Hedge)"
        />
      </div>
      <div className="space-y-1 md:col-span-2">
        <Label>설명</Label>
        <Textarea value={plan.description ?? ""} onChange={e => onChange({ ...plan, description: e.target.value })} rows={3} />
      </div>
      <div className="space-y-1">
        <Label>별점 (1~5)</Label>
        <Input type="number" min={1} max={5} step={0.1} value={plan.rating ?? 4.0} onChange={e => onChange({ ...plan, rating: parseFloat(e.target.value) })} />
      </div>
      <div className="space-y-1">
        <Label>플랜 타입</Label>
        <select
          className="w-full border rounded-md px-3 py-2 text-sm bg-background"
          value={plan.planType}
          onChange={e => onChange({ ...plan, planType: e.target.value })}
        >
          <option value="investment">Investment</option>
          <option value="staking">Staking</option>
        </select>
      </div>
    </div>
  );
}

export default function AiPlanImport() {
  const [parsedPlan, setParsedPlan] = useState<ParsedPlan | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [promptText, setPromptText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const parseFromText = trpc.aiPlanImport.parseFromText.useMutation();
  const parseFromImage = trpc.aiPlanImport.parseFromImage.useMutation();
  const parseFromFile = trpc.aiPlanImport.parseFromFile.useMutation();
  const createFromParsed = trpc.aiPlanImport.createFromParsed.useMutation();

  const isLoading = parseFromText.isPending || parseFromImage.isPending || parseFromFile.isPending;

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleParseFromText = async () => {
    if (!promptText.trim()) return;
    try {
      const result = await parseFromText.mutateAsync({ text: promptText });
      setParsedPlan(result.plan as ParsedPlan);
      setIsEditing(false);
      toast.success("AI 파싱 완료", { description: "플랜 정보를 추출했습니다. 내용을 확인하고 등록하세요." });
    } catch (e: any) {
      toast.error("파싱 실패", { description: e.message });
    }
  };

  const handleParseFromImage = async () => {
    if (!imageFile) return;
    try {
      const base64 = await fileToBase64(imageFile);
      const result = await parseFromImage.mutateAsync({ base64, mimeType: imageFile.type });
      setParsedPlan({ ...(result.plan as ParsedPlan), logoUrl: result.imageUrl });
      setIsEditing(false);
      toast.success("이미지 분석 완료", { description: "이미지에서 플랜 정보를 추출했습니다." });
    } catch (e: any) {
      toast.error("이미지 파싱 실패", { description: e.message });
    }
  };

  const handleParseFromFile = async () => {
    if (!docFile) return;
    try {
      const base64 = await fileToBase64(docFile);
      const result = await parseFromFile.mutateAsync({ base64, mimeType: docFile.type, fileName: docFile.name });
      setParsedPlan(result.plan as ParsedPlan);
      setIsEditing(false);
      toast.success("문서 분석 완료", { description: "문서에서 플랜 정보를 추출했습니다." });
    } catch (e: any) {
      toast.error("문서 파싱 실패", { description: e.message });
    }
  };

  const handleRegister = async () => {
    if (!parsedPlan) return;
    try {
      await createFromParsed.mutateAsync({
        name: parsedPlan.name,
        label: parsedPlan.label,
        dailyRate: parsedPlan.dailyRate,
        minAmount: parsedPlan.minAmount,
        recommendedAmount: parsedPlan.recommendedAmount,
        allocation: parsedPlan.ratioInfo || parsedPlan.allocation,
        strategy: parsedPlan.strategy,
        badgeLabels: parsedPlan.badgeLabels,
        tags: parsedPlan.tags,
        description: parsedPlan.description,
        planType: parsedPlan.planType as "investment" | "staking",
        yieldInfo: parsedPlan.yieldInfo,
        ratioInfo: parsedPlan.ratioInfo,
        rating: parsedPlan.rating,
        logoUrl: parsedPlan.logoUrl,
        sortOrder: 0,
        isActive: true,
      });
      toast.success("플랜 등록 완료! 🎉", { description: `"${parsedPlan.name}" 플랜이 성공적으로 등록되었습니다.` });
      setParsedPlan(null);
      setPromptText("");
      setImageFile(null);
      setDocFile(null);
      setImagePreviewUrl(null);
    } catch (e: any) {
      toast.error("등록 실패", { description: e.message });
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-yellow-400/10">
            <Sparkles className="h-6 w-6 text-yellow-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI 플랜 자동 등록</h1>
            <p className="text-sm text-muted-foreground">텍스트, 이미지, PDF/PPT를 업로드하면 AI가 자동으로 플랜 정보를 추출합니다</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 입력 영역 */}
          <div className="space-y-4">
            <Tabs defaultValue="text">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="text" className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4" /> 텍스트
                </TabsTrigger>
                <TabsTrigger value="image" className="flex items-center gap-1.5">
                  <Image className="h-4 w-4" /> 이미지
                </TabsTrigger>
                <TabsTrigger value="file" className="flex items-center gap-1.5">
                  <Upload className="h-4 w-4" /> PDF/PPT
                </TabsTrigger>
              </TabsList>

              {/* 텍스트 탭 */}
              <TabsContent value="text" className="space-y-3 mt-4">
                <Label>플랜 정보 텍스트 입력</Label>
                <Textarea
                  placeholder={`예시:\nB BAG MAXFI - Stable / Treasury-focused 플랜\n일일 수익률: 0.35%\n추천 투자금액: 1,000 USDT\n전략: BINANCE Alpha + Insurance(Hedge)\nRatio: 40% 40% 20%\nYield: Daily 0.6% ~ 2%\n별점: 5.0`}
                  value={promptText}
                  onChange={e => setPromptText(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                />
                <Button
                  onClick={handleParseFromText}
                  disabled={!promptText.trim() || isLoading}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                >
                  {parseFromText.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> AI 분석 중...</>
                  ) : (
                    <><Sparkles className="h-4 w-4 mr-2" /> AI로 플랜 정보 추출</>
                  )}
                </Button>
              </TabsContent>

              {/* 이미지 탭 */}
              <TabsContent value="image" className="space-y-3 mt-4">
                <Label>플랜 카드 이미지 업로드</Label>
                <div
                  className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 text-center cursor-pointer hover:border-yellow-400/50 transition-colors"
                  onClick={() => imageInputRef.current?.click()}
                >
                  {imagePreviewUrl ? (
                    <img src={imagePreviewUrl} alt="preview" className="max-h-48 mx-auto rounded-lg object-contain" />
                  ) : (
                    <div className="space-y-2">
                      <Image className="h-10 w-10 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">클릭하여 이미지 선택 (JPG, PNG, WebP)</p>
                    </div>
                  )}
                </div>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImageFile(file);
                      setImagePreviewUrl(URL.createObjectURL(file));
                    }
                  }}
                />
                {imageFile && (
                  <p className="text-xs text-muted-foreground">선택됨: {imageFile.name} ({(imageFile.size / 1024).toFixed(1)} KB)</p>
                )}
                <Button
                  onClick={handleParseFromImage}
                  disabled={!imageFile || isLoading}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                >
                  {parseFromImage.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> 이미지 분석 중...</>
                  ) : (
                    <><Sparkles className="h-4 w-4 mr-2" /> 이미지에서 플랜 추출</>
                  )}
                </Button>
              </TabsContent>

              {/* PDF/PPT 탭 */}
              <TabsContent value="file" className="space-y-3 mt-4">
                <Label>PDF 또는 PPT 파일 업로드</Label>
                <div
                  className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 text-center cursor-pointer hover:border-yellow-400/50 transition-colors"
                  onClick={() => docInputRef.current?.click()}
                >
                  <div className="space-y-2">
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                    {docFile ? (
                      <p className="text-sm font-medium text-yellow-500">{docFile.name}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">클릭하여 파일 선택 (PDF, PPT, PPTX)</p>
                    )}
                  </div>
                </div>
                <input
                  ref={docInputRef}
                  type="file"
                  accept=".pdf,.ppt,.pptx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) setDocFile(file);
                  }}
                />
                {docFile && (
                  <p className="text-xs text-muted-foreground">파일 크기: {(docFile.size / 1024).toFixed(1)} KB</p>
                )}
                <Button
                  onClick={handleParseFromFile}
                  disabled={!docFile || isLoading}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                >
                  {parseFromFile.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> 문서 분석 중...</>
                  ) : (
                    <><Sparkles className="h-4 w-4 mr-2" /> 문서에서 플랜 추출</>
                  )}
                </Button>
              </TabsContent>
            </Tabs>
          </div>

          {/* 미리보기 & 등록 영역 */}
          <div className="space-y-4">
            {parsedPlan ? (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    AI 추출 결과 미리보기
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center gap-1.5"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    {isEditing ? "미리보기" : "수정"}
                  </Button>
                </div>

                {isEditing ? (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">플랜 정보 수정</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <EditablePlanForm plan={parsedPlan} onChange={setParsedPlan} />
                    </CardContent>
                  </Card>
                ) : (
                  <div className="flex justify-center">
                    <PlanPreviewCard plan={parsedPlan} />
                  </div>
                )}

                <Button
                  onClick={handleRegister}
                  disabled={createFromParsed.isPending}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-12 text-base"
                >
                  {createFromParsed.isPending ? (
                    <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> 등록 중...</>
                  ) : (
                    <><Plus className="h-5 w-5 mr-2" /> 플랜 등록 확정</>
                  )}
                </Button>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-muted-foreground/20 rounded-xl min-h-[400px]">
                <Sparkles className="h-12 w-12 text-yellow-400/40 mb-4" />
                <p className="text-muted-foreground font-medium">AI 분석 결과가 여기에 표시됩니다</p>
                <p className="text-sm text-muted-foreground mt-1">왼쪽에서 텍스트, 이미지, 또는 파일을 입력하세요</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
