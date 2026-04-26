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

  // Adjusted for monorepo structure
  const manifestPath = path.resolve(process.cwd(), 'apps', 'web', 'public', 'icons', 'aws', 'manifest.json')

  if (!fs.existsSync(manifestPath)) {
    console.warn(`[IconResolver] manifest.json not found at ${manifestPath}.`)
    _loaded = true
    return
  }

  try {
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
  } catch (err) {
    console.error(`[IconResolver] Failed to load manifest:`, err)
    _loaded = true
  }
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
