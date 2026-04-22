import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { useTranslation } from "react-i18next";
import { formatNumber, formatCurrency } from "@/lib/formatNumber";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Users, DollarSign, TrendingUp, TicketCheck, Network, RefreshCw } from "lucide-react";

const GOLD = "#C9A84C";
const PIE_COLORS = ["#C9A84C", "#4A9EBF", "#4ABF7E", "#9B6BBF", "#BF7A4A", "#e879f9", "#38bdf8", "#4ade80"];

const RANGE_OPTIONS = [
  { label: "7 Days", value: 7 },
  { label: "14 Days", value: 14 },
  { label: "30 Days", value: 30 },
];

export default function AdminDashboard() {
  const [range, setRange] = useState(7);
  const { t, i18n } = useTranslation();
  const lang = i18n.language || "en";

  const { data: stats, isLoading: statsLoading, refetch } = trpc.dashboard.stats.useQuery();
  const { data: chartData } = trpc.dashboard.investmentTrend.useQuery({ days: range });
  const { data: categoryData } = trpc.dashboard.planDistribution.useQuery();
  const { data: topInvestors } = trpc.dashboard.topInvestors.useQuery({ limit: 10 });
  const { data: nodeSalesData } = trpc.nodes.salesStats.useQuery();

  const kpiCards = [
    { label: t("adminNav.kpiTotalRevenue"), value: formatCurrency(stats?.totalRevenue ?? 0, lang), sub: t("adminNav.kpiSubUsdt"), color: "gold", icon: DollarSign },
    { label: t("adminNav.kpiTotalUsers"), value: formatNumber(stats?.totalUsers ?? 0, lang), sub: t("adminNav.kpiSubRegistered"), color: "blue", icon: Users },
    { label: t("adminNav.kpiTotalReferrals"), value: formatNumber(stats?.totalReferrals ?? 0, lang), sub: t("adminNav.kpiSubConnections"), color: "green", icon: Network },
    { label: t("adminNav.kpiConversionRate"), value: `${(stats?.conversionRate ?? 0).toFixed(1)}%`, sub: t("adminNav.kpiSubInvestors"), color: "purple", icon: TrendingUp },
    { label: t("adminNav.kpiOpenTickets"), value: formatNumber(stats?.openTickets ?? 0, lang), sub: t("adminNav.kpiSubUnresolved"), color: "red", icon: TicketCheck },
  ];

  return (
    <AdminLayout title="Dashboard">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <div className="ab-page-title">Dashboard</div>
          <div className="ab-page-desc">AlphaBag V3 플랫폼 실시간 현황</div>
        </div>
        <button onClick={() => refetch()} className="ab-btn ab-btn-outline ab-btn-sm">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="ab-kpi-grid">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`ab-kpi-card ${card.color}`}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <div className="ab-kpi-label">{card.label}</div>
                <Icon size={16} style={{ color: "oklch(0.55 0.01 240)" }} />
              </div>
              <div className="ab-kpi-value">
                {statsLoading ? <div style={{ width: 80, height: 24, background: "oklch(0.20 0.01 240)", borderRadius: 4 }} /> : card.value}
              </div>
              <div className="ab-kpi-sub">{card.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Charts row 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
        <div className="ab-chart-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <div>
              <div className="ab-chart-title">Daily Investment Volume</div>
              <div className="ab-chart-desc">기간별 투자 볼륨 추이</div>
            </div>
            <div style={{ display: "flex", gap: "0.4rem" }}>
              {RANGE_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => setRange(opt.value)}
                  className={`ab-btn ab-btn-sm ${range === opt.value ? "ab-btn-gold" : "ab-btn-outline"}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData ?? []}>
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={GOLD} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.20 0.01 240)" />
              <XAxis dataKey="date" tick={{ fill: "oklch(0.55 0.01 240)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "oklch(0.55 0.01 240)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip contentStyle={{ background: "oklch(0.11 0.008 240)", border: "1px solid oklch(0.20 0.01 240)", borderRadius: 6, fontSize: 12 }}
                formatter={(v: number) => [formatCurrency(v, lang, 0), "Volume"]} />
              <Area type="monotone" dataKey="amount" stroke={GOLD} fill="url(#goldGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="ab-chart-card">
          <div className="ab-chart-title">Category Distribution</div>
          <div className="ab-chart-desc">플랜 카테고리별 투자 분포</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={categoryData ?? []} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" nameKey="name" paddingAngle={2}>
                {(categoryData ?? []).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "oklch(0.11 0.008 240)", border: "1px solid oklch(0.20 0.01 240)", borderRadius: 6, fontSize: 12 }}
                formatter={(v: number) => [formatCurrency(v, lang, 0), ""]} />
              <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: "oklch(0.55 0.01 240)", fontSize: 11 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Node Sales Stats */}
      {nodeSalesData && nodeSalesData.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          <div className="ab-chart-card">
            <div className="ab-chart-title">Node Sales by Type</div>
            <div className="ab-chart-desc">노드 타입별 판매 현황</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={nodeSalesData.map(n => ({
                name: (n.nodeName ?? `Node #${n.nodeId}`)?.replace(/ Node$/, "").substring(0, 18),
                orders: Number(n.totalOrders ?? 0),
                revenue: Number(n.totalRevenue ?? 0),
              }))} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.20 0.01 240)" />
                <XAxis dataKey="name" tick={{ fill: "oklch(0.55 0.01 240)", fontSize: 10 }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" interval={0} />
                <YAxis yAxisId="left" tick={{ fill: "oklch(0.55 0.01 240)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: "oklch(0.55 0.01 240)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: "oklch(0.11 0.008 240)", border: "1px solid oklch(0.20 0.01 240)", borderRadius: 6, fontSize: 12 }}
                  formatter={(v: number, name: string) => [name === "revenue" ? formatCurrency(v, lang, 0) : formatNumber(v, lang), name === "revenue" ? "Revenue" : "Orders"]} />
                <Bar yAxisId="left" dataKey="orders" fill="#4A9EBF" radius={[3, 3, 0, 0]} name="orders" />
                <Bar yAxisId="right" dataKey="revenue" fill={GOLD} radius={[3, 3, 0, 0]} name="revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="ab-chart-card">
            <div className="ab-chart-title">Node Revenue Share</div>
            <div className="ab-chart-desc">노드별 매출 비중</div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={nodeSalesData.map(n => ({
                    name: (n.nodeName ?? `Node #${n.nodeId}`)?.substring(0, 16),
                    value: Number(n.totalRevenue ?? 0),
                  }))}
                  cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name" paddingAngle={2}
                >
                  {nodeSalesData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "oklch(0.11 0.008 240)", border: "1px solid oklch(0.20 0.01 240)", borderRadius: 6, fontSize: 12 }}
                  formatter={(v: number) => [formatCurrency(v, lang, 0), ""]} />
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: "oklch(0.55 0.01 240)", fontSize: 10 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Charts row 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div className="ab-chart-card">
          <div className="ab-chart-title">Top Investors</div>
          <div className="ab-chart-desc">투자 금액 상위 10명</div>
          <div className="ab-table-wrap" style={{ marginTop: "0.75rem" }}>
            <table className="ab-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Wallet</th>
                  <th>Referral Code</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {(topInvestors ?? []).map((inv, i) => (
                  <tr key={inv.userId}>
                    <td style={{ color: i < 3 ? GOLD : "oklch(0.55 0.01 240)", fontWeight: 700 }}>{i + 1}</td>
                    <td style={{ fontFamily: "monospace", fontSize: "0.72rem" }}>
                      User #{inv.userId}
                    </td>
                    <td><span className="ab-badge ab-badge-gold">{inv.investmentCount} plans</span></td>
                    <td style={{ textAlign: "right", color: GOLD, fontWeight: 600 }}>
                      {formatCurrency(Number(inv.totalAmount ?? 0), lang)}
                    </td>
                  </tr>
                ))}
                {!topInvestors?.length && (
                  <tr><td colSpan={4} style={{ textAlign: "center", color: "oklch(0.55 0.01 240)", padding: "2rem" }}>데이터 없음</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="ab-chart-card">
          <div className="ab-chart-title">Volume Trend</div>
          <div className="ab-chart-desc">누적 투자 트렌드</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.20 0.01 240)" />
              <XAxis dataKey="date" tick={{ fill: "oklch(0.55 0.01 240)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "oklch(0.55 0.01 240)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip contentStyle={{ background: "oklch(0.11 0.008 240)", border: "1px solid oklch(0.20 0.01 240)", borderRadius: 6, fontSize: 12 }}
                formatter={(v: number) => [formatCurrency(v, lang, 0), "Volume"]} />
              <Bar dataKey="amount" fill={GOLD} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </AdminLayout>
  );
}
