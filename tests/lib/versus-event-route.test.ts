import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { createAdminClientMock, resolveAnonymousSessionMock, validateOnlineVersusEventMock } =
  vi.hoisted(() => ({
    createAdminClientMock: vi.fn(),
    resolveAnonymousSessionMock: vi.fn(),
    validateOnlineVersusEventMock: vi.fn(),
  }))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: createAdminClientMock,
}))

vi.mock('@/lib/server-session', () => ({
  resolveAnonymousSession: resolveAnonymousSessionMock,
}))

vi.mock('@/lib/online-versus-event-validation', () => ({
  validateOnlineVersusEvent: validateOnlineVersusEventMock,
}))

import { POST } from '@/app/api/versus/event/route'

function buildSupabaseMock(options?: {
  room?: Record<string, unknown>
  existingEvents?: Array<Record<string, unknown>>
  insertError?: { message: string } | null
}) {
  const room =
    options?.room ??
    ({
      host_session_id: 'session-1',
      guest_session_id: 'session-2',
      match_number: 3,
      status: 'active',
      settings: {
        categoryFilters: {},
        stealRule: 'lower',
        timerOption: 'none',
        disableDraws: false,
        objectionRule: 'one',
      },
      puzzle_id: 'puzzle-1',
      state_data: null,
    } satisfies Record<string, unknown>)

  const existingEvents = options?.existingEvents ?? []
  const insertMock = vi.fn().mockResolvedValue({ error: options?.insertError ?? null })
  const roomSingleMock = vi.fn().mockResolvedValue({ data: room, error: null })
  const orderMock = vi.fn().mockResolvedValue({ data: existingEvents, error: null })

  const supabase = {
    from: vi.fn((table: string) => {
      if (table === 'versus_rooms') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: roomSingleMock,
            })),
          })),
        }
      }

      if (table === 'versus_events') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: orderMock,
              })),
            })),
          })),
          insert: insertMock,
        }
      }

      throw new Error(`Unexpected table: ${table}`)
    }),
  }

  return { supabase, insertMock }
}

describe('/api/versus/event route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resolveAnonymousSessionMock.mockReturnValue({
      sessionId: 'session-1',
      shouldSetCookie: false,
    })
  })

  it('returns the validation rejection code when the event is illegal', async () => {
    const { supabase, insertMock } = buildSupabaseMock()
    createAdminClientMock.mockReturnValue(supabase)
    validateOnlineVersusEventMock.mockReturnValue({
      ok: false,
      error: 'It is not your turn.',
      code: 'wrong_turn',
      status: 409,
    })

    const request = new NextRequest('http://localhost/api/versus/event', {
      method: 'POST',
      body: JSON.stringify({
        roomId: 'room-1',
        matchNumber: 3,
        player: 'x',
        type: 'claim',
        payload: { cellIndex: 0 },
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(409)
    expect(payload).toEqual({
      error: 'It is not your turn.',
      code: 'wrong_turn',
    })
    expect(insertMock).not.toHaveBeenCalled()
  })

  it('rejects stale-match events before validation or insert', async () => {
    const { supabase, insertMock } = buildSupabaseMock()
    createAdminClientMock.mockReturnValue(supabase)

    const request = new NextRequest('http://localhost/api/versus/event', {
      method: 'POST',
      body: JSON.stringify({
        roomId: 'room-1',
        matchNumber: 2,
        player: 'x',
        type: 'claim',
        payload: { cellIndex: 0 },
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(409)
    expect(payload).toEqual({
      error: 'This room has moved to a newer match.',
      code: 'stale_match',
    })
    expect(validateOnlineVersusEventMock).not.toHaveBeenCalled()
    expect(insertMock).not.toHaveBeenCalled()
  })

  it('inserts the validated event payload on success', async () => {
    const { supabase, insertMock } = buildSupabaseMock({
      existingEvents: [{ id: 1, player: 'x', type: 'claim', payload: { cellIndex: 0 } }],
    })
    createAdminClientMock.mockReturnValue(supabase)
    validateOnlineVersusEventMock.mockReturnValue({
      ok: true,
      type: 'claim',
      payload: {
        cellIndex: 1,
        guess: {
          gameId: 7,
          gameName: 'Test Game',
          gameImage: null,
          isCorrect: true,
          owner: 'x',
        },
      },
    })

    const request = new NextRequest('http://localhost/api/versus/event', {
      method: 'POST',
      body: JSON.stringify({
        roomId: 'room-1',
        matchNumber: 3,
        player: 'x',
        type: 'claim',
        payload: { cellIndex: 1 },
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({ ok: true })
    expect(insertMock).toHaveBeenCalledWith({
      room_id: 'room-1',
      match_number: 3,
      player: 'x',
      type: 'claim',
      payload: {
        cellIndex: 1,
        guess: {
          gameId: 7,
          gameName: 'Test Game',
          gameImage: null,
          isCorrect: true,
          owner: 'x',
        },
      },
    })
  })
})
