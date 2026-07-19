import type { SceneElement } from '@motionslides/shared'

export function computeElementDiffStatus(
  current: SceneElement,
  original: SceneElement | undefined
): 'added' | 'modified' | null {
  if (!original) {
    return 'added'
  }

  const isChanged =
    current.position.x !== original.position.x ||
    current.position.y !== original.position.y ||
    current.size.width !== original.size.width ||
    current.size.height !== original.size.height ||
    current.rotation !== original.rotation ||
    JSON.stringify(current.content) !== JSON.stringify(original.content) ||
    current.opacity !== original.opacity ||
    current.zIndex !== original.zIndex

  return isChanged ? 'modified' : null
}
