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

import { GET } from '@/app/api/versus/room-events/[roomId]/route'

function buildSupabaseMock() {
  const room = {
    host_session_id: 'session-1',
    guest_session_id: 'session-2',
    match_number: 4,
    status: 'active',
  }

  const events = [
    {
      id: 11,
      room_id: 'room-1',
      created_at: '2026-04-08T10:00:00.000Z',
      match_number: 4,
      player: 'x',
      type: 'claim',
      payload: { cellIndex: 3 },
    },
  ]

  const roomSingleMock = vi.fn().mockResolvedValue({ data: room, error: null })
  const orderMock = vi.fn().mockResolvedValue({ data: events, error: null })
  const eventEqCalls: Array<[string, unknown]> = []

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
            eq: vi.fn((column: string, value: unknown) => {
              eventEqCalls.push([column, value])
              return {
                eq: vi.fn((nestedColumn: string, nestedValue: unknown) => {
                  eventEqCalls.push([nestedColumn, nestedValue])
                  return {
                    order: orderMock,
                  }
                }),
              }
            }),
          })),
        }
      }

      throw new Error(`Unexpected table: ${table}`)
    }),
  }

  return { supabase, eventEqCalls, events }
}

describe('/api/versus/room-events/[roomId] route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resolveAnonymousSessionMock.mockReturnValue({
      sessionId: 'session-1',
      shouldSetCookie: false,
    })
  })

  it("filters fetched history to the room's current match number", async () => {
    const { supabase, eventEqCalls, events } = buildSupabaseMock()
    createAdminClientMock.mockReturnValue(supabase)

    const request = new NextRequest('http://localhost/api/versus/room-events/room-1')

    const response = await GET(request, {
      params: Promise.resolve({ roomId: 'room-1' }),
    })
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({ events })
    expect(eventEqCalls).toEqual([
      ['room_id', 'room-1'],
      ['match_number', 4],
    ])
  })
})
