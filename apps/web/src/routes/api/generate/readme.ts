import { createFileRoute } from '@tanstack/react-router'
import { parseReadme, buildReadmeBriefing } from '@/lib/generation/markdownParser'
import { buildReadmePrompt } from '@/lib/generation/promptBuilder'
import { generatePresentation } from '@/lib/generation/generationClient'
import { assembleSlides } from '@/lib/generation/slideAssembler'

export const Route = createFileRoute('/api/generate/readme')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json()
        const { markdown, options = {} } = body
        const { slideCount = 10, style = 'technical', theme = 'dark' } = options

        if (!markdown || typeof markdown !== 'string') {
          return new Response(JSON.stringify({ error: 'markdown is required' }), {
            status: 400, headers: { 'Content-Type': 'application/json' },
          })
        }
        if (markdown.length > 50000) {
          return new Response(JSON.stringify({ error: 'README too large (max 50 000 chars)' }), {
            status: 400, headers: { 'Content-Type': 'application/json' },
          })
        }

        const stream = new ReadableStream({
          async start(controller) {
            const enc = new TextEncoder()
            const send = (data: object) =>
              controller.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`))

            try {
              send({ stage: 'preparing', percent: 5, message: 'Parsing README…' })
              const parsed = parseReadme(markdown)
              const briefing = buildReadmeBriefing(parsed, slideCount)

              send({ stage: 'preparing', percent: 15, message: 'Building prompt…' })
              const userPrompt = buildReadmePrompt({ briefing, slideCount, style, theme })

              send({ stage: 'capturing', percent: 20, message: 'Generating with AI…' })
              const generated = await generatePresentation({ userPrompt })

              send({ stage: 'encoding', percent: 80, message: 'Assembling slides…' })
              const slides = assembleSlides(generated)

              send({
                stage: 'done',
                percent: 100,
                message: `Generated ${slides.length} slides`,
                slides,
                title: generated.title,
                theme: generated.theme,
              })
            } catch (err: any) {
              console.error('[generate/readme]', err)
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
