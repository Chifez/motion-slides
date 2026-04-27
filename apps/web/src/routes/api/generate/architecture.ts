import { createFileRoute } from '@tanstack/react-router'
import { parseArchitecture, buildArchitectureBriefing } from '@/lib/generation/architectureParser'
import { generateFromArchitecture } from '@/lib/generation/generationClient'
import { assembleSlides } from '@/lib/generation/slideAssembler'

export const Route = createFileRoute("/api/generate/architecture")({
  server: {
    handlers: {
      POST: async ({ request }) => {
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
                send({ stage: 'capturing', percent: 20, message: 'Applying refinements…' })
                const { refinePresentation } = await import('@/lib/generation/generationClient')
                generated = await refinePresentation({
                  instruction: body.refinementPrompt,
                  previousPresentation: body.previousPresentation,
                })
              } else {
                const parsed = parseArchitecture(description)
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
