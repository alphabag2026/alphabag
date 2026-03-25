import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Coins, Users, ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    draft: "badge-inactive",
    active: "badge-active",
    completed: "badge-resolved",
    cancelled: "badge-urgent",
  };
  return map[status] ?? "badge-inactive";
};

const defaultForm = {
  name: "", description: "", tokenSymbol: "USDT", totalAmount: "",
  perUserAmount: "", maxParticipants: "", startDate: "", endDate: "",
  status: "draft", requiresKyc: false, requiresMinInvestment: false,
  minInvestmentAmount: "",
};

export default function Airdrops() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(defaultForm);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: campaigns, isLoading } = trpc.airdrops.list.useQuery();

  const createMutation = trpc.airdrops.create.useMutation({
    onSuccess: () => { toast.success("Airdrop campaign created"); utils.airdrops.list.invalidate(); setDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.airdrops.update.useMutation({
    onSuccess: () => { toast.success("Campaign updated"); utils.airdrops.list.invalidate(); setDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.airdrops.delete.useMutation({
    onSuccess: () => { toast.success("Campaign deleted"); utils.airdrops.list.invalidate(); setDeleteId(null); },
    onError: (e) => toast.error(e.message),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (campaign: any) => {
    setEditing(campaign);
    setForm({
      name: campaign.name ?? "",
      description: campaign.description ?? "",
      tokenSymbol: campaign.tokenSymbol ?? "USDT",
      totalAmount: campaign.totalAmount ?? "",
      perUserAmount: campaign.perUserAmount ?? "",
      maxParticipants: campaign.maxParticipants?.toString() ?? "",
      startDate: campaign.startDate ? new Date(campaign.startDate).toISOString().slice(0, 16) : "",
      endDate: campaign.endDate ? new Date(campaign.endDate).toISOString().slice(0, 16) : "",
      status: campaign.status ?? "draft",
      requiresKyc: campaign.requiresKyc ?? false,
      requiresMinInvestment: campaign.requiresMinInvestment ?? false,
      minInvestmentAmount: campaign.minInvestmentAmount ?? "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const payload = {
      name: form.name,
      description: form.description || undefined,
      tokenSymbol: form.tokenSymbol || "USDT",
      totalAmount: form.totalAmount,
      perUserAmount: form.perUserAmount,
      maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : undefined,
      startDate: form.startDate ? new Date(form.startDate) : undefined,
      endDate: form.endDate ? new Date(form.endDate) : undefined,
      status: form.status,
      requiresKyc: form.requiresKyc,
      requiresMinInvestment: form.requiresMinInvestment,
      minInvestmentAmount: form.minInvestmentAmount || undefined,
    };
    editing ? updateMutation.mutate({ id: editing.id, ...payload }) : createMutation.mutate(payload);
  };

  return (
    <AdminLayout title="Airdrop Management">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">Manage token airdrop campaigns and distributions</p>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            New Campaign
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-muted/30 animate-pulse" />
            ))}
          </div>
        ) : campaigns && campaigns.length > 0 ? (
          <div className="space-y-3">
            {campaigns.map((campaign: any) => (
              <Card key={campaign.id} className="border-border/40 hover:border-primary/20 transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Coins className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-sm">{campaign.name}</h3>
                        <Badge className={`${statusBadge(campaign.status)} text-xs`}>{campaign.status}</Badge>
                        {campaign.requiresKyc && <Badge variant="outline" className="text-xs">KYC Required</Badge>}
                      </div>
                      {campaign.description && (
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{campaign.description}</p>
                      )}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Total Pool</p>
                          <p className="text-sm font-semibold text-primary">{Number(campaign.totalAmount).toLocaleString()} {campaign.tokenSymbol}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Per User</p>
                          <p className="text-sm font-semibold">{Number(campaign.perUserAmount).toLocaleString()} {campaign.tokenSymbol}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Participants</p>
                          <p className="text-sm font-semibold">{campaign.currentParticipants ?? 0}{campaign.maxParticipants ? ` / ${campaign.maxParticipants}` : ""}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Distributed</p>
                          <p className="text-sm font-semibold text-emerald-400">{Number(campaign.distributedAmount ?? 0).toLocaleString()} {campaign.tokenSymbol}</p>
                        </div>
                      </div>
                      {(campaign.startDate || campaign.endDate) && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {campaign.startDate && `Start: ${new Date(campaign.startDate).toLocaleDateString()}`}
                          {campaign.startDate && campaign.endDate && " · "}
                          {campaign.endDate && `End: ${new Date(campaign.endDate).toLocaleDateString()}`}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button variant="outline" size="sm" onClick={() => openEdit(campaign)} className="h-8 gap-1.5 text-xs">
                        <Pencil className="w-3 h-3" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setDeleteId(campaign.id)} className="h-8 px-2 hover:border-destructive/50 hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border/40 rounded-xl">
            <Coins className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No airdrop campaigns yet</p>
            <Button variant="outline" size="sm" onClick={openCreate} className="mt-3 gap-2">
              <Plus className="w-3 h-3" />
              Create First Campaign
            </Button>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display">{editing ? "Edit Campaign" : "Create Airdrop Campaign"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground">Campaign Name *</Label>
              <Input value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} placeholder="e.g. Genesis Airdrop" className="mt-1 bg-input" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Token Symbol</Label>
              <Input value={form.tokenSymbol} onChange={e => setForm((f: any) => ({ ...f, tokenSymbol: e.target.value }))} placeholder="USDT" className="mt-1 bg-input" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={form.status} onValueChange={v => setForm((f: any) => ({ ...f, status: v }))}>
                <SelectTrigger className="mt-1 bg-input"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Total Pool Amount *</Label>
              <Input type="number" value={form.totalAmount} onChange={e => setForm((f: any) => ({ ...f, totalAmount: e.target.value }))} placeholder="10000" className="mt-1 bg-input" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Per User Amount *</Label>
              <Input type="number" value={form.perUserAmount} onChange={e => setForm((f: any) => ({ ...f, perUserAmount: e.target.value }))} placeholder="100" className="mt-1 bg-input" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Max Participants</Label>
              <Input type="number" value={form.maxParticipants} onChange={e => setForm((f: any) => ({ ...f, maxParticipants: e.target.value }))} placeholder="Unlimited" className="mt-1 bg-input" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Start Date</Label>
              <Input type="datetime-local" value={form.startDate} onChange={e => setForm((f: any) => ({ ...f, startDate: e.target.value }))} className="mt-1 bg-input" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">End Date</Label>
              <Input type="datetime-local" value={form.endDate} onChange={e => setForm((f: any) => ({ ...f, endDate: e.target.value }))} className="mt-1 bg-input" />
            </div>
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground">Description</Label>
              <Textarea value={form.description} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} className="mt-1 bg-input resize-none" rows={3} />
            </div>
            <div className="col-span-2 space-y-3">
              <div className="flex items-center gap-3">
                <Switch checked={form.requiresKyc} onCheckedChange={v => setForm((f: any) => ({ ...f, requiresKyc: v }))} />
                <Label className="text-sm">Requires KYC verification</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.requiresMinInvestment} onCheckedChange={v => setForm((f: any) => ({ ...f, requiresMinInvestment: v }))} />
                <Label className="text-sm">Requires minimum investment</Label>
              </div>
              {form.requiresMinInvestment && (
                <div>
                  <Label className="text-xs text-muted-foreground">Minimum Investment Amount</Label>
                  <Input type="number" value={form.minInvestmentAmount} onChange={e => setForm((f: any) => ({ ...f, minInvestmentAmount: e.target.value }))} placeholder="100" className="mt-1 bg-input" />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editing ? "Update Campaign" : "Create Campaign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive" onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
