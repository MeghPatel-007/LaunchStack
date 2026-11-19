import { expect, test, type Page } from '@playwright/test'
import { createPhase, createProject, getUsers, storageState } from './helpers'

test.describe('project phases', () => {
  test.use({ storageState: storageState(2) })

  async function addPhase(page: Page, name: string) {
    await page.getByRole('button', { name: 'Add Phase' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.locator('#phase-name').fill(name)
    await dialog.locator('#phase-description').fill('Created by Playwright')
    await dialog.getByRole('button', { name: 'Add Phase' }).click()

    await expect(dialog).toBeHidden()
    await expect(page.getByText(name, { exact: true }).first()).toBeVisible()
  }

  function phaseItem(page: Page, name: string) {
    return page.locator('li').filter({ hasText: name }).first()
  }

  test('create, start and complete a phase', async ({ page, request }) => {
    const projectId = await createProject(request)
    const phaseName = `E2E Discovery ${Date.now()}`
    const user = getUsers()[1].userId

    await page.goto(`/dashboard/${user}/projects/${projectId}`)
    await expect(page.getByText('Phases', { exact: true }).first()).toBeVisible()

    await addPhase(page, phaseName)
    await expect(phaseItem(page, phaseName).getByText('Not started')).toBeVisible()

    await page.getByRole('button', { name: `Edit ${phaseName}` }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('combobox').click()
    await page.getByRole('option', { name: 'In progress' }).click()
    await dialog.locator('#phase-start').fill('2026-01-05')
    await dialog.getByRole('button', { name: 'Update Phase' }).click()

    await expect(dialog).toBeHidden()
    await expect(phaseItem(page, phaseName).getByText('In progress')).toBeVisible()

    await page.getByRole('button', { name: `Edit ${phaseName}` }).click()
    const completeDialog = page.getByRole('dialog')
    await completeDialog.getByRole('combobox').click()
    await page.getByRole('option', { name: 'Completed' }).click()
    await completeDialog.locator('#phase-finished').fill('2026-01-10')
    await completeDialog.getByRole('button', { name: 'Update Phase' }).click()

    await expect(completeDialog).toBeHidden()
    await expect(phaseItem(page, phaseName).getByText('Completed')).toBeVisible()
  })

  test('validates dates, reports duplicate positions, and deletes a phase', async ({
    page,
    request,
  }) => {
    const projectId = await createProject(request)
    await createPhase(request, projectId, { name: 'E2E Foundation', position: 1 })

    const user = getUsers()[1].userId
    const phaseName = `E2E Build ${Date.now()}`

    await page.goto(`/dashboard/${user}/projects/${projectId}`)
    await expect(page.getByText('E2E Foundation', { exact: true })).toBeVisible()

    await page.getByRole('button', { name: 'Add Phase' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.locator('#phase-name').fill(phaseName)
    await dialog.locator('#phase-description').fill('Created by Playwright')
    await dialog.getByRole('combobox').click()
    await page.getByRole('option', { name: 'In progress' }).click()
    await dialog.getByRole('button', { name: 'Add Phase' }).click()

    await expect(
      dialog.getByText('Start date is required for an in-progress phase.'),
    ).toBeVisible()
    await expect(dialog).toBeVisible()

    await dialog.getByRole('combobox').click()
    await page.getByRole('option', { name: 'Not started' }).click()
    await dialog.getByRole('button', { name: 'Add Phase' }).click()
    await expect(dialog).toBeHidden()
    await expect(page.getByText(phaseName, { exact: true }).first()).toBeVisible()

    await page.getByRole('button', { name: `Edit ${phaseName}` }).click()
    const editDialog = page.getByRole('dialog')
    await editDialog.locator('input[type="number"]').fill('1')
    await editDialog.getByRole('button', { name: 'Update Phase' }).click()

    await expect(
      editDialog.getByRole('alert'),
    ).toHaveText('Position is already used by another phase')
    await editDialog.getByRole('button', { name: 'Cancel' }).click()
    await expect(editDialog).toBeHidden()

    await page.getByRole('button', { name: `Delete ${phaseName}` }).click()
    const confirm = page.getByRole('alertdialog')
    await confirm.getByRole('button', { name: 'Delete', exact: true }).click()

    await expect(page.getByText(phaseName, { exact: true })).toBeHidden()
    await expect(page.getByText('E2E Foundation', { exact: true })).toBeVisible()
  })
})
