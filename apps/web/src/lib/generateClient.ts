export type GenerationMode = 'readme' | 'architecture'

export interface GenerationOptions {
  mode:         GenerationMode
  markdown?:    string
  description?: string
  slideCount?:  number
  style?:       'technical' | 'executive' | 'tutorial'
  diagramStyle?: 'generic' | 'aws' | 'gcp' | 'minimal'
  theme?:       'dark' | 'light' | 'auto'
  refinementPrompt?: string
  previousPresentation?: any
}

export interface GenerationEvent {
  stage:    'preparing' | 'capturing' | 'encoding' | 'done' | 'error'
  percent:  number
  message:  string
  slides?:  any[]
  title?:   string
  theme?:   object
  requiresLineRecalc?: boolean
  rawPresentation?: any
}

export async function generateSlides(
  opts:       GenerationOptions,
  onProgress: (e: GenerationEvent) => void,
): Promise<any[] | null> {
  const endpoint = opts.mode === 'readme'
    ? '/api/generate/readme'
    : '/api/generate/architecture'

  const body = opts.mode === 'readme'
    ? { markdown: opts.markdown, refinementPrompt: opts.refinementPrompt, previousPresentation: opts.previousPresentation, options: { slideCount: opts.slideCount, style: opts.style, theme: opts.theme } }
    : { description: opts.description, refinementPrompt: opts.refinementPrompt, previousPresentation: opts.previousPresentation, options: { slideCount: opts.slideCount, diagramStyle: opts.diagramStyle, theme: opts.theme } }

  let res: Response
  try {
    res = await fetch(endpoint, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })
  } catch {
    onProgress({ stage: 'error', percent: 0, message: 'Cannot reach server.' })
    return null
  }

  if (!res.body) return null

  const reader  = res.body.getReader()
  const decoder = new TextDecoder()
  let   buffer  = ''
  let   result: any[] | null = null

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      try {
        const event = JSON.parse(line.slice(6)) as GenerationEvent
        onProgress(event)
        if (event.stage === 'done' && event.slides) result = event.slides
        if (event.stage === 'error') return null
      } catch {}
    }
  }

  return result
}
