/**
 * UUID v4 Utility
 * 
 * Generates RFC4122 compliant UUIDs using the browser's crypto API.
 * This is used for projects, slides, and elements to ensure global uniqueness,
 * especially when migrating to a multi-user/database architecture.
 */
export function uuid(): string {
  return crypto.randomUUID()
}
