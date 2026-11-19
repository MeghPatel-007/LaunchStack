import { expect, test } from '@playwright/test'
import { getUsers, storageState } from './helpers'

test.describe('dashboard', () => {
  test.use({ storageState: storageState(3) })

  test('authenticated dashboard renders workspace data and opens projects', async ({
    page,
  }) => {
    const user = getUsers()[2]

    await page.goto(`/dashboard/${user.userId}`)

    await expect(
      page.getByRole('heading', { name: 'Workspace overview' }),
    ).toBeVisible()
    await expect(page.getByText('Total projects')).toBeVisible()
    await expect(page.getByText('Active projects')).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Recent projects' }),
    ).toBeVisible()
    await expect(page.getByText('My work', { exact: true })).toBeVisible()

    await page.getByRole('link', { name: 'Projects' }).first().click()

    await expect(page).toHaveURL(
      new RegExp(`/dashboard/${user.userId}/projects$`),
    )
    await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible()
  })
})
