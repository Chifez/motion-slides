import crypto from 'crypto'
import { afterEach, describe, expect, it } from 'vitest'
import { decrypt, decryptWithMetadata, encrypt } from './encryption'

const TEST_KEY = '0123456789abcdef0123456789abcdef'
const originalKey = process.env.ENCRYPTION_KEY

afterEach(() => {
  if (originalKey === undefined) delete process.env.ENCRYPTION_KEY
  else process.env.ENCRYPTION_KEY = originalKey
})

describe('API key encryption', () => {
  it('uses authenticated AES-256-GCM for new values', () => {
    process.env.ENCRYPTION_KEY = TEST_KEY

    const encrypted = encrypt('sk-secret-value')

    expect(encrypted).toMatch(/^v2:[^:]+:[^:]+:[^:]+$/)
    expect(decrypt(encrypted)).toBe('sk-secret-value')
    expect(encrypted).not.toContain('sk-secret-value')
  })

  it('rejects tampered ciphertext', () => {
    process.env.ENCRYPTION_KEY = TEST_KEY
    const encrypted = encrypt('sk-secret-value')
    const parts = encrypted.split(':')
    parts[3] = `${parts[3].slice(0, -1)}x`

    expect(() => decrypt(parts.join(':'))).toThrow()
  })

  it('reads and marks legacy AES-CBC values for migration', () => {
    process.env.ENCRYPTION_KEY = TEST_KEY
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(TEST_KEY), iv)
    const ciphertext = Buffer.concat([cipher.update('legacy-key'), cipher.final()])

    expect(decryptWithMetadata(`${iv.toString('hex')}:${ciphertext.toString('hex')}`)).toEqual({
      plaintext: 'legacy-key',
      needsMigration: true,
    })
  })

  it('reads and marks legacy plaintext values for migration', () => {
    expect(decryptWithMetadata('legacy-plaintext-key')).toEqual({
      plaintext: 'legacy-plaintext-key',
      needsMigration: true,
    })
  })

  it('refuses to encrypt without a valid key', () => {
    delete process.env.ENCRYPTION_KEY
    expect(() => encrypt('sk-secret-value')).toThrow('ENCRYPTION_KEY')
  })
})
