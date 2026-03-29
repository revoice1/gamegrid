import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveAnonymousSession } from '@/lib/server-session'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const supabase = createAdminClient()
  const session = resolveAnonymousSession(request)
  const { code } = await params

  const { data: room } = await supabase
    .from('versus_rooms')
    .select('id, host_session_id, guest_session_id, status')
    .eq('code', code.toUpperCase())
    .single()

  if (!room) return NextResponse.json({ error: 'Room not found.' }, { status: 404 })

  const isParticipant =
    room.host_session_id === session.sessionId || room.guest_session_id === session.sessionId

  if (!isParticipant) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })
  }

  await supabase.from('versus_rooms').update({ status: 'finished' }).eq('id', room.id)

  return NextResponse.json({ ok: true })
}
