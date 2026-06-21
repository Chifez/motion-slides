/**
 * motionShared.ts
 * Framework-agnostic animation configurations and transition mappings for MotionSlides.
 */

export const EASE_IN_OUT: [number, number, number, number] = [0.37, 0, 0.63, 1]

export interface TransitionState {
  initial: Record<string, any>
  animate: Record<string, any>
  exit: Record<string, any>
  style?: Record<string, any>
}

export const getTransitionStates = (
  animationType: string,
  elementOpacity: number
): TransitionState => {
  switch (animationType) {
    case 'slide-left':
      return {
        initial: { opacity: 0, x: 40, y: 0, scale: 1 },
        animate: { opacity: elementOpacity, x: 0, y: 0, scale: 1 },
        exit: { opacity: 0, x: -40, y: 0, scale: 1 },
      }
    case 'slide-right':
      return {
        initial: { opacity: 0, x: -40, y: 0, scale: 1 },
        animate: { opacity: elementOpacity, x: 0, y: 0, scale: 1 },
        exit: { opacity: 0, x: 40, y: 0, scale: 1 },
      }
    case 'slide-up':
      return {
        initial: { opacity: 0, x: 0, y: 30, scale: 1 },
        animate: { opacity: elementOpacity, x: 0, y: 0, scale: 1 },
        exit: { opacity: 0, x: 0, y: -30, scale: 1 },
      }
    case 'slide-down':
      return {
        initial: { opacity: 0, x: 0, y: -30, scale: 1 },
        animate: { opacity: elementOpacity, x: 0, y: 0, scale: 1 },
        exit: { opacity: 0, x: 0, y: 30, scale: 1 },
      }
    case 'zoom':
      return {
        initial: { opacity: 0, x: 0, y: 0, scale: 0.3 },
        animate: { opacity: elementOpacity, x: 0, y: 0, scale: 1 },
        exit: { opacity: 0, x: 0, y: 0, scale: 1.5 },
      }
    case 'flip':
      return {
        initial: { opacity: 0, rotateY: 90, scale: 1 },
        animate: { opacity: elementOpacity, rotateY: 0, scale: 1 },
        exit: { opacity: 0, rotateY: -90, scale: 1 },
        style: { perspective: '1000px', transformStyle: 'preserve-3d' },
      }
    case 'fade':
    default:
      return {
        initial: { opacity: 0, x: 0, y: 0, scale: 1 },
        animate: { opacity: elementOpacity, x: 0, y: 0, scale: 1 },
        exit: { opacity: 0, x: 0, y: 0, scale: 1 },
      }
  }
}
