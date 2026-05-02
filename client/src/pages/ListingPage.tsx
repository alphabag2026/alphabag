import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { MainNav } from "@/components/MainNav";
import {
  FileText, CheckCircle, Send, Globe, Twitter, MessageCircle,
  Sparkles, Loader2, Youtube, Eye, ChevronRight, Upload, X
} from "lucide-react";
import { toast } from "sonner";

interface ListingForm {
  projectName: string;
  projectSymbol: string;
  projectWebsite: string;
  projectDescription: string;
  revenueModel: string;
  category: "golden" | "self" | "leader" | "meme" | "influencer" | "cbag" | "airdrop" | "partner" | "";
  contactName: string;
  contactEmail: string;
  contactTelegram: string;
  logoUrl: string;
  telegramUrl: string;
  twitterUrl: string;
  youtubeUrl: string;
  additionalInfo: string;
}

const CATEGORIES = [
  { value: "golden", label: "🥇 Golden Collection", desc: "프리미엄 고수익 전략" },
  { value: "self", label: "🔵 Self Collection", desc: "자기주도 투자 전략" },
  { value: "leader", label: "👑 Leader Collection", desc: "리더 큐레이션 전략" },
  { value: "meme", label: "🚀 Meme Token", desc: "밈 토큰 투자 전략" },
  { value: "influencer", label: "⭐ Influencer", desc: "인플루언서 추천 전략" },
  { value: "cbag", label: "💎 C-BAG", desc: "멀티에셋 포트폴리오" },
  { value: "airdrop", label: "🎁 Airdrop", desc: "에어드랍 이벤트" },
  { value: "partner", label: "🤝 Partner", desc: "핵심 파트너십" },
];

const defaultForm: ListingForm = {
  projectName: "", projectSymbol: "", projectWebsite: "", projectDescription: "",
  revenueModel: "", category: "", contactName: "", contactEmail: "",
  contactTelegram: "", logoUrl: "", telegramUrl: "", twitterUrl: "",
  youtubeUrl: "", additionalInfo: "",
};

// 신청 완료 후 미리보기 컴포넌트
function SubmittedPreview({ form }: { form: ListingForm }) {
  const STEPS = [
    { id: 1, label: "신청 접수", desc: "신청서가 접수되었습니다", done: true },
    { id: 2, label: "검토 중", desc: "팀에서 검토 중입니다 (영업일 3~5일)", done: false },
    { id: 3, label: "커뮤니티 투표", desc: "커뮤니티 투표 진행", done: false },
    { id: 4, label: "리스팅 완료", desc: "플랫폼에 등록됩니다", done: false },
  ];
  const [showPreview, setShowPreview] = useState(false);
  const categoryLabel = CATEGORIES.find(c => c.value === form.category)?.label || form.category;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50">
      <MainNav />
      <div className="max-w-2xl mx-auto px-4 py-16">
        {/* 완료 헤더 */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">신청 완료!</h2>
          <p className="text-gray-600 text-sm">리스팅 신청이 성공적으로 접수되었습니다.</p>
        </div>

        {/* 미리보기 버튼 */}
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="w-full flex items-center justify-center gap-2 py-3 mb-6 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-400 transition-colors"
        >
          <Eye className="w-4 h-4" />
          {showPreview ? "미리보기 닫기" : "신청 내용 미리보기"}
          <ChevronRight className={`w-4 h-4 transition-transform ${showPreview ? "rotate-90" : ""}`} />
        </button>

        {/* 미리보기 카드 */}
        {showPreview && (
          <div className="bg-white rounded-2xl border border-amber-100 shadow-lg overflow-hidden mb-6">
            {/* 프로젝트 헤더 */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
              <div className="flex items-center gap-4">
                {form.logoUrl ? (
                  <img src={form.logoUrl} alt="logo" className="w-16 h-16 rounded-2xl object-contain bg-white/20 p-1" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-black">
                    {form.projectName.charAt(0) || "?"}
                  </div>
                )}
                <div>
                  <h3 className="text-2xl font-black">{form.projectName || "프로젝트명"}</h3>
                  {form.projectSymbol && <span className="text-amber-100 text-sm font-mono">${form.projectSymbol}</span>}
                  <div className="mt-1">
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{categoryLabel}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* 프로젝트 설명 */}
              {form.projectDescription && (
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">프로젝트 설명</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">{form.projectDescription}</p>
                </div>
              )}

              {/* 수익 모델 */}
              {form.revenueModel && (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                  <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">💰 수익 모델</h4>
                  <p className="text-sm text-amber-900 leading-relaxed">{form.revenueModel}</p>
                </div>
              )}

              {/* 링크 모음 */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">커뮤니티 & 링크</h4>
                <div className="flex flex-wrap gap-2">
                  {form.projectWebsite && (
                    <a href={form.projectWebsite} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors">
                      <Globe className="w-3.5 h-3.5" />웹사이트
                    </a>
                  )}
                  {form.telegramUrl && (
                    <a href={form.telegramUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-700 rounded-lg text-xs font-semibold hover:bg-sky-100 transition-colors">
                      <MessageCircle className="w-3.5 h-3.5" />텔레그램
                    </a>
                  )}
                  {form.youtubeUrl && (
                    <a href={form.youtubeUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors">
                      <Youtube className="w-3.5 h-3.5" />유튜브
                    </a>
                  )}
                  {form.twitterUrl && (
                    <a href={form.twitterUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-100 transition-colors">
                      <Twitter className="w-3.5 h-3.5" />X (트위터)
                    </a>
                  )}
                </div>
              </div>

              {/* 담당자 정보 */}
              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">담당자 정보</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>{form.contactName} · {form.contactEmail}</div>
                  {form.contactTelegram && <div className="text-sky-600">{form.contactTelegram}</div>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 진행 상태 트래커 */}
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-6 mb-6">
          <h3 className="font-bold text-gray-900 mb-5 text-sm">신청 진행 상태</h3>
          <div>
            {STEPS.map((s, idx) => (
              <div key={s.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold border-2 ${
                    s.done ? "bg-green-500 border-green-500 text-white" : "bg-white border-gray-200 text-gray-400"
                  }`}>
                    {s.done ? "✓" : s.id}
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={`w-0.5 h-8 mt-1 ${s.done ? "bg-green-300" : "bg-gray-100"}`} />
                  )}
                </div>
                <div className="pb-6 pt-1">
                  <p className={`text-sm font-semibold ${s.done ? "text-green-700" : "text-gray-500"}`}>{s.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <a href="/" className="block w-full text-center px-8 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-400 transition-colors">
          홈으로 돌아가기
        </a>
      </div>
    </div>
  );
}

export default function ListingPage() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submittedForm, setSubmittedForm] = useState<ListingForm>(defaultForm);
  const [draftSaved, setDraftSaved] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extraPrompt, setExtraPrompt] = useState("");
  const [showPromptInput, setShowPromptInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const DRAFT_KEY = "alphabag_listing_draft";

  const [form, setForm] = useState<ListingForm>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultForm;
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
        setDraftSaved(true);
        setTimeout(() => setDraftSaved(false), 2000);
      } catch {}
    }, 3000);
    return () => clearTimeout(timer);
  }, [form]);

  const clearDraft = () => { try { localStorage.removeItem(DRAFT_KEY); } catch {} };

  const analyzeFile = trpc.listing.analyzeFile.useMutation({
    onSuccess: (result) => {
      const d = result.data;
      setForm(prev => ({
        ...prev,
        projectName: d.projectName || prev.projectName,
        projectSymbol: d.projectSymbol || prev.projectSymbol,
        projectWebsite: d.projectWebsite || prev.projectWebsite,
        projectDescription: d.projectDescription || prev.projectDescription,
        revenueModel: d.revenueModel || prev.revenueModel,
        logoUrl: d.logoUrl || prev.logoUrl,
        telegramUrl: d.telegramUrl || prev.telegramUrl,
        twitterUrl: d.twitterUrl || prev.twitterUrl,
        youtubeUrl: d.youtubeUrl || prev.youtubeUrl,
      }));
      toast.success("AI 분석 완료! 정보가 자동으로 입력되었습니다. 확인 후 수정하세요.");
      setIsAnalyzing(false);
      setShowPromptInput(false);
      setExtraPrompt("");
    },
    onError: (e) => {
      toast.error("AI 분석 실패: " + e.message);
      setIsAnalyzing(false);
    },
  });

  const submit = trpc.listing.submit.useMutation({
    onSuccess: () => {
      setSubmittedForm({ ...form });
      setSubmitted(true);
      clearDraft();
      toast.success("리스팅 신청이 완료되었습니다!");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const MAX_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_SIZE) { toast.error("파일 크기는 15MB 이하여야 합니다."); return; }
    setIsAnalyzing(true);
    toast.info("AI가 파일을 분석 중입니다... (10~30초 소요)");
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      analyzeFile.mutate({ base64, mimeType: file.type || "application/octet-stream", fileName: file.name, extraPrompt: extraPrompt || undefined });
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category) { toast.error("카테고리를 선택해 주세요"); return; }
    submit.mutate(form as any);
  };

  if (submitted) return <SubmittedPreview form={submittedForm} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50">
      <MainNav />
      {/* 히어로 */}
      <div className="relative overflow-hidden bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-20 w-72 h-72 rounded-full bg-white/20 blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 py-14">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <FileText className="w-6 h-6 text-amber-100" />
            </div>
            <span className="text-amber-100 text-sm font-semibold tracking-widest uppercase">Project Listing</span>
          </div>
          <h1 className="text-4xl font-black mb-3">📋 프로젝트 리스팅 신청</h1>
          <p className="text-white/80 text-lg max-w-2xl">
            AlphaBag에 프로젝트를 등록하고 수천 명의 투자자에게 노출하세요.
            검토 후 승인된 프로젝트는 해당 컬렉션에 자동으로 등록됩니다.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* 스텝 인디케이터 */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step >= s ? "bg-amber-500 text-white" : "bg-secondary text-muted-foreground"
              }`}>{s}</div>
              {s < 3 && <div className={`h-0.5 w-12 transition-all ${step > s ? "bg-amber-500" : "bg-secondary"}`} />}
            </div>
          ))}
          <div className="ml-2 text-sm text-gray-500">
            {step === 1 ? "프로젝트 정보" : step === 2 ? "연락처 정보" : "추가 정보"}
          </div>
          {draftSaved && <span className="ml-auto text-xs text-green-500">✓ 임시저장됨</span>}
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-amber-100 shadow-sm p-6">
          {/* ─── STEP 1: 프로젝트 정보 ─── */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-900 mb-2">프로젝트 정보</h2>

              {/* AI 자동완성 섹션 */}
              <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-4 border border-violet-100">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-violet-600" />
                  <span className="text-sm font-bold text-violet-800">AI 자동완성</span>
                  <span className="text-xs text-violet-500 ml-1">PPT · PDF · 원페이지 이미지 업로드</span>
                </div>
                <p className="text-xs text-violet-600 mb-3">
                  프로젝트 소개 자료를 업로드하면 AI가 자동으로 프로젝트명, 설명, 수익모델, 링크 등을 추출합니다.
                </p>
                <button type="button" onClick={() => setShowPromptInput(!showPromptInput)}
                  className="text-xs text-violet-600 underline mb-2 block">
                  {showPromptInput ? "추가 설명 닫기" : "+ 추가 설명 입력 (선택사항)"}
                </button>
                {showPromptInput && (
                  <textarea value={extraPrompt} onChange={(e) => setExtraPrompt(e.target.value)}
                    placeholder="예: 이 프로젝트는 DeFi 기반 스테이킹 플랫폼입니다. 텔레그램은 @myproject 입니다."
                    rows={2} className="w-full px-3 py-2 border border-violet-200 rounded-lg text-xs focus:outline-none focus:border-violet-400 resize-none mb-2 bg-white" />
                )}
                <div className="flex gap-2">
                  <input ref={fileInputRef} type="file" accept=".pdf,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.gif"
                    onChange={handleFileSelect} className="hidden" id="ai-file-input" />
                  <label htmlFor="ai-file-input"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-colors ${
                      isAnalyzing ? "bg-violet-200 text-violet-400 cursor-not-allowed" : "bg-violet-600 text-white hover:bg-violet-500"
                    }`} onClick={(e) => isAnalyzing && e.preventDefault()}>
                    {isAnalyzing ? <><Loader2 className="w-4 h-4 animate-spin" />분석 중...</> : <><Upload className="w-4 h-4" />파일 선택 & AI 분석</>}
                  </label>
                  {(form.projectName || form.projectDescription) && (
                    <button type="button" onClick={() => setForm(prev => ({ ...prev, projectName: "", projectDescription: "", revenueModel: "", logoUrl: "", telegramUrl: "", twitterUrl: "", youtubeUrl: "", projectWebsite: "", projectSymbol: "" }))}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs text-gray-500 border border-gray-200 hover:bg-gray-50">
                      <X className="w-3 h-3" />초기화
                    </button>
                  )}
                </div>
                <p className="text-xs text-violet-400 mt-1.5">지원 형식: PDF, PPT/PPTX, PNG, JPG, WEBP (최대 15MB)</p>
              </div>

              {/* 프로젝트명 & 심볼 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">프로젝트명 *</label>
                  <input name="projectName" value={form.projectName} onChange={handleChange} required
                    placeholder="My Awesome Project" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">심볼</label>
                  <input name="projectSymbol" value={form.projectSymbol} onChange={handleChange}
                    placeholder="BTC" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 font-mono" />
                </div>
              </div>

              {/* 카테고리 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">카테고리 *</label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => (
                    <label key={cat.value} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      form.category === cat.value ? "border-amber-400 bg-amber-50" : "border-gray-100 hover:border-amber-200"
                    }`}>
                      <input type="radio" name="category" value={cat.value} checked={form.category === cat.value}
                        onChange={handleChange} className="sr-only" />
                      <div>
                        <div className="text-sm font-semibold text-gray-800">{cat.label}</div>
                        <div className="text-xs text-gray-500">{cat.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* 웹사이트 & 로고 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    <Globe className="w-3.5 h-3.5 inline mr-1" />공식 웹사이트
                  </label>
                  <input name="projectWebsite" value={form.projectWebsite} onChange={handleChange}
                    placeholder="https://project.io" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">로고 URL</label>
                  <div className="flex gap-2 items-center">
                    {form.logoUrl && (
                      <img src={form.logoUrl} alt="logo" className="w-10 h-10 rounded-lg object-contain border border-gray-200 flex-shrink-0" />
                    )}
                    <input name="logoUrl" value={form.logoUrl} onChange={handleChange}
                      placeholder="https://..." className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400" />
                  </div>
                </div>
              </div>

              {/* 프로젝트 설명 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">프로젝트 설명</label>
                <textarea name="projectDescription" value={form.projectDescription} onChange={handleChange} rows={3}
                  placeholder="프로젝트의 핵심 가치와 특징을 간략히 설명해 주세요..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 resize-none" />
              </div>

              {/* 수익 모델 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">💰 수익 모델</label>
                <textarea name="revenueModel" value={form.revenueModel} onChange={handleChange} rows={3}
                  placeholder="프로젝트의 수익 구조와 투자자 보상 방식을 설명해 주세요..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 resize-none" />
              </div>

              <button type="button" onClick={() => {
                if (!form.projectName) { toast.error("프로젝트명을 입력해 주세요"); return; }
                if (!form.category) { toast.error("카테고리를 선택해 주세요"); return; }
                setStep(2);
              }} className="w-full py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-400 transition-colors">
                다음 단계 →
              </button>
            </div>
          )}

          {/* ─── STEP 2: 연락처 정보 ─── */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-900 mb-5">연락처 정보</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">담당자명 *</label>
                  <input name="contactName" value={form.contactName} onChange={handleChange} required
                    placeholder="홍길동" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">이메일 *</label>
                  <input name="contactEmail" value={form.contactEmail} onChange={handleChange} required type="email"
                    placeholder="contact@project.io" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  <MessageCircle className="w-3.5 h-3.5 inline mr-1" />텔레그램 ID
                </label>
                <input name="contactTelegram" value={form.contactTelegram} onChange={handleChange}
                  placeholder="@username" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    <MessageCircle className="w-3.5 h-3.5 inline mr-1" />텔레그램 채널
                  </label>
                  <input name="telegramUrl" value={form.telegramUrl} onChange={handleChange}
                    placeholder="https://t.me/yourchannel" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    <Twitter className="w-3.5 h-3.5 inline mr-1" />트위터/X
                  </label>
                  <input name="twitterUrl" value={form.twitterUrl} onChange={handleChange}
                    placeholder="https://x.com/yourproject" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  <Youtube className="w-3.5 h-3.5 inline mr-1 text-red-500" />유튜브 채널
                </label>
                <input name="youtubeUrl" value={form.youtubeUrl} onChange={handleChange}
                  placeholder="https://youtube.com/@yourchannel" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors">← 이전</button>
                <button type="button" onClick={() => {
                  if (!form.contactName || !form.contactEmail) { toast.error("필수 항목을 입력해 주세요"); return; }
                  setStep(3);
                }} className="flex-1 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-400 transition-colors">다음 단계 →</button>
              </div>
            </div>
          )}

          {/* ─── STEP 3: 추가 정보 ─── */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-900 mb-5">
                <Sparkles className="w-5 h-5 inline mr-2 text-amber-500" />추가 정보
              </h2>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">추가 정보 및 요청사항</label>
                <textarea name="additionalInfo" value={form.additionalInfo} onChange={handleChange} rows={5}
                  placeholder="투자 전략, 예상 수익률, 특별 요청사항 등 추가로 전달하고 싶은 내용을 자유롭게 작성해 주세요..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 resize-none" />
              </div>

              {/* 신청 요약 */}
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                <h3 className="text-sm font-bold text-amber-800 mb-3">신청 요약</h3>
                <div className="flex items-center gap-3 mb-3">
                  {form.logoUrl ? (
                    <img src={form.logoUrl} alt="logo" className="w-10 h-10 rounded-lg object-contain border border-amber-200 bg-white" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-amber-200 flex items-center justify-center text-amber-700 font-black text-sm">
                      {form.projectName.charAt(0) || "?"}
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-amber-900">{form.projectName}</div>
                    <div className="text-xs text-amber-600">{CATEGORIES.find(c => c.value === form.category)?.label}</div>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-amber-700">
                  <div>담당자: <span className="font-semibold">{form.contactName} ({form.contactEmail})</span></div>
                  {form.revenueModel && <div className="text-amber-600 line-clamp-2">💰 {form.revenueModel}</div>}
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {form.telegramUrl && <span className="bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full">텔레그램 ✓</span>}
                    {form.youtubeUrl && <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full">유튜브 ✓</span>}
                    {form.twitterUrl && <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">X ✓</span>}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(2)} className="flex-1 py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors">← 이전</button>
                <button type="submit" disabled={submit.isPending}
                  className="flex-1 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                  <Send className="w-4 h-4" />
                  {submit.isPending ? "제출 중..." : "신청 완료"}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
