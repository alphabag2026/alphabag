const DEV_USER_JWT_SECRET = "alphabag-secret-key";
const DEV_ADMIN_JWT_SECRET = "alphabag-admin-secret";

function getRequiredJwtSecret(fallback: string) {
  const secret = process.env.JWT_SECRET;
  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET is required in production");
  }

  return fallback;
}

export function getUserJwtSecret() {
  return getRequiredJwtSecret(DEV_USER_JWT_SECRET);
}

export function getUserJwtSecretBytes() {
  return new TextEncoder().encode(getUserJwtSecret());
}

export function getAdminJwtSecret() {
  return getRequiredJwtSecret(DEV_ADMIN_JWT_SECRET);
}

export function assertJwtSecretConfigured() {
  getRequiredJwtSecret(DEV_USER_JWT_SECRET);
}
