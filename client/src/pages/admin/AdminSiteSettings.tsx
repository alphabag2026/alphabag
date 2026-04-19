import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Share2, Send, Twitter, Youtube, Save, ExternalLink } from "lucide-react";

export default function AdminSiteSettings() {
  const { data: socialLinks, isLoading, refetch } = trpc.settings.getSocialLinks.useQuery();
  const updateMutation = trpc.settings.updateSocialLinks.useMutation({
    onSuccess: () => {
      toast.success("소셜 링크가 업데이트되었습니다.");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const [telegram, setTelegram] = useState("");
  const [twitter, setTwitter] = useState("");
  const [youtube, setYoutube] = useState("");

  useEffect(() => {
    if (socialLinks) {
      setTelegram(socialLinks.telegramUrl ?? "");
      setTwitter(socialLinks.twitterUrl ?? "");
      setYoutube(socialLinks.youtubeUrl ?? "");
    }
  }, [socialLinks]);

  const handleSave = () => {
    updateMutation.mutate({
      telegramUrl: telegram || undefined,
      twitterUrl: twitter || undefined,
      youtubeUrl: youtube || undefined,
    });
  };

  return (
    <AdminLayout title="소셜 링크 설정">
      <div className="p-6 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Share2 className="w-6 h-6 text-amber-400" />
            소셜 링크 설정
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            홈페이지 푸터에 표시되는 소셜 미디어 링크를 관리합니다.
          </p>
        </div>

        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-base">소셜 미디어 URL</CardTitle>
            <CardDescription>각 플랫폼의 공식 채널 URL을 입력하세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Telegram */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-blue-400">
                <Send className="w-4 h-4" />
                텔레그램 (Telegram)
              </Label>
              <div className="flex gap-2">
                <Input
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  placeholder="https://t.me/alphabag_official"
                  className="bg-gray-800 border-gray-600 text-white"
                  disabled={isLoading}
                />
                {telegram && (
                  <a href={telegram} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="icon" className="border-gray-600 shrink-0">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                )}
              </div>
            </div>

            {/* Twitter / X */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-gray-300">
                <Twitter className="w-4 h-4" />
                X (Twitter)
              </Label>
              <div className="flex gap-2">
                <Input
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="https://twitter.com/alphabag_io"
                  className="bg-gray-800 border-gray-600 text-white"
                  disabled={isLoading}
                />
                {twitter && (
                  <a href={twitter} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="icon" className="border-gray-600 shrink-0">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                )}
              </div>
            </div>

            {/* YouTube */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-red-400">
                <Youtube className="w-4 h-4" />
                유튜브 (YouTube)
              </Label>
              <div className="flex gap-2">
                <Input
                  value={youtube}
                  onChange={(e) => setYoutube(e.target.value)}
                  placeholder="https://youtube.com/@alphabag"
                  className="bg-gray-800 border-gray-600 text-white"
                  disabled={isLoading}
                />
                {youtube && (
                  <a href={youtube} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="icon" className="border-gray-600 shrink-0">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                )}
              </div>
            </div>

            <div className="pt-2">
              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending || isLoading}
                className="bg-amber-500 hover:bg-amber-400 text-black font-semibold w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                {updateMutation.isPending ? "저장 중..." : "저장하기"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 미리보기 */}
        <Card className="mt-4 bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-base text-gray-400">현재 적용된 링크 미리보기</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              {telegram && (
                <a href={telegram} target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-blue-500/20 text-gray-400 hover:text-blue-400 flex items-center justify-center transition-colors"
                  title="Telegram">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                </a>
              )}
              {twitter && (
                <a href={twitter} target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
                  title="X">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              )}
              {youtube && (
                <a href={youtube} target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 flex items-center justify-center transition-colors"
                  title="YouTube">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
