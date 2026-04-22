import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { MainNav } from "@/components/MainNav";
import { FileText, CheckCircle, Send, Globe, Twitter, MessageCircle, Upload, Sparkles } from "lucide-react";
import { toast } from "sonner";

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

export default function ListingPage() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    projectName: "",
    projectSymbol: "",
    projectWebsite: "",
    projectDescription: "",
    category: "" as any,
    contactName: "",
    contactEmail: "",
    contactTelegram: "",
    logoUrl: "",
    telegramUrl: "",
    twitterUrl: "",
    additionalInfo: "",
  });

  const submit = trpc.listing.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("리스팅 신청이 완료되었습니다!");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category) { toast.error("카테고리를 선택해 주세요"); return; }
    submit.mutate(form);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50">
        <MainNav />
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-3">신청 완료!</h2>
          <p className="text-gray-600 mb-2">리스팅 신청이 성공적으로 접수되었습니다.</p>
          <p className="text-gray-500 text-sm mb-8">담당자가 검토 후 입력하신 이메일로 연락드립니다. (영업일 기준 3~5일)</p>
          <a href="/" className="inline-flex items-center gap-2 bg-amber-500 text-white font-bold px-6 py-3 rounded-xl hover:bg-amber-400 transition-colors">
            홈으로 돌아가기
          </a>
        </div>
      </div>
    );
  }

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
                step >= s ? "bg-amber-500 text-white" : "bg-gray-200 text-gray-400"
              }`}>{s}</div>
              {s < 3 && <div className={`h-0.5 w-12 transition-all ${step > s ? "bg-amber-500" : "bg-gray-200"}`} />}
            </div>
          ))}
          <div className="ml-2 text-sm text-gray-500">
            {step === 1 ? "프로젝트 정보" : step === 2 ? "연락처 정보" : "추가 정보"}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-3xl border border-amber-200 shadow-sm p-8">
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-900 mb-5">📦 프로젝트 정보</h2>

              {/* 카테고리 선택 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">등록 카테고리 *</label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, category: cat.value }))}
                      className={`text-left p-3 rounded-xl border-2 transition-all ${
                        form.category === cat.value
                          ? "border-amber-500 bg-amber-50"
                          : "border-gray-100 hover:border-amber-200"
                      }`}
                    >
                      <div className="text-sm font-semibold text-gray-900">{cat.label}</div>
                      <div className="text-xs text-gray-500">{cat.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">프로젝트명 *</label>
                  <input name="projectName" value={form.projectName} onChange={handleChange} required
                    placeholder="예: AlphaDAO" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">토큰 심볼</label>
                  <input name="projectSymbol" value={form.projectSymbol} onChange={handleChange}
                    placeholder="예: ADAO" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  <Globe className="w-3.5 h-3.5 inline mr-1" />웹사이트
                </label>
                <input name="projectWebsite" value={form.projectWebsite} onChange={handleChange}
                  placeholder="https://yourproject.io" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">프로젝트 설명 *</label>
                <textarea name="projectDescription" value={form.projectDescription} onChange={handleChange} required rows={4}
                  placeholder="프로젝트의 핵심 가치와 투자 전략을 설명해 주세요..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 resize-none" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  <Upload className="w-3.5 h-3.5 inline mr-1" />로고 URL
                </label>
                <input name="logoUrl" value={form.logoUrl} onChange={handleChange}
                  placeholder="https://cdn.yourproject.io/logo.png" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400" />
              </div>

              <button type="button" onClick={() => { if (!form.projectName || !form.projectDescription || !form.category) { toast.error("필수 항목을 입력해 주세요"); return; } setStep(2); }}
                className="w-full py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-400 transition-colors">
                다음 단계 →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-900 mb-5">📬 연락처 정보</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">담당자 이름 *</label>
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
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors">← 이전</button>
                <button type="button" onClick={() => { if (!form.contactName || !form.contactEmail) { toast.error("필수 항목을 입력해 주세요"); return; } setStep(3); }}
                  className="flex-1 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-400 transition-colors">다음 단계 →</button>
              </div>
            </div>
          )}

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

              {/* 요약 */}
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                <h3 className="text-sm font-bold text-amber-800 mb-2">신청 요약</h3>
                <div className="space-y-1 text-xs text-amber-700">
                  <div>프로젝트: <span className="font-semibold">{form.projectName}</span></div>
                  <div>카테고리: <span className="font-semibold">{CATEGORIES.find(c => c.value === form.category)?.label}</span></div>
                  <div>담당자: <span className="font-semibold">{form.contactName} ({form.contactEmail})</span></div>
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
