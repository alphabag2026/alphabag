import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import {
  TrendingUp, Cpu, Shield, ChevronRight, ArrowRight,
  Star, Zap, Globe, Lock, BarChart3, Users,
  Loader2, ExternalLink
} from "lucide-react";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { data: plans, isLoading: plansLoading } = trpc.public.plans.useQuery({ planType: "investment" });
  const { data: nodes, isLoading: nodesLoading } = trpc.public.nodes.useQuery();
  const { data: notices } = trpc.public.notices.useQuery();

  const featuredPlans = plans?.slice(0, 3) ?? [];
  const featuredNodes = nodes?.slice(0, 4) ?? [];
  const latestNotice = notices?.[0];

  const nodeColorMap: Record<string, string> = {
    gold: "from-yellow-500/20 to-amber-500/10 border-yellow-500/30",
    orange: "from-orange-500/20 to-amber-500/10 border-orange-500/30",
    blue: "from-blue-500/20 to-cyan-500/10 border-blue-500/30",
    green: "from-green-500/20 to-emerald-500/10 border-green-500/30",
    purple: "from-purple-500/20 to-violet-500/10 border-purple-500/30",
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">A</span>
                </div>
                <span className="font-display text-lg font-bold text-foreground">AlphaBag</span>
              </div>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/plans">
                <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Plans</span>
              </Link>
              <Link href="/nodes">
                <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Nodes</span>
              </Link>
              <Link href="/about">
                <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">About</span>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button size="sm" className="gap-2">
                    Dashboard <ChevronRight className="w-3 h-3" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={() => window.location.href = getLoginUrl()}>
                    Sign In
                  </Button>
                  <Button size="sm" onClick={() => window.location.href = getLoginUrl()}>
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Notice Banner ── */}
      {latestNotice && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-primary/10 border-b border-primary/20 py-2 px-4 text-center">
          <p className="text-xs text-primary font-medium truncate max-w-2xl mx-auto">
            📢 {latestNotice.title}
          </p>
        </div>
      )}

      {/* ── Hero Section ── */}
      <section className={`relative pt-${latestNotice ? "28" : "24"} pb-20 px-4 overflow-hidden`}>
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative">
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-6 border-primary/40 text-primary bg-primary/5 px-3 py-1">
              <Zap className="w-3 h-3 mr-1" />
              Web3 Investment Platform
            </Badge>
            <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight mb-6">
              Invest Smart,{" "}
              <span className="text-primary">Earn More</span>{" "}
              with AlphaBag
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl leading-relaxed">
              AlphaBag provides curated Web3 investment plans and node opportunities with transparent daily returns and a powerful referral ecosystem.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                className="gap-2 text-base px-8"
                onClick={() => window.location.href = isAuthenticated ? "/plans" : getLoginUrl()}
              >
                Start Investing <ArrowRight className="w-4 h-4" />
              </Button>
              <Link href="/nodes">
                <Button variant="outline" size="lg" className="gap-2 text-base px-8 border-border/60">
                  Explore Nodes <Cpu className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-8 mt-12 pt-8 border-t border-border/30">
              {[
                { label: "Total Plans", value: `${plans?.length ?? 17}+` },
                { label: "Node Types", value: `${nodes?.length ?? 10}+` },
                { label: "Daily Returns", value: "Up to 3%" },
                { label: "Network", value: "Web3" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section className="py-16 px-4 border-y border-border/30 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: TrendingUp,
                title: "High-Yield Plans",
                desc: "Choose from 17+ curated investment plans with daily returns up to 3%.",
                color: "text-primary",
              },
              {
                icon: Cpu,
                title: "Node Ownership",
                desc: "Purchase nodes to participate in the network and earn passive income.",
                color: "text-blue-400",
              },
              {
                icon: Shield,
                title: "Secure & Transparent",
                desc: "All transactions are on-chain with full transparency and security.",
                color: "text-green-400",
              },
            ].map((f) => (
              <div key={f.title} className="flex gap-4 p-6 rounded-xl bg-card border border-border/40 hover:border-border/80 transition-colors">
                <div className={`w-10 h-10 rounded-lg bg-background flex items-center justify-center flex-shrink-0 ${f.color}`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Investment Plans Preview ── */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-primary text-sm font-medium mb-2">Investment Plans</p>
              <h2 className="font-display text-3xl md:text-4xl font-bold">
                Choose Your Strategy
              </h2>
            </div>
            <Link href="/plans">
              <Button variant="ghost" className="gap-1 text-muted-foreground hover:text-foreground">
                View All <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {plansLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredPlans.map((plan, i) => (
                <Card key={plan.id} className={`relative overflow-hidden border-border/40 hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 ${i === 1 ? "border-primary/50 shadow-lg shadow-primary/10" : ""}`}>
                  {i === 1 && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
                  )}
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-foreground">{plan.name}</h3>
                        {plan.label && (
                          <Badge variant="secondary" className="mt-1 text-xs">{plan.label}</Badge>
                        )}
                      </div>
                      {i === 1 && <Badge className="bg-primary text-primary-foreground text-xs">Popular</Badge>}
                    </div>
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-primary">{Number(plan.dailyRate).toFixed(2)}%</span>
                      <span className="text-muted-foreground text-sm ml-1">/ day</span>
                    </div>
                    <div className="space-y-2 mb-6 text-sm text-muted-foreground">
                      {plan.minAmount && (
                        <div className="flex justify-between">
                          <span>Min. Investment</span>
                          <span className="text-foreground">${Number(plan.minAmount).toLocaleString()}</span>
                        </div>
                      )}
                      {plan.duration && (
                        <div className="flex justify-between">
                          <span>Duration</span>
                          <span className="text-foreground">{plan.duration} days</span>
                        </div>
                      )}
                      {plan.totalReturn && (
                        <div className="flex justify-between">
                          <span>Total Return</span>
                          <span className="text-primary font-medium">{Number(plan.totalReturn).toFixed(0)}%</span>
                        </div>
                      )}
                    </div>
                    <Button
                      className="w-full"
                      variant={i === 1 ? "default" : "outline"}
                      onClick={() => window.location.href = isAuthenticated ? "/dashboard" : getLoginUrl()}
                    >
                      Invest Now
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Nodes Preview ── */}
      <section className="py-20 px-4 bg-card/20 border-y border-border/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-primary text-sm font-medium mb-2">Node Ecosystem</p>
              <h2 className="font-display text-3xl md:text-4xl font-bold">
                Own a Node
              </h2>
            </div>
            <Link href="/nodes">
              <Button variant="ghost" className="gap-1 text-muted-foreground hover:text-foreground">
                View All <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {nodesLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featuredNodes.map((node) => {
                const colorClass = nodeColorMap[node.color] ?? nodeColorMap.gold;
                return (
                  <div
                    key={node.id}
                    className={`p-5 rounded-xl bg-gradient-to-br border ${colorClass} hover:scale-[1.02] transition-transform cursor-pointer`}
                    onClick={() => window.location.href = isAuthenticated ? "/nodes" : getLoginUrl()}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Cpu className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">{node.color} node</span>
                    </div>
                    <h3 className="font-semibold text-foreground text-sm mb-2 leading-tight">{node.name}</h3>
                    <div className="text-xl font-bold text-foreground">
                      ${Number(node.price).toLocaleString()}
                    </div>
                    {node.description && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{node.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── Why AlphaBag ── */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-primary text-sm font-medium mb-2">Why Choose Us</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold">
              Built for Web3 Investors
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Globe, title: "Global Access", desc: "Invest from anywhere in the world with crypto wallets." },
              { icon: Lock, title: "Non-Custodial", desc: "Your funds remain in your control at all times." },
              { icon: BarChart3, title: "Real-time Analytics", desc: "Track your portfolio performance with live dashboards." },
              { icon: Users, title: "Referral Rewards", desc: "Earn commissions by referring friends to the platform." },
              { icon: Star, title: "Curated Projects", desc: "Only the best Binance Alpha and Web3 projects." },
              { icon: Zap, title: "Instant Setup", desc: "Connect your wallet and start investing in minutes." },
            ].map((item) => (
              <div key={item.title} className="flex gap-3 p-5 rounded-xl border border-border/30 hover:border-border/60 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground text-sm mb-1">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-t border-border/30">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            Ready to Start Your<br />
            <span className="text-primary">Investment Journey?</span>
          </h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Join thousands of investors already earning with AlphaBag.
          </p>
          <Button
            size="lg"
            className="gap-2 text-base px-10"
            onClick={() => window.location.href = isAuthenticated ? "/dashboard" : getLoginUrl()}
          >
            {isAuthenticated ? "Go to Dashboard" : "Get Started Free"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/30 py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">A</span>
              </div>
              <span className="font-display font-bold text-sm">AlphaBag</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <Link href="/plans"><span className="hover:text-foreground cursor-pointer transition-colors">Plans</span></Link>
              <Link href="/nodes"><span className="hover:text-foreground cursor-pointer transition-colors">Nodes</span></Link>
              <Link href="/dashboard"><span className="hover:text-foreground cursor-pointer transition-colors">Dashboard</span></Link>
            </div>
            <p className="text-xs text-muted-foreground">© 2025 AlphaBag. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
