import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, Eye, EyeOff, CalendarDays, Star } from "lucide-react";

const EVENT_TYPES = [
  { value: "meetup", label: "밋업" },
  { value: "expo", label: "엑스포" },
  { value: "conference", label: "컨퍼런스" },
  { value: "webinar", label: "웨비나" },
];

type EventForm = {
  type: "meetup" | "expo" | "conference" | "webinar";
  title: string;
  titleKo: string;
  description: string;
  location: string;
  onlineUrl: string;
  imageUrl: string;
  bannerUrl: string;
  registrationUrl: string;
  startAt: string;
  endAt: string;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
};

const defaultForm: EventForm = {
  type: "meetup",
  title: "",
  titleKo: "",
  description: "",
  location: "",
  onlineUrl: "",
  imageUrl: "",
  bannerUrl: "",
  registrationUrl: "",
  startAt: "",
  endAt: "",
  isActive: true,
  isFeatured: false,
  sortOrder: 0,
};

export default function AdminEvents() {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<EventForm>(defaultForm);
  const [filterType, setFilterType] = useState<string>("all");

  const { data: items = [], refetch } = trpc.events.listAll.useQuery();
  const createMut = trpc.events.create.useMutation({ onSuccess: () => { refetch(); setOpen(false); toast.success("이벤트 등록 완료"); } });
  const updateMut = trpc.events.update.useMutation({ onSuccess: () => { refetch(); setOpen(false); toast.success("이벤트 수정 완료"); } });
  const deleteMut = trpc.events.delete.useMutation({ onSuccess: () => { refetch(); toast.success("이벤트 삭제 완료"); } });

  const filtered = filterType === "all" ? items : items.filter((i: any) => i.type === filterType);

  const openCreate = () => { setEditId(null); setForm(defaultForm); setOpen(true); };
  const openEdit = (item: any) => {
    setEditId(item.id);
    setForm({
      type: item.type ?? "meetup",
      title: item.title ?? "",
      titleKo: item.titleKo ?? "",
      description: item.description ?? "",
      location: item.location ?? "",
      onlineUrl: item.onlineUrl ?? "",
      imageUrl: item.imageUrl ?? "",
      bannerUrl: item.bannerUrl ?? "",
      registrationUrl: item.registrationUrl ?? "",
      startAt: item.startAt ? new Date(item.startAt).toISOString().slice(0, 16) : "",
      endAt: item.endAt ? new Date(item.endAt).toISOString().slice(0, 16) : "",
      isActive: item.isActive,
      isFeatured: item.isFeatured,
      sortOrder: item.sortOrder ?? 0,
    });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.title.trim()) { toast.error("제목을 입력하세요"); return; }
    if (!form.startAt) { toast.error("시작 시간을 입력하세요"); return; }
    const data = {
      ...form,
      endAt: form.endAt || undefined,
    };
    if (editId) {
      updateMut.mutate({ id: editId, ...data });
    } else {
      createMut.mutate(data);
    }
  };

  const toggleActive = (item: any) => updateMut.mutate({ id: item.id, isActive: !item.isActive });
  const toggleFeatured = (item: any) => updateMut.mutate({ id: item.id, isFeatured: !item.isFeatured });
  const handleDelete = (id: number) => { if (!confirm("삭제하시겠습니까?")) return; deleteMut.mutate({ id }); };

  const typeColor: Record<string, string> = {
    meetup: "text-blue-400 border-blue-400/30",
    expo: "text-purple-400 border-purple-400/30",
    conference: "text-green-400 border-green-400/30",
    webinar: "text-orange-400 border-orange-400/30",
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">이벤트 관리</h1>
            <p className="text-xs text-gray-400">밋업, 엑스포, 컨퍼런스 등 이벤트를 관리합니다</p>
          </div>
        </div>
        <Button onClick={openCreate} className="bg-blue-500 hover:bg-blue-600 text-white font-bold gap-2">
          <Plus className="w-4 h-4" /> 이벤트 등록
        </Button>
      </div>

      {/* 필터 탭 */}
      <div className="flex gap-2 mb-4">
        {[{ value: "all", label: "전체" }, ...EVENT_TYPES].map(t => (
          <button key={t.value} onClick={() => setFilterType(t.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterType === t.value ? "bg-blue-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-white/10 bg-[#111] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-gray-400 text-xs">
              <th className="text-left px-4 py-3">이벤트명</th>
              <th className="text-left px-4 py-3">유형</th>
              <th className="text-left px-4 py-3">시작일</th>
              <th className="text-left px-4 py-3">장소</th>
              <th className="text-center px-4 py-3">추천</th>
              <th className="text-center px-4 py-3">상태</th>
              <th className="text-center px-4 py-3">작업</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-500">등록된 이벤트가 없습니다</td>
              </tr>
            )}
            {filtered.map((item: any) => (
              <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-white truncate max-w-[180px]">{item.title}</div>
                  {item.titleKo && <div className="text-xs text-gray-400 truncate max-w-[180px]">{item.titleKo}</div>}
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={`text-xs ${typeColor[item.type] ?? ""}`}>
                    {EVENT_TYPES.find(t => t.value === item.type)?.label ?? item.type}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-xs text-gray-300">
                  {item.startAt ? new Date(item.startAt).toLocaleDateString() : "-"}
                </td>
                <td className="px-4 py-3 text-xs text-gray-400 truncate max-w-[120px]">
                  {item.location || item.onlineUrl ? (item.location || "온라인") : "-"}
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => toggleFeatured(item)} className="text-gray-400 hover:text-yellow-400 transition-colors">
                    <Star className={`w-4 h-4 ${item.isFeatured ? "text-yellow-400 fill-yellow-400" : ""}`} />
                  </button>
                </td>
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
        <DialogContent className="bg-[#1a1a1a] border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "이벤트 수정" : "이벤트 등록"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">유형</label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as any }))}>
                  <SelectTrigger className="bg-[#111] border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-white/10">
                    {EVENT_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value} className="text-white">{t.label}</SelectItem>
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
            <div>
              <label className="text-xs text-gray-400 mb-1 block">이벤트명 (기본) *</label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="이벤트 제목" className="bg-[#111] border-white/10 text-white" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">한국어 이름</label>
              <Input value={form.titleKo} onChange={e => setForm(f => ({ ...f, titleKo: e.target.value }))}
                placeholder="한국어 이름" className="bg-[#111] border-white/10 text-white" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">설명</label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="이벤트 설명" className="bg-[#111] border-white/10 text-white resize-none" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">시작 시간 *</label>
                <Input type="datetime-local" value={form.startAt} onChange={e => setForm(f => ({ ...f, startAt: e.target.value }))}
                  className="bg-[#111] border-white/10 text-white" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">종료 시간</label>
                <Input type="datetime-local" value={form.endAt} onChange={e => setForm(f => ({ ...f, endAt: e.target.value }))}
                  className="bg-[#111] border-white/10 text-white" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">장소</label>
              <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                placeholder="서울 강남구 / 온라인" className="bg-[#111] border-white/10 text-white" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">온라인 URL</label>
              <Input value={form.onlineUrl} onChange={e => setForm(f => ({ ...f, onlineUrl: e.target.value }))}
                placeholder="https://zoom.us/..." className="bg-[#111] border-white/10 text-white" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">등록 URL</label>
              <Input value={form.registrationUrl} onChange={e => setForm(f => ({ ...f, registrationUrl: e.target.value }))}
                placeholder="https://..." className="bg-[#111] border-white/10 text-white" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">이미지 URL</label>
              <Input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                placeholder="https://..." className="bg-[#111] border-white/10 text-white" />
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="evActive" checked={form.isActive}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="accent-amber-500" />
                <label htmlFor="evActive" className="text-sm text-gray-300">활성화</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="evFeatured" checked={form.isFeatured}
                  onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))} className="accent-yellow-500" />
                <label htmlFor="evFeatured" className="text-sm text-gray-300">추천 이벤트</label>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold"
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
