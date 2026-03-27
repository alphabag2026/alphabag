import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { FileText, Check, X, Eye, Clock, Copy, Mail, MessageSquare, Bell } from "lucide-react";
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
    onSuccess: () => {
      toast.success("상태가 업데이트되었습니다. Manus 알림으로 신청자 이메일이 전달됩니다.");
      refetch();
      setNoteModal(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  // 상태 변경 + 메모 모달
  const [noteModal, setNoteModal] = useState<{
    id: number;
    status: "pending" | "reviewing" | "approved" | "rejected";
    projectName: string;
    contactEmail: string;
  } | null>(null);
  const [adminNote, setAdminNote] = useState("");

  const filtered = filterStatus === "all" ? requests as any[] : (requests as any[]).filter(r => r.status === filterStatus);

  const openNoteModal = (req: any, status: "pending" | "reviewing" | "approved" | "rejected") => {
    setNoteModal({ id: req.id, status, projectName: req.projectName, contactEmail: req.contactEmail });
    setAdminNote(req.adminNote || "");
  };

  const confirmStatusChange = () => {
    if (!noteModal) return;
    updateStatus.mutate({ id: noteModal.id, status: noteModal.status, adminNote });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} 복사됨`));
  };

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

        {/* 알림 안내 배너 */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-5 flex items-start gap-3">
          <Bell className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-700">
            상태 변경 시 <strong>Manus 알림</strong>으로 신청자 이메일 주소가 자동 전달됩니다.
            승인/거절 후 신청자에게 직접 이메일로 결과를 안내해 주세요.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">프로젝트</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">카테고리</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">담당자 / 이메일</th>
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
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-xs text-gray-400">{req.contactEmail}</span>
                        <button
                          onClick={() => copyToClipboard(req.contactEmail, "이메일")}
                          title="이메일 복사"
                          className="p-0.5 text-gray-300 hover:text-amber-500 transition-colors">
                          <Copy className="w-3 h-3" />
                        </button>
                        <a href={`mailto:${req.contactEmail}`} title="이메일 보내기"
                          className="p-0.5 text-gray-300 hover:text-blue-500 transition-colors">
                          <Mail className="w-3 h-3" />
                        </a>
                      </div>
                      {req.contactTelegram && (
                        <div className="text-xs text-gray-400 mt-0.5">{req.contactTelegram}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_LABELS[req.status]?.color || "bg-gray-100 text-gray-500"}`}>
                        {STATUS_LABELS[req.status]?.label || req.status}
                      </span>
                      {req.adminNote && (
                        <div className="text-xs text-gray-400 mt-1 max-w-[120px] truncate" title={req.adminNote}>
                          📝 {req.adminNote}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {req.createdAt ? new Date(Number(req.createdAt)).toLocaleDateString("ko-KR") : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setSelectedId(selectedId === req.id ? null : req.id)}
                          title="상세 보기"
                          className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => openNoteModal(req, "approved")}
                          title="승인"
                          className="p-1.5 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => openNoteModal(req, "reviewing")}
                          title="검토 중"
                          className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                          <Clock className="w-4 h-4" />
                        </button>
                        <button onClick={() => openNoteModal(req, "rejected")}
                          title="거절"
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
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-600">{req.contactEmail}</span>
                              <button onClick={() => copyToClipboard(req.contactEmail, "이메일")}
                                className="text-xs text-amber-600 hover:underline flex items-center gap-1">
                                <Copy className="w-3 h-3" /> 복사
                              </button>
                              <a href={`mailto:${req.contactEmail}`}
                                className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                <Mail className="w-3 h-3" /> 이메일 보내기
                              </a>
                            </div>
                            {req.contactTelegram && (
                              <p className="text-xs text-gray-600 mt-1">텔레그램: {req.contactTelegram}</p>
                            )}
                          </div>
                          {req.adminNote && (
                            <div className="col-span-2">
                              <p className="font-semibold text-gray-700 mb-1">관리자 메모</p>
                              <p className="text-gray-600 text-xs bg-white rounded-lg p-2 border border-amber-200">{req.adminNote}</p>
                            </div>
                          )}
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

      {/* 상태 변경 확인 모달 */}
      {noteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                noteModal.status === "approved" ? "bg-green-100" :
                noteModal.status === "rejected" ? "bg-red-100" :
                noteModal.status === "reviewing" ? "bg-blue-100" : "bg-gray-100"
              }`}>
                {noteModal.status === "approved" ? <Check className="w-5 h-5 text-green-600" /> :
                 noteModal.status === "rejected" ? <X className="w-5 h-5 text-red-600" /> :
                 noteModal.status === "reviewing" ? <Clock className="w-5 h-5 text-blue-600" /> :
                 <FileText className="w-5 h-5 text-gray-600" />}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">
                  {STATUS_LABELS[noteModal.status]?.label} 처리
                </h3>
                <p className="text-xs text-gray-500">{noteModal.projectName}</p>
              </div>
            </div>

            {/* 이메일 안내 */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-4 flex items-start gap-2">
              <Mail className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-amber-700 font-medium">신청자 이메일: {noteModal.contactEmail}</p>
                <p className="text-xs text-amber-600 mt-0.5">상태 변경 후 Manus 알림으로 이메일이 전달됩니다. 직접 연락해 주세요.</p>
              </div>
            </div>

            {/* 관리자 메모 */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                <MessageSquare className="w-3 h-3 inline mr-1" />
                관리자 메모 (선택사항)
              </label>
              <textarea
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                placeholder="신청자에게 전달할 내용이나 내부 메모를 입력하세요..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setNoteModal(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                취소
              </button>
              <button
                onClick={confirmStatusChange}
                disabled={updateStatus.isPending}
                className={`px-4 py-2 text-sm text-white font-semibold rounded-lg transition-colors disabled:opacity-60 ${
                  noteModal.status === "approved" ? "bg-green-500 hover:bg-green-400" :
                  noteModal.status === "rejected" ? "bg-red-500 hover:bg-red-400" :
                  "bg-amber-500 hover:bg-amber-400"
                }`}>
                {updateStatus.isPending ? "처리 중..." : `${STATUS_LABELS[noteModal.status]?.label} 확정`}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
