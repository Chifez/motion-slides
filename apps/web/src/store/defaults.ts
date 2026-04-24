import { type Slide } from '@motionslides/shared'
import { nanoid } from '@/lib/nanoid'
import { CANVAS_BG } from '@/constants/export'

/** Creates an empty slide with optional overrides */
export function createDefaultSlide(overrides?: Partial<Slide>): Slide {
  return {
    id: nanoid(),
    name: '',
    elements: [],
    background: CANVAS_BG,
    ...overrides,
  }
}

/** Creates a seeded demo project with two slides */
export function createDefaultProject(name = 'Untitled Deck') {
  const slide1 = createDefaultSlide({
    name: 'Slide 1',
    elements: [
      {
        id: 'el-title', type: 'text',
        position: { x: 80, y: 80 }, size: { width: 640, height: 80 },
        rotation: 0, opacity: 1, zIndex: 1,
        content: { value: 'My First Slide', fontSize: 48, fontWeight: 'bold', fontFamily: 'Inter', fontStyle: 'normal', color: '#ffffff', align: 'left' },
      },
      {
        id: 'el-code', type: 'code',
        position: { x: 80, y: 200 }, size: { width: 640, height: 120 },
        rotation: 0, opacity: 1, zIndex: 1,
        content: { value: `const greet = () => {\n}`, language: 'javascript' },
      },
    ],
  })

  const slide2 = createDefaultSlide({
    name: 'Slide 2',
    elements: [
      {
        id: 'el-title2', type: 'text',
        position: { x: 80, y: 40 }, size: { width: 640, height: 80 },
        rotation: 0, opacity: 1, zIndex: 1,
        content: { value: 'My First Slide', fontSize: 48, fontWeight: 'bold', fontFamily: 'Inter', fontStyle: 'normal', color: '#ffffff', align: 'left' },
      },
      {
        id: 'el-code2', type: 'code',
        position: { x: 80, y: 160 }, size: { width: 640, height: 160 },
        rotation: 0, opacity: 1, zIndex: 1,
        content: { value: `const greet = () => {\n  console.log('Hello, World!')\n  return true\n}`, language: 'javascript' },
      },
    ],
  })

  return {
    id: nanoid(),
    name,
    description: '',
    slides: [slide1, slide2],
    transitions: [],
    prototypeLayout: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
    synced: false,
  }
}
