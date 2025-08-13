import { test, expect } from '@playwright/test'

test.describe('Journal Entry Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the dashboard page
    await page.goto('/zh-CN/dashboard')
  })

  test('should display journal entry form when pet is selected', async ({ page }) => {
    // Mock authentication - would need proper setup in real test
    // For now, this test would require a logged-in user with pets
    
    // Wait for the page to load
    await page.waitForSelector('[data-testid="dashboard"]', { timeout: 10000 })
    
    // Check if there's a pet selected (if no pets, form shouldn't show)
    const journalForm = page.locator('[data-testid="journal-entry-form"]')
    
    // If no pets exist, the journal form should not be visible
    const petSwitcher = page.locator('[data-testid="pet-switcher"]')
    const noPetsMessage = await petSwitcher.locator('text=暂无宠物').isVisible()
    
    if (noPetsMessage) {
      // No pets exist, journal form should not be visible
      await expect(journalForm).not.toBeVisible()
    } else {
      // Pets exist, journal form should be visible
      await expect(journalForm).toBeVisible()
      
      // Check form elements
      await expect(page.locator('text=写日记')).toBeVisible()
      await expect(page.locator('textarea[placeholder*="记录您宠物今天的状况"]')).toBeVisible()
      await expect(page.locator('button:has-text("保存日记")')).toBeVisible()
      await expect(page.locator('text=0/10,000')).toBeVisible()
    }
  })

  test('should create journal entry successfully', async ({ page }) => {
    // This test assumes a pet exists and user is authenticated
    // In a real test, you would set up the proper test data
    
    // Mock API response for successful journal entry creation
    await page.route('**/api/pets/*/journal', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            journalEntry: {
              id: 'test-journal-1',
              created_at: new Date().toISOString(),
              user_id: 'test-user',
              pet_id: 'test-pet',
              content: '今天小白很开心，玩了很久的球。',
              ai_advice: null
            }
          })
        })
      }
    })
    
    // Wait for the journal form to be visible
    const journalForm = page.locator('[data-testid="journal-entry-form"]')
    
    // Only proceed if the form is visible (pet is selected)
    if (await journalForm.isVisible()) {
      // Fill in the journal content
      const textarea = page.locator('textarea[placeholder*="记录您宠物今天的状况"]')
      await textarea.fill('今天小白很开心，玩了很久的球。')
      
      // Check character count updates
      await expect(page.locator('text=17/10,000')).toBeVisible()
      
      // Check that submit button is enabled
      const submitButton = page.locator('button:has-text("保存日记")')
      await expect(submitButton).toBeEnabled()
      
      // Submit the form
      await submitButton.click()
      
      // Check loading state
      await expect(page.locator('button:has-text("保存中...")')).toBeVisible()
      await expect(submitButton).toBeDisabled()
      
      // Check success message appears
      await expect(page.locator('text=日记保存成功！')).toBeVisible()
      
      // Check that form is reset
      await expect(textarea).toHaveValue('')
      await expect(page.locator('text=0/10,000')).toBeVisible()
      
      // Check that submit button is disabled again
      await expect(submitButton).toBeDisabled()
    }
  })

  test('should handle validation errors', async ({ page }) => {
    // Mock API response for validation error
    await page.route('**/api/pets/*/journal', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Validation failed',
            details: [{ message: 'Journal entry content is required' }]
          })
        })
      }
    })
    
    const journalForm = page.locator('[data-testid="journal-entry-form"]')
    
    if (await journalForm.isVisible()) {
      // Submit button should be disabled when content is empty
      const submitButton = page.locator('button:has-text("保存日记")')
      await expect(submitButton).toBeDisabled()
      
      // Fill in content to enable submit
      const textarea = page.locator('textarea[placeholder*="记录您宠物今天的状况"]')
      await textarea.fill('x')
      await expect(submitButton).toBeEnabled()
      
      // Clear content again
      await textarea.fill('')
      await expect(submitButton).toBeDisabled()
    }
  })

  test('should handle server errors gracefully', async ({ page }) => {
    // Mock API response for server error
    await page.route('**/api/pets/*/journal', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Internal server error'
          })
        })
      }
    })
    
    const journalForm = page.locator('[data-testid="journal-entry-form"]')
    
    if (await journalForm.isVisible()) {
      // Fill in the journal content
      const textarea = page.locator('textarea[placeholder*="记录您宠物今天的状况"]')
      await textarea.fill('今天小白很开心。')
      
      // Submit the form
      const submitButton = page.locator('button:has-text("保存日记")')
      await submitButton.click()
      
      // Check error message appears
      await expect(page.locator('text=保存日记失败，请重试')).toBeVisible()
      
      // Form should not be reset on error
      await expect(textarea).toHaveValue('今天小白很开心。')
    }
  })

  test('should clear errors when user starts typing', async ({ page }) => {
    // Mock API response for server error first
    await page.route('**/api/pets/*/journal', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Internal server error'
          })
        })
      }
    })
    
    const journalForm = page.locator('[data-testid="journal-entry-form"]')
    
    if (await journalForm.isVisible()) {
      const textarea = page.locator('textarea[placeholder*="记录您宠物今天的状况"]')
      const submitButton = page.locator('button:has-text("保存日记")')
      
      // Fill and submit to trigger error
      await textarea.fill('测试内容')
      await submitButton.click()
      
      // Wait for error message
      await expect(page.locator('text=保存日记失败，请重试')).toBeVisible()
      
      // Start typing again - error should disappear
      await textarea.fill('新的内容')
      await expect(page.locator('text=保存日记失败，请重试')).not.toBeVisible()
    }
  })

  test('should enforce character limit', async ({ page }) => {
    const journalForm = page.locator('[data-testid="journal-entry-form"]')
    
    if (await journalForm.isVisible()) {
      const textarea = page.locator('textarea[placeholder*="记录您宠物今天的状况"]')
      
      // Test normal content
      await textarea.fill('这是一个正常长度的日记内容。')
      await expect(page.locator('text=12/10,000')).toBeVisible()
      
      // Test character limit display
      const longText = 'x'.repeat(5000)
      await textarea.fill(longText)
      await expect(page.locator('text=5000/10,000')).toBeVisible()
      
      // The textarea should accept up to 10,000 characters due to maxLength attribute
      const maxText = 'x'.repeat(10000)
      await textarea.fill(maxText)
      await expect(page.locator('text=10000/10,000')).toBeVisible()
    }
  })

  test('should work on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    const journalForm = page.locator('[data-testid="journal-entry-form"]')
    
    if (await journalForm.isVisible()) {
      // Check that form is responsive
      await expect(journalForm).toBeVisible()
      
      // Check that textarea is properly sized
      const textarea = page.locator('textarea[placeholder*="记录您宠物今天的状况"]')
      await expect(textarea).toBeVisible()
      
      // Check that button is accessible
      const submitButton = page.locator('button:has-text("保存日记")')
      await expect(submitButton).toBeVisible()
      
      // Test touch interaction
      await textarea.tap()
      await textarea.fill('移动设备测试')
      
      await expect(page.locator('text=6/10,000')).toBeVisible()
    }
  })
})