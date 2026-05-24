import express, { type Express } from "express";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import apiDocsRouter from "./apiDocs";
import apiV1Router from "./apiV1";
import { generateApiKey, hashApiKey } from "./apiV1";

let server: Server;
let baseUrl: string;

function startTestServer(app: Express) {
  return new Promise<Server>((resolve) => {
    const runningServer = app.listen(0, "127.0.0.1", () => resolve(runningServer));
  });
}

beforeAll(async () => {
  const app = express();
  app.use(express.json());
  app.use("/api", apiDocsRouter);
  app.use("/api/v1", apiV1Router);

  server = await startTestServer(app);
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to start API test server");
  }
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

describe("API Key Utilities", () => {
  it("generateApiKey returns key with abv2_ prefix", () => {
    const { key, prefix, hash } = generateApiKey();
    expect(key).toMatch(/^abv2_/);
    expect(key.length).toBeGreaterThan(20);
    expect(prefix).toBe(key.slice(0, 12));
    expect(hash).toHaveLength(64); // SHA-256 hex
  });

  it("hashApiKey produces consistent SHA-256 hash", () => {
    const key = "abv2_testkey12345";
    const hash1 = hashApiKey(key);
    const hash2 = hashApiKey(key);
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it("different keys produce different hashes", () => {
    const hash1 = hashApiKey("abv2_key1");
    const hash2 = hashApiKey("abv2_key2");
    expect(hash1).not.toBe(hash2);
  });

  it("generateApiKey produces unique keys", () => {
    const keys = new Set(Array.from({ length: 10 }, () => generateApiKey().key));
    expect(keys.size).toBe(10);
  });
});

describe("OpenAPI Spec", () => {
  it("docs.json endpoint returns valid OpenAPI spec", async () => {
    const response = await fetch(`${baseUrl}/api/docs.json`);
    expect(response.status).toBe(200);
    const spec = await response.json() as Record<string, unknown>;
    expect(spec.openapi).toBe("3.1.0");
    expect(spec.info).toBeDefined();
    expect(spec.paths).toBeDefined();
    const paths = spec.paths as Record<string, unknown>;
    expect(Object.keys(paths)).toContain("/tabs/recommended");
    expect(Object.keys(paths)).toContain("/tabs/trending");
    expect(Object.keys(paths)).toContain("/tabs/sns");
  });

  it("docs endpoint returns HTML", async () => {
    const response = await fetch(`${baseUrl}/api/docs`);
    expect(response.status).toBe(200);
    const contentType = response.headers.get("content-type");
    expect(contentType).toContain("text/html");
    const html = await response.text();
    expect(html).toContain("swagger-ui");
    expect(html).toContain("AlphaBag API");
  });
});

describe("API v1 Authentication", () => {
  it("returns 401 without Authorization header", async () => {
    const response = await fetch(`${baseUrl}/api/v1/tabs/recommended`);
    expect(response.status).toBe(401);
    const body = await response.json() as Record<string, unknown>;
    expect(body.error).toBe("Unauthorized");
    expect(body.docs).toBe("/api/docs");
  });

  it("returns an auth failure for invalid API key when DB is unavailable", async () => {
    const response = await fetch(`${baseUrl}/api/v1/tabs/recommended`, {
      headers: { Authorization: "Bearer abv2_invalid_key_that_does_not_exist" },
    });
    expect([401, 500]).toContain(response.status);
    const body = await response.json() as Record<string, unknown>;
    expect(["Invalid API Key", "Internal Server Error"]).toContain(body.error);
  });

  it("returns 401 with malformed Authorization header", async () => {
    const response = await fetch(`${baseUrl}/api/v1/tabs/recommended`, {
      headers: { Authorization: "Basic sometoken" },
    });
    expect(response.status).toBe(401);
  });
});
