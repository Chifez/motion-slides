import {
  DEFAULT_ELEVENLABS_VOICES,
  isCloudflareVoiceId,
  type VoiceOption,
} from './voiceover-catalog'

export interface CloudflareAIBinding {
  run(
    model: string,
    inputs: Record<string, unknown>,
    options?: { returnRawResponse?: boolean },
  ): Promise<unknown>
}

type CloudflareRequest = Request & {
  runtime?: { cloudflare?: { env?: Record<string, unknown> } }
}

interface ElevenLabsVoiceSettings {
  stability?: number
  similarity_boost?: number
  style?: number
  use_speaker_boost?: boolean
}

interface ElevenLabsVoicePayload {
  voice_id?: string
  name?: string
  category?: string
  labels?: {
    accent?: string
    gender?: string
    description?: string
  }
}

export function getCloudflareAIBinding(request?: Request): CloudflareAIBinding | null {
  const requestEnv = (request as CloudflareRequest | undefined)?.runtime?.cloudflare?.env
  const globalEnv = (globalThis as typeof globalThis & { __env__?: Record<string, unknown> }).__env__
  const ai = (requestEnv ?? globalEnv)?.AI

  if (!ai || typeof (ai as CloudflareAIBinding).run !== 'function') {
    return null
  }
  return ai as CloudflareAIBinding
}

async function toAudioBytes(raw: unknown): Promise<Uint8Array> {
  if (raw instanceof Response) {
    if (!raw.ok) {
      const detail = (await raw.text()).slice(0, 300)
      throw new Error(`Cloudflare AI voiceover failed (${raw.status}): ${detail || raw.statusText}`)
    }
    return new Uint8Array(await raw.arrayBuffer())
  }
  if (raw instanceof Uint8Array) {
    return raw
  }
  if (raw instanceof ArrayBuffer) {
    return new Uint8Array(raw)
  }
  if (ArrayBuffer.isView(raw)) {
    return new Uint8Array(raw.buffer, raw.byteOffset, raw.byteLength)
  }
  if (typeof ReadableStream !== 'undefined' && raw instanceof ReadableStream) {
    return new Uint8Array(await new Response(raw).arrayBuffer())
  }
  throw new Error('Unexpected response format returned by Cloudflare Workers AI.')
}

export async function synthesizeCloudflareVoiceover({
  text,
  voiceId,
  request,
  fetchImpl = fetch,
}: {
  text: string
  voiceId: string
  request?: Request
  fetchImpl?: typeof fetch
}): Promise<Uint8Array> {
  if (!isCloudflareVoiceId(voiceId)) {
    throw new Error('Unsupported Cloudflare voice selected.')
  }

  const binding = getCloudflareAIBinding(request)
  if (binding) {
    const raw = await binding.run(
      '@cf/deepgram/aura-1',
      { text, speaker: voiceId, encoding: 'mp3' },
      { returnRawResponse: true },
    )
    const audio = await toAudioBytes(raw)
    if (audio.byteLength === 0) {
      throw new Error('Cloudflare Workers AI returned an empty audio file.')
    }
    return audio
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim()
  const token = process.env.CLOUDFLARE_AI_TOKEN?.trim()
  if (!accountId || !token) {
    throw new Error(
      'Cloudflare Workers AI is not available in this environment. Deploy with the AI binding or set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_AI_TOKEN.',
    )
  }

  const response = await fetchImpl(
    `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/run/@cf/deepgram/aura-1`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, speaker: voiceId, encoding: 'mp3' }),
    },
  )

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300)
    console.error(`[Cloudflare AI] Voice generation failed (${response.status}): ${detail}`)
    throw new Error('Cloudflare Workers AI could not generate this voiceover. Please try again.')
  }

  const audio = new Uint8Array(await response.arrayBuffer())
  if (audio.byteLength === 0) {
    throw new Error('Cloudflare Workers AI returned an empty audio file.')
  }
  return audio
}

export async function synthesizeElevenLabsVoiceover({
  text,
  voiceId,
  apiKey,
  settings,
  fetchImpl = fetch,
}: {
  text: string
  voiceId: string
  apiKey: string
  settings?: ElevenLabsVoiceSettings
  fetchImpl?: typeof fetch
}): Promise<Uint8Array> {
  const response = await fetchImpl(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        ...(settings && Object.keys(settings).length > 0 ? { voice_settings: settings } : {}),
      }),
    },
  )

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300)
    console.error(`[ElevenLabs] Voice generation failed (${response.status}): ${detail}`)
    throw new Error(
      response.status === 429
        ? 'ElevenLabs is busy. Please try again in a moment.'
        : 'ElevenLabs could not generate this voiceover. Check your key, voice, and available credits.',
    )
  }

  const audio = new Uint8Array(await response.arrayBuffer())
  if (audio.byteLength === 0) {
    throw new Error('ElevenLabs returned an empty audio file.')
  }
  return audio
}

function formatVoiceDescription(voice: ElevenLabsVoicePayload): string {
  const parts = [
    voice.labels?.gender,
    voice.labels?.accent,
    voice.labels?.description,
  ]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))

  if (parts.length > 0) {
    return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' · ')
  }
  if (voice.category && voice.category !== 'premade') {
    return voice.category.charAt(0).toUpperCase() + voice.category.slice(1)
  }
  return 'ElevenLabs'
}

export async function fetchElevenLabsVoices({
  apiKey,
  fetchImpl = fetch,
}: {
  apiKey: string
  fetchImpl?: typeof fetch
}): Promise<{ voices: VoiceOption[]; fallbackUsed: boolean }> {
  try {
    const response = await fetchImpl('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
      },
    })

    if (!response.ok) {
      return { voices: [...DEFAULT_ELEVENLABS_VOICES], fallbackUsed: true }
    }

    const payload = (await response.json()) as { voices?: ElevenLabsVoicePayload[] }
    const rawVoices = Array.isArray(payload?.voices) ? payload.voices : []

    const mapped: VoiceOption[] = rawVoices
      .filter((v): v is ElevenLabsVoicePayload & { voice_id: string; name: string } =>
        Boolean(v.voice_id && v.name),
      )
      .map((v) => ({
        id: v.voice_id,
        name: v.name,
        description: formatVoiceDescription(v),
        provider: 'elevenlabs' as const,
        ...(v.category ? { category: v.category } : {}),
      }))

    if (mapped.length === 0) {
      return { voices: [...DEFAULT_ELEVENLABS_VOICES], fallbackUsed: true }
    }

    const customCategories = new Set(['cloned', 'generated', 'professional'])
    mapped.sort((a, b) => {
      const aCustom = customCategories.has(a.category ?? '') ? 0 : 1
      const bCustom = customCategories.has(b.category ?? '') ? 0 : 1
      if (aCustom !== bCustom) return aCustom - bCustom
      return a.name.localeCompare(b.name)
    })

    return { voices: mapped, fallbackUsed: false }
  } catch {
    return { voices: [...DEFAULT_ELEVENLABS_VOICES], fallbackUsed: true }
  }
}
