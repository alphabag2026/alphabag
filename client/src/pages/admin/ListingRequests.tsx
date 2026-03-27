import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { FileText, Check, X, Eye, Clock, ChevronDown } from "lucide-react";
import { toast } from "sonner";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "대기중", color: "bg-yellow-100 text-yellow-700" },
  reviewing: { label: "검토중", color: "bg-blue-100 text-blue-700" },
  approved: { label: "승인", color: "bg-green-100 text-green-700" },
  rejected: { label: "거절", color: "bg-red-100 text-red-700" },
};

const CATEGORY_LABELS: Record<string, string> = {
  golden: "🥇 Golden", self: "🔵 Self", leader: "👑 Leader",
  meme: "🚀 Meme", influencer: "⭐ Influencer", cbag: "💎 C-BAG",
  airdrop: "🎁 Airdrop", partner: "🤝 Partner",
};

export default function AdminListingRequests() {
  const { data: requests = [], refetch } = trpc.listing.list.useQuery();
  const updateStatus = trpc.listing.updateStatus.useMutation({
    onSuccess: () => { toast.success("상태가 업데이트되었습니다"); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filtered = filterStatus === "all" ? requests as any[] : (requests as any[]).filter(r => r.status === filterStatus);

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900">리스팅 신청 관리</h1>
            <p className="text-gray-500 text-sm mt-1">프로젝트 리스팅 신청 목록을 검토하고 승인/거절합니다</p>
          </div>
          <div className="flex gap-2">
            {["all", "pending", "reviewing", "approved", "rejected"].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-all ${filterStatus === s ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                {s === "all" ? "전체" : STATUS_LABELS[s]?.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">프로젝트</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">카테고리</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">담당자</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">상태</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">신청일</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">액션</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">신청 내역이 없습니다</td></tr>
              ) : filtered.map((req: any) => (
                <>
                  <tr key={req.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {req.logoUrl && <img src={req.logoUrl} alt={req.projectName} className="w-8 h-8 rounded-lg object-contain" />}
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">{req.projectName}</div>
                          {req.projectSymbol && <div className="text-xs text-gray-400">{req.projectSymbol}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{CATEGORY_LABELS[req.category] || req.category}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">{req.contactName}</div>
                      <div className="text-xs text-gray-400">{req.contactEmail}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_LABELS[req.status]?.color || "bg-gray-100 text-gray-500"}`}>
                        {STATUS_LABELS[req.status]?.label || req.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {req.createdAt ? new Date(Number(req.createdAt)).toLocaleDateString("ko-KR") : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setSelectedId(selectedId === req.id ? null : req.id)}
                          className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => updateStatus.mutate({ id: req.id, status: "approved" })}
                          className="p-1.5 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => updateStatus.mutate({ id: req.id, status: "reviewing" })}
                          className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                          <Clock className="w-4 h-4" />
                        </button>
                        <button onClick={() => updateStatus.mutate({ id: req.id, status: "rejected" })}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {selectedId === req.id && (
                    <tr key={`detail-${req.id}`} className="bg-amber-50">
                      <td colSpan={6} className="px-6 py-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="font-semibold text-gray-700 mb-1">프로젝트 설명</p>
                            <p className="text-gray-600">{req.projectDescription || "-"}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-700 mb-1">추가 정보</p>
                            <p className="text-gray-600">{req.additionalInfo || "-"}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-700 mb-1">링크</p>
                            <div className="space-y-1 text-xs">
                              {req.projectWebsite && <a href={req.projectWebsite} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline block">{req.projectWebsite}</a>}
                              {req.telegramUrl && <a href={req.telegramUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline block">{req.telegramUrl}</a>}
                              {req.twitterUrl && <a href={req.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline block">{req.twitterUrl}</a>}
                            </div>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-700 mb-1">연락처</p>
                            <p className="text-xs text-gray-600">텔레그램: {req.contactTelegram || "-"}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
