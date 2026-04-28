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
  LayoutDashboard, LogOut, Menu, X, Home
} from "lucide-react";
import { useState, useMemo } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid
} from "recharts";

const PLAN_COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899", "#f97316"];

export default function UserDashboard() {
  const { user, isAuthenticated, loading, logout } = useAuth({ redirectOnUnauthenticated: true });
  const { data: profile, refetch: refetchProfile } = trpc.user.profile.useQuery(undefined, { enabled: isAuthenticated });
  const { data: investments, isLoading: invLoading } = trpc.user.investments.useQuery(undefined, { enabled: isAuthenticated });
  const { data: nodeOrders, isLoading: nodeLoading } = trpc.user.nodeOrders.useQuery(undefined, { enabled: isAuthenticated });
  const { data: referralStats } = trpc.user.referralStats.useQuery(undefined, { enabled: isAuthenticated });
  const { data: tickets } = trpc.user.tickets.useQuery(undefined, { enabled: isAuthenticated });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "portfolio" | "history" | "timeline">("overview");

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

  // 9번: 포트폴리오 파이 차트 데이터
  const portfolioData = useMemo(() => {
    if (!investments || investments.length === 0) return [];
    const byPlan: Record<string, number> = {};
    investments.forEach(inv => {
      const key = `Plan #${inv.planId}`;
      byPlan[key] = (byPlan[key] || 0) + Number(inv.amount);
    });
    return Object.entries(byPlan).map(([name, value]) => ({ name, value }));
  }, [investments]);

  // 10번: 수익 히스토리 라인 차트
  const historyData = useMemo(() => {
    if (!investments || investments.length === 0) return [];
    const byMonth: Record<string, number> = {};
    investments.forEach(inv => {
      const d = new Date(inv.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      byMonth[key] = (byMonth[key] || 0) + Number(inv.amount);
    });
    const sorted = Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b));
    let cumulative = 0;
    return sorted.map(([month, amount]) => {
      cumulative += amount;
      return { month, amount, cumulative };
    });
  }, [investments]);

  // 11번: 활동 타임라인
  const timelineItems = useMemo(() => {
    const items: Array<{ id: string; label: string; date: Date; icon: string; color: string }> = [];
    (investments || []).forEach(inv => items.push({ id: `inv-${inv.id}`, label: `Plan #${inv.planId} 투자 $${Number(inv.amount).toLocaleString()}`, date: new Date(inv.createdAt), icon: "💰", color: "text-amber-500 bg-amber-100" }));
    (nodeOrders || []).forEach(order => items.push({ id: `node-${order.id}`, label: `Node #${order.nodeId} 구매 $${Number(order.totalAmount).toLocaleString()}`, date: new Date(order.createdAt), icon: "⚡", color: "text-purple-500 bg-purple-100" }));
    (tickets || []).forEach(ticket => items.push({ id: `ticket-${ticket.id}`, label: `문의 등록: ${(ticket as any).subject || "Support Ticket"}`, date: new Date(ticket.createdAt), icon: "🎫", color: "text-blue-500 bg-blue-100" }));
    return items.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 20);
  }, [investments, nodeOrders, tickets]);
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

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/plans", icon: TrendingUp, label: "Investment Plans" },
    { href: "/nodes", icon: Cpu, label: "Nodes" },
    { href: "/referrals", icon: Users, label: "Referrals" },
    { href: "/tickets", icon: TicketCheck, label: "Support", badge: openTickets },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 모바일 오버레이 배경 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 사이드바 - 모바일: 오버레이, 데스크탑: 고정 */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 border-r border-border/40 bg-card/95 backdrop-blur flex flex-col z-50
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        <div className="p-4 border-b border-border/40 flex items-center justify-between">
          <Link href="/" onClick={() => setSidebarOpen(false)}>
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-7 h-7 rounded bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">A</span>
              </div>
              <span className="font-bold text-sm">AlphaBag</span>
            </div>
          </Link>
          {/* 모바일 닫기 버튼 */}
          <button
            className="lg:hidden p-1 rounded-lg hover:bg-accent transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
              <div className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 flex-shrink-0" />
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

        <div className="p-3 border-t border-border/40">
          <div className="flex items-center gap-3 px-3 py-2 mb-1 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-bold text-xs">
                {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.name ?? "User"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email ?? ""}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            onClick={logout}
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* 메인 콘텐츠 영역 */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        {/* 모바일 상단 헤더 */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14 border-b border-border/40 bg-background/95 backdrop-blur">
          <button
            className="p-2 rounded-lg hover:bg-accent transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">A</span>
            </div>
            <span className="font-bold text-sm">AlphaBag</span>
          </div>
          <Link href="/">
            <button className="p-2 rounded-lg hover:bg-accent transition-colors">
              <Home className="w-5 h-5" />
            </button>
          </Link>
        </header>

        {/* 페이지 콘텐츠 */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-5xl mx-auto">
            {/* 헤더 */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold">
                Welcome back, {user?.name?.split(" ")[0] ?? "Investor"}
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">Here's your portfolio overview</p>
            </div>

            {/* 통계 카드 - 모바일 2열, 데스크탑 4열 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {[
                { label: "Total Invested", value: `$${totalInvested.toLocaleString()}`, icon: TrendingUp, color: "text-primary" },
                { label: "Active Plans", value: activeInvestments, icon: LayoutDashboard, color: "text-blue-400" },
                { label: "Node Orders", value: totalNodeOrders, icon: Cpu, color: "text-green-400" },
                { label: "Referrals", value: referralStats?.totalReferrals ?? 0, icon: Users, color: "text-purple-400" },
              ].map((stat) => (
                <Card key={stat.label} className="border-border/40">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground leading-tight">{stat.label}</span>
                      <stat.icon className={`w-4 h-4 flex-shrink-0 ${stat.color}`} />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-foreground">{stat.value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 탭 네비게이션 */}
            <div className="flex gap-1 mb-4 border-b border-border/40 overflow-x-auto">
              {[
                { key: "overview", label: "Overview" },
                { key: "portfolio", label: "Portfolio" },
                { key: "history", label: "History" },
                { key: "timeline", label: "Activity" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as typeof activeTab)}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                    activeTab === key
                      ? "bg-primary/10 text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {activeTab === "overview" && <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* 투자 목록 */}
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
                      <div className="space-y-2">
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

              {/* 사이드 카드 */}
              <div className="space-y-4">
                {/* 레퍼럴 카드 */}
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
                          <code className="flex-1 text-sm font-mono text-primary truncate">{profile.referralCode}</code>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 flex-shrink-0" onClick={copyReferralCode}>
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

                {/* 지갑 카드 */}
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
            </div>}

            {/* 9번: 포트폴리오 파이 차트 */}
            {activeTab === "portfolio" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="border-border/40">
                  <CardHeader className="pb-3"><CardTitle className="text-base">Portfolio Distribution</CardTitle></CardHeader>
                  <CardContent>
                    {portfolioData.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground"><TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="text-sm">No investment data</p></div>
                    ) : (
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie data={portfolioData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                            {portfolioData.map((_, index) => (<Cell key={index} fill={PLAN_COLORS[index % PLAN_COLORS.length]} />))}
                          </Pie>
                          <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, "Amount"]} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
                <Card className="border-border/40">
                  <CardHeader className="pb-3"><CardTitle className="text-base">Plan Breakdown</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {portfolioData.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No data</p> : portfolioData.map((item, i) => {
                        const pct = totalInvested > 0 ? (item.value / totalInvested) * 100 : 0;
                        return (
                          <div key={item.name}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-foreground font-medium">{item.name}</span>
                              <span className="text-muted-foreground">${item.value.toLocaleString()} ({pct.toFixed(1)}%)</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: PLAN_COLORS[i % PLAN_COLORS.length] }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 10번: 수익 히스토리 */}
            {activeTab === "history" && (
              <Card className="border-border/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Investment History</CardTitle>
                  <p className="text-xs text-muted-foreground">Monthly cumulative investment</p>
                </CardHeader>
                <CardContent>
                  {historyData.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground"><p className="text-sm">No history data</p></div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={historyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v: number) => `$${(v/1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, ""]} contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                        <Line type="monotone" dataKey="cumulative" stroke="#f59e0b" strokeWidth={2.5} dot={{ fill: "#f59e0b", r: 4 }} name="Cumulative" />
                        <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6", r: 3 }} name="Monthly" strokeDasharray="5 5" />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 11번: 활동 타임라인 */}
            {activeTab === "timeline" && (
              <Card className="border-border/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Activity Timeline</CardTitle>
                  <p className="text-xs text-muted-foreground">Recent activities</p>
                </CardHeader>
                <CardContent>
                  {timelineItems.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground"><p className="text-sm">No activity yet</p></div>
                  ) : (
                    <div className="relative">
                      <div className="absolute left-5 top-0 bottom-0 w-px bg-border/40" />
                      <div className="space-y-4">
                        {timelineItems.map((item) => (
                          <div key={item.id} className="flex gap-4 relative">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base flex-shrink-0 z-10 ${item.color}`}>{item.icon}</div>
                            <div className="flex-1 min-w-0 pt-1">
                              <p className="text-sm text-foreground font-medium leading-tight">{item.label}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{item.date.toLocaleDateString()} {item.date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "overview" && <Card className="border-border/40 mt-4">
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
            </Card>}
          </div>
        </main>
      </div>
    </div>
  );
}
