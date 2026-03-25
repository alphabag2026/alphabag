import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { ArrowLeft, Loader2, Bell, Calendar } from "lucide-react";

export default function NoticesPage() {
  const { data: notices, isLoading } = trpc.public.notices.useQuery();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
              <ArrowLeft className="w-4 h-4" /> Home
            </Button>
          </Link>
          <span className="text-sm font-medium">Announcements</span>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Announcements</h1>
            <p className="text-sm text-muted-foreground">Latest news and updates from AlphaBag</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : notices && notices.length > 0 ? (
          <div className="space-y-4">
            {notices.map((notice, i) => (
              <Card key={notice.id} className={`border-border/40 ${i === 0 ? "border-primary/30 bg-primary/5" : ""}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-semibold text-foreground leading-tight">{notice.title}</h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {i === 0 && <Badge className="text-xs bg-primary text-primary-foreground">Latest</Badge>}
                      {notice.isActive && <Badge variant="outline" className="text-xs text-green-400 border-green-500/30">Active</Badge>}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">{notice.content}</p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {new Date(notice.createdAt).toLocaleDateString("en-US", {
                      year: "numeric", month: "long", day: "numeric"
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No announcements yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
