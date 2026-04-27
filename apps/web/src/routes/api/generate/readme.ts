import { createFileRoute } from '@tanstack/react-router'
import { parseReadme, buildReadmeBriefing } from '@/lib/generation/markdownParser'
import { generateFromReadme } from '@/lib/generation/generationClient'
import { assembleSlides } from '@/lib/generation/slideAssembler'

const rateLimits = new Map<string, { count: number, resetAt: number }>()

export const Route = createFileRoute('/api/generate/readme')({
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
              let generated;

              if (body.refinementPrompt && body.previousPresentation) {
                const cleanPrompt = body.refinementPrompt.replace(/<[^>]*>?/gm, '').trim()
                send({ stage: 'capturing', percent: 20, message: 'Applying refinements…' })
                const { refinePresentation } = await import('@/lib/generation/generationClient')
                generated = await refinePresentation({
                  instruction: cleanPrompt,
                  previousPresentation: body.previousPresentation,
                })
              } else {
                const cleanMarkdown = markdown.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').trim()
                const parsed = parseReadme(cleanMarkdown)
                const briefing = buildReadmeBriefing(parsed, slideCount)

                send({ stage: 'capturing', percent: 20, message: 'Generating with AI…' })
                generated = await generateFromReadme({
                  briefing,
                  rawMarkdown: markdown,
                  slideCount,
                  style,
                  theme
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
                rawPresentation: generated,
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
