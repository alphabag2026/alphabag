import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { toast } from "sonner";
import {
  TrendingUp, Cpu, Copy, Share2, Users, Wallet,
  ArrowRight, ChevronRight, Loader2, TicketCheck,
  LayoutDashboard, LogOut, Home, FileText
} from "lucide-react";

export default function UserDashboard() {
  const { user, isAuthenticated, loading, logout } = useAuth({ redirectOnUnauthenticated: true });
  const { data: profile, refetch: refetchProfile } = trpc.user.profile.useQuery(undefined, { enabled: isAuthenticated });
  const { data: investments, isLoading: invLoading } = trpc.user.investments.useQuery(undefined, { enabled: isAuthenticated });
  const { data: nodeOrders, isLoading: nodeLoading } = trpc.user.nodeOrders.useQuery(undefined, { enabled: isAuthenticated });
  const { data: referralStats } = trpc.user.referralStats.useQuery(undefined, { enabled: isAuthenticated });
  const { data: tickets } = trpc.user.tickets.useQuery(undefined, { enabled: isAuthenticated });

  const generateCode = trpc.user.generateReferralCode.useMutation({
    onSuccess: (data) => {
      toast.success(`Referral code generated: ${data.code}`);
      refetchProfile();
    },
    onError: () => toast.error("Failed to generate referral code"),
  });

  const copyReferralCode = () => {
    if (profile?.referralCode) {
      navigator.clipboard.writeText(profile.referralCode);
      toast.success("Referral code copied!");
    }
  };

  const totalInvested = investments?.reduce((sum, inv) => sum + Number(inv.amount), 0) ?? 0;
  const activeInvestments = investments?.filter(inv => inv.status === "active").length ?? 0;
  const totalNodeOrders = nodeOrders?.length ?? 0;
  const openTickets = tickets?.filter(t => t.status === "open").length ?? 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border/40 bg-card/30 flex flex-col fixed h-full">
        <div className="p-6 border-b border-border/40">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-7 h-7 rounded bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">A</span>
              </div>
              <span className="font-display font-bold text-sm">AlphaBag</span>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {[
            { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
            { href: "/plans", icon: TrendingUp, label: "Investment Plans" },
            { href: "/nodes", icon: Cpu, label: "Nodes" },
            { href: "/referrals", icon: Users, label: "Referrals" },
            { href: "/tickets", icon: TicketCheck, label: "Support", badge: openTickets },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <div className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </div>
                {item.badge ? (
                  <Badge variant="destructive" className="text-xs h-5 min-w-5 flex items-center justify-center">
                    {item.badge}
                  </Badge>
                ) : null}
              </div>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-border/40">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-bold text-xs">
                {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.name ?? "User"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email ?? ""}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground" onClick={logout}>
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold">
              Welcome back, {user?.name?.split(" ")[0] ?? "Investor"}
            </h1>
            <p className="text-muted-foreground mt-1">Here's your portfolio overview</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Invested", value: `$${totalInvested.toLocaleString()}`, icon: TrendingUp, color: "text-primary" },
              { label: "Active Plans", value: activeInvestments, icon: LayoutDashboard, color: "text-blue-400" },
              { label: "Node Orders", value: totalNodeOrders, icon: Cpu, color: "text-green-400" },
              { label: "Referrals", value: referralStats?.totalReferrals ?? 0, icon: Users, color: "text-purple-400" },
            ].map((stat) => (
              <Card key={stat.label} className="border-border/40">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-muted-foreground">{stat.label}</span>
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Investments */}
            <div className="lg:col-span-2">
              <Card className="border-border/40">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">My Investments</CardTitle>
                    <Link href="/plans">
                      <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground">
                        New Plan <ChevronRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {invLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : investments && investments.length > 0 ? (
                    <div className="space-y-3">
                      {investments.slice(0, 5).map((inv) => (
                        <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/30">
                          <div>
                            <p className="text-sm font-medium text-foreground">Plan #{inv.planId}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(inv.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-foreground">${Number(inv.amount).toLocaleString()}</p>
                            <Badge variant={inv.status === "active" ? "default" : "secondary"} className="text-xs">
                              {inv.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <TrendingUp className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground mb-4">No investments yet</p>
                      <Link href="/plans">
                        <Button size="sm" className="gap-2">
                          Explore Plans <ArrowRight className="w-3 h-3" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Referral Card */}
            <div className="space-y-4">
              <Card className="border-border/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Referral Program</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-primary mb-1">
                      {referralStats?.totalReferrals ?? 0}
                    </div>
                    <p className="text-xs text-muted-foreground">Total Referrals</p>
                  </div>
                  {profile?.referralCode ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50 border border-border/30">
                        <code className="flex-1 text-sm font-mono text-primary">{profile.referralCode}</code>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={copyReferralCode}>
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                      <Button variant="outline" size="sm" className="w-full gap-2" onClick={copyReferralCode}>
                        <Share2 className="w-3 h-3" /> Share Code
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => generateCode.mutate()}
                      disabled={generateCode.isPending}
                    >
                      {generateCode.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null}
                      Generate Code
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Wallet Card */}
              <Card className="border-border/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Wallet</CardTitle>
                </CardHeader>
                <CardContent>
                  {profile?.walletAddress ? (
                    <div className="p-3 rounded-lg bg-background/50 border border-border/30">
                      <p className="text-xs text-muted-foreground mb-1">Connected Wallet</p>
                      <code className="text-xs font-mono text-foreground break-all">
                        {profile.walletAddress.slice(0, 10)}...{profile.walletAddress.slice(-8)}
                      </code>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Wallet className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground mb-3">No wallet connected</p>
                      <Link href="/profile">
                        <Button variant="outline" size="sm" className="w-full">
                          Connect Wallet
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Node Orders */}
          <Card className="border-border/40 mt-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">My Node Orders</CardTitle>
                <Link href="/nodes">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground">
                    Buy Node <ChevronRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {nodeLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : nodeOrders && nodeOrders.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {nodeOrders.slice(0, 6).map((order) => (
                    <div key={order.id} className="p-3 rounded-lg bg-background/50 border border-border/30">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">Node #{order.nodeId}</p>
                        <Badge variant={
                          order.status === "confirmed" ? "default" :
                          order.status === "cancelled" ? "destructive" : "secondary"
                        } className="text-xs">
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-sm font-bold text-foreground">${Number(order.totalAmount).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Qty: {order.quantity}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <Cpu className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">No node orders yet</p>
                  <Link href="/nodes">
                    <Button size="sm" className="gap-2">
                      Explore Nodes <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
