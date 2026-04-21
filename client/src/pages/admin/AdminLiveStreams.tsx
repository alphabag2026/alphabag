import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, Eye, EyeOff, Tv, Radio } from "lucide-react";

type LiveForm = {
  title: string;
  description: string;
  streamUrl: string;
  thumbnailUrl: string;
  isLive: boolean;
  scheduledAt: string;
  isActive: boolean;
};

const defaultForm: LiveForm = {
  title: "",
  description: "",
  streamUrl: "",
  thumbnailUrl: "",
  isLive: false,
  scheduledAt: "",
  isActive: true,
};

export default function AdminLiveStreams() {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<LiveForm>(defaultForm);

  const { data: items = [], refetch } = trpc.liveStreams.listAll.useQuery();
  const createMut = trpc.liveStreams.create.useMutation({ onSuccess: () => { refetch(); setOpen(false); toast.success("라이브 등록 완료"); } });
  const updateMut = trpc.liveStreams.update.useMutation({ onSuccess: () => { refetch(); setOpen(false); toast.success("라이브 수정 완료"); } });
  const deleteMut = trpc.liveStreams.delete.useMutation({ onSuccess: () => { refetch(); toast.success("라이브 삭제 완료"); } });

  const openCreate = () => { setEditId(null); setForm(defaultForm); setOpen(true); };
  const openEdit = (item: any) => {
    setEditId(item.id);
    setForm({
      title: item.title ?? "",
      description: item.description ?? "",
      streamUrl: item.streamUrl ?? "",
      thumbnailUrl: item.thumbnailUrl ?? "",
      isLive: item.isLive,
      scheduledAt: item.scheduledAt ? new Date(item.scheduledAt).toISOString().slice(0, 16) : "",
      isActive: item.isActive,
    });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.title.trim()) { toast.error("제목을 입력하세요"); return; }
    const data = { ...form, scheduledAt: form.scheduledAt || undefined };
    if (editId) {
      updateMut.mutate({ id: editId, ...data });
    } else {
      createMut.mutate(data);
    }
  };

  const toggleActive = (item: any) => {
    updateMut.mutate({ id: item.id, isActive: !item.isActive });
  };

  const toggleLive = (item: any) => {
    updateMut.mutate({ id: item.id, isLive: !item.isLive });
    toast.success(item.isLive ? "라이브 종료" : "라이브 시작");
  };

  const handleDelete = (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    deleteMut.mutate({ id });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
            <Tv className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">라이브 방송 관리</h1>
            <p className="text-xs text-gray-400">홈 화면 Live 탭에 표시되는 방송을 관리합니다</p>
          </div>
        </div>
        <Button onClick={openCreate} className="bg-red-500 hover:bg-red-600 text-white font-bold gap-2">
          <Plus className="w-4 h-4" /> 방송 등록
        </Button>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#111] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-gray-400 text-xs">
              <th className="text-left px-4 py-3">방송 제목</th>
              <th className="text-left px-4 py-3">스트림 URL</th>
              <th className="text-center px-4 py-3">라이브</th>
              <th className="text-left px-4 py-3">예정 시간</th>
              <th className="text-center px-4 py-3">상태</th>
              <th className="text-center px-4 py-3">작업</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-500">
                  등록된 방송이 없습니다
                </td>
              </tr>
            )}
            {items.map((item: any) => (
              <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-white truncate max-w-[200px]">{item.title}</div>
                  {item.description && <div className="text-xs text-gray-400 truncate max-w-[200px]">{item.description}</div>}
                </td>
                <td className="px-4 py-3">
                  {item.streamUrl ? (
                    <a href={item.streamUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline truncate block max-w-[150px]">
                      {item.streamUrl}
                    </a>
                  ) : <span className="text-gray-600 text-xs">-</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => toggleLive(item)}
                    className={`flex items-center gap-1 mx-auto text-xs font-bold px-2 py-1 rounded-full transition-colors ${item.isLive ? "bg-red-500/20 text-red-400" : "bg-gray-700 text-gray-400"}`}>
                    <Radio className="w-3 h-3" />
                    {item.isLive ? "LIVE" : "OFF"}
                  </button>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {item.scheduledAt ? new Date(item.scheduledAt).toLocaleString() : "-"}
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
        <DialogContent className="bg-[#1a1a1a] border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "방송 수정" : "방송 등록"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">방송 제목 *</label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="방송 제목" className="bg-[#111] border-white/10 text-white" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">설명</label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="방송 설명" className="bg-[#111] border-white/10 text-white resize-none" rows={2} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">스트림 URL (YouTube/Twitch)</label>
              <Input value={form.streamUrl} onChange={e => setForm(f => ({ ...f, streamUrl: e.target.value }))}
                placeholder="https://youtube.com/live/..." className="bg-[#111] border-white/10 text-white" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">썸네일 URL</label>
              <Input value={form.thumbnailUrl} onChange={e => setForm(f => ({ ...f, thumbnailUrl: e.target.value }))}
                placeholder="https://..." className="bg-[#111] border-white/10 text-white" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">예정 시간</label>
              <Input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
                className="bg-[#111] border-white/10 text-white" />
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isLive" checked={form.isLive}
                  onChange={e => setForm(f => ({ ...f, isLive: e.target.checked }))} className="accent-red-500" />
                <label htmlFor="isLive" className="text-sm text-gray-300">현재 라이브 중</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="liveActive" checked={form.isActive}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="accent-amber-500" />
                <label htmlFor="liveActive" className="text-sm text-gray-300">활성화</label>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold"
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
