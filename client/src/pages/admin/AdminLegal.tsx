import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { ScrollText, Sparkles, Save, Globe, FileText, Shield } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const LANGUAGES = [
  { code: "ko", name: "한국어" },
  { code: "en", name: "English" },
  { code: "zh", name: "中文" },
  { code: "ja", name: "日本語" },
  { code: "vi", name: "Tiếng Việt" },
  { code: "th", name: "ภาษาไทย" },
  { code: "id", name: "Bahasa Indonesia" },
  { code: "ms", name: "Bahasa Melayu" },
  { code: "ru", name: "Русский" },
  { code: "ar", name: "العربية" },
  { code: "es", name: "Español" },
  { code: "pt", name: "Português" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "it", name: "Italiano" },
  { code: "tr", name: "Türkçe" },
  { code: "hi", name: "हिंदी" },
  { code: "pl", name: "Polski" },
  { code: "nl", name: "Nederlands" },
  { code: "uk", name: "Українська" },
  { code: "tl", name: "Filipino" },
];

function LegalEditor({ docType }: { docType: "terms" | "privacy" }) {
  const [language, setLanguage] = useState("ko");
  const [content, setContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: doc, isLoading, refetch } = trpc.legal.getDocument.useQuery(
    { type: docType, language },
    {
      onSuccess: (data: { content?: string } | null) => {
        setContent(data?.content ?? "");
      },
    } as any
  );

  const updateMutation = trpc.legal.updateDocument.useMutation({
    onSuccess: () => {
      toast.success(`${docType === "terms" ? "이용약관" : "개인정보처리방침"}이 저장되었습니다.`);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const autoGenerateMutation = trpc.legal.autoGenerate.useMutation({
    onSuccess: (data) => {
      setContent(data.content);
      toast.success("AI가 문서를 생성했습니다. 내용을 검토 후 저장하세요.");
      setIsGenerating(false);
    },
    onError: (e) => {
      toast.error(e.message);
      setIsGenerating(false);
    },
  });

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    setContent("");
  };

  const handleAutoGenerate = () => {
    setIsGenerating(true);
    autoGenerateMutation.mutate({ type: docType, language });
  };

  const handleSave = () => {
    updateMutation.mutate({ type: docType, language, content });
  };

  const langName = LANGUAGES.find(l => l.code === language)?.name ?? language;

  return (
    <div className="space-y-4">
      {/* 언어 선택 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-amber-400" />
          <Label className="text-sm text-gray-300">언어 선택</Label>
        </div>
        <Select value={language} onValueChange={handleLanguageChange}>
          <SelectTrigger className="w-48 bg-gray-800 border-gray-600 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-600">
            {LANGUAGES.map(l => (
              <SelectItem key={l.code} value={l.code} className="text-white hover:bg-gray-700">
                {l.name} ({l.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-gray-500">
          {doc?.updatedAt ? `마지막 수정: ${new Date(doc.updatedAt).toLocaleString("ko-KR")}` : "아직 내용 없음"}
        </span>
      </div>

      {/* AI 자동 생성 버튼 */}
      <Card className="bg-gray-800/50 border-amber-500/30">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                AI 자동 생성
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                AlphaBag 플랫폼에 맞는 {docType === "terms" ? "이용약관" : "개인정보처리방침"}을 {langName}로 AI가 자동 작성합니다.
              </p>
            </div>
            <Button
              onClick={handleAutoGenerate}
              disabled={isGenerating || autoGenerateMutation.isPending}
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 shrink-0"
              variant="outline"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {isGenerating ? "생성 중..." : `${langName}로 AI 생성`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 에디터 */}
      <div className="space-y-2">
        <Label className="text-sm text-gray-300">
          문서 내용 (Markdown 지원)
        </Label>
        <Textarea
          value={isLoading ? "로딩 중..." : content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`${docType === "terms" ? "이용약관" : "개인정보처리방침"} 내용을 입력하세요. Markdown 형식을 지원합니다.`}
          className="bg-gray-800 border-gray-600 text-white min-h-[400px] font-mono text-sm resize-y"
          disabled={isLoading || isGenerating}
        />
        <p className="text-xs text-gray-500">
          {content.length.toLocaleString()} 자
        </p>
      </div>

      {/* 저장 버튼 */}
      <Button
        onClick={handleSave}
        disabled={updateMutation.isPending || isLoading || !content}
        className="bg-amber-500 hover:bg-amber-400 text-black font-semibold w-full"
      >
        <Save className="w-4 h-4 mr-2" />
        {updateMutation.isPending ? "저장 중..." : `${langName} 버전 저장`}
      </Button>
    </div>
  );
}

export default function AdminLegal() {
  return (
    <AdminLayout title="법적 문서 관리">
      <div className="p-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ScrollText className="w-6 h-6 text-amber-400" />
            법적 문서 관리
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            이용약관 및 개인정보처리방침을 21개 언어로 관리합니다. AI 자동 생성 기능을 활용하세요.
          </p>
        </div>

        <Tabs defaultValue="terms">
          <TabsList className="bg-gray-800 border border-gray-700 mb-6">
            <TabsTrigger value="terms" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black">
              <FileText className="w-4 h-4 mr-2" />
              이용약관 (Terms)
            </TabsTrigger>
            <TabsTrigger value="privacy" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black">
              <Shield className="w-4 h-4 mr-2" />
              개인정보처리방침 (Privacy)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="terms">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  이용약관 편집
                </CardTitle>
                <CardDescription>
                  /terms 페이지에 표시되는 이용약관을 언어별로 편집합니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LegalEditor docType="terms" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-400" />
                  개인정보처리방침 편집
                </CardTitle>
                <CardDescription>
                  /privacy 페이지에 표시되는 개인정보처리방침을 언어별로 편집합니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LegalEditor docType="privacy" />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
