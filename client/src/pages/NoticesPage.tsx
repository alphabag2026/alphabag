import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Loader2, Bell, Calendar, ChevronLeft, ChevronRight, Pin, Paperclip, FileText, FileImage, FileVideo, File, Search, X, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// HTML 태그 제거 유틸
function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

const PAGE_SIZE = 15;

function getFileIcon(mimeType: string) {
  if (mimeType?.startsWith("image/")) return <FileImage className="w-4 h-4 text-blue-400" />;
  if (mimeType?.startsWith("video/")) return <FileVideo className="w-4 h-4 text-purple-400" />;
  if (mimeType === "application/pdf") return <FileText className="w-4 h-4 text-red-400" />;
  return <File className="w-4 h-4 text-muted-foreground" />;
}

// 카테고리별 색상 설정
const CATEGORY_STYLES: Record<string, { label: string; badge: string; filter: string; filterActive: string }> = {
  general:     { label: "일반",      badge: "bg-slate-500/15 text-slate-400 border-slate-500/30",       filter: "bg-muted text-muted-foreground hover:bg-muted/80",                         filterActive: "bg-slate-600 text-white" },
  event:       { label: "이벤트",    badge: "bg-blue-500/15 text-blue-400 border-blue-500/30",           filter: "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30", filterActive: "bg-blue-500 text-white" },
  update:      { label: "업데이트",  badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", filter: "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30", filterActive: "bg-emerald-500 text-white" },
  airdrop:     { label: "에어드랍",  badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",       filter: "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30",     filterActive: "bg-amber-500 text-white" },
  partnership: { label: "파트너십",  badge: "bg-purple-500/15 text-purple-400 border-purple-500/30",   filter: "bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/30", filterActive: "bg-purple-500 text-white" },
};

function getCategoryStyle(cat: string) {
  return CATEGORY_STYLES[cat] ?? CATEGORY_STYLES.general;
}

export default function NoticesPage() {
  const [, navigate] = useLocation();
  const { data: notices, isLoading } = trpc.public.notices.useQuery();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<any>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const activeNotices = (notices ?? []).filter((n: any) => n.isActive);
  const categories = Array.from(new Set(activeNotices.map((n: any) => n.category || "general"))) as string[];

  // 검색 + 카테고리 필터 + 고정 우선 정렬
  const filteredNotices = activeNotices
    .filter((n: any) => {
      const matchCat = categoryFilter === "all" || (n.category || "general") === categoryFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch = !q || n.title?.toLowerCase().includes(q) || stripHtml(n.content ?? "").toLowerCase().includes(q);
      return matchCat && matchSearch;
    })
    .sort((a: any, b: any) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

  const totalPages = Math.ceil(filteredNotices.length / PAGE_SIZE);
  const paginated = filteredNotices.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = (val: string) => {
    setSearchQuery(val);
    setPage(1);
  };

  const handleCategoryFilter = (cat: string) => {
    setCategoryFilter(cat);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
              <ArrowLeft className="w-4 h-4" /> Home
            </Button>
          </Link>
          <span className="text-sm font-medium">공지사항</span>
          {!isLoading && (
            <span className="text-xs text-muted-foreground ml-auto">총 {activeNotices.length}개</span>
          )}
        </div>
      </nav>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">공지사항</h1>
            <p className="text-sm text-muted-foreground">AlphaBag 최신 소식과 업데이트</p>
          </div>
        </div>

        {/* 검색 입력 */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="제목 또는 내용으로 검색..."
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            className="pl-9 pr-9 bg-muted/30 border-border/40 focus:border-primary/50"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 카테고리 필터 */}
        {!isLoading && categories.length > 1 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            <button
              onClick={() => handleCategoryFilter("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${categoryFilter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              전체 ({activeNotices.length})
            </button>
            {categories.map(cat => {
              const style = getCategoryStyle(cat);
              const isActive = categoryFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => handleCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${isActive ? style.filterActive : style.filter}`}
                >
                  {style.label} ({activeNotices.filter((n: any) => (n.category || "general") === cat).length})
                </button>
              );
            })}
          </div>
        )}

        {/* 검색 결과 안내 */}
        {searchQuery && !isLoading && (
          <p className="text-xs text-muted-foreground mb-3">
            &ldquo;<span className="text-foreground font-medium">{searchQuery}</span>&rdquo; 검색 결과 {filteredNotices.length}개
          </p>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="border border-border/40 rounded-xl p-4 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-4 bg-muted/40 rounded flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted/40 rounded w-3/4" />
                    <div className="h-3 bg-muted/30 rounded w-full" />
                    <div className="h-3 bg-muted/30 rounded w-2/3" />
                    <div className="flex gap-2 mt-1">
                      <div className="h-4 bg-muted/30 rounded w-20" />
                      <div className="h-4 bg-muted/30 rounded w-16" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : paginated.length > 0 ? (
          <>
            <div className="space-y-3">
              {paginated.map((notice: any, i: number) => {
                const globalIdx = (page - 1) * PAGE_SIZE + i + 1;
                const attachments = notice.attachments ? (() => { try { return JSON.parse(notice.attachments); } catch { return []; } })() : [];
                const cat = notice.category || "general";
                const catStyle = getCategoryStyle(cat);
                return (
                  <Card
                    key={notice.id}
                    className={`border-border/40 cursor-pointer hover:border-primary/30 transition-all ${notice.isPinned ? "border-primary/30 bg-primary/5" : ""}`}
                    onClick={() => navigate(`/notices/${notice.id}`)}
                  >
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                        <span className="text-sm font-bold text-primary min-w-[28px]">{globalIdx})</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {notice.isPinned && <Pin className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                            <h3 className="font-semibold text-foreground leading-tight truncate">{notice.title}</h3>
                          </div>
                          {notice.content && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                              {stripHtml(notice.content).slice(0, 120)}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {new Date(notice.createdAt).toLocaleDateString("ko-KR")}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Eye className="w-3 h-3" />
                              {(notice.viewCount ?? 0).toLocaleString()}
                            </span>
                            {attachments.length > 0 && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Paperclip className="w-3 h-3" />
                                {attachments.length}개 첨부
                              </span>
                            )}
                          </div>
                        </div>
                        {notice.isPinned && (
                          <Badge className="text-xs bg-amber-500/20 text-amber-400 border-amber-500/30 shrink-0">고정</Badge>
                        )}
                        {cat !== "general" && (
                          <Badge className={`text-xs shrink-0 border ${catStyle.badge}`}>
                            {catStyle.label}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  이전
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                        p === page
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="gap-1"
                >
                  다음
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? `"${searchQuery}"에 해당하는 공지사항이 없습니다` : "공지사항이 없습니다"}
            </p>
            {searchQuery && (
              <button
                onClick={() => handleSearch("")}
                className="mt-2 text-xs text-primary hover:underline"
              >
                검색 초기화
              </button>
            )}
          </div>
        )}
      </div>

      {/* 공지사항 상세 모달 */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl bg-card border-border max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display leading-snug pr-6">
              {selected?.isPinned && <Pin className="w-4 h-4 text-amber-400 inline mr-1.5" />}
              {selected?.title}
            </DialogTitle>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <Calendar className="w-3 h-3" />
              {selected && new Date(selected.createdAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </DialogHeader>
          <div className="py-2">
            {selected?.content && (
              <div
                className="prose prose-sm max-w-none text-foreground rich-editor-content"
                dangerouslySetInnerHTML={{ __html: selected.content }}
              />
            )}
            {/* 첨부 파일 */}
            {selected?.attachments && (() => {
              try {
                const atts = JSON.parse(selected.attachments);
                if (!atts.length) return null;
                return (
                  <div className="mt-4 pt-4 border-t border-border/40">
                    <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <Paperclip className="w-3 h-3" />
                      첨부 파일 ({atts.length})
                    </p>
                    <div className="space-y-1.5">
                      {atts.map((att: any, i: number) => (
                        <a
                          key={i}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-foreground hover:text-primary bg-muted/30 rounded-lg px-3 py-2 transition-colors"
                        >
                          {getFileIcon(att.mimeType)}
                          <span className="flex-1 truncate">{att.name}</span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {att.size < 1024 ? `${att.size}B` : att.size < 1024*1024 ? `${(att.size/1024).toFixed(1)}KB` : `${(att.size/1024/1024).toFixed(1)}MB`}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                );
              } catch { return null; }
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
