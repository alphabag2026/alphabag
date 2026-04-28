import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Loader2, Pin, Paperclip, FileText, FileImage, FileVideo, File, Bell, AlertCircle, Share2, Copy, Check } from "lucide-react";
import { useState } from "react";

function ShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? window.location.href : "";
  const text = encodeURIComponent(`${title} - AlphaBag`);
  const encodedUrl = encodeURIComponent(url);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="pt-5 pb-2 border-t border-border/40">
      <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
        <Share2 className="w-3.5 h-3.5" />
        공유하기
      </p>
      <div className="flex flex-wrap gap-2">
        {/* 트위터/X */}
        <a
          href={`https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-black text-white hover:bg-zinc-800 transition-colors border border-zinc-700"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          X (Twitter)
        </a>
        {/* 텔레그램 */}
        <a
          href={`https://t.me/share/url?url=${encodedUrl}&text=${text}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-[#229ED9] text-white hover:bg-[#1a8bbf] transition-colors"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
          Telegram
        </a>
        {/* 링크 복사 */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-muted hover:bg-muted/80 text-foreground transition-colors border border-border/40"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "복사됨!" : "링크 복사"}
        </button>
      </div>
    </div>
  );
}

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

            {/* SNS 공유 버튼 */}
            <ShareButtons title={notice.title} />
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
