import { test, expect, Page } from '@playwright/test'

// Helper function to create a pet with specific data
async function createPetWithData(page: Page, petData: {
  name: string
  breed: string
  birthDate: string
}) {
  await page.goto('/dashboard')
  await page.getByRole('button', { name: 'Add Pet' }).click()
  
  await page.getByLabel('Pet Name').fill(petData.name)
  await page.getByLabel('Breed').fill(petData.breed)
  await page.getByLabel('Date of Birth').fill(petData.birthDate)
  
  await page.getByRole('button', { name: 'Add Pet' }).click()
  await page.waitForURL('/dashboard')
}

test.describe('Automated Event Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Assume user is already logged in (handled by auth setup)
    await page.goto('/dashboard')
  })

  test('should generate events for a new dog', async ({ page }) => {
    // Create a dog that's 3 months old
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    
    await createPetWithData(page, {
      name: 'Buddy',
      breed: 'Labrador',
      birthDate: threeMonthsAgo.toISOString().split('T')[0]
    })

    // Navigate to pet's events page
    await page.getByText('Buddy').click()
    await page.getByRole('link', { name: 'Events' }).click()

    // Trigger event generation
    await page.getByRole('button', { name: 'Generate Care Events' }).click()
    
    // Wait for success message
    await expect(page.getByText('Events generated successfully')).toBeVisible()

    // Verify events were created
    await expect(page.getByText('DHPP Vaccination Series')).toBeVisible()
    await expect(page.getByText('Rabies Vaccination')).toBeVisible()
    await expect(page.getByText('Heartworm Prevention')).toBeVisible()
  })

  test('should generate events for a new cat', async ({ page }) => {
    // Create a cat that's 13 months old
    const thirteenMonthsAgo = new Date()
    thirteenMonthsAgo.setMonth(thirteenMonthsAgo.getMonth() - 13)
    
    await createPetWithData(page, {
      name: 'Whiskers',
      breed: 'Persian',
      birthDate: thirteenMonthsAgo.toISOString().split('T')[0]
    })

    // Navigate to pet's events page
    await page.getByText('Whiskers').click()
    await page.getByRole('link', { name: 'Events' }).click()

    // Trigger event generation
    await page.getByRole('button', { name: 'Generate Care Events' }).click()
    
    // Wait for success message
    await expect(page.getByText('Events generated successfully')).toBeVisible()

    // Verify events were created
    await expect(page.getByText('FVRCP Annual Booster')).toBeVisible()
    await expect(page.getByText('Annual Wellness Examination')).toBeVisible()
    await expect(page.getByText('Parasite Prevention')).toBeVisible()
  })

  test('should skip duplicate events', async ({ page }) => {
    // Create a pet
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    
    await createPetWithData(page, {
      name: 'Max',
      breed: 'Golden Retriever',
      birthDate: sixMonthsAgo.toISOString().split('T')[0]
    })

    // Navigate to pet's events page
    await page.getByText('Max').click()
    await page.getByRole('link', { name: 'Events' }).click()

    // First generation
    await page.getByRole('button', { name: 'Generate Care Events' }).click()
    await expect(page.getByText('Events generated successfully')).toBeVisible()
    
    // Count initial events
    const initialEventCount = await page.locator('[data-testid="event-item"]').count()

    // Try to generate again
    await page.getByRole('button', { name: 'Generate Care Events' }).click()
    
    // Should show skipped message
    await expect(page.getByText(/skipped/i)).toBeVisible()
    
    // Event count should remain the same
    const finalEventCount = await page.locator('[data-testid="event-item"]').count()
    expect(finalEventCount).toBe(initialEventCount)
  })

  test('should handle pet without birth date', async ({ page }) => {
    // Create a pet without birth date
    await page.goto('/dashboard')
    await page.getByRole('button', { name: 'Add Pet' }).click()
    
    await page.getByLabel('Pet Name').fill('Mystery')
    await page.getByLabel('Breed').fill('Mixed Breed')
    // Don't fill birth date
    
    await page.getByRole('button', { name: 'Add Pet' }).click()
    await page.waitForURL('/dashboard')

    // Navigate to pet's events page
    await page.getByText('Mystery').click()
    await page.getByRole('link', { name: 'Events' }).click()

    // Try to generate events
    await page.getByRole('button', { name: 'Generate Care Events' }).click()
    
    // Should show error message
    await expect(page.getByText('Unable to determine pet age')).toBeVisible()
  })

  test('should handle pet without breed', async ({ page }) => {
    // Create a pet without breed
    const twoMonthsAgo = new Date()
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)
    
    await page.goto('/dashboard')
    await page.getByRole('button', { name: 'Add Pet' }).click()
    
    await page.getByLabel('Pet Name').fill('Unknown')
    // Don't fill breed
    await page.getByLabel('Date of Birth').fill(twoMonthsAgo.toISOString().split('T')[0])
    
    await page.getByRole('button', { name: 'Add Pet' }).click()
    await page.waitForURL('/dashboard')

    // Navigate to pet's events page
    await page.getByText('Unknown').click()
    await page.getByRole('link', { name: 'Events' }).click()

    // Try to generate events
    await page.getByRole('button', { name: 'Generate Care Events' }).click()
    
    // Should show error message
    await expect(page.getByText('Unable to determine pet type')).toBeVisible()
  })

  test('should respect age conditions for events', async ({ page }) => {
    // Create a very young puppy (1 month old)
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    
    await createPetWithData(page, {
      name: 'Tiny',
      breed: 'Chihuahua',
      birthDate: oneMonthAgo.toISOString().split('T')[0]
    })

    // Navigate to pet's events page
    await page.getByText('Tiny').click()
    await page.getByRole('link', { name: 'Events' }).click()

    // Trigger event generation
    await page.getByRole('button', { name: 'Generate Care Events' }).click()
    
    // Wait for response
    await expect(page.getByText(/generated|skipped/i)).toBeVisible()

    // Should not have vaccination events yet (too young)
    await expect(page.getByText('DHPP Vaccination Series')).not.toBeVisible()
    
    // But might have some other events that start earlier
    const eventCount = await page.locator('[data-testid="event-item"]').count()
    expect(eventCount).toBeGreaterThanOrEqual(0)
  })

  test('should handle API errors gracefully', async ({ page, context }) => {
    // Intercept API calls to simulate error
    await context.route('**/api/pets/*/events/generate', (route) => {
      route.fulfill({
        status: 500,
        json: { error: 'Internal server error' }
      })
    })

    // Create a pet
    const fourMonthsAgo = new Date()
    fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4)
    
    await createPetWithData(page, {
      name: 'Error Test',
      breed: 'Beagle',
      birthDate: fourMonthsAgo.toISOString().split('T')[0]
    })

    // Navigate to pet's events page
    await page.getByText('Error Test').click()
    await page.getByRole('link', { name: 'Events' }).click()

    // Try to generate events
    await page.getByRole('button', { name: 'Generate Care Events' }).click()
    
    // Should show error message
    await expect(page.getByText(/error|failed/i)).toBeVisible()
  })
})