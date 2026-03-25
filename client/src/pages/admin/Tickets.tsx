import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { TicketCheck, MessageSquare, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    open: "badge-open", in_progress: "badge-pending",
    resolved: "badge-resolved", closed: "badge-closed",
  };
  return map[status] ?? "badge-inactive";
};

const priorityBadge = (priority: string) => {
  const map: Record<string, string> = {
    low: "badge-inactive", medium: "badge-pending",
    high: "bg-orange-500/15 text-orange-400 border border-orange-500/30",
    urgent: "badge-urgent",
  };
  return map[priority] ?? "badge-inactive";
};

export default function Tickets() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.tickets.list.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
    page,
    limit: 20,
  });

  const replyMutation = trpc.tickets.reply.useMutation({
    onSuccess: () => { toast.success("Reply sent"); utils.tickets.list.invalidate(); setReplyDialogOpen(false); setReplyText(""); },
    onError: (e) => toast.error(e.message),
  });
  const updateStatusMutation = trpc.tickets.updateStatus.useMutation({
    onSuccess: () => { toast.success("Status updated"); utils.tickets.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <AdminLayout title="Support Tickets">
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <div className="flex gap-2">
            {["all", "open", "in_progress", "resolved", "closed"].map(s => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "text-muted-foreground hover:bg-accent border border-transparent"
                }`}
              >
                {s === "all" ? "All" : s.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
              </button>
            ))}
          </div>
          <span className="ml-auto text-sm text-muted-foreground">{total} tickets</span>
        </div>

        <Card className="border-border/40">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-20 bg-muted/30 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : data?.data?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <TicketCheck className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No tickets found</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {data?.data?.map((ticket: any) => (
                  <div key={ticket.id} className="p-4 hover:bg-accent/20 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <TicketCheck className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-medium text-sm">{ticket.subject}</span>
                          <Badge className={`${statusBadge(ticket.status)} text-xs`}>{ticket.status.replace("_", " ")}</Badge>
                          <Badge className={`${priorityBadge(ticket.priority)} text-xs`}>{ticket.priority}</Badge>
                          {ticket.category && <Badge variant="outline" className="text-xs">{ticket.category}</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{ticket.message}</p>
                        {ticket.adminReply && (
                          <div className="mt-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
                            <p className="text-xs text-primary font-medium mb-0.5">Admin Reply:</p>
                            <p className="text-xs text-muted-foreground">{ticket.adminReply}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-muted-foreground">
                            User #{ticket.userId} · {new Date(ticket.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Select
                          value={ticket.status}
                          onValueChange={(v) => updateStatusMutation.mutate({ id: ticket.id, status: v as any })}
                        >
                          <SelectTrigger className="h-7 text-xs w-28 bg-input">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1.5"
                          onClick={() => { setSelectedTicket(ticket); setReplyText(ticket.adminReply ?? ""); setReplyDialogOpen(true); }}
                        >
                          <MessageSquare className="w-3 h-3" />
                          Reply
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display">Reply to Ticket</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4 py-2">
              <div className="p-3 rounded-lg bg-muted/30 border border-border/40">
                <p className="text-xs font-medium text-muted-foreground mb-1">Original Message</p>
                <p className="text-sm">{selectedTicket.message}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Your Reply *</Label>
                <Textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Type your reply..."
                  className="mt-1 bg-input resize-none"
                  rows={5}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => replyMutation.mutate({ id: selectedTicket?.id, adminReply: replyText })}
              disabled={replyMutation.isPending || !replyText.trim()}
            >
              Send Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
