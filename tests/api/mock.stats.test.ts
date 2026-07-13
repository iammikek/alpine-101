import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockClient } from '../../src/api/mock'
import { runWithMockDelay } from './helpers'

describe('createMockClient stats', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns item stats summary', async () => {
    const client = createMockClient()
    const stats = await runWithMockDelay(client.getItemStats())

    expect(stats.total_items).toBeGreaterThanOrEqual(3)
    expect(stats.min_price).not.toBeNull()
    expect(stats.max_price).not.toBeNull()
    expect(stats.by_category.length).toBeGreaterThan(0)
  })
})
