import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { createAdminClientMock, resolveAnonymousSessionMock } = vi.hoisted(() => ({
  createAdminClientMock: vi.fn(),
  resolveAnonymousSessionMock: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: createAdminClientMock,
}))

vi.mock('@/lib/server-session', () => ({
  resolveAnonymousSession: resolveAnonymousSessionMock,
}))

import { POST } from '@/app/api/versus/room/[code]/continue/route'

function buildSupabaseMock() {
  const room = {
    id: 'room-1',
    code: 'ABCD',
    host_session_id: 'session-1',
    guest_session_id: 'session-2',
    match_number: 4,
    status: 'finished',
    settings: {
      categoryFilters: {},
      stealRule: 'off',
      timerOption: 'none',
      disableDraws: false,
      objectionRule: 'off',
    },
    state_data: {
      winner: 'x',
    },
  }

  const updatedRoom = {
    id: 'room-1',
    code: 'ABCD',
    match_number: 5,
    status: 'active',
    settings: room.settings,
    puzzle_id: null,
    puzzle_data: null,
    state_data: null,
    expires_at: '2026-04-08T12:00:00.000Z',
    created_at: '2026-04-08T10:00:00.000Z',
  }

  const singleMock = vi.fn().mockResolvedValue({ data: room, error: null })
  const updatePayloads: Array<Record<string, unknown>> = []
  const updateSingleMock = vi.fn().mockResolvedValue({ data: updatedRoom, error: null })

  const supabase = {
    from: vi.fn((table: string) => {
      if (table !== 'versus_rooms') {
        throw new Error(`Unexpected table: ${table}`)
      }

      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: singleMock,
          })),
        })),
        update: vi.fn((payload: Record<string, unknown>) => {
          updatePayloads.push(payload)
          return {
            eq: vi.fn(() => ({
              select: vi.fn(() => ({
                single: updateSingleMock,
              })),
            })),
          }
        }),
      }
    }),
  }

  return { supabase, updatePayloads, updatedRoom }
}

describe('/api/versus/room/[code]/continue route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resolveAnonymousSessionMock.mockReturnValue({
      sessionId: 'session-1',
      shouldSetCookie: false,
    })
  })

  it('advances the match boundary instead of deleting prior events', async () => {
    const { supabase, updatePayloads, updatedRoom } = buildSupabaseMock()
    createAdminClientMock.mockReturnValue(supabase)

    const request = new NextRequest('http://localhost/api/versus/room/ABCD/continue', {
      method: 'POST',
    })

    const response = await POST(request, {
      params: Promise.resolve({ code: 'ABCD' }),
    })
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({ room: updatedRoom })
    expect(updatePayloads).toHaveLength(1)
    expect(updatePayloads[0]).toEqual(
      expect.objectContaining({
        match_number: 5,
        status: 'active',
        puzzle_id: null,
        puzzle_data: null,
        state_data: null,
      })
    )
  })
})
