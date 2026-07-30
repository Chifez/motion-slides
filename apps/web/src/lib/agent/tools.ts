import { slideToolSchemas, executeSlideTool } from './tools/slideTools'
import { elementToolSchemas, executeElementTool } from './tools/elementTools'
import { diagramToolSchemas, executeDiagramTool } from './tools/diagramTools'
import { animationToolSchemas, executeAnimationTool } from './tools/animationTools'

// ─────────────────────────────────────────────────────────────────
// Aggregated Tool Schemas (sent to server / streamText)
// ─────────────────────────────────────────────────────────────────

export const agentToolSchemas = {
  ...slideToolSchemas,
  ...elementToolSchemas,
  ...diagramToolSchemas,
  ...animationToolSchemas,
}

export type AgentToolName = keyof typeof agentToolSchemas

type ToolResult = { success: boolean; [key: string]: unknown }

// ─────────────────────────────────────────────────────────────────
// Central Tool Executor — dispatches to domain executors
// ─────────────────────────────────────────────────────────────────

export async function executeAgentTool(toolName: string, args: Record<string, unknown>): Promise<ToolResult> {
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

  return { success: false, error: `Unknown tool: ${toolName}` }
}
