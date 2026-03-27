import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Plus, Eye, EyeOff, Trash2, Globe, X, Save, Upload, ImageIcon, Pencil, Check } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = ["exchange", "defi", "nft", "infrastructure", "media", "other"];
const CATEGORY_LABELS: Record<string, string> = {
  exchange: "거래소", defi: "DeFi", nft: "NFT",
  infrastructure: "인프라", media: "미디어", other: "기타",
};

type Partner = {
  id: number;
  name: string;
  logoUrl?: string | null;
  website?: string | null;
  description?: string | null;
  category?: string | null;
  sortOrder?: number | null;
  isHidden?: boolean | null;
};

type EditForm = {
  name: string;
  logoUrl: string;
  website: string;
  description: string;
  category: string;
  sortOrder: number;
};

export default function AdminPartners() {
  const { data: partners = [], refetch } = trpc.partners.list.useQuery();
  const createPartner = trpc.partners.create.useMutation({
    onSuccess: () => { toast.success("파트너가 추가되었습니다"); refetch(); setShowForm(false); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const updatePartner = trpc.partners.update.useMutation({
    onSuccess: () => { toast.success("수정되었습니다"); refetch(); setEditingId(null); },
    onError: (e) => toast.error(e.message),
  });
  const uploadMedia = trpc.media.upload.useMutation({
    onSuccess: (data: any) => {
      if (editingId !== null) {
        setEditForm(p => ({ ...p, logoUrl: data.url }));
      } else {
        setForm(p => ({ ...p, logoUrl: data.url }));
      }
      toast.success("로고 이미지가 업로드되었습니다");
    },
    onError: (e) => toast.error("업로드 실패: " + e.message),
  });
  const toggleHidden = trpc.partners.toggleHidden.useMutation({
    onSuccess: () => { refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const deletePartner = trpc.partners.delete.useMutation({
    onSuccess: () => { toast.success("삭제되었습니다"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  // 추가 폼 상태
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", logoUrl: "", website: "", description: "", category: "other", sortOrder: 0 });
  const resetForm = () => setForm({ name: "", logoUrl: "", website: "", description: "", category: "other", sortOrder: 0 });

  // 편집 상태
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ name: "", logoUrl: "", website: "", description: "", category: "other", sortOrder: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("이미지 파일만 업로드 가능합니다"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("파일 크기는 5MB 이하여야 합니다"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadMedia.mutate({ filename: file.name, base64, mimeType: file.type });
    };
    reader.readAsDataURL(file);
    // 파일 입력 초기화 (같은 파일 재선택 가능하도록)
    e.target.value = "";
  };

  const startEdit = (partner: Partner) => {
    setEditingId(partner.id);
    setEditForm({
      name: partner.name,
      logoUrl: partner.logoUrl || "",
      website: partner.website || "",
      description: partner.description || "",
      category: partner.category || "other",
      sortOrder: partner.sortOrder ?? 0,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = () => {
    if (!editForm.name) { toast.error("파트너명을 입력해 주세요"); return; }
    updatePartner.mutate({ id: editingId!, ...editForm });
  };

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
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">로고 이미지</label>
                <div className="flex gap-3 items-start">
                  <div className="w-16 h-16 rounded-xl border border-gray-200 flex items-center justify-center bg-gray-50 flex-shrink-0 overflow-hidden">
                    {form.logoUrl ? (
                      <img src={form.logoUrl} alt="preview" className="w-full h-full object-contain" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, false)} />
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadMedia.isPending}
                      className="flex items-center gap-2 px-3 py-2 border border-dashed border-amber-300 rounded-lg text-sm text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-60">
                      <Upload className="w-4 h-4" />
                      {uploadMedia.isPending ? "업로드 중..." : "이미지 파일 업로드"}
                    </button>
                    <input value={form.logoUrl} onChange={e => setForm(p => ({ ...p, logoUrl: e.target.value }))}
                      placeholder="또는 이미지 URL 직접 입력 (https://...)"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">웹사이트</label>
                <input value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))}
                  placeholder="https://binance.com" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">정렬 순서</label>
                <input type="number" value={form.sortOrder} onChange={e => setForm(p => ({ ...p, sortOrder: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">설명</label>
                <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="파트너에 대한 간단한 설명" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400" />
              </div>
              <div className="col-span-2 flex justify-end">
                <button type="submit" disabled={createPartner.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-400 transition-colors text-sm disabled:opacity-60">
                  <Save className="w-4 h-4" /> {createPartner.isPending ? "저장 중..." : "저장"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 파트너 목록 */}
        <input ref={editFileInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, true)} />
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
              {(partners as Partner[]).length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">파트너가 없습니다</td></tr>
              ) : (partners as Partner[]).map((partner) => (
                editingId === partner.id ? (
                  /* ── 편집 행 ── */
                  <tr key={partner.id} className="border-b border-amber-100 bg-amber-50/40">
                    <td className="px-4 py-3" colSpan={3}>
                      <div className="grid grid-cols-3 gap-3">
                        {/* 로고 미리보기 + 업로드 */}
                        <div className="col-span-3 flex items-center gap-3 mb-1">
                          <div className="w-12 h-12 rounded-lg border border-gray-200 bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
                            {editForm.logoUrl ? (
                              <img src={editForm.logoUrl} alt="logo" className="w-full h-full object-contain" />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-gray-300" />
                            )}
                          </div>
                          <div className="flex-1 flex gap-2 items-center">
                            <button type="button" onClick={() => editFileInputRef.current?.click()} disabled={uploadMedia.isPending}
                              className="flex items-center gap-1 px-2 py-1 border border-dashed border-amber-300 rounded-lg text-xs text-amber-600 hover:bg-amber-50 disabled:opacity-60">
                              <Upload className="w-3 h-3" /> {uploadMedia.isPending ? "업로드 중..." : "로고 교체"}
                            </button>
                            <input value={editForm.logoUrl} onChange={e => setEditForm(p => ({ ...p, logoUrl: e.target.value }))}
                              placeholder="로고 URL" className="flex-1 px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-amber-400" />
                          </div>
                        </div>
                        {/* 이름 */}
                        <div>
                          <label className="block text-xs text-gray-500 mb-0.5">파트너명</label>
                          <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                            className="w-full px-2 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400" />
                        </div>
                        {/* 카테고리 */}
                        <div>
                          <label className="block text-xs text-gray-500 mb-0.5">카테고리</label>
                          <select value={editForm.category} onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))}
                            className="w-full px-2 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400">
                            {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                          </select>
                        </div>
                        {/* 정렬 */}
                        <div>
                          <label className="block text-xs text-gray-500 mb-0.5">정렬</label>
                          <input type="number" value={editForm.sortOrder} onChange={e => setEditForm(p => ({ ...p, sortOrder: Number(e.target.value) }))}
                            className="w-full px-2 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400" />
                        </div>
                        {/* 웹사이트 */}
                        <div className="col-span-2">
                          <label className="block text-xs text-gray-500 mb-0.5">웹사이트</label>
                          <input value={editForm.website} onChange={e => setEditForm(p => ({ ...p, website: e.target.value }))}
                            placeholder="https://..." className="w-full px-2 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400" />
                        </div>
                        {/* 설명 */}
                        <div className="col-span-3">
                          <label className="block text-xs text-gray-500 mb-0.5">설명</label>
                          <input value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                            placeholder="간단한 설명" className="w-full px-2 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${partner.isHidden ? "bg-gray-100 text-gray-500" : "bg-green-100 text-green-700"}`}>
                        {partner.isHidden ? "숨김" : "공개"}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={saveEdit} disabled={updatePartner.isPending}
                          className="flex items-center gap-1 px-2 py-1 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-400 transition-colors disabled:opacity-60">
                          <Check className="w-3 h-3" /> {updatePartner.isPending ? "저장 중..." : "저장"}
                        </button>
                        <button onClick={cancelEdit} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  /* ── 일반 행 ── */
                  <tr key={partner.id} className={`border-b border-gray-50 transition-colors group ${partner.isHidden ? "opacity-50 bg-gray-50" : "hover:bg-amber-50/30"}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {partner.logoUrl ? (
                          <img src={partner.logoUrl} alt={partner.name} className="w-10 h-10 rounded-lg object-contain border border-gray-100 bg-white p-0.5" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-sm">
                            {partner.name[0]}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">{partner.name}</div>
                          {partner.description && <div className="text-xs text-gray-400 max-w-xs truncate">{partner.description}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{CATEGORY_LABELS[partner.category || "other"] || partner.category}</td>
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
                        <button onClick={() => startEdit(partner)} title="편집"
                          className="p-1.5 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => toggleHidden.mutate({ id: partner.id, isHidden: !partner.isHidden })}
                          title={partner.isHidden ? "공개" : "숨기기"}
                          className={`p-1.5 rounded-lg transition-colors ${partner.isHidden ? "text-green-500 hover:bg-green-50" : "text-gray-400 hover:text-orange-500 hover:bg-orange-50"}`}>
                          {partner.isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button onClick={() => { if (confirm("삭제하시겠습니까?")) deletePartner.mutate({ id: partner.id }); }}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
