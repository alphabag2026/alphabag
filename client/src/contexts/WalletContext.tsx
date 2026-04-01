import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";
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
  const utils = trpc.useUtils();

  const walletLogin = trpc.auth.walletLogin.useMutation();
  const tronLogin = trpc.auth.tronLogin.useMutation();

  // 로그인 후 DB 지갑 주소 조회
  const { data: profile } = trpc.user.profile.useQuery(undefined, {
    retry: false,
    onError: () => {},
  } as any);

  const dbWalletAddress = profile?.walletAddress ?? undefined;

  // EVM 지갑 연결 시 자동 로그인 (서명 요청)
  const hasAutoLoggedIn = useRef<string | null>(null);
  useEffect(() => {
    if (isConnected && address && !profile && hasAutoLoggedIn.current !== address) {
      hasAutoLoggedIn.current = address;
      // 자동 서명 로그인
      const doLogin = async () => {
        try {
          const message = `Sign this message to log in to AlphaBag.\n\nWallet: ${address}\nTimestamp: ${Date.now()}`;
          const signature = await signMessageAsync({ message });
          await walletLogin.mutateAsync({ walletAddress: address, signature, message });
          await utils.auth.me.invalidate();
          await utils.user.profile.invalidate();
          toast.success("지갑으로 로그인되었습니다!");
        } catch (err: any) {
          if (err?.message?.includes("User rejected") || err?.message?.includes("user rejected")) {
            toast.error("서명을 거부했습니다. 지갑 연결은 유지되지만 로그인은 취소되었습니다.");
          }
          // 서명 실패 시 다음 연결 시 재시도 가능하도록 초기화
          hasAutoLoggedIn.current = null;
        }
      };
      doLogin();
    }
  }, [isConnected, address, profile]);

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
  // 전역 이벤트로 지갑 모달 열기 지원 (getLoginUrl 대체)
  useEffect(() => {
    const handler = () => setIsModalOpen(true);
    window.addEventListener("open-wallet-modal", handler);
    return () => window.removeEventListener("open-wallet-modal", handler);
  }, []);
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
      connector = connectors.find(c => c.id === "injected");
    }

    if (!connector) {
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

  // TronLink 전용 연결 함수 - 연결 즉시 자동 로그인
  const connectTronLink = useCallback(async () => {
    try {
      const win = window as any;
      if (!win.tronWeb && !win.tronLink) {
        toast.error("TronLink가 설치되어 있지 않습니다. TronLink 확장 프로그램을 설치해 주세요.");
        window.open("https://www.tronlink.org/", "_blank");
        return;
      }
      if (win.tronLink?.request) {
        await win.tronLink.request({ method: "tron_requestAccounts" });
      }
      const addr = win.tronWeb?.defaultAddress?.base58;
      if (!addr || !isTronAddress(addr)) {
        toast.error("TronLink 계정을 가져올 수 없습니다. TronLink를 잠금 해제해 주세요.");
        return;
      }
      setTronAddress(addr);
      // Tron 로그인 (서명 없이 주소만으로)
      await tronLogin.mutateAsync({ walletAddress: addr });
      await utils.auth.me.invalidate();
      await utils.user.profile.invalidate();
      toast.success(`TronLink 로그인됨: ${addr.slice(0, 8)}...${addr.slice(-6)}`);
      closeModal();
    } catch (err: any) {
      if (err?.message?.includes("User rejected")) {
        toast.error("사용자가 연결을 거부했습니다.");
      } else {
        toast.error(err?.message ?? "TronLink 연결 실패");
      }
    }
  }, [tronLogin, utils, closeModal]);

  const disconnectWallet = useCallback(() => {
    disconnect();
    setTronAddress(undefined);
    hasAutoLoggedIn.current = null;
    // 로그아웃 처리
    utils.auth.me.invalidate();
    utils.user.profile.invalidate();
    toast.success("지갑 연결이 해제되었습니다.");
  }, [disconnect, utils]);

  const switchChain = useCallback((targetChainId: number) => {
    wagmiSwitchChain({ chainId: targetChainId });
  }, [wagmiSwitchChain]);

  // signAndAuth: 이미 로그인된 경우 재서명 (지갑 주소 업데이트용)
  const signAndAuth = useCallback(async (): Promise<boolean> => {
    if (!address) return false;
    try {
      const message = `Sign this message to verify your wallet ownership for AlphaBag.\n\nWallet: ${address}\nTimestamp: ${Date.now()}`;
      const signature = await signMessageAsync({ message });
      await walletLogin.mutateAsync({ walletAddress: address, signature, message });
      await utils.auth.me.invalidate();
      await utils.user.profile.invalidate();
      toast.success("지갑 인증이 완료되었습니다!");
      return true;
    } catch (err) {
      toast.error("지갑 서명에 실패했습니다.");
      return false;
    }
  }, [address, signMessageAsync, walletLogin, utils]);

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
