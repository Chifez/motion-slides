import { z } from 'zod'
import { tool } from 'ai'
import { useEditorStore } from '../../../store/editor-store'
import type { TextContent, ShapeContent, LineContent, SectionContent } from '@motionslides/shared'

const THEMES = {
  'midnight-indigo': {
    bg: '#0b0c16',
    cardFill: 'rgba(99, 102, 241, 0.08)',
    cardStroke: '#6366f1',
    cardText: '#e0e7ff',
    titleText: '#ffffff',
    subtitleText: 'rgba(255, 255, 255, 0.65)',
    lineColor: '#6366f1',
    sectionFill: 'rgba(255, 255, 255, 0.02)',
    sectionBorder: 'rgba(99, 102, 241, 0.25)',
  },
  'nordic-light': {
    bg: '#f8fafc',
    cardFill: '#ffffff',
    cardStroke: '#3b82f6',
    cardText: '#1e293b',
    titleText: '#0f172a',
    subtitleText: '#64748b',
    lineColor: '#3b82f6',
    sectionFill: 'rgba(0, 0, 0, 0.02)',
    sectionBorder: 'rgba(59, 130, 246, 0.2)',
  },
  'obsidian-cyan': {
    bg: '#080c14',
    cardFill: 'rgba(6, 182, 212, 0.08)',
    cardStroke: '#06b6d4',
    cardText: '#cffafe',
    titleText: '#ffffff',
    subtitleText: 'rgba(207, 250, 254, 0.7)',
    lineColor: '#06b6d4',
    sectionFill: 'rgba(255, 255, 255, 0.02)',
    sectionBorder: 'rgba(6, 182, 212, 0.25)',
  },
  'emerald-tech': {
    bg: '#06120e',
    cardFill: 'rgba(16, 185, 129, 0.08)',
    cardStroke: '#10b981',
    cardText: '#d1fae5',
    titleText: '#ffffff',
    subtitleText: 'rgba(209, 250, 229, 0.7)',
    lineColor: '#10b981',
    sectionFill: 'rgba(255, 255, 255, 0.02)',
    sectionBorder: 'rgba(16, 185, 129, 0.25)',
  },
  'cyberpunk-neon': {
    bg: '#0a0614',
    cardFill: 'rgba(236, 72, 153, 0.08)',
    cardStroke: '#ec4899',
    cardText: '#fce7f3',
    titleText: '#ffffff',
    subtitleText: 'rgba(252, 231, 243, 0.7)',
    lineColor: '#ec4899',
    sectionFill: 'rgba(255, 255, 255, 0.02)',
    sectionBorder: 'rgba(236, 72, 153, 0.25)',
  },
}

export const themeToolSchemas = {
  applyDeckTheme: tool({
    description: 'Apply a cohesive color palette, background, and typography theme across the entire presentation deck.',
    inputSchema: z.object({
      theme: z.enum(['midnight-indigo', 'nordic-light', 'obsidian-cyan', 'emerald-tech', 'cyberpunk-neon']).describe('Theme palette to apply'),
      typography: z.enum(['Inter', 'Outfit', 'Roboto Mono', 'Merriweather']).optional().default('Inter').describe('Font family to apply to text elements'),
      customAccentColor: z.string().optional().describe('Optional custom accent color hex code'),
    }),
  }),

  harmonizeSlideStyles: tool({
    description: 'Normalize typographic hierarchy (title, subtitle, body font sizes) and spacing across all slides for consistent visual polish.',
    inputSchema: z.object({
      titleFontSize: z.number().optional().default(36).describe('Standardized title font size (px)'),
      subtitleFontSize: z.number().optional().default(18).describe('Standardized subtitle font size (px)'),
      bodyFontSize: z.number().optional().default(14).describe('Standardized body text font size (px)'),
    }),
  }),
}

export type ThemeToolName = keyof typeof themeToolSchemas

export async function executeThemeTool(
  toolName: ThemeToolName,
  args: Record<string, unknown>
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const store = useEditorStore.getState()
  const activeProjectId = store.activeProjectId
  const project = store.activeProject()

  if (!activeProjectId || !project) {
    return { success: false, error: 'No active project found.' }
  }

  switch (toolName) {
    case 'applyDeckTheme': {
      const { theme, typography = 'Inter', customAccentColor } = args as {
        theme: keyof typeof THEMES
        typography?: string
        customAccentColor?: string
      }

      const t = THEMES[theme] || THEMES['midnight-indigo']
      const strokeColor = customAccentColor || t.cardStroke
      const lineColor = customAccentColor || t.lineColor

      useEditorStore.setState((s) => ({
        projects: s.projects.map((p) => {
          if (p.id !== activeProjectId) return p
          return {
            ...p,
            slides: p.slides.map((sl) => ({
              ...sl,
              background: t.bg,
              elements: sl.elements.map((el) => {
                if (el.type === 'text') {
                  const tc = el.content as TextContent
                  const isTitle = (tc.fontSize ?? 16) >= 28
                  return {
                    ...el,
                    content: {
                      ...tc,
                      fontFamily: typography,
                      color: isTitle ? t.titleText : t.subtitleText,
                    },
                  }
                }

                if (el.type === 'shape') {
                  const sc = el.content as ShapeContent
                  return {
                    ...el,
                    content: {
                      ...sc,
                      backgroundColor: t.cardFill,
                      borderColor: strokeColor,
                      textColor: t.cardText,
                    },
                  }
                }

                if (el.type === 'line') {
                  const lc = el.content as LineContent
                  return {
                    ...el,
                    content: {
                      ...lc,
                      color: lineColor,
                    },
                  }
                }

                if (el.type === 'section') {
                  const sec = el.content as SectionContent
                  return {
                    ...el,
                    content: {
                      ...sec,
                      backgroundColor: t.sectionFill,
                      borderColor: t.sectionBorder,
                    },
                  }
                }

                return el
              }),
            })),
            updatedAt: Date.now(),
          }
        }),
      }))

      return {
        success: true,
        data: {
          theme,
          typography,
          slideCount: project.slides.length,
          message: `Applied theme "${theme}" and typography "${typography}" across all ${project.slides.length} slides.`,
        },
      }
    }

    case 'harmonizeSlideStyles': {
      const { titleFontSize = 36, subtitleFontSize = 18, bodyFontSize = 14 } = args as {
        titleFontSize?: number
        subtitleFontSize?: number
        bodyFontSize?: number
      }

      let modifiedCount = 0

      useEditorStore.setState((s) => ({
        projects: s.projects.map((p) => {
          if (p.id !== activeProjectId) return p
          return {
            ...p,
            slides: p.slides.map((sl) => ({
              ...sl,
              elements: sl.elements.map((el) => {
                if (el.type === 'text') {
                  const tc = el.content as TextContent
                  const currentSize = tc.fontSize ?? 16
                  let newSize = bodyFontSize
                  if (currentSize >= 28) newSize = titleFontSize
                  else if (currentSize >= 18) newSize = subtitleFontSize

                  if (newSize !== currentSize) {
                    modifiedCount++
                    return {
                      ...el,
                      content: {
                        ...tc,
                        fontSize: newSize,
                      },
                    }
                  }
                }
                return el
              }),
            })),
            updatedAt: Date.now(),
          }
        }),
      }))

      return {
        success: true,
        data: {
          modifiedElements: modifiedCount,
          message: `Harmonized font sizes across ${project.slides.length} slides (${modifiedCount} text elements standardized).`,
        },
      }
    }

    default:
      return { success: false, error: `Unknown theme tool: ${toolName}` }
  }
}
