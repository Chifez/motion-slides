const isBrowser = typeof window !== 'undefined'

export function getStorageItem(key: string): string | null {
  if (!isBrowser) return null
  return localStorage.getItem(key)
}

export function setStorageItem(key: string, value: string): void {
  if (!isBrowser) return
  localStorage.setItem(key, value)
}

export function getWindowOrigin(): string {
  if (!isBrowser) return ''
  return window.location.origin
}
