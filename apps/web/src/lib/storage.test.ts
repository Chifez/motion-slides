import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { LocalFsStorageProvider, R2StorageProvider, getStorageProvider } from './storage'

describe('Cloudflare R2 storage', () => {
  it('stores audio through the R2 Worker binding and returns a same-origin URL', async () => {
    const bucket = {
      put: vi.fn().mockResolvedValue({}),
      get: vi.fn(),
      delete: vi.fn(),
    }
    const request = {
      runtime: { cloudflare: { env: { MOTIONSLIDES_R2: bucket } } },
    } as unknown as Request
    const storage = getStorageProvider(request)

    expect(storage).toBeInstanceOf(R2StorageProvider)
    const result = await storage.uploadFile(new Uint8Array([1, 2, 3]), '../voice over.mp3', 'audio/mpeg')

    expect(result.key).toMatch(/^uploads\/[0-9a-f-]+-voice_over\.mp3$/)
    expect(result.url).toMatch(/^\/api\/uploads\/[0-9a-f-]+-voice_over\.mp3$/)
    expect(bucket.put).toHaveBeenCalledWith(
      result.key,
      new Uint8Array([1, 2, 3]),
      { httpMetadata: { contentType: 'audio/mpeg' } },
    )
  })

  it('rejects unsafe upload lookup names', async () => {
    const bucket = { put: vi.fn(), get: vi.fn(), delete: vi.fn() }
    const request = {
      runtime: { cloudflare: { env: { MOTIONSLIDES_R2: bucket } } },
    } as unknown as Request

    await expect(getStorageProvider(request).getUpload('../private-key')).rejects.toThrow(
      'Invalid upload filename',
    )
  })
})

describe('Local filesystem fallback storage', () => {
  const origProvider = process.env.STORAGE_PROVIDER
  const origDir = process.env.STORAGE_DIR
  const origNodeEnv = process.env.NODE_ENV
  let tempDir = ''

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'motionslides-storage-'))
    process.env.STORAGE_PROVIDER = 'local'
    process.env.STORAGE_DIR = tempDir
  })

  afterEach(async () => {
    process.env.STORAGE_PROVIDER = origProvider
    process.env.STORAGE_DIR = origDir
    process.env.NODE_ENV = origNodeEnv
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true })
    }
  })

  it('falls back to LocalFsStorageProvider in local dev and round-trips audio bytes', async () => {
    const storage = getStorageProvider()
    expect(storage).toBeInstanceOf(LocalFsStorageProvider)

    const payload = new Uint8Array([10, 20, 30, 40])
    const uploaded = await storage.uploadFile(payload, 'voiceover.webm', 'audio/webm;codecs=opus')
    expect(uploaded.key).toMatch(/^uploads\/[0-9a-f-]+-voiceover\.webm$/)
    expect(uploaded.url).toMatch(/^\/api\/uploads\/[0-9a-f-]+-voiceover\.webm$/)

    const filename = uploaded.key.replace(/^uploads\//, '')
    const obj = await storage.getUpload(filename)
    expect(obj).not.toBeNull()
    expect(obj?.contentType).toBe('audio/webm')
    expect(Array.from(obj?.body as Uint8Array)).toEqual([10, 20, 30, 40])

    await storage.deleteFile(uploaded.key)
    expect(await storage.getUpload(filename)).toBeNull()
  })

  it('rejects traversal filenames on LocalFsStorageProvider', async () => {
    const storage = new LocalFsStorageProvider()
    await expect(storage.getUpload('../secret.webm')).rejects.toThrow('Invalid upload filename')
  })
})
