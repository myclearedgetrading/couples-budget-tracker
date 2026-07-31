import "server-only";

import { createNeonAuth } from "@neondatabase/auth/next/server";

function createAuth() {
  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET;

  if (!baseUrl) {
    throw new Error("NEON_AUTH_BASE_URL is required to use Neon Auth.");
  }

  if (!cookieSecret || cookieSecret.length < 32) {
    throw new Error(
      "NEON_AUTH_COOKIE_SECRET must be a secure value of at least 32 characters.",
    );
  }

  return createNeonAuth({
    baseUrl,
    cookies: {
      secret: cookieSecret,
      sessionDataTtl: 300,
    },
  });
}

const neonAuth = createAuth();

export const auth = {
  handler: neonAuth.handler,
  middleware: neonAuth.middleware,
  async getSession() {
    const { data, error } = await neonAuth.getSession();
    if (error && !data) {
      return null;
    }
    return data;
  },
};
