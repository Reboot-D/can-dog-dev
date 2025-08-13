import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock Supabase responses to avoid needing real auth
    await page.route('**/auth/signup', async route => {
      const requestData = route.request().postDataJSON()
      
      // Simulate validation errors
      if (!requestData?.email || !requestData?.password) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Validation failed',
            details: [{ message: 'Email and password are required' }]
          }),
        })
        return
      }

      // Simulate email already exists
      if (requestData.email === 'existing@example.com') {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'User already exists'
          }),
        })
        return
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'User created successfully',
          user: { id: '123', email: requestData.email }
        }),
      })
    })

    await page.route('**/auth/login', async route => {
      const requestData = route.request().postDataJSON()
      
      // Simulate invalid credentials
      if (requestData?.email === 'invalid@example.com' || requestData?.password === 'wrongpassword') {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Invalid credentials'
          }),
        })
        return
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Login successful',
          user: { id: '123', email: requestData?.email || 'test@example.com' }
        }),
      })
    })

    await page.route('**/auth/logout', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Logout successful'
        }),
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

  test('complete signup flow with Chinese localization', async ({ page }) => {
    await page.goto('/auth/signup')

    // Check Chinese text is displayed
    await expect(page.getByText('创建新账户')).toBeVisible()
    await expect(page.getByText('电子邮箱')).toBeVisible()
    await expect(page.getByText('密码')).toBeVisible()
    await expect(page.getByText('确认密码')).toBeVisible()

    // Fill out the form
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.fill('input[name="confirmPassword"]', 'password123')

    // Submit the form
    await page.click('button[type="submit"]')

    // Should redirect to dashboard (mocked)
    await expect(page).toHaveURL('/dashboard')
  })

  test('complete login flow with Chinese localization', async ({ page }) => {
    await page.goto('/auth/login')

    // Check Chinese text is displayed
    await expect(page.getByText('登录到您的账户')).toBeVisible()
    await expect(page.getByText('电子邮箱')).toBeVisible()
    await expect(page.getByText('密码')).toBeVisible()
    await expect(page.getByText('忘记密码？')).toBeVisible()

    // Fill out the form
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')

    // Submit the form
    await page.click('button[type="submit"]')

    // Should redirect to dashboard (mocked)
    await expect(page).toHaveURL('/dashboard')
  })

  test('signup form validation with Chinese error messages', async ({ page }) => {
    await page.goto('/auth/signup')

    // Try to submit empty form
    await page.click('button[type="submit"]')

    // Should show Chinese validation errors
    await expect(page.getByText('必填项')).toHaveCount(3)
  })

  test('login form validation with Chinese error messages', async ({ page }) => {
    await page.goto('/auth/login')

    // Try to submit empty form
    await page.click('button[type="submit"]')

    // Should show Chinese validation errors
    await expect(page.getByText('必填项')).toHaveCount(2)
  })

  test('password mismatch validation', async ({ page }) => {
    await page.goto('/auth/signup')

    // Fill mismatched passwords
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.fill('input[name="confirmPassword"]', 'different')

    await page.click('button[type="submit"]')

    // Should show Chinese password mismatch error
    await expect(page.getByText('密码不匹配')).toBeVisible()
  })

  test('invalid email validation', async ({ page }) => {
    await page.goto('/auth/login')

    // Fill invalid email
    await page.fill('input[name="email"]', 'invalid-email')
    await page.fill('input[name="password"]', 'password123')

    await page.click('button[type="submit"]')

    // Should show Chinese invalid email error
    await expect(page.getByText('无效的邮箱地址')).toBeVisible()
  })

  test('navigation between signup and login pages', async ({ page }) => {
    await page.goto('/auth/signup')

    // Click login link
    await page.click('a[href="/auth/login"]')
    await expect(page).toHaveURL('/auth/login')
    await expect(page.getByText('登录到您的账户')).toBeVisible()

    // Click signup link
    await page.click('a[href="/auth/signup"]')
    await expect(page).toHaveURL('/auth/signup')
    await expect(page.getByText('创建新账户')).toBeVisible()
  })

  test('protected route redirects to login', async ({ page }) => {
    // Try to access dashboard without authentication
    await page.goto('/dashboard')

    // Should redirect to login page
    await expect(page).toHaveURL('/auth/login')
    await expect(page.getByText('登录到您的账户')).toBeVisible()
  })

  test('dashboard logout functionality', async ({ page }) => {
    // Mock authenticated state
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        user: { id: '123', email: 'test@example.com' }
      }))
    })

    await page.goto('/dashboard')

    // Check dashboard content
    await expect(page.getByText('控制台')).toBeVisible()
    await expect(page.getByText('test@example.com')).toBeVisible()

    // Click logout button
    await page.click('button:has-text("退出登录")')

    // Should redirect to login page
    await expect(page).toHaveURL('/auth/login')
  })

  test('signup with existing email shows error', async ({ page }) => {
    await page.goto('/auth/signup')

    // Fill out the form with existing email
    await page.fill('input[name="email"]', 'existing@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.fill('input[name="confirmPassword"]', 'password123')

    // Submit the form
    await page.click('button[type="submit"]')

    // Should show Chinese error message
    await expect(page.getByText('用户已存在')).toBeVisible()
    
    // Should remain on signup page
    await expect(page).toHaveURL('/auth/signup')
  })

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/auth/login')

    // Fill out the form with invalid credentials
    await page.fill('input[name="email"]', 'invalid@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')

    // Submit the form
    await page.click('button[type="submit"]')

    // Should show Chinese error message
    await expect(page.getByText('登录凭据无效')).toBeVisible()
    
    // Should remain on login page
    await expect(page).toHaveURL('/auth/login')
  })

  test('loading states during authentication', async ({ page }) => {
    await page.goto('/auth/login')

    // Fill out the form
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')

    // Submit the form
    await page.click('button[type="submit"]')

    // Should show loading state
    await expect(page.getByText('登录中...')).toBeVisible()
    
    // Button should be disabled during loading
    await expect(page.locator('button[type="submit"]')).toBeDisabled()
  })

  test('keyboard navigation and accessibility', async ({ page }) => {
    await page.goto('/auth/login')

    // Tab through form elements
    await page.keyboard.press('Tab')
    await expect(page.locator('input[name="email"]')).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.locator('input[name="password"]')).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.locator('button[type="submit"]')).toBeFocused()

    // Check form labels are associated with inputs
    await expect(page.locator('label[for="email"]')).toBeVisible()
    await expect(page.locator('label[for="password"]')).toBeVisible()
  })

  test('session persistence after browser refresh', async ({ page }) => {
    // Mock authenticated session
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        user: { id: '123', email: 'test@example.com' },
        session: { access_token: 'fake-token', refresh_token: 'fake-refresh' }
      }))
    })

    // Navigate to protected route
    await page.goto('/dashboard')
    await expect(page.getByText('控制台')).toBeVisible()

    // Refresh page
    await page.reload()

    // Should still be on dashboard (session persisted)
    await expect(page.getByText('控制台')).toBeVisible()
  })

  test('redirect after successful login', async ({ page }) => {
    // Try to access protected route while not authenticated
    await page.goto('/dashboard')
    
    // Should redirect to login with return URL
    await expect(page).toHaveURL(/\/auth\/login\?.*/)
    
    // Login successfully
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Should redirect back to originally requested page
    await expect(page).toHaveURL('/dashboard')
  })

  test('responsive design on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/auth/login')

    // Check that form is properly sized for mobile
    const form = page.locator('form')
    await expect(form).toBeVisible()
    
    // Check input fields are touch-friendly
    const emailInput = page.locator('input[name="email"]')
    const boundingBox = await emailInput.boundingBox()
    expect(boundingBox?.height).toBeGreaterThanOrEqual(44) // Minimum touch target
    
    // Test form submission on mobile
    await emailInput.tap()
    await emailInput.fill('mobile@example.com')
    
    await page.locator('input[name="password"]').tap()
    await page.locator('input[name="password"]').fill('password123')
    
    await page.locator('button[type="submit"]').tap()
    await expect(page).toHaveURL('/dashboard')
  })
})