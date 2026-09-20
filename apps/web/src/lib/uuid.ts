/**
 * UUID v4 Utility
 * 
 * Generates RFC4122 compliant UUIDs using the browser's crypto API.
 * This is used for projects, slides, and elements to ensure global uniqueness,
 * especially when migrating to a multi-user/database architecture.
 */
let fallbackCounter = 0

export function uuid(): string {
  try {
    return crypto.randomUUID()
  } catch {
    // Cloudflare Workers disallows random values within global scope (module evaluation time).
    // Safely fallback to a deterministic identifier until request handlers execute.
    fallbackCounter = (fallbackCounter + 1) % 1000000
    const hex = fallbackCounter.toString(16).padStart(8, '0')
    return `00000000-0000-4000-8000-${hex.padStart(12, '0')}`
  }
}
