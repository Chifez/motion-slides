# MotionSlides — AI Generation Fix Guide

> **For the AI implementing these fixes:** This document is fully self-contained.
> Every file you need to create or modify is written out in full below.
> Read every section before writing any code. Apply all three fixes — they are
> independent but compound each other. Do not skip any section.

---

## What Is Broken and Why

Three distinct root causes producing three distinct symptoms:

| Symptom | Root Cause |
|---------|-----------|
| Sparse slides with only 1–2 elements, random element positions | System prompt had no layout templates or minimum density rules. AI invented layouts from scratch every call. |
| 404 errors for AWS icon paths | AI was guessing icon paths from memory. Real paths are deeply nested (`Architecture-Service-Icons_01302026/Arch_Compute/32/Arch_Amazon-EC2_32.svg`). AI cannot know this. |
| `Error: <path> attribute d: Expected moveto path command ('M' or 'm'), "undefined"` | Race condition in `LineElement.tsx`. The component renders before `recalculateLines()` has run, so `content.x1` etc. are `undefined`. The SVG path string becomes `"M undefined undefined..."`. |

---

## Fix 1 of 3 — System Prompt Rewrite

**File to replace:** `app/lib/generation/systemPrompt.ts`
(or `server/generation/promptBuilder.ts` — wherever your current system prompt lives)

**Why this fixes sparse layouts:** The old prompt described the grid abstractly
and listed rules as bullets. The AI had to invent layouts from scratch, producing
arbitrary element placement. The new prompt gives the AI 6 named layout templates
with exact coordinates to choose from, minimum content density rules, explicit
anti-patterns, and one complete few-shot example showing what "professional and
dense" means in concrete terms. The AI selects a template and fills it —
it no longer invents from nothing.

**Replace the entire file with this:**

```typescript
/**
 * systemPrompt.ts
 */

export const SYSTEM_PROMPT = `
<role>
You are a world-class presentation designer with expertise in information
architecture, visual hierarchy, and data-driven storytelling. You have
designed presentations for companies like Stripe, Linear, and Vercel.
Your slides are always dense with information, beautifully structured,
and immediately professional.
</role>

<output_rules>
You MUST output valid JSON only. No text before or after the JSON object.
Every required field in the schema must be present.
Do not add fields not in the schema.
</output_rules>

<canvas>
Canvas: 1920x1080px logical size.
Grid: 12 columns x 8 rows.
Cell: 160px wide x 135px tall.
Element position uses col (0-11), row (0-7), width (1-12), height (1-8).
All coordinates are in GRID UNITS, not pixels.
Padding: every element has 16px implicit padding inside its grid cell.
</canvas>

<layout_templates>
You MUST use one of these named layouts for every slide. Choose the layout
that best suits the content. Populate it with real, substantive content.

TEMPLATE: hero
  Purpose: title slides, section dividers
  Elements:
    - Large title:    col:1, row:2, width:10, height:2
    - Subtitle:       col:2, row:4, width:8,  height:1
    - Optional tag:   col:5, row:5, width:2,  height:1

TEMPLATE: split-content
  Purpose: most content slides — text left, visual or list right
  Elements:
    - Slide title:     col:0, row:0, width:12, height:1
    - Primary text:    col:0, row:1, width:6,  height:5
    - Secondary panel: col:7, row:1, width:5,  height:5
    - Footer note:     col:0, row:6, width:12, height:1

TEMPLATE: three-column
  Purpose: comparisons, features, options (always 3 items)
  Elements:
    - Slide title:    col:0, row:0, width:12, height:1
    - Column 1 head:  col:0, row:1, width:4,  height:1
    - Column 1 body:  col:0, row:2, width:4,  height:4
    - Column 2 head:  col:4, row:1, width:4,  height:1
    - Column 2 body:  col:4, row:2, width:4,  height:4
    - Column 3 head:  col:8, row:1, width:4,  height:1
    - Column 3 body:  col:8, row:2, width:4,  height:4

TEMPLATE: big-stat
  Purpose: highlight a key metric or quote
  Elements:
    - Context label:   col:3, row:1, width:6,  height:1
    - Big number/text: col:1, row:2, width:10, height:3
    - Supporting text: col:2, row:5, width:8,  height:1
    - Source:          col:4, row:6, width:4,  height:1

TEMPLATE: full-diagram
  Purpose: architecture diagrams, system maps
  Elements:
    - Slide title: col:0, row:0, width:12, height:1
    - (shapes and lines positioned within rows 1-6)
    - Caption:     col:0, row:7, width:12, height:1

TEMPLATE: code-showcase
  Purpose: code examples, CLI output, configuration
  Elements:
    - Slide title:  col:0, row:0, width:12, height:1
    - Code block:   col:0, row:1, width:8,  height:6
    - Explanation:  col:9, row:1, width:3,  height:6
    - Footer:       col:0, row:7, width:12, height:1
</layout_templates>

<content_density_rules>
MINIMUM CONTENT per slide type:

content slides:
  - Title element (required, at least 5 words)
  - At least 2 body/list text elements
  - Each body element: at least 20 words OR at least 3 full-sentence bullet points
  - Total elements per slide: at least 4

diagram slides:
  - Title element (required)
  - At least 4 shape or icon elements
  - At least 3 line elements connecting shapes
  - Caption element describing what the diagram shows

code slides:
  - Title element
  - Code element (at least 8 lines of real, runnable code — not pseudocode)
  - Explanation element (at least 3 bullet points describing what the code does)

hero/title slides:
  - Large title (at least 3 words)
  - Subtitle (at least 10 words describing the topic)

NEVER produce a slide with fewer than 3 elements.
NEVER leave more than 30% of the canvas empty on content slides.
NEVER use placeholder text like "Lorem ipsum", "Text here", or "Description goes here".
ALWAYS write real, substantive content derived from the input material.
</content_density_rules>

<animation_rules>
Stagger entrance animations. Every element must have animationDelay in milliseconds.

Default stagger order (top-to-bottom, left-to-right):
  Title element:            animationDelay: 0
  First content element:    animationDelay: 150
  Second content element:   animationDelay: 300
  Third content element:    animationDelay: 450
  (continue +150ms per element)

For DIAGRAM slides only:
  All shape/icon elements animate first, staggered by 200ms each.
  All line elements animate LAST.
  Line animationDelay MUST be greater than (number_of_shapes x 200) + 500.
  Example: 4 shapes -> lines start at (4 x 200) + 500 = 1300ms minimum.

Animation types by element role:
  title element    -> "fade-in"
  subtitle element -> "slide-up"
  heading element  -> "fade-in"
  body text        -> "slide-up"
  shape (diagram)  -> "pop" or "zoom-in"
  icon (diagram)   -> "zoom-in"
  line             -> "draw"
  code element     -> "fade-in"
</animation_rules>

<icon_rules>
You will receive an <available_icons> block containing the EXACT paths
for every available icon.

CRITICAL RULES:
  1. ONLY use paths from <available_icons>. Copy the path after the arrow exactly.
  2. Do NOT guess, invent, shorten, or modify paths in any way.
  3. If a service is not listed in <available_icons>, use a shape element instead.

Icon element format:
{
  "type": "icon",
  "id": "el-icon-ec2",
  "iconPath": "EXACT_PATH_COPIED_FROM_AVAILABLE_ICONS",
  "label": "Amazon EC2",
  "position": { "col": 2, "row": 2, "width": 2, "height": 2 },
  "animation": "zoom-in",
  "animationDelay": 200
}
</icon_rules>

<anti_patterns>
NEVER do any of the following:

- Sparse slides: every content/diagram/code slide must meet the density rules above
- Random element placement: always use a named layout template from <layout_templates>
- Guessing icon paths: only use paths copied exactly from <available_icons>
- Single-element slides (except hero slides which are intentionally minimal)
- Vague body text like "Key feature here" or "Add description"
- Overlapping elements: no two elements may share the same grid cells
- Line elements referencing element IDs from a different slide
- animationDelay on lines that is lower than all shape animationDelays on the same slide
</anti_patterns>

<few_shot_example>
This is a complete, well-formed content slide. It demonstrates correct element
count, real prose, layout template usage, and animation staggering.
Use this as your reference for what "professional and dense" means.

{
  "id": "slide-redis",
  "title": "Redis Caching Layer",
  "role": "content",
  "layout": "split-content",
  "background": "#0f0f13",
  "elements": [
    {
      "type": "text",
      "id": "el-title",
      "content": "Redis Caching Layer",
      "role": "heading",
      "position": { "col": 0, "row": 0, "width": 12, "height": 1 },
      "style": { "fontSize": "2xl", "fontWeight": "bold", "color": "#f4f4f5", "align": "left" },
      "animation": "fade-in",
      "animationDelay": 0
    },
    {
      "type": "text",
      "id": "el-body-left",
      "content": "Redis sits between the application layer and PostgreSQL, serving as an in-memory cache for frequently accessed data. Cache hits return in under 1ms compared to 20-50ms for database queries. The system uses a write-through strategy: every database write also updates the Redis key, keeping cache and database in sync. TTL values are set per data type: 5 minutes for user sessions, 1 hour for product listings, 24 hours for static reference data.",
      "role": "body",
      "position": { "col": 0, "row": 1, "width": 6, "height": 5 },
      "style": { "fontSize": "md", "color": "#a1a1aa", "align": "left" },
      "animation": "slide-up",
      "animationDelay": 150
    },
    {
      "type": "text",
      "id": "el-right-heading",
      "content": "Key Design Decisions",
      "role": "heading",
      "position": { "col": 7, "row": 1, "width": 5, "height": 1 },
      "style": { "fontSize": "lg", "fontWeight": "semibold", "color": "#f4f4f5" },
      "animation": "fade-in",
      "animationDelay": 300
    },
    {
      "type": "text",
      "id": "el-right-body",
      "content": "Write-through over write-back avoids stale reads at the cost of slightly higher write latency, which is acceptable for this workload.\nCluster mode enabled across 3 primary shards with one replica each ensures no single point of failure.\nEviction policy allkeys-lru automatically removes least recently used keys when memory pressure exceeds 80%.\nKeyspace notifications allow the application to subscribe to expiry events and invalidate related cache keys proactively.",
      "role": "body",
      "position": { "col": 7, "row": 2, "width": 5, "height": 4 },
      "style": { "fontSize": "sm", "color": "#a1a1aa", "align": "left" },
      "animation": "slide-up",
      "animationDelay": 450
    },
    {
      "type": "text",
      "id": "el-footer",
      "content": "Cache hit rate: 94%   |   Average latency: 0.8ms   |   Cluster memory: 32GB",
      "role": "caption",
      "position": { "col": 0, "row": 6, "width": 12, "height": 1 },
      "style": { "fontSize": "xs", "color": "#52525b", "align": "center" },
      "animation": "fade-in",
      "animationDelay": 600
    }
  ],
  "transition": { "type": "fade", "duration": 600, "easing": "easeInOut" }
}

Notice: 5 elements, substantive prose with specific numbers, named layout template,
staggered animations starting at 0ms, real content derived from the topic, no empty space.
</few_shot_example>
`.trim()

// ─── Prompt builders ──────────────────────────────────────────────────────────

export interface ReadmePromptOptions {
  briefing:        string
  slideCount:      number
  style:           'technical' | 'executive' | 'tutorial'
  theme:           'dark' | 'light' | 'auto'
  availableIcons?: string
}

export function buildReadmePrompt(opts: ReadmePromptOptions): string {
  const themeDesc = opts.theme === 'dark'
    ? 'Dark background (#0f0f13), light text (#f4f4f5), accent blue (#3b82f6)'
    : 'Light background (#fafafa), dark text (#18181b), accent blue (#2563eb)'

  const styleDesc = {
    technical:  'Technical — include code samples, exact numbers, implementation details. Audience: engineers.',
    executive:  'Executive — focus on outcomes, business value, and risk. No code. Use percentages and impact statements. Audience: decision-makers.',
    tutorial:   'Tutorial — step-by-step numbered instructions, annotated examples. Audience: developers learning the topic.',
  }[opts.style]

  return `
Generate a complete slide presentation from the following README analysis.

<style_config>
Tone: ${styleDesc}
Theme: ${themeDesc}
Maximum slides: ${opts.slideCount}
</style_config>

<readme_analysis>
${opts.briefing}
</readme_analysis>

${opts.availableIcons ? `<available_icons>\n${opts.availableIcons}\n</available_icons>` : ''}

<requirements>
1. First slide: hero layout, role: title, project name as large title and tagline as subtitle
2. One slide per major README section (## level headings)
3. Include a code-showcase slide for every significant code block in the README
4. Last slide: role: summary, layout: three-column or split-content, at least 5 key takeaways
5. Use ONLY the named layout templates defined in the system prompt
6. Every content slide must have at least 4 elements with real, substantive text
7. Do not invent facts not present in the README
</requirements>

Generate the complete GeneratedPresentation JSON now.
`.trim()
}

export interface ArchitecturePromptOptions {
  briefing:       string
  diagramStyle:   'generic' | 'aws' | 'gcp' | 'minimal'
  slideCount:     number
  theme:          'dark' | 'light' | 'auto'
  availableIcons: string
}

export function buildArchitecturePrompt(opts: ArchitecturePromptOptions): string {
  const themeDesc = opts.theme === 'dark'
    ? 'Dark background (#0f0f13)'
    : 'Light background (#fafafa)'

  const styleDesc = {
    aws:     'AWS style — use exact AWS service names (EC2, Lambda, RDS, S3). Use icon elements from <available_icons>. Include region annotations.',
    gcp:     'GCP style — use exact GCP service names (Cloud Run, BigQuery, Pub/Sub, Cloud SQL). Use icon elements where available.',
    minimal: 'Minimal — monochrome, rectangles and arrows only, no icons, text labels only.',
    generic: 'Generic — colour-coded by layer. Frontend: #3b82f6, Backend: #8b5cf6, Database: #10b981, Queue: #f59e0b, External: #6b7280.',
  }[opts.diagramStyle]

  return `
Generate architectural diagram slides from the following system description.

<style_config>
Diagram style: ${styleDesc}
Theme: ${themeDesc}
Maximum slides: ${opts.slideCount}
</style_config>

<architecture_analysis>
${opts.briefing}
</architecture_analysis>

<available_icons>
${opts.availableIcons}
</available_icons>

<requirements>
1. First slide: hero layout, role: title, system name and one-sentence description
2. At least one full-diagram layout slide showing the complete architecture
3. For systems with more than 6 components: one diagram slide per logical layer
4. Every diagram slide must have at least 4 shapes or icons, at least 3 lines, a title, and a caption
5. Use icon elements from <available_icons> for AWS and GCP components (exact paths only)
6. Shape guide: rectangle=service/API, cylinder=database, hexagon=queue/event-bus, rounded-rectangle=frontend/client, diamond=gateway
7. All line elements must have animationDelay greater than (number_of_shapes x 200) + 500
8. Last slide: role: content, layout: three-column, listing the key architectural decisions made
</requirements>

Generate the complete GeneratedPresentation JSON now.
`.trim()
}
```

---

## Fix 2 of 3 — Icon Path RAG Injection

**Files to create:**
- `app/lib/generation/iconResolver.ts` (new file — create it)

**Files to update:**
- `app/lib/generation/generationClient.ts` (update existing file)
- `app/lib/generation/slideGenerationSchema.ts` (add `AIIconElement` to schema)
- `app/routes/api/generate/readme.ts` (update function call)
- `app/routes/api/generate/architecture.ts` (update function call)

**Why this fixes 404 icon errors:** The AI cannot know your icon file paths —
they depend on the specific AWS icon pack version you downloaded and how it was
extracted. The industry solution is RAG (Retrieval-Augmented Generation): read
the real paths from the manifest file, select the most relevant ones based on
the user's input text, and inject them directly into the prompt. The AI then
copies the exact path string instead of guessing. A fuzzy-match fallback in the
assembler catches any minor deviations (wrong case, truncated path).

---

### File to CREATE: `app/lib/generation/iconResolver.ts`

Create this file in full:

```typescript
/**
 * iconResolver.ts
 *
 * Two responsibilities:
 *   1. buildIconHotlist() — called before generation. Reads the manifest,
 *      selects relevant icons based on the user's input text, injects them
 *      into the prompt so the AI copies exact paths.
 *
 *   2. resolveIconPath() — called in the assembler. Fuzzy-matches any
 *      AI-generated path against the full manifest and returns the closest
 *      valid path, or a fallback shape type if nothing matches.
 */

import fs   from 'fs'
import path from 'path'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AwsIcon {
  id:       string
  label:    string
  path:     string
  category: string
  keywords: string[]
}

export interface AwsManifest {
  version:    number
  totalIcons: number
  categories: Array<{
    id:    string
    label: string
    icons: AwsIcon[]
  }>
}

export type IconResolution =
  | { found: true;  path: string; label: string; category: string }
  | { found: false; fallback: 'rectangle' | 'cylinder' | 'hexagon' | 'rounded-rectangle' }

// ─── Manifest cache ────────────────────────────────────────────────────────────

let   _loaded    = false
let   _allIcons: AwsIcon[] = []
const _byId      = new Map<string, AwsIcon>()
const _byLabel   = new Map<string, AwsIcon>()

function loadManifest(): void {
  if (_loaded) return

  const manifestPath = path.resolve(process.cwd(), 'public', 'icons', 'aws', 'manifest.json')

  if (!fs.existsSync(manifestPath)) {
    console.warn('[IconResolver] manifest.json not found. Run: node scripts/generate-aws-manifest.mjs')
    _loaded = true
    return
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as AwsManifest
  _allIcons = manifest.categories.flatMap(c => c.icons)

  for (const icon of _allIcons) {
    _byId.set(icon.id, icon)
    _byLabel.set(icon.label.toLowerCase(), icon)
    // Also index by short name without "Amazon " or "AWS " prefix
    const short = icon.label.replace(/^(Amazon|AWS) /i, '').toLowerCase()
    _byLabel.set(short, icon)
  }

  _loaded = true
  console.log(`[IconResolver] Loaded ${_allIcons.length} icons`)
}

// ─── Prompt injection ─────────────────────────────────────────────────────────

// These icons are always included regardless of the user's input
const UNIVERSAL_HOTLIST = [
  'amazon-ec2', 'aws-lambda', 'amazon-ecs', 'aws-fargate', 'amazon-eks',
  'amazon-rds', 'amazon-dynamodb', 'amazon-aurora', 'amazon-elasticache',
  'amazon-redshift', 'amazon-s3', 'amazon-efs', 'amazon-cloudfront',
  'amazon-route-53', 'elastic-load-balancing', 'aws-api-gateway',
  'amazon-sqs', 'amazon-sns', 'amazon-eventbridge', 'amazon-kinesis',
  'aws-iam', 'amazon-cognito', 'amazon-cloudwatch', 'amazon-vpc',
  'amazon-sagemaker', 'amazon-bedrock', 'amazon-ecr', 'aws-codepipeline',
]

/**
 * Build the <available_icons> text block to inject into the AI prompt.
 * Pass the user's raw input text so we can select contextually relevant icons.
 */
export function buildIconHotlist(userInput: string): string {
  loadManifest()

  if (_allIcons.length === 0) {
    return '(No icons available. Use shape elements only.)'
  }

  const selected = new Map<string, AwsIcon>()

  // 1. Always include the universal hotlist
  for (const id of UNIVERSAL_HOTLIST) {
    const icon = _byId.get(id)
    if (icon) selected.set(icon.id, icon)
  }

  // 2. Add icons whose keywords match words in the user's input
  const inputWords = userInput
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2)

  for (const icon of _allIcons) {
    if (selected.has(icon.id)) continue
    const matches =
      icon.keywords.some(k => inputWords.includes(k)) ||
      inputWords.some(w => icon.label.toLowerCase().includes(w))
    if (matches) selected.set(icon.id, icon)
  }

  // 3. Format as "Label -> path" for the AI to copy
  const lines: string[] = []
  const byCategory = new Map<string, AwsIcon[]>()

  for (const icon of selected.values()) {
    if (!byCategory.has(icon.category)) byCategory.set(icon.category, [])
    byCategory.get(icon.category)!.push(icon)
  }

  for (const [cat, icons] of byCategory.entries()) {
    lines.push(`# ${cat}`)
    for (const icon of icons) {
      lines.push(`${icon.label} -> ${icon.path}`)
    }
    lines.push('')
  }

  lines.push('RULES:')
  lines.push('- Copy the path after -> EXACTLY, character for character')
  lines.push('- If a service is not listed above, use a shape element instead')
  lines.push('- Never modify, abbreviate, or guess any path')

  return lines.join('\n')
}

// ─── Assembler fuzzy-match ────────────────────────────────────────────────────

/**
 * Called in slideAssembler.ts for every icon element the AI outputs.
 * Tries to match the AI's path against the manifest using multiple strategies.
 * Returns the real path if found, or a fallback shape type if not.
 */
export function resolveIconPath(rawPath: string): IconResolution {
  loadManifest()

  if (!rawPath || _allIcons.length === 0) {
    return { found: false, fallback: 'rectangle' }
  }

  // Strategy 1: Exact match
  const exact = _allIcons.find(i => i.path === rawPath)
  if (exact) return { found: true, path: exact.path, label: exact.label, category: exact.category }

  // Strategy 2: Case-insensitive match
  const lower = rawPath.toLowerCase()
  const caseMatch = _allIcons.find(i => i.path.toLowerCase() === lower)
  if (caseMatch) return { found: true, path: caseMatch.path, label: caseMatch.label, category: caseMatch.category }

  // Strategy 3: Match by filename substring (AI may omit the folder prefix)
  const filename = rawPath.split('/').pop()?.toLowerCase().replace('.svg', '') ?? ''
  if (filename) {
    const fileMatch = _allIcons.find(i =>
      i.path.toLowerCase().includes(filename)
    )
    if (fileMatch) return { found: true, path: fileMatch.path, label: fileMatch.label, category: fileMatch.category }
  }

  // Strategy 4: Match by label derived from the raw path
  const pathWords = rawPath
    .split('/').pop()?.replace('.svg', '')
    .replace(/[-_]/g, ' ').toLowerCase() ?? ''
  const labelMatch = _byLabel.get(pathWords)
  if (labelMatch) return { found: true, path: labelMatch.path, label: labelMatch.label, category: labelMatch.category }

  // Strategy 5: Keyword match — any word in the path matching an icon keyword
  const words = pathWords.split(/\s+/).filter(w => w.length > 2)
  for (const word of words) {
    const kwMatch = _allIcons.find(i => i.keywords.includes(word))
    if (kwMatch) return { found: true, path: kwMatch.path, label: kwMatch.label, category: kwMatch.category }
  }

  // Strategy 6: No match — infer fallback shape from path content
  console.warn(`[IconResolver] No match for "${rawPath}" — using fallback shape`)
  return { found: false, fallback: inferFallbackShape(rawPath) }
}

function inferFallbackShape(rawPath: string): IconResolution & { found: false } {
  const l = rawPath.toLowerCase()
  if (l.includes('database') || l.includes('rds') || l.includes('dynamo') ||
      l.includes('aurora') || l.includes('sql') || l.includes('db'))
    return { found: false, fallback: 'cylinder' }
  if (l.includes('queue') || l.includes('sqs') || l.includes('sns') ||
      l.includes('kafka') || l.includes('eventbridge') || l.includes('pubsub'))
    return { found: false, fallback: 'hexagon' }
  if (l.includes('frontend') || l.includes('client') || l.includes('browser') ||
      l.includes('mobile') || l.includes('react') || l.includes('vue'))
    return { found: false, fallback: 'rounded-rectangle' }
  return { found: false, fallback: 'rectangle' }
}
```

---

### Update `app/lib/generation/slideGenerationSchema.ts`

Add the `AIIconElement` type to the discriminated union. Find the existing
`AIElement` discriminated union and add the icon element to it:

```typescript
// ADD this new element schema alongside the existing ones:
const AIIconElement = z.object({
  type:           z.literal('icon'),
  id:             z.string().min(1),
  iconPath:       z.string().min(1),   // AI copies this from <available_icons>
  label:          z.string().optional(),
  position:       AIPosition,
  animation:      AnimationType.optional(),
  animationDelay: z.number().int().min(0).max(5000).optional(),
})

// MODIFY the AIElement union to include it:
// BEFORE:
const AIElement = z.discriminatedUnion('type', [
  AITextElement,
  AIShapeElement,
  AICodeElement,
  AILineElement,
])

// AFTER:
const AIElement = z.discriminatedUnion('type', [
  AITextElement,
  AIShapeElement,
  AICodeElement,
  AILineElement,
  AIIconElement,   // <-- add this line
])
```

---

### Update `app/lib/generation/generationClient.ts`

Replace the entire file with this updated version that injects icon paths
and uses `temperature: 0.3` for stable structured JSON output:

```typescript
/**
 * generationClient.ts — Updated
 *
 * Key changes:
 * 1. Calls buildIconHotlist() before building each prompt
 * 2. temperature: 0.3 — lower temperature reduces JSON format drift
 * 3. Mode-specific functions replace the generic generatePresentation()
 */

import Anthropic              from '@anthropic-ai/sdk'
import { zodToJsonSchema }    from 'zod-to-json-schema'
import {
  GeneratedPresentationSchema,
  type GeneratedPresentation,
}                             from './slideGenerationSchema'
import {
  SYSTEM_PROMPT,
  buildReadmePrompt,
  buildArchitecturePrompt,
}                             from './systemPrompt'
import { buildIconHotlist }   from './iconResolver'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// ── README mode ───────────────────────────────────────────────────────────────

export interface ReadmeGenerationOptions {
  briefing:    string
  rawMarkdown: string   // original markdown for keyword-based icon selection
  slideCount:  number
  style:       'technical' | 'executive' | 'tutorial'
  theme:       'dark' | 'light' | 'auto'
}

export async function generateFromReadme(
  opts: ReadmeGenerationOptions,
): Promise<GeneratedPresentation> {
  const availableIcons = buildIconHotlist(opts.rawMarkdown)
  const userPrompt = buildReadmePrompt({
    briefing:      opts.briefing,
    slideCount:    opts.slideCount,
    style:         opts.style,
    theme:         opts.theme,
    availableIcons,
  })
  return callClaude(userPrompt, 8_000)
}

// ── Architecture mode ─────────────────────────────────────────────────────────

export interface ArchGenerationOptions {
  briefing:     string
  rawInput:     string   // original description for keyword-based icon selection
  diagramStyle: 'generic' | 'aws' | 'gcp' | 'minimal'
  slideCount:   number
  theme:        'dark' | 'light' | 'auto'
}

export async function generateFromArchitecture(
  opts: ArchGenerationOptions,
): Promise<GeneratedPresentation> {
  const availableIcons = buildIconHotlist(opts.rawInput)
  const userPrompt = buildArchitecturePrompt({
    briefing:      opts.briefing,
    diagramStyle:  opts.diagramStyle,
    slideCount:    opts.slideCount,
    theme:         opts.theme,
    availableIcons,
  })
  return callClaude(userPrompt, 12_000)
}

// ── Core Claude call ──────────────────────────────────────────────────────────

async function callClaude(
  userPrompt: string,
  maxTokens:  number,
): Promise<GeneratedPresentation> {
  const jsonSchema = zodToJsonSchema(GeneratedPresentationSchema, {
    name: 'GeneratedPresentation', target: 'openApi3',
  })

  const response = await client.messages.create({
    model:       'claude-sonnet-4-6',
    max_tokens:  maxTokens,
    temperature: 0.3,   // lower = more consistent JSON structure
    system:      SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
    output_config: {
      format: {
        type:   'json_schema',
        schema: (jsonSchema as any).definitions?.GeneratedPresentation ?? jsonSchema,
      },
    },
  } as any)

  const raw = response.content[0]
  if (raw.type !== 'text') throw new Error('Unexpected Claude response type')

  const parsed = GeneratedPresentationSchema.safeParse(JSON.parse(raw.text))
  if (!parsed.success) throw new Error(`Schema validation failed: ${parsed.error.message}`)

  return parsed.data
}
```

---

### Update the API Routes

In `app/routes/api/generate/readme.ts`, update the generation call:

```typescript
// REMOVE this import:
import { generatePresentation } from '~/lib/generation/generationClient'

// ADD this import:
import { generateFromReadme } from '~/lib/generation/generationClient'

// REPLACE the generatePresentation call with:
const generated = await generateFromReadme({
  briefing:    briefing,
  rawMarkdown: markdown,   // pass the original markdown text
  slideCount:  options.slideCount ?? 10,
  style:       options.style      ?? 'technical',
  theme:       options.theme      ?? 'dark',
})
```

In `app/routes/api/generate/architecture.ts`, update the generation call:

```typescript
// REMOVE this import:
import { generatePresentation } from '~/lib/generation/generationClient'

// ADD this import:
import { generateFromArchitecture } from '~/lib/generation/generationClient'

// REPLACE the generatePresentation call with:
const generated = await generateFromArchitecture({
  briefing:     briefing,
  rawInput:     description,   // pass the original description text
  diagramStyle: options.diagramStyle ?? 'generic',
  slideCount:   options.slideCount   ?? 6,
  theme:        options.theme        ?? 'dark',
})
```

---

### Update `app/lib/generation/slideAssembler.ts`

The assembler needs to handle the new `icon` element type and call
`resolveIconPath()`. Find the `switch (aiEl.type)` statement in your
existing assembler and add this case:

```typescript
// ADD this import at the top of slideAssembler.ts:
import { resolveIconPath } from './iconResolver'

// ADD this case to the switch statement in assembleElement():
case 'icon': {
  const resolved = resolveIconPath((aiEl as any).iconPath ?? '')

  if (resolved.found) {
    // Render as an aws-icon shape element
    return {
      ...base,
      type: 'shape',
      content: {
        shape:        'aws-icon',
        iconPath:     resolved.path,
        iconLabel:    resolved.label,
        iconCategory: resolved.category,
        label:        (aiEl as any).label ?? resolved.label,
        sublabel:     '',
        fill:         'transparent',
        stroke:       theme.secondaryColor,
        strokeWidth:  0,
        opacity:      1,
      },
    }
  } else {
    // Icon not matched — fall back to appropriate shape type
    console.warn(`[Assembler] Icon not resolved, using shape "${resolved.fallback}"`)
    return {
      ...base,
      type: 'shape',
      content: {
        shape:       resolved.fallback,
        label:       (aiEl as any).label ?? '',
        sublabel:    '',
        fill:        theme.primaryColor,
        stroke:      theme.secondaryColor,
        strokeWidth: 2,
        opacity:     1,
      },
    }
  }
}
```

Also add this post-processing step at the end of your `assembleSlide()`
function, AFTER elements are assembled but BEFORE the slide is returned.
This enforces the animation ordering rule for diagram slides:

```typescript
// ADD this function to slideAssembler.ts:
function enforceLineAnimationOrder(elements: any[], slideRole: string): any[] {
  if (slideRole !== 'diagram') return elements

  const shapeDelays = elements
    .filter(el => el.type === 'shape')
    .map(el => el.animation?.delay ?? 0)

  if (shapeDelays.length === 0) return elements

  const maxShapeDelay = Math.max(...shapeDelays)
  const lineBaseDelay = maxShapeDelay + 500
  let   lineOffset    = 0

  return elements.map(el => {
    if (el.type !== 'line') return el
    const currentDelay = el.animation?.delay ?? 0
    if (currentDelay >= lineBaseDelay) return el
    const corrected = lineBaseDelay + lineOffset
    lineOffset += 150
    return { ...el, animation: { ...el.animation, delay: corrected } }
  })
}

// CALL it inside assembleSlide(), after assembling elements and before returning:
const elementsWithFixedAnims = enforceLineAnimationOrder(validatedElements, aiSlide.role)
```

---

## Fix 3 of 3 — Line Race Condition

**File to replace:** `apps/web/src/components/editor/elements/LineElement.tsx`
(or wherever your line element component lives)

**Why this crashes:** When slides are generated and inserted into the store,
line elements have their `startConnection` and `endConnection` set correctly,
but their `content.x1`, `content.y1`, `content.x2`, `content.y2` start as `0`
or `undefined`. `recalculateLines()` must run after insertion to compute real
coordinates. But `LineElement` renders immediately on mount and tries to build
an SVG path from those unresolved values, producing `d="M undefined undefined"`.

**Replace the entire file with this:**

```tsx
/**
 * LineElement.tsx
 *
 * Three guards prevent the "undefined path" SVG error:
 *   Guard 1 — hasValidCoordinates() returns false if coords are missing/zero
 *   Guard 2 — toSafeNum() converts any non-finite value to 0
 *   Guard 3 — minimum length check after scaling to pixels
 *
 * While coordinates are unresolved, renders an invisible placeholder div.
 * Once recalculateLines() runs and updates the store, the component re-renders
 * with valid coordinates and draws the line normally.
 */

import React  from 'react'
import type { SceneElement, LineContent } from '@/types'

interface Props {
  element:      SceneElement
  isSelected:   boolean
  isExporting?: boolean
}

// Convert any value to a safe finite number
function toSafeNum(v: unknown): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

// Returns false if coordinates are unresolved or degenerate
function hasValidCoordinates(content: LineContent): boolean {
  const x1 = toSafeNum(content.x1)
  const y1 = toSafeNum(content.y1)
  const x2 = toSafeNum(content.x2)
  const y2 = toSafeNum(content.y2)

  // All-zero = recalculateLines() has not run yet
  if (x1 === 0 && y1 === 0 && x2 === 0 && y2 === 0) return false

  // Check for actual length — degenerate lines cannot be drawn
  const dx = x2 - x1
  const dy = y2 - y1
  return (dx * dx + dy * dy) > 4   // must be longer than 2px
}

export function LineElement({ element, isSelected, isExporting = false }: Props) {
  const content = element.content as LineContent

  // ── Guard 1: return placeholder if coords not yet resolved ────────────────
  if (!hasValidCoordinates(content)) {
    return (
      <div
        style={{
          position:      'absolute',
          left:          element.position.x,
          top:           element.position.y,
          width:         Math.max(element.size.width,  1),
          height:        Math.max(element.size.height, 1),
          pointerEvents: 'none',
        }}
        data-line-pending="true"
        aria-hidden="true"
      />
    )
  }

  // ── Guard 2: safe numeric conversion ─────────────────────────────────────
  const x1 = toSafeNum(content.x1)
  const y1 = toSafeNum(content.y1)
  const x2 = toSafeNum(content.x2)
  const y2 = toSafeNum(content.y2)

  const w = Math.max(element.size.width,  1)
  const h = Math.max(element.size.height, 1)

  // x1/y1/x2/y2 are normalised (0-1). Scale to pixel coords.
  const px1 = x1 * w
  const py1 = y1 * h
  const px2 = x2 * w
  const py2 = y2 * h

  // ── Guard 3: minimum length after scaling ─────────────────────────────────
  const dx = px2 - px1
  const dy = py2 - py1
  if (dx * dx + dy * dy < 4) return null

  // ── Style values ──────────────────────────────────────────────────────────
  const lineStyle   = (content as any).style       ?? 'solid'
  const direction   = (content as any).direction   ?? 'one-way'
  const strokeColor = (content as any).color       ?? '#94a3b8'
  const strokeWidth = (content as any).strokeWidth ?? 2
  const label       = content.label ?? ''

  const strokeDasharray =
    lineStyle === 'dashed' ? '8 4' :
    lineStyle === 'dotted' ? '2 4' :
    undefined

  const markerId      = `arrow-end-${element.id}`
  const markerIdStart = `arrow-start-${element.id}`
  const showEndArrow   = direction === 'one-way' || direction === 'two-way'
  const showStartArrow = direction === 'two-way'

  const midX = (px1 + px2) / 2
  const midY = (py1 + py2) / 2

  return (
    <div
      style={{
        position:      'absolute',
        left:          element.position.x,
        top:           element.position.y,
        width:         w,
        height:        h,
        pointerEvents: isExporting ? 'none' : 'auto',
        outline:       isSelected ? '1px solid #3b82f6' : 'none',
        outlineOffset: '2px',
      }}
    >
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        style={{ display: 'block', overflow: 'visible' }}
      >
        <defs>
          {showEndArrow && (
            <marker
              id={markerId}
              markerWidth="10" markerHeight="7"
              refX="9" refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill={strokeColor} />
            </marker>
          )}
          {showStartArrow && (
            <marker
              id={markerIdStart}
              markerWidth="10" markerHeight="7"
              refX="1" refY="3.5"
              orient="auto-start-reverse"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill={strokeColor} />
            </marker>
          )}
        </defs>

        {/* Wide invisible hit area for easier selection */}
        {!isExporting && (
          <line
            x1={px1} y1={py1} x2={px2} y2={py2}
            stroke="transparent"
            strokeWidth={Math.max(strokeWidth + 12, 16)}
            style={{ cursor: 'pointer' }}
          />
        )}

        {/* Visible line */}
        <line
          x1={px1} y1={py1} x2={px2} y2={py2}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          markerEnd={showEndArrow   ? `url(#${markerId})`      : undefined}
          markerStart={showStartArrow ? `url(#${markerIdStart})` : undefined}
        />

        {/* Inline label */}
        {label && (
          <g transform={`translate(${midX}, ${midY})`}>
            <rect
              x={-(label.length * 3.5)}
              y="-10"
              width={label.length * 7}
              height="20"
              rx="3"
              fill="#1e1e2e"
              opacity="0.85"
            />
            <text
              x="0" y="0"
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="11"
              fill={strokeColor}
              fontFamily="ui-monospace, monospace"
            >
              {label}
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}
```

---

### One additional line fix — call order in `AIChat.tsx`

Find where you call `addSlide()` and `recalculateLines()` in your `AIChat.tsx`
or wherever slides are imported from the preview into the store.

Change the call order so `recalculateLines()` is called **once after all
slides are added**, not once per slide:

```typescript
// WRONG — recalculates before subsequent slides' elements are in the store:
pendingSlides.forEach(slide => {
  addSlide(slide)
  recalculateLines()
})

// CORRECT — all slides added first, then one recalculation:
pendingSlides.forEach(slide => addSlide(slide))
recalculateLines()
```

---

## Implementation Checklist

Work through these in order. Do not skip ahead.

### Fix 1 — System Prompt
- [ ] Replace `systemPrompt.ts` (or `promptBuilder.ts`) with the new version above
- [ ] Confirm `buildReadmePrompt` and `buildArchitecturePrompt` now accept `availableIcons?: string`
- [ ] Test: generate a README presentation, verify each slide has at least 4 elements

### Fix 2 — Icon Paths
- [ ] Verify `public/icons/aws/manifest.json` exists — if not, run `node scripts/generate-aws-manifest.mjs`
- [ ] Create `app/lib/generation/iconResolver.ts` with the full code above
- [ ] Add `AIIconElement` to the discriminated union in `slideGenerationSchema.ts`
- [ ] Replace `generationClient.ts` with the updated version above
- [ ] Update `app/routes/api/generate/readme.ts` to use `generateFromReadme()`
- [ ] Update `app/routes/api/generate/architecture.ts` to use `generateFromArchitecture()`
- [ ] Add the `icon` case to `slideAssembler.ts` `assembleElement()` switch
- [ ] Add `enforceLineAnimationOrder()` to `slideAssembler.ts` and call it in `assembleSlide()`
- [ ] Test: generate an architecture slide, open DevTools Network tab, confirm zero 404s

### Fix 3 — Line Race Condition
- [ ] Replace `LineElement.tsx` with the new version above
- [ ] Fix `recalculateLines()` call order in `AIChat.tsx` (all slides first, then one call)
- [ ] Test: generate architecture slides, confirm no errors in the browser console
- [ ] Test: manually draw a new line between two shapes, confirm no error on first render

### Regression test after all three fixes
- [ ] Generate a README presentation — confirm dense, well-laid-out slides with real content
- [ ] Generate an architecture diagram — confirm icons render correctly, arrows connect shapes
- [ ] Export the generated presentation to MP4 — confirm no visual artifacts in the video
- [ ] Open browser console during all of the above — confirm zero errors