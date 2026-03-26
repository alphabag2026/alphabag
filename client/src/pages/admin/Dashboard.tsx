import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import {
  DollarSign, Users, Network, TicketCheck, TrendingUp,
  ArrowUpRight, ArrowDownRight, Activity
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

const COLORS = [
  "oklch(0.78 0.14 80)",
  "oklch(0.65 0.18 200)",
  "oklch(0.70 0.18 150)",
  "oklch(0.72 0.20 300)",
  "oklch(0.68 0.20 30)",
];

const RCOLORS = ["#C9A84C", "#4A9EBF", "#4ABF7E", "#9B6BBF", "#BF7A4A"];

function StatCard({
  title, value, subtitle, icon: Icon, gradient, trend
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  gradient: string;
  trend?: { value: number; up: boolean };
}) {
  return (
    <Card className={`${gradient} border-border/40 relative overflow-hidden`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            {trend && (
              <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend.up ? "text-emerald-400" : "text-red-400"}`}>
                {trend.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                <span>{trend.value}% from last month</span>
              </div>
            )}
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-xl text-xs">
        <p className="text-muted-foreground mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }} className="font-semibold">
            {p.name}: {typeof p.value === "number" ? `$${p.value.toLocaleString()}` : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [trendDays, setTrendDays] = useState(30);

  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();
  const { data: topInvestors } = trpc.dashboard.topInvestors.useQuery({ limit: 8 });
  const { data: trend } = trpc.dashboard.investmentTrend.useQuery({ days: trendDays });
  const { data: distribution } = trpc.dashboard.planDistribution.useQuery();
  const { data: plans } = trpc.plans.list.useQuery({ planType: "investment" });

  const trendData = useMemo(() => {
    if (!trend) return [];
    return trend.map((t: any) => ({
      date: new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      volume: Number(t.volume ?? 0),
      count: Number(t.count ?? 0),
    }));
  }, [trend]);

  const pieData = useMemo(() => {
    if (!distribution || !plans) return [];
    return distribution.slice(0, 5).map((d: any) => {
      const plan = plans.find((p: any) => p.id === d.planId);
      return {
        name: plan?.name ?? `Plan #${d.planId}`,
        value: Number(d.totalAmount ?? 0),
        count: Number(d.count ?? 0),
      };
    });
  }, [distribution, plans]);

  const totalRevenue = (stats?.totalInvestment ?? 0) + (stats?.totalNodeRevenue ?? 0);
  const conversionRate = stats?.totalUsers ? ((stats.totalReferrals / stats.totalUsers) * 100).toFixed(1) : "0";

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          <StatCard
            title="Total Revenue"
            value={`$${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            subtitle="Investment + Nodes"
            icon={DollarSign}
            gradient="stat-gradient-gold"
            trend={{ value: 12.5, up: true }}
          />
          <StatCard
            title="Total Users"
            value={stats?.totalUsers?.toLocaleString() ?? "—"}
            subtitle="Registered members"
            icon={Users}
            gradient="stat-gradient-blue"
            trend={{ value: 8.2, up: true }}
          />
          <StatCard
            title="Referrals"
            value={stats?.totalReferrals?.toLocaleString() ?? "—"}
            subtitle="Total referral links"
            icon={Network}
            gradient="stat-gradient-green"
            trend={{ value: 5.1, up: true }}
          />
          <StatCard
            title="Conversion Rate"
            value={`${conversionRate}%`}
            subtitle="Referral conversion"
            icon={TrendingUp}
            gradient="stat-gradient-purple"
            trend={{ value: 2.3, up: false }}
          />
          <StatCard
            title="Open Tickets"
            value={stats?.openTickets?.toLocaleString() ?? "0"}
            subtitle="Pending support"
            icon={TicketCheck}
            gradient="stat-gradient-red"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Investment Trend */}
          <Card className="xl:col-span-2 border-border/40">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Investment Volume Trend
                </CardTitle>
                <Tabs value={String(trendDays)} onValueChange={(v) => setTrendDays(Number(v))}>
                  <TabsList className="h-7 bg-muted/50">
                    <TabsTrigger value="7" className="text-xs px-2 h-5">7D</TabsTrigger>
                    <TabsTrigger value="14" className="text-xs px-2 h-5">14D</TabsTrigger>
                    <TabsTrigger value="30" className="text-xs px-2 h-5">30D</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trendData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                  <defs>
                    <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.02 260)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "oklch(0.60 0.01 260)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "oklch(0.60 0.01 260)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="volume" name="Volume (USDT)" stroke="#C9A84C" strokeWidth={2} fill="url(#volumeGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {pieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                        {pieData.map((_: any, i: number) => (
                          <Cell key={i} fill={RCOLORS[i % RCOLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, "Volume"]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-2">
                    {pieData.map((d: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: RCOLORS[i % RCOLORS.length] }} />
                          <span className="text-muted-foreground truncate max-w-24">{d.name}</span>
                        </div>
                        <span className="font-medium text-foreground">${d.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                  No investment data yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Top Investors */}
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Top Investors</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {topInvestors && topInvestors.length > 0 ? (
                <div className="space-y-2">
                  {topInvestors.map((inv: any, i: number) => (
                    <div key={inv.userId} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-accent/30 transition-colors">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        i === 0 ? "bg-yellow-500/20 text-yellow-400" :
                        i === 1 ? "bg-slate-400/20 text-slate-300" :
                        i === 2 ? "bg-amber-700/20 text-amber-600" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">User #{inv.userId}</p>
                        <p className="text-xs text-muted-foreground">{inv.investmentCount} investments</p>
                      </div>
                      <span className="text-sm font-semibold text-primary">
                        ${Number(inv.totalAmount ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                  No investment data yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Volume Trend Bar */}
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Daily Investment Count</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={trendData.slice(-14)} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.02 260)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "oklch(0.60 0.01 260)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "oklch(0.60 0.01 260)" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Transactions" fill="#4A9EBF" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
