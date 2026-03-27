import { useParams } from "wouter";
import { PlanDetailModal } from "@/components/PlanDetailModal";
import { useLocation } from "wouter";

export default function PlanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();

  const planId = parseInt(id || "0", 10);

  if (!planId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">플랜을 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PlanDetailModal
        planId={planId}
        onClose={() => navigate("/")}
      />
    </div>
  );
}
