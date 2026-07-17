'use server'

import axios from 'axios'
// import { db } from '../db'
// import { encrypt, decrypt } from '../encryption'

/**
 * Action Interceptor Pattern:
 * 1. Authenticate user
 * 2. Check if user has custom keys (BYOK) -> If yes, use them.
 * 3. Check token quota -> If exceeded, throw error.
 * 4. Execute action.
 * 5. Deduct tokens from balance.
 */
async function interceptAIAction(actionFn: (keys: any) => Promise<any>, cost: number) {
  // Mocked interceptor logic
  const userHasCustomKey = false
  const userBalance = 50000

  if (!userHasCustomKey && userBalance < cost) {
    throw new Error('Monthly quota exceeded. Please add your own API key in Settings.')
  }

  const keys = {
    openai: process.env.OPENAI_API_KEY,
    elevenlabs: process.env.ELEVENLABS_API_KEY
  }

  const result = await actionFn(keys)

  // db.update(user).set({ tokenBalance: userBalance - cost })
  return result
}

export async function transcribeAudioAction(formData: FormData) {
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
}

export async function generateVoiceoverAction(text: string, voiceId: string, settings?: any) {
  return interceptAIAction(async (keys) => {
    // In a real implementation we'd use keys.elevenlabs to call the API
    return { audioUrl: '/placeholder-audio.mp3' }
  }, text.length * 2) // cost
}

export async function updateAPIKeysAction(keys: { openAIKey: string, elevenLabsKey: string }) {
  // const encryptedOpenAIKey = encrypt(keys.openAIKey)
  // const encryptedElevenLabsKey = encrypt(keys.elevenLabsKey)
  // await db.update(user).set({ encryptedOpenAIKey, encryptedElevenLabsKey }).where(...)
  return { success: true }
}

export async function getUserQuotaAction() {
  // const data = await db.query.user.findFirst(...)
  return { tokenQuota: 100000, tokenBalance: 50000 }
}
