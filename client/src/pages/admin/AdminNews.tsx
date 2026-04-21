import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Eye, EyeOff, Newspaper } from "lucide-react";

const CATEGORIES = [
  { value: "notice", label: "공지" },
  { value: "market", label: "시장" },
  { value: "update", label: "업데이트" },
  { value: "event", label: "이벤트" },
];

type NewsForm = {
  title: string;
  titleKo: string;
  titleEn: string;
  titleZh: string;
  url: string;
  category: string;
  imageUrl: string;
  isActive: boolean;
  sortOrder: number;
};

const defaultForm: NewsForm = {
  title: "",
  titleKo: "",
  titleEn: "",
  titleZh: "",
  url: "",
  category: "notice",
  imageUrl: "",
  isActive: true,
  sortOrder: 0,
};

export default function AdminNews() {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<NewsForm>(defaultForm);

  const { data: items = [], refetch } = trpc.news.listAll.useQuery();
  const createMut = trpc.news.create.useMutation({ onSuccess: () => { refetch(); setOpen(false); toast.success("뉴스 등록 완료"); } });
  const updateMut = trpc.news.update.useMutation({ onSuccess: () => { refetch(); setOpen(false); toast.success("뉴스 수정 완료"); } });
  const deleteMut = trpc.news.delete.useMutation({ onSuccess: () => { refetch(); toast.success("뉴스 삭제 완료"); } });

  const openCreate = () => { setEditId(null); setForm(defaultForm); setOpen(true); };
  const openEdit = (item: any) => {
    setEditId(item.id);
    setForm({
      title: item.title ?? "",
      titleKo: item.titleKo ?? "",
      titleEn: item.titleEn ?? "",
      titleZh: item.titleZh ?? "",
      url: item.url ?? "",
      category: item.category ?? "notice",
      imageUrl: item.imageUrl ?? "",
      isActive: item.isActive,
      sortOrder: item.sortOrder ?? 0,
    });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.title.trim()) { toast.error("제목을 입력하세요"); return; }
    if (editId) {
      updateMut.mutate({ id: editId, ...form });
    } else {
      createMut.mutate(form);
    }
  };

  const toggleActive = (item: any) => {
    updateMut.mutate({ id: item.id, isActive: !item.isActive });
  };

  const handleDelete = (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    deleteMut.mutate({ id });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <Newspaper className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">뉴스 관리</h1>
            <p className="text-xs text-gray-400">홈 화면 뉴스 탭에 표시되는 뉴스를 관리합니다</p>
          </div>
        </div>
        <Button onClick={openCreate} className="bg-amber-500 hover:bg-amber-600 text-black font-bold gap-2">
          <Plus className="w-4 h-4" /> 뉴스 등록
        </Button>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#111] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-gray-400 text-xs">
              <th className="text-left px-4 py-3">제목</th>
              <th className="text-left px-4 py-3">카테고리</th>
              <th className="text-left px-4 py-3">URL</th>
              <th className="text-center px-4 py-3">순서</th>
              <th className="text-center px-4 py-3">상태</th>
              <th className="text-center px-4 py-3">작업</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-500">
                  등록된 뉴스가 없습니다
                </td>
              </tr>
            )}
            {items.map((item: any) => (
              <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-white truncate max-w-[200px]">{item.title}</div>
                  {item.titleKo && <div className="text-xs text-gray-400 truncate max-w-[200px]">{item.titleKo}</div>}
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-400">
                    {CATEGORIES.find(c => c.value === item.category)?.label ?? item.category}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline truncate block max-w-[150px]">
                      {item.url}
                    </a>
                  ) : <span className="text-gray-600 text-xs">-</span>}
                </td>
                <td className="px-4 py-3 text-center text-gray-400 text-xs">{item.sortOrder}</td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => toggleActive(item)} className="text-gray-400 hover:text-white transition-colors">
                    {item.isActive ? <Eye className="w-4 h-4 text-green-400" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => openEdit(item)} className="text-gray-400 hover:text-amber-400 transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#1a1a1a] border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "뉴스 수정" : "뉴스 등록"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">제목 (기본) *</label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="뉴스 제목" className="bg-[#111] border-white/10 text-white" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">한국어 제목</label>
                <Input value={form.titleKo} onChange={e => setForm(f => ({ ...f, titleKo: e.target.value }))}
                  placeholder="한국어" className="bg-[#111] border-white/10 text-white" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">영어 제목</label>
                <Input value={form.titleEn} onChange={e => setForm(f => ({ ...f, titleEn: e.target.value }))}
                  placeholder="English" className="bg-[#111] border-white/10 text-white" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">중국어 제목</label>
              <Input value={form.titleZh} onChange={e => setForm(f => ({ ...f, titleZh: e.target.value }))}
                placeholder="中文" className="bg-[#111] border-white/10 text-white" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">링크 URL</label>
              <Input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                placeholder="https://" className="bg-[#111] border-white/10 text-white" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">이미지 URL</label>
              <Input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                placeholder="https://..." className="bg-[#111] border-white/10 text-white" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">카테고리</label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger className="bg-[#111] border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-white/10">
                    {CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value} className="text-white">{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">정렬 순서</label>
                <Input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))}
                  className="bg-[#111] border-white/10 text-white" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isActive" checked={form.isActive}
                onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="accent-amber-500" />
              <label htmlFor="isActive" className="text-sm text-gray-300">활성화</label>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-bold"
                disabled={createMut.isPending || updateMut.isPending}>
                {editId ? "수정" : "등록"}
              </Button>
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1 border-white/20 text-white">
                취소
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
