import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import {
  Loader2, Plus, Trash2, Edit2, Clock, Send, CheckCircle2, XCircle,
  Calendar, RefreshCw,
} from "lucide-react";

const CRON_PRESETS = [
  { label: "매일 오전 9시", value: "0 9 * * *" },
  { label: "매주 월요일 오전 9시", value: "0 9 * * 1" },
  { label: "매주 금요일 오전 9시", value: "0 9 * * 5" },
  { label: "매월 1일 오전 9시", value: "0 9 1 * *" },
  { label: "매시간 정각", value: "0 * * * *" },
];

type ScheduleForm = {
  title: string;
  message: string;
  channelChatId: string;
  cronExpression: string;
  timezone: string;
  hasInvestment: boolean;
  hasNode: boolean;
  kycApproved: boolean;
};

const defaultForm: ScheduleForm = {
  title: "",
  message: "",
  channelChatId: "",
  cronExpression: "0 9 * * 1",
  timezone: "Asia/Seoul",
  hasInvestment: false,
  hasNode: false,
  kycApproved: false,
};

export default function TelegramSchedules() {
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [form, setForm] = useState<ScheduleForm>(defaultForm);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: schedules, isLoading } = trpc.telegramSchedules.list.useQuery();

  const createMutation = trpc.telegramSchedules.create.useMutation({
    onSuccess: () => {
      toast.success("Schedule created!");
      setShowCreate(false);
      setForm(defaultForm);
      utils.telegramSchedules.list.invalidate();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateMutation = trpc.telegramSchedules.update.useMutation({
    onSuccess: () => {
      toast.success("Schedule updated!");
      setEditTarget(null);
      utils.telegramSchedules.list.invalidate();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = trpc.telegramSchedules.delete.useMutation({
    onSuccess: () => {
      toast.success("Schedule deleted.");
      setDeleteConfirm(null);
      utils.telegramSchedules.list.invalidate();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const runNowMutation = trpc.telegramSchedules.runNow.useMutation({
    onSuccess: (res) => {
      toast.success(`즈시 발송 완료! 성공: ${res.successCount}, 실패: ${res.failCount}`);
      utils.telegramSchedules.list.invalidate();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleOpenEdit = (s: any) => {
    const f = s.filter as any ?? {};
    setForm({
      title: s.title,
      message: s.message,
      channelChatId: s.channelChatId ?? "",
      cronExpression: s.cronExpression,
      timezone: s.timezone ?? "Asia/Seoul",
      hasInvestment: !!f.hasInvestment,
      hasNode: !!f.hasNode,
      kycApproved: !!f.kycApproved,
    });
    setEditTarget(s);
  };

  const handleSubmit = () => {
    const payload = {
      title: form.title,
      message: form.message,
      channelChatId: form.channelChatId || undefined,
      filter: {
        hasInvestment: form.hasInvestment || undefined,
        hasNode: form.hasNode || undefined,
        kycApproved: form.kycApproved || undefined,
      },
      cronExpression: form.cronExpression,
      timezone: form.timezone,
    };

    if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Telegram Schedules</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Automated recurring telegram broadcasts. Runs every minute to check due schedules.
            </p>
          </div>
          <Button onClick={() => { setForm(defaultForm); setShowCreate(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> New Schedule
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !schedules || schedules.length === 0 ? (
          <Card className="border-border/40">
            <CardContent className="py-12 text-center">
              <Calendar className="w-8 h-8 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">No schedules yet. Create your first recurring broadcast.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {schedules.map((s: any) => {
              const filter = s.filter as any ?? {};
              const lastResult = s.lastResult as any;
              return (
                <Card key={s.id} className={`border-border/40 ${!s.isActive ? "opacity-60" : ""}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-base">{s.title}</CardTitle>
                          <Badge variant="outline" className={s.isActive
                            ? "bg-green-500/10 text-green-400 border-green-500/20 text-xs"
                            : "bg-muted/20 text-muted-foreground border-border/30 text-xs"
                          }>
                            {s.isActive ? "Active" : "Paused"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <code className="font-mono">{s.cronExpression}</code>
                          </span>
                          {s.channelChatId && (
                            <span className="flex items-center gap-1 text-xs text-blue-400">
                              <Send className="w-3 h-3" /> Channel: {s.channelChatId}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs gap-1 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                          onClick={() => runNowMutation.mutate({ id: s.id })}
                          disabled={runNowMutation.isPending}
                          title="지금 즉시 발송"
                        >
                          {runNowMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                          지금 발송
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => handleOpenEdit(s)}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
                          onClick={() => setDeleteConfirm(s.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">{s.message}</p>

                    {/* Filters */}
                    <div className="flex gap-2 flex-wrap">
                      {filter.hasInvestment && <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/20">Has Investment</Badge>}
                      {filter.hasNode && <Badge variant="outline" className="text-xs bg-cyan-500/10 text-cyan-400 border-cyan-500/20">Has Node</Badge>}
                      {filter.kycApproved && <Badge variant="outline" className="text-xs bg-green-500/10 text-green-400 border-green-500/20">KYC Approved</Badge>}
                      {!filter.hasInvestment && !filter.hasNode && !filter.kycApproved && (
                        <Badge variant="outline" className="text-xs bg-muted/20 text-muted-foreground border-border/30">All Users</Badge>
                      )}
                    </div>

                    {/* Last run / next run */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-2 rounded bg-muted/20 border border-border/30">
                        <p className="text-muted-foreground mb-1">Last Run</p>
                        {s.lastRunAt ? (
                          <div>
                            <p className="font-medium">{new Date(s.lastRunAt).toLocaleString()}</p>
                            {lastResult && (
                              <div className="flex gap-2 mt-1">
                                <span className="flex items-center gap-0.5 text-green-400">
                                  <CheckCircle2 className="w-3 h-3" /> {lastResult.successCount}
                                </span>
                                <span className="flex items-center gap-0.5 text-red-400">
                                  <XCircle className="w-3 h-3" /> {lastResult.failCount}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-muted-foreground/60">Never run</p>
                        )}
                      </div>
                      <div className="p-2 rounded bg-muted/20 border border-border/30">
                        <p className="text-muted-foreground mb-1">Next Run</p>
                        {s.nextRunAt ? (
                          <p className="font-medium">{new Date(s.nextRunAt).toLocaleString()}</p>
                        ) : (
                          <p className="text-muted-foreground/60">Not scheduled</p>
                        )}
                      </div>
                    </div>

                    {/* Toggle active */}
                    <div className="flex items-center gap-2 pt-1">
                      <Switch
                        checked={s.isActive}
                        onCheckedChange={(checked) =>
                          updateMutation.mutate({ id: s.id, isActive: checked })
                        }
                      />
                      <span className="text-xs text-muted-foreground">{s.isActive ? "Active — will run on schedule" : "Paused — will not run"}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={showCreate || !!editTarget} onOpenChange={(open) => {
        if (!open) { setShowCreate(false); setEditTarget(null); }
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit Schedule" : "New Scheduled Broadcast"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs mb-1 block">Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Weekly Monday Update"
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Message (HTML supported)</Label>
              <Textarea
                value={form.message}
                onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Enter your message..."
                rows={5}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Supports HTML: &lt;b&gt;bold&lt;/b&gt;, &lt;i&gt;italic&lt;/i&gt;, &lt;a href="..."&gt;link&lt;/a&gt;
              </p>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Channel Chat ID (optional)</Label>
              <Input
                value={form.channelChatId}
                onChange={(e) => setForm(f => ({ ...f, channelChatId: e.target.value }))}
                placeholder="-100xxxxxxxxxx"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave blank to send DMs only. For channels, use the numeric ID (e.g. -1001234567890).
              </p>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Cron Expression</Label>
              <div className="flex gap-2 flex-wrap mb-2">
                {CRON_PRESETS.map((p) => (
                  <Button
                    key={p.value}
                    variant={form.cronExpression === p.value ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setForm(f => ({ ...f, cronExpression: p.value }))}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
              <Input
                value={form.cronExpression}
                onChange={(e) => setForm(f => ({ ...f, cronExpression: e.target.value }))}
                placeholder="0 9 * * 1"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Format: minute hour day month weekday (0=Sun, 1=Mon, ..., 6=Sat)
              </p>
            </div>
            <div>
              <Label className="text-xs mb-2 block">Target Audience Filters</Label>
              <div className="space-y-2">
                {[
                  { key: "hasInvestment" as const, label: "Has active investment" },
                  { key: "hasNode" as const, label: "Has node order" },
                  { key: "kycApproved" as const, label: "KYC approved only" },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-2">
                    <Switch
                      checked={form[key]}
                      onCheckedChange={(checked) => setForm(f => ({ ...f, [key]: checked }))}
                    />
                    <span className="text-sm text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {!form.hasInvestment && !form.hasNode && !form.kycApproved
                  ? "No filters — will send to ALL users with a registered Telegram Chat ID."
                  : "Will send to users matching ALL selected filters."}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); setEditTarget(null); }}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.title || !form.message || !form.cronExpression || isPending}
              className="gap-2"
            >
              {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              {editTarget ? "Save Changes" : "Create Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Schedule?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete the schedule. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm !== null && deleteMutation.mutate({ id: deleteConfirm })}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
