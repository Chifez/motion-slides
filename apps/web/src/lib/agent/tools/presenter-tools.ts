import { z } from 'zod'
import { tool } from 'ai'
import { useEditorStore } from '../../../store/editor-store'
import type { TextContent, ShapeContent, LineContent } from '@motionslides/shared'

export const presenterToolSchemas = {
  generateSpeakerNotes: tool({
    description: 'Generate structured speaker notes, talking points, and pacing cues for presenter mode across all slides or a specific slide.',
    inputSchema: z.object({
      style: z.enum(['technical', 'executive', 'conversational']).optional().default('technical').describe('Tone and style of the talking points'),
      slideIndex: z.number().optional().describe('Optional specific 0-based slide index target. If omitted, generates notes for all slides.'),
    }),
  }),

  startPresentationMode: tool({
    description: 'Launch live full-screen presentation mode for the audience or rehearsal.',
    inputSchema: z.object({
      autoplay: z.boolean().optional().default(false).describe('Whether to automatically cycle through slides'),
    }),
  }),

  exportPresentation: tool({
    description: 'Initiate high-definition export of the presentation deck in MP4 video, PDF, interactive HTML, or GIF format.',
    inputSchema: z.object({
      format: z.enum(['pdf', 'video', 'html', 'gif']).describe('Export format: pdf (document), video (1080p MP4), html (interactive standalone), or gif'),
      aspectRatio: z.enum(['16:9', '4:3', '1:1', '9:16']).optional().default('16:9'),
      includeSpeakerNotes: z.boolean().optional().default(false),
    }),
  }),
}

export type PresenterToolName = keyof typeof presenterToolSchemas

export async function executePresenterTool(
  toolName: PresenterToolName,
  args: Record<string, unknown>
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const store = useEditorStore.getState()
  const activeProjectId = store.activeProjectId
  const project = store.activeProject()

  if (!activeProjectId || !project) {
    return { success: false, error: 'No active project found for presenter tool.' }
  }

  switch (toolName) {
    case 'generateSpeakerNotes': {
      const { style = 'technical', slideIndex } = args as {
        style?: 'technical' | 'executive' | 'conversational'
        slideIndex?: number
      }

      let generatedCount = 0

      const updatedSlides = project.slides.map((slide, idx) => {
        if (slideIndex !== undefined && idx !== slideIndex) {
          return slide
        }

        generatedCount++
        const titleEl = slide.elements.find((e) => e.type === 'text' && ((e.content as TextContent).fontSize ?? 0) >= 28)
        const title = titleEl ? (titleEl.content as TextContent).text : slide.name

        const shapes = slide.elements.filter((e) => e.type === 'shape')
        const lines = slide.elements.filter((e) => e.type === 'line')

        const nodeNames = shapes.map((s) => (s.content as ShapeContent).label || s.id).filter(Boolean)
        const flowLabels = lines.map((l) => (l.content as LineContent).label).filter(Boolean)

        let notes = ''
        if (style === 'executive') {
          notes = `🎙️ **Executive Briefing: ${title}**
• **Core Takeaway**: Highlights high-level system capabilities and strategic architecture.
• **Key Components**: ${nodeNames.slice(0, 4).join(', ') || 'Overview elements'}.
• **Presenter Cue**: Emphasize reliability, scalability, and time-to-value before advancing to the next section.`
        } else if (style === 'conversational') {
          notes = `💬 **Talking Points: ${title}**
• "Let's take a look at ${title}..."
• Walk the audience through: ${nodeNames.join(' ➔ ') || 'the key visual points'}.
• "Notice how ${flowLabels[0] ? `requests trigger ${flowLabels[0]}` : 'components interact in real time'}."`
        } else {
          notes = `🛠️ **Technical Notes: ${title}**
1. **Architecture Layer**: ${slide.name}
2. **Subsystems Involved**: ${nodeNames.join(', ') || 'Standard topology'}.
3. **Data Flows**: ${flowLabels.length > 0 ? flowLabels.join('; ') : 'Synchronous and asynchronous connections'}.
4. **Transition Cue**: Prepare audience for subsystem zoom in the following slide.`
        }

        return {
          ...slide,
          speakerNotes: notes,
        }
      })

      useEditorStore.setState((s) => ({
        projects: s.projects.map((p) =>
          p.id !== activeProjectId
            ? p
            : {
                ...p,
                slides: updatedSlides,
                updatedAt: Date.now(),
              }
        ),
      }))

      return {
        success: true,
        data: {
          generatedCount,
          style,
          message: `Generated ${style} speaker notes for ${generatedCount} slide(s).`,
        },
      }
    }

    case 'startPresentationMode': {
      const { autoplay = false } = args as { autoplay?: boolean }
      store.startPresentation({ autoplay })
      return {
        success: true,
        data: {
          isPresenting: true,
          autoplay,
          message: 'Launched presentation viewer mode.',
        },
      }
    }

    case 'exportPresentation': {
      const { format, aspectRatio = '16:9', includeSpeakerNotes = false } = args as {
        format: 'pdf' | 'video' | 'html' | 'gif'
        aspectRatio?: string
        includeSpeakerNotes?: boolean
      }

      return {
        success: true,
        data: {
          format,
          aspectRatio,
          includeSpeakerNotes,
          slideCount: project.slides.length,
          message: `Prepared ${format.toUpperCase()} export for "${project.name}" (${project.slides.length} slides at ${aspectRatio} aspect ratio). Click Export in the top header to finalize.`,
        },
      }
    }

    default:
      return { success: false, error: `Unknown presenter tool: ${toolName}` }
  }
}
