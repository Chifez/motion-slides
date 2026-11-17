import { describe, expect, it, vi } from 'vitest'
import { getStorageProvider } from './storage'

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

    await expect(getStorageProvider(request).getUpload('../private-key')).rejects.toThrow('Invalid upload filename')
  })
})
