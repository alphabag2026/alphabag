import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import YoutubeExtension from "@tiptap/extension-youtube";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import { useCallback, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Quote,
  Code,
  Link,
  Image,
  Youtube,
  Paperclip,
  Undo,
  Redo,
  Minus,
  X,
  Palette,
  FileText,
  FileImage,
  FileVideo,
  File,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Attachment {
  name: string;
  url: string;
  size: number;
  mimeType: string;
}

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  attachments?: Attachment[];
  onAttachmentsChange?: (attachments: Attachment[]) => void;
  placeholder?: string;
  minHeight?: string;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return <FileImage className="w-4 h-4 text-blue-400" />;
  if (mimeType.startsWith("video/")) return <FileVideo className="w-4 h-4 text-purple-400" />;
  if (mimeType === "application/pdf") return <FileText className="w-4 h-4 text-red-400" />;
  return <File className="w-4 h-4 text-muted-foreground" />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export default function RichTextEditor({
  value,
  onChange,
  attachments = [],
  onAttachmentsChange,
  placeholder = "내용을 입력하세요...",
  minHeight = "200px",
}: RichTextEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [youtubeDialogOpen, setYoutubeDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [currentColor, setCurrentColor] = useState("#f59e0b");

  const uploadMedia = trpc.media.upload.useMutation();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      ImageExtension.configure({
        HTMLAttributes: {
          class: "max-w-full rounded-lg my-2",
        },
      }),
      YoutubeExtension.configure({
        width: 640,
        height: 360,
        HTMLAttributes: {
          class: "w-full rounded-lg my-2",
        },
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline",
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none px-3 py-2",
        style: `min-height: ${minHeight}`,
      },
    },
  });

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !editor) return;
      if (!file.type.startsWith("image/")) {
        toast.error("이미지 파일만 업로드 가능합니다.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("이미지 크기는 5MB 이하여야 합니다.");
        return;
      }
      setUploadingImage(true);
      try {
        const base64 = await fileToBase64(file);
        const result = await uploadMedia.mutateAsync({
          filename: file.name,
          base64,
          mimeType: file.type,
        });
        editor.chain().focus().setImage({ src: result.url, alt: file.name }).run();
        toast.success("이미지 업로드 완료");
      } catch {
        toast.error("이미지 업로드 실패");
      } finally {
        setUploadingImage(false);
        if (imageInputRef.current) imageInputRef.current.value = "";
      }
    },
    [editor, uploadMedia]
  );

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 20 * 1024 * 1024) {
        toast.error("파일 크기는 20MB 이하여야 합니다.");
        return;
      }
      setUploadingFile(true);
      try {
        const base64 = await fileToBase64(file);
        const result = await uploadMedia.mutateAsync({
          filename: file.name,
          base64,
          mimeType: file.type,
        });
        const newAttachment: Attachment = {
          name: file.name,
          url: result.url,
          size: file.size,
          mimeType: file.type,
        };
        onAttachmentsChange?.([...attachments, newAttachment]);
        toast.success("파일 첨부 완료");
      } catch {
        toast.error("파일 업로드 실패");
      } finally {
        setUploadingFile(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [attachments, onAttachmentsChange, uploadMedia]
  );

  // 유튜브 URL에서 비디오 ID 추출
  const getYoutubeVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?#]+)/,
      /youtube\.com\/shorts\/([^&?#]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };
  const youtubeThumbnail = youtubeUrl.trim() ? (() => {
    const id = getYoutubeVideoId(youtubeUrl);
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
  })() : null;

  const handleYoutubeInsert = useCallback(() => {
    if (!editor || !youtubeUrl.trim()) return;
    editor.chain().focus().setYoutubeVideo({ src: youtubeUrl }).run();
    setYoutubeUrl("");
    setYoutubeDialogOpen(false);
    toast.success("유튜브 영상 삽입 완료");
  }, [editor, youtubeUrl]);

  const handleLinkInsert = useCallback(() => {
    if (!editor || !linkUrl.trim()) return;
    if (linkText.trim()) {
      editor
        .chain()
        .focus()
        .insertContent(`<a href="${linkUrl}" target="_blank">${linkText}</a>`)
        .run();
    } else {
      editor.chain().focus().setLink({ href: linkUrl }).run();
    }
    setLinkUrl("");
    setLinkText("");
    setLinkDialogOpen(false);
  }, [editor, linkUrl, linkText]);

  const removeAttachment = useCallback(
    (index: number) => {
      const newAttachments = attachments.filter((_, i) => i !== index);
      onAttachmentsChange?.(newAttachments);
    },
    [attachments, onAttachmentsChange]
  );

  if (!editor) return null;

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-input">
      {/* 툴바 */}
      <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-b border-border bg-card/50">
        {/* 텍스트 서식 */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="굵게"
        >
          <Bold className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="기울임"
        >
          <Italic className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
          title="취소선"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive("code")}
          title="인라인 코드"
        >
          <Code className="w-3.5 h-3.5" />
        </ToolbarButton>

        <Divider />

        {/* 제목 */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          title="제목 2"
        >
          <Heading2 className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
          title="제목 3"
        >
          <Heading3 className="w-3.5 h-3.5" />
        </ToolbarButton>

        <Divider />

        {/* 목록 */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="글머리 목록"
        >
          <List className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="번호 목록"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          title="인용구"
        >
          <Quote className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="구분선"
        >
          <Minus className="w-3.5 h-3.5" />
        </ToolbarButton>

        <Divider />

        {/* 링크 */}
        <ToolbarButton
          onClick={() => {
            const selected = editor.state.selection;
            const text = editor.state.doc.textBetween(selected.from, selected.to);
            setLinkText(text);
            setLinkDialogOpen(true);
          }}
          active={editor.isActive("link")}
          title="링크 삽입"
        >
          <Link className="w-3.5 h-3.5" />
        </ToolbarButton>

        {/* 이미지 업로드 */}
        <ToolbarButton
          onClick={() => imageInputRef.current?.click()}
          title="이미지 업로드"
          loading={uploadingImage}
        >
          <Image className="w-3.5 h-3.5" />
        </ToolbarButton>

        {/* 유튜브 */}
        <ToolbarButton
          onClick={() => setYoutubeDialogOpen(true)}
          title="유튜브 영상 삽입"
        >
          <Youtube className="w-3.5 h-3.5" />
        </ToolbarButton>

        {/* 파일 첨부 */}
        <ToolbarButton
          onClick={() => fileInputRef.current?.click()}
          title="파일 첨부"
          loading={uploadingFile}
        >
          <Paperclip className="w-3.5 h-3.5" />
        </ToolbarButton>

        <Divider />

        {/* 실행 취소/다시 실행 */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="실행 취소"
        >
          <Undo className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="다시 실행"
        >
          <Redo className="w-3.5 h-3.5" />
        </ToolbarButton>
      </div>

      {/* 에디터 본문 */}
      <div className="rich-editor-content">
        <EditorContent editor={editor} />
      </div>

      {/* 첨부 파일 목록 */}
      {attachments.length > 0 && (
        <div className="border-t border-border p-2 bg-card/30">
          <p className="text-xs text-muted-foreground mb-1.5 font-medium">첨부 파일 ({attachments.length})</p>
          <div className="flex flex-col gap-1">
            {attachments.map((att, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-xs bg-background/50 rounded px-2 py-1.5"
              >
                {getFileIcon(att.mimeType)}
                <a
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-foreground hover:text-primary truncate"
                >
                  {att.name}
                </a>
                <span className="text-muted-foreground shrink-0">{formatFileSize(att.size)}</span>
                <button
                  onClick={() => removeAttachment(i)}
                  className="text-muted-foreground hover:text-destructive shrink-0"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 숨겨진 파일 입력 */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt,.csv"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* 유튜브 다이얼로그 */}
      <Dialog open={youtubeDialogOpen} onOpenChange={setYoutubeDialogOpen}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Youtube className="w-4 h-4 text-red-500" />
              유튜브 영상 삽입
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs text-muted-foreground">유튜브 URL</Label>
              <Input
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="mt-1 bg-input"
                onKeyDown={(e) => e.key === "Enter" && handleYoutubeInsert()}
              />
            </div>
            {youtubeThumbnail && (
              <div className="rounded-md overflow-hidden border border-border/40">
                <img
                  src={youtubeThumbnail}
                  alt="YouTube 썸네일 미리보기"
                  className="w-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <p className="text-xs text-muted-foreground text-center py-1 bg-muted/30">썸네일 미리보기</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setYoutubeDialogOpen(false)}>
              취소
            </Button>
            <Button size="sm" onClick={handleYoutubeInsert} disabled={!youtubeUrl.trim()}>
              삽입
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 링크 다이얼로그 */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link className="w-4 h-4" />
              링크 삽입
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs text-muted-foreground">링크 텍스트 (선택)</Label>
              <Input
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="표시할 텍스트"
                className="mt-1 bg-input"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">URL *</Label>
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                className="mt-1 bg-input"
                onKeyDown={(e) => e.key === "Enter" && handleLinkInsert()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setLinkDialogOpen(false)}>
              취소
            </Button>
            <Button size="sm" onClick={handleLinkInsert} disabled={!linkUrl.trim()}>
              삽입
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── 툴바 버튼 컴포넌트 ──────────────────────────────────────────────────────
interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  loading?: boolean;
  title?: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, active, disabled, loading, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
      className={`
        p-1.5 rounded text-xs transition-colors
        ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}
        ${disabled || loading ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin block" />
      ) : (
        children
      )}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-4 bg-border mx-0.5" />;
}

// ─── 유틸 ────────────────────────────────────────────────────────────────────
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // data:image/png;base64,XXXX → XXXX 부분만 추출
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
