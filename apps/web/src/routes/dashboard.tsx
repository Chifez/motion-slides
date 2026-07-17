import { useState, useEffect } from 'react'
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { Plus, Layout, Clock, Trash2, ChevronDown, ChevronUp, GitBranch } from 'lucide-react'
import { motion } from 'framer-motion'
import { useShallow } from 'zustand/react/shallow'
import { useEditorStore, storeHydrationPromise } from '@/store/editorStore'
import { Logo } from '@/components/ui/Logo'
import { LoadingPage } from '@/components/ui/LoadingPage'
import { UserMenu } from '@/components/auth/UserMenu'
import { DeleteConfirmationModal } from '@/components/ui/DeleteConfirmationModal'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Tour } from '@/components/ui/tour/Tour'
import { useOnboardingTrigger } from '@/hooks/useOnboardingTrigger'
import { Dropdown } from '@/components/ui/core/Dropdown'

export const Route = createFileRoute('/dashboard')({
  loader: async () => {
    await storeHydrationPromise
    const store = useEditorStore.getState()
    if (store.user) {
      // Trigger sync in the background, don't block navigation
      store.syncProjects()
    }
  },

  head: () => ({
    meta: [
      { title: 'Dashboard - MotionSlides' }
    ]
  }),
  pendingComponent: LoadingPage,
  component: Dashboard,
})

function formatDate(ts: number) {
  const diff = Math.round((ts - Date.now()) / 86400000)
  return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(diff, 'day')
}

function Dashboard() {
  const navigate = useNavigate()
  const { projects, createProject, deleteProject, removeLocalProject, user, isSyncing, localAuthorId } = useEditorStore(
    useShallow((state) => ({
      projects: state.projects,
      createProject: state.createProject,
      deleteProject: state.deleteProject,
      removeLocalProject: state.removeLocalProject,
      user: state.user,
      isSyncing: state.isSyncing,
      localAuthorId: state.localAuthorId,
    }))
  )
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, projectId: string, projectName: string, isGuest: boolean }>({
    isOpen: false,
    projectId: '',
    projectName: '',
    isGuest: false,
  })
  const [expandedCardIds, setExpandedCardIds] = useState<Record<string, boolean>>({})

  useEffect(() => {
    function handleGlobalClick() {
      setExpandedCardIds({})
    }
    window.addEventListener('click', handleGlobalClick)
    return () => window.removeEventListener('click', handleGlobalClick)
  }, [])

  const mainProjects = projects.filter(p => !p.forkedFromId)

  // Auto-trigger tour if user is logged in, has 0 projects, and hasn't done the tour (configured/bypassed via VITE_FORCE_TOUR)
  useOnboardingTrigger('dashboard')

  function handleCreate() {
    const project = createProject('Untitled Deck')
    navigate({ to: '/p/$projectId', params: { projectId: project.id } })
  }

  function confirmDelete(id: string, name: string, isGuest: boolean) {
    setDeleteModal({ isOpen: true, projectId: id, projectName: name, isGuest })
  }

  const modalTitle = deleteModal.isGuest ? 'Remove Shared Project' : 'Delete Project'
  const modalConfirmText = deleteModal.isGuest ? 'Remove Copy' : 'Delete Permanently'
  const modalDescription = deleteModal.isGuest ? (
    <>
      Are you sure you want to remove <span className="text-(--ms-text-primary) font-medium">"{deleteModal.projectName}"</span> from your dashboard? This is a guest project and removing it will not affect the owner's cloud project.
    </>
  ) : undefined

  return (
    <div className="h-screen flex flex-col bg-(--ms-bg-base) overflow-hidden transition-colors">
      <Tour.Root />
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        projectName={deleteModal.projectName}
        title={modalTitle}
        confirmText={modalConfirmText}
        description={modalDescription}
        onClose={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={() => {
          if (deleteModal.isGuest) {
            removeLocalProject(deleteModal.projectId)
          } else {
            deleteProject(deleteModal.projectId)
          }
        }}
      />

      <header className="h-14 shrink-0 flex items-center gap-4 px-6 bg-(--ms-bg-surface) border-b border-(--ms-border)">
        <Link to="/" className="flex items-center gap-2 no-underline">
          <Logo expanded size={30} />
        </Link>
        <div className="flex-1" />

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="w-px h-6 bg-(--ms-border)" />
          <UserMenu />
          <div className="w-px h-6 bg-(--ms-border)" />
          <button
            onClick={handleCreate}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors cursor-pointer border-none"
          >
            <Plus size={14} /> New Project
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-(--ms-text-muted) mb-4">
          Projects
        </p>

        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          <motion.button
            id="tour-new-project"
            onClick={handleCreate}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="border-[1.5px] border-dashed border-(--ms-border) hover:border-blue-500/50 hover:bg-blue-600/5 rounded-xl min-h-[160px] flex flex-col items-center justify-center gap-2 text-(--ms-text-muted) hover:text-blue-400 text-[13px] font-medium transition cursor-pointer bg-transparent"
          >
            <Plus size={24} />
            <span>New Project</span>
          </motion.button>

          {isSyncing && projects.length === 0 && [1, 2, 3].map((n) => (
            <div
              key={`skeleton-${n}`}
              className="bg-(--ms-bg-surface) border border-(--ms-border) rounded-xl overflow-hidden min-h-[160px] flex flex-col animate-pulse"
            >
              <div className="aspect-video animate-shimmer border-b border-(--ms-border)" />
              <div className="px-3.5 py-3 flex-1 flex flex-col gap-2 justify-center">
                <div className="h-3.5 w-3/4 rounded bg-(--ms-bg-base) animate-shimmer" />
                <div className="h-3 w-1/2 rounded bg-(--ms-bg-base) animate-shimmer" />
              </div>
            </div>
          ))}

          {mainProjects.map((project, i) => {
            const isGuest = !!project.ownerId && project.ownerId !== user?.id && project.localAuthorId !== localAuthorId
            const branches = projects.filter(b => b.forkedFromId === project.id)

            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => navigate({ to: '/p/$projectId', params: { projectId: project.id } })}
                className={`group bg-(--ms-bg-surface) border border-(--ms-border) hover:border-(--ms-border-strong) rounded-xl cursor-pointer transition hover:-translate-y-0.5 flex flex-col relative ${expandedCardIds[project.id] ? 'z-50' : 'z-10'}`}
              >
                <div className="aspect-video bg-(--ms-bg-base) rounded-t-[11px] border-b border-(--ms-border) flex items-center justify-center text-(--ms-text-muted) relative shrink-0">
                  <Layout size={24} className="opacity-40 group-hover:scale-110 group-hover:opacity-100 transition duration-300" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      confirmDelete(project.id, project.name, isGuest)
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-md bg-(--ms-bg-elevated) text-(--ms-text-muted) hover:text-red-500 border border-(--ms-border) opacity-0 group-hover:opacity-100 transition cursor-pointer"
                    title={isGuest ? "Remove from Dashboard" : "Delete Project"}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="px-3.5 py-3 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 overflow-hidden">
                      <div className="text-[13px] font-semibold text-(--ms-text-primary) truncate group-hover:text-blue-400 transition-colors flex-1">{project.name}</div>
                      {isGuest && (
                        <span className="shrink-0 text-[9px] font-medium px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 select-none">
                          Collaborator
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-(--ms-text-muted) flex items-center justify-between mt-0.5 relative">
                      <div className="flex items-center gap-1 truncate max-w-[70%]">
                        <Clock size={10} className="shrink-0" />
                        <span className="truncate">
                          {project.slides.length} slide{project.slides.length !== 1 ? 's' : ''} · {formatDate(project.updatedAt)}
                        </span>
                      </div>

                      {branches.length > 0 && (
                        <div className="relative">
                          <Dropdown.Root>
                            <Dropdown.Trigger asChild>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                }}
                                className="flex items-center gap-1 text-[10px] font-medium text-(--ms-text-muted) hover:text-(--ms-text-primary) hover:bg-(--ms-border) px-1.5 py-0.5 rounded transition cursor-pointer border-none bg-transparent select-none shrink-0"
                              >
                                <GitBranch size={10} className="text-blue-500" />
                                <span>{branches.length}</span>
                                <ChevronDown size={8} className="text-(--ms-text-muted)" />
                              </button>
                            </Dropdown.Trigger>

                            <Dropdown.Content align="end" className="w-44 py-1 flex flex-col gap-0.5 max-h-32 overflow-y-auto custom-scrollbar shadow-xl mt-1.5">
                              {branches.map(branch => {
                                const branchIsGuest = !!branch.ownerId && branch.ownerId !== user?.id && branch.localAuthorId !== localAuthorId
                                return (
                                  <Dropdown.Item
                                    key={branch.id}
                                    onSelect={() => navigate({ to: '/p/$projectId', params: { projectId: branch.id } })}
                                    className="justify-between hover:bg-(--ms-border)"
                                  >
                                    <span className="truncate flex items-center gap-1.5 max-w-[70%]">
                                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500/80 shrink-0" />
                                      <span className="truncate font-medium text-[11px]">{branch.name}</span>
                                    </span>
                                    {branchIsGuest && (
                                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/10 scale-90 shrink-0 select-none">
                                        Collab
                                      </span>
                                    )}
                                  </Dropdown.Item>
                                )
                              })}
                            </Dropdown.Content>
                          </Dropdown.Root>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {projects.length === 0 && !isSyncing && (
          <div className="flex flex-col items-center gap-3 pt-16 text-(--ms-text-muted)">
            <span className="text-4xl">✦</span>
            <span className="text-sm">No projects yet — create one to get started.</span>
          </div>
        )}
      </main>
    </div>
  )
}
