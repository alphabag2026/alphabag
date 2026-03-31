import { useWallet } from "@/contexts/WalletContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, CheckCircle2, ChevronDown, Copy, Wallet, AlertCircle } from "lucide-react";
import { useState } from "react";
import { SUPPORTED_CHAINS } from "@/lib/wagmi";
import { toast } from "sonner";

// 지갑 목록 (EVM + TronLink + 추가 지갑)
const ALL_WALLET_OPTIONS = [
  {
    id: "metamask",
    name: "MetaMask",
    icon: "🦊",
    desc: "브라우저 확장 프로그램",
    type: "evm",
    installUrl: "https://metamask.io/download/",
  },
  {
    id: "tronlink",
    name: "TronLink",
    icon: "🔴",
    desc: "TRON 네트워크 (TRC20)",
    type: "tron",
    installUrl: "https://www.tronlink.org/",
  },
  {
    id: "walletconnect",
    name: "WalletConnect",
    icon: "🔗",
    desc: "QR코드로 300+ 지갑 연결",
    type: "evm",
    installUrl: null,
  },
  {
    id: "trustwallet",
    name: "Trust Wallet",
    icon: "🛡️",
    desc: "모바일 & 브라우저 확장",
    type: "evm",
    installUrl: "https://trustwallet.com/",
  },
  {
    id: "tokenpocket",
    name: "TokenPocket",
    icon: "💼",
    desc: "멀티체인 지갑",
    type: "evm",
    installUrl: "https://www.tokenpocket.pro/",
  },
  {
    id: "okx",
    name: "OKX Wallet",
    icon: "⭕",
    desc: "OKX 거래소 지갑",
    type: "evm",
    installUrl: "https://www.okx.com/web3",
  },
  {
    id: "binance",
    name: "Binance Web3",
    icon: "🟡",
    desc: "바이낸스 Web3 지갑",
    type: "evm",
    installUrl: "https://www.binance.com/en/web3wallet",
  },
  {
    id: "gate",
    name: "Gate Wallet",
    icon: "🚪",
    desc: "Gate.io 지갑",
    type: "evm",
    installUrl: "https://www.gate.io/mywallet",
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    icon: "🔵",
    desc: "Coinbase 지갑",
    type: "evm",
    installUrl: "https://www.coinbase.com/wallet",
  },
];

export function WalletConnectModal() {
  const {
    isModalOpen, closeModal, connectWallet, connectTronLink, isConnecting,
    isConnected, address, chainId, disconnectWallet, switchChain,
    signAndAuth, tronAddress, isTronConnected, dbWalletAddress,
  } = useWallet();
  const [showChains, setShowChains] = useState(false);
  const [signing, setSigning] = useState(false);

  const currentChain = SUPPORTED_CHAINS.find(c => c.id === chainId);
  const displayAddress = address ?? tronAddress;
  const networkLabel = isTronConnected && !address ? "TRON" : (currentChain?.name ?? "Unknown");

  const handleSignAndAuth = async () => {
    setSigning(true);
    await signAndAuth();
    setSigning(false);
    closeModal();
  };

  const handleCopy = () => {
    if (displayAddress) {
      navigator.clipboard.writeText(displayAddress);
      toast.success("주소가 복사되었습니다.");
    }
  };

  const handleConnect = async (walletId: string) => {
    if (walletId === "tronlink") {
      await connectTronLink();
    } else {
      await connectWallet(walletId);
    }
  };

  const getExplorerUrl = () => {
    if (isTronConnected && tronAddress) {
      return `https://tronscan.org/#/address/${tronAddress}`;
    }
    if (chainId === 56) return `https://bscscan.com/address/${address}`;
    if (chainId === 137) return `https://polygonscan.com/address/${address}`;
    return `https://etherscan.io/address/${address}`;
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={closeModal}>
      <DialogContent className="bg-card border-border/60 max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <Wallet className="w-4 h-4 text-amber-500" />
            {isConnected ? "지갑 연결됨" : "지갑 연결"}
          </DialogTitle>
        </DialogHeader>

        {isConnected ? (
          <div className="space-y-4 pt-2">
            {/* 연결 상태 */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-xs text-green-500 font-medium">연결됨 · {networkLabel}</p>
                </div>
                <p className="font-mono text-sm font-medium text-foreground truncate">
                  {displayAddress?.slice(0, 10)}...{displayAddress?.slice(-8)}
                </p>
              </div>
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
              >
                <Copy className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>

            {/* DB 지갑 주소 (로그인 후 기존 데이터) */}
            {dbWalletAddress && dbWalletAddress !== displayAddress && (
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-xs text-blue-400 font-medium">계정에 등록된 지갑 주소</span>
                </div>
                <p className="font-mono text-xs text-muted-foreground break-all">{dbWalletAddress}</p>
                <p className="text-xs text-muted-foreground mt-1">현재 연결된 지갑과 다릅니다. 서명으로 업데이트하세요.</p>
              </div>
            )}

            {/* 체인 선택 (EVM만) */}
            {!isTronConnected && (
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
                        className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent transition-colors ${chain.id === chainId ? "text-amber-500 font-medium" : "text-muted-foreground"}`}
                        onClick={() => { switchChain(chain.id); setShowChains(false); }}
                      >
                        <span>{chain.icon}</span>
                        <span>{chain.name}</span>
                        {chain.id === chainId && <CheckCircle2 className="w-3 h-3 ml-auto text-amber-500" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Explorer 링크 */}
            <a
              href={getExplorerUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              블록 익스플로러에서 보기
            </a>

            {/* 서명 & 계정 연결 (EVM만) */}
            {!isTronConnected && (
              <Button
                className="w-full gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold"
                onClick={handleSignAndAuth}
                disabled={signing}
              >
                {signing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                서명으로 계정 연결
              </Button>
            )}

            <Button
              variant="outline"
              className="w-full text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60"
              onClick={() => { disconnectWallet(); closeModal(); }}
            >
              지갑 연결 해제
            </Button>
          </div>
        ) : (
          <div className="space-y-2 pt-2">
            {/* DB 지갑 주소 표시 (로그인 후 기존 데이터) */}
            {dbWalletAddress && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <Wallet className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-xs text-amber-500 font-medium">계정에 등록된 지갑 주소</span>
                </div>
                <p className="font-mono text-xs text-foreground break-all">{dbWalletAddress}</p>
                <p className="text-xs text-muted-foreground mt-1">아래 지갑을 연결하면 자동으로 연동됩니다.</p>
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center mb-3">
              연결할 지갑을 선택하세요
            </p>

            {ALL_WALLET_OPTIONS.map((wallet) => (
              <button
                key={wallet.id}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-border/30 hover:border-amber-500/40 hover:bg-amber-500/5 transition-all text-left"
                onClick={() => handleConnect(wallet.id)}
                disabled={isConnecting}
              >
                <span className="text-2xl flex-shrink-0">{wallet.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{wallet.name}</p>
                    {wallet.type === "tron" && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0 text-red-400 border-red-400/40">TRC20</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{wallet.desc}</p>
                </div>
                {isConnecting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground flex-shrink-0" />
                ) : (
                  <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                )}
              </button>
            ))}

            <p className="text-xs text-muted-foreground text-center pt-2">
              연결 시 서비스 이용약관에 동의하는 것으로 간주됩니다.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// 컴팩트 지갑 버튼 (헤더용)
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
          <Wallet className="w-3.5 h-3.5" />
          지갑 연결
        </>
      )}
    </Button>
  );
}
