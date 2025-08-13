import { test, expect } from '@playwright/test'

test.describe('AI Journal Analysis', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        user: { id: 'test-user', email: 'test@example.com' }
      }))
    })

    // Mock pets API to return test pet
    await page.route('**/api/pets', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            pets: [{
              id: 'test-pet-1',
              name: '测试宠物',
              breed: '金毛犬',
              date_of_birth: '2022-01-15',
              user_id: 'test-user'
            }]
          })
        })
      }
    })

    // Mock session check
    await page.route('**/auth/session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 'test-user', email: 'test@example.com' }
        })
      })
    })

    await page.goto('/dashboard')
  })

  test('should display AI advice after journal entry submission', async ({ page }) => {
    // Mock successful journal creation with AI analysis
    await page.route('**/api/pets/*/journal', async route => {
      const requestData = route.request().postDataJSON()
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          journalEntry: {
            id: 'journal-1',
            content: requestData?.content,
            created_at: new Date().toISOString(),
            user_id: 'test-user',
            pet_id: 'test-pet-1',
            ai_advice: '根据您的描述，您的宠物表现出健康的行为模式。建议继续保持规律的散步和均衡的饮食。如有任何异常行为，请咨询兽医。'
          }
        })
      })
    })

    // Fill and submit journal entry
    const textarea = page.locator('textarea[placeholder*="记录您宠物今天的状况"]')
    await textarea.fill('今天小白很活跃，吃饭正常，精神状态很好。')

    await page.click('button:has-text("保存日记")')

    // Wait for submission to complete
    await expect(page.getByText('日记保存成功！')).toBeVisible()

    // Check that AI advice section appears
    await expect(page.getByText('AI 建议')).toBeVisible()
    await expect(page.getByText('根据您的描述，您的宠物表现出健康的行为模式')).toBeVisible()

    // Check that advice is presented cautiously
    await expect(page.getByText('如有任何异常行为，请咨询兽医')).toBeVisible()
  })

  test('should handle different types of journal content appropriately', async ({ page }) => {
    const testCases = [
      {
        input: '今天小白拉肚子了，看起来没什么精神。',
        expectedAdvice: '拉肚子可能是多种原因引起的，包括饮食不当、压力或健康问题。建议观察症状持续时间，如果超过24小时或伴有其他症状，请立即咨询兽医。'
      },
      {
        input: '小白今天特别兴奋，一直在跳来跳去，食欲很好。',
        expectedAdvice: '您的宠物表现出良好的精神状态和食欲，这是健康的积极信号。继续保持现有的护理方式，确保足够的运动和休息。'
      },
      {
        input: '给小白洗了澡，它似乎不太喜欢，但是洗完后很干净。',
        expectedAdvice: '大多数宠物对洗澡都有一定的抗拒，这是正常现象。建议使用温水和宠物专用洗浴用品，洗澡频率不宜过高以免伤害皮肤。'
      }
    ]

    for (const testCase of testCases) {
      // Mock API response for each test case
      await page.route('**/api/pets/*/journal', async route => {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            journalEntry: {
              id: `journal-${Date.now()}`,
              content: testCase.input,
              created_at: new Date().toISOString(),
              user_id: 'test-user',
              pet_id: 'test-pet-1',
              ai_advice: testCase.expectedAdvice
            }
          })
        })
      })

      // Clear previous content and enter new content
      const textarea = page.locator('textarea[placeholder*="记录您宠物今天的状况"]')
      await textarea.fill('')
      await textarea.fill(testCase.input)

      await page.click('button:has-text("保存日记")')

      // Wait for submission and check AI advice
      await expect(page.getByText('日记保存成功！')).toBeVisible()
      await expect(page.getByText(testCase.expectedAdvice)).toBeVisible()

      // Wait a bit before next iteration
      await page.waitForTimeout(1000)
    }
  })

  test('should handle AI service errors gracefully', async ({ page }) => {
    // Mock journal creation without AI advice (simulating AI service failure)
    await page.route('**/api/pets/*/journal', async route => {
      const requestData = route.request().postDataJSON()
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          journalEntry: {
            id: 'journal-no-ai',
            content: requestData?.content,
            created_at: new Date().toISOString(),
            user_id: 'test-user',
            pet_id: 'test-pet-1',
            ai_advice: null // No AI advice due to service error
          }
        })
      })
    })

    const textarea = page.locator('textarea[placeholder*="记录您宠物今天的状况"]')
    await textarea.fill('今天的日记内容测试。')

    await page.click('button:has-text("保存日记")')

    // Journal should still be saved successfully
    await expect(page.getByText('日记保存成功！')).toBeVisible()

    // Should show graceful message about AI advice not being available
    await expect(page.getByText('AI 分析暂时不可用，请稍后查看建议。')).toBeVisible()

    // Should not show empty AI advice section
    await expect(page.locator('div:has-text("AI 建议") + div:empty')).not.toBeVisible()
  })

  test('should display AI advice in proper Chinese localization', async ({ page }) => {
    await page.route('**/api/pets/*/journal', async route => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          journalEntry: {
            id: 'journal-chinese',
            content: '测试中文内容',
            created_at: new Date().toISOString(),
            user_id: 'test-user',
            pet_id: 'test-pet-1',
            ai_advice: '根据您提供的信息，建议您密切观察宠物的行为变化，保持规律的生活作息，如有疑虑请及时联系专业兽医。这仅供参考，不能替代专业医疗建议。'
          }
        })
      })
    })

    const textarea = page.locator('textarea[placeholder*="记录您宠物今天的状况"]')
    await textarea.fill('测试中文内容')

    await page.click('button:has-text("保存日记")')

    await expect(page.getByText('日记保存成功！')).toBeVisible()

    // Check Chinese UI elements
    await expect(page.getByText('AI 建议')).toBeVisible()
    await expect(page.getByText('这仅供参考，不能替代专业医疗建议')).toBeVisible()

    // Check that advice disclaimer is present
    await expect(page.getByText('此建议仅供参考，如有健康问题请咨询专业兽医')).toBeVisible()
  })

  test('should handle long journal entries and long AI responses', async ({ page }) => {
    const longJournalContent = '今天是非常特殊的一天，' + '小白表现得特别活跃，'.repeat(50) + '整体状态很好。'
    const longAIAdvice = '根据您详细的描述，' + '您的宠物表现出健康的行为模式，'.repeat(20) + '建议继续保持现有的护理方式。'

    await page.route('**/api/pets/*/journal', async route => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          journalEntry: {
            id: 'journal-long',
            content: longJournalContent,
            created_at: new Date().toISOString(),
            user_id: 'test-user',
            pet_id: 'test-pet-1',
            ai_advice: longAIAdvice
          }
        })
      })
    })

    const textarea = page.locator('textarea[placeholder*="记录您宠物今天的状况"]')
    await textarea.fill(longJournalContent)

    // Check character count updates correctly
    await expect(page.getByText(`${longJournalContent.length}/10,000`)).toBeVisible()

    await page.click('button:has-text("保存日记")')

    await expect(page.getByText('日记保存成功！')).toBeVisible()

    // Check that long AI advice is displayed properly (should be scrollable or truncated)
    const aiAdviceSection = page.locator('div:has-text("AI 建议")').locator('..')
    await expect(aiAdviceSection).toBeVisible()

    // Check that the advice doesn't break the layout
    const adviceContent = page.locator('text=' + longAIAdvice.substring(0, 50))
    await expect(adviceContent).toBeVisible()
  })

  test('should maintain AI advice history across pet switches', async ({ page }) => {
    // Mock multiple pets
    await page.route('**/api/pets', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            pets: [
              {
                id: 'pet-1',
                name: '小白',
                breed: '金毛犬',
                user_id: 'test-user'
              },
              {
                id: 'pet-2',
                name: '小黑',
                breed: '拉布拉多',
                user_id: 'test-user'
              }
            ]
          })
        })
      }
    })

    // Mock journal entries for each pet
    await page.route('**/api/pets/pet-1/journal', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            journalEntry: {
              id: 'journal-pet1',
              content: '小白今天的日记',
              ai_advice: '小白的 AI 建议内容',
              pet_id: 'pet-1'
            }
          })
        })
      }
    })

    await page.route('**/api/pets/pet-2/journal', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            journalEntry: {
              id: 'journal-pet2',
              content: '小黑今天的日记',
              ai_advice: '小黑的 AI 建议内容',
              pet_id: 'pet-2'
            }
          })
        })
      }
    })

    await page.reload() // Reload to get multiple pets

    // Create journal entry for first pet
    await page.click('button:has-text("小白")')
    await page.fill('textarea', '小白今天的日记')
    await page.click('button:has-text("保存日记")')
    await expect(page.getByText('小白的 AI 建议内容')).toBeVisible()

    // Switch to second pet and create journal entry
    await page.click('button:has-text("小黑")')
    await page.fill('textarea', '小黑今天的日记')
    await page.click('button:has-text("保存日记")')
    await expect(page.getByText('小黑的 AI 建议内容')).toBeVisible()

    // Switch back to first pet - should show its AI advice
    await page.click('button:has-text("小白")')
    await expect(page.getByText('小白的 AI 建议内容')).toBeVisible()
    await expect(page.getByText('小黑的 AI 建议内容')).not.toBeVisible()
  })

  test('should handle AI advice formatting and special characters', async ({ page }) => {
    const adviceWithFormatting = `您的宠物状态分析：

1. 身体状况：良好
2. 精神状态：活跃
3. 建议事项：
   • 保持规律运动
   • 注意饮食均衡
   • 定期健康检查

⚠️ 注意：此建议仅供参考，如有健康问题请及时就医。`

    await page.route('**/api/pets/*/journal', async route => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          journalEntry: {
            id: 'journal-formatted',
            content: '测试格式化内容',
            created_at: new Date().toISOString(),
            user_id: 'test-user',
            pet_id: 'test-pet-1',
            ai_advice: adviceWithFormatting
          }
        })
      })
    })

    const textarea = page.locator('textarea[placeholder*="记录您宠物今天的状况"]')
    await textarea.fill('测试格式化内容')

    await page.click('button:has-text("保存日记")')

    await expect(page.getByText('日记保存成功！')).toBeVisible()

    // Check that formatted content is displayed properly
    await expect(page.getByText('身体状况：良好')).toBeVisible()
    await expect(page.getByText('精神状态：活跃')).toBeVisible()
    await expect(page.getByText('保持规律运动')).toBeVisible()
    await expect(page.getByText('⚠️ 注意：此建议仅供参考')).toBeVisible()

    // Check that list formatting is preserved
    const aiAdviceSection = page.locator('div').filter({ hasText: 'AI 建议' })
    await expect(aiAdviceSection).toBeVisible()
  })

  test('should provide appropriate warnings and disclaimers', async ({ page }) => {
    await page.route('**/api/pets/*/journal', async route => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          journalEntry: {
            id: 'journal-warning',
            content: '小白今天不太舒服',
            created_at: new Date().toISOString(),
            user_id: 'test-user',
            pet_id: 'test-pet-1',
            ai_advice: '如果您的宠物表现出不适症状，建议立即联系兽医进行专业检查。这些症状可能需要医疗关注。'
          }
        })
      })
    })

    const textarea = page.locator('textarea[placeholder*="记录您宠物今天的状况"]')
    await textarea.fill('小白今天不太舒服')

    await page.click('button:has-text("保存日记")')

    await expect(page.getByText('日记保存成功！')).toBeVisible()

    // Check medical disclaimer is always present
    await expect(page.getByText('此建议仅供参考，如有健康问题请咨询专业兽医')).toBeVisible()

    // Check urgent care recommendation
    await expect(page.getByText('建议立即联系兽医进行专业检查')).toBeVisible()

    // Verify disclaimer styling (should be prominent)
    const disclaimer = page.locator('text=此建议仅供参考，如有健康问题请咨询专业兽医')
    await expect(disclaimer).toBeVisible()
  })
})