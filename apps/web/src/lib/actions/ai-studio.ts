'use server'

import axios from 'axios'
import { db } from '../db'
import { user } from '../db/schema'
import { eq } from 'drizzle-orm'
import { decryptWithMetadata, encrypt } from '../encryption'
import { auth } from '../auth'
import { getRequest } from '@tanstack/react-start/server'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getStorageProvider } from '../storage'

/**
 * Action Interceptor Pattern:
 * 1. Authenticate user
 * 2. Check if user has custom keys (BYOK) -> If yes, use them.
 * 3. Check token quota -> If exceeded, throw error.
 * 4. Execute action.
 * 5. Deduct tokens from balance.
 */
type AIProvider = 'openai' | 'elevenlabs'

interface ResolvedAIKeys {
  openai: string
  anthropic: string
  elevenlabs: string
  hasOpenAIKey: boolean
  hasAnthropicKey: boolean
  hasElevenLabsKey: boolean
}

async function resolveAndMigrateKeys(userRecord: typeof user.$inferSelect): Promise<ResolvedAIKeys> {
  const columns = [
    ['encryptedOpenAIKey', 'openai'] as const,
    ['encryptedAnthropicKey', 'anthropic'] as const,
    ['encryptedElevenLabsKey', 'elevenlabs'] as const,
  ]
  const updates: Partial<Record<'encryptedOpenAIKey' | 'encryptedAnthropicKey' | 'encryptedElevenLabsKey', string>> = {}
  const values: Partial<Record<'openai' | 'anthropic' | 'elevenlabs', string>> = {}

  for (const [column, name] of columns) {
    const stored = userRecord[column]
    if (!stored) continue
    const decrypted = decryptWithMetadata(stored)
    values[name] = decrypted.plaintext
    if (decrypted.needsMigration) updates[column] = encrypt(decrypted.plaintext)
  }

  if (Object.keys(updates).length > 0) {
    await db.update(user).set(updates).where(eq(user.id, userRecord.id))
  }

  return {
    openai: values.openai || process.env.OPENAI_API_KEY || '',
    anthropic: values.anthropic || process.env.ANTHROPIC_API_KEY || '',
    elevenlabs: values.elevenlabs || process.env.ELEVENLABS_API_KEY || '',
    hasOpenAIKey: Boolean(values.openai),
    hasAnthropicKey: Boolean(values.anthropic),
    hasElevenLabsKey: Boolean(values.elevenlabs),
  }
}

async function interceptAIAction<T>(
  provider: AIProvider,
  actionFn: (keys: ResolvedAIKeys) => Promise<T>,
  cost: number,
): Promise<T> {
  const request = getRequest()
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) {
    throw new Error('Unauthorized: You must be logged in to use AI features.')
  }

  const userId = session.user.id
  const userRecord = await db.query.user.findFirst({
    where: eq(user.id, userId),
  })

  if (!userRecord) {
    throw new Error('User account not found.')
  }

  const keys = await resolveAndMigrateKeys(userRecord)
  const userHasCustomKey = provider === 'openai' ? keys.hasOpenAIKey : keys.hasElevenLabsKey
  const envQuota = process.env.DEFAULT_TOKEN_QUOTA ? Number(process.env.DEFAULT_TOKEN_QUOTA) : 100000
  const userBalance = userRecord.tokenBalance ?? envQuota

  if (!userHasCustomKey && userBalance < cost) {
    throw new Error('Monthly quota exceeded. Please add your own API key in Settings.')
  }

  const key = keys[provider]
  if (!key) {
    const providerName = provider === 'openai' ? 'OpenAI' : 'ElevenLabs'
    throw new Error(`No ${providerName} API key is configured. Please add one in Settings or contact support.`)
  }

  const result = await actionFn(keys)

  // Only deduct tokens if the user didn't provide their own custom API key
  if (!userHasCustomKey) {
    await db.update(user)
      .set({ tokenBalance: Math.max(0, userBalance - cost) })
      .where(eq(user.id, userId))
  }

  return result
}

export const transcribeAudioAction = createServerFn({ method: 'POST' })
  .inputValidator(z.instanceof(FormData))
  .handler(async ({ data }: { data: FormData }) => {
    const formData = data
    return interceptAIAction('openai', async (keys) => {
      const file = formData.get('audio') as File
      if (!file) throw new Error('No audio file provided')

      try {
        const apiFormData = new FormData();
        apiFormData.append('file', file);
        apiFormData.append('model', 'whisper-1');

        const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', apiFormData, {
          headers: {
            Authorization: `Bearer ${keys.openai}`,
          },
        });

        return { text: response.data.text };
      } catch (error) {
        console.error('Failed to transcribe audio:', error)
        throw new Error('Failed to transcribe audio')
      }
    }, 100) // cost
  })

export const generateVoiceoverAction = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    text: z.string().trim().min(1).max(5_000),
    voiceId: z.string().trim().min(1).max(128),
    settings: z.object({
      stability: z.number().min(0).max(1).optional(),
      similarity_boost: z.number().min(0).max(1).optional(),
      style: z.number().min(0).max(1).optional(),
      use_speaker_boost: z.boolean().optional(),
    }).optional(),
  }))
  .handler(async ({ data: { text, voiceId, settings } }) => {
    // Shared-account usage is metered approximately by input tokens. A user's own
    // ElevenLabs key bypasses MotionSlides quota and is billed by ElevenLabs directly.
    const cost = Math.max(100, Math.ceil(text.length / 4))
    return interceptAIAction('elevenlabs', async (keys) => {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': keys.elevenlabs,
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
        throw new Error(response.status === 429
          ? 'ElevenLabs is busy. Please try again in a moment.'
          : 'ElevenLabs could not generate this voiceover. Check your key, voice, and available credits.')
      }

      const audio = new Uint8Array(await response.arrayBuffer())
      if (audio.byteLength === 0) throw new Error('ElevenLabs returned an empty audio file.')

      const storage = getStorageProvider(getRequest())
      const { url, key } = await storage.uploadFile(audio, `voiceover-${crypto.randomUUID()}.mp3`, 'audio/mpeg')
      return {
        audioUrl: url,
        storageKey: key,
        // The client reads exact metadata before saving. This is a safe fallback
        // for browsers that cannot parse an audio duration.
        durationEstimate: Math.max(1, Math.round(text.trim().split(/\s+/).length / 2.5)),
      }
    }, cost)
  })

export const updateAPIKeysAction = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    openAIKey: z.string().trim().min(1).optional(),
    anthropicKey: z.string().trim().min(1).optional(),
    elevenLabsKey: z.string().trim().min(1).optional(),
    removeProviders: z.array(z.enum(['openai', 'anthropic', 'elevenlabs'])).default([]),
  }))
  .handler(async ({ data: { openAIKey, anthropicKey, elevenLabsKey, removeProviders } }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      throw new Error('Unauthorized: You must be logged in to update settings.')
    }

    const updates: Record<string, string | null> = {}

    if (openAIKey !== undefined) {
      updates.encryptedOpenAIKey = encrypt(openAIKey)
    }
    if (anthropicKey !== undefined) {
      updates.encryptedAnthropicKey = encrypt(anthropicKey)
    }
    if (elevenLabsKey !== undefined) {
      updates.encryptedElevenLabsKey = encrypt(elevenLabsKey)
    }
    for (const provider of removeProviders) {
      if (provider === 'openai') updates.encryptedOpenAIKey = null
      if (provider === 'anthropic') updates.encryptedAnthropicKey = null
      if (provider === 'elevenlabs') updates.encryptedElevenLabsKey = null
    }

    if (Object.keys(updates).length > 0) {
      await db.update(user)
        .set(updates)
        .where(eq(user.id, session.user.id))
    }

    return { success: true }
  })

export const getUserKeysStatusAction = createServerFn({ method: 'GET' })
  .handler(async () => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return { hasOpenAI: false, hasAnthropic: false, hasElevenLabs: false }
    }

    const userRecord = await db.query.user.findFirst({
      where: eq(user.id, session.user.id),
    })

    if (userRecord) await resolveAndMigrateKeys(userRecord)

    return {
      hasOpenAI: !!userRecord?.encryptedOpenAIKey,
      hasAnthropic: !!userRecord?.encryptedAnthropicKey,
      hasElevenLabs: !!userRecord?.encryptedElevenLabsKey,
    }
  })

export const getUserQuotaAction = createServerFn({ method: 'GET' })
  .handler(async () => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      throw new Error('Unauthorized')
    }

    const userRecord = await db.query.user.findFirst({
      where: eq(user.id, session.user.id),
    })

    if (!userRecord) {
      throw new Error('User not found')
    }

    const envQuota = process.env.DEFAULT_TOKEN_QUOTA ? Number(process.env.DEFAULT_TOKEN_QUOTA) : null
    const tokenQuota = envQuota ?? userRecord.tokenQuota ?? 100000

    return {
      tokenQuota,
      tokenBalance: userRecord.tokenBalance ?? tokenQuota,
    }
  })
