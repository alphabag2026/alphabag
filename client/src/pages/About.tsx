import { Link } from "wouter";
import { useState } from "react";
import {
  Shield, TrendingUp, Users, Star, Zap, Globe, Award, ChevronDown, ChevronUp,
  CheckCircle, ArrowRight, Layers, Lock, BarChart2, MessageSquare, Vote, Crown
} from "lucide-react";

const isDark = true; // 다크 테마 고정

const features = [
  {
    icon: <Layers className="w-6 h-6" />,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    title: "6가지 투자 컬렉션",
    desc: "Golden · Self · Node · Leader · Meme · Influencer 6개 카테고리로 다양한 투자 전략을 한 플랫폼에서 탐색하고 비교할 수 있습니다.",
  },
  {
    icon: <TrendingUp className="w-6 h-6" />,
    color: "text-green-400",
    bg: "bg-green-500/10 border-green-500/20",
    title: "실시간 수익률 추적",
    desc: "Daily Return, 추천금액, 전략 태그를 실시간으로 확인하고 포트폴리오 성과를 한눈에 파악할 수 있습니다.",
  },
  {
    icon: <Crown className="w-6 h-6" />,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/20",
    title: "골든 컬렉션 상장 시스템",
    desc: "누구나 PPT/이미지를 업로드하면 AI가 자동으로 플랜을 분석·등록합니다. 노드 보유자 투표로 상장이 결정되며, 상장비용은 투표 노드에 분배됩니다.",
  },
  {
    icon: <Vote className="w-6 h-6" />,
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
    title: "노드 투표 거버넌스",
    desc: "알파백 노드 보유자만 참여하는 탈중앙화 투표 시스템으로 플랜의 품질과 신뢰성을 커뮤니티가 직접 검증합니다.",
  },
  {
    icon: <Globe className="w-6 h-6" />,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    title: "SNS 인플루언서 피드",
    desc: "CZ, Vitalik, Andre Cronje 등 19명의 업계 유명 인플루언서 최신 소식을 크립토/DeFi/NFT/Trading 카테고리로 필터링하여 확인합니다.",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/20",
    title: "AI 자동 플랜 등록",
    desc: "텍스트 프롬프트, 이미지, PPT/PDF를 업로드하면 LLM이 자동으로 플랜 구조를 파싱하여 미리보기 후 즉시 등록할 수 있습니다.",
  },
  {
    icon: <MessageSquare className="w-6 h-6" />,
    color: "text-pink-400",
    bg: "bg-pink-500/10 border-pink-500/20",
    title: "텔레그램 봇 연동",
    desc: "새 플랜 등록, SNS 인플루언서 소식, 투표 결과 등 주요 알림을 텔레그램 채널로 자동 발송합니다.",
  },
  {
    icon: <Lock className="w-6 h-6" />,
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
    title: "이중 인증 보안",
    desc: "이메일 + 텔레그램 동시 인증으로 플랜 신청자의 신원을 검증하여 플랫폼의 신뢰성을 유지합니다.",
  },
];

const collections = [
  { icon: "🏆", name: "Golden Collection", color: "text-amber-400 border-amber-500/30 bg-amber-500/5", desc: "BINANCE Alpha · Insurance(Hedge) · Daily Returns. 안정적인 일일 수익을 추구하는 검증된 전략 모음.", href: "/golden" },
  { icon: "⚡", name: "Self Collection", color: "text-blue-400 border-blue-500/30 bg-blue-500/5", desc: "Custom Strategy · Flexible · Self-managed. 개인화된 전략으로 자유롭게 운용하는 셀프 투자 플랜.", href: "/self" },
  { icon: "🔷", name: "Node Products", color: "text-indigo-400 border-indigo-500/30 bg-indigo-500/5", desc: "Node Infrastructure · Deposit · External DApp. 노드 운영 수익과 외부 DApp 연동 상품.", href: "/node" },
  { icon: "👑", name: "Leader Collection", color: "text-purple-400 border-purple-500/30 bg-purple-500/5", desc: "리더 추천 · 검증된 전략 · 커뮤니티 선택. 알파백 리더들이 직접 추천하는 검증된 투자 전략.", href: "/leader" },
  { icon: "🚀", name: "Meme Token", color: "text-pink-400 border-pink-500/30 bg-pink-500/5", desc: "밈토큰 · 고수익 · 커뮤니티 드리븐. 커뮤니티 기반 밈토큰 고수익 투자 기회.", href: "/meme" },
  { icon: "⭐", name: "Influencer", color: "text-yellow-400 border-yellow-500/30 bg-yellow-500/5", desc: "인플루언서 추천 · 트렌딩 · 소셜 검증. 업계 인플루언서가 검증한 트렌딩 투자 상품.", href: "/influencer" },
];

const faqs = [
  {
    q: "알파백(AlphaBag)이란 무엇인가요?",
    a: "알파백은 크립토 투자 플랜을 한 곳에서 탐색·비교·신청할 수 있는 통합 투자 플랫폼입니다. Golden, Self, Node, Leader, Meme, Influencer 6가지 컬렉션으로 다양한 전략을 제공하며, 커뮤니티 기반 거버넌스로 플랜 품질을 유지합니다.",
  },
  {
    q: "골든 컬렉션 상장 신청은 어떻게 하나요?",
    a: "상단 '상장 신청하기' 버튼 또는 /submit-plan 페이지에서 PPT, 이미지, PDF를 업로드하거나 텍스트로 플랜 정보를 입력하면 AI가 자동으로 분석합니다. 이메일 + 텔레그램 인증 후 상장비용 500 USDT를 납부하면 노드 투표가 시작됩니다.",
  },
  {
    q: "노드 투표란 무엇인가요?",
    a: "알파백 노드를 보유한 사용자만 참여할 수 있는 플랜 상장 투표입니다. 7일간 진행되며, 투표 참여 노드의 60% 이상 찬성 시 골든 컬렉션에 정식 상장됩니다. 투표에 참여한 노드는 상장비용의 60%를 균등 분배받습니다.",
  },
  {
    q: "상장비용은 어떻게 분배되나요?",
    a: "신청자가 납부한 상장비용 500 USDT 중 60%는 투표에 참여한 노드 보유자들에게 균등 분배되고, 40%는 알파백 플랫폼 운영비로 사용됩니다.",
  },
  {
    q: "SNS 인플루언서 피드는 어떻게 업데이트되나요?",
    a: "X(트위터) API v2를 통해 1시간마다 자동으로 인플루언서 최신 트윗을 수집합니다. 현재 CZ, Vitalik, Elon Musk, Andre Cronje, Beeple 등 19명의 인플루언서 소식을 제공합니다.",
  },
  {
    q: "AI 플랜 자동 등록은 어떻게 작동하나요?",
    a: "백오피스의 'AI 플랜 등록' 메뉴에서 텍스트 프롬프트를 입력하거나 이미지/PPT/PDF를 업로드하면 LLM이 플랜명, 전략 태그, Ratio, Yield, Daily Return, 추천금액 등을 자동으로 추출합니다. 미리보기 확인 후 즉시 등록할 수 있습니다.",
  },
];

export default function About() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* 네비게이션 */}
      <nav className="sticky top-0 z-50 bg-[#0a0a0f]/90 backdrop-blur-md border-b border-white/5 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/">
            <span className="flex items-center gap-2 cursor-pointer">
              <span className="text-xl font-black text-amber-400">α</span>
              <span className="text-sm font-bold text-white">AlphaBag</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/submit-plan">
              <button className="text-xs px-4 py-1.5 rounded-lg bg-amber-500 text-black font-bold hover:bg-amber-400 transition-all">
                상장 신청하기
              </button>
            </Link>
            <Link href="/">
              <button className="text-xs text-gray-400 hover:text-white transition-colors">
                홈으로
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* 히어로 섹션 */}
      <section className="relative overflow-hidden px-4 py-20 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-900/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium mb-6">
            <Star className="w-3 h-3" /> 크립토 투자 통합 플랫폼
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
            <span className="text-amber-400">AlphaBag</span>으로<br />
            스마트한 크립토 투자를
          </h1>
          <p className="text-gray-400 text-base md:text-lg mb-8 leading-relaxed">
            6가지 투자 컬렉션, AI 자동 플랜 등록, 노드 거버넌스 투표, 업계 인플루언서 소식까지<br />
            크립토 투자에 필요한 모든 것을 한 플랫폼에서.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/">
              <button className="px-6 py-2.5 rounded-xl bg-amber-500 text-black font-bold hover:bg-amber-400 transition-all text-sm">
                플랫폼 탐색하기 →
              </button>
            </Link>
            <Link href="/submit-plan">
              <button className="px-6 py-2.5 rounded-xl border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-all text-sm">
                골든 컬렉션 신청
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* 핵심 지표 */}
      <section className="px-4 py-10 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: "6", label: "투자 컬렉션", icon: "🏆" },
            { value: "19명", label: "SNS 인플루언서", icon: "📱" },
            { value: "500 USDT", label: "골든 상장비용", icon: "💰" },
            { value: "60%", label: "노드 수익 분배", icon: "🗳️" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-2xl font-black text-amber-400">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 기능 소개 */}
      <section className="px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-black mb-2">플랫폼 주요 기능</h2>
            <p className="text-gray-500 text-sm">알파백이 제공하는 8가지 핵심 기능</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((f, i) => (
              <div key={i} className={`rounded-2xl border p-5 ${f.bg} hover:scale-[1.01] transition-transform`}>
                <div className={`flex items-center gap-3 mb-3 ${f.color}`}>
                  {f.icon}
                  <h3 className="font-bold text-sm text-white">{f.title}</h3>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 컬렉션 소개 */}
      <section className="px-4 py-16 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-black mb-2">6가지 투자 컬렉션</h2>
            <p className="text-gray-500 text-sm">전략별로 분류된 다양한 투자 상품을 탐색하세요</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {collections.map((c, i) => (
              <Link key={i} href={c.href}>
                <div className={`rounded-2xl border p-5 cursor-pointer hover:scale-[1.02] transition-transform ${c.color}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{c.icon}</span>
                    <h3 className="font-bold text-sm text-white">{c.name}</h3>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{c.desc}</p>
                  <div className="flex items-center gap-1 mt-3 text-xs opacity-60">
                    <span>자세히 보기</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 골든 컬렉션 상장 프로세스 */}
      <section className="px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-black mb-2">골든 컬렉션 상장 프로세스</h2>
            <p className="text-gray-500 text-sm">누구나 신청 가능 · 노드 투표로 검증 · 투명한 수익 분배</p>
          </div>
          <div className="relative">
            {/* 연결선 */}
            <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-amber-500/50 via-amber-500/20 to-transparent hidden md:block" />
            <div className="space-y-4">
              {[
                { step: "01", icon: "📄", title: "플랜 자료 업로드", desc: "PPT, 이미지, PDF 또는 텍스트로 투자 플랜 정보를 제출합니다. AI가 자동으로 플랜 구조를 파싱합니다.", color: "text-amber-400" },
                { step: "02", icon: "✅", title: "이메일 + 텔레그램 인증", desc: "이메일과 텔레그램 동시 인증으로 신청자 신원을 확인합니다.", color: "text-green-400" },
                { step: "03", icon: "💰", title: "상장비용 납부 (500 USDT)", desc: "BSC/TRC20/ERC20 네트워크로 상장비용을 납부합니다. 온체인 입금이 자동으로 확인됩니다.", color: "text-blue-400" },
                { step: "04", icon: "🗳️", title: "노드 투표 (7일)", desc: "알파백 노드 보유자들이 7일간 투표합니다. 60% 이상 찬성 시 상장이 확정됩니다.", color: "text-purple-400" },
                { step: "05", icon: "🏆", title: "골든 컬렉션 상장", desc: "투표 통과 후 골든 컬렉션에 정식 등재됩니다. 투표 노드 60% + 알파백 40% 수익 분배가 실행됩니다.", color: "text-yellow-400" },
              ].map((s, i) => (
                <div key={i} className="flex items-start gap-4 relative">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg flex-shrink-0 bg-white/5 border border-white/10 z-10 ${s.color}`}>
                    {s.icon}
                  </div>
                  <div className="flex-1 bg-white/[0.03] rounded-xl border border-white/5 p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold ${s.color}`}>STEP {s.step}</span>
                      <h3 className="text-sm font-bold text-white">{s.title}</h3>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="text-center mt-8">
            <Link href="/submit-plan">
              <button className="px-8 py-3 rounded-xl bg-amber-500 text-black font-black hover:bg-amber-400 transition-all text-sm">
                🏆 지금 상장 신청하기
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-16 bg-white/[0.02] border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-black mb-2">자주 묻는 질문</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-white/5 bg-white/[0.03] overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.03] transition-colors"
                >
                  <span className="text-sm font-medium text-white pr-4">{faq.q}</span>
                  {openFaq === i
                    ? <ChevronUp className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  }
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-xs text-gray-400 leading-relaxed border-t border-white/5 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="px-4 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="text-4xl mb-4">🚀</div>
          <h2 className="text-2xl md:text-3xl font-black mb-3">지금 바로 시작하세요</h2>
          <p className="text-gray-400 text-sm mb-8">알파백과 함께 스마트한 크립토 투자를 경험하세요</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/">
              <button className="px-8 py-3 rounded-xl bg-amber-500 text-black font-black hover:bg-amber-400 transition-all text-sm">
                플랫폼 시작하기 →
              </button>
            </Link>
            <Link href="/submit-plan">
              <button className="px-8 py-3 rounded-xl border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-all text-sm">
                골든 컬렉션 신청
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="border-t border-white/5 px-4 py-8 text-center">
        <div className="text-xs text-gray-600">
          <span className="text-amber-400 font-bold">AlphaBag</span> · 크립토 투자 통합 플랫폼 · 투자는 본인 책임 하에 진행하세요
        </div>
      </footer>
    </div>
  );
}
