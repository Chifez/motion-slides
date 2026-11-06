import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "./db";
import * as schema from "./db/schema";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || process.env.ENCRYPTION_KEY,
  plugins: [tanstackStartCookies()],
  baseURL:
    process.env.BETTER_AUTH_URL ||
    "https://chifez-motion-slides-apps-web.classroom-analytics.workers.dev",
  trustedOrigins: [
    "https://*.workers.dev",
    "https://*.classroom-analytics.workers.dev",
    "http://localhost:3000",
    "http://localhost:5173",
    ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS
      ? process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(",")
      : []),
  ],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
});

// Resilient getSession wrapper for serverless isolate freeze/resume cycles.
// Cloudflare Workers freeze isolates between requests, during which remote poolers (Neon PgBouncer)
// drop idle TCP sockets. Retrying once allows postgres-js to discard the dead socket and reconnect cleanly.
const originalGetSession = auth.api.getSession.bind(auth.api);
auth.api.getSession = (async (...args: Parameters<typeof originalGetSession>) => {
  try {
    return await originalGetSession(...args);
  } catch (err) {
    console.warn("auth.api.getSession failed on first attempt (likely stale serverless socket), retrying...", err);
    try {
      return await originalGetSession(...args);
    } catch (retryErr) {
      console.error("auth.api.getSession retry also failed:", retryErr);
      return null;
    }
  }
}) as typeof originalGetSession;
