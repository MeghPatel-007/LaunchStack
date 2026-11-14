export type LoginInput = {
  email: string
  password: string
}

export type SignupInput = {
  username: string
  email: string
  password: string
}

export type AuthResponse = {
  msg: string
  userId: number
}

export type LogoutResponse = {
  msg: string
}

export type AuthFormState = {
  setIsSubmitting: (value: boolean) => void
  setPasswordMismatch: (value: boolean) => void
}
