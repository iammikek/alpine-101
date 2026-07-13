import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockClient } from '../../src/api/mock'
import { runWithMockDelay } from './helpers'

describe('createMockClient auth', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('supports auth register and me', async () => {
    const client = createMockClient()
    client.setAccessToken(null)

    const user = await runWithMockDelay(client.register('learner@example.com', 'password'))
    const me = await runWithMockDelay(client.getMe())

    expect(user.email).toBe('learner@example.com')
    expect(me.email).toBe('learner@example.com')
    expect(client.accessToken).toBe('mock-token')
  })
})
