import { describe, it, expect } from 'vitest'
import {
  MIN_PX_PER_SEC,
  MAX_PX_PER_SEC,
  formatTime,
  formatRulerTick,
  getRulerIntervals,
  computeFitPxPerSec,
  resolveCanvasColor,
} from './constants'

describe('timeline utilities', () => {
  it('formats timecodes cleanly and guards invalid/negative inputs', () => {
    expect(formatTime(0)).toBe('00:00.0')
    expect(formatTime(4.26)).toBe('00:04.2')
    expect(formatTime(65.9)).toBe('01:05.9')
    expect(formatTime(-5)).toBe('00:00.0')
    expect(formatTime(Number.NaN)).toBe('00:00.0')
  })

  it('formats ruler ticks in seconds below 60s and M:SS at 60s+', () => {
    expect(formatRulerTick(0)).toBe('0s')
    expect(formatRulerTick(12)).toBe('12s')
    expect(formatRulerTick(60)).toBe('1:00')
    expect(formatRulerTick(125)).toBe('2:05')
  })

  it('selects adaptive major/minor intervals based on zoom level', () => {
    expect(getRulerIntervals(24)).toEqual({ majorSec: 10, minorSec: 2 })
    expect(getRulerIntervals(50)).toEqual({ majorSec: 5, minorSec: 1 })
    expect(getRulerIntervals(80)).toEqual({ majorSec: 2, minorSec: 0.5 })
    expect(getRulerIntervals(160)).toEqual({ majorSec: 1, minorSec: 0.25 })
  })

  it('computes clamped fit-to-view zoom across short and long timelines', () => {
    expect(computeFitPxPerSec(10, 832)).toBe(80)
    expect(computeFitPxPerSec(2, 1000)).toBe(MAX_PX_PER_SEC)
    expect(computeFitPxPerSec(120, 800)).toBe(MIN_PX_PER_SEC)
  })

  it('resolves canvas colors safely for literals and CSS var fallbacks', () => {
    expect(resolveCanvasColor(null, '#3b82f6')).toBe('#3b82f6')
    expect(resolveCanvasColor(null, 'var(--ms-vo-fill, rgba(59, 130, 246, 0.5))')).toBe(
      'rgba(59, 130, 246, 0.5)',
    )
    expect(resolveCanvasColor(null, 'var(--ms-vo-fill)', 'rgba(1, 2, 3, 0.4)')).toBe(
      'rgba(1, 2, 3, 0.4)',
    )
  })
})
