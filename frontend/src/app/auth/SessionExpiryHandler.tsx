'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export const SessionExpiryHandler = () => {
  const router = useRouter()
  const pathname = usePathname()
  const hasRedirected = useRef(false)

  useEffect(() => {
    const sessionHandler = () => {
      if (pathname === '/auth/sign-in' || hasRedirected.current) return
      hasRedirected.current = true
      router.replace('/auth/sign-in')
    }
    window.addEventListener('auth:unauthorized', sessionHandler)
    return () => {
      window.removeEventListener('auth:unauthorized', sessionHandler)
    }
  }, [pathname, router])
  useEffect(() => {
    if (pathname !== '/auth/sign-in') {
      hasRedirected.current = false
    }
  }, [pathname])
  return null
}
