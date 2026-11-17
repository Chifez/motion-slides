import { vi } from 'vitest'

const storage = new Map<string, string>()

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
  },
})

const indexedValues = new Map<string, unknown>()

// Unit tests exercise editor logic, not IndexedDB itself. A small in-memory
// implementation keeps persistence side effects deterministic and quiet.
vi.mock('idb-keyval', () => ({
  get: async (key: string) => indexedValues.get(key),
  set: async (key: string, value: unknown) => { indexedValues.set(key, value) },
  del: async (key: string) => { indexedValues.delete(key) },
  clear: async () => { indexedValues.clear() },
}))
