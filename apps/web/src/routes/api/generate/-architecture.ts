import { createAPIFileRoute }    from '@tanstack/start/api'
import { parseArchitecture, buildArchitectureBriefing } from '@/lib/generation/architectureParser'
import { buildArchitecturePrompt }                       from '@/lib/generation/promptBuilder'
import { generatePresentation }                          from '@/lib/generation/generationClient'
import { assembleSlides }                                from '@/lib/generation/slideAssembler'

export const APIRoute = createAPIFileRoute('/api/generate/architecture')({
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
        const enc  = new TextEncoder()
        const send = (data: object) =>
          controller.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`))

        try {
          send({ stage: 'preparing', percent: 5,  message: 'Analysing architecture…' })
          const parsed     = parseArchitecture(description)
          const briefing   = buildArchitectureBriefing(parsed)

          send({ stage: 'preparing', percent: 15, message: 'Building prompt…' })
          const userPrompt = buildArchitecturePrompt({ briefing, diagramStyle, slideCount, theme })

          send({ stage: 'capturing', percent: 20, message: 'Generating diagram slides…' })
          const generated  = await generatePresentation({
            userPrompt,
            maxTokens: 12000,
          })

          send({ stage: 'encoding',  percent: 80, message: 'Assembling slides…' })
          const slides     = assembleSlides(generated)

          send({
            stage:              'done',
            percent:            100,
            message:            `Generated ${slides.length} slides`,
            slides,
            title:              generated.title,
            theme:              generated.theme,
            requiresLineRecalc: true,
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
        'Content-Type':      'text/event-stream',
        'Cache-Control':     'no-cache',
        'X-Accel-Buffering': 'no',
      },
    })
  },
})
