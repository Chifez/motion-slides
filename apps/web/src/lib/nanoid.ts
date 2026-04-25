// Lightweight nano-ID utility (avoid extra dependency)
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
export function nanoid(size = 12): string {
  let id = ''
  const bytes = crypto.getRandomValues(new Uint8Array(size))
  for (const byte of bytes) {
    id += chars[byte % chars.length]
  }
  return id
}
