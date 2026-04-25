/**
 * generate-icon-manifest.mjs
 *
 * Run this to scan a provider folder (e.g. public/icons/aws)
 * and produce a manifest.json in that same folder.
 *
 * Usage:
 *   node scripts/generate-icon-manifest.mjs aws
 *   node scripts/generate-icon-manifest.mjs gcp
 */

import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname  = path.dirname(fileURLToPath(import.meta.url))
const ROOT       = path.resolve(__dirname, '..')

const PROVIDER = process.argv[2]
if (!PROVIDER) {
  console.error('❌  Please specify a provider (e.g. node scripts/generate-icon-manifest.mjs aws)')
  process.exit(1)
}

const ICONS_ROOT = path.join(ROOT, 'public', 'icons', PROVIDER)
const OUT_FILE   = path.join(ICONS_ROOT, 'manifest.json')

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Recursively walk a directory, returning all file paths. */
function walk(dir) {
  const results = []
  if (!fs.existsSync(dir)) return results
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) results.push(...walk(full))
    else results.push(full)
  }
  return results
}

/**
 * Extract a human-readable label from the raw AWS filename.
 *
 * AWS filenames look like:
 *   Arch_Amazon-EC2_32.svg
 *   Arch_AWS-Lambda_32.svg
 *   Res_Amazon-S3_Bucket_48.svg
 *
 * We strip the prefix (Arch_, Res_), the size suffix (_32, _48, _64),
 * and clean up hyphens/underscores.
 */
function labelFromFilename(filename) {
  let name = path.basename(filename, '.svg')

  // Strip Arch_ or Res_ prefix
  name = name.replace(/^(Arch|Res)_/, '')

  // Strip trailing _32 / _48 / _64 / _16
  name = name.replace(/_\d+$/, '')

  // Replace hyphens and underscores with spaces
  name = name.replace(/[-_]/g, ' ')

  // Title-case
  name = name.replace(/\b\w/g, c => c.toUpperCase())

  return name.trim()
}

/**
 * Normalise a folder name to a category id and label.
 * AWS category folders have names like:
 *   "Compute", "Storage", "Database", "Management & Governance"
 */
function normaliseCategory(folderName) {
  // Strip leading numbers sometimes present: "01_Compute" → "Compute"
  const clean = folderName.replace(/^\d+[-_\s]*/, '').trim()
  const id    = clean.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')
  const label = clean
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
  return { id, label }
}

/**
 * Build keyword list for an icon — used by the inspector search box.
 */
function buildKeywords(label, categoryLabel, filename) {
  const words = new Set([
    ...label.toLowerCase().split(/\s+/),
    ...categoryLabel.toLowerCase().split(/\s+/),
    // Pull acronym from filename (e.g. EC2, S3, RDS, VPC)
    ...(filename.match(/[A-Z0-9]{2,}/g) ?? []).map(w => w.toLowerCase()),
  ])
  // Remove noise words
  ;['amazon', 'aws', 'arch', 'res', 'the', 'and', 'for'].forEach(w => words.delete(w))
  return [...words].filter(Boolean)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

if (!fs.existsSync(ICONS_ROOT)) {
  console.error(`❌  Icons folder not found: ${ICONS_ROOT}`)
  console.error(`    Place your AWS icons under public/icons/aws/ and re-run.`)
  process.exit(1)
}

const allFiles = walk(ICONS_ROOT).filter(f => f.endsWith('.svg'))

if (allFiles.length === 0) {
  console.error(`❌  No SVG files found in ${ICONS_ROOT}`)
  process.exit(1)
}

console.log(`📁  Found ${allFiles.length} SVG files`)

// Group by category (the immediate parent folder of the SVG file,
// or the grandparent if the immediate parent is a size subfolder like "32")
const categoryMap = new Map()   // categoryId → { label, icons[] }

for (const filePath of allFiles) {
  const rel      = path.relative(ICONS_ROOT, filePath)
  const parts    = rel.split(path.sep)

  // Skip __MACOSX and hidden files
  if (rel.includes('__MACOSX') || parts.some(p => p.startsWith('.'))) continue

  // Skip files directly in the root (e.g. the manifest itself)
  if (parts.length < 2) continue

  // Determine which folder is the category.
  // AWS oficial pack: Architecture-Service-Icons/Arch_Compute/32/Arch_EC2.svg
  let categoryFolder = parts[0]
  if (parts.length >= 3) {
    // If parts[1] starts with Arch_ or Res_, it's a better category name than the top-level set name
    if (parts[1].match(/^(Arch|Res)_/)) {
      categoryFolder = parts[1]
    }
  }

  const filename = parts[parts.length - 1]

  // Skip non-SVG
  if (!filename.endsWith('.svg')) continue

  // AWS packs include _16, _32, _48, _64. We prefer _32 or _48.
  const sizeMatch = filename.match(/_(\d+)\.svg$/)
  const size      = sizeMatch ? parseInt(sizeMatch[1]) : 0
  if (size !== 0 && size !== 32 && size !== 48) continue 

  const { id: catId, label: catLabel } = normaliseCategory(categoryFolder)
  const label                           = labelFromFilename(filename)
  const iconId                          = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')

  // Path relative to public/ (how the browser fetches it)
  const publicPath = `icons/${PROVIDER}/` + rel.replace(/\\/g, '/')

  if (!categoryMap.has(catId)) {
    categoryMap.set(catId, { id: catId, label: catLabel, icons: [] })
  }

  const cat = categoryMap.get(catId)

  // Deduplicate by iconId (keep first seen — smallest size wins due to filter above)
  if (!cat.icons.find(i => i.id === iconId)) {
    cat.icons.push({
      id:       iconId,
      label,
      path:     publicPath,
      category: catId,
      keywords: buildKeywords(label, catLabel, filename),
    })
  }
}

// Sort categories alphabetically, icons alphabetically within each category
const categories = [...categoryMap.values()]
  .sort((a, b) => a.label.localeCompare(b.label))

categories.forEach(cat => {
  cat.icons.sort((a, b) => a.label.localeCompare(b.label))
})

const totalIcons = categories.reduce((sum, c) => sum + c.icons.length, 0)

const manifest = {
  version:     1,
  generatedAt: new Date().toISOString(),
  totalIcons,
  categories,
}

fs.writeFileSync(OUT_FILE, JSON.stringify(manifest, null, 2))

console.log(`✅  Manifest written to public/icons/aws/manifest.json`)
console.log(`    ${categories.length} categories, ${totalIcons} icons`)
console.log()
console.log('Categories found:')
categories.forEach(c => console.log(`  ${c.label.padEnd(32)} ${c.icons.length} icons`))
