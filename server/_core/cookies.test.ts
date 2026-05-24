import { describe, expect, it } from "vitest";
import type { Request } from "express";
import { getCookieValue } from "./cookies";

function requestWithCookies(cookieHeader?: string, cookies?: Record<string, string>) {
  return {
    headers: cookieHeader ? { cookie: cookieHeader } : {},
    cookies,
  } as Request;
}

describe("getCookieValue", () => {
  it("reads cookies from parsed req.cookies when available", () => {
    const req = requestWithCookies("admin_token=from-header", {
      admin_token: "from-parser",
    });

    expect(getCookieValue(req, "admin_token")).toBe("from-parser");
  });

  it("falls back to the raw Cookie header", () => {
    const req = requestWithCookies("app_session_id=session-token; admin_token=admin-token");

    expect(getCookieValue(req, "admin_token")).toBe("admin-token");
  });

  it("decodes encoded cookie values", () => {
    const req = requestWithCookies("app_session_id=session%20token");

    expect(getCookieValue(req, "app_session_id")).toBe("session token");
  });

  it("returns undefined when the cookie is missing", () => {
    const req = requestWithCookies("app_session_id=session-token");

    expect(getCookieValue(req, "admin_token")).toBeUndefined();
  });
});
