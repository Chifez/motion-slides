import { z } from 'zod'

// ── Color Validation ────────────────────────────────────────────────────────
const ColorSchema = z.string().regex(
  /^(var\(--ms-[\w-]+\)|rgba?\([^)]+\)|hsl[a]?\([^)]+\)|transparent|inherit)$/,
  'Color must be a CSS var token, rgba(), hsla(), transparent, or inherit — not a raw hex code'
).nullable()

// ── Normalized position ────────────────────────────────────────────────────────
// All values are 0.0–1.0 relative to canvas width/height.
const AIRelativePosition = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  w: z.number().min(0.01).max(1),
  h: z.number().min(0.01).max(1),
})

// ── Animation options ─────────────────────────────────────────────────────────
const AnimationType = z.enum(['fade-in', 'slide-up', 'slide-left', 'zoom-in', 'pop', 'draw', 'none'])

// ── Element schemas ───────────────────────────────────────────────────────────

const AITextElement = z.object({
  type:           z.literal('text'),
  id:             z.string().min(1),
  content:        z.string().min(1),
  role:           z.enum(['title', 'subtitle', 'heading', 'body', 'caption', 'label']),
  position:       AIRelativePosition,
  layer:          z.string().min(1), // Added for auto-grouping
  style: z.object({
    fontSize:   z.enum(['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl']).nullable(),
    fontWeight: z.enum(['normal', 'medium', 'semibold', 'bold']).nullable(),
    color:      ColorSchema,
    align:      z.enum(['left', 'center', 'right']).nullable(),
  }).nullable(),
  animation:      AnimationType.nullable(),
  animationDelay: z.number().min(0).max(5000).nullable(),
})

const AIShapeElement = z.object({
  type:     z.literal('shape'),
  id:       z.string().min(1),
  shape:    z.enum(['rectangle', 'rounded-rectangle', 'circle', 'cylinder', 'diamond', 'hexagon', 'aws-icon']),
  label:    z.string().nullable(),
  sublabel: z.string().nullable(),
  iconPath: z.string().nullable(),
  position: AIRelativePosition,
  layer:    z.string().min(1), // Added for auto-grouping
  style: z.object({
    backgroundColor: ColorSchema,
    borderColor:     ColorSchema,
    borderWidth:     z.number().nullable(),
    opacity:         z.number().min(0).max(1).nullable(),
  }).nullable(),
  animation:      AnimationType.nullable(),
  animationDelay: z.number().min(0).max(5000).nullable(),
})

const AICodeElement = z.object({
  type:           z.literal('code'),
  id:             z.string().min(1),
  code:           z.string().min(1),
  language:       z.string(),
  position:       AIRelativePosition,
  layer:          z.string().min(1), // Added for auto-grouping
  animation:      AnimationType.nullable(),
  animationDelay: z.number().min(0).max(5000).nullable(),
})

const AIIconElement = z.object({
  type:           z.literal('icon'),
  id:             z.string().min(1),
  iconPath:       z.string().min(1),
  label:          z.string().nullable(),
  position:       AIRelativePosition,
  layer:          z.string().min(1), // Added for auto-grouping
  animation:      AnimationType.nullable(),
  animationDelay: z.number().min(0).max(5000).nullable(),
})

const AIClusterElement = z.object({
  type:           z.literal('cluster'),
  id:             z.string().min(1),
  iconPath:       z.string().min(1),
  count:          z.number().min(2).max(100),
  label:          z.string().min(1),
  sublabels:      z.array(z.string()).nullable(),
  stackDirection: z.enum(['right', 'down', 'behind']).nullable(),
  position:       AIRelativePosition,
  layer:          z.string().min(1), // Added for auto-grouping
  animation:      AnimationType.nullable(),
  animationDelay: z.number().min(0).max(5000).nullable(),
})

const AISectionElement = z.object({
  type:            z.literal('section'),
  id:              z.string().min(1),
  label:           z.string().nullable(),
  sectionRole:     z.enum(['layer-bg', 'cluster-bg', 'security-perimeter', 'vpc-boundary']).nullable(),
  position:        AIRelativePosition,
  backgroundColor: ColorSchema.unwrap().or(z.string()),
  borderColor:     ColorSchema,
  borderStyle:     z.enum(['solid', 'dashed', 'dotted', 'none']),
  borderWidth:     z.number().min(0).max(8),
  cornerRadius:    z.number().min(0).max(24),
  animation:       AnimationType.nullable(),
  animationDelay:  z.number().min(0).max(5000).nullable(),
})

export const AIConnection = z.object({
  id:      z.string().min(1),
  from:    z.string().min(1),
  to:      z.string().min(1),
  type:    z.enum(['directed', 'bidirectional', 'dashed', 'thick']),
  label:   z.string().nullable(),
  color:   ColorSchema,
  routing: z.enum(['straight', 'arc-right', 'arc-left', 'bypass-top', 'bypass-bottom', 'elbow-h', 'elbow-v', 's-curve']).nullable(),
})

const AIElement = z.discriminatedUnion('type', [
  AISectionElement,
  AITextElement,
  AIShapeElement,
  AICodeElement,
  AIIconElement,
  AIClusterElement,
])

// ── Slide schema ──────────────────────────────────────────────────────────────

const AISlide = z.object({
  id:           z.string().min(1),
  title:        z.string().min(1),
  role:         z.enum(['title', 'content', 'diagram', 'code', 'summary', 'divider']),
  background:   ColorSchema,
  spatialPlan:  z.string().min(1),
  elements:     z.array(AIElement).min(1),
  connections:  z.array(AIConnection), // Removed .optional()
  transition: z.object({
    type:     z.enum(['fade', 'slide', 'zoom', 'flip', 'morph', 'magic-move', 'none']),
    duration: z.number().min(0).max(5000).nullable(),
    easing:   z.enum(['easeInOut', 'easeOut', 'spring', 'linear']).nullable(),
  }).nullable(),
  speakerNotes: z.string().nullable(),
}).superRefine((slide, ctx) => {
  // 1. Spatial Fit Validation
  slide.elements.forEach((el, i) => {
    if ('position' in el) {
      const { x, y, w, h } = el.position
      if (x + w > 1.001 || y + h > 1.001) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Element ${el.id} overflows canvas at x+w=${(x+w).toFixed(2)}`,
          path: ['elements', i, 'position']
        })
      }
    }
  })

  // 2. Connection Integrity Validation
  if (slide.role === 'diagram') {
    const elementIds = new Set(slide.elements.map(e => e.id))
    slide.connections?.forEach((conn, i) => {
      if (!elementIds.has(conn.from)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Connection from \"${conn.from}\" references non-existent element`, path: ['connections', i, 'from'] })
      }
      if (!elementIds.has(conn.to)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Connection to \"${conn.to}\" references non-existent element`, path: ['connections', i, 'to'] })
      }
    })
  }

  // 3. Tier Validation
  if (slide.role === 'diagram') {
    validateTierPositions(slide.elements, ctx)
  }
})

function validateTierPositions(elements: z.infer<typeof AIElement>[], ctx: z.RefinementCtx) {
  const TIERS = {
    CLIENT: { min: 0.12, max: 0.32 },
    EDGE:   { min: 0.30, max: 0.48 },
    LOGIC:  { min: 0.46, max: 0.68 },
    DATA:   { min: 0.66, max: 0.88 }
  }

  elements.forEach((el, i) => {
    if (el.type === 'shape' || el.type === 'icon' || el.type === 'cluster') {
      const label = (el as any).label?.toLowerCase() || ''
      const y = el.position.y
      
      if (label.includes('client') || label.includes('browser') || label.includes('user')) {
        if (y > TIERS.CLIENT.max) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Client elements must be in the top tier (y < 0.32)', path: ['elements', i] })
      }
      if (label.includes('database') || label.includes('storage') || label.includes('s3') || label.includes('sql')) {
        if (y < TIERS.DATA.min) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Data elements must be in the bottom tier (y > 0.66)', path: ['elements', i] })
      }
    }
  })
}

// ── Presentation schema ───────────────────────────────────────────────────────

export const GeneratedPresentationSchema = z.object({
  title:       z.string().min(1),
  description: z.string(),
  theme: z.object({
    primaryColor:    ColorSchema.unwrap(),
    secondaryColor:  ColorSchema.unwrap(),
    backgroundColor: ColorSchema.unwrap(),
    textColor:       ColorSchema.unwrap(),
    accentColor:     ColorSchema.unwrap(),
    fontFamily:      z.enum(['inter', 'mono', 'serif', 'display']),
  }),
  slides: z.array(AISlide).min(1).max(30),
})

export type GeneratedPresentation = z.infer<typeof GeneratedPresentationSchema>
export type AISlideType            = z.infer<typeof AISlide>
export type AIElementType          = z.infer<typeof AIElement>
export type AISectionElementType   = z.infer<typeof AISectionElement>
