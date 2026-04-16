import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { Plus, Layout, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEditorStore } from '../store/editorStore'
import { nanoid } from '../lib/nanoid'

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
})

function formatDate(ts: number) {
  return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
    Math.round((ts - Date.now()) / 86400000),
    'day',
  )
}

function Dashboard() {
  const navigate = useNavigate()
  const { projects, createProject } = useEditorStore()

  function handleCreate() {
    const project = createProject('Untitled Deck')
    navigate({ to: '/editor/$projectId', params: { projectId: project.id } })
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <Link to="/" className="toolbar-logo" style={{ textDecoration: 'none' }}>
          MotionSlides
        </Link>
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={handleCreate}>
          <Plus size={14} /> New Project
        </button>
      </header>

      {/* Content */}
      <main className="dashboard-content">
        <p className="dashboard-section-title">Projects</p>

        <div className="project-grid">
          {/* Create new card */}
          <motion.button
            className="project-card-new"
            onClick={handleCreate}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            <Plus size={24} />
            <span>New Project</span>
          </motion.button>

          {/* Existing projects */}
          {projects.map((project, i) => (
            <motion.div
              key={project.id}
              className="project-card"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              onClick={() =>
                navigate({ to: '/editor/$projectId', params: { projectId: project.id } })
              }
            >
              <div className="project-card-preview">
                <Layout size={24} />
              </div>
              <div className="project-card-body">
                <div className="project-card-name">{project.name}</div>
                <div className="project-card-meta" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={10} />
                  {project.slides.length} slide{project.slides.length !== 1 ? 's' : ''} ·{' '}
                  {formatDate(project.updatedAt)}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {projects.length === 0 && (
          <div className="empty-state" style={{ marginTop: 60 }}>
            <div className="empty-state-icon">✦</div>
            <div className="empty-state-text">No projects yet — create one to get started.</div>
          </div>
        )}
      </main>
    </div>
  )
}
