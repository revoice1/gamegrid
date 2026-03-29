import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveAnonymousSession } from '@/lib/server-session'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const supabase = createAdminClient()
  const session = resolveAnonymousSession(request)
  const { roomId } = await params

  // Verify the requesting session is a participant in this room
  const { data: room } = await supabase
    .from('versus_rooms')
    .select('host_session_id, guest_session_id, status')
    .eq('id', roomId)
    .single()

  if (!room) return NextResponse.json({ error: 'Room not found.' }, { status: 404 })

  const isParticipant =
    room.host_session_id === session.sessionId || room.guest_session_id === session.sessionId

  if (!isParticipant) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })
  }

  const { data: events, error } = await supabase
    .from('versus_events')
    .select('id, room_id, created_at, player, type, payload')
    .eq('room_id', roomId)
    .order('id', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ events: events ?? [] })
}
