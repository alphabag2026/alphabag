import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Shield, UserPlus, Trash2, Crown, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const roleBadge = (role: string) => {
  if (role === "admin") return "bg-primary/15 text-primary border border-primary/30";
  if (role === "sub_admin") return "bg-purple-500/15 text-purple-400 border border-purple-500/30";
  return "badge-inactive";
};

const roleIcon = (role: string) => {
  if (role === "admin") return Crown;
  if (role === "sub_admin") return ShieldCheck;
  return Shield;
};

const PERMISSIONS = [
  { key: "plans", label: "Investment Plans", description: "Manage investment and staking plans" },
  { key: "nodes", label: "Node Management", description: "Manage node types and pricing" },
  { key: "users", label: "User Management", description: "View and manage user accounts" },
  { key: "content", label: "Content Management", description: "Manage notices, banners, and ads" },
  { key: "tickets", label: "Support Tickets", description: "Handle user support requests" },
  { key: "airdrops", label: "Airdrop Campaigns", description: "Create and manage airdrops" },
  { key: "analytics", label: "Analytics", description: "View analytics and reports" },
  { key: "referrals", label: "Referral System", description: "View referral data" },
];

export default function SubAdmins() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [removeId, setRemoveId] = useState<number | null>(null);
  const [searchEmail, setSearchEmail] = useState<string>("");
  const [newRole, setNewRole] = useState<"admin" | "sub_admin">("sub_admin");

  const utils = trpc.useUtils();
  const { data: admins, isLoading } = trpc.subAdmins.list.useQuery();

  const promoteMutation = trpc.subAdmins.promote.useMutation({
    onSuccess: () => { toast.success("User promoted successfully"); utils.subAdmins.list.invalidate(); setDialogOpen(false); setSearchEmail(""); },
    onError: (e) => toast.error(e.message),
  });
  const demoteMutation = trpc.subAdmins.demote.useMutation({
    onSuccess: () => { toast.success("Admin access removed"); utils.subAdmins.list.invalidate(); setRemoveId(null); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <AdminLayout title="Sub-Admin Management">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">Manage admin roles and access permissions</p>
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <UserPlus className="w-4 h-4" />
            Add Admin
          </Button>
        </div>

        {/* Permissions Overview */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Permission Matrix
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {PERMISSIONS.map(p => (
                <div key={p.key} className="p-3 rounded-lg border border-border/40 bg-muted/20">
                  <p className="text-sm font-medium mb-0.5">{p.label}</p>
                  <p className="text-xs text-muted-foreground">{p.description}</p>
                  <div className="flex gap-1.5 mt-2">
                    <Badge className="badge-active text-xs">Admin</Badge>
                    <Badge className="bg-purple-500/15 text-purple-400 border border-purple-500/30 text-xs">Sub-Admin</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Admin List */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Admin Accounts</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 bg-muted/30 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : admins && admins.length > 0 ? (
              <div className="space-y-2">
                {admins.map((admin: any) => {
                  const RoleIcon = roleIcon(admin.role);
                  return (
                    <div key={admin.id} className="flex items-center gap-3 p-4 rounded-xl border border-border/40 hover:border-primary/20 transition-all">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        admin.role === "admin" ? "bg-primary/10" : "bg-purple-500/10"
                      }`}>
                        <RoleIcon className={`w-5 h-5 ${admin.role === "admin" ? "text-primary" : "text-purple-400"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-sm">{admin.name ?? `User #${admin.id}`}</span>
                          <Badge className={`${roleBadge(admin.role)} text-xs`}>{admin.role.replace("_", " ")}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{admin.email ?? "No email"}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-muted-foreground">
                          Since {new Date(admin.updatedAt).toLocaleDateString()}
                        </span>
                        {admin.role !== "admin" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRemoveId(admin.id)}
                            className="h-8 px-2 hover:border-destructive/50 hover:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Shield className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-sm">No admin accounts found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Admin Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display">Add Admin Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs text-muted-foreground">User Email or ID *</Label>
              <Input
                value={searchEmail}
                onChange={e => setSearchEmail(e.target.value)}
                placeholder="user@example.com or user ID"
                className="mt-1 bg-input"
              />
              <p className="text-xs text-muted-foreground mt-1">Enter the email or user ID to promote</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Role</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as any)}>
                <SelectTrigger className="mt-1 bg-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="sub_admin">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-purple-400" />
                      Sub-Admin (Limited access)
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-primary" />
                      Admin (Full access)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border/40">
              <p className="text-xs font-medium mb-2">
                {newRole === "admin" ? "Admin" : "Sub-Admin"} Permissions:
              </p>
              <div className="grid grid-cols-2 gap-1">
                {PERMISSIONS.map(p => (
                  <div key={p.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className={`w-1.5 h-1.5 rounded-full ${newRole === "admin" ? "bg-primary" : "bg-purple-400"}`} />
                    {p.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => promoteMutation.mutate({ emailOrId: searchEmail, role: newRole })}
              disabled={promoteMutation.isPending || !searchEmail.trim()}
            >
              Promote User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation */}
      <AlertDialog open={removeId !== null} onOpenChange={() => setRemoveId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Admin Access</AlertDialogTitle>
            <AlertDialogDescription>This will demote the user to a regular user account.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive" onClick={() => removeId && demoteMutation.mutate({ userId: removeId })}>Remove Access</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
