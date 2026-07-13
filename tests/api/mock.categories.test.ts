import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockClient } from '../../src/api/mock'
import { runWithMockDelay } from './helpers'

describe('createMockClient categories', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('creates and deletes a category', async () => {
    const client = createMockClient()
    const before = await runWithMockDelay(client.listCategories())

    const created = await runWithMockDelay(client.createCategory({ name: 'Test Cat', description: 'CI' }))
    const afterCreate = await runWithMockDelay(client.listCategories())

    await runWithMockDelay(client.deleteCategory(created.id))
    const afterDelete = await runWithMockDelay(client.listCategories())

    expect(created.name).toBe('Test Cat')
    expect(afterCreate.total).toBe(before.total + 1)
    expect(afterDelete.total).toBe(before.total)
  })
})
