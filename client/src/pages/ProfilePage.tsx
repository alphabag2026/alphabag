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
  CheckCircle2, AlertCircle, Clock, Send, ExternalLink, Link2
} from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";

export default function ProfilePage() {
  const { user, isAuthenticated, loading } = useAuth({ redirectOnUnauthenticated: true });
  const [walletInput, setWalletInput] = useState("");
  const [referralInput, setReferralInput] = useState("");
  const [telegramInput, setTelegramInput] = useState("");
  const { isConnected, address: walletAddress, openModal, isTronConnected, tronAddress, signAndAuth } = useWallet();
  const [signing, setSigning] = useState(false);

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

  const updateTelegram = trpc.users.updateMyTelegramChatId.useMutation({
    onSuccess: () => {
      toast.success("Telegram Chat ID registered!");
      setTelegramInput("");
      refetch();
    },
    onError: (err: any) => toast.error(err.message),
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
              <Wallet className="w-4 h-4 text-primary" /> 지갑 연결
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 현재 연결된 지갑 */}
            {isConnected && walletAddress && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-green-400 font-medium mb-0.5">
                    {isTronConnected ? "TronLink 연결됨 (TRON)" : "지갑 연결됨"}
                  </p>
                  <code className="text-xs font-mono text-foreground break-all">{walletAddress}</code>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 flex-shrink-0"
                  onClick={() => {
                    navigator.clipboard.writeText(walletAddress);
                    toast.success("주소가 복사되었습니다.");
                  }}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            )}

            {/* DB 저장된 지갑 주소 */}
            {profile?.walletAddress && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50 border border-border/30">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">등록된 지갑 주소</p>
                  <code className="text-sm font-mono text-foreground break-all">{profile.walletAddress}</code>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 flex-shrink-0"
                  onClick={() => {
                    navigator.clipboard.writeText(profile.walletAddress!);
                    toast.success("복사되었습니다!");
                  }}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            )}

            {/* 지갑 연결 버튼 */}
            {!isConnected ? (
              <Button
                className="w-full gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold"
                onClick={openModal}
              >
                <Link2 className="w-4 h-4" />
                지갑 연결하기 (MetaMask / TronLink / WalletConnect)
              </Button>
            ) : (
              !isTronConnected && (
                <Button
                  className="w-full gap-2"
                  onClick={async () => {
                    setSigning(true);
                    await signAndAuth();
                    setSigning(false);
                    refetch();
                  }}
                  disabled={signing}
                >
                  {signing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  서명으로 계정에 지갑 연결
                </Button>
              )
            )}

            {/* 수동 입력 */}
            <div className="pt-2 border-t border-border/30">
              <p className="text-xs text-muted-foreground mb-2">또는 직접 주소 입력</p>
              <div className="flex gap-2">
                <Input
                  placeholder="지갑 주소 입력 (0x... 또는 T...)"
                  value={walletInput}
                  onChange={(e) => setWalletInput(e.target.value)}
                  className="font-mono text-sm bg-background/50"
                />
                <Button
                  onClick={() => walletInput && updateWallet.mutate({ walletAddress: walletInput })}
                  disabled={!walletInput || updateWallet.isPending}
                  className="flex-shrink-0"
                >
                  {updateWallet.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "저장"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Telegram */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="w-4 h-4 text-primary" /> Telegram Notification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile?.telegramChatId ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-400">Telegram Connected</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">Chat ID: {profile.telegramChatId}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                <p className="text-sm text-yellow-400">Not connected. Register your Telegram Chat ID to receive notifications.</p>
              </div>
            )}
            <div className="p-3 rounded-lg bg-muted/30 border border-border/30 space-y-1">
              <p className="text-xs font-medium text-foreground">How to get your Chat ID:</p>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Open Telegram and search for <span className="font-mono text-primary">@userinfobot</span></li>
                <li>Send <span className="font-mono">/start</span> — it will reply with your Chat ID</li>
                <li>Paste the numeric ID below</li>
              </ol>
              <a
                href="https://t.me/userinfobot"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
              >
                Open @userinfobot <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Enter your Telegram Chat ID (numeric)"
                value={telegramInput}
                onChange={(e) => setTelegramInput(e.target.value)}
                className="font-mono text-sm bg-background/50"
              />
              <Button
                onClick={() => telegramInput && updateTelegram.mutate({ chatId: telegramInput })}
                disabled={!telegramInput || updateTelegram.isPending}
                className="flex-shrink-0"
              >
                {updateTelegram.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
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
