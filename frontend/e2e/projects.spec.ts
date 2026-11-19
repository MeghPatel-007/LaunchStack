import { expect, test, type Page } from '@playwright/test'
import { getUsers, PASSWORD, storageState } from './helpers'

test.describe('projects', () => {
  test.use({ storageState: storageState(1) })

  const projectsUrl = () => {
    const user = getUsers()[0]
    return `/dashboard/${user.userId}/projects`
  }

  async function createProjectViaUi(page: Page, name: string) {
    await page.getByRole('button', { name: 'Create Project' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.locator('#name').fill(name)
    await dialog.locator('#description').fill('Created by Playwright')
    await dialog.getByRole('button', { name: 'Create Project' }).click()

    await expect(dialog).toBeHidden()
    await expect(page.getByText(name, { exact: true })).toBeVisible()
  }

  test('create, view, update and delete a project', async ({ page }) => {
    const name = `E2E project ${Date.now()}`
    const renamed = `${name} updated`

    await page.goto(projectsUrl())
    await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible()

    await createProjectViaUi(page, name)

    await page
      .getByRole('link', { name: `View ${name}` })
      .first()
      .click()
    await expect(page).toHaveURL(/\/projects\/\d+$/)
    await expect(page.getByText(name, { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Project statistics')).toBeVisible()
    await expect(page.getByText('Phases', { exact: true }).first()).toBeVisible()

    await page.goto(projectsUrl())
    await page.getByRole('button', { name: `Edit ${name}` }).click()
    const editDialog = page.getByRole('dialog')
    await expect(
      editDialog.getByText('Edit Project', { exact: true }),
    ).toBeVisible()
    await editDialog.locator('#name').fill(renamed)
    await editDialog.getByRole('button', { name: 'Update Project' }).click()

    await expect(editDialog).toBeHidden()
    await expect(page.getByText(renamed, { exact: true })).toBeVisible()

    await page.getByRole('button', { name: `Delete ${renamed}` }).click()
    const confirm = page.getByRole('alertdialog')
    await expect(
      confirm.getByText('Delete project?', { exact: true }),
    ).toBeVisible()
    await confirm.getByRole('button', { name: 'Delete', exact: true }).click()

    await expect(page.getByText(renamed, { exact: true })).toBeHidden()
    await expect(page.getByText('No projects found. Create your first project.')).toBeVisible()
  })

  test('project overview shows an API error for an unknown project', async ({
    page,
  }) => {
    const user = getUsers()[0]

    await page.goto(`/dashboard/${user.userId}/projects/2000000000`)

    await expect(page.getByRole('alert').filter({ hasText: 'Project does not exist' })).toHaveText(
      'Project does not exist',
    )
  })

  test('expired session redirects to sign-in and re-authentication works', async ({
    page,
    context,
  }) => {
    const user = getUsers()[0]

    await page.goto(projectsUrl())
    await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Create Project' }),
    ).toBeVisible()

    await context.addCookies([
      { name: 'token', value: 'bad.token.value', url: 'http://localhost:3000' },
    ])

    await page.getByRole('button', { name: 'Create Project' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.locator('#name').fill('Session expiry project')
    await dialog.getByRole('button', { name: 'Create Project' }).click()

    await expect(page).toHaveURL(/\/auth\/sign-in$/)

    await page.fill('#email', user.email)
    await page.fill('#password', PASSWORD)
    await page.getByRole('button', { name: 'Login' }).click()
    await expect(page).toHaveURL(new RegExp(`/dashboard/${user.userId}$`))
  })
})
