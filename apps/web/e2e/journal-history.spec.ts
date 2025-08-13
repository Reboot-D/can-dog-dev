import { test, expect } from '@playwright/test'

test.describe('Journal History', () => {
  test.beforeEach(async ({ page }) => {
    // Mock successful authentication
    await page.route('**/api/health', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'healthy' })
      })
    })

    // Navigate to dashboard
    await page.goto('/zh-CN/dashboard')
    
    // Wait for dashboard to load
    await expect(page.getByTestId('dashboard')).toBeVisible()
  })

  test('displays journal history section when pet is selected', async ({ page }) => {
    // Mock pets data
    await page.route('**/api/pets', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'pet1',
            name: '小白',
            breed: '金毛寻回犬',
            date_of_birth: '2023-01-15',
            user_id: 'user1',
            created_at: '2025-01-01T00:00:00.000Z'
          }
        ])
      })
    })

    // Mock journal entries
    await page.route('**/api/pets/pet1/journal', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'entry1',
            created_at: '2025-07-28T10:00:00.000Z',
            user_id: 'user1',
            pet_id: 'pet1',
            content: '今天小白很活泼，玩了很久的飞盘游戏。',
            ai_advice: null
          },
          {
            id: 'entry2',
            created_at: '2025-07-27T15:30:00.000Z',
            user_id: 'user1',
            pet_id: 'pet1',
            content: '小白今天食欲不太好，只吃了一半的狗粮。',
            ai_advice: '建议观察宠物是否有其他症状，如有异常及时就医。'
          }
        ])
      })
    })

    await page.reload()

    // Wait for pet to be loaded and selected
    await expect(page.getByText('小白')).toBeVisible()

    // Should display journal history section
    await expect(page.getByTestId('journal-history')).toBeVisible()
    await expect(page.getByText('日记历史 - 小白')).toBeVisible()

    // Should display journal entries
    await expect(page.getByText('今天小白很活泼，玩了很久的飞盘游戏。')).toBeVisible()
    await expect(page.getByText('小白今天食欲不太好，只吃了一半的狗粮。')).toBeVisible()

    // Should display AI advice
    await expect(page.getByText('AI建议')).toBeVisible()
    await expect(page.getByText('建议观察宠物是否有其他症状，如有异常及时就医。')).toBeVisible()

    // Should display entries count
    await expect(page.getByText('共2条日记')).toBeVisible()
  })

  test('displays empty state when no journal entries exist', async ({ page }) => {
    // Mock pets data
    await page.route('**/api/pets', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'pet1',
            name: '小白',
            breed: '金毛寻回犬',
            date_of_birth: '2023-01-15',
            user_id: 'user1',
            created_at: '2025-01-01T00:00:00.000Z'
          }
        ])
      })
    })

    // Mock empty journal entries
    await page.route('**/api/pets/pet1/journal', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      })
    })

    await page.reload()

    // Wait for pet to be loaded
    await expect(page.getByText('小白')).toBeVisible()

    // Should display empty state
    await expect(page.getByText('暂无日记记录')).toBeVisible()
    await expect(page.getByText('还没有为这只宠物写过日记，开始记录它的点点滴滴吧！')).toBeVisible()
  })

  test('refreshes journal history when new entry is added', async ({ page }) => {
    // Mock pets data
    await page.route('**/api/pets', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'pet1',
            name: '小白',
            breed: '金毛寻回犬',
            date_of_birth: '2023-01-15',
            user_id: 'user1',
            created_at: '2025-01-01T00:00:00.000Z'
          }
        ])
      })
    })

    // Initially empty journal entries
    await page.route('**/api/pets/pet1/journal', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      })
    })

    // Mock journal entry creation
    let entryCreated = false
    await page.route('**/api/pets/pet1/journal', route => {
      if (route.request().method() === 'POST') {
        entryCreated = true
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'new-entry',
            created_at: '2025-07-28T12:00:00.000Z',
            user_id: 'user1',
            pet_id: 'pet1',
            content: '新增的日记内容',
            ai_advice: null
          })
        })
      } else {
        // GET request for journal entries
        const entries = entryCreated ? [
          {
            id: 'new-entry',
            created_at: '2025-07-28T12:00:00.000Z',
            user_id: 'user1',
            pet_id: 'pet1',
            content: '新增的日记内容',
            ai_advice: null
          }
        ] : []
        
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(entries)
        })
      }
    })

    await page.reload()

    // Wait for components to load
    await expect(page.getByText('小白')).toBeVisible()
    await expect(page.getByText('暂无日记记录')).toBeVisible()

    // Fill and submit journal entry form
    await page.getByPlaceholder('记录您宠物今天的状况、行为或特别的事情...').fill('新增的日记内容')
    await page.getByText('保存日记').click()

    // Wait for success message
    await expect(page.getByText('日记保存成功！')).toBeVisible()

    // Should refresh journal history and show the new entry
    await expect(page.getByText('新增的日记内容')).toBeVisible()
    await expect(page.getByText('共1条日记')).toBeVisible()
    
    // Empty state should no longer be visible
    await expect(page.getByText('暂无日记记录')).not.toBeVisible()
  })

  test('displays error state and allows retry', async ({ page }) => {
    // Mock pets data
    await page.route('**/api/pets', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'pet1',
            name: '小白',
            breed: '金毛寻回犬',
            date_of_birth: '2023-01-15',
            user_id: 'user1',
            created_at: '2025-01-01T00:00:00.000Z'
          }
        ])
      })
    })

    // Mock journal entries API to fail initially
    let apiCallCount = 0
    await page.route('**/api/pets/pet1/journal', route => {
      apiCallCount++
      if (apiCallCount === 1) {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        })
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'entry1',
              created_at: '2025-07-28T10:00:00.000Z',
              user_id: 'user1',
              pet_id: 'pet1',
              content: '重试后加载的日记内容',
              ai_advice: null
            }
          ])
        })
      }
    })

    await page.reload()

    // Wait for pet to be loaded
    await expect(page.getByText('小白')).toBeVisible()

    // Should display error message
    await expect(page.getByText('加载日记历史失败，请重试')).toBeVisible()

    // Click retry button
    await page.getByText('重试').click()

    // Should load successfully after retry
    await expect(page.getByText('重试后加载的日记内容')).toBeVisible()
    await expect(page.getByText('共1条日记')).toBeVisible()
  })

  test('properly formats dates in Chinese locale', async ({ page }) => {
    // Mock pets data
    await page.route('**/api/pets', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'pet1',
            name: '小白',
            breed: '金毛寻回犬',
            date_of_birth: '2023-01-15',
            user_id: 'user1',
            created_at: '2025-01-01T00:00:00.000Z'
          }
        ])
      })
    })

    // Mock journal entries with specific date
    await page.route('**/api/pets/pet1/journal', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'entry1',
            created_at: '2025-07-28T14:30:00.000Z',
            user_id: 'user1',
            pet_id: 'pet1',
            content: '测试日期格式的日记内容',
            ai_advice: null
          }
        ])
      })
    })

    await page.reload()

    // Wait for components to load
    await expect(page.getByText('小白')).toBeVisible()

    // Should display date in Chinese format
    await expect(page.getByText(/2025年.*月.*日/)).toBeVisible()
  })

  test('switches journal history when different pet is selected', async ({ page }) => {
    // Mock pets data
    await page.route('**/api/pets', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'pet1',
            name: '小白',
            breed: '金毛寻回犬',
            date_of_birth: '2023-01-15',
            user_id: 'user1',
            created_at: '2025-01-01T00:00:00.000Z'
          },
          {
            id: 'pet2',
            name: '小黑',
            breed: '拉布拉多',
            date_of_birth: '2022-08-20',
            user_id: 'user1',
            created_at: '2025-01-02T00:00:00.000Z'
          }
        ])
      })
    })

    // Mock journal entries for different pets
    await page.route('**/api/pets/pet1/journal', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'entry1',
            created_at: '2025-07-28T10:00:00.000Z',
            user_id: 'user1',
            pet_id: 'pet1',
            content: '小白的日记内容',
            ai_advice: null
          }
        ])
      })
    })

    await page.route('**/api/pets/pet2/journal', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'entry2',
            created_at: '2025-07-28T11:00:00.000Z',
            user_id: 'user1',
            pet_id: 'pet2',
            content: '小黑的日记内容',
            ai_advice: null
          }
        ])
      })
    })

    await page.reload()

    // Initially should show first pet (小白)
    await expect(page.getByText('日记历史 - 小白')).toBeVisible()
    await expect(page.getByText('小白的日记内容')).toBeVisible()

    // Switch to second pet (小黑)
    await page.getByText('小黑').click()

    // Should show second pet's journal history
    await expect(page.getByText('日记历史 - 小黑')).toBeVisible()
    await expect(page.getByText('小黑的日记内容')).toBeVisible()
    
    // Should not show first pet's content
    await expect(page.getByText('小白的日记内容')).not.toBeVisible()
  })
})