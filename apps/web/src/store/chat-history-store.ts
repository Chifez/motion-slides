import { get, set, del } from 'idb-keyval'
import type { UIMessage } from '@ai-sdk/react'
import { uuid } from '@/lib/uuid'

export interface ChatThread {
  id: string
  projectId: string
  title: string
  createdAt: number
  updatedAt: number
  messages: UIMessage[]
  messageSnapshotMap: Record<string, string>
}

const getStorageKey = (projectId: string) => `ms_chat_threads_${projectId}`

/**
 * Load all threads for a specific project from IndexedDB
 */
export async function getProjectThreads(projectId: string): Promise<ChatThread[]> {
  try {
    const data = await get<ChatThread[]>(getStorageKey(projectId))
    if (!data || !Array.isArray(data)) return []
    return data.sort((a, b) => b.updatedAt - a.updatedAt)
  } catch (err) {
    console.error('[ChatHistory] Failed to load threads:', err)
    return []
  }
}

/**
 * Load a single thread by ID
 */
export async function getThread(projectId: string, threadId: string): Promise<ChatThread | null> {
  const threads = await getProjectThreads(projectId)
  return threads.find((t) => t.id === threadId) ?? null
}

/**
 * Save or update a thread in IndexedDB
 */
export async function saveThread(thread: ChatThread): Promise<void> {
  try {
    const threads = await getProjectThreads(thread.projectId)
    const existingIndex = threads.findIndex((t) => t.id === thread.id)
    
    const updatedThread: ChatThread = {
      ...thread,
      updatedAt: Date.now(),
    }

    let nextThreads: ChatThread[]
    if (existingIndex >= 0) {
      nextThreads = [...threads]
      nextThreads[existingIndex] = updatedThread
    } else {
      nextThreads = [updatedThread, ...threads]
    }

    await set(getStorageKey(thread.projectId), nextThreads)
  } catch (err) {
    console.error('[ChatHistory] Failed to save thread:', err)
  }
}

/**
 * Delete a thread by ID
 */
export async function deleteThread(projectId: string, threadId: string): Promise<void> {
  try {
    const threads = await getProjectThreads(projectId)
    const nextThreads = threads.filter((t) => t.id !== threadId)
    await set(getStorageKey(projectId), nextThreads)
  } catch (err) {
    console.error('[ChatHistory] Failed to delete thread:', err)
  }
}

/**
 * Generate a smart title from user prompt (up to 40 chars)
 */
export function generateSmartTitle(prompt: string): string {
  const cleaned = prompt.replace(/[^\w\s-]/g, '').trim()
  if (!cleaned) return 'New Conversation'
  const firstLine = cleaned.split('\n')[0].trim()
  if (firstLine.length <= 36) return firstLine
  return firstLine.substring(0, 36) + '…'
}

/**
 * Create a new thread for a project
 */
export async function createNewThread(projectId: string, title = 'New Conversation'): Promise<ChatThread> {
  const newThread: ChatThread = {
    id: uuid(),
    projectId,
    title,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
    messageSnapshotMap: {},
  }
  await saveThread(newThread)
  return newThread
}
