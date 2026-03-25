import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, FileText, Bell, Image, Megaphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function Content() {
  const [activeTab, setActiveTab] = useState("notices");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; type: string } | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});

  const utils = trpc.useUtils();
  const { data: notices } = trpc.content.notices.list.useQuery();
  const { data: announcements } = trpc.content.announcements.list.useQuery();
  const { data: banners } = trpc.content.eventBanners.list.useQuery();
  const { data: adImages } = trpc.content.adImages.list.useQuery();

  // Mutations
  const createNotice = trpc.content.notices.create.useMutation({ onSuccess: () => { toast.success("Notice created"); utils.content.notices.list.invalidate(); setDialogOpen(false); } });
  const updateNotice = trpc.content.notices.update.useMutation({ onSuccess: () => { toast.success("Updated"); utils.content.notices.list.invalidate(); setDialogOpen(false); } });
  const deleteNotice = trpc.content.notices.delete.useMutation({ onSuccess: () => { toast.success("Deleted"); utils.content.notices.list.invalidate(); setDeleteTarget(null); } });

  const createAnnouncement = trpc.content.announcements.create.useMutation({ onSuccess: () => { toast.success("Announcement created"); utils.content.announcements.list.invalidate(); setDialogOpen(false); } });
  const updateAnnouncement = trpc.content.announcements.update.useMutation({ onSuccess: () => { toast.success("Updated"); utils.content.announcements.list.invalidate(); setDialogOpen(false); } });
  const deleteAnnouncement = trpc.content.announcements.delete.useMutation({ onSuccess: () => { toast.success("Deleted"); utils.content.announcements.list.invalidate(); setDeleteTarget(null); } });

  const createBanner = trpc.content.eventBanners.create.useMutation({ onSuccess: () => { toast.success("Banner created"); utils.content.eventBanners.list.invalidate(); setDialogOpen(false); } });
  const updateBanner = trpc.content.eventBanners.update.useMutation({ onSuccess: () => { toast.success("Updated"); utils.content.eventBanners.list.invalidate(); setDialogOpen(false); } });
  const deleteBanner = trpc.content.eventBanners.delete.useMutation({ onSuccess: () => { toast.success("Deleted"); utils.content.eventBanners.list.invalidate(); setDeleteTarget(null); } });

  const createAd = trpc.content.adImages.create.useMutation({ onSuccess: () => { toast.success("Ad created"); utils.content.adImages.list.invalidate(); setDialogOpen(false); } });
  const updateAd = trpc.content.adImages.update.useMutation({ onSuccess: () => { toast.success("Updated"); utils.content.adImages.list.invalidate(); setDialogOpen(false); } });
  const deleteAd = trpc.content.adImages.delete.useMutation({ onSuccess: () => { toast.success("Deleted"); utils.content.adImages.list.invalidate(); setDeleteTarget(null); } });

  const openCreate = (type: string) => {
    setEditing(null);
    setForm({ type, isActive: true, isPinned: false, sortOrder: 0, targetRole: "all", announcementType: "info", position: "sidebar" });
    setDialogOpen(true);
  };

  const openEdit = (item: any, type: string) => {
    setEditing({ ...item, contentType: type });
    setForm({ ...item, type, announcementType: item.type ?? "info" });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const type = editing?.contentType ?? form.type;
    if (type === "notices") {
      const payload = { title: form.title, content: form.content, isActive: form.isActive ?? true, isPinned: form.isPinned ?? false, sortOrder: Number(form.sortOrder ?? 0) };
      editing ? updateNotice.mutate({ id: editing.id, ...payload }) : createNotice.mutate(payload);
    } else if (type === "announcements") {
      const payload = { title: form.title, content: form.content, type: form.announcementType ?? "info", isActive: form.isActive ?? true, targetRole: form.targetRole ?? "all" };
      editing ? updateAnnouncement.mutate({ id: editing.id, ...payload }) : createAnnouncement.mutate(payload);
    } else if (type === "banners") {
      const payload = { title: form.title, imageUrl: form.imageUrl, linkUrl: form.linkUrl, isActive: form.isActive ?? true, sortOrder: Number(form.sortOrder ?? 0) };
      editing ? updateBanner.mutate({ id: editing.id, ...payload }) : createBanner.mutate(payload);
    } else if (type === "ads") {
      const payload = { title: form.title, imageUrl: form.imageUrl, linkUrl: form.linkUrl, position: form.position ?? "sidebar", isActive: form.isActive ?? true, sortOrder: Number(form.sortOrder ?? 0) };
      editing ? updateAd.mutate({ id: editing.id, ...payload }) : createAd.mutate(payload);
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "notices") deleteNotice.mutate({ id: deleteTarget.id });
    else if (deleteTarget.type === "announcements") deleteAnnouncement.mutate({ id: deleteTarget.id });
    else if (deleteTarget.type === "banners") deleteBanner.mutate({ id: deleteTarget.id });
    else if (deleteTarget.type === "ads") deleteAd.mutate({ id: deleteTarget.id });
  };

  const handleToggle = (id: number, type: string, current: boolean) => {
    if (type === "notices") updateNotice.mutate({ id, isActive: !current });
    else if (type === "announcements") updateAnnouncement.mutate({ id, isActive: !current });
    else if (type === "banners") updateBanner.mutate({ id, isActive: !current });
    else if (type === "ads") updateAd.mutate({ id, isActive: !current });
  };

  const ContentRow = ({ item, type, icon: Icon }: { item: any; type: string; icon: React.ElementType }) => (
    <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border/40 hover:border-primary/20 transition-all group">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{item.title}</p>
        {item.content && <p className="text-xs text-muted-foreground truncate mt-0.5">{item.content.slice(0, 80)}</p>}
        {item.imageUrl && <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">{item.imageUrl.slice(0, 50)}...</p>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {item.type && <Badge variant="outline" className="text-xs">{item.type}</Badge>}
        {item.isPinned && <Badge className="badge-pending text-xs">Pinned</Badge>}
        <Badge className={item.isActive ? "badge-active" : "badge-inactive"}>{item.isActive ? "Active" : "Off"}</Badge>
        <button onClick={() => handleToggle(item.id, type, item.isActive)} className="text-muted-foreground hover:text-primary transition-colors">
          {item.isActive ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5" />}
        </button>
        <button onClick={() => openEdit(item, type)} className="text-muted-foreground hover:text-primary transition-colors">
          <Pencil className="w-4 h-4" />
        </button>
        <button onClick={() => setDeleteTarget({ id: item.id, type })} className="text-muted-foreground hover:text-destructive transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const tabConfig = [
    { value: "notices", label: "Notices", icon: FileText, data: notices, count: notices?.length ?? 0 },
    { value: "announcements", label: "Announcements", icon: Megaphone, data: announcements, count: announcements?.length ?? 0 },
    { value: "banners", label: "Event Banners", icon: Image, data: banners, count: banners?.length ?? 0 },
    { value: "ads", label: "Ad Images", icon: Bell, data: adImages, count: adImages?.length ?? 0 },
  ];

  return (
    <AdminLayout title="Content Management">
      <div className="space-y-5">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between">
            <TabsList className="bg-muted/50">
              {tabConfig.map(t => (
                <TabsTrigger key={t.value} value={t.value} className="gap-2 text-xs">
                  <t.icon className="w-3.5 h-3.5" />
                  {t.label}
                  <Badge variant="outline" className="ml-0.5 text-xs px-1.5 py-0 h-4">{t.count}</Badge>
                </TabsTrigger>
              ))}
            </TabsList>
            <Button onClick={() => openCreate(activeTab)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add {tabConfig.find(t => t.value === activeTab)?.label.split(" ")[0]}
            </Button>
          </div>

          {tabConfig.map(tab => (
            <TabsContent key={tab.value} value={tab.value} className="mt-4">
              <Card className="border-border/40">
                <CardContent className="p-4">
                  {tab.data && tab.data.length > 0 ? (
                    <div className="space-y-2">
                      {tab.data.map((item: any) => (
                        <ContentRow key={item.id} item={item} type={tab.value} icon={tab.icon} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <tab.icon className="w-10 h-10 text-muted-foreground/30 mb-3" />
                      <p className="text-muted-foreground text-sm">No {tab.label.toLowerCase()} yet</p>
                      <Button variant="outline" size="sm" onClick={() => openCreate(tab.value)} className="mt-3 gap-2">
                        <Plus className="w-3 h-3" />
                        Create First
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display">{editing ? "Edit Content" : "Create Content"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs text-muted-foreground">Title *</Label>
              <Input value={form.title ?? ""} onChange={e => setForm((f: any) => ({ ...f, title: e.target.value }))} className="mt-1 bg-input" />
            </div>

            {(form.type === "notices" || form.type === "announcements") && (
              <div>
                <Label className="text-xs text-muted-foreground">Content *</Label>
                <Textarea value={form.content ?? ""} onChange={e => setForm((f: any) => ({ ...f, content: e.target.value }))} className="mt-1 bg-input resize-none" rows={4} />
              </div>
            )}

            {(form.type === "banners" || form.type === "ads") && (
              <>
                <div>
                  <Label className="text-xs text-muted-foreground">Image URL *</Label>
                  <Input value={form.imageUrl ?? ""} onChange={e => setForm((f: any) => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." className="mt-1 bg-input" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Link URL</Label>
                  <Input value={form.linkUrl ?? ""} onChange={e => setForm((f: any) => ({ ...f, linkUrl: e.target.value }))} placeholder="https://..." className="mt-1 bg-input" />
                </div>
              </>
            )}

            {form.type === "announcements" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <Select value={form.announcementType ?? "info"} onValueChange={v => setForm((f: any) => ({ ...f, announcementType: v }))}>
                    <SelectTrigger className="mt-1 bg-input"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Target</Label>
                  <Select value={form.targetRole ?? "all"} onValueChange={v => setForm((f: any) => ({ ...f, targetRole: v }))}>
                    <SelectTrigger className="mt-1 bg-input"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="user">Users Only</SelectItem>
                      <SelectItem value="admin">Admins Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {form.type === "ads" && (
              <div>
                <Label className="text-xs text-muted-foreground">Position</Label>
                <Select value={form.position ?? "sidebar"} onValueChange={v => setForm((f: any) => ({ ...f, position: v }))}>
                  <SelectTrigger className="mt-1 bg-input"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="sidebar">Sidebar</SelectItem>
                    <SelectItem value="header">Header</SelectItem>
                    <SelectItem value="footer">Footer</SelectItem>
                    <SelectItem value="popup">Popup</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {form.type === "notices" && (
              <div className="flex items-center gap-3">
                <Switch checked={form.isPinned ?? false} onCheckedChange={v => setForm((f: any) => ({ ...f, isPinned: v }))} />
                <Label className="text-sm">Pin to top</Label>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Switch checked={form.isActive ?? true} onCheckedChange={v => setForm((f: any) => ({ ...f, isActive: v }))} />
              <Label className="text-sm">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>
              {editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteTarget !== null} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Content</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive" onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
