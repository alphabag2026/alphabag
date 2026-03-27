import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, ChevronLeft, ChevronRight, Eye, Send, Shield, User, FileText, Cpu, Calendar } from "lucide-react";

const ACTION_FILTERS = [
  { label: "All", value: "" },
  { label: "Telegram", value: "TELEGRAM" },
  { label: "Users", value: "USER" },
  { label: "Plans", value: "PLAN" },
  { label: "Nodes", value: "NODE" },
  { label: "KYC", value: "KYC" },
];

const ACTION_COLORS: Record<string, string> = {
  BROADCAST_TELEGRAM: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  CREATE_TELEGRAM_SCHEDULE: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  UPDATE_TELEGRAM_SCHEDULE: "bg-blue-400/20 text-blue-300 border-blue-400/30",
  DELETE_TELEGRAM_SCHEDULE: "bg-red-500/20 text-red-400 border-red-500/30",
  UPDATE_KYC: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  UPDATE_ROLE: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  CREATE_PLAN: "bg-green-500/20 text-green-400 border-green-500/30",
  DELETE_PLAN: "bg-red-500/20 text-red-400 border-red-500/30",
  CREATE_NODE: "bg-green-500/20 text-green-400 border-green-500/30",
  DELETE_NODE: "bg-red-500/20 text-red-400 border-red-500/30",
  BULK_UPDATE_STATUS: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

function getActionIcon(action: string) {
  if (action.includes("TELEGRAM")) return <Send className="w-3 h-3" />;
  if (action.includes("KYC") || action.includes("ROLE")) return <Shield className="w-3 h-3" />;
  if (action.includes("USER")) return <User className="w-3 h-3" />;
  if (action.includes("PLAN")) return <FileText className="w-3 h-3" />;
  if (action.includes("NODE")) return <Cpu className="w-3 h-3" />;
  return null;
}

const DATE_RANGE_FILTERS = [
  { label: "전체", value: "all" as const },
  { label: "오늘", value: "today" as const },
  { label: "이번 주", value: "week" as const },
  { label: "이번 달", value: "month" as const },
];

export default function AuditLogs() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [dateRange, setDateRange] = useState<"all" | "today" | "week" | "month">("all");
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const { data, isLoading } = trpc.auditLogs.list.useQuery({
    page,
    limit: 50,
    action: actionFilter || undefined,
    dateRange,
  });

  const logs = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 50);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            All admin actions are recorded here. Total: {total.toLocaleString()} entries.
          </p>
        </div>

        {/* Filters Row */}
        <div className="space-y-2">
          {/* Action Filter */}
          <div className="flex flex-wrap gap-2">
            {ACTION_FILTERS.map((f) => (
              <Button
                key={f.value}
                variant={actionFilter === f.value ? "default" : "outline"}
                size="sm"
                onClick={() => { setActionFilter(f.value); setPage(1); }}
                className="h-8"
              >
                {f.label}
              </Button>
            ))}
          </div>
          {/* Date Range Filter */}
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">기간:</span>
            {DATE_RANGE_FILTERS.map((f) => (
              <Button
                key={f.value}
                variant={dateRange === f.value ? "default" : "ghost"}
                size="sm"
                onClick={() => { setDateRange(f.value); setPage(1); }}
                className="h-7 px-3 text-xs"
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border/40 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border/40 bg-muted/20">
                <TableHead className="w-12">#</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="w-16">Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    No audit logs found.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log: any) => (
                  <TableRow key={log.id} className="border-border/40 hover:bg-muted/10">
                    <TableCell className="text-muted-foreground text-xs">{log.id}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs gap-1 ${ACTION_COLORS[log.action] ?? "bg-muted/20 text-muted-foreground border-border/30"}`}
                      >
                        {getActionIcon(log.action)}
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.targetType ? (
                        <span>
                          {log.targetType}
                          {log.targetId ? <span className="text-xs ml-1 font-mono">#{log.targetId}</span> : null}
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-sm font-mono text-muted-foreground">
                      {(log as any).adminUsername || `#${log.adminId}`}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {log.details ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                      ) : (
                        <span className="text-muted-foreground/40 text-xs">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages} ({total} total)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`text-xs gap-1 ${ACTION_COLORS[selectedLog?.action] ?? "bg-muted/20 text-muted-foreground border-border/30"}`}
              >
                {selectedLog && getActionIcon(selectedLog.action)}
                {selectedLog?.action}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Admin</p>
                  <p className="font-mono">{(selectedLog as any).adminUsername || `#${selectedLog.adminId}`}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Time</p>
                  <p>{new Date(selectedLog.createdAt).toLocaleString()}</p>
                </div>
                {selectedLog.targetType && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Target</p>
                    <p>{selectedLog.targetType}{selectedLog.targetId ? ` #${selectedLog.targetId}` : ""}</p>
                  </div>
                )}
                {selectedLog.ipAddress && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">IP Address</p>
                    <p className="font-mono">{selectedLog.ipAddress}</p>
                  </div>
                )}
              </div>
              {selectedLog.details && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Details</p>
                  {/* 텔레그램 발송 메시지 전문 표시 */}
                  {selectedLog.details.message && (
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 mb-2">
                      <p className="text-xs font-medium text-blue-400 mb-1">Message Content</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{selectedLog.details.message}</p>
                    </div>
                  )}
                  {/* 발송 결과 */}
                  {(selectedLog.details.successCount !== undefined || selectedLog.details.failCount !== undefined) && (
                    <div className="flex gap-3 mb-2">
                      <div className="flex-1 p-2 rounded bg-green-500/10 border border-green-500/20 text-center">
                        <p className="text-xs text-muted-foreground">Success</p>
                        <p className="text-lg font-bold text-green-400">{selectedLog.details.successCount ?? 0}</p>
                      </div>
                      <div className="flex-1 p-2 rounded bg-red-500/10 border border-red-500/20 text-center">
                        <p className="text-xs text-muted-foreground">Failed</p>
                        <p className="text-lg font-bold text-red-400">{selectedLog.details.failCount ?? 0}</p>
                      </div>
                      <div className="flex-1 p-2 rounded bg-muted/20 border border-border/30 text-center">
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="text-lg font-bold text-foreground">{selectedLog.details.total ?? 0}</p>
                      </div>
                    </div>
                  )}
                  {/* 기타 details JSON */}
                  <pre className="text-xs font-mono bg-muted/30 rounded p-3 overflow-auto max-h-48 text-muted-foreground">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
