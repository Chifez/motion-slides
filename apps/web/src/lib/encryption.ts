import crypto from 'crypto'

const CURRENT_VERSION = 'v2'
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

export interface DecryptedValue {
  plaintext: string
  /** Values written before v2 need to be rewritten with authenticated encryption. */
  needsMigration: boolean
}

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key || Buffer.byteLength(key, 'utf8') !== 32) {
    throw new Error('ENCRYPTION_KEY must be set to exactly 32 UTF-8 bytes before API keys can be stored or read.')
  }
  return Buffer.from(key, 'utf8')
}

/** API keys must never be persisted as plaintext in a production bundle. */
if (process.env.NODE_ENV === 'production') {
  getEncryptionKey()
}

/** Encrypts a value with AES-256-GCM (authenticated encryption). */
export function encrypt(text: string): string {
  if (!text) return text

  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv, {
    authTagLength: AUTH_TAG_LENGTH,
  })
  const ciphertext = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return [CURRENT_VERSION, iv.toString('base64url'), authTag.toString('base64url'), ciphertext.toString('base64url')].join(':')
}

function decryptV2(parts: string[]): string {
  if (parts.length !== 4) throw new Error('Stored API key has an invalid encryption format.')
  const [, ivValue, authTagValue, ciphertextValue] = parts
  const decipher = crypto.createDecipheriv('aes-256-gcm', getEncryptionKey(), Buffer.from(ivValue, 'base64url'), {
    authTagLength: AUTH_TAG_LENGTH,
  })
  decipher.setAuthTag(Buffer.from(authTagValue, 'base64url'))
  return Buffer.concat([decipher.update(Buffer.from(ciphertextValue, 'base64url')), decipher.final()]).toString('utf8')
}

/** Decrypts legacy AES-CBC values written by earlier versions. */
function decryptLegacyCbc(parts: string[]): string {
  if (parts.length !== 2) throw new Error('Stored API key has an invalid legacy encryption format.')
  const [ivValue, ciphertextValue] = parts
  const decipher = crypto.createDecipheriv('aes-256-cbc', getEncryptionKey(), Buffer.from(ivValue, 'hex'))
  return Buffer.concat([decipher.update(Buffer.from(ciphertextValue, 'hex')), decipher.final()]).toString('utf8')
}

/**
 * Reads current GCM data plus the two formats used before this fix: AES-CBC and
 * plaintext. Legacy data is intentionally supported only so it can be upgraded
 * on the next authenticated settings/key read.
 */
export function decryptWithMetadata(value: string): DecryptedValue {
  if (!value) return { plaintext: value, needsMigration: false }

  const parts = value.split(':')
  if (parts[0] === CURRENT_VERSION) {
    return { plaintext: decryptV2(parts), needsMigration: false }
  }
  if (parts.length === 2) {
    return { plaintext: decryptLegacyCbc(parts), needsMigration: true }
  }

  // Old deployments stored raw data if ENCRYPTION_KEY was missing. Do not write
  // this format again; callers that successfully read it migrate it to v2.
  return { plaintext: value, needsMigration: true }
}

export function decrypt(value: string): string {
  return decryptWithMetadata(value).plaintext
}
