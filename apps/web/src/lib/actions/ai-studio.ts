'use server'

import axios from 'axios'
import { db } from '../db'
import { user } from '../db/schema'
import { eq } from 'drizzle-orm'
import { encrypt, decrypt } from '../encryption'
import { auth } from '../auth'
import { getRequest } from '@tanstack/react-start/server'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

/**
 * Action Interceptor Pattern:
 * 1. Authenticate user
 * 2. Check if user has custom keys (BYOK) -> If yes, use them.
 * 3. Check token quota -> If exceeded, throw error.
 * 4. Execute action.
 * 5. Deduct tokens from balance.
 */
async function interceptAIAction(actionFn: (keys: { openai: string; elevenlabs: string }) => Promise<any>, cost: number) {
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

  const decryptedOpenAIKey = userRecord.encryptedOpenAIKey ? decrypt(userRecord.encryptedOpenAIKey) : null
  const decryptedElevenLabsKey = userRecord.encryptedElevenLabsKey ? decrypt(userRecord.encryptedElevenLabsKey) : null

  const userHasCustomKey = !!decryptedOpenAIKey
  const userBalance = userRecord.tokenBalance ?? 0

  if (!userHasCustomKey && userBalance < cost) {
    throw new Error('Monthly quota exceeded. Please add your own API key in Settings.')
  }

  const keys = {
    openai: decryptedOpenAIKey || process.env.OPENAI_API_KEY || '',
    elevenlabs: decryptedElevenLabsKey || process.env.ELEVENLABS_API_KEY || '',
  }

  // Validate keys are resolvable before attempting the action and deducting quota.
  // An empty key would produce a confusing downstream API error.
  if (!keys.openai) {
    throw new Error('No OpenAI API key is configured. Please add one in Settings or contact support.')
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
  .handler(async ({ request }) => {
    const formData = await request.formData()
    return interceptAIAction(async (keys) => {
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
    text: z.string(),
    voiceId: z.string(),
    settings: z.any().optional(),
  }))
  .handler(async ({ data: { text, voiceId, settings } }) => {
    // TODO: Implement ElevenLabs voiceover integration.
    // The interceptAIAction wrapper (auth + quota deduction) is ready — plug in the real
    // ElevenLabs API call below when available. Do NOT use a placeholder here to avoid
    // charging quota for a no-op.
    throw new Error('Voiceover generation is not yet available. Please check back soon.')
  })

export const updateAPIKeysAction = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    openAIKey: z.string(),
    elevenLabsKey: z.string(),
  }))
  .handler(async ({ data: { openAIKey, elevenLabsKey } }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      throw new Error('Unauthorized: You must be logged in to update settings.')
    }

    const encryptedOpenAIKey = openAIKey ? encrypt(openAIKey) : null
    const encryptedElevenLabsKey = elevenLabsKey ? encrypt(elevenLabsKey) : null

    await db.update(user)
      .set({
        encryptedOpenAIKey,
        encryptedElevenLabsKey,
      })
      .where(eq(user.id, session.user.id))

    return { success: true }
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

    return {
      tokenQuota: userRecord.tokenQuota,
      tokenBalance: userRecord.tokenBalance,
    }
  })
