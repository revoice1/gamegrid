import type { NextRequest, NextResponse } from 'next/server'

const SESSION_COOKIE_NAME = 'gg_session'
const SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365
const LEGACY_SESSION_HEADER_NAME = 'x-gamegrid-legacy-session'

function createAnonymousSessionId(): string {
  return crypto.randomUUID()
}

function isUsableSessionId(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export interface ResolvedSession {
  sessionId: string
  shouldSetCookie: boolean
}

export function getLegacySessionIdFromRequest(request: NextRequest): string | undefined {
  const headerSessionId = request.headers.get(LEGACY_SESSION_HEADER_NAME)
  return isUsableSessionId(headerSessionId) ? headerSessionId : undefined
}

export function resolveAnonymousSession(
  request: NextRequest,
  fallbackSessionId?: string | null
): ResolvedSession {
  const cookieSessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value

  if (isUsableSessionId(cookieSessionId)) {
    return {
      sessionId: cookieSessionId,
      shouldSetCookie: false,
    }
  }

  if (isUsableSessionId(fallbackSessionId)) {
    return {
      sessionId: fallbackSessionId,
      shouldSetCookie: true,
    }
  }

  return {
    sessionId: createAnonymousSessionId(),
    shouldSetCookie: true,
  }
}

export function applyAnonymousSessionCookie(
  response: NextResponse,
  resolvedSession: ResolvedSession
): NextResponse {
  if (!resolvedSession.shouldSetCookie) {
    return response
  }

  response.cookies.set(SESSION_COOKIE_NAME, resolvedSession.sessionId, {
    httpOnly: true,
    maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })

  return response
}

export function getAnonymousSessionCookieHeader(resolvedSession: ResolvedSession): string | null {
  if (!resolvedSession.shouldSetCookie) {
    return null
  }

  const attributes = [
    `${SESSION_COOKIE_NAME}=${resolvedSession.sessionId}`,
    `Max-Age=${SESSION_COOKIE_MAX_AGE_SECONDS}`,
    'Path=/',
    'SameSite=Lax',
    process.env.NODE_ENV === 'production' ? 'Secure' : null,
    'HttpOnly',
  ].filter(Boolean)

  return attributes.join('; ')
}
