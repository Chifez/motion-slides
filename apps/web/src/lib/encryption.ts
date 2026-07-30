import crypto from 'crypto'

function getEncryptionKey(): string | null {
  const key = process.env.ENCRYPTION_KEY
  if (!key || key.length !== 32) {
    return null
  }
  return key
}

const IV_LENGTH = 16 // For AES, this is always 16

export function encrypt(text: string): string {
  if (!text) return text
  const key = getEncryptionKey()
  if (!key) {
    console.warn('[encryption] ENCRYPTION_KEY not configured (must be 32 chars). Returning raw text.')
    return text
  }
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv)
  let encrypted = cipher.update(text)
  encrypted = Buffer.concat([encrypted, cipher.final()])
  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

export function decrypt(text: string): string {
  if (!text) return text
  const key = getEncryptionKey()
  if (!key) {
    return text
  }
  try {
    const textParts = text.split(':')
    if (textParts.length < 2) return text
    const iv = Buffer.from(textParts.shift()!, 'hex')
    const encryptedText = Buffer.from(textParts.join(':'), 'hex')
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv)
    let decrypted = decipher.update(encryptedText)
    decrypted = Buffer.concat([decrypted, decipher.final()])
    return decrypted.toString()
  } catch {
    return text
  }
}
