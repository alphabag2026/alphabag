import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useConnect, useDisconnect, useAccount, useSignMessage, useSwitchChain } from "wagmi";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { WALLET_OPTIONS, SUPPORTED_CHAINS } from "@/lib/wagmi";

interface WalletContextType {
  isConnected: boolean;
  address: string | undefined;
  chainId: number | undefined;
  isConnecting: boolean;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  connectWallet: (walletId: string) => Promise<void>;
  disconnectWallet: () => void;
  switchChain: (chainId: number) => void;
  signAndAuth: () => Promise<boolean>;
  supportedChains: typeof SUPPORTED_CHAINS;
  walletOptions: typeof WALLET_OPTIONS;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const { switchChain: wagmiSwitchChain } = useSwitchChain();

  const updateWallet = trpc.user.updateWallet.useMutation();

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
      connector = connectors.find(c => c.id === "injected");
    }

    if (!connector) {
      // Fallback: open WalletConnect if specific wallet not found
      const wcConnector = connectors.find(c => c.id === "walletConnect");
      if (wcConnector) {
        connect({ connector: wcConnector });
      } else {
        toast.error(`${walletOption.name} not found. Please install the wallet extension.`);
      }
      return;
    }

    try {
      connect({ connector });
      closeModal();
    } catch (err) {
      toast.error("Failed to connect wallet");
    }
  }, [connect, connectors, closeModal]);

  const disconnectWallet = useCallback(() => {
    disconnect();
    toast.success("Wallet disconnected");
  }, [disconnect]);

  const switchChain = useCallback((targetChainId: number) => {
    wagmiSwitchChain({ chainId: targetChainId });
  }, [wagmiSwitchChain]);

  const signAndAuth = useCallback(async (): Promise<boolean> => {
    if (!address) return false;
    try {
      const message = `Sign this message to verify your wallet ownership for AlphaBag.\n\nWallet: ${address}\nTimestamp: ${Date.now()}`;
      const signature = await signMessageAsync({ message });
      // Save wallet address to DB after successful signature
      await updateWallet.mutateAsync({ walletAddress: address });
      toast.success("Wallet verified and linked to your account!");
      return true;
    } catch (err) {
      toast.error("Wallet signature failed");
      return false;
    }
  }, [address, signMessageAsync, updateWallet]);

  return (
    <WalletContext.Provider value={{
      isConnected,
      address,
      chainId,
      isConnecting,
      isModalOpen,
      openModal,
      closeModal,
      connectWallet,
      disconnectWallet,
      switchChain,
      signAndAuth,
      supportedChains: SUPPORTED_CHAINS,
      walletOptions: WALLET_OPTIONS,
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
