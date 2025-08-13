import { test, expect } from '@playwright/test'

test.describe('Pet Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/zh-CN/auth/login')
    
    // Login with test credentials (assuming test user exists)
    // Note: In a real test environment, you'd set up test data
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'TestPassword123')
    await page.click('button[type="submit"]')
    
    // Wait for dashboard to load
    await page.waitForURL('**/dashboard')
  })

  test('should display empty state when no pets exist', async ({ page }) => {
    // Should show empty state
    await expect(page.getByText('您还没有添加任何宠物')).toBeVisible()
    await expect(page.getByText('点击下方按钮添加您的第一个宠物档案')).toBeVisible()
    await expect(page.getByRole('button', { name: '添加我的第一个宠物' })).toBeVisible()
  })

  test('should allow user to add a new pet', async ({ page }) => {
    // Click add pet button
    await page.getByRole('button', { name: '添加宠物' }).click()
    
    // Verify form is displayed
    await expect(page.getByText('添加新宠物')).toBeVisible()
    
    // Fill out the form
    await page.fill('[name="name"]', '小白')
    await page.fill('[name="breed"]', '金毛犬')
    await page.fill('[name="date_of_birth"]', '2022-01-15')
    
    // Submit the form
    await page.getByRole('button', { name: '创建宠物档案' }).click()
    
    // Wait for form to disappear and pet to appear in list
    await expect(page.getByText('添加新宠物')).not.toBeVisible()
    await expect(page.getByText('小白')).toBeVisible()
    await expect(page.getByText('金毛犬')).toBeVisible()
    
    // Verify pet age is calculated correctly
    const currentYear = new Date().getFullYear()
    const expectedAge = currentYear - 2022
    await expect(page.getByText(`${expectedAge}岁`)).toBeVisible()
  })

  test('should validate required fields', async ({ page }) => {
    // Click add pet button
    await page.getByRole('button', { name: '添加宠物' }).click()
    
    // Try to submit without filling required fields
    await page.getByRole('button', { name: '创建宠物档案' }).click()
    
    // Should show validation error
    await expect(page.getByText('宠物名字不能为空')).toBeVisible()
    
    // Form should still be visible
    await expect(page.getByText('添加新宠物')).toBeVisible()
  })

  test('should handle pet name that is too long', async ({ page }) => {
    // Click add pet button
    await page.getByRole('button', { name: '添加宠物' }).click()
    
    // Fill with a name that's too long
    const longName = 'a'.repeat(101)
    await page.fill('[name="name"]', longName)
    
    // Try to submit
    await page.getByRole('button', { name: '创建宠物档案' }).click()
    
    // Should show validation error
    await expect(page.getByText('宠物名字不能超过100个字符')).toBeVisible()
  })

  test('should allow canceling pet creation', async ({ page }) => {
    // Click add pet button
    await page.getByRole('button', { name: '添加宠物' }).click()
    
    // Verify form is displayed
    await expect(page.getByText('添加新宠物')).toBeVisible()
    
    // Click cancel
    await page.getByRole('button', { name: '取消' }).click()
    
    // Form should disappear and return to pets list view
    await expect(page.getByText('添加新宠物')).not.toBeVisible()
    await expect(page.getByText('我的宠物')).toBeVisible()
  })

  test('should create pet with only required fields', async ({ page }) => {
    // Click add pet button
    await page.getByRole('button', { name: '添加宠物' }).click()
    
    // Fill only required field
    await page.fill('[name="name"]', '小黑')
    
    // Submit the form
    await page.getByRole('button', { name: '创建宠物档案' }).click()
    
    // Wait for pet to appear in list
    await expect(page.getByText('小黑')).toBeVisible()
    await expect(page.getByText('未知品种')).toBeVisible()
    await expect(page.getByText('年龄未知')).toBeVisible()
  })

  test('should show loading state during pet creation', async ({ page }) => {
    // Click add pet button
    await page.getByRole('button', { name: '添加宠物' }).click()
    
    // Fill out the form
    await page.fill('[name="name"]', '测试宠物')
    
    // Submit the form
    await page.getByRole('button', { name: '创建宠物档案' }).click()
    
    // Should briefly show loading state
    await expect(page.getByText('创建中...')).toBeVisible()
    
    // Loading state should disappear and pet should appear
    await expect(page.getByText('创建中...')).not.toBeVisible()
    await expect(page.getByText('测试宠物')).toBeVisible()
  })

  test('should display multiple pets correctly', async ({ page }) => {
    // Add first pet
    await page.getByRole('button', { name: '添加宠物' }).click()
    await page.fill('[name="name"]', '小白')
    await page.fill('[name="breed"]', '金毛犬')
    await page.getByRole('button', { name: '创建宠物档案' }).click()
    await expect(page.getByText('小白')).toBeVisible()

    // Add second pet
    await page.getByRole('button', { name: '添加宠物' }).click()
    await page.fill('[name="name"]', '小黑')
    await page.fill('[name="breed"]', '拉布拉多')
    await page.getByRole('button', { name: '创建宠物档案' }).click()
    await expect(page.getByText('小黑')).toBeVisible()

    // Both pets should be visible
    await expect(page.getByText('小白')).toBeVisible()
    await expect(page.getByText('金毛犬')).toBeVisible()
    await expect(page.getByText('小黑')).toBeVisible()
    await expect(page.getByText('拉布拉多')).toBeVisible()

    // Should show correct count
    await expect(page.getByText('2个宠物')).toBeVisible()
  })

  test('should handle duplicate pet names gracefully', async ({ page }) => {
    // Add first pet
    await page.getByRole('button', { name: '添加宠物' }).click()
    await page.fill('[name="name"]', '重复名字')
    await page.getByRole('button', { name: '创建宠物档案' }).click()
    await expect(page.getByText('重复名字')).toBeVisible()

    // Try to add pet with same name
    await page.getByRole('button', { name: '添加宠物' }).click()
    await page.fill('[name="name"]', '重复名字')
    await page.getByRole('button', { name: '创建宠物档案' }).click()

    // Should show duplicate name error
    await expect(page.getByText('您已经有一个同名的宠物了')).toBeVisible()
    
    // Form should still be visible for correction
    await expect(page.getByText('添加新宠物')).toBeVisible()
  })

  test('should display Chinese text correctly throughout the flow', async ({ page }) => {
    // Verify all Chinese text is displayed correctly
    await expect(page.getByText('我的宠物')).toBeVisible()
    await expect(page.getByText('添加宠物')).toBeVisible()
    
    // Click add pet and verify form labels
    await page.getByRole('button', { name: '添加宠物' }).click()
    await expect(page.getByText('添加新宠物')).toBeVisible()
    await expect(page.getByText('宠物名字')).toBeVisible()
    await expect(page.getByText('品种')).toBeVisible()
    await expect(page.getByText('出生日期')).toBeVisible()
    await expect(page.getByRole('button', { name: '创建宠物档案' })).toBeVisible()
    await expect(page.getByRole('button', { name: '取消' })).toBeVisible()
  })

  test.describe('Edit and Delete Pet Functionality', () => {
    test.beforeEach(async ({ page }) => {
      // Create a test pet first
      await page.getByRole('button', { name: '添加宠物' }).click()
      await page.fill('[name="name"]', '测试宠物')
      await page.fill('[name="breed"]', '测试品种')
      await page.fill('[name="date_of_birth"]', '2023-01-01')
      await page.getByRole('button', { name: '创建宠物档案' }).click()
      await expect(page.getByText('测试宠物')).toBeVisible()
    })

    test('should allow user to edit pet information', async ({ page }) => {
      // Click edit button on the pet card
      await page.locator('button[title="编辑"]').first().click()
      
      // Verify edit dialog appears with pre-populated data
      await expect(page.getByText('编辑宠物档案')).toBeVisible()
      await expect(page.locator('input[value="测试宠物"]')).toBeVisible()
      await expect(page.locator('input[value="测试品种"]')).toBeVisible()
      await expect(page.locator('input[value="2023-01-01"]')).toBeVisible()
      
      // Update pet information
      await page.fill('[name="name"]', '更新后的宠物')
      await page.fill('[name="breed"]', '更新后的品种')
      await page.fill('[name="date_of_birth"]', '2023-06-01')
      
      // Submit the form
      await page.getByRole('button', { name: '更新档案' }).click()
      
      // Verify dialog closes and pet info is updated
      await expect(page.getByText('编辑宠物档案')).not.toBeVisible()
      await expect(page.getByText('更新后的宠物')).toBeVisible()
      await expect(page.getByText('更新后的品种')).toBeVisible()
    })

    test('should validate required fields when editing', async ({ page }) => {
      // Click edit button
      await page.locator('button[title="编辑"]').first().click()
      
      // Clear the name field
      await page.fill('[name="name"]', '')
      
      // Try to submit
      await page.getByRole('button', { name: '更新档案' }).click()
      
      // Should show validation error
      await expect(page.getByText('宠物名字不能为空')).toBeVisible()
      
      // Dialog should still be open
      await expect(page.getByText('编辑宠物档案')).toBeVisible()
    })

    test('should allow canceling edit operation', async ({ page }) => {
      // Click edit button
      await page.locator('button[title="编辑"]').first().click()
      
      // Make some changes
      await page.fill('[name="name"]', '临时更改')
      
      // Click cancel
      await page.getByRole('button', { name: '取消' }).click()
      
      // Dialog should close and original data should remain
      await expect(page.getByText('编辑宠物档案')).not.toBeVisible()
      await expect(page.getByText('测试宠物')).toBeVisible()
      await expect(page.getByText('临时更改')).not.toBeVisible()
    })

    test('should show confirmation dialog when deleting pet', async ({ page }) => {
      // Click delete button
      await page.locator('button[title="删除"]').first().click()
      
      // Verify confirmation dialog appears
      await expect(page.getByText('删除宠物档案')).toBeVisible()
      await expect(page.getByText('您确定要删除 测试宠物 的档案吗？此操作无法撤销。')).toBeVisible()
      
      // Should have cancel and delete buttons
      await expect(page.getByRole('button', { name: '取消' })).toBeVisible()
      await expect(page.getByRole('button', { name: '删除' })).toBeVisible()
    })

    test('should allow canceling delete operation', async ({ page }) => {
      // Click delete button
      await page.locator('button[title="删除"]').first().click()
      
      // Click cancel in confirmation dialog
      await page.getByRole('button', { name: '取消' }).click()
      
      // Dialog should close and pet should still exist
      await expect(page.getByText('删除宠物档案')).not.toBeVisible()
      await expect(page.getByText('测试宠物')).toBeVisible()
    })

    test('should successfully delete pet after confirmation', async ({ page }) => {
      // Click delete button
      await page.locator('button[title="删除"]').first().click()
      
      // Confirm deletion
      await page.getByRole('button', { name: '删除' }).click()
      
      // Wait for deletion to complete
      await expect(page.getByText('删除宠物档案')).not.toBeVisible()
      
      // Pet should be removed from the list
      await expect(page.getByText('测试宠物')).not.toBeVisible()
      
      // Should show empty state if no pets remain
      await expect(page.getByText('您还没有添加任何宠物')).toBeVisible()
    })

    test('should handle editing pet with duplicate name', async ({ page }) => {
      // Add another pet first
      await page.getByRole('button', { name: '添加宠物' }).click()
      await page.fill('[name="name"]', '另一只宠物')
      await page.getByRole('button', { name: '创建宠物档案' }).click()
      await expect(page.getByText('另一只宠物')).toBeVisible()
      
      // Edit first pet and try to use second pet's name
      await page.locator('button[title="编辑"]').first().click()
      await page.fill('[name="name"]', '另一只宠物')
      await page.getByRole('button', { name: '更新档案' }).click()
      
      // Should show duplicate name error
      await expect(page.getByText('您已经有一个同名的宠物了')).toBeVisible()
      
      // Dialog should remain open
      await expect(page.getByText('编辑宠物档案')).toBeVisible()
    })

    test('should show loading state during update operation', async ({ page }) => {
      // Click edit button
      await page.locator('button[title="编辑"]').first().click()
      
      // Make a change
      await page.fill('[name="name"]', '更新中的宠物')
      
      // Submit the form
      await page.getByRole('button', { name: '更新档案' }).click()
      
      // Should briefly show loading state
      await expect(page.getByText('更新中...')).toBeVisible()
      
      // Then complete and close
      await expect(page.getByText('编辑宠物档案')).not.toBeVisible()
      await expect(page.getByText('更新中的宠物')).toBeVisible()
    })

    test('should show loading state during delete operation', async ({ page }) => {
      // Click delete button
      await page.locator('button[title="删除"]').first().click()
      
      // Confirm deletion
      await page.getByRole('button', { name: '删除' }).click()
      
      // Should briefly show loading state
      await expect(page.getByText('删除中...')).toBeVisible()
      
      // Then complete
      await expect(page.getByText('删除宠物档案')).not.toBeVisible()
    })

    test('should handle deletion of active pet in pet switcher', async ({ page }) => {
      // Add a second pet
      await page.getByRole('button', { name: '添加宠物' }).click()
      await page.fill('[name="name"]', '第二只宠物')
      await page.getByRole('button', { name: '创建宠物档案' }).click()
      await expect(page.getByText('第二只宠物')).toBeVisible()
      
      // Ensure first pet is active in pet switcher
      const petSwitcher = page.locator('text=当前选中').first()
      const activePetName = await petSwitcher.locator('..').textContent()
      
      // Delete the active pet
      if (activePetName?.includes('测试宠物')) {
        await page.locator('button[title="删除"]').first().click()
      } else {
        await page.locator('button[title="删除"]').nth(1).click()
      }
      
      await page.getByRole('button', { name: '删除' }).click()
      
      // Wait for deletion
      await expect(page.getByText('删除宠物档案')).not.toBeVisible()
      
      // The other pet should automatically become active
      await expect(page.locator('text=当前选中')).toBeVisible()
    })
  })
})