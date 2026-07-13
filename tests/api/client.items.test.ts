import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createHttpClient } from '../../src/api/client'
import { jsonResponse } from './helpers'

describe('createHttpClient items', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('builds item list query params', async () => {
    const client = createHttpClient('http://localhost:8000')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ items: [], total: 0, skip: 5, limit: 10 }))

    await client.listItems({ skip: 5, limit: 10, category_id: 2, name_contains: 'widget' })

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/items?skip=5&limit=10&category_id=2&name_contains=widget',
      expect.any(Object),
    )
  })
})
