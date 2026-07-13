import { vi } from 'vitest'

/** Advance fake timers past the mock client's artificial delay. */
export async function runWithMockDelay<T>(promise: Promise<T>) {
  await vi.advanceTimersByTimeAsync(200)
  return promise
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
