interface LogoProps {
  /** Show logo + "MotionSlides" wordmark */
  expanded?: boolean
  /** Height of the logo image in pixels */
  size?: number
}

/**
 * MotionSlides Logo
 * - expanded=true: logo image + "MotionSlides" wordmark (dashboard)
 * - expanded=false: logo image only (editor toolbar)
 */
export function Logo({ expanded = false, size = 28 }: LogoProps) {
  return (
    <span className="inline-flex items-center gap-2 no-underline select-none">
      <img
        src="/logo.png"
        alt="MotionSlides"
        style={{ height: size, width: 'auto' }}
      />
      {expanded && (
        <span
          className="font-semibold tracking-tight text-white"
          style={{ fontSize: size * 0.6 }}
        >
          Motion<span className="text-neutral-400">Slides</span>
        </span>
      )}
    </span>
  )
}
