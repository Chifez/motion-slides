import { type Slide, type Project } from '@motionslides/shared'
import { uuid } from '@/lib/uuid'
import { CANVAS_BG } from '@/constants/export'

/** Creates an empty slide with optional overrides */
export function createDefaultSlide(overrides?: Partial<Slide>): Slide {
  return {
    id: uuid(),
    name: '',
    elements: [],
    background: CANVAS_BG,
    ...overrides,
  }
}

/** Creates a seeded demo project with two slides */
export function createDefaultProject(name = 'Untitled Deck', isFirst = false, ownerId?: string, localAuthorId?: string): Project {
  const common = {
    name,
    description: isFirst ? 'A sample project demonstrating Magic Move.' : '',
    prototypeLayout: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
    synced: false,
    shareKey: uuid(),
    visibility: 'private' as const,
    ownerId,
    localAuthorId,
  }

  if (!isFirst) {
    const blankSlide = createDefaultSlide({ name: 'Slide 1' })
    return {
      ...common,
      id: uuid(),
      slides: [blankSlide],
      transitions: [],
    }
  }

  const slide1 = createDefaultSlide({
    name: 'Introduction',
    elements: [
      {
        id: 'demo-title', type: 'text',
        position: { x: 80, y: 310 }, size: { width: 575, height: 100 },
        rotation: 0, opacity: 1, zIndex: 10,
        content: { value: 'Welcome to MotionSlides', fontSize: 48, fontWeight: 'bold', fontFamily: 'Outfit', fontStyle: 'normal', color: '#ffffff', align: 'center' },
      },
    ],
  })

  const slide2 = createDefaultSlide({
    name: 'Magic Move Demo',
    elements: [
      {
        id: 'demo-title', type: 'text',
        position: { x: 80, y: 310 }, size: { width: 575, height: 100 },
        rotation: 0, opacity: 1, zIndex: 10,
        content: { value: 'Welcome to MotionSlides', fontSize: 48, fontWeight: 'bold', fontFamily: 'Outfit', fontStyle: 'normal', color: '#ffffff', align: 'center' },
      },
      {
        id: 'demo-subtitle', type: 'text',
        position: { x: 160, y: 404 }, size: { width: 400, height: 70 },
        rotation: 0, opacity: 1, zIndex: 10,
        content: { value: 'High-fidelity presentations with Magic Move', fontSize: 24, fontWeight: 'medium', fontFamily: 'Inter', fontStyle: 'normal', color: '#888888', align: 'center' },
      },
    ],
  })

  const transition: any = {
    id: uuid(),
    fromSlideId: slide1.id,
    toSlideId: slide2.id,
    animation: 'magic-move',
    duration: 800,
    ease: { x1: 0.25, y1: 0.1, x2: 0.25, y2: 1 },
    trigger: 'click'
  }

  return {
    ...common,
    id: uuid(),
    slides: [slide1, slide2],
    transitions: [transition],
  }
}

