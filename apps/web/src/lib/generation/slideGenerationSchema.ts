import { z } from 'zod'

// ── Grid position ─────────────────────────────────────────────────────────────
// 12 columns × 8 rows. The assembler converts to pixel coordinates.
const AIPosition = z.object({
  col:    z.number().int().min(0).max(11),
  row:    z.number().int().min(0).max(7),
  width:  z.number().int().min(1).max(12),
  height: z.number().int().min(1).max(8),
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
    fontSize:   z.enum(['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl']).optional(),
    fontWeight: z.enum(['normal', 'medium', 'semibold', 'bold']).optional(),
    color:      z.string().optional(),
    align:      z.enum(['left', 'center', 'right']).optional(),
  }).optional(),
  animation:      AnimationType.optional(),
  animationDelay: z.number().int().min(0).max(5000).optional(),
})

const AIShapeElement = z.object({
  type:     z.literal('shape'),
  id:       z.string().min(1),
  shape:    z.enum(['rectangle', 'rounded-rectangle', 'circle', 'cylinder', 'diamond', 'hexagon', 'aws-icon']),
  label:    z.string().optional(),
  sublabel: z.string().optional(),
  iconPath: z.string().optional(),
  position: AIPosition,
  style: z.object({
    backgroundColor: z.string().optional(),
    borderColor:     z.string().optional(),
    borderWidth:     z.number().optional(),
    opacity:         z.number().min(0).max(1).optional(),
  }).optional(),
  animation:      AnimationType.optional(),
  animationDelay: z.number().int().min(0).max(5000).optional(),
})

const AICodeElement = z.object({
  type:           z.literal('code'),
  id:             z.string().min(1),
  code:           z.string().min(1),
  language:       z.string(),
  position:       AIPosition,
  animation:      AnimationType.optional(),
  animationDelay: z.number().int().min(0).max(5000).optional(),
})

const AILineElement = z.object({
  type:           z.literal('line'),
  id:             z.string().min(1),
  fromElementId:  z.string().min(1),
  toElementId:    z.string().min(1),
  label:          z.string().optional(),
  direction:      z.enum(['one-way', 'two-way', 'none']).optional(),
  lineStyle:      z.enum(['solid', 'dashed', 'dotted']).optional(),
  animation:      AnimationType.optional(),
  animationDelay: z.number().int().min(0).max(5000).optional(),
})

const AIElement = z.discriminatedUnion('type', [
  AITextElement,
  AIShapeElement,
  AICodeElement,
  AILineElement,
])

// ── Slide schema ──────────────────────────────────────────────────────────────

const AISlide = z.object({
  id:         z.string().min(1),
  title:      z.string().min(1),
  role:       z.enum(['title', 'content', 'diagram', 'code', 'summary', 'divider']),
  background: z.string().optional(),
  elements:   z.array(AIElement).min(1),
  transition: z.object({
    type:     z.enum(['fade', 'slide', 'zoom', 'flip', 'morph', 'magic-move', 'none']),
    duration: z.number().int().min(200).max(2000).optional(),
    easing:   z.enum(['easeInOut', 'easeOut', 'spring', 'linear']).optional(),
  }).optional(),
  speakerNotes: z.string().optional(),
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
