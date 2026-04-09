import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  validateOnlineVersusEvent,
  type StoredOnlineVersusEvent,
} from '@/lib/online-versus-event-validation'
import { resolveAnonymousSession } from '@/lib/server-session'
import type { OnlineVersusEventType, RoomPlayer } from '@/lib/versus-room'

export async function POST(request: NextRequest) {
  const supabase = createAdminClient()
  const session = resolveAnonymousSession(request)

  try {
    const body = await request.json()
    const { roomId, player, type, payload, matchNumber } = body as {
      roomId: string
      player: RoomPlayer
      type: OnlineVersusEventType
      payload: Record<string, unknown>
      matchNumber?: number
    }

    if (!roomId || !player || !type || !Number.isInteger(matchNumber)) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }

    // Verify the session owns the player slot they're claiming
    const { data: room, error: roomError } = await supabase
      .from('versus_rooms')
      .select(
        'host_session_id, guest_session_id, match_number, status, settings, puzzle_id, state_data'
      )
      .eq('id', roomId)
      .single()

    if (roomError) {
      console.error('Online versus event room lookup failed', {
        roomId,
        player,
        type,
        sessionId: session.sessionId,
        error: roomError,
      })
      return NextResponse.json({ error: roomError.message }, { status: 500 })
    }

    if (!room) return NextResponse.json({ error: 'Room not found.' }, { status: 404 })

    const expectedSession = player === 'x' ? room.host_session_id : room.guest_session_id

    if (expectedSession !== session.sessionId) {
      return NextResponse.json({ error: 'Not authorized for that player slot.' }, { status: 403 })
    }

    if (matchNumber !== room.match_number) {
      return NextResponse.json(
        { error: 'This room has moved to a newer match.', code: 'stale_match' },
        { status: 409 }
      )
    }

    if (room.status === 'finished')
      return NextResponse.json({ error: 'Match is over.' }, { status: 409 })

    const { data: existingEventRows, error: existingEventsError } = await supabase
      .from('versus_events')
      .select('id, player, type, payload')
      .eq('room_id', roomId)
      .eq('match_number', room.match_number)
      .order('id', { ascending: true })

    if (existingEventsError) {
      console.error('Online versus event history lookup failed', {
        roomId,
        player,
        type,
        sessionId: session.sessionId,
        error: existingEventsError,
      })
      return NextResponse.json({ error: existingEventsError.message }, { status: 500 })
    }

    const validation = validateOnlineVersusEvent({
      roomStatus: room.status,
      puzzleId: room.puzzle_id,
      settings: room.settings,
      snapshot: room.state_data,
      player,
      type,
      payload: payload ?? {},
      existingEvents: (existingEventRows ?? []) as StoredOnlineVersusEvent[],
    })

    if (!validation.ok) {
      return NextResponse.json(
        { error: validation.error, code: validation.code },
        { status: validation.status }
      )
    }

    const { error } = await supabase.from('versus_events').insert({
      room_id: roomId,
      match_number: room.match_number,
      player,
      type: validation.type,
      payload: validation.payload,
    })

    if (error) {
      console.error('Online versus event insert failed', {
        roomId,
        player,
        type,
        sessionId: session.sessionId,
        payload,
        error,
      })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Online versus event route crashed', {
      sessionId: session.sessionId,
      error,
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
