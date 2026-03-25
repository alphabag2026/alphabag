import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Network, TrendingUp, Users, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Referrals() {
  const { data: topReferrers } = trpc.referrals.topReferrers.useQuery({ limit: 20 });
  const { data: stats } = trpc.referrals.stats.useQuery();

  return (
    <AdminLayout title="Referral System">
      <div className="space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: "Total Referrers", value: stats?.totalReferrers ?? 0, icon: Users, color: "text-blue-400" },
            { label: "Total Referrals", value: stats?.totalReferrals ?? 0, icon: Network, color: "text-emerald-400" },
            { label: "Referral Revenue", value: `$${Number(stats?.totalReferralRevenue ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: DollarSign, color: "text-primary" },
            { label: "Avg. Referrals/User", value: stats?.avgReferralsPerUser?.toFixed(1) ?? "0", icon: TrendingUp, color: "text-purple-400" },
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

        {/* Top Referrers Table */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Network className="w-4 h-4 text-primary" />
              Top Referrers
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 overflow-x-auto">
            <table className="w-full admin-table">
              <thead>
                <tr>
                  <th className="text-left">Rank</th>
                  <th className="text-left">User</th>
                  <th className="text-left">Referral Code</th>
                  <th className="text-right">Referrals</th>
                  <th className="text-right">Earnings</th>
                  <th className="text-right">Conversion</th>
                </tr>
              </thead>
              <tbody>
                {topReferrers?.map((ref: any, i: number) => (
                  <tr key={ref.userId}>
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
                      <div>
                        <p className="font-medium text-sm">{ref.userName ?? `User #${ref.userId}`}</p>
                        <p className="text-xs text-muted-foreground">{ref.userEmail ?? ""}</p>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-xs bg-muted px-2 py-1 rounded text-primary">
                        {ref.referralCode ?? "—"}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className="font-semibold">{ref.referralCount ?? 0}</span>
                    </td>
                    <td className="text-right">
                      <span className="font-semibold text-primary">
                        ${Number(ref.totalEarnings ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="text-right">
                      <Badge className="badge-active text-xs">
                        {ref.conversionRate ? `${Number(ref.conversionRate).toFixed(1)}%` : "—"}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {(!topReferrers || topReferrers.length === 0) && (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-muted-foreground text-sm">
                      No referral data yet
                    </td>
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
