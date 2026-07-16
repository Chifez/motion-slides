import { useState, useEffect } from 'react'
import { GitBranch, GitCommit, GitPullRequest, ArrowUp, ArrowDown, X, Play, RefreshCw, AlertCircle, FilePlus, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { CommitTree } from './CommitTree'
import { PullRequestModal } from './PullRequestModal'
import { getPRDetailsAction } from '@/lib/actions/git'
import { usePermissions } from '@/context/PermissionContext'

export function GitPanel() {
  const activeProjectId = useEditorStore(state => state.activeProjectId)
  const isGitPanelOpen = useEditorStore(state => state.isGitPanelOpen)
  const toggleGitPanel = useEditorStore(state => state.toggleGitPanel)
  const project = useEditorStore(state => state.projects.find(p => p.id === activeProjectId))
  
  // Git slice actions
  const commitLocally = useEditorStore(state => state.commitLocally)
  const pushCommits = useEditorStore(state => state.pushCommits)
  const pullCommits = useEditorStore(state => state.pullCommits)
  const checkoutCommit = useEditorStore(state => state.checkoutCommit)
  const activeCommitId = useEditorStore(state => state.gitCheckedOutCommitId)
  const gitHistory = useEditorStore(state => state.gitHistory)
  const gitUpstreamHistory = useEditorStore(state => state.gitUpstreamHistory)
  const loadGitHistory = useEditorStore(state => state.loadGitHistory)
  const isSyncingGit = useEditorStore(state => state.isSyncingGit)
  const hasUnstagedChanges = useEditorStore(state => state.hasUnstagedChanges)
  
  // PR list and actions
  const prsList = useEditorStore(state => state.prsList)
  const loadPRs = useEditorStore(state => state.loadPRs)
  const prComments = useEditorStore(state => state.prComments)
  const showPRCommentsInEditor = useEditorStore(state => state.showPRCommentsInEditor)
  const setShowPRCommentsInEditor = useEditorStore(state => state.setShowPRCommentsInEditor)
  const loadPRComments = useEditorStore(state => state.loadPRComments)
  
  // Custom states
  const [commitMessage, setCommitMessage] = useState('')
  const [isPRModalOpen, setIsPRModalOpen] = useState(false)
  const [isReviewingPR, setIsReviewingPR] = useState(false)

  const { isReadOnly } = usePermissions()
  const user = useEditorStore(state => state.user)

  useEffect(() => {
    if (activeProjectId && isGitPanelOpen) {
      loadGitHistory(activeProjectId)
      const isBranchOwner = project?.forkedFromId && project?.ownerId === user?.id
      loadPRs(activeProjectId, isBranchOwner ? 'outgoing' : 'incoming')
    }
  }, [activeProjectId, isGitPanelOpen, project?.forkedFromId, project?.ownerId, user?.id])

  const isBranchOwner = !!project?.forkedFromId && project?.ownerId === user?.id
  const activePR = isBranchOwner ? prsList.find(pr => pr.status === 'pending') : null
  const hasActivePR = !!activePR

  useEffect(() => {
    if (activePR && isGitPanelOpen) {
      loadPRComments(activePR.id)
    }
  }, [activePR, isGitPanelOpen])

  if (!isGitPanelOpen || !project) return null

  const unpushedCount = project.localCommits?.length || 0
  const hasUnstaged = hasUnstagedChanges()

  const handleCommit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!commitMessage.trim()) return
    commitLocally(commitMessage.trim())
    setCommitMessage('')
    // Reload history list
    if (activeProjectId) {
      loadGitHistory(activeProjectId)
    }
  }

  // PR Review function
  const handleReviewPR = async (prId: string) => {
    try {
      const details = await getPRDetailsAction({ data: { prId } })
      if (details) {
        // Set the mock suggestion backup in the UI slice to trigger PR diff overlay review
        useEditorStore.setState({
          reviewingSuggestionId: details.pr.id,
          reviewMode: 'suggested',
          originalProjectBackup: {
            slides: project.slides,
            transitions: project.transitions || [],
            prototypeLayout: project.prototypeLayout || {},
          },
          suggestedProjectBackup: {
            slides: details.sourceCommit.slides,
            transitions: details.sourceCommit.transitions || [],
            prototypeLayout: details.sourceCommit.prototypeLayout || {},
          }
        })
        
        // Temporarily swap slides in the editor to source commit's slides for preview
        useEditorStore.getState().updateProject(project.id, {
          slides: details.sourceCommit.slides,
          transitions: details.sourceCommit.transitions || [],
          prototypeLayout: details.sourceCommit.prototypeLayout || {},
          synced: false
        })

        // Set state indicating we are reviewing a PR (this renders the custom PR resolver overlay)
        setIsReviewingPR(true)
        toggleGitPanel() // Close panel while reviewing
      }
    } catch (err) {
      console.error('Failed to load PR details for review:', err)
    }
  }

  return (
    <div className="fixed top-14 left-0 bottom-0 w-[300px] bg-(--ms-bg-surface)/95 backdrop-blur-md border-r border-(--ms-border) shadow-2xl z-[60] flex flex-col transition-all duration-300">
      {/* Header bar */}
      <header className="h-11 px-4 flex items-center justify-between border-b border-(--ms-border) shrink-0 select-none">
        <div className="flex items-center gap-2 text-(--ms-text-primary) font-semibold text-xs">
          <GitBranch size={14} className="text-blue-500" />
          <span>Version Control</span>
          {isSyncingGit && <RefreshCw size={11} className="animate-spin text-blue-500" />}
        </div>
        <button
          onClick={toggleGitPanel}
          className="p-1 rounded-md text-(--ms-text-muted) hover:text-(--ms-text-primary) hover:bg-(--ms-border) transition border-none cursor-pointer bg-transparent"
        >
          <X size={14} />
        </button>
      </header>

      {/* Main interface stack (Vertical layout) */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-hide">
        
        {/* Actions & Commits */}
        <div className="flex flex-col gap-3.5 min-w-0">
          
          {/* Status badges */}
          <div className="flex flex-col items-start gap-1.5 text-xs">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-medium ${
              hasUnstaged 
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}>
              <GitCommit size={12} />
              <span>{hasUnstaged ? 'Uncommitted changes' : 'Workspace clean'}</span>
            </span>

            {unpushedCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <ArrowUp size={12} />
                <span>{unpushedCount} local commit{unpushedCount !== 1 ? 's' : ''} to push</span>
              </span>
            )}
          </div>

          {/* Local commit form */}
          <form onSubmit={handleCommit} className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-(--ms-text-muted) uppercase tracking-wider">
              Commit Changes Locally
            </span>
            <div className="flex flex-col gap-2">
              <input
                type="text"
                disabled={isReadOnly || !hasUnstaged}
                placeholder={isReadOnly ? "Read-only branch." : (hasUnstaged ? "Commit message..." : "No uncommitted changes.")}
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                className="w-full bg-(--ms-bg-base) text-(--ms-text-primary) border border-(--ms-border) rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={isReadOnly || !hasUnstaged || !commitMessage.trim()}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2 rounded-xl border-none cursor-pointer transition disabled:opacity-50"
              >
                Commit to Local History
              </button>
            </div>
          </form>

          {/* Remote Push & Pull Controls */}
          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              onClick={pullCommits}
              disabled={isSyncingGit}
              className="flex items-center justify-center gap-2 border border-(--ms-border) bg-(--ms-bg-elevated) hover:bg-(--ms-border) text-(--ms-text-primary) font-semibold text-xs py-2 rounded-xl cursor-pointer transition disabled:opacity-50"
            >
              <ArrowDown size={13} className="text-emerald-500" />
              <span>Pull</span>
            </button>
            <button
              onClick={pushCommits}
              disabled={isReadOnly || isSyncingGit || unpushedCount === 0}
              className="flex items-center justify-center gap-2 border border-blue-500/30 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 font-semibold text-xs py-2 rounded-xl cursor-pointer transition disabled:opacity-50"
            >
              <ArrowUp size={13} />
              <span>Push ({unpushedCount})</span>
            </button>
          </div>

          {/* Fork PR creator */}
          {isBranchOwner && (
            <div className="mt-1 flex flex-col gap-1 w-full shrink-0">
              <button
                onClick={() => setIsPRModalOpen(true)}
                disabled={hasActivePR}
                className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2.5 rounded-xl border-none cursor-pointer transition shadow-md shadow-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <GitPullRequest size={13} />
                <span>{hasActivePR ? 'Pull Request Open' : 'Submit Pull Request'}</span>
              </button>
              {hasActivePR && (
                <span className="text-[10px] text-amber-400 font-medium bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 flex items-center gap-1.5 mt-1 select-none">
                  <AlertCircle size={12} className="shrink-0" />
                  <span className="truncate">Active PR pending: "{activePR.title}"</span>
                </span>
              )}

              {/* Show PR comments toggle */}
              {hasActivePR && (
                <button
                  onClick={() => setShowPRCommentsInEditor(!showPRCommentsInEditor)}
                  className={`flex items-center justify-between mt-1 px-3 py-2 rounded-xl border transition cursor-pointer text-xs font-semibold ${
                    showPRCommentsInEditor
                      ? 'border-blue-500/30 bg-blue-500/10 text-blue-400'
                      : 'border-(--ms-border) bg-(--ms-bg-base) text-(--ms-text-primary) hover:bg-(--ms-border)'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare size={13} />
                    <span>Show PR Comments</span>
                  </div>
                  {prComments.length > 0 && (
                    <span className="bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                      {prComments.length}
                    </span>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Incoming PR review list (for owner) */}
          {!project.forkedFromId && prsList.length > 0 && (
            <div className="flex flex-col gap-1.5 border-t border-(--ms-border) pt-3 mt-1.5">
              <span className="text-[10px] font-bold text-(--ms-text-muted) uppercase tracking-wider">
                Incoming Pull Requests ({prsList.length})
              </span>
              <div className="flex flex-col gap-1.5">
                {prsList.map((pr) => (
                  <div key={pr.id} className="flex items-center justify-between p-2 bg-(--ms-bg-elevated) border border-(--ms-border) rounded-xl">
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="text-xs font-semibold text-(--ms-text-primary) truncate">
                        {pr.title}
                      </span>
                      <span className="text-[10px] text-(--ms-text-muted) truncate">
                        from fork: {pr.projectName}
                      </span>
                    </div>
                    <button
                      onClick={() => handleReviewPR(pr.id)}
                      className="shrink-0 text-[10px] font-semibold bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded-md cursor-pointer border-none transition"
                    >
                      Review
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Commit Tree (Vertical stack segment) */}
        <div className="flex flex-col gap-1.5 min-h-0 border-t border-(--ms-border) pt-4">
          <span className="text-[10px] font-bold text-(--ms-text-muted) uppercase tracking-wider mb-1">
            Commit History Worktree
          </span>
          <CommitTree
            commits={gitHistory}
            upstreamCommits={gitUpstreamHistory}
            activeCommitId={activeCommitId || project.headCommitId || null}
            onCheckout={checkoutCommit}
            onBranch={(c) => {}}
          />
        </div>

      </div>

      <PullRequestModal isOpen={isPRModalOpen} onClose={() => setIsPRModalOpen(false)} />
    </div>
  )
}
