import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { API_URL } from '@/lib/config'

const CACHE_TTL_MS = 30_000
const MAX_CACHE_ENTRIES = 500

const meCache = new Map<string, { userId: number; expiresAt: number }>()

function redirectToSignIn(request: NextRequest) {
  const redirect = NextResponse.redirect(new URL('/auth/sign-in', request.url))
  redirect.cookies.delete('token')
  return redirect
}

async function currentUserId(token: string, cookieHeader: string) {
  const cached = meCache.get(token)
  if (cached && cached.expiresAt > Date.now()) return cached.userId

  const response = await fetch(`${API_URL}/auth/me`, {
    headers: { cookie: cookieHeader },
    cache: 'no-store',
    signal: AbortSignal.timeout(3000),
  })

  if (!response.ok) {
    meCache.delete(token)
    return null
  }

  const { userId } = await response.json()
  // shortcut: cache is per server instance, so a revoked token can pass for up to 30s
  if (meCache.size >= MAX_CACHE_ENTRIES) meCache.clear()
  meCache.set(token, { userId, expiresAt: Date.now() + CACHE_TTL_MS })
  return userId
}

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  if (!token) return redirectToSignIn(request)

  try {
    const userId = await currentUserId(
      token,
      request.headers.get('cookie') ?? '',
    )
    if (userId === null) return redirectToSignIn(request)

    const dashboardId = Number(request.nextUrl.pathname.split('/')[2])

    // Invalid id or another user's dashboard: send to the signed-in user's own
    if (dashboardId !== userId) {
      return NextResponse.redirect(new URL(`/dashboard/${userId}`, request.url))
    }

    return NextResponse.next()
  } catch (error) {
    console.error('Dashboard authentication error:', error)

    // Backend unavailable: fail closed
    return NextResponse.json(
      { error: 'Authentication service unavailable' },
      { status: 503 },
    )
  }
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
