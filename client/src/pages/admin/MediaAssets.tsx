import { useState, useRef } from "react";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Upload, Copy, Trash2, Image as ImageIcon, Link2, Search, X } from "lucide-react";

export default function MediaAssetsPage() {
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: assets = [], refetch } = trpc.media.list.useQuery();
  const uploadMutation = trpc.media.upload.useMutation({
    onSuccess: () => { refetch(); toast.success("업로드 완료"); setUploading(false); },
    onError: (e) => { toast.error(e.message); setUploading(false); },
  });
  const deleteMutation = trpc.media.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("삭제 완료"); },
    onError: (e) => toast.error(e.message),
  });

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) { toast.error("이미지 파일만 업로드 가능합니다"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("5MB 이하 파일만 업로드 가능합니다"); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(",")[1];
      uploadMutation.mutate({ filename: file.name, base64, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL 복사됨");
  };

  const filtered = (assets as any[]).filter((a: any) =>
    a.filename.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="ab-content">
        <div className="ab-page-title">🖼️ Media Assets</div>
        <div className="ab-page-desc">이미지를 업로드하고 CDN URL을 생성합니다</div>

        {/* 업로드 영역 */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all mb-6 ${
            dragOver
              ? "border-amber-400 bg-amber-400/5"
              : "border-white/10 hover:border-amber-400/40 hover:bg-white/2"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-amber-400">업로드 중...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-10 h-10 text-amber-400/60" />
              <div className="text-sm text-gray-400">이미지를 드래그하거나 클릭하여 업로드</div>
              <div className="text-xs text-gray-600">PNG, JPG, GIF, WebP · 최대 5MB</div>
            </div>
          )}
        </div>

        {/* 검색 */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="파일명 검색..."
            className="ab-input pl-9"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 통계 */}
        <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
          <span>총 {(assets as any[]).length}개 파일</span>
          {search && <span>검색 결과: {filtered.length}개</span>}
        </div>

        {/* 이미지 그리드 */}
        {filtered.length === 0 ? (
          <div className="ab-table-wrap p-12 text-center">
            <ImageIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <div className="text-sm text-gray-500">
              {search ? "검색 결과가 없습니다" : "업로드된 이미지가 없습니다"}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map((asset: any) => (
              <div key={asset.id} className="ab-kpi-card group relative overflow-hidden rounded-xl p-0">
                {/* 이미지 */}
                <div className="aspect-square bg-black/20 overflow-hidden">
                  <img
                    src={asset.url}
                    alt={asset.filename}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23111'/%3E%3Ctext x='50' y='55' text-anchor='middle' fill='%23555' font-size='12'%3ENo Image%3C/text%3E%3C/svg%3E";
                    }}
                  />
                </div>
                {/* 오버레이 */}
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                  <button
                    onClick={() => copyUrl(asset.url)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/30 transition-colors w-full justify-center"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    URL 복사
                  </button>
                  <a
                    href={asset.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-gray-300 border border-white/10 text-xs hover:bg-white/10 transition-colors w-full justify-center"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    원본 보기
                  </a>
                  <button
                    onClick={() => {
                      if (confirm("삭제하시겠습니까?")) deleteMutation.mutate({ id: asset.id });
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-xs hover:bg-red-500/20 transition-colors w-full justify-center"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    삭제
                  </button>
                </div>
                {/* 파일명 */}
                <div className="p-2 border-t border-white/5">
                  <div className="text-xs text-gray-400 truncate">{asset.filename}</div>
                  {asset.size && (
                    <div className="text-[10px] text-gray-600">{(asset.size / 1024).toFixed(1)} KB</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
