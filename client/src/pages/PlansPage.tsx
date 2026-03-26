import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { toast } from "sonner";
import {
  TrendingUp, ArrowLeft, Loader2, CheckCircle2, ChevronRight
} from "lucide-react";

export default function PlansPage() {
  const { isAuthenticated } = useAuth();
  const [planType, setPlanType] = useState<"investment" | "staking">("investment");
  const { data: plans, isLoading } = trpc.public.plans.useQuery({ planType });

  const invest = trpc.user.invest.useMutation({
    onSuccess: () => {
      toast.success("Investment request submitted successfully!");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleInvest = (planId: number) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    const amount = prompt("Enter investment amount (USD):");
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;
    invest.mutate({ planId, amount });
  };

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
            <span className="text-sm font-medium">Investment Plans</span>
          </div>
          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button size="sm" variant="outline" className="gap-2">
                Dashboard <ChevronRight className="w-3 h-3" />
              </Button>
            </Link>
          ) : (
            <Button size="sm" onClick={() => window.location.href = getLoginUrl()}>
              Sign In
            </Button>
          )}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <Badge variant="outline" className="mb-4 border-primary/40 text-primary bg-primary/5">
            <TrendingUp className="w-3 h-3 mr-1" /> Investment Plans
          </Badge>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Choose Your Plan
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Select from our curated investment plans with transparent daily returns.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <Tabs value={planType} onValueChange={(v) => setPlanType(v as "investment" | "staking")}>
            <TabsList className="bg-card border border-border/40">
              <TabsTrigger value="investment">Investment Plans</TabsTrigger>
              <TabsTrigger value="staking">Staking Plans</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Plans Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {plans?.map((plan: any, i: number) => (
              <Card
                key={plan.id}
                className={`relative overflow-hidden border-border/40 hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 ${i % 5 === 2 ? "border-primary/50 shadow-md shadow-primary/10" : ""}`}
              >
                {i % 5 === 2 && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
                )}
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-sm leading-tight truncate">{plan.name}</h3>
                      {plan.label && (
                        <Badge variant="secondary" className="mt-1.5 text-xs">{plan.label}</Badge>
                      )}
                    </div>
                    {i % 5 === 2 && (
                      <Badge className="bg-primary text-primary-foreground text-xs ml-2 flex-shrink-0">Hot</Badge>
                    )}
                  </div>

                  {/* Daily Rate */}
                  <div className="mb-5">
                    <div className="text-3xl font-bold text-primary">{Number(plan.dailyRate).toFixed(2)}%</div>
                    <div className="text-xs text-muted-foreground">Daily Return</div>
                  </div>

                  {/* Plan Details */}
                  <div className="space-y-2 mb-5 text-xs">
                    {plan.minAmount && Number(plan.minAmount) > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Min. Amount</span>
                        <span className="text-foreground font-medium">${Number(plan.minAmount).toLocaleString()}</span>
                      </div>
                    )}
                    {plan.maxAmount && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Max. Amount</span>
                        <span className="text-foreground font-medium">${Number(plan.maxAmount).toLocaleString()}</span>
                      </div>
                    )}
                    {plan.duration && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Duration</span>
                        <span className="text-foreground font-medium">{plan.duration} days</span>
                      </div>
                    )}
                    {plan.totalReturn && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Total Return</span>
                        <span className="text-primary font-bold">{Number(plan.totalReturn).toFixed(0)}%</span>
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <div className="space-y-1.5 mb-5">
                    {["Daily payouts", "Transparent tracking", "Secure investment"].map((f) => (
                      <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>

                  <Button
                    className="w-full text-sm"
                    variant={i % 5 === 2 ? "default" : "outline"}
                    onClick={() => handleInvest(plan.id)}
                    disabled={invest.isPending}
                  >
                    {invest.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null}
                    Invest Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && (!plans || plans.length === 0) && (
          <div className="text-center py-20">
            <TrendingUp className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No plans available in this category</p>
          </div>
        )}
      </div>
    </div>
  );
}
