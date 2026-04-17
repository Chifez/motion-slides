import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { Plus, Layout, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEditorStore } from '@/store/editorStore'

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
})

function formatDate(ts: number) {
  const diff = Math.round((ts - Date.now()) / 86400000)
  return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(diff, 'day')
}

function Dashboard() {
  const navigate = useNavigate()
  const { projects, createProject } = useEditorStore()

  function handleCreate() {
    const project = createProject('Untitled Deck')
    navigate({ to: '/editor/$projectId', params: { projectId: project.id } })
  }

  return (
    <div className="h-screen flex flex-col bg-[#0d0d0d] overflow-hidden">

      {/* Header */}
      <header className="h-14 shrink-0 flex items-center gap-4 px-6 bg-[#161616] border-b border-white/8">
        <Link to="/" className="flex items-center gap-2 no-underline">
          <img src="/logo.png" alt="MotionSlides" className="h-10 w-auto" />
        </Link>
        <div className="flex-1" />
        <button
          onClick={handleCreate}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors cursor-pointer border-none"
        >
          <Plus size={14} /> New Project
        </button>
      </header>

      {/* Scrollable content */}
      <main className="flex-1 overflow-y-auto p-8">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-600 mb-4">
          Projects
        </p>

        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {/* Create new card */}
          <motion.button
            onClick={handleCreate}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="border-[1.5px] border-dashed border-white/10 hover:border-blue-500/50 hover:bg-blue-600/5 rounded-xl min-h-[160px] flex flex-col items-center justify-center gap-2 text-neutral-600 hover:text-blue-400 text-[13px] font-medium transition-all cursor-pointer bg-transparent"
          >
            <Plus size={24} />
            <span>New Project</span>
          </motion.button>

          {/* Existing project cards */}
          {projects.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => navigate({ to: '/editor/$projectId', params: { projectId: project.id } })}
              className="bg-[#161616] border border-white/8 hover:border-white/16 rounded-xl overflow-hidden cursor-pointer transition-all hover:-translate-y-0.5"
            >
              {/* Preview area */}
              <div className="aspect-video bg-[#111] border-b border-white/6 flex items-center justify-center text-neutral-700">
                <Layout size={24} />
              </div>
              {/* Card body */}
              <div className="px-3.5 py-3">
                <div className="text-[13px] font-semibold text-neutral-100 truncate">{project.name}</div>
                <div className="text-[11px] text-neutral-600 flex items-center gap-1 mt-0.5">
                  <Clock size={10} />
                  {project.slides.length} slide{project.slides.length !== 1 ? 's' : ''} · {formatDate(project.updatedAt)}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty state — no margins needed, just centered text below the grid */}
        {projects.length === 0 && (
          <div className="flex flex-col items-center gap-3 pt-16 text-neutral-700">
            <span className="text-4xl">✦</span>
            <span className="text-sm">No projects yet — create one to get started.</span>
          </div>
        )}
      </main>
    </div>
  )
}
