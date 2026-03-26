import { useParams } from "wouter";
import { PlanDetailModal } from "@/components/PlanDetailModal";
import { useLocation } from "wouter";

export default function PlanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();

  const planId = parseInt(id || "0", 10);

  if (!planId) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-gray-400">플랜을 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <PlanDetailModal
        planId={planId}
        onClose={() => navigate("/")}
      />
    </div>
  );
}
