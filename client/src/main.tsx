import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import { WagmiProvider } from "wagmi";
import App from "./App";
import "./index.css";
import "@/lib/i18n"; // Initialize i18n
import { wagmiConfig } from "@/lib/wagmi";
import { WalletProvider } from "@/contexts/WalletContext";
const queryClient = new QueryClient();

// Manus OAuth 리다이렉트 제거 - 인증 오류 시 지갑 연결 모달 열기
const handleUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;
  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;
  if (!isUnauthorized) return;
  // Manus OAuth 대신 지갑 연결 모달 이벤트 발생
  window.dispatchEvent(new CustomEvent("open-wallet-modal"));
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    handleUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});
queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    handleUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});
createRoot(document.getElementById("root")!).render(
  <WagmiProvider config={wagmiConfig}>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <WalletProvider>
          <App />
        </WalletProvider>
      </QueryClientProvider>
    </trpc.Provider>
  </WagmiProvider>
);
