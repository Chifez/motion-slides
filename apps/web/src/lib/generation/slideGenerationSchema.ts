import { z } from 'zod'

// ── Grid position ─────────────────────────────────────────────────────────────
// 12 columns × 8 rows. The assembler converts to pixel coordinates.
const AIPosition = z.object({
  col:    z.number().int().min(0).max(24),
  row:    z.number().int().min(0).max(16),
  width:  z.number().int().min(1).max(24),
  height: z.number().int().min(1).max(16),
})

// ── Animation options ─────────────────────────────────────────────────────────
const AnimationType = z.enum(['fade-in', 'slide-up', 'slide-left', 'zoom-in', 'pop', 'draw', 'none'])

// ── Element schemas ───────────────────────────────────────────────────────────

const AITextElement = z.object({
  type:           z.literal('text'),
  id:             z.string().min(1),
  content:        z.string().min(1),
  role:           z.enum(['title', 'subtitle', 'heading', 'body', 'caption', 'label']),
  position:       AIPosition,
  style: z.object({
    fontSize:   z.enum(['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl']).nullable(),
    fontWeight: z.enum(['normal', 'medium', 'semibold', 'bold']).nullable(),
    color:      z.string().nullable(),
    align:      z.enum(['left', 'center', 'right']).nullable(),
  }).nullable(),
  animation:      AnimationType.nullable(),
  animationDelay: z.number().int().min(0).max(5000).nullable(),
})

const AIShapeElement = z.object({
  type:     z.literal('shape'),
  id:       z.string().min(1),
  shape:    z.enum(['rectangle', 'rounded-rectangle', 'circle', 'cylinder', 'diamond', 'hexagon', 'aws-icon']),
  label:    z.string().nullable(),
  sublabel: z.string().nullable(),
  iconPath: z.string().nullable(),
  position: AIPosition,
  style: z.object({
    backgroundColor: z.string().nullable(),
    borderColor:     z.string().nullable(),
    borderWidth:     z.number().nullable(),
    opacity:         z.number().min(0).max(1).nullable(),
  }).nullable(),
  animation:      AnimationType.nullable(),
  animationDelay: z.number().int().min(0).max(5000).nullable(),
})

const AICodeElement = z.object({
  type:           z.literal('code'),
  id:             z.string().min(1),
  code:           z.string().min(1),
  language:       z.string(),
  position:       AIPosition,
  animation:      AnimationType.nullable(),
  animationDelay: z.number().int().min(0).max(5000).nullable(),
})

const AILineElement = z.object({
  type:           z.literal('line'),
  id:             z.string().min(1),
  fromElementId:  z.string().min(1),
  toElementId:    z.string().min(1),
  fromHandle:     z.enum(['top', 'right', 'bottom', 'left', 'center']).nullable(),
  toHandle:       z.enum(['top', 'right', 'bottom', 'left', 'center']).nullable(),
  label:          z.string().nullable(),
  direction:      z.enum(['one-way', 'two-way', 'none']).nullable(),
  lineType:       z.enum(['straight', 'curved', 'elbow']).nullable(),
  lineStyle:      z.enum(['solid', 'dashed', 'dotted']).nullable(),
  animation:      AnimationType.nullable(),
  animationDelay: z.number().int().min(0).max(5000).nullable(),
})


const AIIconElement = z.object({
  type:           z.literal('icon'),
  id:             z.string().min(1),
  iconPath:       z.string().min(1),   // AI copies this from <available_icons>
  label:          z.string().nullable(),
  position:       AIPosition,
  animation:      AnimationType.nullable(),
  animationDelay: z.number().int().min(0).max(5000).nullable(),
})

const AIElement = z.discriminatedUnion('type', [
  AITextElement,
  AIShapeElement,
  AICodeElement,
  AILineElement,
  AIIconElement,
])

// ── Slide schema ──────────────────────────────────────────────────────────────

const AISlide = z.object({
  id:         z.string().min(1),
  title:      z.string().min(1),
  role:       z.enum(['title', 'content', 'diagram', 'code', 'summary', 'divider']),
  background: z.string().nullable(),
  elements:   z.array(AIElement).min(1),
  transition: z.object({
    type:     z.enum(['fade', 'slide', 'zoom', 'flip', 'morph', 'magic-move', 'none']),
    duration: z.number().min(0).max(5000).nullable(),
    easing:   z.enum(['easeInOut', 'easeOut', 'spring', 'linear']).nullable(),
  }).nullable(),
  speakerNotes: z.string().nullable(),
})

// ── Presentation schema ───────────────────────────────────────────────────────

export const GeneratedPresentationSchema = z.object({
  title:       z.string().min(1),
  description: z.string(),
  theme: z.object({
    primaryColor:    z.string(),
    secondaryColor:  z.string(),
    backgroundColor: z.string(),
    textColor:       z.string(),
    accentColor:     z.string(),
    fontFamily:      z.enum(['inter', 'mono', 'serif', 'display']),
  }),
  slides: z.array(AISlide).min(1).max(30),
})

export type GeneratedPresentation = z.infer<typeof GeneratedPresentationSchema>
export type AISlideType            = z.infer<typeof AISlide>
export type AIElementType          = z.infer<typeof AIElement>
