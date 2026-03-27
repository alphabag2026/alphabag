import { trpc } from "@/lib/trpc";
import { MainNav } from "@/components/MainNav";
import { Handshake, ExternalLink, Globe, Shield, Award, TrendingUp } from "lucide-react";

export default function PartnersPage() {
  const { data: partners = [], isLoading } = trpc.public.partners.useQuery();

  const categoryLabel: Record<string, string> = {
    exchange: "거래소",
    defi: "DeFi",
    nft: "NFT",
    infrastructure: "인프라",
    media: "미디어",
    other: "기타",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50">
      <MainNav />

      {/* 히어로 */}
      <div className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-20 w-72 h-72 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-0 right-10 w-96 h-96 rounded-full bg-violet-300/20 blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 py-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Handshake className="w-6 h-6 text-violet-200" />
            </div>
            <span className="text-violet-200 text-sm font-semibold tracking-widest uppercase">Key Partners</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            🤝 핵심 파트너
            <span className="block text-violet-200 text-2xl font-medium mt-1">AlphaBag Strategic Partners</span>
          </h1>
          <p className="text-white/80 text-lg max-w-2xl mb-8">
            AlphaBag와 함께하는 글로벌 파트너사들을 소개합니다.
            신뢰할 수 있는 파트너십을 통해 더 안전하고 수익성 높은 투자 환경을 제공합니다.
          </p>
          <div className="flex flex-wrap gap-4">
            {[
              { icon: <Shield className="w-4 h-4" />, label: "검증된 파트너" },
              { icon: <Globe className="w-4 h-4" />, label: "글로벌 네트워크" },
              { icon: <Award className="w-4 h-4" />, label: "공식 제휴" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full text-sm">
                {item.icon}
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 파트너 목록 */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : partners.length === 0 ? (
          <div className="text-center py-24">
            <Handshake className="w-16 h-16 text-violet-200 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">파트너 정보를 준비 중입니다</p>
            <p className="text-gray-300 text-sm mt-2">Coming Soon</p>
          </div>
        ) : (
          <>
            {/* 카테고리별 그룹 */}
            {Object.entries(
              (partners as any[]).reduce((acc: Record<string, any[]>, p) => {
                const cat = p.category || "other";
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(p);
                return acc;
              }, {})
            ).map(([category, items]) => (
              <div key={category} className="mb-10">
                <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-violet-500" />
                  {categoryLabel[category] || category}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {items.map((partner: any) => (
                    <div
                      key={partner.id}
                      className="bg-white rounded-2xl border border-violet-100 shadow-sm hover:shadow-md hover:border-violet-300 transition-all p-5 flex flex-col items-center text-center group"
                    >
                      {partner.logoUrl ? (
                        <img src={partner.logoUrl} alt={partner.name} className="w-16 h-16 object-contain mb-3 rounded-xl" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center mb-3">
                          <span className="text-2xl font-black text-violet-400">{partner.name[0]}</span>
                        </div>
                      )}
                      <h3 className="font-bold text-gray-900 text-sm mb-1">{partner.name}</h3>
                      {partner.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{partner.description}</p>
                      )}
                      {partner.website && (
                        <a
                          href={partner.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 font-medium"
                        >
                          <Globe className="w-3 h-3" />
                          웹사이트
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

        {/* 파트너십 신청 CTA */}
        <div className="mt-12 bg-gradient-to-r from-violet-600 to-purple-600 rounded-3xl p-8 text-white text-center">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 text-violet-200" />
          <h3 className="text-2xl font-black mb-2">파트너십 제안</h3>
          <p className="text-white/80 mb-6">AlphaBag와 함께 성장하고 싶은 프로젝트라면 파트너십을 신청해 주세요.</p>
          <a
            href="/listing"
            className="inline-flex items-center gap-2 bg-white text-violet-700 font-bold px-6 py-3 rounded-xl hover:bg-violet-50 transition-colors"
          >
            파트너십 신청하기
          </a>
        </div>
      </div>
    </div>
  );
}
