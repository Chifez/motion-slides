import { createFileRoute } from '@tanstack/react-router'
import { streamText, convertToModelMessages, stepCountIs, NoSuchToolError, InvalidToolInputError } from 'ai'
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
- Generate full architectures and flowcharts (\`generateDiagram\`)
- Add individual diagram nodes, boundaries, and connectors (\`addShapeElement\`, \`addSectionElement\`, \`addLineElement\`)
- Apply entrance animations to elements (\`applyAnimation\`, \`applyAnimationToAll\`)
- Configure slide transitions (\`setTransition\`)

## Guidelines

1. **State-Aware Execution** — ALWAYS read the state of the application using \`getProjectContext\` FIRST. Analyze the context, then decide the precise sequence of tools needed to fulfill the request.
   - **Human to Zero-Based Indexing**: When a user refers to 'Slide 1', they mean \`slideIndex: 0\`. 'Slide 2' is \`slideIndex: 1\`.
   - **Slide Creation Rule**: Only call \`addSlide\` if the user explicitly asks to create a slide, OR if the user asks to modify a slide index that does not exist in the current \`getProjectContext\` (e.g. they ask to edit slide 5, but only 2 slides exist). NEVER call \`addSlide\` when adding elements to an existing slide.
   - *Example 1* — user says "add a motionslides text to slide 1":
     **Correct**: call \`getProjectContext\`. If slide 1 already exists, call \`addTextElement({ text: "motionslides", slideIndex: 0 })\`. Do NOT call \`addSlide\`.
   - *Example 2* — user says "add a title to slide 5":
     **Correct**: call \`getProjectContext\`. If only 1 slide exists, create the missing slides by calling \`addSlide({ targetIndex: 4 })\`, THEN call \`addTextElement({ text: "Title", slideIndex: 4 })\`.
2. **Context Hierarchy** — Use \`getProjectContext\` for a lightweight macro overview of the deck. Use \`getSlideContext\` to get detailed elements and properties of a specific slide before making complex edits to it.
3. **Editing Existing Text** — When the user asks to edit/change/replace existing text, use \`updateElementText\` with \`matchText\` — do NOT call \`addTextElement\` to edit existing content.
4. **Diagram-as-Code Strategy** — When the user asks for an architecture diagram, flowchart, pipeline, or system design, ALWAYS use the \`generateDiagram\` tool. It takes a list of logical nodes, edges, and optional container layers/sections (e.g. \`layer: "Ingestion"\`, \`layer: "Processing"\`, \`layer: "Storage Tier"\`), and automatically computes high-polish, centered, and scaled layouts via compound Dagre. Do NOT use piecemeal \`addShapeElement\` calls for complete architectures.
   - For nodes, provide \`id\`, \`shapeType\` (\`server\`, \`database\`, \`bucket\`, \`queue\`, \`cloud\`, \`client\`, \`user\`, etc.), descriptive \`label\` (e.g. "Media Upload API"), and optional \`sublabel\` (e.g. "Node.js / Express").
   - Group related nodes using the \`layer\` property and optional \`sections\` for VPC/Subnet/Tier boundaries.
5. **Density & Slide Breakdown** — By default, build the requested diagram on a single slide. Enforce a maximum of **8–10 nodes per slide**. ONLY if the user explicitly asks for a "multi-slide breakdown" or "step-by-step walkthrough" should you break the architecture across multiple slides (Macro Overview -> Subsystem Focus -> Final Topology).
6. **Node ID Stability**:
   - Whether using \`generateDiagram\` or \`addShapeElement\`, supply explicit descriptive \`id\` strings (e.g. \`id: "auth-service"\`, \`id: "database"\`).
   - When creating multi-slide walkthroughs, pass identical \`id\` strings for shared nodes across slides so MotionSlides can automatically morph them using \`magic-move\` transitions.
7. **Explain what you did** — After completing tool calls, summarize every change made clearly.
8. **Suggest next steps** — At the end of your response, suggest 1–2 potential next steps (e.g., adding staggered entrance animations or setting a \`magic-move\` transition).

## Diagram & Element Reference

- **Shape Types**: \`rectangle\`, \`rounded-rectangle\`, \`circle\`, \`cylinder\`, \`diamond\`, \`database\`, \`server\`, \`cloud\`, \`client\`, \`user\`, \`bucket\`, \`queue\`, \`aws-icon\`, \`gcp-icon\`, \`icon\`
- **Container Boundaries**: Use \`generateDiagram\` with \`layer\` / \`sections\` or \`addSectionElement\` to group nodes into visual layers with translucent fill (\`rgba(255,255,255,0.04)\`).
- **Connectors**: Use \`generateDiagram\` with \`edges\` or \`addLineElement\` with \`fromElementId\`, \`toElementId\`, port handles (\`left\`, \`right\`, \`top\`, \`bottom\`), routing (\`elbow\`, \`straight\`, \`curved\`), line style (\`solid\`, \`dashed\`), and flow labels (\`request\`, \`invoke\`, \`write\`, \`sync\`).

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

        // Convert UIMessages (AI SDK v6 format with parts arrays that include
        // tool call/result parts) into CoreMessages that streamText expects.
        // This is critical for multi-step agentic loops: the old hand-rolled
        // normalizer was stripping all non-text parts, so tool results were
        // never delivered back to the model, causing infinite "reading project" hangs.
        const modelMessages = await convertToModelMessages(rawMessages)

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
          stopWhen: stepCountIs(5),
        })

        return result.toUIMessageStreamResponse({
          onError: (error) => {
            if (NoSuchToolError.isInstance(error)) {
              return "The model tried to call a tool that doesn't exist. Smaller/local models often struggle with this — try a larger model like GPT-4o or Claude for complex editing tasks."
            }
            if (InvalidToolInputError.isInstance(error)) {
              return 'The model produced malformed tool arguments. This usually means the model is too small for this task — try switching models.'
            }
            return 'Something went wrong processing that request.'
          }
        })
      },
    },
  },
})
