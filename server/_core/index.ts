import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { startTelegramScheduler } from "../telegramScheduler";
import { startTrendingAlertScheduler } from "../trendingAlertScheduler";
import { startTwitterFetchScheduler } from "../twitterFetchScheduler";
import { registerTelegramWebhook } from "../telegramWebhook";
import { startPaymentChecker } from "../paymentChecker";
import { startVoteDeadlineScheduler } from "../voteDeadlineScheduler";
import { startTwitterStreamScheduler } from "../twitterStreamScheduler";
import apiV1Router from "../apiV1";
import apiDocsRouter from "../apiDocs";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Storage proxy for /manus-storage/* paths
  registerStorageProxy(app);
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Telegram Webhook
  registerTelegramWebhook(app);
  // Public REST API v1
  app.use("/api/v1", apiV1Router);
  // API Documentation (Swagger UI + OpenAPI JSON)
  app.use("/api", apiDocsRouter);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });

  // Start telegram scheduled broadcast
  startTelegramScheduler();
  // Start trending token alert scheduler
  startTrendingAlertScheduler();
  // Start Twitter/X auto-fetch scheduler
  startTwitterFetchScheduler();
  // Start onchain payment checker
  startPaymentChecker();
  // Start vote deadline auto-processing scheduler
  startVoteDeadlineScheduler();
  // Start Twitter/X Filtered Stream real-time scheduler
  startTwitterStreamScheduler().catch((e) => console.error('[TwitterStream] Start error:', e));
}

startServer().catch(console.error);
