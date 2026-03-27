import { trpc } from "@/lib/trpc";
import { MainNav } from "@/components/MainNav";
import { Gift, ExternalLink, Clock, Users, Zap, Star } from "lucide-react";

export default function AirdropPage() {
  const { data: airdrops = [], isLoading } = trpc.public.airdrops.useQuery();

  const statusColor: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    upcoming: "bg-blue-100 text-blue-700",
    ended: "bg-gray-100 text-gray-500",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <MainNav />

      {/* 히어로 */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 right-20 w-72 h-72 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-0 left-10 w-96 h-96 rounded-full bg-emerald-300/20 blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 py-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Gift className="w-6 h-6 text-emerald-200" />
            </div>
            <span className="text-emerald-200 text-sm font-semibold tracking-widest uppercase">Airdrop Center</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            🎁 Airdrop
            <span className="block text-emerald-200 text-2xl font-medium mt-1">Free Token Distribution Events</span>
          </h1>
          <p className="text-white/80 text-lg max-w-2xl mb-8">
            AlphaBag 파트너 프로젝트의 에어드랍 이벤트에 참여하고 무료 토큰을 받으세요.
            검증된 프로젝트만 엄선하여 제공합니다.
          </p>
          <div className="flex flex-wrap gap-4">
            {[
              { icon: <Zap className="w-4 h-4" />, label: "검증된 프로젝트" },
              { icon: <Users className="w-4 h-4" />, label: "커뮤니티 참여" },
              { icon: <Clock className="w-4 h-4" />, label: "실시간 업데이트" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full text-sm">
                {item.icon}
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 에어드랍 목록 */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">진행 중인 에어드랍</h2>
          <span className="text-sm text-gray-500">총 {airdrops.length}개</span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-56 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : airdrops.length === 0 ? (
          <div className="text-center py-24">
            <Gift className="w-16 h-16 text-emerald-200 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">현재 진행 중인 에어드랍이 없습니다</p>
            <p className="text-gray-300 text-sm mt-2">곧 새로운 에어드랍이 추가될 예정입니다</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(airdrops as any[]).map((airdrop) => (
              <div key={airdrop.id} className="bg-white rounded-2xl border border-emerald-100 shadow-sm hover:shadow-lg hover:border-emerald-300 transition-all overflow-hidden group">
                {airdrop.imageUrl && (
                  <div className="h-40 overflow-hidden bg-gradient-to-br from-emerald-100 to-teal-100">
                    <img src={airdrop.imageUrl} alt={airdrop.projectName || airdrop.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900">{airdrop.projectName || airdrop.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{airdrop.tokenSymbol || ""}</p>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      {airdrop.isHot && <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-xs font-bold rounded-full">HOT</span>}
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColor[airdrop.status] || statusColor.active}`}>
                        {airdrop.status === "active" ? "진행중" : airdrop.status === "upcoming" ? "예정" : "종료"}
                      </span>
                    </div>
                  </div>
                  {airdrop.description && (
                    <p className="text-xs text-gray-600 mb-3 line-clamp-2">{airdrop.description}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span>AlphaBag 검증</span>
                    </div>
                    {airdrop.participateUrl ? (
                      <a
                        href={airdrop.participateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        참여하기 <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-gray-400">상세 정보 확인</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
