import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { useConnect, useDisconnect, useAccount, useSignMessage, useSwitchChain } from "wagmi";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { WALLET_OPTIONS, SUPPORTED_CHAINS } from "@/lib/wagmi";

// TronLink 주소 (T로 시작하는 Base58 주소)
function isTronAddress(addr: string) {
  return /^T[0-9A-Za-z]{33}$/.test(addr);
}

interface WalletContextType {
  isConnected: boolean;
  address: string | undefined;
  chainId: number | undefined;
  isConnecting: boolean;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  connectWallet: (walletId: string) => Promise<void>;
  connectTronLink: () => Promise<void>;
  disconnectWallet: () => void;
  switchChain: (chainId: number) => void;
  signAndAuth: () => Promise<boolean>;
  supportedChains: typeof SUPPORTED_CHAINS;
  walletOptions: typeof WALLET_OPTIONS;
  // TronLink 연결 상태
  tronAddress: string | undefined;
  isTronConnected: boolean;
  // DB에서 복원된 지갑 주소 (로그인 후 표시용)
  dbWalletAddress: string | undefined;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tronAddress, setTronAddress] = useState<string | undefined>(undefined);
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const { switchChain: wagmiSwitchChain } = useSwitchChain();

  const updateWallet = trpc.user.updateWallet.useMutation();
  // 로그인 후 DB 지갑 주소 조회
  const { data: profile } = trpc.user.profile.useQuery(undefined, {
    retry: false,
    // 에러 시 조용히 실패
    onError: () => {},
  } as any);

  const dbWalletAddress = profile?.walletAddress ?? undefined;

  // TronLink 연결 감지
  useEffect(() => {
    const checkTron = () => {
      const win = window as any;
      const addr = win.tronWeb?.defaultAddress?.base58;
      if (addr && isTronAddress(addr)) {
        setTronAddress(addr);
      }
    };
    checkTron();
    // TronLink 이벤트 리스닝
    const win = window as any;
    if (win.tronLink?.on) {
      win.tronLink.on("accountsChanged", checkTron);
    }
    const interval = setInterval(checkTron, 3000);
    return () => {
      clearInterval(interval);
      if (win.tronLink?.removeListener) {
        win.tronLink.removeListener("accountsChanged", checkTron);
      }
    };
  }, []);

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const connectWallet = useCallback(async (walletId: string) => {
    const walletOption = WALLET_OPTIONS.find(w => w.id === walletId);
    if (!walletOption) return;

    let connector;
    if (walletOption.connector === "walletConnect") {
      connector = connectors.find(c => c.id === "walletConnect");
    } else if (walletOption.connector === "coinbaseWallet") {
      connector = connectors.find(c => c.id === "coinbaseWallet");
    } else {
      // injected 계열: MetaMask, TrustWallet, OKX, Binance, TokenPocket, Gate
      connector = connectors.find(c => c.id === "injected");
    }

    if (!connector) {
      // Fallback: WalletConnect QR
      const wcConnector = connectors.find(c => c.id === "walletConnect");
      if (wcConnector) {
        connect({ connector: wcConnector });
      } else {
        toast.error(`${walletOption.name}을(를) 찾을 수 없습니다. 지갑 확장 프로그램을 설치해 주세요.`);
      }
      return;
    }

    try {
      connect({ connector });
      closeModal();
    } catch (err) {
      toast.error("지갑 연결에 실패했습니다.");
    }
  }, [connect, connectors, closeModal]);

  // TronLink 전용 연결 함수
  const connectTronLink = useCallback(async () => {
    try {
      const win = window as any;
      if (!win.tronWeb && !win.tronLink) {
        toast.error("TronLink가 설치되어 있지 않습니다. TronLink 확장 프로그램을 설치해 주세요.");
        window.open("https://www.tronlink.org/", "_blank");
        return;
      }
      // TronLink 활성화 요청
      if (win.tronLink?.request) {
        await win.tronLink.request({ method: "tron_requestAccounts" });
      }
      const addr = win.tronWeb?.defaultAddress?.base58;
      if (!addr || !isTronAddress(addr)) {
        toast.error("TronLink 계정을 가져올 수 없습니다. TronLink를 잠금 해제해 주세요.");
        return;
      }
      setTronAddress(addr);
      // DB에 저장 (로그인 상태라면)
      try {
        await updateWallet.mutateAsync({ walletAddress: addr });
        toast.success(`TronLink 연결됨: ${addr.slice(0, 8)}...${addr.slice(-6)}`);
      } catch {
        toast.success(`TronLink 연결됨: ${addr.slice(0, 8)}...${addr.slice(-6)}`);
      }
      closeModal();
    } catch (err: any) {
      if (err?.message?.includes("User rejected")) {
        toast.error("사용자가 연결을 거부했습니다.");
      } else {
        toast.error(err?.message ?? "TronLink 연결 실패");
      }
    }
  }, [updateWallet, closeModal]);

  const disconnectWallet = useCallback(() => {
    disconnect();
    setTronAddress(undefined);
    toast.success("지갑 연결이 해제되었습니다.");
  }, [disconnect]);

  const switchChain = useCallback((targetChainId: number) => {
    wagmiSwitchChain({ chainId: targetChainId });
  }, [wagmiSwitchChain]);

  const signAndAuth = useCallback(async (): Promise<boolean> => {
    if (!address) return false;
    try {
      const message = `Sign this message to verify your wallet ownership for AlphaBag.\n\nWallet: ${address}\nTimestamp: ${Date.now()}`;
      await signMessageAsync({ message });
      // 서명 성공 후 DB에 지갑 주소 저장
      await updateWallet.mutateAsync({ walletAddress: address });
      toast.success("지갑이 계정에 연결되었습니다!");
      return true;
    } catch (err) {
      toast.error("지갑 서명에 실패했습니다.");
      return false;
    }
  }, [address, signMessageAsync, updateWallet]);

  // EVM 지갑 연결 시 자동으로 DB에 저장 (로그인 상태일 때)
  useEffect(() => {
    if (isConnected && address && profile && !profile.walletAddress) {
      updateWallet.mutateAsync({ walletAddress: address }).catch(() => {});
    }
  }, [isConnected, address, profile]);

  const effectiveAddress = address ?? tronAddress;
  const effectiveIsConnected = isConnected || !!tronAddress;

  return (
    <WalletContext.Provider value={{
      isConnected: effectiveIsConnected,
      address: effectiveAddress,
      chainId,
      isConnecting,
      isModalOpen,
      openModal,
      closeModal,
      connectWallet,
      connectTronLink,
      disconnectWallet,
      switchChain,
      signAndAuth,
      supportedChains: SUPPORTED_CHAINS,
      walletOptions: WALLET_OPTIONS,
      tronAddress,
      isTronConnected: !!tronAddress,
      dbWalletAddress,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
