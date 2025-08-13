import { test, expect } from '@playwright/test'

test.describe('Upcoming Event Display', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      const mockUser = {
        id: 'test-user-123',
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString()
      }

      // Mock Supabase auth
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh-token',
        user: mockUser
      }))

      // Mock auth store
      window.localStorage.setItem('auth-store', JSON.stringify({
        state: {
          user: mockUser,
          session: {
            access_token: 'mock-token',
            token_type: 'bearer',
            expires_in: 3600,
            refresh_token: 'mock-refresh-token',
            user: mockUser
          },
          loading: false
        },
        version: 0
      }))
    })

    // Navigate to dashboard
    await page.goto('/zh-CN/dashboard')
  })

  test('displays upcoming event section', async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForSelector('h1:has-text("控制台")')

    // Check for upcoming event section
    const eventSection = page.locator('h2:has-text("即将到来的事件")')
    await expect(eventSection).toBeVisible()

    // Check for event container
    const eventContainer = page.locator('div:has(h2:has-text("即将到来的事件"))')
    await expect(eventContainer).toHaveClass(/bg-white/)
    await expect(eventContainer).toHaveClass(/rounded-lg/)
  })

  test('shows empty state when no pets are selected', async ({ page }) => {
    // Ensure no active pet in storage
    await page.evaluate(() => {
      window.localStorage.setItem('pets-store', JSON.stringify({
        state: {
          pets: [],
          activePet: null
        },
        version: 0
      }))
    })

    await page.reload()
    await page.waitForSelector('h2:has-text("即将到来的事件")')

    // Check for empty state message
    await expect(page.locator('text="暂无即将到来的事件"')).toBeVisible()
  })

  test('displays event details when pet is selected', async ({ page }) => {
    // Set up mock pet data
    await page.evaluate(() => {
      const mockPet = {
        id: 'pet-123',
        name: '小白',
        user_id: 'test-user-123',
        breed: '金毛',
        date_of_birth: '2023-01-01',
        created_at: '2023-01-01T00:00:00Z'
      }

      window.localStorage.setItem('pets-store', JSON.stringify({
        state: {
          pets: [mockPet],
          activePet: mockPet
        },
        version: 0
      }))
    })

    await page.reload()
    await page.waitForSelector('h2:has-text("即将到来的事件")')

    // Wait for event to load (mock service has 500ms delay)
    await page.waitForTimeout(600)

    // Check for event title
    await expect(page.locator('h3:has-text("疫苗接种 - 狂犬病疫苗")')).toBeVisible()

    // Check for due date
    await expect(page.locator('text="截止日期"')).toBeVisible()

    // Check for status
    await expect(page.locator('text="状态"')).toBeVisible()
    await expect(page.locator('text="待处理"')).toBeVisible()
  })

  test('updates event when switching pets', async ({ page }) => {
    // Set up multiple pets
    await page.evaluate(() => {
      const mockPets = [
        {
          id: 'pet-1',
          name: '小白',
          user_id: 'test-user-123',
          breed: '金毛',
          date_of_birth: '2023-01-01',
          created_at: '2023-01-01T00:00:00Z'
        },
        {
          id: 'pet-2',
          name: '小黑',
          user_id: 'test-user-123',
          breed: '拉布拉多',
          date_of_birth: '2023-02-01',
          created_at: '2023-02-01T00:00:00Z'
        }
      ]

      window.localStorage.setItem('pets-store', JSON.stringify({
        state: {
          pets: mockPets,
          activePet: mockPets[0]
        },
        version: 0
      }))
    })

    await page.reload()
    await page.waitForSelector('h2:has-text("即将到来的事件")')

    // Wait for initial event to load
    await page.waitForTimeout(600)
    await expect(page.locator('h3:has-text("疫苗接种 - 狂犬病疫苗")')).toBeVisible()

    // Open pet switcher
    await page.click('button:has-text("小白")')
    
    // Switch to second pet
    await page.click('button:has-text("小黑")')

    // Wait for event to update
    await page.waitForTimeout(600)

    // Event should still be visible (same placeholder data for all pets)
    await expect(page.locator('h3:has-text("疫苗接种 - 狂犬病疫苗")')).toBeVisible()
  })

  test('displays loading state', async ({ page }) => {
    // Set up mock pet
    await page.evaluate(() => {
      const mockPet = {
        id: 'pet-123',
        name: '小白',
        user_id: 'test-user-123',
        breed: '金毛',
        date_of_birth: '2023-01-01',
        created_at: '2023-01-01T00:00:00Z'
      }

      window.localStorage.setItem('pets-store', JSON.stringify({
        state: {
          pets: [mockPet],
          activePet: mockPet
        },
        version: 0
      }))
    })

    await page.goto('/zh-CN/dashboard')

    // Check for loading skeleton during initial load
    const skeleton = page.locator('.animate-pulse').first()
    
    // Loading skeleton should be visible initially
    await expect(skeleton).toBeVisible()

    // Wait for content to load
    await page.waitForTimeout(600)

    // Loading skeleton should disappear
    await expect(skeleton).not.toBeVisible()
  })

  test('responsive design works correctly', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/zh-CN/dashboard')

    const eventSection = page.locator('div:has(h2:has-text("即将到来的事件"))')
    await expect(eventSection).toBeVisible()
    
    // Check that it maintains styling on mobile
    await expect(eventSection).toHaveClass(/bg-white/)
    await expect(eventSection).toHaveClass(/rounded-lg/)
    await expect(eventSection).toHaveClass(/p-6/)

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await expect(eventSection).toBeVisible()
  })

  test('displays Chinese date format correctly', async ({ page }) => {
    // Set up mock pet with event
    await page.evaluate(() => {
      const mockPet = {
        id: 'pet-123',
        name: '小白',
        user_id: 'test-user-123',
        breed: '金毛',
        date_of_birth: '2023-01-01',
        created_at: '2023-01-01T00:00:00Z'
      }

      window.localStorage.setItem('pets-store', JSON.stringify({
        state: {
          pets: [mockPet],
          activePet: mockPet
        },
        version: 0
      }))
    })

    await page.reload()
    await page.waitForSelector('h2:has-text("即将到来的事件")')
    await page.waitForTimeout(600)

    // Check that date is displayed (Chinese format should be applied by date-fns with zhCN locale)
    const dateElement = page.locator('text=/截止日期.*\\d{4}/')
    await expect(dateElement).toBeVisible()
  })
})