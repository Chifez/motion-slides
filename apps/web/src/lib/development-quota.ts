/**
 * Development-only escape hatch for local AI integration testing.
 *
 * This is deliberately opt-in and can never be enabled in production, even
 * if a production environment is accidentally configured with the flag.
 */
export function isDevelopmentQuotaBypass(
  env: { NODE_ENV?: string; DISABLE_AI_QUOTA?: string } = process.env,
) {
  return env.NODE_ENV !== 'production' && env.DISABLE_AI_QUOTA === 'true'
}
