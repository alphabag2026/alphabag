import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Plus, Eye, EyeOff, Trash2, Globe, X, Save } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = ["exchange", "defi", "nft", "infrastructure", "media", "other"];
const CATEGORY_LABELS: Record<string, string> = {
  exchange: "거래소", defi: "DeFi", nft: "NFT",
  infrastructure: "인프라", media: "미디어", other: "기타",
};

export default function AdminPartners() {
  const { data: partners = [], refetch } = trpc.partners.list.useQuery();
  const createPartner = trpc.partners.create.useMutation({
    onSuccess: () => { toast.success("파트너가 추가되었습니다"); refetch(); setShowForm(false); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const toggleHidden = trpc.partners.toggleHidden.useMutation({
    onSuccess: () => { refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const deletePartner = trpc.partners.delete.useMutation({
    onSuccess: () => { toast.success("삭제되었습니다"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", logoUrl: "", website: "", description: "", category: "other", sortOrder: 0 });

  const resetForm = () => setForm({ name: "", logoUrl: "", website: "", description: "", category: "other", sortOrder: 0 });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { toast.error("파트너명을 입력해 주세요"); return; }
    createPartner.mutate(form);
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900">파트너 관리</h1>
            <p className="text-gray-500 text-sm mt-1">핵심 파트너를 추가하고 공개/숨김 여부를 관리합니다</p>
          </div>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-400 transition-colors text-sm">
            <Plus className="w-4 h-4" /> 파트너 추가
          </button>
        </div>

        {/* 추가 폼 */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-amber-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">새 파트너 추가</h2>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">파트너명 *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required
                  placeholder="Binance" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">카테고리</label>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400">
                  {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">로고 URL</label>
                <input value={form.logoUrl} onChange={e => setForm(p => ({ ...p, logoUrl: e.target.value }))}
                  placeholder="https://cdn.example.com/logo.png" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">웹사이트</label>
                <input value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))}
                  placeholder="https://binance.com" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">설명</label>
                <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="파트너에 대한 간단한 설명" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">정렬 순서</label>
                <input type="number" value={form.sortOrder} onChange={e => setForm(p => ({ ...p, sortOrder: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400" />
              </div>
              <div className="flex items-end">
                <button type="submit" disabled={createPartner.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-400 transition-colors text-sm disabled:opacity-60">
                  <Save className="w-4 h-4" /> {createPartner.isPending ? "저장 중..." : "저장"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 파트너 목록 */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">파트너</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">카테고리</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">웹사이트</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">상태</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">액션</th>
              </tr>
            </thead>
            <tbody>
              {(partners as any[]).length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">파트너가 없습니다</td></tr>
              ) : (partners as any[]).map((partner) => (
                <tr key={partner.id} className={`border-b border-gray-50 transition-colors ${partner.isHidden ? "opacity-50 bg-gray-50" : "hover:bg-gray-50"}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {partner.logoUrl ? (
                        <img src={partner.logoUrl} alt={partner.name} className="w-8 h-8 rounded-lg object-contain" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-sm">
                          {partner.name[0]}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{partner.name}</div>
                        {partner.description && <div className="text-xs text-gray-400 max-w-xs truncate">{partner.description}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{CATEGORY_LABELS[partner.category] || partner.category}</td>
                  <td className="px-4 py-3">
                    {partner.website ? (
                      <a href={partner.website} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-blue-500 hover:underline">
                        <Globe className="w-3 h-3" /> {partner.website.replace(/^https?:\/\//, "").slice(0, 30)}
                      </a>
                    ) : <span className="text-xs text-gray-400">-</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${partner.isHidden ? "bg-gray-100 text-gray-500" : "bg-green-100 text-green-700"}`}>
                      {partner.isHidden ? "숨김" : "공개"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => toggleHidden.mutate({ id: partner.id, isHidden: !partner.isHidden })}
                        title={partner.isHidden ? "공개" : "숨기기"}
                        className={`p-1.5 rounded-lg transition-colors ${partner.isHidden ? "text-green-500 hover:bg-green-50" : "text-gray-400 hover:text-orange-500 hover:bg-orange-50"}`}>
                        {partner.isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => { if (confirm("삭제하시겠습니까?")) deletePartner.mutate({ id: partner.id }); }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
