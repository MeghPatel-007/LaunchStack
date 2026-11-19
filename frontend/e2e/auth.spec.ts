import { expect, test } from '@playwright/test'
import { getUsers, PASSWORD, storageState } from './helpers'

test.describe('authentication', () => {
  test('sign-in page renders the login form', async ({ page }) => {
    await page.goto('/auth/sign-in')

    await expect(
      page.getByRole('heading', { name: 'Login to your account' }),
    ).toBeVisible()
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toHaveAttribute('type', 'password')
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible()
  })

  test('empty form submission is blocked by required fields', async ({
    page,
  }) => {
    await page.goto('/auth/sign-in')
    await page.getByRole('button', { name: 'Login' }).click()

    await expect(page).toHaveURL(/\/auth\/sign-in$/)
    const emailIsValid = await page
      .locator('#email')
      .evaluate((element) => (element as HTMLInputElement).validity.valid)
    expect(emailIsValid).toBe(false)
  })

  test('incorrect password shows an error and stays on sign-in', async ({
    page,
  }) => {
    const [user] = getUsers()

    await page.goto('/auth/sign-in')
    await page.fill('#email', user.email)
    await page.fill('#password', 'WrongPassword1')
    await page.getByRole('button', { name: 'Login' }).click()

    await expect(page.getByText('Login failed')).toBeVisible()
    await expect(page.getByText('Invalid email or password')).toBeVisible()
    await expect(page).toHaveURL(/\/auth\/sign-in$/)
  })

  test('successful login sets an HttpOnly cookie and opens the dashboard', async ({
    page,
    context,
  }) => {
    const [user] = getUsers()

    await page.goto('/auth/sign-in')
    await page.fill('#email', user.email)
    await page.fill('#password', PASSWORD)
    await page.getByRole('button', { name: 'Login' }).click()

    await expect(page).toHaveURL(new RegExp(`/dashboard/${user.userId}$`))
    await expect(
      page.getByRole('heading', { name: 'Workspace overview' }),
    ).toBeVisible()

    const token = (await context.cookies()).find(
      (cookie) => cookie.name === 'token',
    )
    expect(token).toBeDefined()
    expect(token?.httpOnly).toBe(true)
    expect(token?.sameSite).toBe('Lax')

    await page.reload()
    await expect(page).toHaveURL(new RegExp(`/dashboard/${user.userId}$`))
  })

  test.describe('with an existing session', () => {
    test.use({ storageState: storageState(2) })

    test('logout clears the session and protects the dashboard', async ({
      page,
      context,
    }) => {
      const users = getUsers()
      const user = users[1]

      await page.goto(`/dashboard/${user.userId}`)
      await expect(
        page.getByRole('heading', { name: 'Workspace overview' }),
      ).toBeVisible()

      // The Next dev overlay sits over the sidebar footer and intercepts
      // pointer events, so open the menu with the keyboard.
      const userMenu = page.getByRole('button', { name: /Alex Morgan/ })
      await userMenu.press('Enter')
      const logout = page.getByText('Log out', { exact: true })
      await expect(logout).toBeVisible()
      await logout.press('Enter')

      await expect(page).toHaveURL(/\/auth\/sign-in$/)
      const cookies = await context.cookies()
      expect(cookies.some((cookie) => cookie.name === 'token')).toBe(false)

      await page.goto(`/dashboard/${user.userId}`)
      await expect(page).toHaveURL(/\/auth\/sign-in$/)
    })
  })

  test('sign-up rejects mismatched passwords', async ({ page }) => {
    await page.goto('/auth/sign-up')
    await page.fill('#username', 'e2e mismatch')
    await page.fill('#email', `e2e_mismatch_${Date.now()}@example.com`)
    await page.fill('#password', PASSWORD)
    await page.fill('#confirmPassword', 'DifferentPassword1')
    await page.getByRole('checkbox').click()
    await page.getByRole('button', { name: 'Create Account' }).click()

    await expect(page.getByText('Passwords do not match')).toBeVisible()
    await expect(page).toHaveURL(/\/auth\/sign-up$/)
  })

  test('sign-up creates an account and redirects to sign-in', async ({
    page,
  }) => {
    const email = `e2e_signup_${Date.now()}@example.com`

    await page.goto('/auth/sign-up')
    await page.fill('#username', email.split('@')[0])
    await page.fill('#email', email)
    await page.fill('#password', PASSWORD)
    await page.fill('#confirmPassword', PASSWORD)
    await page.getByRole('checkbox').click()
    await page.getByRole('button', { name: 'Create Account' }).click()

    await expect(page).toHaveURL(/\/auth\/sign-in$/)
    await expect(page.getByText('Account created')).toBeVisible()
  })
})
