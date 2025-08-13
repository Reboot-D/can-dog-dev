import { test, expect } from '@playwright/test'

test.describe('Complete User Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Mock all necessary API endpoints for a complete flow
    await page.route('**/auth/signup', async route => {
      const requestData = route.request().postDataJSON()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'User created successfully',
          user: { id: '123', email: requestData?.email || 'newuser@example.com' }
        }),
      })
    })

    await page.route('**/auth/login', async route => {
      const requestData = route.request().postDataJSON()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Login successful',
          user: { id: '123', email: requestData?.email || 'newuser@example.com' }
        }),
      })
    })

    // Mock pet creation API
    await page.route('**/api/pets', async route => {
      if (route.request().method() === 'POST') {
        const requestData = route.request().postDataJSON()
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            pet: {
              id: `pet-${Date.now()}`,
              name: requestData?.name || '测试宠物',
              breed: requestData?.breed || '金毛犬',
              date_of_birth: requestData?.date_of_birth || '2022-01-01',
              user_id: '123',
              created_at: new Date().toISOString()
            }
          })
        })
      } else if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            pets: []
          })
        })
      }
    })

    // Mock journal entry creation
    await page.route('**/api/pets/*/journal', async route => {
      if (route.request().method() === 'POST') {
        const requestData = route.request().postDataJSON()
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            journalEntry: {
              id: `journal-${Date.now()}`,
              content: requestData?.content || '测试日记',
              created_at: new Date().toISOString(),
              user_id: '123',
              pet_id: 'pet-123',
              ai_advice: '根据您的描述，您的宠物看起来很健康快乐。建议继续保持规律的运动和健康的饮食。'
            }
          })
        })
      } else if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            entries: []
          })
        })
      }
    })

    // Mock upcoming events API
    await page.route('**/api/pets/*/events', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          events: [
            {
              id: 'event-1',
              title: '定期体检',
              description: '建议每年进行一次全面体检',
              due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              event_type: 'health_check',
              pet_id: 'pet-123'
            }
          ]
        })
      })
    })

    // Mock session check
    await page.route('**/auth/session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: null
        }),
      })
    })
  })

  test('complete new user onboarding and daily usage flow', async ({ page }) => {
    // Step 1: New user signup
    await page.goto('/auth/signup')
    
    await expect(page.getByText('创建新账户')).toBeVisible()
    
    // Fill signup form
    await page.fill('input[name="email"]', 'newuser@example.com')
    await page.fill('input[name="password"]', 'securepassword123')
    await page.fill('input[name="confirmPassword"]', 'securepassword123')
    
    await page.click('button[type="submit"]')
    
    // Should redirect to dashboard after successful signup
    await expect(page).toHaveURL('/dashboard')
    
    // Step 2: First-time user sees empty state
    await expect(page.getByText('您还没有添加任何宠物')).toBeVisible()
    await expect(page.getByText('点击下方按钮添加您的第一个宠物档案')).toBeVisible()
    
    // Step 3: Add first pet
    await page.click('button:has-text("添加我的第一个宠物")')
    
    await expect(page.getByText('添加新宠物')).toBeVisible()
    
    // Fill pet form with comprehensive details
    await page.fill('input[name="name"]', '小白')
    await page.fill('input[name="breed"]', '金毛犬')
    await page.fill('input[name="date_of_birth"]', '2022-06-15')
    
    await page.click('button:has-text("创建宠物档案")')
    
    // Step 4: Verify pet appears in dashboard
    await expect(page.getByText('小白')).toBeVisible()
    await expect(page.getByText('金毛犬')).toBeVisible()
    await expect(page.getByText('当前选中: 小白')).toBeVisible()
    
    // Step 5: Check upcoming events are displayed
    await expect(page.getByText('即将到来的事件')).toBeVisible()
    await expect(page.getByText('定期体检')).toBeVisible()
    
    // Step 6: Create first journal entry
    const journalTextarea = page.locator('textarea[placeholder*="记录您宠物今天的状况"]')
    await expect(journalTextarea).toBeVisible()
    
    const journalContent = '今天小白特别活跃，在公园里跑了很久，回家后食欲很好。看起来心情不错，毛发也很有光泽。'
    await journalTextarea.fill(journalContent)
    
    // Check character count
    await expect(page.getByText(`${journalContent.length}/10,000`)).toBeVisible()
    
    // Submit journal entry
    await page.click('button:has-text("保存日记")')
    
    // Check loading state
    await expect(page.getByText('保存中...')).toBeVisible()
    
    // Check success message
    await expect(page.getByText('日记保存成功！')).toBeVisible()
    
    // Step 7: Verify AI advice appears
    await expect(page.getByText('AI 建议')).toBeVisible()
    await expect(page.getByText('根据您的描述，您的宠物看起来很健康快乐')).toBeVisible()
    
    // Step 8: Add second pet to test pet switcher
    await page.click('button:has-text("添加宠物")')
    
    await page.fill('input[name="name"]', '小花')
    await page.fill('input[name="breed"]', '萨摩耶')
    await page.fill('input[name="date_of_birth"]', '2023-03-10')
    
    await page.click('button:has-text("创建宠物档案")')
    
    // Step 9: Test pet switching functionality
    await expect(page.getByText('2个宠物')).toBeVisible()
    await expect(page.getByText('小花')).toBeVisible()
    
    // Switch to second pet
    await page.click('button:has-text("小花")')
    await expect(page.getByText('当前选中: 小花')).toBeVisible()
    
    // Switch back to first pet
    await page.click('button:has-text("小白")')
    await expect(page.getByText('当前选中: 小白')).toBeVisible()
    
    // Step 10: Test journal history navigation
    await page.click('text=查看历史日记')
    
    // Should show journal history page
    await expect(page.getByText('日记历史')).toBeVisible()
    
    // Navigate back to dashboard
    await page.click('text=返回控制台')
    await expect(page.getByText('控制台')).toBeVisible()
    
    // Step 11: Test responsive behavior on mobile
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Verify mobile layout
    await expect(page.getByText('小白')).toBeVisible()
    await expect(journalTextarea).toBeVisible()
    
    // Test mobile journal entry
    await journalTextarea.fill('移动设备上的日记测试')
    await page.click('button:has-text("保存日记")')
    await expect(page.getByText('日记保存成功！')).toBeVisible()
    
    // Step 12: Test logout functionality
    await page.setViewportSize({ width: 1200, height: 800 }) // Reset to desktop
    
    await page.click('button:has-text("退出登录")')
    await expect(page).toHaveURL('/auth/login')
    
    // Step 13: Test login with existing credentials
    await page.fill('input[name="email"]', 'newuser@example.com')
    await page.fill('input[name="password"]', 'securepassword123')
    await page.click('button[type="submit"]')
    
    // Should return to dashboard with pets intact
    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByText('小白')).toBeVisible()
    await expect(page.getByText('小花')).toBeVisible()
    await expect(page.getByText('2个宠物')).toBeVisible()
  })

  test('error recovery and edge case handling during user journey', async ({ page }) => {
    // Test network error recovery during signup
    await page.route('**/auth/signup', async route => {
      // First request fails
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' })
      })
    })

    await page.goto('/auth/signup')
    
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.fill('input[name="confirmPassword"]', 'password123')
    
    await page.click('button[type="submit"]')
    
    // Should show error message
    await expect(page.getByText('注册失败，请重试')).toBeVisible()
    
    // Fix the route to succeed on retry
    await page.unroute('**/auth/signup')
    await page.route('**/auth/signup', async route => {
      const requestData = route.request().postDataJSON()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'User created successfully',
          user: { id: '123', email: requestData?.email || 'test@example.com' }
        }),
      })
    })
    
    // Retry signup
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')
  })

  test('accessibility compliance throughout user journey', async ({ page }) => {
    await page.goto('/auth/signup')
    
    // Check ARIA labels and roles
    await expect(page.locator('main[role="main"]')).toBeVisible()
    await expect(page.locator('form[role="form"]')).toBeVisible()
    
    // Check keyboard navigation
    await page.keyboard.press('Tab')
    await expect(page.locator('input[name="email"]')).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.locator('input[name="password"]')).toBeFocused()
    
    // Check that error messages are announced to screen readers
    await page.click('button[type="submit"]') // Submit empty form
    
    const errorElement = page.locator('[role="alert"]').first()
    await expect(errorElement).toBeVisible()
    
    // Check color contrast for important elements
    const submitButton = page.locator('button[type="submit"]')
    const buttonStyle = await submitButton.evaluate(el => getComputedStyle(el))
    
    // Basic contrast check (this would need more sophisticated color contrast calculation in real scenario)
    expect(buttonStyle.backgroundColor).toBeTruthy()
    expect(buttonStyle.color).toBeTruthy()
  })

  test('data persistence and state management during session', async ({ page }) => {
    await page.goto('/auth/signup')
    
    // Complete signup
    await page.fill('input[name="email"]', 'persistent@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.fill('input[name="confirmPassword"]', 'password123')
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL('/dashboard')
    
    // Add pet
    await page.click('button:has-text("添加我的第一个宠物")')
    await page.fill('input[name="name"]', '持久化测试宠物')
    await page.click('button:has-text("创建宠物档案")')
    
    // Add journal entry
    await page.fill('textarea[placeholder*="记录您宠物今天的状况"]', '数据持久化测试内容')
    await page.click('button:has-text("保存日记")')
    
    // Refresh page to test persistence
    await page.reload()
    
    // Data should persist after refresh
    await expect(page.getByText('持久化测试宠物')).toBeVisible()
    
    // Navigate away and back
    await page.goto('/auth/login')
    await page.goto('/dashboard')
    
    // Data should still be there
    await expect(page.getByText('持久化测试宠物')).toBeVisible()
  })

  test('performance and loading states throughout journey', async ({ page }) => {
    // Track performance metrics
    await page.goto('/auth/signup')
    
    const startTime = Date.now()
    
    // Complete signup flow
    await page.fill('input[name="email"]', 'performance@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.fill('input[name="confirmPassword"]', 'password123')
    
    await page.click('button[type="submit"]')
    
    // Verify loading states appear and disappear appropriately
    await expect(page.getByText('注册中...')).toBeVisible()
    await expect(page.getByText('注册中...')).not.toBeVisible({ timeout: 10000 })
    
    await expect(page).toHaveURL('/dashboard')
    
    const endTime = Date.now()
    const loadTime = endTime - startTime
    
    // Basic performance assertion (adjust threshold as needed)
    expect(loadTime).toBeLessThan(15000) // 15 seconds max for complete flow
    
    // Test rapid interactions don't break the app
    await page.click('button:has-text("添加我的第一个宠物")')
    await page.fill('input[name="name"]', '快速测试')
    
    // Rapid clicks shouldn't cause issues
    await page.click('button:has-text("创建宠物档案")')
    await page.click('button:has-text("创建宠物档案")')
    await page.click('button:has-text("创建宠物档案")')
    
    // Should only create one pet despite multiple clicks
    await expect(page.getByText('快速测试')).toBeVisible()
    await expect(page.getByText('1个宠物')).toBeVisible()
  })
})