import { slideToolSchemas, executeSlideTool } from './tools/slide-tools'
import { elementToolSchemas, executeElementTool } from './tools/element-tools'
import { diagramToolSchemas, executeDiagramTool } from './tools/diagram-tools'
import { animationToolSchemas, executeAnimationTool } from './tools/animation-tools'
import { deckSynthesisToolSchemas, executeDeckSynthesisTool } from './tools/deck-synthesis-tools'
import { themeToolSchemas, executeThemeTool } from './tools/theme-tools'
import { motionToolSchemas, executeMotionTool } from './tools/motion-tools'
import { gitToolSchemas, executeGitTool } from './tools/git-tools'
import { auditToolSchemas, executeAuditTool } from './tools/audit-tools'
import { presenterToolSchemas, executePresenterTool } from './tools/presenter-tools'

// ─────────────────────────────────────────────────────────────────
// Aggregated Tool Schemas (sent to server / streamText)
// ─────────────────────────────────────────────────────────────────

export const agentToolSchemas = {
  ...slideToolSchemas,
  ...elementToolSchemas,
  ...diagramToolSchemas,
  ...animationToolSchemas,
  ...deckSynthesisToolSchemas,
  ...themeToolSchemas,
  ...motionToolSchemas,
  ...gitToolSchemas,
  ...auditToolSchemas,
  ...presenterToolSchemas,
}

export type AgentToolName = keyof typeof agentToolSchemas

type ToolResult = { success: boolean; [key: string]: unknown }

// ─────────────────────────────────────────────────────────────────
// Central Tool Executor — dispatches to domain executors
// ─────────────────────────────────────────────────────────────────

export async function executeAgentTool(toolName: AgentToolName, args: Record<string, unknown>): Promise<ToolResult> {
  if (toolName in slideToolSchemas) {
    return executeSlideTool(toolName, args)
  }
  if (toolName in elementToolSchemas) {
    return executeElementTool(toolName, args)
  }
  if (toolName in diagramToolSchemas) {
    return executeDiagramTool(toolName, args)
  }
  if (toolName in animationToolSchemas) {
    return executeAnimationTool(toolName, args)
  }
  if (toolName in deckSynthesisToolSchemas) {
    return executeDeckSynthesisTool(toolName as any, args)
  }
  if (toolName in themeToolSchemas) {
    return executeThemeTool(toolName as any, args)
  }
  if (toolName in motionToolSchemas) {
    return executeMotionTool(toolName as any, args)
  }
  if (toolName in gitToolSchemas) {
    return executeGitTool(toolName as any, args)
  }
  if (toolName in auditToolSchemas) {
    return executeAuditTool(toolName as any, args)
  }
  if (toolName in presenterToolSchemas) {
    return executePresenterTool(toolName as any, args)
  }

  return { success: false, error: `Unknown tool: ${toolName}` }
}
