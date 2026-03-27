import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function AdminMyAccount() {
  const adminName = localStorage.getItem("admin_name") || "관리자";
  const adminRole = localStorage.getItem("admin_role") || "admin";

  const { data: me } = trpc.adminAuth.me.useQuery();

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [loading, setLoading] = useState(false);

  const changePasswordMutation = trpc.adminAuth.changePassword.useMutation({
    onSuccess: () => {
      toast.success("비밀번호가 변경되었습니다.");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setLoading(false);
    },
    onError: (err) => {
      toast.error(err.message || "비밀번호 변경에 실패했습니다.");
      setLoading(false);
    },
  });

  const handleChangePassword = () => {
    if (!newPw || newPw.length < 6) {
      toast.error("새 비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    if (newPw !== confirmPw) {
      toast.error("새 비밀번호와 확인 비밀번호가 일치하지 않습니다.");
      return;
    }
    if (!me?.id) {
      toast.error("계정 정보를 불러올 수 없습니다.");
      return;
    }
    setLoading(true);
    changePasswordMutation.mutate({ id: me.id, newPassword: newPw });
  };

  return (
    <AdminLayout title="내 계정 설정">
      <div style={{ maxWidth: 520, margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>

        {/* 계정 정보 카드 */}
        <div className="ab-card">
          <div className="ab-card-header">
            <h2 className="ab-card-title">계정 정보</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0", borderBottom: "1px solid oklch(0.20 0.01 240)" }}>
              <span style={{ fontSize: "0.8rem", color: "oklch(0.65 0.01 240)" }}>사용자명</span>
              <span style={{ fontSize: "0.9rem", color: "oklch(0.90 0.01 240)", fontWeight: 600 }}>{me?.username || adminName}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0", borderBottom: "1px solid oklch(0.20 0.01 240)" }}>
              <span style={{ fontSize: "0.8rem", color: "oklch(0.65 0.01 240)" }}>권한</span>
              <span style={{
                fontSize: "0.75rem", fontWeight: 700, padding: "0.2rem 0.6rem",
                borderRadius: 4,
                background: adminRole === "admin" ? "oklch(0.72 0.18 55 / 0.15)" : "oklch(0.55 0.15 250 / 0.15)",
                color: adminRole === "admin" ? "oklch(0.72 0.18 55)" : "oklch(0.65 0.18 250)",
                border: `1px solid ${adminRole === "admin" ? "oklch(0.72 0.18 55 / 0.3)" : "oklch(0.55 0.15 250 / 0.3)"}`,
              }}>
                {adminRole === "admin" ? "슈퍼 관리자" : "부 관리자"}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0" }}>
              <span style={{ fontSize: "0.8rem", color: "oklch(0.65 0.01 240)" }}>계정 ID</span>
              <span style={{ fontSize: "0.85rem", color: "oklch(0.55 0.01 240)", fontFamily: "monospace" }}>#{me?.id ?? "—"}</span>
            </div>
          </div>
        </div>

        {/* 비밀번호 변경 카드 */}
        <div className="ab-card">
          <div className="ab-card-header">
            <h2 className="ab-card-title">비밀번호 변경</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="ab-form-group">
              <label className="ab-label">새 비밀번호</label>
              <input
                type="password"
                className="ab-input"
                placeholder="새 비밀번호 (6자 이상)"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="ab-form-group">
              <label className="ab-label">새 비밀번호 확인</label>
              <input
                type="password"
                className="ab-input"
                placeholder="새 비밀번호 재입력"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            {newPw && confirmPw && newPw !== confirmPw && (
              <p style={{ fontSize: "0.78rem", color: "oklch(0.65 0.2 25)", margin: 0 }}>
                비밀번호가 일치하지 않습니다.
              </p>
            )}
            <button
              className="ab-btn ab-btn-primary"
              onClick={handleChangePassword}
              disabled={loading || !newPw || !confirmPw || newPw !== confirmPw}
              style={{ marginTop: "0.25rem" }}
            >
              {loading ? "변경 중..." : "비밀번호 변경"}
            </button>
          </div>
        </div>

        {/* 보안 안내 */}
        <div style={{
          padding: "1rem",
          background: "oklch(0.72 0.18 55 / 0.06)",
          border: "1px solid oklch(0.72 0.18 55 / 0.2)",
          borderRadius: 8,
        }}>
          <p style={{ fontSize: "0.78rem", color: "oklch(0.65 0.01 240)", margin: 0, lineHeight: 1.6 }}>
            보안을 위해 정기적으로 비밀번호를 변경하세요. 비밀번호는 6자 이상이어야 하며, 영문·숫자·특수문자를 조합하면 더욱 안전합니다.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
