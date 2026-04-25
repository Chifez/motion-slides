# Implementation Plan — AI Generation, Project Flow, and AWS Icons

> **For the AI implementing this plan:** Read every section completely before
> writing any code. All architectural decisions are resolved — there are no open
> questions. Follow exact file paths, type definitions, API patterns, and
> component structures as specified. Where a section says "exact", do not
> paraphrase or substitute.

---

## Resolved Decisions (do not re-open these)

| Decision | Answer |
|----------|--------|
| AI provider | Anthropic Claude (`claude-sonnet-4-6`) via `@anthropic-ai/sdk` |
| API key location | Server `.env` only as `ANTHROPIC_API_KEY`. Never in `VITE_` env vars |
| Server routes | TanStack Start `createAPIFileRoute`. NOT the export server |
| Generation schema | Defined in Section 6. Must match existing `Slide` / `SceneElement` types |
| AIChat flow | Two-step: generate → preview → user clicks "Add" or "New Project" |
| AWS icon rendering | `<img>` tag. NOT `react-inlinesvg` |
| AWS icon source | Already downloaded into `public/icons/aws/`. Run manifest script first |
| Manifest generation | Run `node scripts/generate-aws-manifest.mjs` once before implementing |
| Demo project trigger | Check `state.projects.length === 0` in the store. No separate `localStorage` key |
| Magic Move definition | Slides sharing element IDs across duplicated slides enable morphing transitions |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Package Dependencies](#2-package-dependencies)
3. [Step 0 — Generate AWS Icon Manifest](#3-step-0--generate-aws-icon-manifest)
4. [File Map](#4-file-map)
5. [Types Changes](#5-types-changes)
6. [Generation Schema](#6-generation-schema)
7. [Implementation — TanStack Start API Routes](#7-implementation--tanstack-start-api-routes)
8. [Implementation — AI Slice](#8-implementation--ai-slice)
9. [Implementation — AI Chat UI](#9-implementation--ai-chat-ui)
10. [Implementation — AWS Icons](#10-implementation--aws-icons)
11. [Implementation — Project Flow](#11-implementation--project-flow)
12. [Generation Pipeline Files](#12-generation-pipeline-files)
13. [Critical Constraints](#13-critical-constraints)
14. [Verification Plan](#14-verification-plan)
15. [Implementation Checklist](#15-implementation-checklist)

---

## 1. Overview

This plan covers three features implemented together because they share the
AI generation pipeline:

**Feature A — AI Slide Generation**
A chat panel in the editor lets users generate slides from:
- A README `.md` file (uploaded or pasted)
- A plain-English architecture description

The AI returns structured JSON that maps to your existing `Slide[]`. Generated
slides open in a preview before being added to the project.

**Feature B — AWS Architecture Icons**
Shape elements gain a new `aws-icon` sub-type. Users can pick any icon from
the official AWS Architecture Icons pack (already downloaded) and place it on a
slide. Icons render as `<img>` tags inside the existing shape container.

**Feature C — Improved Project Flow**
First-time users see a demo project with autoplay enabled. All subsequent
projects start with a blank canvas. No separate localStorage tracking — the
store's `projects.length` is the source of truth.

---

## 2. Package Dependencies

### Frontend (`apps/web/package.json`)
```json
{
  "dependencies": {
    "zod": "^3.22.4"
  }
}
```

### Server / TanStack Start (`package.json` root or server)
```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.39.0",
    "zod": "^3.22.4",
    "zod-to-json-schema": "^3.23.0",
    "marked": "^12.0.0"
  }
}
```

### Scripts (dev tooling only)
```json
{
  "scripts": {
    "generate:icons": "node scripts/generate-aws-manifest.mjs"
  }
}
```

---

## 3. Step 0 — Generate AWS Icon Manifest

**Do this before writing any application code.**

The script `scripts/generate-aws-manifest.mjs` scans `public/icons/aws/`,
reads every `.svg` file, and writes `public/icons/aws/manifest.json`.

```bash
node scripts/generate-aws-manifest.mjs
```

Expected output:
```
📁  Found N SVG files
✅  Manifest written to public/icons/aws/manifest.json
    X categories, Y icons

Categories found:
  Compute                          42 icons
  Database                         18 icons
  ...
```

The manifest shape is:
```typescript
interface AwsIconManifest {
  version:     number
  generatedAt: string
  totalIcons:  number
  categories:  AwsCategory[]
}

interface AwsCategory {
  id:    string    // "compute"
  label: string    // "Compute"
  icons: AwsIcon[]
}

interface AwsIcon {
  id:       string    // "amazon-ec2"
  label:    string    // "Amazon EC2"
  path:     string    // "icons/aws/Compute/Arch_Amazon-EC2_32.svg"
  category: string    // "compute"
  keywords: string[]  // ["ec2", "compute", "virtual", "machine", "instance"]
}
```

**The manifest is a static file served from `public/`. The frontend fetches it
once at runtime — it is NOT bundled into the app.**

---

## 4. File Map

### Files to CREATE

| Path | Purpose |
|------|---------|
| `scripts/generate-aws-manifest.mjs` | One-time script to generate icon manifest |
| `app/lib/generation/slideGenerationSchema.ts` | Zod schema — AI output shape |
| `app/lib/generation/markdownParser.ts` | Parse README into structured sections |
| `app/lib/generation/architectureParser.ts` | Extract components from description |
| `app/lib/generation/promptBuilder.ts` | System + user prompts per mode |
| `app/lib/generation/generationClient.ts` | Claude API caller with structured output |
| `app/lib/generation/slideAssembler.ts` | Map AI output → your Slide/SceneElement |
| `app/routes/api/generate/readme.ts` | TanStack Start API route — README mode |
| `app/routes/api/generate/architecture.ts` | TanStack Start API route — arch mode |
| `apps/web/src/store/slices/aiSlice.ts` | AI state: messages, loading, previews |
| `apps/web/src/components/editor/AIChat.tsx` | Chat panel — mode select + input |
| `apps/web/src/components/editor/AIReadmeInput.tsx` | File upload + paste for README |
| `apps/web/src/components/editor/AIArchInput.tsx` | Text input for architecture |
| `apps/web/src/components/editor/GenerationPreview.tsx` | Preview before import |
| `apps/web/src/components/editor/AwsIconPicker.tsx` | Searchable icon grid |
| `apps/web/src/hooks/useAwsIcons.ts` | Fetch + search manifest |
| `apps/web/src/lib/generateClient.ts` | Frontend SSE client |

### Files to MODIFY

| Path | What changes |
|------|-------------|
| `packages/shared/src/types.ts` | Add `AIChatMessage`, `aws-icon` shape type, `iconPath` field |
| `apps/web/src/store/slices/projectSlice.ts` | Demo vs blank project logic |
| `apps/web/src/store/defaults.ts` | `createDemoProject` + `createBlankProject` |
| `apps/web/src/constants/export.ts` | `DEFAULT_PLAYBACK_SETTINGS.autoplay = true` |
| `apps/web/src/components/editor/elements/ShapeElement.tsx` | Render AWS icon |
| `apps/web/src/components/editor/inspector/ShapeSection.tsx` | AWS icon picker |
| `apps/web/src/routes/editor.$projectId.tsx` | Mount `AIChat` component |

---

## 5. Types Changes

### `packages/shared/src/types.ts`

Add these to the existing types file. Do not replace existing types — append
or extend as shown.

```typescript
// ── AI Chat ───────────────────────────────────────────────────────────────────

export interface AIChatMessage {
  id:        string
  role:      'user' | 'assistant'
  content:   string
  timestamp: number
  /** Present when the message contains generated slides ready to preview */
  slides?:   Slide[]
  /** Present when stage is in progress */
  progress?: {
    stage:   'preparing' | 'capturing' | 'encoding' | 'done' | 'error'
    percent: number
    message: string
  }
}

// ── AWS Icon shape ────────────────────────────────────────────────────────────

// Extend the existing ShapeType union to include 'aws-icon':
// BEFORE: export type ShapeType = 'rectangle' | 'circle' | ...
// AFTER:  export type ShapeType = 'rectangle' | 'circle' | ... | 'aws-icon'

// Add iconPath to ShapeContent:
// export interface ShapeContent {
//   ...existing fields...
//   iconPath?:     string    // e.g. "icons/aws/Compute/Arch_Amazon-EC2_32.svg"
//   iconCategory?: string   // e.g. "compute"
//   iconLabel?:    string   // e.g. "Amazon EC2"
// }
```

---

## 6. Generation Schema

This schema defines exactly what the AI must output. It is validated with Zod
and enforced by Claude's Structured Outputs feature, which guarantees the
response matches the schema on the first call with no retry logic needed.

### `app/lib/generation/slideGenerationSchema.ts`

```typescript
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
  shape:    z.enum(['rectangle', 'rounded-rectangle', 'circle', 'cylinder', 'diamond', 'hexagon']),
  label:    z.string().optional(),
  sublabel: z.string().optional(),
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
```

---

## 7. Implementation — TanStack Start API Routes

### `app/routes/api/generate/readme.ts`

```typescript
import { createAPIFileRoute }  from '@tanstack/start/api'
import { parseReadme, buildReadmeBriefing }  from '~/lib/generation/markdownParser'
import { buildReadmePrompt }                  from '~/lib/generation/promptBuilder'
import { generatePresentation }               from '~/lib/generation/generationClient'
import { assembleSlides }                     from '~/lib/generation/slideAssembler'

export const APIRoute = createAPIFileRoute('/api/generate/readme')({
  POST: async ({ request }) => {
    const body = await request.json()
    const { markdown, options = {} } = body
    const { slideCount = 10, style = 'technical', theme = 'dark' } = options

    if (!markdown || typeof markdown !== 'string') {
      return new Response(JSON.stringify({ error: 'markdown is required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      })
    }
    if (markdown.length > 50_000) {
      return new Response(JSON.stringify({ error: 'README too large (max 50 000 chars)' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      })
    }

    const stream = new ReadableStream({
      async start(controller) {
        const enc  = new TextEncoder()
        const send = (data: object) =>
          controller.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`))

        try {
          send({ stage: 'preparing', percent: 5,  message: 'Parsing README…' })
          const parsed     = parseReadme(markdown)
          const briefing   = buildReadmeBriefing(parsed, slideCount)

          send({ stage: 'preparing', percent: 15, message: 'Building prompt…' })
          const userPrompt = buildReadmePrompt({ briefing, slideCount, style, theme })

          send({ stage: 'capturing', percent: 20, message: 'Generating with Claude…' })
          const generated  = await generatePresentation({ userPrompt })

          send({ stage: 'encoding',  percent: 80, message: 'Assembling slides…' })
          const slides     = assembleSlides(generated)

          send({
            stage:   'done',
            percent: 100,
            message: `Generated ${slides.length} slides`,
            slides,
            title:   generated.title,
            theme:   generated.theme,
          })
        } catch (err: any) {
          // Never expose raw error — may contain API key hints
          console.error('[generate/readme]', err)
          send({ stage: 'error', percent: 0, message: 'Generation failed. Please try again.' })
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type':      'text/event-stream',
        'Cache-Control':     'no-cache',
        'X-Accel-Buffering': 'no',
      },
    })
  },
})
```

### `app/routes/api/generate/architecture.ts`

```typescript
import { createAPIFileRoute }    from '@tanstack/start/api'
import { parseArchitecture, buildArchitectureBriefing } from '~/lib/generation/architectureParser'
import { buildArchitecturePrompt }                       from '~/lib/generation/promptBuilder'
import { generatePresentation }                          from '~/lib/generation/generationClient'
import { assembleSlides }                                from '~/lib/generation/slideAssembler'

export const APIRoute = createAPIFileRoute('/api/generate/architecture')({
  POST: async ({ request }) => {
    const body = await request.json()
    const { description, options = {} } = body
    const { slideCount = 6, diagramStyle = 'generic', theme = 'dark' } = options

    if (!description || typeof description !== 'string') {
      return new Response(JSON.stringify({ error: 'description is required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      })
    }
    if (description.length > 5_000) {
      return new Response(JSON.stringify({ error: 'Description too long (max 5 000 chars)' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      })
    }

    const stream = new ReadableStream({
      async start(controller) {
        const enc  = new TextEncoder()
        const send = (data: object) =>
          controller.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`))

        try {
          send({ stage: 'preparing', percent: 5,  message: 'Analysing architecture…' })
          const parsed     = parseArchitecture(description)
          const briefing   = buildArchitectureBriefing(parsed)

          send({ stage: 'preparing', percent: 15, message: 'Building prompt…' })
          const userPrompt = buildArchitecturePrompt({ briefing, diagramStyle, slideCount, theme })

          send({ stage: 'capturing', percent: 20, message: 'Generating diagram slides…' })
          const generated  = await generatePresentation({
            userPrompt,
            maxTokens: 12_000,   // architecture slides need more tokens
          })

          send({ stage: 'encoding',  percent: 80, message: 'Assembling slides…' })
          const slides     = assembleSlides(generated)

          send({
            stage:              'done',
            percent:            100,
            message:            `Generated ${slides.length} slides`,
            slides,
            title:              generated.title,
            theme:              generated.theme,
            requiresLineRecalc: true,
          })
        } catch (err: any) {
          console.error('[generate/architecture]', err)
          send({ stage: 'error', percent: 0, message: 'Generation failed. Please try again.' })
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type':      'text/event-stream',
        'Cache-Control':     'no-cache',
        'X-Accel-Buffering': 'no',
      },
    })
  },
})
```

### `app/lib/generation/generationClient.ts`

```typescript
import Anthropic            from '@anthropic-ai/sdk'
import { zodToJsonSchema }  from 'zod-to-json-schema'
import { GeneratedPresentationSchema, type GeneratedPresentation } from './slideGenerationSchema'
import { SYSTEM_PROMPT }    from './promptBuilder'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,  // server-side only — never VITE_ prefixed
})

export interface GenerationOptions {
  userPrompt: string
  maxTokens?: number
}

export async function generatePresentation(
  opts: GenerationOptions,
): Promise<GeneratedPresentation> {
  const jsonSchema = zodToJsonSchema(GeneratedPresentationSchema, {
    name:   'GeneratedPresentation',
    target: 'openApi3',
  })

  const response = await client.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: opts.maxTokens ?? 8_000,
    system:     SYSTEM_PROMPT,
    messages: [{ role: 'user', content: opts.userPrompt }],
    // Structured output — schema compliance guaranteed on first call
    output_config: {
      format: {
        type:   'json_schema',
        schema: (jsonSchema as any).definitions?.GeneratedPresentation ?? jsonSchema,
      },
    },
  } as any)

  const raw = response.content[0]
  if (raw.type !== 'text') throw new Error('Unexpected response type from Claude')

  const parsed = GeneratedPresentationSchema.safeParse(JSON.parse(raw.text))
  if (!parsed.success) throw new Error(`Schema validation failed: ${parsed.error.message}`)

  return parsed.data
}
```

---

## 8. Implementation — AI Slice

### `apps/web/src/store/slices/aiSlice.ts`

```typescript
import type { StateCreator } from 'zustand'
import type { EditorState }  from '@/store/editorStore'
import type { AIChatMessage } from '@shared/types'
import { nanoid } from 'nanoid'

export interface AISlice {
  // Chat history
  chatMessages:      AIChatMessage[]
  addChatMessage:    (message: Omit<AIChatMessage, 'id' | 'timestamp'>) => string
  updateChatMessage: (id: string, updates: Partial<AIChatMessage>) => void
  clearChat:         () => void

  // Panel state
  isChatOpen:    boolean
  toggleChat:    () => void
  setChatOpen:   (open: boolean) => void

  // Generation state
  isGenerating:  boolean
  setGenerating: (v: boolean) => void

  // Pending preview — slides waiting for user to accept/reject
  pendingSlides:    any[] | null   // replace any[] with Slide[]
  pendingTitle:     string
  setPendingSlides: (slides: any[] | null, title?: string) => void
  clearPending:     () => void
}

export const createAISlice: StateCreator<EditorState, [], [], AISlice> = (set) => ({
  chatMessages: [],

  addChatMessage: (msg) => {
    const id = nanoid()
    set(s => ({
      chatMessages: [
        ...s.chatMessages,
        { ...msg, id, timestamp: Date.now() }
      ]
    }))
    return id
  },

  updateChatMessage: (id, updates) =>
    set(s => ({
      chatMessages: s.chatMessages.map(m => m.id === id ? { ...m, ...updates } : m)
    })),

  clearChat: () => set({ chatMessages: [] }),

  isChatOpen:  false,
  toggleChat:  () => set(s => ({ isChatOpen: !s.isChatOpen })),
  setChatOpen: (open) => set({ isChatOpen: open }),

  isGenerating:  false,
  setGenerating: (v) => set({ isGenerating: v }),

  pendingSlides: null,
  pendingTitle:  '',
  setPendingSlides: (slides, title = '') => set({ pendingSlides: slides, pendingTitle: title }),
  clearPending:     () => set({ pendingSlides: null, pendingTitle: '' }),
})
```

---

## 9. Implementation — AI Chat UI

### `apps/web/src/lib/generateClient.ts`

```typescript
export type GenerationMode = 'readme' | 'architecture'

export interface GenerationOptions {
  mode:         GenerationMode
  markdown?:    string
  description?: string
  slideCount?:  number
  style?:       'technical' | 'executive' | 'tutorial'
  diagramStyle?: 'generic' | 'aws' | 'gcp' | 'minimal'
  theme?:       'dark' | 'light' | 'auto'
}

export interface GenerationEvent {
  stage:    'preparing' | 'capturing' | 'encoding' | 'done' | 'error'
  percent:  number
  message:  string
  slides?:  any[]
  title?:   string
  theme?:   object
  requiresLineRecalc?: boolean
}

export async function generateSlides(
  opts:       GenerationOptions,
  onProgress: (e: GenerationEvent) => void,
): Promise<any[] | null> {
  const endpoint = opts.mode === 'readme'
    ? '/api/generate/readme'
    : '/api/generate/architecture'

  const body = opts.mode === 'readme'
    ? { markdown: opts.markdown, options: { slideCount: opts.slideCount, style: opts.style, theme: opts.theme } }
    : { description: opts.description, options: { slideCount: opts.slideCount, diagramStyle: opts.diagramStyle, theme: opts.theme } }

  let res: Response
  try {
    res = await fetch(endpoint, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })
  } catch {
    onProgress({ stage: 'error', percent: 0, message: 'Cannot reach server.' })
    return null
  }

  if (!res.body) return null

  const reader  = res.body.getReader()
  const decoder = new TextDecoder()
  let   buffer  = ''
  let   result: any[] | null = null

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      try {
        const event = JSON.parse(line.slice(6)) as GenerationEvent
        onProgress(event)
        if (event.stage === 'done' && event.slides) result = event.slides
        if (event.stage === 'error') return null
      } catch {}
    }
  }

  return result
}
```

### `apps/web/src/components/editor/AIChat.tsx`

```tsx
/**
 * AIChat.tsx
 *
 * Toggleable side panel. Contains mode selector, input components,
 * progress display, and generation preview.
 *
 * Layout: fixed right panel, slides in from the right when open.
 */

import { useState }           from 'react'
import { useEditorStore }     from '@/store/editorStore'
import { generateSlides }     from '@/lib/generateClient'
import { AIReadmeInput }      from './AIReadmeInput'
import { AIArchInput }        from './AIArchInput'
import { GenerationPreview }  from './GenerationPreview'

type Mode = 'select' | 'readme' | 'architecture' | 'generating' | 'preview'

export function AIChat() {
  const {
    isChatOpen, setChatOpen,
    isGenerating, setGenerating,
    pendingSlides, pendingTitle, setPendingSlides, clearPending,
    addSlide, recalculateLines,
  } = useEditorStore()

  const [mode,     setMode]     = useState<Mode>('select')
  const [progress, setProgress] = useState({ percent: 0, message: '' })
  const [needsLineRecalc, setNeedsLineRecalc] = useState(false)

  if (!isChatOpen) return null

  const handleGenerate = async (opts: Parameters<typeof generateSlides>[0]) => {
    setMode('generating')
    setGenerating(true)
    setNeedsLineRecalc(false)

    const slides = await generateSlides(opts, (event) => {
      setProgress({ percent: event.percent, message: event.message })
      if (event.stage === 'done' && event.slides) {
        setPendingSlides(event.slides, event.title ?? 'Generated Slides')
        if (event.requiresLineRecalc) setNeedsLineRecalc(true)
        setMode('preview')
      }
      if (event.stage === 'error') {
        setMode(opts.mode)
      }
    })

    setGenerating(false)
  }

  const handleAddToProject = () => {
    if (!pendingSlides) return
    pendingSlides.forEach(slide => addSlide(slide))
    if (needsLineRecalc) recalculateLines()
    clearPending()
    setMode('select')
    setChatOpen(false)
  }

  const handleNewProject = () => {
    if (!pendingSlides) return
    useEditorStore.getState().createProject(pendingTitle, pendingSlides)
    if (needsLineRecalc) recalculateLines()
    clearPending()
    setMode('select')
    setChatOpen(false)
  }

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-neutral-900 border-l border-neutral-800 z-40 flex flex-col shadow-2xl">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <span className="text-lg">✨</span>
          <span className="font-semibold text-white text-sm">Generate with AI</span>
        </div>
        <button
          onClick={() => setChatOpen(false)}
          className="text-neutral-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5">

        {mode === 'select' && (
          <div className="space-y-3">
            <p className="text-sm text-neutral-400 mb-4">
              Choose what you want to generate:
            </p>
            <ModeCard
              icon="📄"
              title="README → Slides"
              description="Turn a README.md into a polished animated presentation."
              onClick={() => setMode('readme')}
            />
            <ModeCard
              icon="🏗️"
              title="Architecture Diagram"
              description="Describe a system in plain English and get animated diagram slides."
              onClick={() => setMode('architecture')}
            />
          </div>
        )}

        {mode === 'readme' && (
          <AIReadmeInput
            onGenerate={(opts) => handleGenerate({ mode: 'readme', ...opts })}
            onBack={() => setMode('select')}
          />
        )}

        {mode === 'architecture' && (
          <AIArchInput
            onGenerate={(opts) => handleGenerate({ mode: 'architecture', ...opts })}
            onBack={() => setMode('select')}
          />
        )}

        {mode === 'generating' && (
          <div className="space-y-4 pt-8">
            <div className="text-center text-sm text-neutral-300">{progress.message}</div>
            <div className="w-full bg-neutral-800 rounded-full h-1.5">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <div className="text-center text-xs text-neutral-500">{progress.percent}%</div>
          </div>
        )}

        {mode === 'preview' && pendingSlides && (
          <GenerationPreview
            slides={pendingSlides}
            title={pendingTitle}
            onAddToProject={handleAddToProject}
            onNewProject={handleNewProject}
            onRegenerate={() => { clearPending(); setMode('select') }}
          />
        )}

      </div>
    </div>
  )
}

function ModeCard({ icon, title, description, onClick }: {
  icon: string; title: string; description: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 hover:border-blue-500/50 rounded-xl transition-all group"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <div className="font-medium text-white text-sm group-hover:text-blue-400 transition-colors">
            {title}
          </div>
          <div className="text-xs text-neutral-400 mt-1 leading-relaxed">{description}</div>
        </div>
      </div>
    </button>
  )
}
```

### `apps/web/src/components/editor/AIReadmeInput.tsx`

```tsx
import { useState, useRef } from 'react'

interface Props {
  onGenerate: (opts: { markdown: string; slideCount: number; style: string; theme: string }) => void
  onBack:     () => void
}

export function AIReadmeInput({ onGenerate, onBack }: Props) {
  const [markdown,   setMarkdown]   = useState('')
  const [style,      setStyle]      = useState('technical')
  const [slideCount, setSlideCount] = useState(10)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setMarkdown(ev.target?.result as string ?? '')
    reader.readAsText(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file || !file.name.match(/\.(md|txt|markdown)$/i)) return
    const reader = new FileReader()
    reader.onload = (ev) => setMarkdown(ev.target?.result as string ?? '')
    reader.readAsText(file)
  }

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-xs text-neutral-400 hover:text-white flex items-center gap-1">
        ← Back
      </button>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-neutral-700 hover:border-blue-500/60 rounded-xl p-6 text-center cursor-pointer transition-colors"
      >
        <div className="text-2xl mb-2">📁</div>
        <div className="text-xs text-neutral-400">
          {markdown
            ? <span className="text-green-400">✓ File loaded — drag to replace</span>
            : 'Drop .md file here or click to browse'}
        </div>
      </div>
      <input ref={fileRef} type="file" accept=".md,.txt,.markdown" onChange={handleFile} className="hidden" />

      {/* Paste area */}
      <textarea
        value={markdown}
        onChange={e => setMarkdown(e.target.value)}
        placeholder="Or paste markdown here…"
        className="w-full h-32 bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-xs text-neutral-200 font-mono resize-none focus:outline-none focus:border-blue-500"
      />

      {/* Options */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1.5">Style</label>
          <select
            value={style}
            onChange={e => setStyle(e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1.5 text-xs text-white"
          >
            <option value="technical">Technical</option>
            <option value="tutorial">Tutorial</option>
            <option value="executive">Executive</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1.5">
            Slides: {slideCount}
          </label>
          <input
            type="range" min={4} max={20} value={slideCount}
            onChange={e => setSlideCount(Number(e.target.value))}
            className="w-full mt-1"
          />
        </div>
      </div>

      <button
        onClick={() => onGenerate({ markdown, slideCount, style, theme: 'dark' })}
        disabled={!markdown.trim()}
        className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
      >
        Generate Slides
      </button>
    </div>
  )
}
```

### `apps/web/src/components/editor/AIArchInput.tsx`

```tsx
import { useState } from 'react'

const EXAMPLES = [
  "React frontend → Express API → PostgreSQL database and Redis cache. API calls Stripe for payments.",
  "Mobile app → API Gateway → Lambda functions → DynamoDB. S3 for files. CloudFront CDN. SQS for email jobs.",
  "Microservices: User, Order, Inventory services talking over Kafka. Each has its own PostgreSQL. API Gateway at the front.",
]

interface Props {
  onGenerate: (opts: {
    description: string; slideCount: number; diagramStyle: string; theme: string
  }) => void
  onBack: () => void
}

export function AIArchInput({ onGenerate, onBack }: Props) {
  const [description,  setDescription]  = useState('')
  const [diagramStyle, setDiagramStyle] = useState('generic')
  const [slideCount,   setSlideCount]   = useState(5)

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-xs text-neutral-400 hover:text-white flex items-center gap-1">
        ← Back
      </button>

      <div>
        <label className="block text-xs font-medium text-neutral-400 mb-1.5">
          Describe your architecture
        </label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="A React frontend connects to an Express API, which queries a PostgreSQL database…"
          className="w-full h-28 bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-xs text-neutral-200 resize-none focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Quick examples */}
      <div>
        <div className="text-xs text-neutral-500 mb-1.5">Examples:</div>
        {EXAMPLES.map((ex, i) => (
          <button
            key={i}
            onClick={() => setDescription(ex)}
            className="block w-full text-left text-xs text-neutral-500 hover:text-blue-400 truncate py-0.5 transition-colors"
          >
            → {ex.slice(0, 70)}…
          </button>
        ))}
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1.5">Diagram Style</label>
          <select
            value={diagramStyle}
            onChange={e => setDiagramStyle(e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1.5 text-xs text-white"
          >
            <option value="generic">Generic</option>
            <option value="aws">AWS Style</option>
            <option value="gcp">GCP Style</option>
            <option value="minimal">Minimal</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1.5">
            Slides: {slideCount}
          </label>
          <input
            type="range" min={3} max={10} value={slideCount}
            onChange={e => setSlideCount(Number(e.target.value))}
            className="w-full mt-1"
          />
        </div>
      </div>

      <button
        onClick={() => onGenerate({ description, slideCount, diagramStyle, theme: 'dark' })}
        disabled={description.trim().length < 20}
        className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
      >
        Generate Diagram Slides
      </button>
    </div>
  )
}
```

### `apps/web/src/components/editor/GenerationPreview.tsx`

```tsx
/**
 * GenerationPreview.tsx
 *
 * Shows a summary of generated slides before the user commits to importing.
 * Displays slide count, title, and two action buttons.
 */

interface Props {
  slides:           any[]
  title:            string
  onAddToProject:   () => void
  onNewProject:     () => void
  onRegenerate:     () => void
}

export function GenerationPreview({ slides, title, onAddToProject, onNewProject, onRegenerate }: Props) {
  return (
    <div className="space-y-5">
      <div className="text-center py-4">
        <div className="text-4xl mb-3">✅</div>
        <div className="font-semibold text-white">{title}</div>
        <div className="text-sm text-neutral-400 mt-1">
          {slides.length} slide{slides.length !== 1 ? 's' : ''} generated
        </div>
      </div>

      {/* Slide count breakdown */}
      <div className="bg-neutral-800 rounded-xl p-4 space-y-2">
        {slides.map((slide, i) => (
          <div key={slide.id ?? i} className="flex items-center gap-3 text-xs">
            <span className="w-5 h-5 rounded bg-neutral-700 flex items-center justify-center text-neutral-400">
              {i + 1}
            </span>
            <span className="text-neutral-300 truncate">{slide.title ?? `Slide ${i + 1}`}</span>
            <span className="ml-auto text-neutral-500 capitalize">{slide.role ?? 'content'}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <button
          onClick={onAddToProject}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          Add to Current Project
        </button>
        <button
          onClick={onNewProject}
          className="w-full py-2.5 bg-neutral-700 hover:bg-neutral-600 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          Create New Project
        </button>
        <button
          onClick={onRegenerate}
          className="w-full py-2 text-neutral-400 hover:text-white text-xs transition-colors"
        >
          ↺ Regenerate
        </button>
      </div>
    </div>
  )
}
```

---

## 10. Implementation — AWS Icons

### `apps/web/src/hooks/useAwsIcons.ts`

```typescript
/**
 * Fetches the AWS icon manifest once and exposes search + category filtering.
 * The manifest is a static JSON file served from public/icons/aws/manifest.json.
 */

import { useState, useEffect, useMemo } from 'react'

export interface AwsIcon {
  id:       string
  label:    string
  path:     string
  category: string
  keywords: string[]
}

export interface AwsCategory {
  id:    string
  label: string
  icons: AwsIcon[]
}

export interface AwsIconManifest {
  version:     number
  totalIcons:  number
  categories:  AwsCategory[]
}

export function useAwsIcons() {
  const [manifest, setManifest] = useState<AwsIconManifest | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)
  const [query,    setQuery]    = useState('')
  const [category, setCategory] = useState<string | null>(null)

  useEffect(() => {
    fetch('/icons/aws/manifest.json')
      .then(r => r.json())
      .then(data => { setManifest(data); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  const filtered = useMemo(() => {
    if (!manifest) return []

    const q = query.toLowerCase().trim()

    return manifest.categories
      .filter(cat => !category || cat.id === category)
      .flatMap(cat => cat.icons)
      .filter(icon => {
        if (!q) return true
        return (
          icon.label.toLowerCase().includes(q) ||
          icon.keywords.some(k => k.includes(q))
        )
      })
  }, [manifest, query, category])

  return {
    manifest,
    loading,
    error,
    query,
    setQuery,
    category,
    setCategory,
    filtered,
    categories: manifest?.categories ?? [],
  }
}
```

### `apps/web/src/components/editor/AwsIconPicker.tsx`

```tsx
import { useAwsIcons, type AwsIcon } from '@/hooks/useAwsIcons'

interface Props {
  onSelect: (icon: AwsIcon) => void
  selected?: string   // currently selected iconPath
}

export function AwsIconPicker({ onSelect, selected }: Props) {
  const { loading, error, query, setQuery, category, setCategory, filtered, categories } = useAwsIcons()

  if (loading) return <div className="text-xs text-neutral-400 p-4 text-center">Loading icons…</div>
  if (error)   return <div className="text-xs text-red-400 p-4 text-center">Failed to load icons</div>

  return (
    <div className="flex flex-col gap-2">
      {/* Search */}
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search icons…"
        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
      />

      {/* Category pills */}
      <div className="flex gap-1.5 flex-wrap">
        <button
          onClick={() => setCategory(null)}
          className={`px-2 py-0.5 rounded-full text-xs transition-colors ${
            !category ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'
          }`}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id === category ? null : cat.id)}
            className={`px-2 py-0.5 rounded-full text-xs transition-colors ${
              category === cat.id ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Icon grid */}
      <div className="grid grid-cols-5 gap-1 max-h-48 overflow-y-auto">
        {filtered.map(icon => (
          <button
            key={icon.id}
            onClick={() => onSelect(icon)}
            title={icon.label}
            className={`flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all ${
              selected === icon.path
                ? 'bg-blue-600/30 ring-1 ring-blue-500'
                : 'hover:bg-neutral-700'
            }`}
          >
            <img
              src={`/${icon.path}`}
              alt={icon.label}
              className="w-8 h-8 object-contain"
              loading="lazy"
            />
            <span className="text-[9px] text-neutral-400 text-center leading-tight line-clamp-2">
              {icon.label.replace(/^Amazon |^AWS /, '')}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-xs text-neutral-500 text-center py-4">
          No icons match "{query}"
        </div>
      )}
    </div>
  )
}
```

### Modify `ShapeElement.tsx` — render AWS icon

Find where your shape renders its content and add this branch:

```tsx
// Inside ShapeElement.tsx, within the shape container render:

{element.content.shape === 'aws-icon' && element.content.iconPath ? (
  <div className="flex flex-col items-center justify-center w-full h-full gap-2">
    <img
      src={`/${element.content.iconPath}`}
      alt={element.content.iconLabel ?? ''}
      className="w-3/5 h-3/5 object-contain pointer-events-none"
      draggable={false}
    />
    {element.content.label && (
      <span className="text-xs text-center text-white/90 leading-tight px-1">
        {element.content.label}
      </span>
    )}
  </div>
) : (
  // ... existing shape rendering
)}
```

### Modify `ShapeSection.tsx` — add icon picker to inspector

```tsx
// In the inspector panel's shape section, when shapeType === 'aws-icon':

import { AwsIconPicker } from '../AwsIconPicker'
import type { AwsIcon }  from '@/hooks/useAwsIcons'

// Inside the component:
{element.content.shape === 'aws-icon' && (
  <div className="mt-3">
    <label className="block text-xs font-medium text-neutral-400 mb-2">AWS Icon</label>
    <AwsIconPicker
      selected={element.content.iconPath}
      onSelect={(icon: AwsIcon) => {
        updateElement(element.id, {
          content: {
            ...element.content,
            iconPath:     icon.path,
            iconCategory: icon.category,
            iconLabel:    icon.label,
            label:        element.content.label || icon.label,
          }
        })
      }}
    />
  </div>
)}
```

---

## 11. Implementation — Project Flow

### Modify `apps/web/src/store/defaults.ts`

```typescript
/**
 * createBlankProject — used for all projects after the first.
 * Returns a project with a single empty slide.
 */
export function createBlankProject(name: string): Project {
  return {
    id:        nanoid(),
    name,
    slides:    [createBlankSlide()],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

/**
 * createDemoProject — used only when projects.length === 0.
 * Returns a project with 3 sample slides and autoplay enabled.
 */
export function createDemoProject(): Project {
  return {
    id:        nanoid(),
    name:      'Welcome to MotionSlides',
    slides:    [
      createTitleSlide('Welcome to MotionSlides', 'Beautiful animated presentations'),
      createContentSlide('Get Started', ['Create slides', 'Add animations', 'Export to MP4']),
      createContentSlide('Generate with AI', ['Upload a README', 'Describe an architecture', 'Get slides instantly']),
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

function createBlankSlide(): Slide {
  return {
    id:       nanoid(),
    elements: [],
    background: '#0a0a0a',
  }
}
// Add createTitleSlide and createContentSlide helpers as needed
```

### Modify `apps/web/src/store/slices/projectSlice.ts`

```typescript
// In the createProject action:
createProject: (name: string, slides?: Slide[]) => {
  const state   = get()
  const isFirst = state.projects.length === 0

  // First project ever → use demo; all subsequent → blank canvas
  const newProject = slides
    ? createProjectFromSlides(name, slides)   // AI-generated
    : isFirst
      ? createDemoProject()
      : createBlankProject(name)

  set(s => ({
    projects:        [...s.projects, newProject],
    activeProjectId: newProject.id,
    activeSlideIndex: 0,
  }))

  // Navigate immediately to the editor
  // (use your router's navigate function here)
  navigate({ to: `/editor/${newProject.id}` })
}
```

### Modify `apps/web/src/constants/export.ts`

```typescript
// Change autoplay default:
export const DEFAULT_PLAYBACK_SETTINGS = {
  // ...existing settings...
  autoplay: true,   // was: false
}
```

---

## 12. Generation Pipeline Files

These four files contain the generation logic. Place them in `app/lib/generation/`.

They are fully specified in the earlier design document. Your IDE should implement
them following these interfaces exactly:

### `markdownParser.ts` — exports
```typescript
export function parseReadme(markdown: string): ParsedReadme
export function buildReadmeBriefing(parsed: ParsedReadme, maxSlides: number): string
```

### `architectureParser.ts` — exports
```typescript
export function parseArchitecture(text: string): ParsedArchitecture
export function buildArchitectureBriefing(parsed: ParsedArchitecture): string
```

### `promptBuilder.ts` — exports
```typescript
export const SYSTEM_PROMPT: string
export function buildReadmePrompt(opts: ReadmePromptOptions): string
export function buildArchitecturePrompt(opts: ArchitecturePromptOptions): string
```

The system prompt must instruct Claude to:
1. Output a 12-column × 8-row grid system for positions
2. Stagger animationDelay values (title at 0ms, subsequent elements +150ms)
3. On diagram slides: shapes first, lines last (with delay > max shape delay + 400ms)
4. Keep line `fromElementId`/`toElementId` referencing only elements on the same slide
5. Use the theme colours consistently across all slides

### `slideAssembler.ts` — exports
```typescript
export function assembleSlides(generated: GeneratedPresentation): Slide[]
```

The assembler must:
1. Convert grid positions to pixels: `x = col × (CANVAS_WIDTH/12)`, `y = row × (CANVAS_HEIGHT/8)`
2. Set `size.width = position.width × CELL_W - PADDING*2`
3. For line elements: validate that `fromElementId` and `toElementId` exist on the same slide — drop invalid lines silently
4. After assembly, the caller must call `recalculateLines()` (handled in `AIChat.tsx`)
5. Populate every required field from your `SceneElement` type

---

## 13. Critical Constraints

1. **`ANTHROPIC_API_KEY` never reaches the browser.** API calls happen in
   TanStack Start server routes only. Never prefix with `VITE_`.

2. **Validate line references in `slideAssembler`.** Drop any `line` element
   whose `fromElementId` or `toElementId` does not reference a real element
   on the same slide. Do not crash — silently skip.

3. **Call `recalculateLines()` after importing generated slides.** Line
   geometry starts as defaults. `AIChat.tsx` already does this if
   `requiresLineRecalc` is true in the SSE response.

4. **AWS icon manifest must exist before running the app.** If
   `public/icons/aws/manifest.json` is missing, `useAwsIcons` will show an
   error. Run `node scripts/generate-aws-manifest.mjs` first.

5. **AWS icons render as `<img>` tags, not inline SVG.** Do not use
   `react-inlinesvg`. The Magic Move compositor interpolates the whole
   element's position and size — the icon cross-fades as part of the bitmap.

6. **Demo project uses `projects.length === 0`, not a localStorage flag.**
   The store's persisted `projects` array is the single source of truth.

7. **`AIChat` calls `recalculateLines()` after `addSlide()` completes.**
   Lines need real element positions to calculate geometry. The store's
   `recalculateLines()` action handles this.

8. **Rate-limit generation endpoints.** Add a simple in-memory counter or
   use TanStack Start middleware to limit generation requests to 5 per
   minute per IP to protect the Claude API key from runaway usage.

9. **Never expose raw API errors to the frontend.** Claude errors may
   contain internal details. Always catch and return a safe message string.

10. **The `createProject` action must navigate to the editor immediately**
    after creating the project. Do not require a separate navigation step.

---

## 14. Verification Plan

Run in this order after implementation:

1. **Manifest script:** Run `node scripts/generate-aws-manifest.mjs`. Confirm
   `public/icons/aws/manifest.json` exists with correct structure.

2. **AWS icon picker:** Select a shape element in the editor, change type to
   `aws-icon`, open the inspector. Confirm the icon picker loads, search works,
   selecting an icon updates the shape on canvas.

3. **AWS icon export:** Export a slide with an AWS icon to MP4. Confirm the
   icon is visible in the video.

4. **New project flow (first):** Clear all projects from the store. Create a
   new project. Confirm demo slides appear and autoplay is enabled.

5. **New project flow (subsequent):** With existing projects, create another.
   Confirm blank canvas.

6. **README generation:** Open AI Chat panel, select README mode, paste a
   short README. Click Generate. Confirm progress bar moves, slides appear in
   preview, "Add to Project" inserts them.

7. **Architecture generation (simple):** Type "React frontend connects to
   Express API which queries PostgreSQL." Generate. Confirm 3 shapes, arrows
   connecting them, slides open in editor.

8. **Line recalculation:** After importing architecture slides, move one shape.
   Confirm arrows follow it.

9. **Magic Move with AWS icons:** Duplicate a slide containing an AWS icon,
   move the icon to a different position. Set transition to Magic Move. Export.
   Confirm the icon animates between positions.

10. **Error handling:** Send an empty string to the architecture endpoint.
    Confirm a proper error message appears in the UI, no crash.

---

## 15. Implementation Checklist

### Setup
- [ ] Run `node scripts/generate-aws-manifest.mjs` and verify manifest exists
- [ ] Add `ANTHROPIC_API_KEY` to server `.env`
- [ ] Install new packages: `@anthropic-ai/sdk`, `zod-to-json-schema`, `marked`

### Types
- [ ] Add `AIChatMessage` to `packages/shared/src/types.ts`
- [ ] Add `aws-icon` to `ShapeType` union
- [ ] Add `iconPath`, `iconCategory`, `iconLabel` to `ShapeContent`

### Generation pipeline
- [ ] Create `app/lib/generation/slideGenerationSchema.ts`
- [ ] Create `app/lib/generation/markdownParser.ts`
- [ ] Create `app/lib/generation/architectureParser.ts`
- [ ] Create `app/lib/generation/promptBuilder.ts` (with `SYSTEM_PROMPT`)
- [ ] Create `app/lib/generation/generationClient.ts`
- [ ] Create `app/lib/generation/slideAssembler.ts`
  - [ ] Adjust canvas pixel dimensions to match your `getCanvasDimensions()`
  - [ ] Adjust element field names to match your actual `SceneElement` type
  - [ ] Add line reference validation

### API routes
- [ ] Create `app/routes/api/generate/readme.ts`
- [ ] Create `app/routes/api/generate/architecture.ts`
- [ ] Add rate limiting (5 req/min per IP)

### AI Store + UI
- [ ] Create `apps/web/src/store/slices/aiSlice.ts`
- [ ] Add `AISlice` to `EditorState` in `editorStore.ts`
- [ ] Create `apps/web/src/lib/generateClient.ts`
- [ ] Create `apps/web/src/components/editor/AIChat.tsx`
- [ ] Create `apps/web/src/components/editor/AIReadmeInput.tsx`
- [ ] Create `apps/web/src/components/editor/AIArchInput.tsx`
- [ ] Create `apps/web/src/components/editor/GenerationPreview.tsx`
- [ ] Mount `<AIChat />` in `routes/editor.$projectId.tsx`
- [ ] Add "Generate with AI" toggle button to editor toolbar

### AWS Icons
- [ ] Create `apps/web/src/hooks/useAwsIcons.ts`
- [ ] Create `apps/web/src/components/editor/AwsIconPicker.tsx`
- [ ] Modify `ShapeElement.tsx` to render `<img>` for `aws-icon` type
- [ ] Modify `ShapeSection.tsx` to show `AwsIconPicker` in inspector

### Project flow
- [ ] Modify `store/defaults.ts`: add `createDemoProject` and `createBlankProject`
- [ ] Modify `projectSlice.ts`: use `projects.length === 0` to decide which to use
- [ ] Set `DEFAULT_PLAYBACK_SETTINGS.autoplay = true`

### Verification
- [ ] Run all 10 steps in Section 14 in order