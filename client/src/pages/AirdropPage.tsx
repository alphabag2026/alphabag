import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { MainNav } from "@/components/MainNav";
import { useAuth } from "@/_core/hooks/useAuth";
import { Gift, ExternalLink, Clock, Users, Zap, Star, History, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";

// 카운트다운 훅
function useCountdown(endDate: Date | null | undefined) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    if (!endDate) return;
    const target = new Date(endDate).getTime();
    const tick = () => {
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
        expired: false,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endDate]);

  return timeLeft;
}

function AirdropCard({ airdrop, t }: { airdrop: any; t: any }) {
  const countdown = useCountdown(airdrop.endDate);
  const participationRate = airdrop.maxParticipants
    ? Math.min(100, ((airdrop.currentParticipants || 0) / airdrop.maxParticipants) * 100)
    : null;

  const statusColor: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    upcoming: "bg-blue-100 text-blue-700",
    ended: "bg-secondary text-muted-foreground",
    completed: "bg-secondary text-muted-foreground",
  };

  return (
    <div className="bg-card rounded-2xl border border-emerald-200 shadow-sm hover:shadow-lg hover:border-emerald-300 transition-all overflow-hidden group">
      {airdrop.imageUrl && (
        <div className="h-40 overflow-hidden bg-gradient-to-br from-emerald-100 to-teal-100">
          <img src={airdrop.imageUrl} alt={airdrop.projectName || airdrop.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-gray-900">{airdrop.projectName || airdrop.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{airdrop.tokenSymbol || ""}</p>
          </div>
          <div className="flex flex-col gap-1 items-end">
            {airdrop.isHot && <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-xs font-bold rounded-full">HOT</span>}
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColor[airdrop.status] || statusColor.active}`}>
              {airdrop.status === "active" ? t("airdrop.statusActive") : airdrop.status === "upcoming" ? t("airdrop.statusUpcoming") : t("airdrop.statusEnded")}
            </span>
          </div>
        </div>

        {airdrop.description && (
          <p className="text-xs text-gray-600 mb-3 line-clamp-2">{airdrop.description}</p>
        )}

        {/* 참여 현황 바 */}
        {participationRate !== null && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {airdrop.currentParticipants || 0} / {airdrop.maxParticipants}</span>
              <span>{participationRate.toFixed(0)}% filled</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all"
                style={{ width: `${participationRate}%` }}
              />
            </div>
          </div>
        )}

        {/* 카운트다운 타이머 */}
        {airdrop.endDate && airdrop.status === "active" && !countdown.expired && (
          <div className="mb-3 p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
            <p className="text-xs text-emerald-600 font-medium mb-1.5 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Ends in
            </p>
            <div className="flex gap-2">
              {[
                { v: countdown.days, l: "D" },
                { v: countdown.hours, l: "H" },
                { v: countdown.minutes, l: "M" },
                { v: countdown.seconds, l: "S" },
              ].map(({ v, l }) => (
                <div key={l} className="flex-1 text-center bg-white rounded-lg py-1 border border-emerald-100">
                  <div className="text-sm font-bold text-emerald-700">{String(v).padStart(2, "0")}</div>
                  <div className="text-[9px] text-emerald-400">{l}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span>{t("airdrop.alphabagVerified")}</span>
          </div>
          {airdrop.participateUrl ? (
            <a
              href={airdrop.participateUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium"
            >
              {t("airdrop.participate")} <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <span className="text-gray-400">{t("airdrop.details")}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AirdropPage() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const { data: airdrops = [], isLoading } = trpc.public.airdrops.useQuery();
  const { data: history = [], isLoading: historyLoading } = trpc.user.airdropHistory.useQuery(undefined, {
    enabled: isAuthenticated && activeTab === "history",
  });

  const statusBadge: Record<string, { label: string; color: string }> = {
    pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700" },
    confirmed: { label: "Confirmed", color: "bg-green-100 text-green-700" },
    rejected: { label: "Rejected", color: "bg-red-100 text-red-700" },
    distributed: { label: "Distributed", color: "bg-blue-100 text-blue-700" },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <MainNav />

      {/* Hero */}
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
            <span className="block text-emerald-200 text-2xl font-medium mt-1">{t("airdrop.subtitle")}</span>
          </h1>
          <p className="text-white/80 text-lg max-w-2xl mb-8">
            {t("airdrop.heroDesc")}
          </p>
          <div className="flex flex-wrap gap-4">
            {[
              { icon: <Zap className="w-4 h-4" />, label: t("airdrop.verified") },
              { icon: <Users className="w-4 h-4" />, label: t("airdrop.community") },
              { icon: <Clock className="w-4 h-4" />, label: t("airdrop.realtime") },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full text-sm">
                {item.icon}
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <div className="flex gap-1 p-1 bg-white rounded-xl border border-emerald-100 shadow-sm w-fit">
          <button
            onClick={() => setActiveTab("active")}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "active" ? "bg-emerald-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Gift className="w-4 h-4" /> Active Airdrops
          </button>
          {isAuthenticated && (
            <button
              onClick={() => setActiveTab("history")}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "history" ? "bg-emerald-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <History className="w-4 h-4" /> My History
            </button>
          )}
        </div>
      </div>

      {/* Active Airdrops */}
      {activeTab === "active" && (
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">{t("airdrop.activeTitle")}</h2>
            <span className="text-sm text-gray-500">{t("airdrop.total")} {airdrops.length}</span>
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
              <p className="text-gray-400 text-lg">{t("airdrop.empty")}</p>
              <p className="text-gray-300 text-sm mt-2">{t("airdrop.emptyDesc")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(airdrops as any[]).map((airdrop) => (
                <AirdropCard key={airdrop.id} airdrop={airdrop} t={t} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* My History */}
      {activeTab === "history" && (
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">My Airdrop History</h2>
          {historyLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (history as any[]).length === 0 ? (
            <div className="text-center py-24">
              <History className="w-16 h-16 text-emerald-200 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No airdrop participation history yet</p>
              <p className="text-gray-300 text-sm mt-2">Join an airdrop to see your history here</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-emerald-100 overflow-hidden shadow-sm">
              <div className="divide-y divide-gray-50">
                {(history as any[]).map((item) => {
                  const badge = statusBadge[item.status] || { label: item.status, color: "bg-gray-100 text-gray-600" };
                  return (
                    <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.airdropName} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <Gift className="w-5 h-5 text-emerald-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{item.projectName || item.airdropName}</p>
                        <p className="text-xs text-gray-500">{item.tokenSymbol} · {new Date(item.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-emerald-600">{item.amount ? `${Number(item.amount).toLocaleString()} ${item.tokenSymbol}` : "-"}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${badge.color}`}>{badge.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
