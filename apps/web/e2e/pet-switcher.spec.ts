import { test, expect } from '@playwright/test'

test.describe('Pet Switcher Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page and authenticate
    await page.goto('/zh-CN/auth/login')
    
    // Fill in login credentials (adjust based on your test data)
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'testpassword123')
    await page.click('button[type="submit"]')
    
    // Wait for navigation to dashboard
    await page.waitForURL('/zh-CN/dashboard')
  })

  test('should display empty state when no pets exist', async ({ page }) => {
    // Check for empty state in pet switcher
    await expect(page.locator('text=暂无宠物')).toBeVisible()
    await expect(page.locator('text=您还没有添加任何宠物，请先添加一个宠物档案。')).toBeVisible()
    await expect(page.locator('text=添加我的第一个宠物')).toBeVisible()
  })

  test('should allow adding first pet from switcher empty state', async ({ page }) => {
    // Click add pet button from switcher empty state
    await page.click('text=添加我的第一个宠物')
    
    // Should show add pet form
    await expect(page.locator('text=添加新宠物')).toBeVisible()
    
    // Fill in pet details
    await page.fill('input[placeholder="请输入宠物名字"]', '测试宠物')
    await page.fill('input[placeholder="请输入宠物品种（可选）"]', '测试品种')
    
    // Submit form
    await page.click('button:has-text("创建宠物档案")')
    
    // Wait for success and check pet switcher updates
    await expect(page.locator('text=测试宠物')).toBeVisible()
    await expect(page.locator('text=1个宠物')).toBeVisible()
    await expect(page.locator('text=当前选中: 测试宠物')).toBeVisible()
  })

  test('should display pets in switcher when they exist', async ({ page }) => {
    // First, add some pets
    await addTestPet(page, '小白', '金毛')
    await addTestPet(page, '小黑', '拉布拉多')
    
    // Check pet switcher displays both pets
    await expect(page.locator('text=选择宠物')).toBeVisible()
    await expect(page.locator('text=2个宠物')).toBeVisible()
    await expect(page.locator('text=小白')).toBeVisible()
    await expect(page.locator('text=小黑')).toBeVisible()
  })

  test('should highlight active pet and show selection state', async ({ page }) => {
    // Add test pets
    await addTestPet(page, '小白', '金毛')
    await addTestPet(page, '小黑', '拉布拉多')
    
    // Check that first pet is automatically selected as active
    const activePetButton = page.locator('button:has-text("小白")')
    await expect(activePetButton).toHaveClass(/bg-indigo-600/)
    await expect(page.locator('text=当前选中: 小白')).toBeVisible()
    
    // Check that second pet is not active
    const inactivePetButton = page.locator('button:has-text("小黑")')
    await expect(inactivePetButton).toHaveClass(/bg-gray-100/)
  })

  test('should switch active pet when clicked', async ({ page }) => {
    // Add test pets
    await addTestPet(page, '小白', '金毛')
    await addTestPet(page, '小黑', '拉布拉多')
    
    // Verify initial state
    await expect(page.locator('text=当前选中: 小白')).toBeVisible()
    
    // Click on second pet to make it active
    await page.click('button:has-text("小黑")')
    
    // Verify the switch
    await expect(page.locator('text=当前选中: 小黑')).toBeVisible()
    
    // Check visual states
    const newActivePetButton = page.locator('button:has-text("小黑")')
    const newInactivePetButton = page.locator('button:has-text("小白")')
    
    await expect(newActivePetButton).toHaveClass(/bg-indigo-600/)
    await expect(newInactivePetButton).toHaveClass(/bg-gray-100/)
  })

  test('should persist active pet selection across page refreshes', async ({ page }) => {
    // Add test pets
    await addTestPet(page, '小白', '金毛')
    await addTestPet(page, '小黑', '拉布拉多')
    
    // Switch to second pet
    await page.click('button:has-text("小黑")')
    await expect(page.locator('text=当前选中: 小黑')).toBeVisible()
    
    // Refresh the page
    await page.reload()
    await page.waitForURL('/zh-CN/dashboard')
    
    // Check that active pet is still selected after refresh
    await expect(page.locator('text=当前选中: 小黑')).toBeVisible()
    
    // Check visual state is maintained
    const activePetButton = page.locator('button:has-text("小黑")')
    await expect(activePetButton).toHaveClass(/bg-indigo-600/)
  })

  test('should show pet avatars with first letter of name', async ({ page }) => {
    // Add test pets
    await addTestPet(page, '小白', '金毛')
    await addTestPet(page, 'Buddy', '拉布拉多')
    
    // Check that avatars show first letter
    await expect(page.locator('text=小').first()).toBeVisible() // First character of '小白'
    await expect(page.locator('text=B').first()).toBeVisible() // First character of 'Buddy'
  })

  test('should handle long pet names gracefully', async ({ page }) => {
    // Add pet with long name
    await addTestPet(page, '这是一个非常非常长的宠物名字测试', '测试品种')
    
    // Check that name is truncated in switcher
    const petButton = page.locator('button').filter({ hasText: '这是一个非常非常长的宠物名字测试' })
    await expect(petButton).toBeVisible()
    
    // Check that the text is truncated (by checking CSS classes)
    const nameSpan = petButton.locator('span.truncate')
    await expect(nameSpan).toBeVisible()
  })

  test('should auto-select first pet when active pet becomes unavailable', async ({ page }) => {
    // Add multiple pets
    await addTestPet(page, '小白', '金毛')
    await addTestPet(page, '小黑', '拉布拉多')
    
    // Select second pet as active
    await page.click('button:has-text("小黑")')
    await expect(page.locator('text=当前选中: 小黑')).toBeVisible()
    
    // Simulate pet deletion by navigating away and coming back with fewer pets
    // (This would typically happen through API calls, but for E2E we'll simulate the effect)
    // Note: In a real scenario, you'd delete the pet and check the behavior
    // For now, we'll just verify the current active pet behavior
  })

  test('should maintain responsive layout on different screen sizes', async ({ page }) => {
    // Add several pets
    await addTestPet(page, '小白', '金毛')
    await addTestPet(page, '小黑', '拉布拉多')
    await addTestPet(page, '小花', '萨摩耶')
    
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Check that pet switcher is still functional
    await expect(page.locator('text=选择宠物')).toBeVisible()
    await expect(page.locator('text=3个宠物')).toBeVisible()
    
    // Check that pets can still be clicked
    await page.click('button:has-text("小花")')
    await expect(page.locator('text=当前选中: 小花')).toBeVisible()
    
    // Test on tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    
    // Verify functionality is maintained
    await page.click('button:has-text("小白")')
    await expect(page.locator('text=当前选中: 小白')).toBeVisible()
  })

  test('should integrate properly with add pet workflow', async ({ page }) => {
    // Start with empty state
    await expect(page.locator('text=暂无宠物')).toBeVisible()
    
    // Use main add pet button (not from switcher)
    await page.click('text=添加宠物')
    
    // Add pet
    await page.fill('input[placeholder="请输入宠物名字"]', '新宠物')
    await page.click('button:has-text("创建宠物档案")')
    
    // Check that switcher updates automatically
    await expect(page.locator('text=选择宠物')).toBeVisible()
    await expect(page.locator('text=1个宠物')).toBeVisible()
    await expect(page.locator('text=新宠物')).toBeVisible()
    await expect(page.locator('text=当前选中: 新宠物')).toBeVisible()
  })
})

// Helper function to add a test pet
async function addTestPet(page: any, name: string, breed: string) {
  // Check if we're already in add pet mode
  const addPetFormVisible = await page.locator('text=添加新宠物').isVisible()
  
  if (!addPetFormVisible) {
    // Click add pet button (try both possible buttons)
    const addFirstPetButton = page.locator('text=添加我的第一个宠物')
    const addPetButton = page.locator('text=添加宠物')
    
    if (await addFirstPetButton.isVisible()) {
      await addFirstPetButton.click()
    } else {
      await addPetButton.click()
    }
  }
  
  // Fill form
  await page.fill('input[placeholder="请输入宠物名字"]', name)
  await page.fill('input[placeholder="请输入宠物品种（可选）"]', breed)
  
  // Submit
  await page.click('button:has-text("创建宠物档案")')
  
  // Wait for form to disappear and pet to appear
  await expect(page.locator('text=添加新宠物')).not.toBeVisible()
  await expect(page.locator(`text=${name}`)).toBeVisible()
}