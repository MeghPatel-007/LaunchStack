import type { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/toast'
import { API_URL } from '@/lib/config'

type Router = ReturnType<typeof useRouter>

type SignupState = {
  setIsSubmitting: (value: boolean) => void
  setPasswordMismatch: (value: boolean) => void
}

export const handleLogin = async (
  e: React.FormEvent<HTMLFormElement>,
  router: Router,
) => {
  e.preventDefault()
  const formData = new FormData(e.currentTarget)
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    })
    const result = await res.json()
    if (!res.ok) {
      toast.add({
        title: 'Login failed',
        description:
          result?.msg ?? result?.error ?? result ?? 'Something went wrong',
        type: 'error',
      })
      return
    }
    if (result.userId) {
      toast.add({
        title: 'Logged in',
        description: result.msg ?? 'Welcome back',
        type: 'success',
      })
      router.push(`/dashboard/${result.userId}`)
    } else {
      toast.add({
        title: 'Login failed',
        description: result.msg ?? 'No user id returned',
        type: 'error',
      })
    }
  } catch (err) {
    toast.add({
      title: 'Login failed',
      description: err instanceof Error ? err.message : 'Unexpected error',
      type: 'error',
    })
  }
}

export const handleSignup = async (
  e: React.FormEvent<HTMLFormElement>,
  router: Router,
  { setIsSubmitting, setPasswordMismatch }: SignupState,
) => {
  e.preventDefault()
  const formData = new FormData(e.currentTarget)
  const username = (formData.get('username') as string).trim()
  const email = (formData.get('email') as string).trim()
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (password !== confirmPassword) {
    setPasswordMismatch(true)
    return
  }

  setIsSubmitting(true)
  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password }),
    })
    const result = await res.json().catch(() => null)
    if (!res.ok || !result?.userId) {
      toast.add({
        title: 'Sign up failed',
        description:
          typeof result === 'string'
            ? result
            : (result?.error ?? result?.msg ?? 'Something went wrong'),
        type: 'error',
      })
      return
    }
    toast.add({
      title: 'Account created',
      description: result.msg ?? 'You can now sign in',
      type: 'success',
    })
    router.push('/auth/sign-in')
  } catch (err) {
    toast.add({
      title: 'Sign up failed',
      description: err instanceof Error ? err.message : 'Unexpected error',
      type: 'error',
    })
  } finally {
    setIsSubmitting(false)
  }
}
