import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, HelpCircle, MessageSquare, Plus, Lock, Globe, CheckCircle, Clock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { MainNav } from "@/components/MainNav";

const LANG_MAP: Record<string, string> = {
  en: "En", zh: "Zh", ja: "Ja", ko: "Ko", vi: "Vi", th: "Th", id: "Id",
  ms: "Ms", ru: "Ru", ar: "Ar", es: "Es", pt: "Pt", fr: "Fr", de: "De",
  it: "It", tr: "Tr", hi: "Hi", pl: "Pl", nl: "Nl", uk: "Uk", tl: "Tl",
};

function getLocalizedField(item: any, fieldBase: string, lang: string): string {
  const suffix = LANG_MAP[lang] ?? "En";
  const key = `${fieldBase}${suffix}`;
  return item[key] || item[fieldBase] || "";
}

export default function FaqQnaPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language?.slice(0, 2) || "en";
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("faq");
  const [openFaqId, setOpenFaqId] = useState<number | null>(null);
  const [askDialogOpen, setAskDialogOpen] = useState(false);
  const [askForm, setAskForm] = useState({
    question: "",
    isPrivate: false,
    category: "general",
    nickname: "",
  });

  // FAQ 데이터
  const { data: faqs, isLoading: faqLoading } = trpc.faq.list.useQuery();
  // Q&A 공개 데이터
  const { data: publicQna, isLoading: qnaLoading } = trpc.qna.listPublic.useQuery();
  // 내 Q&A (로그인 시)
  const { data: myQna } = trpc.qna.listMine.useQuery(undefined, { enabled: !!user });

  // 질문 제출
  const askMutation = trpc.qna.ask.useMutation({
    onSuccess: () => {
      toast.success("질문이 등록되었습니다!");
      setAskDialogOpen(false);
      setAskForm({ question: "", isPrivate: false, category: "general", nickname: "" });
    },
    onError: () => toast.error("질문 등록에 실패했습니다."),
  });

  const handleAsk = () => {
    if (!askForm.question.trim()) {
      toast.error("질문을 입력해주세요.");
      return;
    }
    askMutation.mutate({
      question: askForm.question,
      isPrivate: askForm.isPrivate,
      category: askForm.category,
      nickname: askForm.nickname || undefined,
      userId: user?.id ?? undefined,
    });
  };

  // FAQ 카테고리 목록
  const categories = faqs ? Array.from(new Set(faqs.map((f: any) => f.category))).filter(Boolean) : [];
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const filteredFaqs = faqs?.filter((f: any) => selectedCategory === "all" || f.category === selectedCategory) ?? [];

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold mb-2">FAQ & Q&A</h1>
          <p className="text-muted-foreground text-sm">자주 묻는 질문과 1:1 문의를 확인하세요</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-6 bg-muted/50">
            <TabsTrigger value="faq" className="flex-1 gap-2">
              <HelpCircle className="w-4 h-4" />
              FAQ
              {faqs && <Badge variant="outline" className="ml-1 text-xs px-1.5 py-0 h-4">{faqs.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="qna" className="flex-1 gap-2">
              <MessageSquare className="w-4 h-4" />
              Q&A
            </TabsTrigger>
          </TabsList>

          {/* ── FAQ 탭 ── */}
          <TabsContent value="faq">
            {/* 카테고리 필터 */}
            {categories.length > 1 && (
              <div className="flex flex-wrap gap-2 mb-5">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${selectedCategory === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                >
                  전체
                </button>
                {categories.map((cat: any) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${selectedCategory === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {faqLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-14 rounded-xl bg-muted/30 animate-pulse" />
                ))}
              </div>
            ) : filteredFaqs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <HelpCircle className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">FAQ가 없습니다</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredFaqs.map((faq: any) => {
                  const question = getLocalizedField(faq, "question", lang);
                  const answer = getLocalizedField(faq, "answer", lang);
                  const isOpen = openFaqId === faq.id;
                  return (
                    <div
                      key={faq.id}
                      className="rounded-xl border border-border/40 overflow-hidden transition-all"
                    >
                      <button
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
                        onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-amber-500 text-xs font-bold">Q</span>
                          </div>
                          <span className="font-medium text-sm">{question}</span>
                        </div>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-2" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-2" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 pt-0">
                          <div className="flex gap-3">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-primary text-xs font-bold">A</span>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{answer}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ── Q&A 탭 ── */}
          <TabsContent value="qna">
            <div className="flex justify-between items-center mb-5">
              <p className="text-sm text-muted-foreground">궁금한 점을 질문해보세요</p>
              <Button size="sm" className="gap-2" onClick={() => setAskDialogOpen(true)}>
                <Plus className="w-4 h-4" />
                질문하기
              </Button>
            </div>

            {/* 내 질문 (로그인 시) */}
            {user && myQna && myQna.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-medium text-primary mb-2 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  내 질문 ({myQna.length}건)
                </p>
                <div className="space-y-3">
                  {myQna.map((item: any) => {
                    const question = getLocalizedField(item, "question", lang);
                    const answer = item.answer ? getLocalizedField(item, "answer", lang) : null;
                    return (
                      <div key={item.id} className="rounded-xl border border-border/40 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          {item.isPrivate ? (
                            <Badge variant="outline" className="text-xs border-rose-400/40 text-rose-400">🔒 비밀</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs border-blue-400/40 text-blue-400">🌐 공개</Badge>
                          )}
                          <span className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString("ko-KR")}</span>
                        </div>
                        <p className="text-sm font-medium mb-2">{question}</p>
                        {answer ? (
                          <div className="pl-3 border-l-2 border-emerald-400/40">
                            <p className="text-xs text-emerald-400 font-medium flex items-center gap-1 mb-1">
                              <CheckCircle className="w-3 h-3" />답변 완료
                            </p>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{answer}</p>
                          </div>
                        ) : (
                          <p className="text-xs text-amber-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />답변 대기 중
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 공개 Q&A */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Globe className="w-3 h-3" />
                공개 Q&A
              </p>
              {qnaLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 rounded-xl bg-muted/30 animate-pulse" />
                  ))}
                </div>
              ) : !publicQna || publicQna.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MessageSquare className="w-10 h-10 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground text-sm">아직 공개 Q&A가 없습니다</p>
                  <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={() => setAskDialogOpen(true)}>
                    <Plus className="w-3 h-3" />
                    첫 질문하기
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {publicQna.map((item: any) => {
                    const question = getLocalizedField(item, "question", lang);
                    const answer = item.answer ? getLocalizedField(item, "answer", lang) : null;
                    return (
                      <div key={item.id} className="rounded-xl border border-border/40 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-muted-foreground">{item.nickname ?? "익명"}</span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString("ko-KR")}</span>
                          {item.category && <Badge variant="outline" className="text-xs">{item.category}</Badge>}
                        </div>
                        <p className="text-sm font-medium mb-2">{question}</p>
                        {answer ? (
                          <div className="pl-3 border-l-2 border-emerald-400/40 mt-2">
                            <p className="text-xs text-emerald-400 font-medium flex items-center gap-1 mb-1">
                              <CheckCircle className="w-3 h-3" />답변
                            </p>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{answer}</p>
                          </div>
                        ) : (
                          <p className="text-xs text-amber-400 flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />답변 대기 중
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* 질문 작성 다이얼로그 */}
      <Dialog open={askDialogOpen} onOpenChange={setAskDialogOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              질문하기
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs text-muted-foreground">닉네임 (선택)</Label>
              <Input
                value={askForm.nickname}
                onChange={e => setAskForm(f => ({ ...f, nickname: e.target.value }))}
                placeholder="익명으로 남기려면 비워두세요"
                className="mt-1 bg-input"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">카테고리</Label>
              <Select value={askForm.category} onValueChange={v => setAskForm(f => ({ ...f, category: v }))}>
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
              <Label className="text-xs text-muted-foreground">질문 *</Label>
              <Textarea
                value={askForm.question}
                onChange={e => setAskForm(f => ({ ...f, question: e.target.value }))}
                placeholder="궁금한 점을 자유롭게 작성해주세요..."
                className="mt-1 bg-input resize-none"
                rows={4}
              />
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/40">
              <Switch
                checked={askForm.isPrivate}
                onCheckedChange={v => setAskForm(f => ({ ...f, isPrivate: v }))}
              />
              <div>
                <p className="text-sm font-medium flex items-center gap-1.5">
                  {askForm.isPrivate ? <Lock className="w-3.5 h-3.5 text-rose-400" /> : <Globe className="w-3.5 h-3.5 text-blue-400" />}
                  {askForm.isPrivate ? "비밀 질문 (1:1 문의)" : "공개 질문"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {askForm.isPrivate ? "나와 관리자만 볼 수 있습니다" : "모든 사용자가 볼 수 있습니다"}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAskDialogOpen(false)}>취소</Button>
            <Button
              onClick={handleAsk}
              disabled={!askForm.question.trim() || askMutation.isPending}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              {askMutation.isPending ? "등록 중..." : "질문 등록"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
