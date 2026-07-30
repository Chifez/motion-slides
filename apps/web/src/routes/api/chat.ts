import { createFileRoute } from '@tanstack/react-router'
import { streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { decrypt } from '@/lib/encryption'
import { agentToolSchemas } from '@/lib/agent/tools'

const SYSTEM_PROMPT = `You are the MotionSlide Agent — an expert AI co-pilot embedded inside a professional presentation and motion design tool called MotionSlides.

Your role is to help users design, build, and refine their presentations and architectural diagrams through natural conversation. You have direct access to tools that can:
- Create and manage slides (\`addSlide\`, \`deleteSlide\`, \`goToSlide\`, \`setSlideBackground\`, \`getProjectContext\`)
- Add and edit text elements (\`addTextElement\`, \`updateElementText\`, \`deleteElement\`)
- Add diagram nodes, boundaries, and connectors (\`addShapeElement\`, \`addSectionElement\`, \`addLineElement\`)
- Apply entrance animations to elements (\`applyAnimation\`, \`applyAnimationToAll\`)
- Configure slide transitions (\`setTransition\`)

## Guidelines

1. **Always read context first** — Before making sweeping changes, use the \`getProjectContext\` tool to understand the current slide structure.
2. **Be proactive** — Complete the user's intent fully. When creating a diagram or slide, add title headers, section boundaries, shape nodes, and line connectors together in a logical sequence.
3. **Density & Multi-Slide Breakdown** — To maintain high visual quality (Eraser.io & MotionSlides standard), enforce a maximum of **6–8 nodes per slide**. If a system request is complex (more than 8 nodes), break it into a progressive multi-slide deck:
   - **Slide 1 (Macro Overview)**: High-level system overview with 3–5 primary tier blocks.
   - **Slide 2..N (Subsystem Focus)**: Deep dive into specific layers (e.g. Auth/Ingestion, Event Pipeline, Data Tier).
   - **Final Slide (Integrated System)**: Full connected topology.
4. **Node ID Stability for Magic-Move** — When creating multi-slide walkthroughs, pass identical \`id\` strings for shared nodes across slides so MotionSlides can automatically morph them using \`magic-move\` transitions.
5. **Canvas Coordinate System (1280×720 Canvas)**:
   - Header / Title text: y ≈ 40–80, x ≈ 80, fontSize ≈ 36–48
   - Tier 1 (Client / Edge Ingestion): y ≈ 120–200
   - Tier 2 (Gateway / Logic / Microservices): y ≈ 280–380
   - Tier 3 (Data / Storage / Caching): y ≈ 480–580
   - Shape Node default size: width = 90, height = 90
   - Section Boundaries: Width/height wrapping tier nodes with ~20px padding
6. **Explain what you did** — After completing tool calls, summarize every change made clearly.
7. **Suggest next steps** — At the end of your response, suggest 1–2 potential next steps (e.g., adding staggered entrance animations or setting a \`magic-move\` transition).

## Diagram & Element Reference

- **Shape Types**: \`rectangle\`, \`rounded-rectangle\`, \`circle\`, \`cylinder\`, \`diamond\`, \`database\`, \`server\`, \`cloud\`, \`client\`, \`user\`, \`bucket\`, \`queue\`, \`aws-icon\`, \`gcp-icon\`, \`icon\`
- **Section Boundaries**: Use \`addSectionElement\` to group nodes into visual layers with translucent fill (\`rgba(255,255,255,0.04)\`).
- **Connectors**: Use \`addLineElement\` with \`fromElementId\`, \`toElementId\`, port handles (\`left\`, \`right\`, \`top\`, \`bottom\`), routing (\`elbow\`, \`straight\`, \`curved\`), line style (\`solid\`, \`dashed\`), and flow labels (\`request\`, \`invoke\`, \`write\`, \`sync\`).

## Animation & Transition Reference
- **Animations**: \`fade-in\`, \`slide-up\`, \`slide-left\`, \`zoom-in\`, \`pop\`, \`draw\` (exclusive to line elements), \`none\`
- **Transitions**: \`magic-move\` (signature morph effect), \`slide-left\`, \`slide-right\`, \`slide-up\`, \`slide-down\`, \`fade\`, \`zoom\`, \`flip\``

// Model IDs served locally by Ollama
const OLLAMA_MODELS = new Set([
  'llama3.2', 'llama3.2:3b', 'llama3.1', 'llama3.1:8b', 'llama3.1:70b',
  'mistral', 'mistral:7b', 'qwen2.5', 'gemma3', 'phi4', 'deepseek-r1',
])

function resolveProvider(modelId: string, openaiKey: string, anthropicKey: string) {
  if (OLLAMA_MODELS.has(modelId)) {
    const ollamaProvider = createOpenAI({
      baseURL: 'http://localhost:11434/v1',
      apiKey: 'ollama',
    })
    return ollamaProvider(modelId)
  }

  if (modelId.startsWith('claude')) {
    const anthropicProvider = createAnthropic({
      apiKey: anthropicKey || process.env.ANTHROPIC_API_KEY || '',
    })
    return anthropicProvider(modelId as Parameters<ReturnType<typeof createAnthropic>>[0])
  }

  const openaiProvider = createOpenAI({ apiKey: openaiKey })
  return openaiProvider(modelId as Parameters<ReturnType<typeof createOpenAI>>[0])
}

function normalizeMessagesForStreamText(rawMessages: unknown[]): Array<{ role: 'user' | 'assistant' | 'system'; content: string }> {
  if (!Array.isArray(rawMessages)) return []

  const result: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = []

  for (const m of rawMessages) {
    if (!m || typeof m !== 'object') continue

    const msg = m as Record<string, unknown>
    const role = msg.role === 'assistant' ? 'assistant' : msg.role === 'system' ? 'system' : 'user'

    let textContent = ''

    if (typeof msg.content === 'string') {
      textContent = msg.content
    } else if (Array.isArray(msg.content)) {
      textContent = (msg.content as Array<Record<string, unknown>>)
        .filter((c) => c && typeof c === 'object' && c.type === 'text')
        .map((c) => String(c.text ?? ''))
        .join('\n')
    } else if (Array.isArray(msg.parts)) {
      textContent = (msg.parts as Array<Record<string, unknown>>)
        .filter((p) => p && typeof p === 'object' && (p.type === 'text' || p.text))
        .map((p) => String(p.text ?? ''))
        .join('\n')
    } else if (typeof msg.text === 'string') {
      textContent = msg.text
    }

    if (textContent.trim() || role === 'user') {
      result.push({
        role,
        content: textContent,
      })
    }
  }

  return result
}

export const Route = createFileRoute('/api/chat')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        // ── Auth & Key resolution ──────────────────────────────────────
        const session = await auth.api.getSession({ headers: request.headers })

        let openaiApiKey = process.env.OPENAI_API_KEY ?? ''
        let anthropicApiKey = process.env.ANTHROPIC_API_KEY ?? ''

        if (session?.user?.id) {
          try {
            const userRecord = await db.query.user.findFirst({
              where: eq(user.id, session.user.id),
            })
            if (userRecord?.encryptedOpenAIKey) {
              openaiApiKey = decrypt(userRecord.encryptedOpenAIKey) || openaiApiKey
            }
          } catch {
            // fall through to env key
          }
        }

        // ── Parse Body ────────────────────────────────────────────────
        const raw = await request.json()
        const rawMessages = Array.isArray(raw.messages) ? raw.messages : []
        const model = typeof raw.model === 'string' ? raw.model : 'gpt-4o'

        // Robustly normalize messages for streamText
        const modelMessages = normalizeMessagesForStreamText(rawMessages)

        // For Ollama models, no server-side auth is required
        const isOllamaModel = OLLAMA_MODELS.has(model)

        // For cloud models, require either a configured env key or a session
        if (!isOllamaModel && !session && !openaiApiKey) {
          return new Response(JSON.stringify({ error: 'Unauthorized. Please log in or configure an API key.' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        // ── Resolve the correct provider ──────────────────────────────
        const providerModel = resolveProvider(model, openaiApiKey, anthropicApiKey)

        // ── Stream the response with registered tools & maxSteps ─────
        const result = streamText({
          model: providerModel,
          system: SYSTEM_PROMPT,
          messages: modelMessages,
          tools: agentToolSchemas,
        })

        return result.toTextStreamResponse()
      },
    },
  },
})
