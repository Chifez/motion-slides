import { createFileRoute } from '@tanstack/react-router'
import { parseArchitecture, buildArchitectureBriefing } from '@/lib/generation/architectureParser'
import { generateFromArchitecture } from '@/lib/generation/generationClient'
import { assembleSlides } from '@/lib/generation/slideAssembler'

// In-memory rate limiting (IP/Session based) for protection against API abuse
const rateLimits = new Map<string, { count: number, resetAt: number }>()

export const Route = createFileRoute("/api/generate/architecture")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const ip = request.headers.get('x-forwarded-for') || 'anonymous'
        const now = Date.now()
        const limit = rateLimits.get(ip)
        
        if (limit && now < limit.resetAt) {
          if (limit.count >= 20) {
            return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
              status: 429, headers: { 'Content-Type': 'application/json' },
            })
          }
          limit.count++
        } else {
          rateLimits.set(ip, { count: 1, resetAt: now + 3600000 }) // 1 hour reset
        }

        const body = await request.json()
        const { description, options = {} } = body
        const { slideCount = 6, diagramStyle = 'generic', theme = 'dark' } = options

        if (!description || typeof description !== 'string') {
          return new Response(JSON.stringify({ error: 'description is required' }), {
            status: 400, headers: { 'Content-Type': 'application/json' },
          })
        }
        if (description.length > 5000) {
          return new Response(JSON.stringify({ error: 'Description too long (max 5 000 chars)' }), {
            status: 400, headers: { 'Content-Type': 'application/json' },
          })
        }

        const stream = new ReadableStream({
          async start(controller) {
            const enc = new TextEncoder()
            const send = (data: object) =>
              controller.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`))

            try {
              send({ stage: 'preparing', percent: 5, message: 'Analysing architecture…' })
              let generated;

              if (body.refinementPrompt && body.previousPresentation) {
                // Sanitize user refinement prompt
                const cleanPrompt = body.refinementPrompt.replace(/<[^>]*>?/gm, '').trim()
                send({ stage: 'capturing', percent: 20, message: 'Applying refinements…' })
                const { refinePresentation } = await import('@/lib/generation/generationClient')
                generated = await refinePresentation({
                  instruction: cleanPrompt,
                  previousPresentation: body.previousPresentation,
                })
              } else {
                // Sanitize base input
                const cleanDescription = description.replace(/<[^>]*>?/gm, '').trim()
                const parsed = parseArchitecture(cleanDescription)
                const briefing = buildArchitectureBriefing(parsed)

                send({ stage: 'capturing', percent: 20, message: 'Generating diagram slides…' })
                generated = await generateFromArchitecture({
                  briefing,
                  rawInput: description,
                  diagramStyle,
                  slideCount,
                  theme,
                })
              }

              send({ stage: 'encoding', percent: 80, message: 'Assembling slides…' })
              const slides = assembleSlides(generated)

              send({
                stage: 'done',
                percent: 100,
                message: `Generated ${slides.length} slides`,
                slides,
                title: generated.title,
                theme: generated.theme,
                requiresLineRecalc: true,
                rawPresentation: generated,
              })
            } catch (err: any) {
              console.error('[generate/architecture]', err)
              send({ stage: 'error', percent: 0, message: 'Generation failed. Please try again.' })
            } finally {
              controller.close()
            }
          }
        })

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no',
          },
        })
      },
    }
  }
})
