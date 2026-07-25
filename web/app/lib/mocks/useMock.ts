/**
 * useMock — Dev utility hook
 * ───────────────────────────
 * Returns true when NEXT_PUBLIC_USE_MOCKS=true in .env.local
 * Use this to gate real API calls vs. mock fixtures during development.
 *
 * Usage in any component:
 *   const isMock = useMock()
 *   const data = isMock ? MOCK_CHAT_RESPONSE_EN : await postChat(payload)
 *
 * Set NEXT_PUBLIC_USE_MOCKS=false once the backend endpoint is ready.
 */
export function useMock(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCKS === 'true'
}

/**
 * Simulates a network delay for more realistic mock UX.
 * Use in mock branches to avoid instant-render uncanny valley.
 */
export async function mockDelay(ms = 600): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
