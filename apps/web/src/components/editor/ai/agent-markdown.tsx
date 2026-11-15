import ReactMarkdown, { defaultUrlTransform, type Components } from 'react-markdown'
import { ArrowUpRight } from 'lucide-react'
import { useEditorStore } from '@/store/editor-store'

/**
 * Agent prose. 13px / 20px Inter, primary ink, no container: the agent speaks directly
 * on the panel surface; only the user's message gets a surface.
 *
 * "Slide N" mentions become links that move the canvas to that slide, but only when
 * the slide exists, so the agent can never produce a dead link.
 */

const SLIDE_SCHEME = 'ms-slide:'
const CODE_SEGMENT = /(```[\s\S]*?```|`[^`\n]*`)/g
const SLIDE_MENTION = /(?<!\[)\bSlide (\d{1,3})\b(?!\])/g

function linkifySlideRefs(markdown: string, slideCount: number): string {
  if (slideCount === 0) return markdown
  return markdown
    .split(CODE_SEGMENT)
    .map((segment, index) =>
      // Odd indices are the captured code segments; leave them untouched.
      index % 2 === 1
        ? segment
        : segment.replace(SLIDE_MENTION, (match, digits: string) => {
            const slideNumber = Number(digits)
            return slideNumber >= 1 && slideNumber <= slideCount ? `[Slide ${slideNumber}](${SLIDE_SCHEME}${slideNumber})` : match
          }),
    )
    .join('')
}

function transformUrl(url: string): string {
  return url.startsWith(SLIDE_SCHEME) ? url : defaultUrlTransform(url)
}

function SlideReference({ slideNumber }: { slideNumber: number }) {
  const setActiveSlide = useEditorStore((s) => s.setActiveSlide)
  return (
    <button
      type="button"
      onClick={() => setActiveSlide(slideNumber - 1)}
      className="ms-focus-ring mx-px inline-flex cursor-pointer items-center gap-0.5 rounded-md border border-(--ms-border-strong) bg-(--ms-bg-elevated) px-1.5 align-baseline text-xs leading-4.5 font-medium text-(--ms-accent) transition-[transform,border-color] duration-150 hover:border-(--ms-accent)/50 active:scale-[0.97]"
    >
      Slide {slideNumber}
      <ArrowUpRight size={10} />
    </button>
  )
}

const components: Components = {
  a({ href, children }) {
    if (href?.startsWith(SLIDE_SCHEME)) {
      return <SlideReference slideNumber={Number(href.slice(SLIDE_SCHEME.length))} />
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className="ms-focus-ring rounded-sm text-(--ms-accent) underline decoration-(--ms-accent)/40 underline-offset-2 hover:decoration-(--ms-accent)"
      >
        {children}
      </a>
    )
  },
  ul: ({ children }) => (
    <ul style={{ gap: 10, paddingLeft: 18 }} className="flex list-disc flex-col marker:text-(--ms-text-muted)">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol style={{ gap: 10, paddingLeft: 18 }} className="flex list-decimal flex-col marker:text-(--ms-text-muted)">
      {children}
    </ol>
  ),
  h1: ({ children }) => <h3 className="pt-1 text-[14px] leading-[20px] font-semibold tracking-tight">{children}</h3>,
  h2: ({ children }) => <h3 className="pt-1 text-[13px] leading-[20px] font-semibold">{children}</h3>,
  h3: ({ children }) => <h4 className="pt-1 text-[13px] leading-[20px] font-semibold text-(--ms-text-secondary)">{children}</h4>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-(--ms-border-strong) pl-3 text-(--ms-text-secondary)">{children}</blockquote>
  ),
  hr: () => <hr className="border-(--ms-border)" />,
  pre: ({ children }) => (
    <pre className="custom-scrollbar overflow-x-auto rounded-lg border border-(--ms-border) bg-(--ms-bg-base) p-3 font-mono text-xs leading-5 [&>code]:border-0 [&>code]:bg-transparent [&>code]:p-0 [&>code]:text-inherit">
      {children}
    </pre>
  ),
  code: ({ children, className }) => (
    <code
      className={`rounded border border-(--ms-border) bg-(--ms-bg-elevated) px-1 py-px font-mono text-xs text-(--ms-text-primary) ${className ?? ''}`}
    >
      {children}
    </code>
  ),
}

export function AgentMarkdown({ children }: { children: string }) {
  const slideCount = useEditorStore((s) => s.projects.find((p) => p.id === s.activeProjectId)?.slides.length ?? 0)

  return (
    <div
      style={{ gap: 16 }}
      className="flex flex-col text-[13px] leading-[22px] tracking-[-0.006em] wrap-break-word text-(--ms-text-primary)"
    >
      <ReactMarkdown components={components} urlTransform={transformUrl}>
        {linkifySlideRefs(children, slideCount)}
      </ReactMarkdown>
    </div>
  )
}
