import { motion, AnimatePresence } from 'framer-motion'
import type { CodeContent } from '../../../types'

interface Props { content: CodeContent }

// Give each line a stable hash so Framer can track it between slides
function hashLine(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0
  }
  return `line-${Math.abs(hash).toString(36)}`
}

interface AnnotatedLine {
  id: string
  text: string
  added?: boolean
  removed?: boolean
}

function buildAnnotatedLines(code: string): AnnotatedLine[] {
  return code.split('\n').map((line) => ({
    id: hashLine(line + code.indexOf(line)),
    text: line,
  }))
}

export function CodeElement({ content }: Props) {
  const lines = buildAnnotatedLines(content.value)

  return (
    <div className="code-block">
      <AnimatePresence mode="sync" initial={false}>
        {lines.map((line) => (
          <motion.span
            key={line.id}
            layoutId={`code-${line.id}`}
            className="code-line"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {line.text || ' '}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  )
}
