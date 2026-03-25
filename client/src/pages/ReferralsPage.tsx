import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { toast } from "sonner";
import {
  ArrowLeft, Loader2, Users, Copy, Share2, Gift,
  TrendingUp, ChevronRight, UserPlus
} from "lucide-react";

export default function ReferralsPage() {
  const { isAuthenticated, loading } = useAuth({ redirectOnUnauthenticated: true });
  const { data: profile, refetch } = trpc.user.profile.useQuery(undefined, { enabled: isAuthenticated });
  const { data: stats } = trpc.user.referralStats.useQuery(undefined, { enabled: isAuthenticated });

  const generateCode = trpc.user.generateReferralCode.useMutation({
    onSuccess: (data) => {
      toast.success(`Referral code generated: ${data.code}`);
      refetch();
    },
    onError: () => toast.error("Failed to generate referral code"),
  });

  const copyCode = () => {
    if (profile?.referralCode) {
      navigator.clipboard.writeText(profile.referralCode);
      toast.success("Referral code copied!");
    }
  };

  const shareLink = () => {
    const url = `${window.location.origin}?ref=${profile?.referralCode}`;
    navigator.clipboard.writeText(url);
    toast.success("Referral link copied!");
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
            <span className="text-sm font-medium">Referral Program</span>
          </div>
          <Link href="/profile">
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
              Profile <ChevronRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        {/* Hero */}
        <div className="text-center py-8 px-6 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20">
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <Gift className="w-7 h-7 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold mb-2">Earn with Referrals</h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Invite friends to AlphaBag and earn commissions on their investments. Build your network and grow your passive income.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Referrals", value: stats?.totalReferrals ?? 0, icon: Users, color: "text-primary" },
            { label: "Active Referrals", value: stats?.activeReferrals ?? 0, icon: UserPlus, color: "text-green-400" },
            { label: "Referral Code", value: stats?.referralCode ? "Active" : "None", icon: TrendingUp, color: "text-blue-400" },
          ].map((stat) => (
            <Card key={stat.label} className="border-border/40">
              <CardContent className="p-4 text-center">
                <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
                <div className="text-xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Referral Code */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">My Referral Code</CardTitle>
          </CardHeader>
          <CardContent>
            {profile?.referralCode ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <code className="flex-1 text-xl font-mono font-bold text-primary tracking-widest">
                    {profile.referralCode}
                  </code>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={copyCode}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 gap-2" onClick={copyCode}>
                    <Copy className="w-4 h-4" /> Copy Code
                  </Button>
                  <Button variant="outline" className="flex-1 gap-2" onClick={shareLink}>
                    <Share2 className="w-4 h-4" /> Share Link
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-4">Generate your unique referral code to start earning</p>
                <Button
                  onClick={() => generateCode.mutate()}
                  disabled={generateCode.isPending}
                  className="gap-2"
                >
                  {generateCode.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Gift className="w-4 h-4" />}
                  Generate Referral Code
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* How it Works */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { step: "1", title: "Generate Your Code", desc: "Create your unique referral code above." },
                { step: "2", title: "Share with Friends", desc: "Share your code or referral link with friends." },
                { step: "3", title: "They Sign Up & Invest", desc: "Your friends register using your referral code." },
                { step: "4", title: "Earn Commissions", desc: "Earn a percentage of their investment returns." },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold text-sm">{item.step}</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Referred By */}
        {profile?.referredBy && (
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Referred By</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/30">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Referral Code Applied</p>
                  <code className="text-xs text-muted-foreground">{profile.referredBy}</code>
                </div>
                <Badge variant="outline" className="ml-auto text-xs text-green-400 border-green-500/30">Active</Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
