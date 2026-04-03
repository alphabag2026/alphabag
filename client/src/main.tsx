import { trpc } from "@/lib/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import { WagmiProvider } from "wagmi";
import { I18nextProvider } from "react-i18next";
import App from "./App";
import "./index.css";
import i18n from "@/lib/i18n"; // Initialize i18n
import { wagmiConfig } from "@/lib/wagmi";
import { WalletProvider } from "@/contexts/WalletContext";

const queryClient = new QueryClient();

// API 오류 로깅만 (자동 팝업 없음 - 지갑 연결은 사용자가 직접 버튼 클릭 시에만)
queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    console.error("[API Query Error]", error);
  }
});
queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
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
  <I18nextProvider i18n={i18n}>
    <WagmiProvider config={wagmiConfig}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <WalletProvider>
            <App />
          </WalletProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </WagmiProvider>
  </I18nextProvider>
);
