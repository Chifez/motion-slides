import { motion } from 'framer-motion'
import { Database, WifiOff, FileCode2, Image, Globe, FileDown } from 'lucide-react'


const EXPORTS = [
  { icon: <Globe size={14} />, label: 'Standalone HTML', desc: 'Single file, zero dependencies, self-hosted' },
  { icon: <FileDown size={14} />, label: 'PDF Export', desc: 'High-fidelity vector export for print' },
  { icon: <Image size={14} />, label: 'PNG Slides', desc: 'Per-slide image export for social & docs' },
  { icon: <FileCode2 size={14} />, label: 'Iframe Embed', desc: 'Embed directly into any web page' },
]

export function LandingExportOffline() {
  return (
    <section id="export" className="px-6 py-24 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
      >
        {/* Visual */}
        <div className="flex flex-col gap-4">
          {/* IndexedDB card */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                <Database size={14} className="text-zinc-500" />
              </div>
              <div>
                <p className="text-[12px] font-semibold text-zinc-300">Local IndexedDB Storage</p>
                <p className="text-[10px] text-zinc-600">Persists in-browser · No server required</p>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              {[
                { label: 'my-startup-pitch.msld', size: '42 KB', updated: '2m ago' },
                { label: 'system-design-talk.msld', size: '138 KB', updated: '1h ago' },
                { label: 'api-review-q3.msld', size: '21 KB', updated: 'Yesterday' },
              ].map(file => (
                <div key={file.label} className="flex items-center justify-between bg-zinc-900 border border-zinc-800/60 rounded-lg px-3 py-2">
                  <span className="text-[11px] text-zinc-400 font-mono truncate">{file.label}</span>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-[9px] text-zinc-700 font-mono">{file.size}</span>
                    <span className="text-[9px] text-zinc-700">{file.updated}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Offline badge */}
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
            <WifiOff size={13} className="text-zinc-500 shrink-0" />
            <div>
              <p className="text-[11px] font-semibold text-zinc-400">Works 100% offline</p>
              <p className="text-[10px] text-zinc-600">No account needed to start building and presenting.</p>
            </div>
          </div>
        </div>

        {/* Text */}
        <div>
          <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1.5 text-[11px] font-semibold text-zinc-400 mb-5">
            <WifiOff size={11} />
            Local-First & Universal Export
          </div>

          <h2
            className="text-[clamp(26px,3.5vw,42px)] font-bold tracking-tight text-white mb-4 leading-tight"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Yours forever.{' '}
            <span className="italic font-normal" style={{ fontFamily: '"DM Serif Display", Georgia, serif' }}>
              No cloud lock-in.
            </span>
          </h2>

          <p className="text-zinc-500 text-[15px] leading-relaxed mb-8" style={{ fontFamily: 'Inter, sans-serif' }}>
            All presentations are stored in your browser's IndexedDB — no account, no subscription, no server. When you're ready to share, export to any format you need.
          </p>

          <div className="grid grid-cols-1 gap-3">
            {EXPORTS.map(exp => (
              <div key={exp.label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 shrink-0">
                  {exp.icon}
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-zinc-300" style={{ fontFamily: 'Inter, sans-serif' }}>{exp.label}</p>
                  <p className="text-[11px] text-zinc-600" style={{ fontFamily: 'Inter, sans-serif' }}>{exp.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  )
}
