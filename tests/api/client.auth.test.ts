import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createHttpClient } from '../../src/api/client'
import { jsonResponse } from './helpers'

describe('createHttpClient auth', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends Bearer token on authenticated requests', async () => {
    const client = createHttpClient('http://localhost:8000', 'secret-token')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ id: 1, email: 'user@example.com' }))

    await client.getMe()

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/auth/me',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer secret-token' }),
      }),
    )
  })

  it('posts register payload as JSON', async () => {
    const client = createHttpClient('http://localhost:8000')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ id: 1, email: 'new@example.com' }))

    await client.register('new@example.com', 'password123')

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/auth/register',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ email: 'new@example.com', password: 'password123' }),
      }),
    )
  })

  it('posts login as form-urlencoded', async () => {
    const client = createHttpClient('http://localhost:8000')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ access_token: 'abc', token_type: 'bearer' }))

    await client.login('user@example.com', 'secret')

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/auth/login',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/x-www-form-urlencoded' }),
        body: new URLSearchParams({ username: 'user@example.com', password: 'secret' }),
      }),
    )
  })
})
