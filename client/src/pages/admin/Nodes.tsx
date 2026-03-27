import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Cpu, ToggleLeft, ToggleRight, Users, Copy, CheckCheck, ExternalLink, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

function WalletShort({ address }: { address?: string | null }) {
  const [copied, setCopied] = useState(false);
  if (!address) return <span className="text-muted-foreground text-xs">—</span>;
  const short = `${address.slice(0, 6)}...${address.slice(-4)}`;
  return (
    <button
      className="flex items-center gap-1 font-mono text-xs text-blue-400 hover:text-blue-300 transition-colors"
      onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(address); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
    >
      {short}
      {copied ? <CheckCheck className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 opacity-50" />}
    </button>
  );
}

const NODE_COLORS = [
  { label: "Gold", value: "gold", class: "bg-yellow-500" },
  { label: "Silver", value: "silver", class: "bg-slate-400" },
  { label: "Bronze", value: "bronze", class: "bg-amber-700" },
  { label: "Platinum", value: "platinum", class: "bg-cyan-300" },
  { label: "Diamond", value: "diamond", class: "bg-blue-400" },
  { label: "Ruby", value: "ruby", class: "bg-red-500" },
  { label: "Emerald", value: "emerald", class: "bg-emerald-500" },
  { label: "Sapphire", value: "sapphire", class: "bg-indigo-500" },
];

const colorClassMap: Record<string, string> = {
  gold: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  silver: "bg-slate-400/20 text-slate-300 border-slate-400/30",
  bronze: "bg-amber-700/20 text-amber-600 border-amber-700/30",
  platinum: "bg-cyan-300/20 text-cyan-300 border-cyan-300/30",
  diamond: "bg-blue-400/20 text-blue-400 border-blue-400/30",
  ruby: "bg-red-500/20 text-red-400 border-red-500/30",
  emerald: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  sapphire: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
};

const defaultForm = {
  name: "", price: "", color: "gold", nodeId: "1",
  walletAddress: "", description: "", tags: "",
  sortOrder: "0", isActive: true,
};

export default function Nodes() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingNode, setEditingNode] = useState<any>(null);
  const [form, setForm] = useState(defaultForm);
  const [buyersNode, setBuyersNode] = useState<any>(null); // 구매자 목록 드릴다운용

  const utils = trpc.useUtils();
  const { data: nodes, isLoading } = trpc.nodes.list.useQuery();
  const { data: earnings } = trpc.nodes.earnings.useQuery();
  const { data: purchasers, isLoading: purchasersLoading } = trpc.nodes.purchasers.useQuery(
    { nodeId: buyersNode?.id ?? 0 },
    { enabled: buyersNode !== null }
  );

  const createMutation = trpc.nodes.create.useMutation({
    onSuccess: () => { toast.success("Node created"); utils.nodes.list.invalidate(); setDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.nodes.update.useMutation({
    onSuccess: () => { toast.success("Node updated"); utils.nodes.list.invalidate(); setDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.nodes.delete.useMutation({
    onSuccess: () => { toast.success("Node deleted"); utils.nodes.list.invalidate(); setDeleteId(null); },
    onError: (e) => toast.error(e.message),
  });

  const openCreate = () => {
    setEditingNode(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (node: any) => {
    setEditingNode(node);
    setForm({
      name: node.name ?? "",
      price: node.price ?? "",
      color: node.color ?? "gold",
      nodeId: node.nodeId?.toString() ?? "1",
      walletAddress: node.walletAddress ?? "",
      description: node.description ?? "",
      tags: Array.isArray(node.tags) ? node.tags.join(", ") : "",
      sortOrder: node.sortOrder?.toString() ?? "0",
      isActive: node.isActive ?? true,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const payload = {
      name: form.name,
      price: form.price,
      color: form.color,
      nodeId: Number(form.nodeId),
      walletAddress: form.walletAddress || undefined,
      description: form.description || undefined,
      tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : undefined,
      sortOrder: Number(form.sortOrder),
      isActive: form.isActive,
    };
    if (editingNode) {
      updateMutation.mutate({ id: editingNode.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const getEarning = (nodeId: number) => {
    return earnings?.find((e: any) => e.nodeId === nodeId);
  };

  return (
    <AdminLayout title="Node Management">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">Manage node types, pricing, and wallet addresses</p>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Node
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 rounded-xl bg-muted/30 animate-pulse" />
            ))
          ) : nodes && nodes.length > 0 ? (
            nodes.map((node: any) => {
              const earning = getEarning(node.id);
              const colorClass = colorClassMap[node.color] ?? colorClassMap.gold;
              return (
                <Card key={node.id} className="border-border/40 hover:border-primary/30 transition-all group">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${colorClass}`}>
                          <Cpu className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">{node.name}</h3>
                          <p className="text-xs text-muted-foreground">Node #{node.nodeId}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge className={node.isActive ? "badge-active" : "badge-inactive"}>
                          {node.isActive ? "Active" : "Off"}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Price</span>
                        <span className="font-semibold text-primary">${Number(node.price).toLocaleString()} USDT</span>
                      </div>
                      {node.walletAddress && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Wallet</span>
                          <span className="font-mono truncate max-w-32">{node.walletAddress}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Total Sold</span>
                        <span className="font-medium">{earning?.totalOrders ?? node.totalSold ?? 0} units</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Revenue</span>
                        <span className="font-medium text-emerald-400">
                          ${Number(earning?.totalRevenue ?? node.totalRevenue ?? 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {node.tags && Array.isArray(node.tags) && node.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {node.tags.map((tag: string) => (
                          <span key={tag} className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{tag}</span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-3 border-t border-border/40">
                      <Button
                        variant="outline" size="sm"
                        onClick={() => setBuyersNode(node)}
                        className="flex-1 gap-1.5 h-8 text-xs text-blue-400 hover:text-blue-300 hover:border-blue-400/40"
                      >
                        <Users className="w-3 h-3" />
                        구매자 {earning?.totalOrders ?? 0}명
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEdit(node)} className="h-8 px-2 gap-1.5 text-xs">
                        <Pencil className="w-3 h-3" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateMutation.mutate({ id: node.id, isActive: !node.isActive })}
                        className="h-8 px-2"
                      >
                        {node.isActive ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteId(node.id)}
                        className="h-8 px-2 hover:border-destructive/50 hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="col-span-3 flex flex-col items-center justify-center py-16 text-center">
              <Cpu className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No nodes configured yet</p>
              <Button variant="outline" size="sm" onClick={openCreate} className="mt-3 gap-2">
                <Plus className="w-3 h-3" />
                Create First Node
              </Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display">{editingNode ? "Edit Node" : "Create Node"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground">Node Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Gold Node" className="mt-1 bg-input" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Price (USDT) *</Label>
              <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="500" className="mt-1 bg-input" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Node ID</Label>
              <Input type="number" value={form.nodeId} onChange={e => setForm(f => ({ ...f, nodeId: e.target.value }))} className="mt-1 bg-input" />
            </div>
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground">Color Theme</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {NODE_COLORS.map(c => (
                  <button
                    key={c.value}
                    onClick={() => setForm(f => ({ ...f, color: c.value }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                      form.color === c.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${c.class}`} />
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground">Wallet Address</Label>
              <Input value={form.walletAddress} onChange={e => setForm(f => ({ ...f, walletAddress: e.target.value }))} placeholder="0x..." className="mt-1 bg-input font-mono text-xs" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Sort Order</Label>
              <Input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))} className="mt-1 bg-input" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Tags (comma-separated)</Label>
              <Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="premium, fast" className="mt-1 bg-input" />
            </div>
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground">Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="mt-1 bg-input resize-none" rows={3} />
            </div>
            <div className="col-span-2 flex items-center gap-3">
              <Switch checked={form.isActive} onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))} />
              <Label className="text-sm">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingNode ? "Update Node" : "Create Node"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Node</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive" onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 구매자 목록 Sheet */}
      <Sheet open={buyersNode !== null} onOpenChange={open => !open && setBuyersNode(null)}>
        <SheetContent side="right" className="w-full sm:max-w-2xl bg-card border-border overflow-y-auto">
          <SheetHeader className="mb-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                {buyersNode?.name} 구매자 목록
              </SheetTitle>
              {purchasers && purchasers.length > 0 && (
                <button
                  onClick={() => {
                    const headers = ["순번", "지갑주소", "이름", "이메일", "금액(USDT)", "상태", "구매일", "TxHash"];
                    const rows = purchasers.map((p: any, i: number) => [
                      i + 1,
                      p.userWallet ?? "",
                      p.userName ?? "",
                      p.userEmail ?? "",
                      Number(p.totalAmount ?? 0).toFixed(2),
                      p.status ?? "",
                      new Date(p.createdAt).toLocaleDateString("ko-KR"),
                      p.txHash ?? "",
                    ]);
                    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
                    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${buyersNode?.name ?? "node"}-buyers-${Date.now()}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                    toast.success("CSV 다운로드 완료");
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border/40 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <Download className="w-3 h-3" />
                  CSV
                </button>
              )}
            </div>
            {buyersNode && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>가격: <span className="text-primary font-medium">${Number(buyersNode.price).toLocaleString()} USDT</span></span>
                <span>총 {purchasers?.length ?? 0}건</span>
              </div>
            )}
          </SheetHeader>

          {/* 요약 카드 */}
          {!purchasersLoading && purchasers && purchasers.length > 0 && (() => {
            const totalRevenue = purchasers.reduce((sum: number, p: any) => sum + Number(p.totalAmount ?? 0), 0);
            const avgAmount = totalRevenue / purchasers.length;
            return (
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-0.5">총 구매자</p>
                  <p className="text-lg font-bold text-primary">{purchasers.length}<span className="text-xs font-normal ml-0.5">명</span></p>
                </div>
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-0.5">총 매출</p>
                  <p className="text-lg font-bold text-emerald-400">${totalRevenue.toLocaleString()}</p>
                </div>
                <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-0.5">평균 구매</p>
                  <p className="text-lg font-bold text-blue-400">${Math.round(avgAmount).toLocaleString()}</p>
                </div>
              </div>
            );
          })()}

          {purchasersLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 bg-muted/30 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : purchasers && purchasers.length > 0 ? (
            <div className="space-y-2">
              {purchasers.map((p: any, i: number) => (
                <div key={p.orderId} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors border border-border/30">
                  <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    {p.userWallet ? (
                      <WalletShort address={p.userWallet} />
                    ) : (
                      <p className="text-sm font-medium truncate">{p.userName ?? `User #${p.userId}`}</p>
                    )}
                    {p.userEmail && <p className="text-xs text-muted-foreground truncate">{p.userEmail}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-primary">${Number(p.totalAmount).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString("ko-KR")}</p>
                  </div>
                  <Badge className={p.status === "confirmed" ? "badge-active" : "badge-pending"}>
                    {p.status}
                  </Badge>
                  {p.txHash && (
                    <a
                      href={`https://bscscan.com/tx/${p.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
                      title="BSCScan"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Users className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm">구매자 데이터가 없습니다</p>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}
