import { useState } from 'react'
import { GitBranch, GitCommit, GitPullRequest, ArrowUp, ArrowDown, X, Play, RefreshCw, AlertCircle, FilePlus, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { CommitTree } from './CommitTree'
import { PullRequestModal } from './PullRequestModal'
import { getPRDetailsAction } from '@/lib/actions/git'
import { usePermissions } from '@/context/PermissionContext'
import { Panel } from '@/components/ui/core/Panel'
import { Button } from '@/components/ui/core/Button'
import { Input } from '@/components/ui/core/Input'

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
  const isSyncingGit = useEditorStore(state => state.isSyncingGit)
  const hasUnstagedChanges = useEditorStore(state => state.hasUnstagedChanges)
  
  // PR list and actions
  const prsList = useEditorStore(state => state.prsList)
  const prComments = useEditorStore(state => state.prComments)
  const showPRCommentsInEditor = useEditorStore(state => state.showPRCommentsInEditor)
  const setShowPRCommentsInEditor = useEditorStore(state => state.setShowPRCommentsInEditor)
  
  // Custom states
  const [commitMessage, setCommitMessage] = useState('')
  const [isPRModalOpen, setIsPRModalOpen] = useState(false)
  const [isReviewingPR, setIsReviewingPR] = useState(false)

  const { isReadOnly } = usePermissions()
  const user = useEditorStore(state => state.user)
  const isBranchOwner = !!project?.forkedFromId && project?.ownerId === user?.id

  const activePR = isBranchOwner ? prsList.find(pr => pr.status === 'pending') : null
  const hasActivePR = !!activePR

  if (!project) return null

  const unpushedCount = project.localCommits?.length || 0
  const hasUnstaged = hasUnstagedChanges()

  const handleCommit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!commitMessage.trim()) return
    commitLocally(commitMessage.trim())
    setCommitMessage('')
  }

  // PR Review function
  const handleReviewPR = async (prId: string) => {
    try {
      const details = await getPRDetailsAction({ data: { prId } })
      if (details) {
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
        
        useEditorStore.getState().updateProject(project.id, {
          slides: details.sourceCommit.slides,
          transitions: details.sourceCommit.transitions || [],
          prototypeLayout: details.sourceCommit.prototypeLayout || {},
          synced: false
        })

        setIsReviewingPR(true)
        if (isGitPanelOpen) toggleGitPanel() // Close panel while reviewing
      }
    } catch (err) {
      console.error('Failed to load PR details for review:', err)
    }
  }

  return (
    <>
      <Panel.Root 
        open={isGitPanelOpen} 
        onOpenChange={(open) => { if (open !== isGitPanelOpen) toggleGitPanel() }} 
        side="left"
      >
        <Panel.Portal>
          <Panel.Content width="w-[300px]">
            <Panel.Header>
              <div className="flex items-center gap-2 text-(--ms-text-primary) font-semibold text-xs">
                <GitBranch size={14} className="text-blue-500" />
                <span>Version Control</span>
                {isSyncingGit && <RefreshCw size={11} className="animate-spin text-blue-500" />}
              </div>
              <Panel.Close />
            </Panel.Header>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-hide">
              <div className="flex flex-col gap-3.5 min-w-0">
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

                <form onSubmit={handleCommit} className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-(--ms-text-muted) uppercase tracking-wider">
                    Commit Changes Locally
                  </span>
                  <div className="flex flex-col gap-2">
                    <Input
                      type="text"
                      disabled={isReadOnly || !hasUnstaged}
                      placeholder={isReadOnly ? "Read-only branch." : (hasUnstaged ? "Commit message..." : "No uncommitted changes.")}
                      value={commitMessage}
                      onChange={(e) => setCommitMessage(e.target.value)}
                      className="text-xs"
                    />
                    <Button
                      type="submit"
                      disabled={isReadOnly || !hasUnstaged || !commitMessage.trim()}
                      className="w-full"
                    >
                      Commit to Local History
                    </Button>
                  </div>
                </form>

                <div className="grid grid-cols-2 gap-2 mt-1">
                  <Button
                    variant="secondary"
                    onClick={pullCommits}
                    disabled={isSyncingGit}
                    className="flex gap-2 font-semibold"
                  >
                    <ArrowDown size={13} className="text-emerald-500" />
                    <span>Pull</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={pushCommits}
                    disabled={isReadOnly || isSyncingGit || unpushedCount === 0}
                    className="flex gap-2 font-semibold text-blue-500 hover:text-blue-400"
                  >
                    <ArrowUp size={13} />
                    <span>Push ({unpushedCount})</span>
                  </Button>
                </div>

                {isBranchOwner && (
                  <div className="mt-1 flex flex-col gap-1 w-full shrink-0">
                    <Button
                      variant="primary"
                      onClick={() => setIsPRModalOpen(true)}
                      disabled={hasActivePR}
                      className="flex gap-2 shadow-md shadow-blue-500/10"
                    >
                      <GitPullRequest size={13} />
                      <span>{hasActivePR ? 'Pull Request Open' : 'Submit Pull Request'}</span>
                    </Button>
                    
                    {hasActivePR && (
                      <span className="text-[10px] text-amber-400 font-medium bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 flex items-center gap-1.5 mt-1 select-none">
                        <AlertCircle size={12} className="shrink-0" />
                        <span className="truncate">Active PR pending: "{activePR.title}"</span>
                      </span>
                    )}

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
                          <Button
                            size="sm"
                            onClick={() => handleReviewPR(pr.id)}
                            className="h-6 text-[10px] font-semibold px-2.5"
                          >
                            Review
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

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
          </Panel.Content>
        </Panel.Portal>
      </Panel.Root>

      <PullRequestModal isOpen={isPRModalOpen} onClose={() => setIsPRModalOpen(false)} />
    </>
  )
}
