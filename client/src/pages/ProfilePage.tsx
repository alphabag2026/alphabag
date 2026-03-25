import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { toast } from "sonner";
import {
  ArrowLeft, Loader2, Wallet, User, Shield, Copy,
  CheckCircle2, AlertCircle, Clock
} from "lucide-react";

export default function ProfilePage() {
  const { user, isAuthenticated, loading } = useAuth({ redirectOnUnauthenticated: true });
  const [walletInput, setWalletInput] = useState("");
  const [referralInput, setReferralInput] = useState("");

  const { data: profile, refetch } = trpc.user.profile.useQuery(undefined, { enabled: isAuthenticated });

  const updateWallet = trpc.user.updateWallet.useMutation({
    onSuccess: () => {
      toast.success("Wallet address updated!");
      setWalletInput("");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const registerReferral = trpc.user.registerReferral.useMutation({
    onSuccess: (data) => {
      toast.success(`Referral registered! Referred by: ${data.referrer?.name}`);
      setReferralInput("");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const generateCode = trpc.user.generateReferralCode.useMutation({
    onSuccess: (data) => {
      toast.success(`Code generated: ${data.code}`);
      refetch();
    },
  });

  const kycStatusConfig = {
    none: { label: "Not Submitted", icon: AlertCircle, color: "text-muted-foreground", bg: "bg-muted/30" },
    pending: { label: "Pending Review", icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/10" },
    approved: { label: "Approved", icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/10" },
    rejected: { label: "Rejected", icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10" },
  };

  const kycStatus = profile?.kycStatus ?? "none";
  const kycCfg = kycStatusConfig[kycStatus];

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
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </Button>
          </Link>
          <span className="text-sm font-medium">My Profile</span>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        {/* Profile Info */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4 text-primary" /> Account Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-bold text-2xl">
                  {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                </span>
              </div>
              <div>
                <p className="font-semibold text-foreground text-lg">{user?.name ?? "—"}</p>
                <p className="text-sm text-muted-foreground">{user?.email ?? "—"}</p>
                <Badge variant="outline" className="mt-1 text-xs capitalize">{user?.role ?? "user"}</Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/30">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Invested</p>
                <p className="font-semibold text-foreground">${Number(profile?.totalInvested ?? 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Nodes</p>
                <p className="font-semibold text-foreground">{Number(profile?.totalNodes ?? 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KYC Status */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" /> KYC Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`flex items-center gap-3 p-4 rounded-lg ${kycCfg.bg}`}>
              <kycCfg.icon className={`w-5 h-5 ${kycCfg.color}`} />
              <div>
                <p className={`font-medium text-sm ${kycCfg.color}`}>{kycCfg.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {kycStatus === "none" && "Submit your KYC documents to unlock full platform access."}
                  {kycStatus === "pending" && "Your documents are under review. This usually takes 1-3 business days."}
                  {kycStatus === "approved" && "Your identity has been verified. Full platform access enabled."}
                  {kycStatus === "rejected" && "Your KYC was rejected. Please contact support for assistance."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Wallet */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="w-4 h-4 text-primary" /> Wallet Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile?.walletAddress && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50 border border-border/30">
                <code className="flex-1 text-sm font-mono text-foreground break-all">{profile.walletAddress}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 flex-shrink-0"
                  onClick={() => {
                    navigator.clipboard.writeText(profile.walletAddress!);
                    toast.success("Copied!");
                  }}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <Input
                placeholder="Enter wallet address (0x...)"
                value={walletInput}
                onChange={(e) => setWalletInput(e.target.value)}
                className="font-mono text-sm bg-background/50"
              />
              <Button
                onClick={() => walletInput && updateWallet.mutate({ walletAddress: walletInput })}
                disabled={!walletInput || updateWallet.isPending}
                className="flex-shrink-0"
              >
                {updateWallet.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Update"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Referral */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Referral System</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* My Code */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">My Referral Code</Label>
              {profile?.referralCode ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <code className="flex-1 text-sm font-mono font-bold text-primary">{profile.referralCode}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => {
                      navigator.clipboard.writeText(profile.referralCode!);
                      toast.success("Code copied!");
                    }}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateCode.mutate()}
                  disabled={generateCode.isPending}
                >
                  {generateCode.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null}
                  Generate My Code
                </Button>
              )}
            </div>

            {/* Referred By */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Referred By</Label>
              {profile?.referredBy ? (
                <div className="p-3 rounded-lg bg-background/50 border border-border/30">
                  <code className="text-sm font-mono text-foreground">{profile.referredBy}</code>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter referral code"
                    value={referralInput}
                    onChange={(e) => setReferralInput(e.target.value)}
                    className="text-sm bg-background/50"
                  />
                  <Button
                    onClick={() => referralInput && registerReferral.mutate({ referralCode: referralInput })}
                    disabled={!referralInput || registerReferral.isPending}
                    variant="outline"
                    className="flex-shrink-0"
                  >
                    {registerReferral.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Apply"}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
