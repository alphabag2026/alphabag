import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Plus, Trash2, Bell, X, Send } from "lucide-react";
import { toast } from "sonner";

interface NotifForm {
  title: string;
  message: string;
  type: string;
  targetRole: string;
}

const EMPTY_FORM: NotifForm = { title: "", message: "", type: "info", targetRole: "all" };

export default function AdminNotifications() {
  const [modal, setModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"list" | "bulk">("list");
  const [form, setForm] = useState<NotifForm>(EMPTY_FORM);

  const utils = trpc.useUtils();
  const { data: notifications = [], isLoading } = trpc.notifications.list.useQuery();

  const createMutation = trpc.notifications.create.useMutation({
    onSuccess: () => { utils.notifications.list.invalidate(); setModal(false); toast.success("알림이 생성되었습니다."); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.notifications.delete.useMutation({
    onSuccess: () => { utils.notifications.list.invalidate(); toast.success("알림이 삭제되었습니다."); },
    onError: (e) => toast.error(e.message),
  });

  const TYPE_COLORS: Record<string, string> = {
    info: "ab-badge-blue",
    warning: "ab-badge-gold",
    success: "ab-badge-green",
    error: "ab-badge-red",
  };

  return (
    <AdminLayout title="Notifications">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div>
          <div className="ab-page-title">Notifications</div>
          <div className="ab-page-desc">사용자 알림 관리</div>
        </div>
        <button className="ab-btn ab-btn-gold" onClick={() => { setForm(EMPTY_FORM); setModal(true); }}>
          <Plus size={14} /> 알림 생성
        </button>
      </div>

      {/* 탭 */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--ab-border)", marginBottom: "1.5rem" }}>
        {[{ id: "list", label: "알림 목록" }, { id: "bulk", label: "일괄 발송" }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            style={{ padding: "0.5rem 1.25rem", fontSize: 13, fontWeight: 600, borderBottom: activeTab === tab.id ? "2px solid #f59e0b" : "2px solid transparent", color: activeTab === tab.id ? "#f59e0b" : "var(--ab-muted)", background: "none", cursor: "pointer" }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* 일괄 발송 탭 */}
      {activeTab === "bulk" && (
        <div style={{ maxWidth: 520 }}>
          <div style={{ background: "var(--ab-card)", border: "1px solid var(--ab-border)", borderRadius: 12, padding: "1.5rem" }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: 6 }}>
              <Send size={14} /> 일괄 메시지 발송
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div>
                <label style={{ fontSize: 12, color: "var(--ab-muted)", display: "block", marginBottom: 4 }}>대상 필터</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {[{ v: "all", l: "전체 사용자" }, { v: "user", l: "일반 사용자" }, { v: "admin", l: "관리자" }].map(opt => (
                    <button key={opt.v} onClick={() => setForm(f => ({ ...f, targetRole: opt.v }))}
                      style={{ padding: "0.3rem 0.75rem", borderRadius: 20, fontSize: 12, fontWeight: 600, border: "1px solid", borderColor: form.targetRole === opt.v ? "#f59e0b" : "var(--ab-border)", background: form.targetRole === opt.v ? "#f59e0b20" : "transparent", color: form.targetRole === opt.v ? "#f59e0b" : "var(--ab-muted)", cursor: "pointer" }}>
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--ab-muted)", display: "block", marginBottom: 4 }}>제목</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="알림 제목" style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--ab-border)", background: "var(--ab-bg)", color: "var(--ab-text)", fontSize: 13 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--ab-muted)", display: "block", marginBottom: 4 }}>내용</label>
                <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="알림 내용" rows={4} style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--ab-border)", background: "var(--ab-bg)", color: "var(--ab-text)", fontSize: 13, resize: "vertical" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--ab-muted)", display: "block", marginBottom: 4 }}>유형</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  style={{ padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--ab-border)", background: "var(--ab-bg)", color: "var(--ab-text)", fontSize: 13 }}>
                  {["info", "warning", "success", "urgent"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <button className="ab-btn ab-btn-gold" style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: 6 }}
                onClick={() => {
                  if (!form.title.trim() || !form.message.trim()) { return; }
                  createMutation.mutate({ title: form.title, message: form.message, type: form.type as any, targetRole: form.targetRole as any });
                }}
                disabled={createMutation.isPending}>
                <Send size={14} /> {createMutation.isPending ? "발송 중..." : "일괄 발송"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 알림 목록 탭 */}
      {activeTab === "list" && (
        <div>
          <div className="ab-table-wrap">
            <table className="ab-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Title</th>
                  <th>Message</th>
                  <th>Target</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "oklch(0.55 0.01 240)" }}>Loading...</td></tr>
                ) : notifications.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "oklch(0.55 0.01 240)" }}>
                    <Bell size={32} style={{ margin: "0 auto 0.5rem", display: "block", opacity: 0.3 }} />
                    알림이 없습니다.
                  </td></tr>
                ) : notifications.map((n: any) => (
                  <tr key={n.id}>
                    <td><span className={`ab-badge ${TYPE_COLORS[n.type] ?? "ab-badge-gray"}`}>{n.type}</span></td>
                    <td style={{ fontWeight: 600 }}>{n.title}</td>
                    <td style={{ color: "oklch(0.55 0.01 240)", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.message}</td>
                    <td><span className="ab-badge ab-badge-gray">{n.targetRole ?? "all"}</span></td>
                    <td style={{ fontSize: "0.72rem", color: "oklch(0.55 0.01 240)" }}>
                      {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td>
                      <button className="ab-btn ab-btn-danger ab-btn-sm" onClick={() => deleteMutation.mutate({ id: n.id })}>
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {modal && (
            <div className="ab-modal-overlay" onClick={(e) => e.target === e.currentTarget && setModal(false)}>
              <div className="ab-modal">
                <div className="ab-modal-title">
                  알림 생성
                  <button onClick={() => setModal(false)} style={{ background: "none", border: "none", color: "oklch(0.55 0.01 240)", cursor: "pointer" }}>
                    <X size={18} />
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label className="ab-label">Title</label>
                    <input className="ab-input" placeholder="알림 제목" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} />
                  </div>
                  <div>
                    <label className="ab-label">Type</label>
                    <select className="ab-select" value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}>
                      <option value="info">Info</option>
                      <option value="warning">Warning</option>
                      <option value="success">Success</option>
                      <option value="error">Error</option>
                    </select>
                  </div>
                  <div>
                    <label className="ab-label">Target Role</label>
                    <select className="ab-select" value={form.targetRole} onChange={(e) => setForm(f => ({ ...f, targetRole: e.target.value }))}>
                      <option value="all">All Users</option>
                      <option value="user">Users Only</option>
                      <option value="admin">Admins Only</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label className="ab-label">Message</label>
                    <textarea className="ab-input" rows={4} placeholder="알림 내용" value={form.message}
                      onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))} style={{ resize: "vertical" }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1.25rem" }}>
                  <button className="ab-btn ab-btn-outline" onClick={() => setModal(false)}>취소</button>
                  <button className="ab-btn ab-btn-gold" onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending}>
                    생성
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
