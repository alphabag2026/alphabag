import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { toast } from "sonner";
import {
  Cpu, ArrowLeft, Loader2, ChevronRight, Wallet,
  Shield, Zap, Star
} from "lucide-react";

export default function NodesPage() {
  const { isAuthenticated } = useAuth();
  const { data: nodes, isLoading } = trpc.public.nodes.useQuery();

  const purchaseNode = trpc.user.purchaseNode.useMutation({
    onSuccess: () => toast.success("Node purchase request submitted!"),
    onError: (err) => toast.error(err.message),
  });

  const handlePurchase = (nodeId: number, nodeName: string, price: string) => {
    if (!isAuthenticated) {
      window.dispatchEvent(new CustomEvent("open-wallet-modal"));
      return;
    }
    if (!confirm(`Purchase ${nodeName} for $${Number(price).toLocaleString()}?`)) return;
    purchaseNode.mutate({ nodeId, quantity: 1 });
  };

  const colorConfig: Record<string, { gradient: string; border: string; badge: string; dot: string }> = {
    gold: {
      gradient: "from-yellow-500/15 via-amber-500/5 to-transparent",
      border: "border-yellow-500/30 hover:border-yellow-500/60",
      badge: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      dot: "bg-yellow-500",
    },
    orange: {
      gradient: "from-orange-500/15 via-amber-500/5 to-transparent",
      border: "border-orange-500/30 hover:border-orange-500/60",
      badge: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      dot: "bg-orange-500",
    },
    blue: {
      gradient: "from-blue-500/15 via-cyan-500/5 to-transparent",
      border: "border-blue-500/30 hover:border-blue-500/60",
      badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      dot: "bg-blue-500",
    },
    green: {
      gradient: "from-green-500/15 via-emerald-500/5 to-transparent",
      border: "border-green-500/30 hover:border-green-500/60",
      badge: "bg-green-500/20 text-green-400 border-green-500/30",
      dot: "bg-green-500",
    },
    purple: {
      gradient: "from-purple-500/15 via-violet-500/5 to-transparent",
      border: "border-purple-500/30 hover:border-purple-500/60",
      badge: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      dot: "bg-purple-500",
    },
  };

  const getConfig = (color: string) => colorConfig[color] ?? colorConfig.gold;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
            </Link>
            <span className="text-sm font-medium">Node Marketplace</span>
          </div>
          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button size="sm" variant="outline" className="gap-2">
                Dashboard <ChevronRight className="w-3 h-3" />
              </Button>
            </Link>
          ) : (
            <Button size="sm" onClick={() => window.dispatchEvent(new CustomEvent("open-wallet-modal"))}>
              Sign In to Buy
            </Button>
          )}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 border-primary/40 text-primary bg-primary/5">
            <Cpu className="w-3 h-3 mr-1" /> Node Ecosystem
          </Badge>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Own a Node
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Purchase nodes to participate in the AlphaBag network and earn passive income from the ecosystem.
          </p>
        </div>

        {/* Features Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {[
            { icon: Zap, title: "Passive Income", desc: "Earn from network activity" },
            { icon: Shield, title: "Secure Ownership", desc: "On-chain node ownership" },
            { icon: Star, title: "Exclusive Access", desc: "Priority investment opportunities" },
          ].map((f) => (
            <div key={f.title} className="flex items-center gap-3 p-4 rounded-xl border border-border/30 bg-card/30">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <f.icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{f.title}</p>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Nodes Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {nodes?.map((node) => {
              const cfg = getConfig(node.color);
              return (
                <Card
                  key={node.id}
                  className={`relative overflow-hidden bg-gradient-to-br ${cfg.gradient} ${cfg.border} border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
                >
                  <CardContent className="p-5">
                    {/* Node Type Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="outline" className={`text-xs ${cfg.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} mr-1.5 inline-block`} />
                        {node.color.toUpperCase()} NODE
                      </Badge>
                      <Cpu className="w-4 h-4 text-muted-foreground" />
                    </div>

                    {/* Node Name */}
                    <h3 className="font-semibold text-foreground mb-1 leading-tight">{node.name}</h3>

                    {/* Price */}
                    <div className="mb-4">
                      <span className="text-2xl font-bold text-foreground">
                        ${Number(node.price).toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">USDT</span>
                    </div>

                    {/* Description */}
                    {node.description && (
                      <p className="text-xs text-muted-foreground mb-4 leading-relaxed line-clamp-3">
                        {node.description}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-4 py-3 border-t border-border/20">
                      <span>Sold: {node.totalSold}</span>
                      <span>Revenue: ${Number(node.totalRevenue).toLocaleString()}</span>
                    </div>

                    {/* Wallet Address */}
                    {node.walletAddress && (
                      <div className="mb-4 p-2 rounded bg-background/30 border border-border/20">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Wallet className="w-3 h-3" />
                          <code className="truncate">{node.walletAddress.slice(0, 20)}...</code>
                        </div>
                      </div>
                    )}

                    <Button
                      className="w-full text-sm"
                      onClick={() => handlePurchase(node.id, node.name, node.price)}
                      disabled={purchaseNode.isPending || !node.isActive}
                    >
                      {purchaseNode.isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin mr-2" />
                      ) : null}
                      {node.isActive ? "Purchase Node" : "Unavailable"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {!isLoading && (!nodes || nodes.length === 0) && (
          <div className="text-center py-20">
            <Cpu className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No nodes available</p>
          </div>
        )}
      </div>
    </div>
  );
}
