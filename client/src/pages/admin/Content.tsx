import { useState, useMemo } from "react";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, FileText, Bell, Image, Megaphone, HelpCircle, MessageSquare, Languages, CheckCircle, Clock, Lock, Globe, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function Content() {
  const [activeTab, setActiveTab] = useState("notices");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; type: string } | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [answerDialogOpen, setAnswerDialogOpen] = useState(false);
  const [answerTarget, setAnswerTarget] = useState<any>(null);
  const [answerText, setAnswerText] = useState("");
  const [translatingId, setTranslatingId] = useState<number | null>(null);
  const [faqCategoryFilter, setFaqCategoryFilter] = useState<string>("all");
  const [qnaStatusFilter, setQnaStatusFilter] = useState<string>("all");
  const [faqOrder, setFaqOrder] = useState<number[]>([]);

  const utils = trpc.useUtils();

  // ── 기존 데이터 쿼리 ────────────────────────────────────────────────────
  const { data: notices } = trpc.content.notices.list.useQuery();
  const { data: announcements } = trpc.content.announcements.list.useQuery();
  const { data: banners } = trpc.content.eventBanners.list.useQuery();
  const { data: adImages } = trpc.content.adImages.list.useQuery();

  // ── FAQ / Q&A 데이터 쿼리 ────────────────────────────────────────────────────
  const { data: faqs, refetch: refetchFaqs } = trpc.faq.listAdmin.useQuery();
  const { data: qnaList, refetch: refetchQna } = trpc.qna.listAdmin.useQuery();

  // ── FAQ 카테고리 목록 (동적 추출) ────────────────────────────────────────────
  const faqCategories = useMemo(() => {
    if (!faqs) return [];
    return Array.from(new Set(faqs.map((f: any) => f.category).filter(Boolean))) as string[];
  }, [faqs]);

  const filteredFaqs = useMemo(() => {
    if (!faqs) return [];
    if (faqCategoryFilter === "all") return faqs;
    return faqs.filter((f: any) => f.category === faqCategoryFilter);
  }, [faqs, faqCategoryFilter]);

  const filteredQna = useMemo(() => {
    if (!qnaList) return [];
    if (qnaStatusFilter === "pending") return qnaList.filter((q: any) => !q.answer);
    if (qnaStatusFilter === "answered") return qnaList.filter((q: any) => q.answer);
    return qnaList;
  }, [qnaList, qnaStatusFilter]);

  // ── 기존 Mutations ────────────────────────────────────────────────────────────
  const createNotice = trpc.content.notices.create.useMutation({ onSuccess: () => { toast.success("공지 생성 완료"); utils.content.notices.list.invalidate(); setDialogOpen(false); } });
  const updateNotice = trpc.content.notices.update.useMutation({ onSuccess: () => { toast.success("수정 완료"); utils.content.notices.list.invalidate(); setDialogOpen(false); } });
  const deleteNotice = trpc.content.notices.delete.useMutation({ onSuccess: () => { toast.success("삭제 완료"); utils.content.notices.list.invalidate(); setDeleteTarget(null); } });
  const translateNotice = trpc.content.notices.translate.useMutation({
    onSuccess: () => { toast.success("번역 완료!"); utils.content.notices.list.invalidate(); setTranslatingId(null); },
    onError: () => { toast.error("번역 실패"); setTranslatingId(null); },
  });

  const createAnnouncement = trpc.content.announcements.create.useMutation({ onSuccess: () => { toast.success("공지 생성 완료"); utils.content.announcements.list.invalidate(); setDialogOpen(false); } });
  const updateAnnouncement = trpc.content.announcements.update.useMutation({ onSuccess: () => { toast.success("수정 완료"); utils.content.announcements.list.invalidate(); setDialogOpen(false); } });
  const deleteAnnouncement = trpc.content.announcements.delete.useMutation({ onSuccess: () => { toast.success("삭제 완료"); utils.content.announcements.list.invalidate(); setDeleteTarget(null); } });

  const createBanner = trpc.content.eventBanners.create.useMutation({ onSuccess: () => { toast.success("배너 생성 완료"); utils.content.eventBanners.list.invalidate(); setDialogOpen(false); } });
  const updateBanner = trpc.content.eventBanners.update.useMutation({ onSuccess: () => { toast.success("수정 완료"); utils.content.eventBanners.list.invalidate(); setDialogOpen(false); } });
  const deleteBanner = trpc.content.eventBanners.delete.useMutation({ onSuccess: () => { toast.success("삭제 완료"); utils.content.eventBanners.list.invalidate(); setDeleteTarget(null); } });

  const createAd = trpc.content.adImages.create.useMutation({ onSuccess: () => { toast.success("광고 생성 완료"); utils.content.adImages.list.invalidate(); setDialogOpen(false); } });
  const updateAd = trpc.content.adImages.update.useMutation({ onSuccess: () => { toast.success("수정 완료"); utils.content.adImages.list.invalidate(); setDialogOpen(false); } });
  const deleteAd = trpc.content.adImages.delete.useMutation({ onSuccess: () => { toast.success("삭제 완료"); utils.content.adImages.list.invalidate(); setDeleteTarget(null); } });

    // ── FAQ Mutations ─────────────────────────────────────────────────────
  const createFaq = trpc.faq.create.useMutation({ onSuccess: () => { toast.success("FAQ 생성 완료"); refetchFaqs(); setDialogOpen(false); } });
  const updateFaq = trpc.faq.update.useMutation({ onSuccess: () => { toast.success("수정 완료"); refetchFaqs(); setDialogOpen(false); } });
  const deleteFaq = trpc.faq.delete.useMutation({ onSuccess: () => { toast.success("삭제 완료"); refetchFaqs(); setDeleteTarget(null); } });
  const translateFaq = trpc.faq.translate.useMutation({
    onSuccess: () => { toast.success("번역 완료!"); refetchFaqs(); setTranslatingId(null); },
    onError: () => { toast.error("번역 실패"); setTranslatingId(null); },
  });
  const reorderFaq = trpc.faq.reorder.useMutation({
    onSuccess: () => { toast.success("순서 저장 완료"); refetchFaqs(); },
    onError: () => toast.error("순서 저장 실패"),
  });

  // DnD 센서
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // faqs 데이터 로드 시 faqOrder 초기화
  useMemo(() => {
    if (faqs && faqOrder.length === 0) setFaqOrder(faqs.map((f: any) => f.id));
  }, [faqs]);

  // 정렬된 FAQ 목록
  const orderedFaqs = useMemo(() => {
    if (!faqs || faqOrder.length === 0) return faqs ?? [];
    const map = new Map(faqs.map((f: any) => [f.id, f]));
    return faqOrder.map(id => map.get(id)).filter(Boolean);
  }, [faqs, faqOrder]);

  const handleFaqDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = faqOrder.indexOf(Number(active.id));
    const newIndex = faqOrder.indexOf(Number(over.id));
    const newOrder = arrayMove(faqOrder, oldIndex, newIndex);
    setFaqOrder(newOrder);
    reorderFaq.mutate({ items: newOrder.map((id, idx) => ({ id, sortOrder: idx })) });
  };

  // ── Q&A Mutations ─────────────────────────────────────────────────────────────
  const answerQna = trpc.qna.answer.useMutation({
    onSuccess: () => { toast.success("답변 저장 완료"); refetchQna(); setAnswerDialogOpen(false); setAnswerTarget(null); setAnswerText(""); },
    onError: () => toast.error("답변 저장 실패"),
  });
  const deleteQna = trpc.qna.delete.useMutation({ onSuccess: () => { toast.success("삭제 완료"); refetchQna(); setDeleteTarget(null); } });

  // ── 공통 핸들러 ──────────────────────────────────────────────────────────────
  const openCreate = (type: string) => {
    setEditing(null);
    setForm({ type, isActive: true, isPinned: false, sortOrder: 0, targetRole: "all", announcementType: "info", position: "sidebar", category: "general", autoTranslate: true });
    setDialogOpen(true);
  };

  const openEdit = (item: any, type: string) => {
    setEditing({ ...item, contentType: type });
    setForm({ ...item, type, announcementType: item.type ?? "info" });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const type = editing?.contentType ?? form.type;
    if (type === "notices") {
      const payload = { title: form.title, content: form.content, isActive: form.isActive ?? true, isPinned: form.isPinned ?? false, sortOrder: Number(form.sortOrder ?? 0) };
      editing ? updateNotice.mutate({ id: editing.id, ...payload }) : createNotice.mutate(payload);
    } else if (type === "announcements") {
      const payload = { title: form.title, content: form.content, type: form.announcementType ?? "info", isActive: form.isActive ?? true, targetRole: form.targetRole ?? "all" };
      editing ? updateAnnouncement.mutate({ id: editing.id, ...payload }) : createAnnouncement.mutate(payload);
    } else if (type === "banners") {
      const payload = { title: form.title, imageUrl: form.imageUrl, linkUrl: form.linkUrl, isActive: form.isActive ?? true, sortOrder: Number(form.sortOrder ?? 0) };
      editing ? updateBanner.mutate({ id: editing.id, ...payload }) : createBanner.mutate(payload);
    } else if (type === "ads") {
      const payload = { title: form.title, imageUrl: form.imageUrl, linkUrl: form.linkUrl, position: form.position ?? "sidebar", isActive: form.isActive ?? true, sortOrder: Number(form.sortOrder ?? 0) };
      editing ? updateAd.mutate({ id: editing.id, ...payload }) : createAd.mutate(payload);
    } else if (type === "faqs") {
      const payload = { question: form.question, answer: form.answer, category: form.category ?? "general", sortOrder: Number(form.sortOrder ?? 0), autoTranslate: form.autoTranslate ?? true };
      if (editing) {
        updateFaq.mutate({ id: editing.id, ...payload });
      } else {
        createFaq.mutate(payload);
      }
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "notices") deleteNotice.mutate({ id: deleteTarget.id });
    else if (deleteTarget.type === "announcements") deleteAnnouncement.mutate({ id: deleteTarget.id });
    else if (deleteTarget.type === "banners") deleteBanner.mutate({ id: deleteTarget.id });
    else if (deleteTarget.type === "ads") deleteAd.mutate({ id: deleteTarget.id });
    else if (deleteTarget.type === "faqs") deleteFaq.mutate({ id: deleteTarget.id });
    else if (deleteTarget.type === "qna") deleteQna.mutate({ id: deleteTarget.id });
  };

  const handleToggle = (id: number, type: string, current: boolean) => {
    if (type === "notices") updateNotice.mutate({ id, isActive: !current });
    else if (type === "announcements") updateAnnouncement.mutate({ id, isActive: !current });
    else if (type === "banners") updateBanner.mutate({ id, isActive: !current });
    else if (type === "ads") updateAd.mutate({ id, isActive: !current });
    else if (type === "faqs") updateFaq.mutate({ id, isActive: !current });
  };

  const handleTranslate = (id: number, type: string, item?: any) => {
    setTranslatingId(id);
    if (type === "notices") translateNotice.mutate({ id, title: item?.title ?? "", content: item?.content ?? "" });
    else if (type === "faqs") translateFaq.mutate({ id });
  };

  const openAnswerDialog = (item: any) => {
    setAnswerTarget(item);
    setAnswerText(item.answer ?? "");
    setAnswerDialogOpen(true);
  };

  // ── 공통 행 컴포넌트 ─────────────────────────────────────────────────────────
  const ContentRow = ({ item, type, icon: Icon }: { item: any; type: string; icon: React.ElementType }) => (
    <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border/40 hover:border-primary/20 transition-all group">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{item.title}</p>
        {item.content && <p className="text-xs text-muted-foreground truncate mt-0.5">{item.content.slice(0, 80)}</p>}
        {item.imageUrl && <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">{item.imageUrl.slice(0, 50)}...</p>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {item.type && <Badge variant="outline" className="text-xs">{item.type}</Badge>}
        {item.isPinned && <Badge className="badge-pending text-xs">Pinned</Badge>}
        <Badge className={item.isActive ? "badge-active" : "badge-inactive"}>{item.isActive ? "Active" : "Off"}</Badge>
        {(type === "notices" || type === "faqs") && (
          <>
            {((type === "notices" && item.titleZh) || (type === "faqs" && item.questionZh)) && (
              <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 border border-emerald-500/30 rounded px-1.5 py-0.5">
                <Globe className="w-2.5 h-2.5" />번역됨
              </span>
            )}
            <Button
              size="sm"
              variant="outline"
              className={`h-6 px-2 text-xs gap-1 ${
                translatingId === item.id ? "opacity-60" :
                ((type === "notices" && item.titleZh) || (type === "faqs" && item.questionZh))
                  ? "border-emerald-500/40 text-emerald-400 hover:text-emerald-300 hover:border-emerald-400"
                  : "border-amber-500/40 text-amber-400 hover:text-amber-300 hover:border-amber-400"
              }`}
              disabled={translatingId === item.id}
              onClick={() => handleTranslate(item.id, type, item)}
            >
              {translatingId === item.id ? (
                <><span className="inline-block animate-spin">&#8635;</span> 번역중...</>
              ) : (
                <><Languages className="w-3 h-3" />
                {((type === "notices" && item.titleZh) || (type === "faqs" && item.questionZh)) ? "재번역" : "번역"}</>
              )}
            </Button>
          </>
        )}
        <button onClick={() => handleToggle(item.id, type, item.isActive)} className="text-muted-foreground hover:text-primary transition-colors">
          {item.isActive ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5" />}
        </button>
        <button onClick={() => openEdit(item, type)} className="text-muted-foreground hover:text-primary transition-colors">
          <Pencil className="w-4 h-4" />
        </button>
        <button onClick={() => setDeleteTarget({ id: item.id, type })} className="text-muted-foreground hover:text-destructive transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  // ──  // ── FAQ Sortable 행 컴포넌트 ───────────────────────────────────────
  const SortableFaqRow = ({ item }: { item: any }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
    return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-3 p-3.5 rounded-xl border border-border/40 hover:border-primary/20 transition-all group">
      <button {...attributes} {...listeners} className="mt-1 text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing flex-shrink-0">
        <GripVertical className="w-4 h-4" />
      </button>
      <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <HelpCircle className="w-4 h-4 text-amber-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{item.question}</p>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.answer}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <Badge variant="outline" className="text-xs">{item.category}</Badge>
          <span className="text-xs text-muted-foreground">순서: {item.sortOrder}</span>
          {item.questionZh && <span className="text-xs text-emerald-400 flex items-center gap-0.5"><Globe className="w-3 h-3" />번역됨</span>}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge className={item.isActive ? "badge-active" : "badge-inactive"}>{item.isActive ? "Active" : "Off"}</Badge>
        <Button
          size="sm"
          variant="outline"
          className="h-6 px-2 text-xs gap-1"
          disabled={translatingId === item.id}
          onClick={() => handleTranslate(item.id, "faqs")}
        >
          <Languages className="w-3 h-3" />
          {translatingId === item.id ? "번역중..." : "번역"}
        </Button>
        <button onClick={() => handleToggle(item.id, "faqs", item.isActive)} className="text-muted-foreground hover:text-primary transition-colors">
          {item.isActive ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5" />}
        </button>
        <button onClick={() => openEdit(item, "faqs")} className="text-muted-foreground hover:text-primary transition-colors">
          <Pencil className="w-4 h-4" />
        </button>
        <button onClick={() => setDeleteTarget({ id: item.id, type: "faqs" })} className="text-muted-foreground hover:text-destructive transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
    );
  };

  // ── Q&A 행 컴포넌트 ──────────────────────────────────────────────────────────
  const QnaRow = ({ item }: { item: any }) => (
    <div className="flex items-start gap-3 p-3.5 rounded-xl border border-border/40 hover:border-primary/20 transition-all group">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${item.isPrivate ? "bg-rose-500/10" : "bg-blue-500/10"}`}>
        {item.isPrivate ? <Lock className="w-4 h-4 text-rose-400" /> : <Globe className="w-4 h-4 text-blue-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className={`text-xs ${item.isPrivate ? "border-rose-400/40 text-rose-400" : "border-blue-400/40 text-blue-400"}`}>
            {item.isPrivate ? "🔒 비밀" : "🌐 공개"}
          </Badge>
          <span className="text-xs text-muted-foreground">{item.nickname ?? `User #${item.userId}`}</span>
          <span className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString("ko-KR")}</span>
        </div>
        <p className="font-medium text-sm">{item.question}</p>
        {item.answer ? (
          <div className="mt-1.5 pl-3 border-l-2 border-emerald-400/40">
            <p className="text-xs text-emerald-400 font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" />답변 완료</p>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.answer}</p>
          </div>
        ) : (
          <p className="text-xs text-amber-400 flex items-center gap-1 mt-1"><Clock className="w-3 h-3" />미답변</p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button size="sm" variant="outline" className="h-7 px-2 text-xs gap-1" onClick={() => openAnswerDialog(item)}>
          <MessageSquare className="w-3 h-3" />
          {item.answer ? "수정" : "답변"}
        </Button>
        <button onClick={() => setDeleteTarget({ id: item.id, type: "qna" })} className="text-muted-foreground hover:text-destructive transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const tabConfig = [
    { value: "notices", label: "공지사항", icon: FileText, data: notices, count: notices?.length ?? 0 },
    { value: "faqs", label: "FAQ", icon: HelpCircle, data: faqs, count: faqs?.length ?? 0 },
    { value: "qna", label: "Q&A", icon: MessageSquare, data: qnaList, count: qnaList?.length ?? 0 },
    { value: "announcements", label: "Announcements", icon: Megaphone, data: announcements, count: announcements?.length ?? 0 },
    { value: "banners", label: "Banners", icon: Image, data: banners, count: banners?.length ?? 0 },
    { value: "ads", label: "Ads", icon: Bell, data: adImages, count: adImages?.length ?? 0 },
  ];

  return (
    <AdminLayout title="Content Management">
      <div className="space-y-5">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <TabsList className="bg-muted/50 flex-wrap h-auto gap-1">
              {tabConfig.map(t => (
                <TabsTrigger key={t.value} value={t.value} className="gap-1.5 text-xs">
                  <t.icon className="w-3.5 h-3.5" />
                  {t.label}
                  <Badge variant="outline" className="ml-0.5 text-xs px-1.5 py-0 h-4">{t.count}</Badge>
                </TabsTrigger>
              ))}
            </TabsList>
            {activeTab !== "qna" && (
              <Button onClick={() => openCreate(activeTab)} className="gap-2">
                <Plus className="w-4 h-4" />
                추가
              </Button>
            )}
          </div>

          {/* 공지사항 / Announcements / Banners / Ads 탭 */}
          {["notices", "announcements", "banners", "ads"].map(tabValue => {
            const tab = tabConfig.find(t => t.value === tabValue)!;
            return (
              <TabsContent key={tabValue} value={tabValue} className="mt-4">
                <Card className="border-border/40">
                  <CardContent className="p-4">
                    {tab.data && tab.data.length > 0 ? (
                      <div className="space-y-2">
                        {tab.data.map((item: any) => (
                          <ContentRow key={item.id} item={item} type={tabValue} icon={tab.icon} />
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <tab.icon className="w-10 h-10 text-muted-foreground/30 mb-3" />
                        <p className="text-muted-foreground text-sm">항목이 없습니다</p>
                        <Button variant="outline" size="sm" onClick={() => openCreate(tabValue)} className="mt-3 gap-2">
                          <Plus className="w-3 h-3" />
                          첫 항목 추가
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}

          {/* FAQ 탭 */}
          <TabsContent value="faqs" className="mt-4">
            <Card className="border-border/40">
              <CardContent className="p-4">
                {/* 카테고리 필터 */}
                {faqCategories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4 pb-3 border-b border-border/30">
                    <button
                      onClick={() => setFaqCategoryFilter("all")}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        faqCategoryFilter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      전체 ({faqs?.length ?? 0})
                    </button>
                    {faqCategories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setFaqCategoryFilter(cat)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          faqCategoryFilter === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {{ general: "일반", investment: "투자", account: "계정", payment: "결제", technical: "기술" }[cat] ?? cat} ({faqs?.filter((f: any) => f.category === cat).length ?? 0})
                      </button>
                    ))}
                  </div>
                )}
                {orderedFaqs.length > 0 ? (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleFaqDragEnd}>
                    <SortableContext items={orderedFaqs.map((f: any) => f.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2">
                        {(faqCategoryFilter === "all" ? orderedFaqs : orderedFaqs.filter((f: any) => f.category === faqCategoryFilter)).map((item: any) => (
                          <SortableFaqRow key={item.id} item={item} />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <HelpCircle className="w-10 h-10 text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground text-sm">FAQ가 없습니다</p>
                    <Button variant="outline" size="sm" onClick={() => openCreate("faqs")} className="mt-3 gap-2">
                      <Plus className="w-3 h-3" />
                      첫 FAQ 추가
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Q&A 탭 */}
          <TabsContent value="qna" className="mt-4">
            <Card className="border-border/40">
              <CardContent className="p-4">
                {/* 상태 필터 */}
                <div className="flex flex-wrap gap-1.5 mb-4 pb-3 border-b border-border/30">
                  {[
                    { value: "all", label: `전체 (${qnaList?.length ?? 0})` },
                    { value: "pending", label: `미답변 (${qnaList?.filter((q: any) => !q.answer).length ?? 0})` },
                    { value: "answered", label: `답변완료 (${qnaList?.filter((q: any) => q.answer).length ?? 0})` },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setQnaStatusFilter(opt.value)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        qnaStatusFilter === opt.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {filteredQna.length > 0 ? (
                  <div className="space-y-2">
                    {filteredQna.map((item: any) => (
                      <QnaRow key={item.id} item={item} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <MessageSquare className="w-10 h-10 text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground text-sm">Q&A 질문이 없습니다</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editing ? "수정" : "추가"} — {form.type === "faqs" ? "FAQ" : form.type === "notices" ? "공지사항" : form.type}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* FAQ 전용 폼 */}
            {form.type === "faqs" ? (
              <>
                <div>
                  <Label className="text-xs text-muted-foreground">질문 *</Label>
                  <Textarea value={form.question ?? ""} onChange={e => setForm((f: any) => ({ ...f, question: e.target.value }))} className="mt-1 bg-input resize-none" rows={3} placeholder="질문을 입력하세요" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">답변 *</Label>
                  <Textarea value={form.answer ?? ""} onChange={e => setForm((f: any) => ({ ...f, answer: e.target.value }))} className="mt-1 bg-input resize-none" rows={4} placeholder="답변을 입력하세요" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">카테고리</Label>
                    <Select value={form.category ?? "general"} onValueChange={v => setForm((f: any) => ({ ...f, category: v }))}>
                      <SelectTrigger className="mt-1 bg-input"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="general">일반</SelectItem>
                        <SelectItem value="investment">투자</SelectItem>
                        <SelectItem value="account">계정</SelectItem>
                        <SelectItem value="payment">결제</SelectItem>
                        <SelectItem value="technical">기술</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">정렬 순서</Label>
                    <Input type="number" value={form.sortOrder ?? 0} onChange={e => setForm((f: any) => ({ ...f, sortOrder: Number(e.target.value) }))} className="mt-1 bg-input" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={form.autoTranslate ?? true} onCheckedChange={v => setForm((f: any) => ({ ...f, autoTranslate: v }))} />
                  <Label className="text-sm flex items-center gap-1"><Languages className="w-3.5 h-3.5" />저장 시 21개 언어 자동 번역</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={form.isActive ?? true} onCheckedChange={v => setForm((f: any) => ({ ...f, isActive: v }))} />
                  <Label className="text-sm">활성화</Label>
                </div>
              </>
            ) : (
              <>
                {/* 기존 폼 */}
                <div>
                  <Label className="text-xs text-muted-foreground">제목 *</Label>
                  <Input value={form.title ?? ""} onChange={e => setForm((f: any) => ({ ...f, title: e.target.value }))} className="mt-1 bg-input" />
                </div>

                {(form.type === "notices" || form.type === "announcements") && (
                  <div>
                    <Label className="text-xs text-muted-foreground">내용 *</Label>
                    <Textarea value={form.content ?? ""} onChange={e => setForm((f: any) => ({ ...f, content: e.target.value }))} className="mt-1 bg-input resize-none" rows={4} />
                  </div>
                )}

                {(form.type === "banners" || form.type === "ads") && (
                  <>
                    <div>
                      <Label className="text-xs text-muted-foreground">이미지 URL *</Label>
                      <Input value={form.imageUrl ?? ""} onChange={e => setForm((f: any) => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." className="mt-1 bg-input" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">링크 URL</Label>
                      <Input value={form.linkUrl ?? ""} onChange={e => setForm((f: any) => ({ ...f, linkUrl: e.target.value }))} placeholder="https://..." className="mt-1 bg-input" />
                    </div>
                  </>
                )}

                {form.type === "announcements" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">타입</Label>
                      <Select value={form.announcementType ?? "info"} onValueChange={v => setForm((f: any) => ({ ...f, announcementType: v }))}>
                        <SelectTrigger className="mt-1 bg-input"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          <SelectItem value="info">Info</SelectItem>
                          <SelectItem value="warning">Warning</SelectItem>
                          <SelectItem value="success">Success</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">대상</Label>
                      <Select value={form.targetRole ?? "all"} onValueChange={v => setForm((f: any) => ({ ...f, targetRole: v }))}>
                        <SelectTrigger className="mt-1 bg-input"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          <SelectItem value="all">전체</SelectItem>
                          <SelectItem value="user">일반 유저</SelectItem>
                          <SelectItem value="admin">관리자</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {form.type === "ads" && (
                  <div>
                    <Label className="text-xs text-muted-foreground">위치</Label>
                    <Select value={form.position ?? "sidebar"} onValueChange={v => setForm((f: any) => ({ ...f, position: v }))}>
                      <SelectTrigger className="mt-1 bg-input"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="sidebar">Sidebar</SelectItem>
                        <SelectItem value="header">Header</SelectItem>
                        <SelectItem value="footer">Footer</SelectItem>
                        <SelectItem value="popup">Popup</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {form.type === "notices" && (
                  <div className="flex items-center gap-3">
                    <Switch checked={form.isPinned ?? false} onCheckedChange={v => setForm((f: any) => ({ ...f, isPinned: v }))} />
                    <Label className="text-sm">상단 고정</Label>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Switch checked={form.isActive ?? true} onCheckedChange={v => setForm((f: any) => ({ ...f, isActive: v }))} />
                  <Label className="text-sm">활성화</Label>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>취소</Button>
            <Button onClick={handleSubmit}>{editing ? "수정" : "저장"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Q&A 답변 다이얼로그 */}
      <Dialog open={answerDialogOpen} onOpenChange={setAnswerDialogOpen}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Q&A 답변 작성
            </DialogTitle>
          </DialogHeader>
          {answerTarget && (
            <div className="space-y-4 py-2">
              <div className="p-3 rounded-lg bg-muted/30 border border-border/40">
                <div className="flex items-center gap-2 mb-1.5">
                  {answerTarget.isPrivate ? <Lock className="w-3.5 h-3.5 text-rose-400" /> : <Globe className="w-3.5 h-3.5 text-blue-400" />}
                  <span className="text-xs text-muted-foreground">{answerTarget.nickname ?? `User #${answerTarget.userId}`}</span>
                  <Badge variant="outline" className="text-xs">{answerTarget.category}</Badge>
                </div>
                <p className="text-sm font-medium">{answerTarget.question}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">답변 *</Label>
                <Textarea
                  value={answerText}
                  onChange={e => setAnswerText(e.target.value)}
                  className="mt-1 bg-input resize-none"
                  rows={5}
                  placeholder="답변을 입력하세요..."
                />
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Languages className="w-3 h-3" />
                저장 시 21개 언어로 자동 번역됩니다
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnswerDialogOpen(false)}>취소</Button>
            <Button
              onClick={() => answerTarget && answerQna.mutate({ id: answerTarget.id, answer: answerText, autoTranslate: true })}
              disabled={!answerText.trim() || answerQna.isPending}
            >
              {answerQna.isPending ? "저장 중..." : "답변 저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>삭제 확인</AlertDialogTitle>
            <AlertDialogDescription>이 작업은 되돌릴 수 없습니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive" onClick={handleDelete}>삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
