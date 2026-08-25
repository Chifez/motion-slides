import { get, set, del } from 'idb-keyval'
import type { DeckEvaluationReport } from './evaluation-types'

const getStorageKey = (projectId: string) => `ms_deck_evaluations_${projectId}`
const MAX_HISTORY_PER_PROJECT = 50

/**
 * Load all evaluation reports for a project from IndexedDB (sorted by timestamp desc)
 */
export async function getEvaluationHistory(projectId: string): Promise<DeckEvaluationReport[]> {
  try {
    const data = await get<DeckEvaluationReport[]>(getStorageKey(projectId))
    if (!data || !Array.isArray(data)) return []
    return data.sort((a, b) => b.timestamp - a.timestamp)
  } catch (err) {
    console.error('[EvaluationHistory] Failed to load history:', err)
    return []
  }
}

/**
 * Get the latest evaluation report for a project
 */
export async function getLatestEvaluationReport(projectId: string): Promise<DeckEvaluationReport | null> {
  const history = await getEvaluationHistory(projectId)
  return history[0] || null
}

/**
 * Save an evaluation report to IndexedDB (enforcing max 50 items ring buffer)
 */
export async function saveEvaluationReport(projectId: string, report: DeckEvaluationReport): Promise<void> {
  try {
    const history = await getEvaluationHistory(projectId)
    const existingIndex = history.findIndex((r) => r.runId === report.runId)

    let nextHistory: DeckEvaluationReport[]
    if (existingIndex >= 0) {
      nextHistory = [...history]
      nextHistory[existingIndex] = report
    } else {
      nextHistory = [report, ...history]
    }

    if (nextHistory.length > MAX_HISTORY_PER_PROJECT) {
      nextHistory = nextHistory.slice(0, MAX_HISTORY_PER_PROJECT)
    }

    await set(getStorageKey(projectId), nextHistory)
  } catch (err) {
    console.error('[EvaluationHistory] Failed to save report:', err)
  }
}

/**
 * Clear evaluation history for a project
 */
export async function clearEvaluationHistory(projectId: string): Promise<void> {
  try {
    await del(getStorageKey(projectId))
  } catch (err) {
    console.error('[EvaluationHistory] Failed to clear history:', err)
  }
}
