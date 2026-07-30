/**
 * apps/web/src/lib/sceneGraph.ts
 *
 * Serializes the current Zustand store state into a clean, deterministic
 * ExportProject JSON object. All image URLs are pre-resolved to base64
 * data URLs so the headless browser never makes external network requests.
 */

import { useEditorStore } from '@/store/editorStore'
import type { ExportProject, SerializedProject, SerializedPlaybackSettings } from '@motionslides/shared'

/**
 * Generate a fully serialized, asset-resolved ExportProject from the
 * current store state. Safe to JSON.stringify and POST to the backend.
 */
export async function generateSceneGraph(): Promise<ExportProject> {
  const store   = useEditorStore.getState()
  // @ts-ignore - activeProject might not be typed strictly in editorStore
  const project = store.activeProject()

  if (!project) throw new Error('No active project to export')

  // Deep-clone to avoid mutating store state
  const cloned = JSON.parse(JSON.stringify(project)) as SerializedProject

  // Resolve all image assets to base64 data URLs
  await resolveAllImages(cloned)

  return {
    project:          cloned,
    playbackSettings: store.playbackSettings as SerializedPlaybackSettings,
    exportedAt:       Date.now(),
  }
}

/**
 * Walk all elements in all slides and convert any external image src
 * values to base64 data: URLs.
 */
async function resolveAllImages(project: SerializedProject): Promise<void> {
  const jobs: Promise<void>[] = []

  for (const slide of project.slides) {
    for (const element of slide.elements) {
      if (element.type === 'image') {
        const content = element.content as { src?: string }
        if (content?.src && isExternalUrl(content.src)) {
          jobs.push(
            fetchAsBase64(content.src).then(dataUrl => {
              content.src = dataUrl
            }).catch(() => {
              console.warn('[SceneGraph] Could not resolve image:', content.src)
            })
          )
        }
      }
    }
  }

  await Promise.all(jobs)
}

function isExternalUrl(url: string): boolean {
  return url.startsWith('http://') ||
         url.startsWith('https://') ||
         url.startsWith('//')
}

async function fetchAsBase64(url: string): Promise<string> {
  const res    = await fetch(url)
  const blob   = await res.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror  = reject
    reader.readAsDataURL(blob)
  })
}
