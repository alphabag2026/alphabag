import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft, Loader2, Users, Copy, Share2, Gift,
  TrendingUp, ChevronRight, UserPlus, QrCode, Trophy, Calculator
} from "lucide-react";

type Tab = "my" | "qr" | "leaderboard" | "calculator";

export default function ReferralsPage() {
  const { isAuthenticated, loading } = useAuth({ redirectOnUnauthenticated: true });
  const [activeTab, setActiveTab] = useState<Tab>("my");
  const [calcReferrals, setCalcReferrals] = useState(10);
  const [calcAmount, setCalcAmount] = useState(1000);
  const [calcRate, setCalcRate] = useState(0.5);

  const { data: profile, refetch } = trpc.user.profile.useQuery(undefined, { enabled: isAuthenticated });
  const { data: stats } = trpc.user.referralStats.useQuery(undefined, { enabled: isAuthenticated });
  const { data: leaderboard } = trpc.public.referralLeaderboard.useQuery(undefined, {
    enabled: activeTab === "leaderboard",
  });

  const generateCode = trpc.user.generateReferralCode.useMutation({
    onSuccess: (data) => {
      toast.success(`Referral code generated: ${data.code}`);
      refetch();
    },
    onError: () => toast.error("Failed to generate referral code"),
  });

  const referralUrl = `${window.location.origin}?ref=${profile?.referralCode ?? ""}`;

  const copyCode = () => {
    if (profile?.referralCode) {
      navigator.clipboard.writeText(profile.referralCode);
      toast.success("Referral code copied!");
    }
  };

  const shareLink = () => {
    navigator.clipboard.writeText(referralUrl);
    toast.success("Referral link copied!");
  };

  // 수익 예측 계산
  const monthlyEarning = calcReferrals * calcAmount * (calcRate / 100) * 30;
  const yearlyEarning = monthlyEarning * 12;

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "my", label: "My Referral", icon: Gift },
    { id: "qr", label: "QR Code", icon: QrCode },
    { id: "leaderboard", label: "Leaderboard", icon: Trophy },
    { id: "calculator", label: "Calculator", icon: Calculator },
  ];

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
            Invite friends to AlphaBag and earn commissions on their investments.
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

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted/50 rounded-xl border border-border/30">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab: My Referral */}
        {activeTab === "my" && (
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
                  {/* SNS 공유 */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <a
                      href={`https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent("Join AlphaBag with my referral!")}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-xs font-medium transition-colors"
                    >
                      Telegram
                    </a>
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Join AlphaBag with my referral! ${referralUrl}`)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 text-xs font-medium transition-colors"
                    >
                      Twitter/X
                    </a>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`Join AlphaBag! ${referralUrl}`)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 text-xs font-medium transition-colors"
                    >
                      WhatsApp
                    </a>
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
        )}

        {/* Tab: QR Code */}
        {activeTab === "qr" && (
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">QR Code</CardTitle>
            </CardHeader>
            <CardContent>
              {profile?.referralCode ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-white rounded-2xl shadow-sm">
                    <QRCodeSVG
                      value={referralUrl}
                      size={200}
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Scan to join AlphaBag with referral code <strong className="text-primary">{profile.referralCode}</strong>
                  </p>
                  <p className="text-xs text-muted-foreground/60 break-all text-center">{referralUrl}</p>
                  <Button variant="outline" className="gap-2 w-full" onClick={shareLink}>
                    <Copy className="w-4 h-4" /> Copy Referral Link
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <QrCode className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground mb-4">Generate a referral code first to get your QR code</p>
                  <Button onClick={() => setActiveTab("my")} variant="outline" size="sm">
                    Go to My Referral
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tab: Leaderboard */}
        {activeTab === "leaderboard" && (
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" /> Top Referrers
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {!leaderboard ? (
                <div className="py-8 flex justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No data yet</div>
              ) : (
                <div className="divide-y divide-border/30">
                  {leaderboard.map((row) => (
                    <div key={row.rank} className="flex items-center gap-3 px-4 py-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        row.rank === 1 ? "bg-amber-400/20 text-amber-400" :
                        row.rank === 2 ? "bg-slate-400/20 text-slate-400" :
                        row.rank === 3 ? "bg-orange-400/20 text-orange-400" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {row.rank <= 3 ? ["🥇","🥈","🥉"][row.rank - 1] : row.rank}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{row.name}</p>
                        <p className="text-xs text-muted-foreground">{row.referralCount} referrals</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-primary">${Number(row.totalVolume).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">volume</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tab: Calculator */}
        {activeTab === "calculator" && (
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="w-4 h-4 text-primary" /> Referral Earnings Calculator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-medium">Number of Referrals</label>
                <Input
                  type="number"
                  min={1}
                  value={calcReferrals}
                  onChange={(e) => setCalcReferrals(Number(e.target.value))}
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-medium">Average Investment per Referral (USDT)</label>
                <Input
                  type="number"
                  min={0}
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(Number(e.target.value))}
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-medium">Commission Rate (%)</label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={calcRate}
                  onChange={(e) => setCalcRate(Number(e.target.value))}
                  className="h-9"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Monthly Earnings</p>
                  <p className="text-2xl font-bold text-primary">${monthlyEarning.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Yearly Earnings</p>
                  <p className="text-2xl font-bold text-emerald-400">${yearlyEarning.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground/60 text-center">
                * Estimated based on {calcReferrals} referrals × ${calcAmount} × {calcRate}% daily × 30 days
              </p>
            </CardContent>
          </Card>
        )}

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
