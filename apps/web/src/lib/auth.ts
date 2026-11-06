import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { db, withDbRetry } from "./db";
import * as schema from "./db/schema";

/**
 * Validates whether an email is permitted access when PRIVATE_BETA is enabled.
 */
export async function isEmailAllowed(rawEmail?: string | null): Promise<boolean> {
  const isPrivateBeta = process.env.PRIVATE_BETA === 'true'
  if (!isPrivateBeta) {
    return true // Public launch mode: open to everyone
  }

  if (!rawEmail) return false
  const email = rawEmail.trim().toLowerCase()

  // 1. Superuser / Admin check (chifez1@gmail.com is default)
  const adminEmails = (process.env.ADMIN_EMAILS || 'chifez1@gmail.com')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  if (adminEmails.includes(email)) {
    return true
  }

  // 2. Static env fallback check (e.g. ALLOWED_EMAILS)
  if (process.env.ALLOWED_EMAILS) {
    const staticAllowed = process.env.ALLOWED_EMAILS.split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
    if (staticAllowed.some((pattern) => (pattern.startsWith('@') ? email.endsWith(pattern) : email === pattern))) {
      return true
    }
  }

  // 3. Database allowlist check (Neon PostgreSQL)
  try {
    const records = await withDbRetry(() => db.query.allowlist.findMany())
    const isMatched = records.some((record) => {
      const pattern = record.email.trim().toLowerCase()
      return pattern.startsWith('@') ? email.endsWith(pattern) : email === pattern
    })
    if (isMatched) {
      return true
    }
  } catch (err) {
    console.error('[Allowlist Verification Error]:', err)
  }

  return false
}

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || process.env.ENCRYPTION_KEY,
  plugins: [tanstackStartCookies()],
  baseURL:
    process.env.BETTER_AUTH_URL ||
    "https://motionslides.app",
  trustedOrigins: [
    "https://motionslides.app",
    "https://*.motionslides.app",
    "https://*.workers.dev",
    "https://*.chifez.workers.dev",
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
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (process.env.PRIVATE_BETA === 'true') {
            const allowed = await isEmailAllowed(user.email)
            if (!allowed) {
              throw new APIError('FORBIDDEN', {
                message: 'Access Denied: MotionSlides is currently in private beta. Your email is not on the allowlist.',
              })
            }
          }
          return { data: user }
        },
      },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (process.env.PRIVATE_BETA === 'true') {
        if (ctx.path === '/sign-in/email' || ctx.path === '/sign-up/email') {
          const email = (ctx.body as any)?.email
          if (email) {
            const allowed = await isEmailAllowed(email)
            if (!allowed) {
              throw new APIError('FORBIDDEN', {
                message: 'Access Denied: MotionSlides is currently in private beta. Your email is not on the allowlist.',
              })
            }
          }
        }
      }
    }),
  },
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
