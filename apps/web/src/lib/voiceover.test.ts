import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DEFAULT_ELEVENLABS_VOICES } from './voiceover-catalog'
import { fetchElevenLabsVoices, synthesizeCloudflareVoiceover } from './voiceover.server'

describe('voiceover.server', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    delete (globalThis as { __env__?: Record<string, unknown> }).__env__
    delete process.env.CLOUDFLARE_ACCOUNT_ID
    delete process.env.CLOUDFLARE_AI_TOKEN
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    delete (globalThis as { __env__?: Record<string, unknown> }).__env__
    vi.restoreAllMocks()
  })

  it('uses Worker AI binding returning a Response', async () => {
    const mockBytes = new Uint8Array([1, 2, 3, 4])
    const run = vi.fn().mockResolvedValue(new Response(mockBytes, { status: 200 }))
    ;(globalThis as { __env__?: Record<string, unknown> }).__env__ = { AI: { run } }

    const audio = await synthesizeCloudflareVoiceover({
      text: 'Hello slides',
      voiceId: 'asteria',
    })

    expect(run).toHaveBeenCalledWith(
      '@cf/deepgram/aura-1',
      { text: 'Hello slides', speaker: 'asteria', encoding: 'mp3' },
      { returnRawResponse: true },
    )
    expect(Array.from(audio)).toEqual([1, 2, 3, 4])
  })

  it('uses Worker AI binding returning a raw ReadableStream', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array([9, 8, 7]))
        controller.close()
      },
    })
    const run = vi.fn().mockResolvedValue(stream)
    const request = Object.assign(new Request('http://localhost/'), {
      runtime: { cloudflare: { env: { AI: { run } } } },
    })

    const audio = await synthesizeCloudflareVoiceover({
      text: 'Stream check',
      voiceId: 'orion',
      request,
    })

    expect(run).toHaveBeenCalledWith(
      '@cf/deepgram/aura-1',
      { text: 'Stream check', speaker: 'orion', encoding: 'mp3' },
      { returnRawResponse: true },
    )
    expect(Array.from(audio)).toEqual([9, 8, 7])
  })

  it('falls back to Cloudflare REST API when account ID and token are set', async () => {
    process.env.CLOUDFLARE_ACCOUNT_ID = 'acct_123'
    process.env.CLOUDFLARE_AI_TOKEN = 'tok_secret'
    const fetchMock = vi.fn().mockResolvedValue(new Response(new Uint8Array([5, 6]), { status: 200 }))

    const audio = await synthesizeCloudflareVoiceover({
      text: 'Local dev test',
      voiceId: 'luna',
      fetchImpl: fetchMock as unknown as typeof fetch,
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.cloudflare.com/client/v4/accounts/acct_123/ai/run/@cf/deepgram/aura-1',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer tok_secret',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: 'Local dev test', speaker: 'luna', encoding: 'mp3' }),
      }),
    )
    expect(Array.from(audio)).toEqual([5, 6])
  })

  it('rejects invalid Cloudflare voice IDs', async () => {
    await expect(
      synthesizeCloudflareVoiceover({ text: 'Hello', voiceId: 'not-a-voice' }),
    ).rejects.toThrow('Unsupported Cloudflare voice selected.')
  })

  it('throws a clear error when neither AI binding nor REST env credentials exist', async () => {
    await expect(
      synthesizeCloudflareVoiceover({ text: 'Hello', voiceId: 'asteria' }),
    ).rejects.toThrow(
      'Cloudflare Workers AI is not available in this environment. Deploy with the AI binding or set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_AI_TOKEN.',
    )
  })

  it('maps ElevenLabs GET /v1/voices with custom/cloned voices sorted before premade', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          voices: [
            {
              voice_id: 'pre_1',
              name: 'Zara',
              category: 'premade',
              labels: { gender: 'female', accent: 'british', description: 'calm' },
            },
            {
              voice_id: 'clo_1',
              name: 'Founder Clone',
              category: 'cloned',
              labels: { gender: 'male', accent: 'american' },
            },
            {
              voice_id: 'pre_2',
              name: 'Adam',
              category: 'premade',
              labels: { gender: 'male', accent: 'american' },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    const result = await fetchElevenLabsVoices({
      apiKey: 'el_key',
      fetchImpl: fetchMock as unknown as typeof fetch,
    })

    expect(result.fallbackUsed).toBe(false)
    expect(result.voices.map((v) => v.name)).toEqual(['Founder Clone', 'Adam', 'Zara'])
    expect(result.voices[0]).toEqual({
      id: 'clo_1',
      name: 'Founder Clone',
      description: 'Male · American',
      provider: 'elevenlabs',
      category: 'cloned',
    })
  })

  it('falls back to curated defaults if ElevenLabs voice lookup fails', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('Unauthorized', { status: 401 }))

    const result = await fetchElevenLabsVoices({
      apiKey: 'bad_key',
      fetchImpl: fetchMock as unknown as typeof fetch,
    })

    expect(result.fallbackUsed).toBe(true)
    expect(result.voices).toEqual([...DEFAULT_ELEVENLABS_VOICES])
  })
})
