import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockClient } from '../../src/api/mock'
import { runWithMockDelay } from './helpers'

describe('createMockClient items', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns seeded categories and items', async () => {
    const client = createMockClient()

    const categories = await runWithMockDelay(client.listCategories())
    const items = await runWithMockDelay(client.listItems())

    expect(categories.total).toBeGreaterThanOrEqual(2)
    expect(categories.items.some((c) => c.name === 'Tools')).toBe(true)
    expect(items.total).toBeGreaterThanOrEqual(3)
    expect(items.items.some((i) => i.name === 'Widget')).toBe(true)
  })

  it('filters items by category and name', async () => {
    const client = createMockClient()

    const tools = await runWithMockDelay(client.listItems({ category_id: 1 }))
    const widget = await runWithMockDelay(client.listItems({ name_contains: 'widget' }))

    expect(tools.items.every((i) => i.category_id === 1)).toBe(true)
    expect(widget.items).toHaveLength(1)
    expect(widget.items[0].name).toBe('Widget')
  })

  it('filters items by min_price and max_price', async () => {
    const client = createMockClient()

    const mid = await runWithMockDelay(client.listItems({ min_price: 5, max_price: 15 }))
    const cheap = await runWithMockDelay(client.listItems({ max_price: 5 }))

    expect(mid.items.every((i) => i.price >= 5 && i.price <= 15)).toBe(true)
    expect(mid.items.some((i) => i.name === 'Widget')).toBe(true)
    expect(cheap.items.every((i) => i.price <= 5)).toBe(true)
    expect(cheap.items.some((i) => i.name === 'Novel')).toBe(true)
  })
})
