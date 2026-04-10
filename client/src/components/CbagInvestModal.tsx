import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Shield, TrendingUp, Info, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

interface CbagInvestModalProps {
  open: boolean;
  onClose: () => void;
  mainPlanId: number;
  mainPlanName: string;
  mainAmount: string;
  onConfirm: (cbagPlanId?: number, cbagPercent?: string) => void;
  isPending?: boolean;
}

export function CbagInvestModal({
  open,
  onClose,
  mainPlanId,
  mainPlanName,
  mainAmount,
  onConfirm,
  isPending = false,
}: CbagInvestModalProps) {
  const [addCbag, setAddCbag] = useState<boolean | null>(null);
  const [percent, setPercent] = useState(10);
  const [selectedCbagPlanId, setSelectedCbagPlanId] = useState<number | null>(null);

  const { data: cbagSettings } = trpc.cbag.settings.useQuery();
  const { data: cbagPlans = [] } = trpc.cbag.plans.useQuery();

  const mainAmountNum = parseFloat(mainAmount) || 0;
  const cbagAmount = ((mainAmountNum * percent) / 100).toFixed(2);
  const totalAmount = (mainAmountNum + parseFloat(cbagAmount)).toFixed(2);

  const minPct = parseFloat(cbagSettings?.minPercent || "1");
  const maxPct = parseFloat(cbagSettings?.maxPercent || "50");
  const defaultPct = parseFloat(cbagSettings?.defaultPercent || "10");

  const handleSkip = () => {
    onConfirm(undefined, undefined);
  };

  const handleConfirmWithCbag = () => {
    if (!selectedCbagPlanId && (cbagPlans as any[]).length > 0) {
      // 첫 번째 CBAG 상품 자동 선택
      const firstPlan = (cbagPlans as any[])[0];
      onConfirm(firstPlan.id, percent.toString());
    } else if (selectedCbagPlanId) {
      onConfirm(selectedCbagPlanId, percent.toString());
    } else {
      // CBAG 상품이 없으면 그냥 진행
      onConfirm(undefined, undefined);
    }
  };

  const cbagName = cbagSettings?.name || "C-BAG Insurance";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md bg-[#0d1117] border border-cyan-500/30 text-white">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-cyan-400" />
            </div>
            <DialogTitle className="text-white text-lg">{cbagName}</DialogTitle>
          </div>
          <DialogDescription className="text-gray-400 text-sm">
            {cbagSettings?.subtitle || "Crypto Bag Insurance Collection"}
          </DialogDescription>
        </DialogHeader>

        {addCbag === null && (
          <div className="space-y-4">
            {/* 투자 요약 */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="text-xs text-gray-400 mb-2">투자 요약</div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">{mainPlanName}</span>
                <span className="font-bold text-white">${parseFloat(mainAmount).toLocaleString()} USDT</span>
              </div>
            </div>

            {/* CBAG 소개 */}
            <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl p-4 border border-cyan-500/20">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-cyan-300 mb-1">보험 컬렉션 추가</p>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {cbagSettings?.description || "투자금의 일부를 CBAG 보험으로 운용하여 손실 위험을 분산하고 안정적인 수익을 추구합니다."}
                  </p>
                </div>
              </div>
            </div>

            {/* 선택 버튼 */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => setAddCbag(true)}
                className="bg-cyan-600 hover:bg-cyan-500 text-white h-14 flex-col gap-1"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs">CBAG 추가하기</span>
              </Button>
              <Button
                onClick={handleSkip}
                variant="outline"
                className="border-white/20 text-gray-300 hover:bg-white/10 h-14 flex-col gap-1"
                disabled={isPending}
              >
                <XCircle className="w-4 h-4" />
                <span className="text-xs">건너뛰기</span>
              </Button>
            </div>
          </div>
        )}

        {addCbag === true && (
          <div className="space-y-4">
            {/* CBAG 상품 선택 */}
            {(cbagPlans as any[]).length > 0 && (
              <div>
                <div className="text-xs text-gray-400 mb-2">CBAG 상품 선택</div>
                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {(cbagPlans as any[]).map((plan: any) => (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedCbagPlanId(plan.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
                        selectedCbagPlanId === plan.id || (!selectedCbagPlanId && plan.id === (cbagPlans as any[])[0]?.id)
                          ? "border-cyan-500 bg-cyan-500/10"
                          : "border-white/10 bg-white/5 hover:border-white/30"
                      }`}
                    >
                      <div>
                        <div className="text-sm font-medium text-white">{plan.name}</div>
                        <div className="text-xs text-gray-400">일일 {Number(plan.dailyRate).toFixed(2)}%</div>
                      </div>
                      <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-300 text-xs">
                        {Number(plan.dailyRate).toFixed(2)}%/day
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 비율 슬라이더 */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-400">투자금 대비 CBAG 비율</span>
                <span className="text-lg font-bold text-cyan-400">{percent}%</span>
              </div>
              <Slider
                min={minPct}
                max={maxPct}
                step={1}
                value={[percent]}
                onValueChange={([v]) => setPercent(v)}
                className="mb-3"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{minPct}%</span>
                <span>{maxPct}%</span>
              </div>
            </div>

            {/* 금액 요약 */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">메인 투자</span>
                <span className="text-white">${parseFloat(mainAmount).toLocaleString()} USDT</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-cyan-400">CBAG 보험 ({percent}%)</span>
                <span className="text-cyan-300">+${parseFloat(cbagAmount).toLocaleString()} USDT</span>
              </div>
              <div className="border-t border-white/10 pt-2 flex justify-between font-bold">
                <span className="text-gray-300">총 투자금</span>
                <span className="text-white">${parseFloat(totalAmount).toLocaleString()} USDT</span>
              </div>
            </div>

            {/* 확인/취소 */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => setAddCbag(null)}
                variant="outline"
                className="border-white/20 text-gray-300 hover:bg-white/10"
              >
                뒤로
              </Button>
              <Button
                onClick={handleConfirmWithCbag}
                className="bg-cyan-600 hover:bg-cyan-500 text-white"
                disabled={isPending}
              >
                {isPending ? "처리 중..." : "투자 확정"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
