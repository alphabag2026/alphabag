import { useState, useMemo } from "react";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { BarChart2, TrendingUp, PieChart as PieIcon, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

const RCOLORS = ["#C9A84C", "#4A9EBF", "#4ABF7E", "#9B6BBF", "#BF7A4A", "#BF4A4A", "#4A7ABF", "#BF9B4A"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-xl text-xs">
        <p className="text-muted-foreground mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }} className="font-semibold">
            {p.name}: {typeof p.value === "number" && p.name?.includes("Volume") ? `$${p.value.toLocaleString()}` : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const [trendDays, setTrendDays] = useState(30);

  const { data: trend } = trpc.dashboard.investmentTrend.useQuery({ days: trendDays });
  const { data: distribution } = trpc.dashboard.planDistribution.useQuery();
  const { data: topInvestors } = trpc.dashboard.topInvestors.useQuery({ limit: 10 });
  const { data: plans } = trpc.plans.list.useQuery({ planType: "investment" });
  const { data: stats } = trpc.dashboard.stats.useQuery();

  const trendData = useMemo(() => {
    if (!trend) return [];
    return trend.map((t: any) => ({
      date: new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      volume: Number(t.volume ?? 0),
      count: Number(t.count ?? 0),
      cumulative: 0,
    })).reduce((acc: any[], item, i) => {
      const prev = acc[i - 1]?.cumulative ?? 0;
      acc.push({ ...item, cumulative: prev + item.volume });
      return acc;
    }, []);
  }, [trend]);

  const pieData = useMemo(() => {
    if (!distribution || !plans) return [];
    return distribution.slice(0, 8).map((d: any) => {
      const plan = plans.find((p: any) => p.id === d.planId);
      return {
        name: plan?.name ?? `Plan #${d.planId}`,
        value: Number(d.totalAmount ?? 0),
        count: Number(d.count ?? 0),
      };
    });
  }, [distribution, plans]);

  const totalVolume = trendData.reduce((s: number, t: any) => s + t.volume, 0);
  const totalTx = trendData.reduce((s: number, t: any) => s + t.count, 0);
  const avgDailyVolume = trendData.length > 0 ? totalVolume / trendData.length : 0;

  return (
    <AdminLayout title="Analytics">
      <div className="space-y-5">
        {/* Period Selector */}
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">Investment analytics and performance metrics</p>
          <Tabs value={String(trendDays)} onValueChange={(v) => setTrendDays(Number(v))}>
            <TabsList className="bg-muted/50">
              <TabsTrigger value="7" className="text-xs">7D</TabsTrigger>
              <TabsTrigger value="14" className="text-xs">14D</TabsTrigger>
              <TabsTrigger value="30" className="text-xs">30D</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: "Period Volume", value: `$${totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: TrendingUp, color: "text-primary" },
            { label: "Transactions", value: totalTx.toLocaleString(), icon: BarChart2, color: "text-blue-400" },
            { label: "Avg Daily Volume", value: `$${avgDailyVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: PieIcon, color: "text-emerald-400" },
            { label: "Active Users", value: stats?.totalUsers?.toLocaleString() ?? "—", icon: Users, color: "text-purple-400" },
          ].map((s, i) => (
            <Card key={i} className="border-border/40">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                    <p className="text-xl font-bold">{s.value}</p>
                  </div>
                  <s.icon className={`w-8 h-8 ${s.color} opacity-60`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Volume Trend */}
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Investment Volume Trend
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={trendData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                  <defs>
                    <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.02 260)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "oklch(0.60 0.01 260)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "oklch(0.60 0.01 260)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="volume" name="Volume (USDT)" stroke="#C9A84C" strokeWidth={2} fill="url(#volGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Cumulative Trend */}
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-primary" />
                Cumulative Investment
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={trendData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                  <defs>
                    <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4A9EBF" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4A9EBF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.02 260)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "oklch(0.60 0.01 260)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "oklch(0.60 0.01 260)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="cumulative" name="Cumulative Volume" stroke="#4A9EBF" strokeWidth={2} fill="url(#cumGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Category Distribution */}
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-primary" />
                Plan Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {pieData.length > 0 ? (
                <div className="flex gap-4">
                  <ResponsiveContainer width="50%" height={200}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                        {pieData.map((_: any, i: number) => (
                          <Cell key={i} fill={RCOLORS[i % RCOLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, "Volume"]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2 py-2">
                    {pieData.map((d: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: RCOLORS[i % RCOLORS.length] }} />
                          <span className="text-muted-foreground truncate max-w-24">{d.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${d.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                          <p className="text-muted-foreground">{d.count} txns</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">No data</div>
              )}
            </CardContent>
          </Card>

          {/* Daily Transaction Count */}
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-primary" />
                Daily Transactions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={trendData.slice(-14)} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.02 260)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "oklch(0.60 0.01 260)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "oklch(0.60 0.01 260)" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Transactions" fill="#4ABF7E" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Investors Ranking */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Top Investor Rankings
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 overflow-x-auto">
            <table className="w-full admin-table">
              <thead>
                <tr>
                  <th className="text-left">Rank</th>
                  <th className="text-left">User</th>
                  <th className="text-right">Investments</th>
                  <th className="text-right">Total Volume</th>
                  <th className="text-right">Share</th>
                </tr>
              </thead>
              <tbody>
                {topInvestors?.map((inv: any, i: number) => {
                  const share = totalVolume > 0 ? ((Number(inv.totalAmount ?? 0) / totalVolume) * 100).toFixed(1) : "0";
                  return (
                    <tr key={inv.userId}>
                      <td>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          i === 0 ? "bg-yellow-500/20 text-yellow-400" :
                          i === 1 ? "bg-slate-400/20 text-slate-300" :
                          i === 2 ? "bg-amber-700/20 text-amber-600" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {i + 1}
                        </div>
                      </td>
                      <td>
                        <p className="font-medium text-sm">User #{inv.userId}</p>
                      </td>
                      <td className="text-right">
                        <span className="text-sm">{inv.investmentCount ?? 0}</span>
                      </td>
                      <td className="text-right">
                        <span className="text-sm font-semibold text-primary">
                          ${Number(inv.totalAmount ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, Number(share))}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground w-10 text-right">{share}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {(!topInvestors || topInvestors.length === 0) && (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-muted-foreground text-sm">No investment data</td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
