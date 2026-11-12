import { expect, test, type APIRequestContext } from '@playwright/test'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
const PASSWORD = 'Passw0rd!123'

async function registerUser(request: APIRequestContext) {
  const email = `e2e_${Date.now()}_${Math.random().toString(16).slice(2)}@example.com`
  const response = await request.post(`${API_URL}/auth/register`, {
    data: { username: email.split('@')[0], email, password: PASSWORD },
  })
  expect(response.ok()).toBeTruthy()
  const { userId } = await response.json()
  return { email, userId }
}

test('unauthenticated dashboard visit redirects to sign-in', async ({ page }) => {
  await page.context().clearCookies()

  await page.goto('/dashboard/1')

  await expect(page).toHaveURL(/\/auth\/sign-in$/)
})

test('login opens own dashboard and foreign ids redirect there', async ({
  page,
  request,
}) => {
  const { email, userId } = await registerUser(request)

  await page.goto('/auth/sign-in')
  await page.fill('#email', email)
  await page.fill('#password', PASSWORD)
  await page.getByRole('button', { name: 'Login' }).click()

  await expect(page).toHaveURL(new RegExp(`/dashboard/${userId}$`))

  await page.goto('/dashboard/999999')
  await expect(page).toHaveURL(new RegExp(`/dashboard/${userId}$`))
})

test('invalid token cookie redirects and is cleared', async ({
  context,
  page,
}) => {
  await context.addCookies([
    { name: 'token', value: 'bad.token.value', url: 'http://localhost:3000' },
  ])

  await page.goto('/dashboard/1')

  await expect(page).toHaveURL(/\/auth\/sign-in$/)
  const cookies = await context.cookies()
  expect(cookies.some((cookie) => cookie.name === 'token')).toBe(false)
})
