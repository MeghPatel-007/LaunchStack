import type { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/toast'
import { apiClient } from '@/lib/api/apiClient'
import type {
  AuthFormState,
  AuthResponse,
  LoginInput,
  LogoutResponse,
  SignupInput,
} from '@/types/auth'

type Router = ReturnType<typeof useRouter>

export const handleLogin = async (
  e: React.FormEvent<HTMLFormElement>,
  router: Router,
) => {
  e.preventDefault()
  const formData = new FormData(e.currentTarget)
  const credentials: LoginInput = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }
  try {
    const result = await apiClient<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
    if (!result.userId) {
      toast.add({
        title: 'Login failed',
        description: result.msg ?? 'No user id returned',
        type: 'error',
      })
      return
    }
    toast.add({
      title: 'Logged in',
      description: result.msg ?? 'Welcome back',
      type: 'success',
    })
    router.push(`/dashboard/${result.userId}`)
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
  { setIsSubmitting, setPasswordMismatch }: AuthFormState,
) => {
  e.preventDefault()
  const formData = new FormData(e.currentTarget)
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (password !== confirmPassword) {
    setPasswordMismatch(true)
    return
  }

  const input: SignupInput = {
    username: (formData.get('username') as string).trim(),
    email: (formData.get('email') as string).trim(),
    password,
  }

  setIsSubmitting(true)
  try {
    const result = await apiClient<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    if (!result.userId) {
      toast.add({
        title: 'Sign up failed',
        description: result.msg ?? 'No user id returned',
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

export const handleLogout = async (router: Router) => {
  try {
    const result = await apiClient<LogoutResponse>('/auth/logout', {
      method: 'POST',
    })
    toast.add({
      title: 'Logged out',
      description: result.msg,
      type: 'success',
    })
  } catch (err) {
    toast.add({
      title: 'Logout failed',
      description: err instanceof Error ? err.message : 'Unexpected error',
      type: 'error',
    })
  } finally {
    router.push('/auth/sign-in')
  }
}
