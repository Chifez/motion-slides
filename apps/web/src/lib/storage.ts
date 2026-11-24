import type { StorageProvider } from '@motionslides/shared'

export interface StoredUploadObject {
  body: ReadableStream | Uint8Array
  size?: number
  contentType?: string
  httpEtag?: string
  writeHttpMetadata(headers: Headers): void
}

interface R2Bucket {
  put(
    key: string,
    value: ArrayBuffer | ArrayBufferView | Blob,
    options?: { httpMetadata?: { contentType?: string } },
  ): Promise<unknown>
  get(key: string): Promise<StoredUploadObject | null>
  delete(key: string): Promise<void>
}

type CloudflareRequest = Request & {
  runtime?: { cloudflare?: { env?: Record<string, unknown> } }
}

function findR2Bucket(request?: Request): R2Bucket | null {
  const requestEnv = (request as CloudflareRequest | undefined)?.runtime?.cloudflare?.env
  const globalEnv = (globalThis as typeof globalThis & { __env__?: Record<string, unknown> }).__env__
  const bucket = (requestEnv ?? globalEnv)?.MOTIONSLIDES_R2
  if (bucket && typeof (bucket as R2Bucket).put === 'function') {
    return bucket as R2Bucket
  }
  return null
}

function safeFilename(filename: string): string {
  return filename.split('/').pop()!.replace(/[^a-zA-Z0-9.-]/g, '_') || 'audio.bin'
}

function isAudioUploadMime(mimeType: string): boolean {
  const normalized = mimeType.toLowerCase()
  return normalized.startsWith('audio/') || normalized.startsWith('video/webm')
}

export function inferAudioContentType(filename: string): string {
  const lower = filename.toLowerCase()
  if (lower.endsWith('.mp3')) return 'audio/mpeg'
  if (lower.endsWith('.wav')) return 'audio/wav'
  if (lower.endsWith('.m4a') || lower.endsWith('.mp4')) return 'audio/mp4'
  if (lower.endsWith('.ogg') || lower.endsWith('.opus')) return 'audio/ogg'
  if (lower.endsWith('.webm')) return 'audio/webm'
  if (lower.endsWith('.aac')) return 'audio/aac'
  if (lower.endsWith('.flac')) return 'audio/flac'
  return 'application/octet-stream'
}

/**
 * Production Cloudflare R2 storage adapter backed by the Worker `MOTIONSLIDES_R2` binding.
 */
export class R2StorageProvider implements StorageProvider {
  constructor(private readonly bucket: R2Bucket) {}

  async uploadFile(
    data: Uint8Array,
    filename: string,
    mimeType: string,
  ): Promise<{ url: string; key: string }> {
    const category = isAudioUploadMime(mimeType) ? 'uploads' : 'exports'
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

  async getUpload(filename: string): Promise<StoredUploadObject | null> {
    if (filename.includes('/') || filename.includes('..') || filename.includes('\\')) {
      throw new Error('Invalid upload filename.')
    }
    return this.bucket.get(`uploads/${filename}`)
  }
}

/**
 * Local filesystem fallback used in Node/Docker local development when `MOTIONSLIDES_R2`
 * is unavailable. Uses dynamic Node module imports so Worker bundles remain tree-shakeable.
 */
export class LocalFsStorageProvider implements StorageProvider {
  private async modules() {
    const [fs, path] = await Promise.all([import('node:fs/promises'), import('node:path')])
    const baseDir = process.env.STORAGE_DIR || path.resolve(process.cwd(), '.storage')
    return { fs, path, baseDir }
  }

  async uploadFile(
    data: Uint8Array,
    filename: string,
    mimeType: string,
  ): Promise<{ url: string; key: string }> {
    const { fs, path, baseDir } = await this.modules()
    const category = isAudioUploadMime(mimeType) ? 'uploads' : 'exports'
    const name = `${crypto.randomUUID()}-${safeFilename(filename)}`
    const key = `${category}/${name}`
    const dir = path.join(baseDir, category)

    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(path.join(dir, name), data)
    return { key, url: await this.getDownloadUrl(key) }
  }

  async getDownloadUrl(key: string): Promise<string> {
    const [category, ...nameParts] = key.split('/')
    if (category !== 'uploads' || nameParts.length === 0) {
      throw new Error('Only uploaded audio assets can be served by the web server.')
    }
    return `/api/uploads/${encodeURIComponent(nameParts.join('/'))}`
  }

  async deleteFile(key: string): Promise<void> {
    const { fs, path, baseDir } = await this.modules()
    if (key.includes('..') || path.isAbsolute(key)) {
      throw new Error('Invalid storage key.')
    }
    try {
      await fs.unlink(path.join(baseDir, key))
    } catch (err) {
      if ((err as NodeJS.ErrnoException)?.code !== 'ENOENT') throw err
    }
  }

  async getUpload(filename: string): Promise<StoredUploadObject | null> {
    if (filename.includes('/') || filename.includes('..') || filename.includes('\\')) {
      throw new Error('Invalid upload filename.')
    }
    const { fs, path, baseDir } = await this.modules()
    const filePath = path.join(baseDir, 'uploads', filename)
    try {
      const buf = await fs.readFile(filePath)
      const bytes = new Uint8Array(buf.byteLength)
      bytes.set(buf)
      const contentType = inferAudioContentType(filename)
      return {
        body: bytes,
        size: bytes.byteLength,
        contentType,
        writeHttpMetadata(headers: Headers) {
          headers.set('Content-Type', contentType)
        },
      }
    } catch (err) {
      if ((err as NodeJS.ErrnoException)?.code === 'ENOENT') return null
      throw err
    }
  }
}

export function getStorageProvider(request?: Request): R2StorageProvider | LocalFsStorageProvider {
  const bucket = findR2Bucket(request)
  if (bucket) {
    return new R2StorageProvider(bucket)
  }

  const allowLocalFallback =
    typeof process !== 'undefined' &&
    (process.env.STORAGE_PROVIDER === 'local' ||
      Boolean(process.env.STORAGE_DIR) ||
      process.env.NODE_ENV !== 'production')

  if (allowLocalFallback) {
    return new LocalFsStorageProvider()
  }

  throw new Error(
    'Cloudflare R2 binding MOTIONSLIDES_R2 is unavailable. Configure the Worker R2 binding before uploading files.',
  )
}
