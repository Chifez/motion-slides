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

const defaultAuthUrl = process.env.BETTER_AUTH_URL || (
  process.env.NODE_ENV !== 'production' ? 'http://localhost:3000' : 'https://motionslides.app'
);

const authUrlOrigin = (() => {
  try {
    return [new URL(defaultAuthUrl).origin];
  } catch {
    return [];
  }
})();

const envOrigins = (process.env.BETTER_AUTH_TRUSTED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || process.env.ENCRYPTION_KEY,
  plugins: [tanstackStartCookies()],
  baseURL: defaultAuthUrl,
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173",
    "https://motionslides.app",
    "https://www.motionslides.app",
    ...authUrlOrigin,
    ...envOrigins,
  ],
  advanced: {
    trustedProxyHeaders: true,
    useSecureCookies: process.env.NODE_ENV === 'production' || defaultAuthUrl.startsWith('https://'),
    ...(process.env.NODE_ENV === 'production'
      ? {
          crossSubDomainCookies: {
            enabled: true,
            domain: ".motionslides.app",
          },
        }
      : {}),
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "github"],
    },
  },
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
    resetPasswordTokenExpiresIn: 60 * 60, // 1 hour
    sendResetPassword: async ({ user, url, token }) => {
      const resetUrl = url.startsWith('http') ? url : `${defaultAuthUrl}${url}`
      console.log(`[Password Reset] Link for ${user.email}: ${resetUrl} (token: ${token})`)

      if (process.env.RESEND_API_KEY) {
        try {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: process.env.EMAIL_FROM || 'MotionSlides <auth@motionslides.app>',
              to: [user.email],
              subject: 'Reset your MotionSlides password',
              html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #0a0a0c; color: #f4f4f5; border-radius: 16px; border: 1px solid #27272a;">
                  <h2 style="font-size: 22px; font-weight: 700; color: #ffffff; margin-bottom: 12px;">Reset your MotionSlides password</h2>
                  <p style="font-size: 14px; line-height: 1.6; color: #a1a1aa; margin-bottom: 24px;">
                    We received a request to reset the password for <strong>${user.email}</strong>. Click the button below to choose a new password.
                  </p>
                  <p style="margin-bottom: 28px;">
                    <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; border-radius: 10px; font-size: 14px; font-weight: 600; text-decoration: none; display: inline-block;">
                      Reset Password
                    </a>
                  </p>
                  <p style="font-size: 12px; color: #71717a; line-height: 1.5; border-top: 1px solid #27272a; padding-top: 20px;">
                    If you didn't request a password reset, you can safely ignore this email. This link will expire in 1 hour.
                  </p>
                </div>
              `,
            }),
          })
        } catch (emailErr) {
          console.error('[Password Reset Email Error]:', emailErr)
        }
      }
    },
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
