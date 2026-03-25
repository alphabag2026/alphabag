import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Link } from "wouter";
import { toast } from "sonner";
import {
  ArrowLeft, Loader2, TicketCheck, Plus, MessageSquare,
  Clock, CheckCircle2, AlertCircle, XCircle
} from "lucide-react";

export default function TicketsPage() {
  const { isAuthenticated, loading } = useAuth({ redirectOnUnauthenticated: true });
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("general");

  const { data: tickets, isLoading, refetch } = trpc.user.tickets.useQuery(undefined, { enabled: isAuthenticated });

  const createTicket = trpc.user.createTicket.useMutation({
    onSuccess: () => {
      toast.success("Support ticket created!");
      setOpen(false);
      setSubject("");
      setMessage("");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const statusConfig = {
    open: { label: "Open", icon: AlertCircle, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
    in_progress: { label: "In Progress", icon: Clock, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    resolved: { label: "Resolved", icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
    closed: { label: "Closed", icon: XCircle, color: "text-muted-foreground", bg: "bg-muted/20 border-border/30" },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                <ArrowLeft className="w-4 h-4" /> Dashboard
              </Button>
            </Link>
            <span className="text-sm font-medium">Support Tickets</span>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="w-3 h-3" /> New Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border/60">
              <DialogHeader>
                <DialogTitle>Create Support Ticket</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label className="text-sm mb-1.5 block">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="investment">Investment</SelectItem>
                      <SelectItem value="node">Node</SelectItem>
                      <SelectItem value="withdrawal">Withdrawal</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm mb-1.5 block">Subject</Label>
                  <Input
                    placeholder="Brief description of your issue"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="bg-background/50"
                  />
                </div>
                <div>
                  <Label className="text-sm mb-1.5 block">Message</Label>
                  <Textarea
                    placeholder="Describe your issue in detail..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    className="bg-background/50 resize-none"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => subject && message && createTicket.mutate({ subject, message, category })}
                  disabled={!subject || !message || createTicket.isPending}
                >
                  {createTicket.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null}
                  Submit Ticket
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : tickets && tickets.length > 0 ? (
          <div className="space-y-4">
            {tickets.map((ticket) => {
              const cfg = statusConfig[ticket.status];
              return (
                <Card key={ticket.id} className="border-border/40">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground truncate">{ticket.subject}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs capitalize">{ticket.category}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(ticket.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs ${cfg.bg} ${cfg.color}`}>
                        <cfg.icon className="w-3 h-3" />
                        {cfg.label}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{ticket.message}</p>
                    {ticket.adminReply && (
                      <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <MessageSquare className="w-3 h-3 text-primary" />
                          <span className="text-xs font-medium text-primary">Admin Reply</span>
                        </div>
                        <p className="text-sm text-foreground">{ticket.adminReply}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <TicketCheck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">No support tickets yet</p>
            <p className="text-sm text-muted-foreground mb-6">Create a ticket if you need help</p>
            <Button onClick={() => setOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Create First Ticket
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
