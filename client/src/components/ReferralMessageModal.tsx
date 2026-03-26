import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { X, ChevronRight, ChevronDown, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface ReferralMessageModalProps {
  onClose: () => void;
}

export function ReferralMessageModal({ onClose }: ReferralMessageModalProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const { data: messages = [], isLoading } = trpc.public.referralMessages.useQuery();

  const handleCopy = async (content: string, id: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success("추천글이 복사되었습니다!");
    } catch {
      toast.error("복사 실패");
    }
  };

  // 기본 샘플 메시지 (DB 데이터 없을 때)
  const defaultMessages = [
    {
      id: 1,
      emoji: "📊",
      title: "AlphaBag 프로젝트 요약",
      subtitle: "수익구조·사업모델·투자수익·팀 수익 한눈에 보기",
      content: `📊 AlphaBag 프로젝트 완전 요약

📌 사업 배경
AlphaBag은 멀티에셋 커뮤니티 투자 플랫폼으로, 안전한 분산 투자를 통한 장기 자산 성장에 집중합니다.

💰 수익 구조
- Golden Collection: 일일 0.6%~2% 수익
- Self Collection: 자율 투자 상품
- Node Products: 노드 인프라 보상

🚀 지금 시작하기: alphabag.io`,
    },
    {
      id: 2,
      emoji: "🌐",
      title: "글로벌 핀테크 비전",
      subtitle: "AlphaBag 플랫폼 전체 소개 및 핵심 기술 설명",
      content: `🌐 AlphaBag - 글로벌 멀티에셋 플랫폼

AlphaBag은 블록체인 기반 커뮤니티 투자 플랫폼입니다.

✅ 핵심 특징
- 비수탁형 (Non-custodial) 구조
- 일일 수익 자동 정산
- 지갑 연결 즉시 시작 가능

📲 지금 바로 참여하세요!`,
    },
    {
      id: 3,
      emoji: "🎁",
      title: "신규 가입 혜택",
      subtitle: "지금 가입하면 추가 보너스 제공",
      content: `🎁 AlphaBag 신규 가입 특별 혜택!

지금 가입하시면:
✅ 첫 투자 보너스 제공
✅ 추천인 수익 공유
✅ 커뮤니티 전용 이벤트 참여 가능

👉 지금 시작하세요: alphabag.io`,
    },
  ];

  const displayMessages = (messages as any[]).length > 0 ? messages : defaultMessages;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="font-bold text-white text-lg">추천글 선택</div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 목록 */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
            </div>
          ) : (
            displayMessages.map((msg: any) => (
              <div key={msg.id} className="bg-[#1a1a1a] rounded-xl border border-white/5 overflow-hidden">
                {/* 아이템 헤더 */}
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                  onClick={() => setExpandedId(expandedId === msg.id ? null : msg.id)}
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-xl flex-shrink-0">
                    {msg.emoji || "📄"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white text-sm">{msg.title}</div>
                    {msg.subtitle && <div className="text-xs text-gray-500 truncate">{msg.subtitle}</div>}
                  </div>
                  {expandedId === msg.id ? (
                    <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  )}
                </button>

                {/* 확장 콘텐츠 */}
                {expandedId === msg.id && (
                  <div className="px-4 pb-4 border-t border-white/5">
                    <div className="mt-3 p-3 bg-[#0d0d0d] rounded-lg text-xs text-gray-300 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                      {msg.content}
                    </div>
                    <button
                      onClick={() => handleCopy(msg.content, msg.id)}
                      className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium hover:bg-amber-500/30 transition-all"
                    >
                      {copiedId === msg.id ? (
                        <><Check className="w-3.5 h-3.5" /> 복사됨</>
                      ) : (
                        <><Copy className="w-3.5 h-3.5" /> 복사하기</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
