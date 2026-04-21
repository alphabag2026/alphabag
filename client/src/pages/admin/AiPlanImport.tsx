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
import {
  Loader2, Sparkles, Upload, FileText, Image as ImageIcon, CheckCircle,
  Edit2, Plus, Globe, Youtube, Palette, ChevronRight, ChevronLeft,
  Wand2, RefreshCw, ExternalLink, Check, X
} from "lucide-react";
import { Link } from "wouter";

// ─── 타입 정의 ─────────────────────────────────────────────────────────────
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
  telegramUrl?: string;
  twitterUrl?: string;
  videoUrl?: string;
  videoUrl2?: string;
}

interface LogoOption {
  url: string;
  style: string;
}

interface VideoResult {
  videoId: string;
  title: string;
  url: string;
  thumbnail: string;
  channelTitle: string;
  description?: string;
  publishedAt?: string;
}

// ─── 플랜 미리보기 카드 ─────────────────────────────────────────────────────
function PlanPreviewCard({ plan }: { plan: ParsedPlan }) {
  const dailyRateNum = parseFloat(plan.dailyRate || "0");
  return (
    <div className="border-2 border-yellow-400 rounded-xl overflow-hidden bg-card shadow-lg max-w-sm w-full">
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
        {plan.badgeLabels && plan.badgeLabels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {plan.badgeLabels.map((badge, i) => (
              <Badge key={i} variant="outline" className="text-xs border-yellow-400/50 text-yellow-600">{badge}</Badge>
            ))}
          </div>
        )}
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
        <div>
          <p className="text-3xl font-bold text-yellow-500">{dailyRateNum.toFixed(2)}%</p>
          <p className="text-xs text-muted-foreground">Daily Return</p>
        </div>
        {plan.recommendedAmount && (
          <p className="text-sm">추천금액: <span className="font-bold text-yellow-500">{plan.recommendedAmount} USDT</span></p>
        )}
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className={`text-sm ${i < Math.round(plan.rating ?? 4) ? "text-yellow-400" : "text-gray-300"}`}>★</span>
          ))}
          <span className="text-sm text-muted-foreground ml-1">{plan.rating ?? 4.0}</span>
        </div>
        {plan.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{plan.description}</p>
        )}
        {/* 링크 영역 */}
        <div className="flex gap-2 flex-wrap">
          {plan.videoUrl && (
            <a href={plan.videoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-red-500 flex items-center gap-1 hover:underline">
              <Youtube className="h-3 w-3" /> 영상 1
            </a>
          )}
          {plan.videoUrl2 && (
            <a href={plan.videoUrl2} target="_blank" rel="noopener noreferrer" className="text-xs text-red-500 flex items-center gap-1 hover:underline">
              <Youtube className="h-3 w-3" /> 영상 2
            </a>
          )}
          {plan.telegramUrl && (
            <a href={plan.telegramUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 flex items-center gap-1 hover:underline">
              <ExternalLink className="h-3 w-3" /> TG
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 편집 폼 ────────────────────────────────────────────────────────────────
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
      <div className="space-y-1">
        <Label>플랜 타입</Label>
        <select
          className="w-full border rounded-md px-3 py-2 text-sm bg-background"
          value={plan.planType}
          onChange={e => onChange({ ...plan, planType: e.target.value })}
        >
          {["investment","staking","golden","self","leader","influencer","meme","node"].map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label>별점 (1~5)</Label>
        <Input type="number" min={1} max={5} step={0.1} value={plan.rating ?? 4.0} onChange={e => onChange({ ...plan, rating: parseFloat(e.target.value) })} />
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
        <Label>로고 URL</Label>
        <Input value={plan.logoUrl ?? ""} onChange={e => onChange({ ...plan, logoUrl: e.target.value })} placeholder="https://..." />
      </div>
      <div className="space-y-1">
        <Label>영상 URL 1 (YouTube)</Label>
        <Input value={plan.videoUrl ?? ""} onChange={e => onChange({ ...plan, videoUrl: e.target.value })} placeholder="https://youtube.com/..." />
      </div>
      <div className="space-y-1">
        <Label>영상 URL 2 (YouTube)</Label>
        <Input value={plan.videoUrl2 ?? ""} onChange={e => onChange({ ...plan, videoUrl2: e.target.value })} placeholder="https://youtube.com/..." />
      </div>
      <div className="space-y-1">
        <Label>텔레그램 URL</Label>
        <Input value={plan.telegramUrl ?? ""} onChange={e => onChange({ ...plan, telegramUrl: e.target.value })} placeholder="https://t.me/..." />
      </div>
      <div className="space-y-1">
        <Label>트위터/X URL</Label>
        <Input value={plan.twitterUrl ?? ""} onChange={e => onChange({ ...plan, twitterUrl: e.target.value })} placeholder="https://twitter.com/..." />
      </div>
    </div>
  );
}

// ─── 단계 표시기 ────────────────────────────────────────────────────────────
function StepIndicator({ step }: { step: number }) {
  const steps = [
    { label: "자료 입력", icon: FileText },
    { label: "로고 & 영상", icon: Palette },
    { label: "확인 & 등록", icon: CheckCircle },
  ];
  return (
    <div className="flex items-center gap-2 mb-6">
      {steps.map((s, i) => {
        const Icon = s.icon;
        const isActive = i + 1 === step;
        const isDone = i + 1 < step;
        return (
          <div key={i} className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              isActive ? "bg-yellow-400 text-black" :
              isDone ? "bg-green-500/20 text-green-400 border border-green-500/30" :
              "bg-muted text-muted-foreground"
            }`}>
              {isDone ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
              {s.label}
            </div>
            {i < steps.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        );
      })}
    </div>
  );
}

// ─── 메인 컴포넌트 ──────────────────────────────────────────────────────────
export default function AiPlanImport() {
  const [step, setStep] = useState(1);
  const [parsedPlan, setParsedPlan] = useState<ParsedPlan | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // 입력 상태
  const [promptText, setPromptText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");

  // 로고 상태
  const [logoOptions, setLogoOptions] = useState<LogoOption[]>([]);
  const [selectedLogoIdx, setSelectedLogoIdx] = useState<number | null>(null);

  // 영상 상태
  const [videoResults, setVideoResults] = useState<VideoResult[]>([]);
  const [selectedVideoIdx, setSelectedVideoIdx] = useState<number | null>(null);
  const [selectedVideo2Idx, setSelectedVideo2Idx] = useState<number | null>(null);
  const [suggestedQueries, setSuggestedQueries] = useState<string[]>([]);
  const [videoQuery, setVideoQuery] = useState("");

  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // tRPC mutations
  const parseFromText = trpc.aiPlanImport.parseFromText.useMutation();
  const parseFromImage = trpc.aiPlanImport.parseFromImage.useMutation();
  const parseFromFile = trpc.aiPlanImport.parseFromFile.useMutation();
  const parseFromUrl = trpc.aiPlanImport.parseFromUrl.useMutation();
  const generateLogoMut = trpc.aiPlanImport.generateLogo.useMutation();
  const searchYouTubeMut = trpc.aiPlanImport.searchYouTube.useMutation();
  const fullAutoFillMut = trpc.aiPlanImport.fullAutoFill.useMutation();
  const createFromParsed = trpc.aiPlanImport.createFromParsed.useMutation();

  const isParsingLoading = parseFromText.isPending || parseFromImage.isPending || parseFromFile.isPending || parseFromUrl.isPending;

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // 파싱 완료 후 Step 2로 이동 + 자동 로고/영상 채우기
  const afterParse = async (plan: ParsedPlan) => {
    setParsedPlan(plan);
    setVideoQuery(plan.name);
    setStep(2);
    toast.success("AI 파싱 완료! 로고와 영상을 자동으로 찾고 있습니다...");

    // 전체 자동 채우기 (로고 + 영상 동시)
    try {
      const autoResult = await fullAutoFillMut.mutateAsync({
        planName: plan.name,
        parsedPlan: plan,
        generateLogo: !plan.logoUrl,
        searchVideos: !plan.videoUrl,
      });
      if (autoResult.logos && autoResult.logos.length > 0) {
        setLogoOptions(autoResult.logos as LogoOption[]);
        setSelectedLogoIdx(0);
        setParsedPlan(prev => prev ? { ...prev, logoUrl: (autoResult.logos as LogoOption[])[0].url } : prev);
        toast.success("로고 자동 생성 완료!");
      }
      if (autoResult.videos && autoResult.videos.length > 0) {
        setVideoResults(autoResult.videos as VideoResult[]);
        toast.success(`관련 영상 ${autoResult.videos.length}개 발견!`);
      }
    } catch {
      // 자동 채우기 실패해도 계속 진행
    }
  };

  const handleParseFromText = async () => {
    if (!promptText.trim()) return;
    try {
      const result = await parseFromText.mutateAsync({ text: promptText });
      await afterParse(result.plan as ParsedPlan);
    } catch (e: any) {
      toast.error("파싱 실패", { description: e.message });
    }
  };

  const handleParseFromImage = async () => {
    if (!imageFile) return;
    try {
      const base64 = await fileToBase64(imageFile);
      const result = await parseFromImage.mutateAsync({ base64, mimeType: imageFile.type });
      await afterParse({ ...(result.plan as ParsedPlan), logoUrl: result.imageUrl });
    } catch (e: any) {
      toast.error("이미지 파싱 실패", { description: e.message });
    }
  };

  const handleParseFromFile = async () => {
    if (!docFile) return;
    try {
      const base64 = await fileToBase64(docFile);
      const result = await parseFromFile.mutateAsync({ base64, mimeType: docFile.type, fileName: docFile.name });
      await afterParse(result.plan as ParsedPlan);
    } catch (e: any) {
      toast.error("문서 파싱 실패", { description: e.message });
    }
  };

  const handleParseFromUrl = async () => {
    if (!urlInput.trim()) return;
    try {
      const result = await parseFromUrl.mutateAsync({ url: urlInput });
      await afterParse(result.plan as ParsedPlan);
    } catch (e: any) {
      toast.error("URL 파싱 실패", { description: e.message });
    }
  };

  const handleGenerateLogos = async () => {
    if (!parsedPlan) return;
    try {
      const result = await generateLogoMut.mutateAsync({
        planName: parsedPlan.name,
        planType: parsedPlan.planType,
        description: parsedPlan.description,
      });
      if (result.logos && result.logos.length > 0) {
        setLogoOptions(result.logos as LogoOption[]);
        setSelectedLogoIdx(0);
        setParsedPlan(prev => prev ? { ...prev, logoUrl: (result.logos as LogoOption[])[0].url } : prev);
        toast.success(`로고 ${result.logos.length}개 생성 완료!`);
      }
    } catch (e: any) {
      toast.error("로고 생성 실패", { description: e.message });
    }
  };

  const handleSearchYouTube = async (query?: string) => {
    const q = query ?? videoQuery;
    if (!q.trim()) return;
    try {
      const result = await searchYouTubeMut.mutateAsync({ query: q, maxResults: 6 });
      if (result.noApiKey) {
        setSuggestedQueries(result.suggestedQueries ?? []);
        toast.info("YouTube API 키가 없습니다. 검색어를 직접 YouTube에서 검색하세요.", {
          description: "백오피스 설정에서 YOUTUBE_API_KEY를 등록하면 자동 검색이 가능합니다.",
        });
      } else {
        setVideoResults(result.videos as VideoResult[]);
        toast.success(`영상 ${result.videos.length}개 검색 완료!`);
      }
    } catch (e: any) {
      toast.error("YouTube 검색 실패", { description: e.message });
    }
  };

  const handleSelectLogo = (idx: number) => {
    setSelectedLogoIdx(idx);
    setParsedPlan(prev => prev ? { ...prev, logoUrl: logoOptions[idx].url } : prev);
  };

  const handleSelectVideo = (idx: number, slot: 1 | 2) => {
    if (slot === 1) {
      setSelectedVideoIdx(idx);
      setParsedPlan(prev => prev ? { ...prev, videoUrl: videoResults[idx].url } : prev);
    } else {
      setSelectedVideo2Idx(idx);
      setParsedPlan(prev => prev ? { ...prev, videoUrl2: videoResults[idx].url } : prev);
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
      // 초기화
      setStep(1);
      setParsedPlan(null);
      setPromptText("");
      setImageFile(null);
      setDocFile(null);
      setImagePreviewUrl(null);
      setUrlInput("");
      setLogoOptions([]);
      setVideoResults([]);
      setSelectedLogoIdx(null);
      setSelectedVideoIdx(null);
      setSelectedVideo2Idx(null);
    } catch (e: any) {
      toast.error("등록 실패", { description: e.message });
    }
  };

  const isAutoFilling = fullAutoFillMut.isPending;

  return (
    <AdminLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-yellow-400/10">
            <Wand2 className="h-6 w-6 text-yellow-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI 플랜 자동 등록</h1>
            <p className="text-sm text-muted-foreground">PPT, 원페이지, 이미지, 텍스트 → AI가 모든 필드를 자동으로 채워드립니다</p>
          </div>
        </div>

        <StepIndicator step={step} />

        {/* ─── STEP 1: 자료 입력 ─────────────────────────────────────────── */}
        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 space-y-4">
              <Tabs defaultValue="text">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="text" className="flex items-center gap-1 text-xs">
                    <FileText className="h-3.5 w-3.5" /> 텍스트
                  </TabsTrigger>
                  <TabsTrigger value="image" className="flex items-center gap-1 text-xs">
                    <ImageIcon className="h-3.5 w-3.5" /> 이미지
                  </TabsTrigger>
                  <TabsTrigger value="file" className="flex items-center gap-1 text-xs">
                    <Upload className="h-3.5 w-3.5" /> PDF/PPT
                  </TabsTrigger>
                  <TabsTrigger value="url" className="flex items-center gap-1 text-xs">
                    <Globe className="h-3.5 w-3.5" /> URL
                  </TabsTrigger>
                </TabsList>

                {/* 텍스트 탭 */}
                <TabsContent value="text" className="space-y-3 mt-4">
                  <Label className="text-sm font-medium">플랜 정보 텍스트 입력</Label>
                  <p className="text-xs text-muted-foreground">플랜 이름, 수익률, 전략, 특징 등을 자유롭게 입력하세요. AI가 자동으로 분석합니다.</p>
                  <Textarea
                    placeholder={`예시:\nB BAG MAXFI - Stable / Treasury-focused 플랜\n일일 수익률: 0.35%\n추천 투자금액: 1,000 USDT\n전략: BINANCE Alpha + Insurance(Hedge)\nRatio: 40% 40% 20%\nYield: Daily 0.6% ~ 2%\n별점: 5.0\n텔레그램: https://t.me/alphabag`}
                    value={promptText}
                    onChange={e => setPromptText(e.target.value)}
                    rows={12}
                    className="font-mono text-sm"
                  />
                  <Button
                    onClick={handleParseFromText}
                    disabled={!promptText.trim() || isParsingLoading}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                  >
                    {parseFromText.isPending ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> AI 분석 중...</>
                    ) : (
                      <><Sparkles className="h-4 w-4 mr-2" /> AI로 플랜 정보 추출 →</>
                    )}
                  </Button>
                </TabsContent>

                {/* 이미지 탭 */}
                <TabsContent value="image" className="space-y-3 mt-4">
                  <Label className="text-sm font-medium">플랜 카드 / 원페이지 이미지 업로드</Label>
                  <p className="text-xs text-muted-foreground">플랜 카드, 원페이지 스크린샷, 홍보 이미지 등을 업로드하면 AI가 텍스트를 인식합니다.</p>
                  <div
                    className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 text-center cursor-pointer hover:border-yellow-400/50 transition-colors"
                    onClick={() => imageInputRef.current?.click()}
                  >
                    {imagePreviewUrl ? (
                      <img src={imagePreviewUrl} alt="preview" className="max-h-48 mx-auto rounded-lg object-contain" />
                    ) : (
                      <div className="space-y-2">
                        <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground" />
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
                  {imageFile && <p className="text-xs text-muted-foreground">선택됨: {imageFile.name} ({(imageFile.size / 1024).toFixed(1)} KB)</p>}
                  <Button
                    onClick={handleParseFromImage}
                    disabled={!imageFile || isParsingLoading}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                  >
                    {parseFromImage.isPending ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> 이미지 분석 중...</>
                    ) : (
                      <><Sparkles className="h-4 w-4 mr-2" /> 이미지에서 플랜 추출 →</>
                    )}
                  </Button>
                </TabsContent>

                {/* PDF/PPT 탭 */}
                <TabsContent value="file" className="space-y-3 mt-4">
                  <Label className="text-sm font-medium">PDF 또는 PPT 파일 업로드</Label>
                  <p className="text-xs text-muted-foreground">투자 제안서, 소개 PPT, 백서 PDF 등을 업로드하면 AI가 전체 내용을 분석합니다.</p>
                  <div
                    className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center cursor-pointer hover:border-yellow-400/50 transition-colors"
                    onClick={() => docInputRef.current?.click()}
                  >
                    <div className="space-y-2">
                      <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                      {docFile ? (
                        <div>
                          <p className="text-sm font-medium text-yellow-500">{docFile.name}</p>
                          <p className="text-xs text-muted-foreground">{(docFile.size / 1024).toFixed(1)} KB</p>
                        </div>
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
                  <Button
                    onClick={handleParseFromFile}
                    disabled={!docFile || isParsingLoading}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                  >
                    {parseFromFile.isPending ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> 문서 분석 중...</>
                    ) : (
                      <><Sparkles className="h-4 w-4 mr-2" /> 문서에서 플랜 추출 →</>
                    )}
                  </Button>
                </TabsContent>

                {/* URL 탭 */}
                <TabsContent value="url" className="space-y-3 mt-4">
                  <Label className="text-sm font-medium">원페이지 URL 입력</Label>
                  <p className="text-xs text-muted-foreground">1page.to, 랜딩 페이지, 공식 사이트 URL을 입력하면 AI가 자동으로 내용을 분석합니다.</p>
                  <div className="flex gap-2">
                    <Input
                      value={urlInput}
                      onChange={e => setUrlInput(e.target.value)}
                      placeholder="https://xplay.1page.to"
                      className="flex-1"
                      onKeyDown={e => e.key === "Enter" && handleParseFromUrl()}
                    />
                    <Button
                      onClick={handleParseFromUrl}
                      disabled={!urlInput.trim() || isParsingLoading}
                      className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                    >
                      {parseFromUrl.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-3 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">지원 URL 예시:</p>
                    <p className="text-xs text-muted-foreground">• https://xplay.1page.to</p>
                    <p className="text-xs text-muted-foreground">• https://alphabag.net/plan/maxfi</p>
                    <p className="text-xs text-muted-foreground">• 투자 프로젝트 공식 웹사이트</p>
                  </div>
                  <Button
                    onClick={handleParseFromUrl}
                    disabled={!urlInput.trim() || isParsingLoading}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                  >
                    {parseFromUrl.isPending ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> URL 분석 중...</>
                    ) : (
                      <><Globe className="h-4 w-4 mr-2" /> URL에서 플랜 추출 →</>
                    )}
                  </Button>
                </TabsContent>
              </Tabs>
            </div>

            {/* 오른쪽: 안내 */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="border-yellow-400/20 bg-yellow-400/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Wand2 className="h-4 w-4 text-yellow-400" />
                    자동화 기능 안내
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-yellow-400/20 flex items-center justify-center text-yellow-400 text-[10px] font-bold shrink-0 mt-0.5">1</div>
                    <div>
                      <p className="font-medium text-foreground">자료 입력</p>
                      <p>PPT, 이미지, PDF, URL 중 하나를 입력하면 AI가 모든 필드를 자동 추출합니다.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-yellow-400/20 flex items-center justify-center text-yellow-400 text-[10px] font-bold shrink-0 mt-0.5">2</div>
                    <div>
                      <p className="font-medium text-foreground">로고 & 영상 자동 생성</p>
                      <p>플랜명 기반으로 AI 로고 3가지를 생성하고, YouTube에서 관련 영상을 자동 검색합니다.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-yellow-400/20 flex items-center justify-center text-yellow-400 text-[10px] font-bold shrink-0 mt-0.5">3</div>
                    <div>
                      <p className="font-medium text-foreground">확인 & 등록</p>
                      <p>미리보기에서 내용을 확인하고 수정 후 최종 등록합니다.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-400/20 bg-blue-400/5">
                <CardContent className="pt-4 space-y-2 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground flex items-center gap-1.5">
                    <Youtube className="h-3.5 w-3.5 text-red-500" /> YouTube 자동 검색
                  </p>
                  <p>YOUTUBE_API_KEY 환경변수를 설정하면 관련 영상을 자동으로 검색합니다. 미설정 시 검색어 제안 모드로 동작합니다.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ─── STEP 2: 로고 & 영상 선택 ──────────────────────────────────── */}
        {step === 2 && parsedPlan && (
          <div className="space-y-6">
            {isAutoFilling && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-yellow-400/10 border border-yellow-400/20">
                <Loader2 className="h-5 w-5 text-yellow-400 animate-spin" />
                <div>
                  <p className="text-sm font-medium">AI가 로고와 영상을 자동으로 찾고 있습니다...</p>
                  <p className="text-xs text-muted-foreground">플랜명 기반으로 로고를 생성하고 YouTube에서 관련 영상을 검색합니다.</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 로고 선택 */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Palette className="h-4 w-4 text-yellow-400" />
                      로고 선택
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateLogos}
                      disabled={generateLogoMut.isPending}
                      className="text-xs"
                    >
                      {generateLogoMut.isPending ? (
                        <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> 생성 중</>
                      ) : (
                        <><RefreshCw className="h-3 w-3 mr-1" /> 재생성</>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {logoOptions.length > 0 ? (
                    <div className="grid grid-cols-3 gap-3">
                      {logoOptions.map((logo, i) => (
                        <div
                          key={i}
                          className={`relative cursor-pointer rounded-lg border-2 p-2 transition-all ${
                            selectedLogoIdx === i ? "border-yellow-400 bg-yellow-400/10" : "border-muted hover:border-yellow-400/50"
                          }`}
                          onClick={() => handleSelectLogo(i)}
                        >
                          <img src={logo.url} alt={`Logo ${i + 1}`} className="w-full aspect-square object-contain rounded" />
                          <p className="text-[10px] text-center mt-1 text-muted-foreground">{logo.style}</p>
                          {selectedLogoIdx === i && (
                            <div className="absolute top-1 right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                              <Check className="h-2.5 w-2.5 text-black" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 space-y-3">
                      <Palette className="h-8 w-8 mx-auto text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">로고를 생성하려면 버튼을 클릭하세요</p>
                      <Button
                        onClick={handleGenerateLogos}
                        disabled={generateLogoMut.isPending}
                        className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                      >
                        {generateLogoMut.isPending ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> AI 로고 생성 중...</>
                        ) : (
                          <><Sparkles className="h-4 w-4 mr-2" /> AI 로고 3개 생성</>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* 직접 URL 입력 */}
                  <div className="space-y-1 pt-2 border-t">
                    <Label className="text-xs">또는 로고 URL 직접 입력</Label>
                    <Input
                      value={parsedPlan.logoUrl ?? ""}
                      onChange={e => setParsedPlan(prev => prev ? { ...prev, logoUrl: e.target.value } : prev)}
                      placeholder="https://..."
                      className="text-xs"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* 영상 선택 */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Youtube className="h-4 w-4 text-red-500" />
                      관련 영상 선택
                    </CardTitle>
                    <div className="flex gap-1">
                      <Input
                        value={videoQuery}
                        onChange={e => setVideoQuery(e.target.value)}
                        placeholder="검색어"
                        className="text-xs h-7 w-28"
                        onKeyDown={e => e.key === "Enter" && handleSearchYouTube()}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSearchYouTube()}
                        disabled={searchYouTubeMut.isPending}
                        className="text-xs h-7"
                      >
                        {searchYouTubeMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "검색"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {suggestedQueries.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">YouTube API 키 미설정 - 추천 검색어:</p>
                      <div className="flex flex-wrap gap-1">
                        {suggestedQueries.map((q, i) => (
                          <a
                            key={i}
                            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 flex items-center gap-1"
                          >
                            <Youtube className="h-2.5 w-2.5" /> {q}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {videoResults.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {videoResults.map((video, i) => (
                        <div
                          key={i}
                          className={`flex gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                            selectedVideoIdx === i ? "border-yellow-400 bg-yellow-400/10" :
                            selectedVideo2Idx === i ? "border-blue-400 bg-blue-400/10" :
                            "border-muted hover:border-yellow-400/30"
                          }`}
                        >
                          <img src={video.thumbnail} alt={video.title} className="w-16 h-10 object-cover rounded shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium line-clamp-1">{video.title}</p>
                            <p className="text-[10px] text-muted-foreground">{video.channelTitle}</p>
                          </div>
                          <div className="flex flex-col gap-1 shrink-0">
                            <Button
                              size="sm"
                              variant={selectedVideoIdx === i ? "default" : "outline"}
                              className="text-[10px] h-5 px-1.5"
                              onClick={() => handleSelectVideo(i, 1)}
                            >
                              영상1
                            </Button>
                            <Button
                              size="sm"
                              variant={selectedVideo2Idx === i ? "default" : "outline"}
                              className="text-[10px] h-5 px-1.5"
                              onClick={() => handleSelectVideo(i, 2)}
                            >
                              영상2
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : !searchYouTubeMut.isPending && suggestedQueries.length === 0 && (
                    <div className="text-center py-4 space-y-2">
                      <Youtube className="h-8 w-8 mx-auto text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">검색 버튼을 눌러 관련 영상을 찾으세요</p>
                    </div>
                  )}

                  {/* 직접 URL 입력 */}
                  <div className="space-y-2 pt-2 border-t">
                    <div className="space-y-1">
                      <Label className="text-xs">영상 URL 1 직접 입력</Label>
                      <Input
                        value={parsedPlan.videoUrl ?? ""}
                        onChange={e => setParsedPlan(prev => prev ? { ...prev, videoUrl: e.target.value } : prev)}
                        placeholder="https://youtube.com/watch?v=..."
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">영상 URL 2 직접 입력</Label>
                      <Input
                        value={parsedPlan.videoUrl2 ?? ""}
                        onChange={e => setParsedPlan(prev => prev ? { ...prev, videoUrl2: e.target.value } : prev)}
                        placeholder="https://youtube.com/watch?v=..."
                        className="text-xs"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 네비게이션 */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)} className="flex items-center gap-2">
                <ChevronLeft className="h-4 w-4" /> 이전 단계
              </Button>
              <Button
                onClick={() => setStep(3)}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold flex items-center gap-2"
              >
                다음 단계 <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ─── STEP 3: 확인 & 등록 ────────────────────────────────────────── */}
        {step === 3 && parsedPlan && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 미리보기 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    최종 미리보기
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
                <div className="flex justify-center">
                  <PlanPreviewCard plan={parsedPlan} />
                </div>
              </div>

              {/* 편집 폼 */}
              <div className="space-y-4">
                <h2 className="font-semibold">전체 필드 확인 및 수정</h2>
                <Card>
                  <CardContent className="pt-4">
                    <EditablePlanForm plan={parsedPlan} onChange={setParsedPlan} />
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* 네비게이션 */}
            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={() => setStep(2)} className="flex items-center gap-2">
                <ChevronLeft className="h-4 w-4" /> 이전 단계
              </Button>
              <Button
                onClick={handleRegister}
                disabled={createFromParsed.isPending}
                className="bg-green-600 hover:bg-green-700 text-white font-bold h-12 px-8 text-base flex items-center gap-2"
              >
                {createFromParsed.isPending ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> 등록 중...</>
                ) : (
                  <><Plus className="h-5 w-5" /> 플랜 최종 등록</>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
