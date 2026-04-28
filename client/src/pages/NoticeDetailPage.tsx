import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Loader2, Pin, Paperclip, FileText, FileImage, FileVideo, File, Bell, AlertCircle } from "lucide-react";

function getFileIcon(mimeType: string) {
  if (mimeType?.startsWith("image/")) return <FileImage className="w-4 h-4 text-blue-400" />;
  if (mimeType?.startsWith("video/")) return <FileVideo className="w-4 h-4 text-purple-400" />;
  if (mimeType === "application/pdf") return <FileText className="w-4 h-4 text-red-400" />;
  return <File className="w-4 h-4 text-muted-foreground" />;
}

export default function NoticeDetailPage() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id ?? "0", 10);
  const { data: notice, isLoading, error } = trpc.public.noticeById.useQuery(
    { id },
    { enabled: !!id && !isNaN(id) }
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 상단 네비게이션 */}
      <nav className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/notices">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
              공지사항 목록
            </Button>
          </Link>
          <span className="text-sm text-muted-foreground">|</span>
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-xs">
              Home
            </Button>
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* 로딩 상태 */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">공지사항을 불러오는 중...</p>
          </div>
        )}

        {/* 에러 상태 */}
        {(error || (!isLoading && !notice)) && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-lg mb-1">공지사항을 찾을 수 없습니다</p>
              <p className="text-sm text-muted-foreground">삭제되었거나 존재하지 않는 공지사항입니다.</p>
            </div>
            <Link href="/notices">
              <Button variant="outline" size="sm" className="gap-2 mt-2">
                <ArrowLeft className="w-4 h-4" />
                목록으로 돌아가기
              </Button>
            </Link>
          </div>
        )}

        {/* 공지사항 내용 */}
        {notice && (
          <article className="space-y-6">
            {/* 헤더 */}
            <header className="space-y-3 pb-6 border-b border-border/40">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-4 h-4 text-primary" />
                </div>
                <span className="text-xs font-medium text-primary uppercase tracking-wide">공지사항</span>
                {notice.isPinned && (
                  <Badge className="text-xs bg-amber-500/20 text-amber-400 border-amber-500/30 gap-1">
                    <Pin className="w-3 h-3" />
                    고정
                  </Badge>
                )}
                {!notice.isActive && (
                  <Badge variant="secondary" className="text-xs">비활성</Badge>
                )}
              </div>
              <h1 className="text-2xl font-bold leading-snug text-foreground">
                {notice.title}
              </h1>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(notice.createdAt).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    weekday: "short",
                  })}
                </span>
                {notice.updatedAt && notice.updatedAt !== notice.createdAt && (
                  <span className="text-muted-foreground/60">
                    수정: {new Date(notice.updatedAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                  </span>
                )}
              </div>
            </header>

            {/* 본문 */}
            <div className="prose prose-sm max-w-none">
              {notice.content ? (
                <div
                  className="rich-editor-content text-foreground leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: notice.content }}
                />
              ) : (
                <p className="text-muted-foreground italic">내용이 없습니다.</p>
              )}
            </div>

            {/* 첨부 파일 */}
            {notice.attachments && (() => {
              try {
                const atts = JSON.parse(notice.attachments);
                if (!atts || !atts.length) return null;
                return (
                  <div className="pt-6 border-t border-border/40">
                    <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-muted-foreground" />
                      첨부 파일 ({atts.length})
                    </p>
                    <div className="space-y-2">
                      {atts.map((att: any, i: number) => (
                        <a
                          key={i}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 text-sm text-foreground hover:text-primary bg-muted/30 hover:bg-muted/60 rounded-xl px-4 py-3 transition-all border border-border/30 hover:border-primary/30"
                        >
                          <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center flex-shrink-0 border border-border/40">
                            {getFileIcon(att.mimeType)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{att.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {att.size < 1024
                                ? `${att.size}B`
                                : att.size < 1024 * 1024
                                ? `${(att.size / 1024).toFixed(1)}KB`
                                : `${(att.size / 1024 / 1024).toFixed(1)}MB`}
                            </p>
                          </div>
                          <span className="text-xs text-primary/70 flex-shrink-0">다운로드 →</span>
                        </a>
                      ))}
                    </div>
                  </div>
                );
              } catch {
                return null;
              }
            })()}

            {/* 하단 네비게이션 */}
            <div className="pt-6 border-t border-border/40 flex items-center justify-between">
              <Link href="/notices">
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  목록으로
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground">AlphaBag 공지사항</p>
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
