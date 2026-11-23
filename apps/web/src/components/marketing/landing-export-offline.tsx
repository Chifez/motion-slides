import { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Database, Film, FileText, Share2, Lock, Smartphone } from 'lucide-react'

const EASE_OUT = [0.23, 1, 0.32, 1] as const

interface DeliveryTab {
  id: 'video' | 'social' | 'docs' | 'share'
  label: string
  badge: string
  title: string
  meta: string
  rows: Array<{ name: string; spec: string }>
}

const DELIVERY_TABS: DeliveryTab[] = [
  {
    id: 'video',
    label: 'MP4 & GIF',
    badge: 'Headless Render Pipeline',
    title: 'Deterministic frame capture',
    meta: 'BullMQ + Chromium Virtual Clock + FFmpeg stdin pipe',
    rows: [
      { name: 'Video (MP4)', spec: '1920×1080 · H.264 + Voiceover & BGM' },
      { name: 'Animated GIF', spec: 'Looping high-palette clip' },
      { name: 'Frame Sync', spec: 'Zero dropped frames via virtual clock' },
    ],
  },
  {
    id: 'social',
    label: 'Social Presets',
    badge: 'Aspect-Aware Reframing',
    title: 'Multi-platform delivery ratios',
    meta: 'Automatic resolution & duration presets before export',
    rows: [
      { name: 'TikTok & IG Reels', spec: '9:16 · 1080×1920 (60s–90s)' },
      { name: 'Instagram Post', spec: '1:1 · 1080×1080 Square' },
      { name: 'YouTube, X & LinkedIn', spec: '16:9 · 1920×1080 Full HD' },
    ],
  },
  {
    id: 'docs',
    label: 'PDF & JSON',
    badge: 'Portable Artifacts',
    title: 'Print-ready decks & portable backups',
    meta: 'Lossless deck snapshots for handouts and versioning',
    rows: [
      { name: 'PDF Document', spec: 'Static multi-page vector handout' },
      { name: 'Project (.motionslides.json)', spec: 'Complete local portable backup' },
      { name: 'IndexedDB Persistence', spec: 'Works 100% offline in the browser' },
    ],
  },
  {
    id: 'share',
    label: 'Share & Embed',
    badge: 'Access Control',
    title: 'Scoped links & iframe embeds',
    meta: 'Cryptographic keys with instant revocation and rotation',
    rows: [
      { name: 'View-Only Link', spec: 'Presenter / viewer overlay + captions' },
      { name: 'Collaborative Edit', spec: 'Opt-in edit link with key rotation' },
      { name: 'Iframe Embed (/embed)', spec: 'Responsive 16:9 player with autoplay' },
    ],
  },
]

const DELIVERY_HIGHLIGHTS = [
  {
    icon: Film,
    label: 'MP4 & Looping GIF',
    desc: 'Frame-accurate headless Chromium capture piped straight to FFmpeg with mixed voiceover.',
  },
  {
    icon: Smartphone,
    label: 'One-Click Social Presets',
    desc: 'Export tailored 9:16, 1:1, and 16:9 cuts for TikTok, Reels, YouTube, X, and LinkedIn.',
  },
  {
    icon: FileText,
    label: 'PDF & Portable JSON',
    desc: 'Generate clean slide PDFs or export your full project schema for offline archiving.',
  },
  {
    icon: Share2,
    label: 'Link Sharing & Iframe Embeds',
    desc: 'Toggle view-only or collaborative links, rotate keys anytime, or embed live decks.',
  },
] as const

export function LandingExportOffline() {
  const [activeTab, setActiveTab] = useState<DeliveryTab['id']>('video')
  const shouldReduceMotion = useReducedMotion()

  const active = DELIVERY_TABS.find((t) => t.id === activeTab) ?? DELIVERY_TABS[0]

  return (
    <section id="export" className="max-w-[1120px] mx-auto px-[24px] py-[104px]">
      <motion.div
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.45, ease: EASE_OUT }}
        className="grid grid-cols-1 md:grid-cols-2 gap-[48px] items-center"
      >
        {/* Left: Interactive Export & Delivery Inspector */}
        <div className="flex flex-col gap-[14px]">
          <div className="rounded-[16px] border border-white/[0.08] bg-[#0C0C0F] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] overflow-hidden">
            {/* Inspector Tabs */}
            <div className="flex items-center gap-[4px] px-[12px] py-[10px] border-b border-white/[0.06] bg-[#09090C] overflow-x-auto">
              {DELIVERY_TABS.map((tab) => {
                const selected = tab.id === activeTab
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-[10px] py-[6px] rounded-[7px] text-[11px] font-medium border-none cursor-pointer transition-[transform,background-color,color] duration-150 active:scale-[0.97] whitespace-nowrap ${
                      selected
                        ? 'bg-white/[0.09] text-white'
                        : 'bg-transparent text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* Inspector Body */}
            <div className="p-[22px] min-h-[236px] flex flex-col justify-between">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.id}
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                  transition={{ duration: 0.16, ease: EASE_OUT }}
                  className="flex flex-col gap-[16px]"
                >
                  <div>
                    <div className="flex items-center justify-between gap-[8px] mb-[6px]">
                      <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-blue-400">
                        {active.badge}
                      </span>
                      <span className="w-[6px] h-[6px] rounded-full bg-emerald-500" />
                    </div>
                    <h3 className="text-[16px] font-semibold text-zinc-100 m-0">
                      {active.title}
                    </h3>
                    <p className="font-mono text-[11px] text-zinc-500 mt-[4px] m-0">
                      {active.meta}
                    </p>
                  </div>

                  <div className="flex flex-col gap-[8px]">
                    {active.rows.map((row) => (
                      <div
                        key={row.name}
                        className="flex items-center justify-between gap-[12px] rounded-[8px] border border-white/[0.06] bg-[#121216] px-[12px] py-[10px]"
                      >
                        <span className="text-[12px] font-medium text-zinc-200 truncate">
                          {row.name}
                        </span>
                        <span className="font-mono text-[11px] text-zinc-400 shrink-0 text-right">
                          {row.spec}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Local-first status row */}
          <div className="rounded-[12px] border border-white/[0.08] bg-[#0C0C0F] px-[16px] py-[12px] flex items-center justify-between gap-[12px]">
            <div className="flex items-center gap-[10px] min-w-0">
              <div className="w-[30px] h-[30px] rounded-[8px] border border-white/[0.08] bg-[#121216] flex items-center justify-center shrink-0 text-zinc-400">
                <Database size={13} />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-medium text-zinc-200 m-0 truncate">
                  IndexedDB + Optional Cloud Sync
                </p>
                <p className="font-mono text-[10px] text-zinc-500 m-0 truncate">
                  Edit offline anytime · Syncs to PostgreSQL on sign-in
                </p>
              </div>
            </div>
            <Lock size={13} className="text-zinc-600 shrink-0" />
          </div>
        </div>

        {/* Right: Narrative */}
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-zinc-500 mb-[12px]">
            04 / DELIVERY &amp; EXPORT
          </p>
          <h2 className="text-[clamp(28px,4vw,44px)] font-semibold tracking-[-0.03em] leading-[1.08] text-white mb-[16px]">
            Local-first editing. Frame-accurate video export.
          </h2>
          <p className="text-[16px] leading-[1.6] text-zinc-400 mb-[28px]">
            Start immediately with zero signup—projects save locally in IndexedDB and sync to PostgreSQL when you sign in. Share live links, embed anywhere, or render deterministic video via headless Chromium and FFmpeg.
          </p>

          <div className="grid grid-cols-1 gap-[14px]">
            {DELIVERY_HIGHLIGHTS.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="flex items-start gap-[12px]">
                  <div className="w-[32px] h-[32px] rounded-[8px] bg-[#0C0C0F] border border-white/[0.08] flex items-center justify-center text-zinc-400 shrink-0 mt-[2px]">
                    <Icon size={14} />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-zinc-100 m-0">
                      {item.label}
                    </p>
                    <p className="text-[12px] leading-[1.5] text-zinc-400 mt-[2px] m-0">
                      {item.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </motion.div>
    </section>
  )
}
