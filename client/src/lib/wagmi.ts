import { createConfig, http } from "wagmi";
import { mainnet, bsc, polygon, arbitrum, optimism, base } from "wagmi/chains";
import { injected, walletConnect, coinbaseWallet } from "wagmi/connectors";

// WalletConnect Project ID (public demo key - replace with real key in production)
export const WC_PROJECT_ID = "2b7d5a2d7f3c4e5f6a7b8c9d0e1f2a3b";

export const wagmiConfig = createConfig({
  chains: [mainnet, bsc, polygon, arbitrum, optimism, base],
  connectors: [
    // MetaMask & all injected wallets (TrustWallet, OKX, Binance, etc.)
    injected({
      shimDisconnect: true,
    }),
    // WalletConnect v2 (supports 300+ wallets)
    walletConnect({
      projectId: WC_PROJECT_ID,
      metadata: {
        name: "AlphaBag",
        description: "AlphaBag Web3 Investment Platform",
        url: "https://alphabag.net",
        icons: ["https://alphabag.net/favicon.ico"],
      },
      showQrModal: true,
    }),
    // Coinbase Wallet
    coinbaseWallet({
      appName: "AlphaBag",
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [bsc.id]: http("https://bsc-dataseed.binance.org/"),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [base.id]: http(),
  },
});

export const SUPPORTED_CHAINS = [
  { id: mainnet.id, name: "Ethereum", symbol: "ETH", icon: "🔷" },
  { id: bsc.id, name: "BNB Chain", symbol: "BNB", icon: "🟡" },
  { id: polygon.id, name: "Polygon", symbol: "MATIC", icon: "🟣" },
  { id: arbitrum.id, name: "Arbitrum", symbol: "ARB", icon: "🔵" },
  { id: optimism.id, name: "Optimism", symbol: "OP", icon: "🔴" },
  { id: base.id, name: "Base", symbol: "ETH", icon: "🔹" },
];

export const WALLET_OPTIONS = [
  { id: "metamask", name: "MetaMask", icon: "🦊", connector: "injected" },
  { id: "trustwallet", name: "Trust Wallet", icon: "🛡️", connector: "injected" },
  { id: "okx", name: "OKX Wallet", icon: "⭕", connector: "injected" },
  { id: "binance", name: "Binance Web3", icon: "🟡", connector: "injected" },
  { id: "walletconnect", name: "WalletConnect", icon: "🔗", connector: "walletConnect" },
  { id: "coinbase", name: "Coinbase Wallet", icon: "🔵", connector: "coinbaseWallet" },
  { id: "tokenpocket", name: "TokenPocket", icon: "💼", connector: "injected" },
  { id: "gate", name: "Gate Wallet", icon: "🚪", connector: "injected" },
];
