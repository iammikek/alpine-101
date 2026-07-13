import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, createHttpClient } from '../../src/api/client'

describe('createHttpClient core', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('normalizes trailing slash on base URL', async () => {
    const client = createHttpClient('http://localhost:8000/')
    expect(client.baseUrl).toBe('http://localhost:8000')
  })

  it('throws ApiError on non-OK responses', async () => {
    const client = createHttpClient('http://localhost:8000')
    vi.mocked(fetch).mockResolvedValueOnce(new Response('Unauthorized', { status: 401 }))

    const err = await client.getHealth().catch((e) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err).toMatchObject({ status: 401, body: 'Unauthorized' })
  })

  it('updates access token via setAccessToken', () => {
    const client = createHttpClient('http://localhost:8000')
    expect(client.accessToken).toBeNull()

    client.setAccessToken('new-token')
    expect(client.accessToken).toBe('new-token')
  })
})
