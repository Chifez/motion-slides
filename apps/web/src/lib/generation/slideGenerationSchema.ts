import { z } from 'zod'

// ── Color Validation ────────────────────────────────────────────────────────
const ColorSchema = z.string().regex(
  /^(var\(--ms-[\w-]+\)|rgba?\([^)]+\)|hsl[a]?\([^)]+\)|transparent|inherit)$/,
  'Color must be a CSS var token, rgba(), hsla(), transparent, or inherit — not a raw hex code'
).nullable()

const ThemeColorSchema = z.string().regex(
  /^(#[0-9a-fA-F]{3,8}|var\(--ms-[\w-]+\)|rgba?\([^)]+\)|hsl[a]?\([^)]+\)|transparent|inherit)$/,
  'Must be a hex code, CSS var token, or color function'
)


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
  type: z.literal('text'),
  id: z.string().min(1),
  content: z.string().min(1),
  role: z.enum(['title', 'subtitle', 'heading', 'body', 'caption', 'label']),
  position: AIRelativePosition,
  layer: z.string().min(1), // Added for auto-grouping
  style: z.object({
    fontSize: z.enum(['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl']).nullable(),
    fontWeight: z.enum(['normal', 'medium', 'semibold', 'bold']).nullable(),
    color: ColorSchema,
    align: z.enum(['left', 'center', 'right']).nullable(),
  }).nullable(),
  animation: AnimationType.nullable(),
  animationDelay: z.number().min(0).max(5000).nullable(),
})

// All native shape types available in the MotionSlides editor
export const AI_SHAPE_TYPE = z.enum([
  'rectangle', 'rounded-rectangle', 'circle', 'cylinder',
  'diamond', 'hexagon', 'database', 'server', 'cloud',
  'client', 'user', 'bucket', 'queue', 'document', 'aws-icon', 'gcp-icon',
])

const AIShapeElement = z.object({
  type: z.literal('shape'),
  id: z.string().min(1),
  shape: AI_SHAPE_TYPE,
  label: z.string().nullable(),
  sublabel: z.string().nullable(),
  iconPath: z.string().nullable(),
  position: AIRelativePosition,
  layer: z.string().min(1),
  style: z.object({
    backgroundColor: ColorSchema,
    borderColor: ColorSchema,
    borderWidth: z.number().nullable(),
    opacity: z.number().min(0).max(1).nullable(),
  }).nullable(),
  animation: AnimationType.nullable(),
  animationDelay: z.number().min(0).max(5000).nullable(),
})

const AICodeElement = z.object({
  type: z.literal('code'),
  id: z.string().min(1),
  code: z.string().min(1),
  language: z.string(),
  position: AIRelativePosition,
  layer: z.string().min(1), // Added for auto-grouping
  animation: AnimationType.nullable(),
  animationDelay: z.number().min(0).max(5000).nullable(),
})

const AIIconElement = z.object({
  type: z.literal('icon'),
  id: z.string().min(1),
  iconPath: z.string().min(1),
  label: z.string().nullable(),
  position: AIRelativePosition,
  layer: z.string().min(1), // Added for auto-grouping
  animation: AnimationType.nullable(),
  animationDelay: z.number().min(0).max(5000).nullable(),
})

const AIClusterElement = z.object({
  type: z.literal('cluster'),
  id: z.string().min(1),
  iconPath: z.string().min(1),
  count: z.number().min(2).max(100),
  label: z.string().min(1),
  sublabels: z.array(z.string()).nullable(),
  stackDirection: z.enum(['right', 'down', 'behind']).nullable(),
  position: AIRelativePosition,
  layer: z.string().min(1), // Added for auto-grouping
  animation: AnimationType.nullable(),
  animationDelay: z.number().min(0).max(5000).nullable(),
})

const AISectionElement = z.object({
  type: z.literal('section'),
  id: z.string().min(1),
  label: z.string().nullable(),
  sectionRole: z.enum(['layer-bg', 'cluster-bg', 'security-perimeter', 'vpc-boundary']).nullable(),
  position: AIRelativePosition,
  backgroundColor: ColorSchema.unwrap().or(z.string()),
  borderColor: ColorSchema,
  borderStyle: z.enum(['solid', 'dashed', 'dotted', 'none']),
  borderWidth: z.number().min(0).max(8),
  cornerRadius: z.number().min(0).max(24),
  animation: AnimationType.nullable(),
  animationDelay: z.number().min(0).max(5000).nullable(),
})

export const AIConnection = z.object({
  id: z.string().min(1),
  from: z.string().min(1),
  to: z.string().min(1),
  type: z.enum(['directed', 'bidirectional', 'dashed', 'thick']),
  label: z.string().nullable(),
  color: ColorSchema,
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

export const AILogicalNode = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  sublabel: z.string().nullable(),
  layer: z.string().min(1),
  type: z.enum(['icon', 'cluster', 'shape']),
  iconPath: z.string().nullable(),
  shapeType: AI_SHAPE_TYPE.nullable(),
})

export const AILogicalConnection = z.object({
  id: z.string().min(1),
  from: z.string().min(1),
  fromPort: z.enum(['top', 'right', 'bottom', 'left']).nullable(),
  to: z.string().min(1),
  toPort: z.enum(['top', 'right', 'bottom', 'left']).nullable(),
  type: z.enum(['directed', 'bidirectional', 'dashed', 'thick']),
  label: z.string().nullable(),
})

export const AISlideBaseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  role: z.enum(['title', 'content', 'diagram', 'code', 'summary', 'divider']),
  background: ColorSchema,
  spatialPlan: z.string().nullable(),
  elements: z.array(AIElement).nullable(),
  connections: z.array(AIConnection).nullable(),
  layoutTemplate: z.enum(['hero-title', 'bullets-standard', 'two-column', 'comparison', 'diagram-only', 'code-only']).nullable(),
  logicalNodes: z.array(AILogicalNode).nullable(),
  logicalConnections: z.array(AILogicalConnection).nullable(),
  transition: z.object({
    type: z.enum(['fade', 'slide', 'zoom', 'flip', 'morph', 'magic-move', 'none']),
    duration: z.number().min(0).max(5000).nullable(),
    easing: z.enum(['easeInOut', 'easeOut', 'spring', 'linear']).nullable(),
  }).nullable(),
  speakerNotes: z.string().nullable(),
})

export const AISlideStrictSchema = AISlideBaseSchema.superRefine((slide, ctx) => {
  // 0. spatialPlan required ONLY for diagram slides
  if (slide.role === 'diagram' && (!slide.spatialPlan || slide.spatialPlan.trim().length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Diagram slide "${slide.id}" must include a non-empty spatialPlan.`,
      path: ['spatialPlan'],
    })
  }

  // 1. Spatial Fit Validation
  (slide.elements || []).forEach((el, i) => {
    if ('position' in el) {
      const { x, y, w, h } = el.position
      if (x + w > 1.001 || y + h > 1.001) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Element ${el.id} overflows canvas at x+w=${(x + w).toFixed(2)}`,
          path: ['elements', i, 'position']
        })
      }
    }
  })

  // 2. Connection Integrity Validation
  if (slide.role === 'diagram') {
    const elementIds = new Set((slide.elements || []).map(e => e.id))
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
    validateTierPositions(slide.elements || [], ctx)
  }

  if (slide.role === 'diagram') {
    const nodeCount = slide.logicalNodes?.length ?? 0
    if (nodeCount < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Diagram slide "${slide.id}" has ${nodeCount} logicalNodes — minimum 3 required.`,
        path: ['logicalNodes'],
      })
    }
  }
})

function validateTierPositions(elements: z.infer<typeof AIElement>[], ctx: z.RefinementCtx) {
  const TIERS = {
    CLIENT: { min: 0.12, max: 0.32 },
    EDGE: { min: 0.30, max: 0.48 },
    LOGIC: { min: 0.46, max: 0.68 },
    DATA: { min: 0.66, max: 0.88 }
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

export const GeneratedPresentationLaxSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  theme: z.object({
    primaryColor: ThemeColorSchema,
    secondaryColor: ThemeColorSchema,
    backgroundColor: ThemeColorSchema,
    textColor: ThemeColorSchema,
    accentColor: ThemeColorSchema,
    fontFamily: z.enum(['inter', 'mono', 'serif', 'display']),
  }),
  slides: z.array(AISlideBaseSchema).min(1).max(30),
})

export const GeneratedPresentationSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  theme: z.object({
    primaryColor: ThemeColorSchema,
    secondaryColor: ThemeColorSchema,
    backgroundColor: ThemeColorSchema,
    textColor: ThemeColorSchema,
    accentColor: ThemeColorSchema,
    fontFamily: z.enum(['inter', 'mono', 'serif', 'display']),
  }),
  slides: z.array(AISlideStrictSchema).min(1).max(30),
})

export function formatZodIssues(issues: z.ZodIssue[]): string {
  return issues
    .map(issue => `  - [${issue.path.join('.')}]: ${issue.message}`)
    .join('\n')
}

export type GeneratedPresentation = z.infer<typeof GeneratedPresentationSchema>
export type AISlideType = z.infer<typeof AISlideBaseSchema>
export type AIElementType = z.infer<typeof AIElement>
export type AISectionElementType = z.infer<typeof AISectionElement>
export type AIConnectionType = z.infer<typeof AIConnection>
