import type { StorageProvider } from '@motionslides/shared'

interface R2ObjectBody {
  body: ReadableStream
  httpEtag?: string
  writeHttpMetadata(headers: Headers): void
}

interface R2Bucket {
  put(key: string, value: ArrayBuffer | ArrayBufferView | Blob, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>
  get(key: string): Promise<R2ObjectBody | null>
  delete(key: string): Promise<void>
}

type CloudflareRequest = Request & {
  runtime?: { cloudflare?: { env?: Record<string, unknown> } }
}

function getR2Bucket(request?: Request): R2Bucket {
  const requestEnv = (request as CloudflareRequest | undefined)?.runtime?.cloudflare?.env
  const globalEnv = (globalThis as typeof globalThis & { __env__?: Record<string, unknown> }).__env__
  const bucket = (requestEnv ?? globalEnv)?.MOTIONSLIDES_R2

  if (!bucket || typeof (bucket as R2Bucket).put !== 'function') {
    throw new Error('Cloudflare R2 binding MOTIONSLIDES_R2 is unavailable. Configure the Worker R2 binding before uploading files.')
  }
  return bucket as R2Bucket
}

function safeFilename(filename: string): string {
  return filename.split('/').pop()!.replace(/[^a-zA-Z0-9.-]/g, '_') || 'audio.bin'
}

/**
 * Cloudflare-only storage adapter. The Worker binding avoids credentials and a
 * network hop, and Wrangler provides an R2 emulator for local development.
 */
export class R2StorageProvider implements StorageProvider {
  constructor(private readonly bucket: R2Bucket) {}

  async uploadFile(data: Uint8Array, filename: string, mimeType: string): Promise<{ url: string; key: string }> {
    const category = mimeType.startsWith('audio/') ? 'uploads' : 'exports'
    const name = `${crypto.randomUUID()}-${safeFilename(filename)}`
    const key = `${category}/${name}`

    await this.bucket.put(key, data, { httpMetadata: { contentType: mimeType } })
    return { key, url: await this.getDownloadUrl(key) }
  }

  async getDownloadUrl(key: string): Promise<string> {
    const [category, ...nameParts] = key.split('/')
    if (category !== 'uploads' || nameParts.length === 0) {
      throw new Error('Only uploaded audio assets can be served by the web Worker.')
    }
    return `/api/uploads/${encodeURIComponent(nameParts.join('/'))}`
  }

  async deleteFile(key: string): Promise<void> {
    await this.bucket.delete(key)
  }

  async getUpload(filename: string): Promise<R2ObjectBody | null> {
    if (filename.includes('/') || filename.includes('..')) {
      throw new Error('Invalid upload filename.')
    }
    return this.bucket.get(`uploads/${filename}`)
  }
}

export function getStorageProvider(request?: Request): R2StorageProvider {
  return new R2StorageProvider(getR2Bucket(request))
}
