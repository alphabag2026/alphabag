import { useWallet } from "@/contexts/WalletContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, CheckCircle2, ChevronDown } from "lucide-react";
import { useState } from "react";
import { SUPPORTED_CHAINS } from "@/lib/wagmi";

export function WalletConnectModal() {
  const {
    isModalOpen, closeModal, connectWallet, isConnecting,
    isConnected, address, chainId, disconnectWallet, switchChain,
    signAndAuth, walletOptions
  } = useWallet();
  const [showChains, setShowChains] = useState(false);
  const [signing, setSigning] = useState(false);

  const currentChain = SUPPORTED_CHAINS.find(c => c.id === chainId);

  const handleSignAndAuth = async () => {
    setSigning(true);
    await signAndAuth();
    setSigning(false);
    closeModal();
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={closeModal}>
      <DialogContent className="bg-card border-border/60 max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">
            {isConnected ? "Wallet Connected" : "Connect Wallet"}
          </DialogTitle>
        </DialogHeader>

        {isConnected ? (
          <div className="space-y-4 pt-2">
            {/* Connected State */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Connected</p>
                <p className="font-mono text-sm font-medium text-foreground truncate">
                  {address?.slice(0, 8)}...{address?.slice(-6)}
                </p>
              </div>
            </div>

            {/* Chain Selector */}
            <div>
              <button
                className="w-full flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/30 hover:border-border/60 transition-colors"
                onClick={() => setShowChains(!showChains)}
              >
                <div className="flex items-center gap-2">
                  <span>{currentChain?.icon ?? "🔗"}</span>
                  <span className="text-sm font-medium">{currentChain?.name ?? "Unknown Chain"}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showChains ? "rotate-180" : ""}`} />
              </button>
              {showChains && (
                <div className="mt-1 rounded-lg border border-border/40 bg-card overflow-hidden">
                  {SUPPORTED_CHAINS.map(chain => (
                    <button
                      key={chain.id}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent transition-colors ${chain.id === chainId ? "text-primary font-medium" : "text-muted-foreground"}`}
                      onClick={() => { switchChain(chain.id); setShowChains(false); }}
                    >
                      <span>{chain.icon}</span>
                      <span>{chain.name}</span>
                      {chain.id === chainId && <CheckCircle2 className="w-3 h-3 ml-auto text-primary" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sign & Auth */}
            <Button
              className="w-full gap-2"
              onClick={handleSignAndAuth}
              disabled={signing}
            >
              {signing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Sign & Link to Account
            </Button>

            <Button
              variant="outline"
              className="w-full text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60"
              onClick={() => { disconnectWallet(); closeModal(); }}
            >
              Disconnect
            </Button>
          </div>
        ) : (
          <div className="space-y-2 pt-2">
            <p className="text-xs text-muted-foreground text-center mb-4">
              Choose your preferred wallet to connect
            </p>
            {walletOptions.map((wallet) => (
              <button
                key={wallet.id}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-border/30 hover:border-primary/40 hover:bg-primary/5 transition-all text-left"
                onClick={() => connectWallet(wallet.id)}
                disabled={isConnecting}
              >
                <span className="text-2xl">{wallet.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{wallet.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {wallet.connector === "walletConnect" ? "300+ wallets via QR" : "Browser extension"}
                  </p>
                </div>
                {isConnecting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                ) : (
                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                )}
              </button>
            ))}
            <p className="text-xs text-muted-foreground text-center pt-2">
              By connecting, you agree to our Terms of Service
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Compact wallet button for nav/header
export function WalletButton({ className }: { className?: string }) {
  const { isConnected, address, openModal } = useWallet();

  return (
    <Button
      variant={isConnected ? "outline" : "default"}
      size="sm"
      className={`gap-2 ${className}`}
      onClick={openModal}
    >
      {isConnected ? (
        <>
          <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
          <span className="font-mono text-xs">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>
        </>
      ) : (
        <>
          <span>🔗</span>
          Connect Wallet
        </>
      )}
    </Button>
  );
}
