import { get, set } from 'idb-keyval'

export interface UserDeckPreferences {
  userId: string
  preferredTheme: string | null
  preferredDensity: 'compact' | 'standard' | 'rich' | null
  preferredAnimationStyle: 'minimal' | 'rich' | null
  brandColors: string[]
  audienceTypes: string[]
  acceptedThemesCount: Record<string, number>
  totalEvaluatedDecks: number
  avgAcceptedScore: number
  commonPresentationTypes: string[]
  updatedAt: number
}

const STORAGE_KEY = 'ms_user_deck_preferences'

const DEFAULT_PREFERENCES: UserDeckPreferences = {
  userId: 'local-user',
  preferredTheme: 'midnight-indigo',
  preferredDensity: 'standard',
  preferredAnimationStyle: 'rich',
  brandColors: ['#3b82f6', '#60a5fa', '#93c5fd'],
  audienceTypes: ['technical', 'architect'],
  acceptedThemesCount: { 'midnight-indigo': 1 },
  totalEvaluatedDecks: 0,
  avgAcceptedScore: 90,
  commonPresentationTypes: ['Architecture Overview', 'System Design'],
  updatedAt: Date.now(),
}

/**
 * Load user preferences from IndexedDB
 */
export async function getUserPreferences(userId = 'local-user'): Promise<UserDeckPreferences> {
  try {
    const data = await get<UserDeckPreferences>(`${STORAGE_KEY}_${userId}`)
    return data || DEFAULT_PREFERENCES
  } catch (err) {
    console.error('[UserPreferences] Failed to load preferences:', err)
    return DEFAULT_PREFERENCES
  }
}

/**
 * Save user preferences to IndexedDB
 */
export async function saveUserPreferences(prefs: UserDeckPreferences): Promise<void> {
  try {
    const updated = { ...prefs, updatedAt: Date.now() }
    await set(`${STORAGE_KEY}_${prefs.userId}`, updated)
  } catch (err) {
    console.error('[UserPreferences] Failed to save preferences:', err)
  }
}

/**
 * Record preference signal when a user accepts or generates a deck with a theme
 */
export async function recordAcceptedTheme(themeName: string, score: number, userId = 'local-user'): Promise<void> {
  const prefs = await getUserPreferences(userId)
  const count = (prefs.acceptedThemesCount[themeName] || 0) + 1
  const nextCounts = { ...prefs.acceptedThemesCount, [themeName]: count }

  // Derive most frequently used theme
  let topTheme = prefs.preferredTheme
  let maxCount = 0
  for (const [t, c] of Object.entries(nextCounts)) {
    if (c > maxCount) {
      maxCount = c
      topTheme = t
    }
  }

  const nextTotal = prefs.totalEvaluatedDecks + 1
  const nextAvg = Math.round((prefs.avgAcceptedScore * prefs.totalEvaluatedDecks + score) / nextTotal)

  await saveUserPreferences({
    ...prefs,
    preferredTheme: topTheme,
    acceptedThemesCount: nextCounts,
    totalEvaluatedDecks: nextTotal,
    avgAcceptedScore: nextAvg,
  })
}

/**
 * Formats user preferences into a system prompt addendum
 */
export async function buildPreferencePromptAddendum(userId = 'local-user'): Promise<string> {
  const prefs = await getUserPreferences(userId)
  if (!prefs.preferredTheme && prefs.brandColors.length === 0) return ''

  return `
## User Personalization Memory (Active Profile)
- Preferred Color Theme: ${prefs.preferredTheme || 'midnight-indigo'}
- Layout Density: ${prefs.preferredDensity || 'standard'}
- Preferred Brand Colors: ${prefs.brandColors.join(', ')}
- Target Audience: ${prefs.audienceTypes.join(', ')}
- High Acceptance Quality Score: >= ${prefs.avgAcceptedScore}/100
`.trim()
}
