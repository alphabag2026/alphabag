import { afterEach, describe, expect, it } from "vitest";
import { getAdminJwtSecret, getUserJwtSecret } from "./jwtSecret";

const originalNodeEnv = process.env.NODE_ENV;
const originalJwtSecret = process.env.JWT_SECRET;

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv;
  if (originalJwtSecret === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = originalJwtSecret;
  }
});

describe("JWT secret helpers", () => {
  it("uses configured JWT_SECRET when present", () => {
    process.env.JWT_SECRET = "configured-secret";
    process.env.NODE_ENV = "production";

    expect(getUserJwtSecret()).toBe("configured-secret");
    expect(getAdminJwtSecret()).toBe("configured-secret");
  });

  it("keeps development fallbacks for local tests", () => {
    delete process.env.JWT_SECRET;
    process.env.NODE_ENV = "test";

    expect(getUserJwtSecret()).toBe("alphabag-secret-key");
    expect(getAdminJwtSecret()).toBe("alphabag-admin-secret");
  });

  it("requires JWT_SECRET in production", () => {
    delete process.env.JWT_SECRET;
    process.env.NODE_ENV = "production";

    expect(() => getUserJwtSecret()).toThrow("JWT_SECRET is required in production");
    expect(() => getAdminJwtSecret()).toThrow("JWT_SECRET is required in production");
  });
});
