import { describe, expect, it } from 'vitest'
import { isDevelopmentQuotaBypass } from './development-quota'

describe('isDevelopmentQuotaBypass', () => {
  it('only enables the bypass when explicitly configured outside production', () => {
    expect(isDevelopmentQuotaBypass({ NODE_ENV: 'development', DISABLE_AI_QUOTA: 'true' })).toBe(true)
    expect(isDevelopmentQuotaBypass({ NODE_ENV: 'development' })).toBe(false)
    expect(isDevelopmentQuotaBypass({ NODE_ENV: 'production', DISABLE_AI_QUOTA: 'true' })).toBe(false)
  })
})
