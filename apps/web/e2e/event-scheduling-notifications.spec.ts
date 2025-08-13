import { test, expect } from '@playwright/test'

test.describe('Event Scheduling and Notifications', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        user: { id: 'test-user', email: 'test@example.com' }
      }))
    })

    // Mock pets API
    await page.route('**/api/pets', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            pets: [{
              id: 'test-pet-1',
              name: '小白',
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

  test('should display upcoming events on dashboard', async ({ page }) => {
    const mockEvents = [
      {
        id: 'event-1',
        title: '疫苗接种提醒',
        description: '年度疫苗接种时间到了',
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
        event_type: 'vaccination',
        pet_id: 'test-pet-1',
        is_completed: false
      },
      {
        id: 'event-2',
        title: '定期体检',
        description: '建议进行全面健康检查',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        event_type: 'health_check',
        pet_id: 'test-pet-1',
        is_completed: false
      }
    ]

    await page.route('**/api/pets/*/events', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ events: mockEvents })
      })
    })

    await page.reload()

    // Check upcoming events section
    await expect(page.getByText('即将到来的事件')).toBeVisible()
    await expect(page.getByText('疫苗接种提醒')).toBeVisible()
    await expect(page.getByText('定期体检')).toBeVisible()

    // Check event details
    await expect(page.getByText('年度疫苗接种时间到了')).toBeVisible()
    await expect(page.getByText('建议进行全面健康检查')).toBeVisible()

    // Check due dates display (should show relative time)
    await expect(page.getByText('3天后')).toBeVisible()
    await expect(page.getByText('7天后')).toBeVisible()
  })

  test('should prioritize urgent events at the top', async ({ page }) => {
    const mockEvents = [
      {
        id: 'event-urgent',
        title: '紧急用药提醒',
        description: '记得给药',
        due_date: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
        event_type: 'medication',
        pet_id: 'test-pet-1',
        is_completed: false,
        priority: 'high'
      },
      {
        id: 'event-normal',
        title: '常规检查',
        description: '一般性检查',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        event_type: 'health_check',
        pet_id: 'test-pet-1',
        is_completed: false,
        priority: 'normal'
      }
    ]

    await page.route('**/api/pets/*/events', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ events: mockEvents })
      })
    })

    await page.reload()

    // Check that urgent event appears first
    const eventsList = page.locator('[data-testid="events-list"]')
    const firstEvent = eventsList.locator('.event-item').first()
    
    await expect(firstEvent).toContainText('紧急用药提醒')
    await expect(firstEvent).toHaveClass(/urgent|high-priority/)

    // Check urgent event styling
    await expect(firstEvent.locator('.event-priority-indicator')).toHaveClass(/bg-red/)
  })

  test('should allow marking events as completed', async ({ page }) => {
    const mockEvents = [
      {
        id: 'event-to-complete',
        title: '每日散步',
        description: '30分钟散步',
        due_date: new Date().toISOString(),
        event_type: 'exercise',
        pet_id: 'test-pet-1',
        is_completed: false
      }
    ]

    await page.route('**/api/pets/*/events', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ events: mockEvents })
        })
      }
    })

    // Mock event completion endpoint
    await page.route('**/api/pets/*/events/*/complete', async route => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Event marked as completed',
            event: { ...mockEvents[0], is_completed: true }
          })
        })
      }
    })

    await page.reload()

    // Find and click the complete button
    const eventItem = page.locator('text=每日散步').locator('..')
    const completeButton = eventItem.locator('button:has-text("完成")')
    
    await completeButton.click()

    // Check that event is marked as completed
    await expect(eventItem).toHaveClass(/completed/)
    await expect(eventItem.locator('text=已完成')).toBeVisible()
    
    // Complete button should be replaced with completed indicator
    await expect(completeButton).not.toBeVisible()
  })

  test('should handle different event types with appropriate icons and colors', async ({ page }) => {
    const mockEvents = [
      {
        id: 'event-vaccination',
        title: '疫苗接种',
        event_type: 'vaccination',
        due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        pet_id: 'test-pet-1'
      },
      {
        id: 'event-medication',
        title: '用药提醒',
        event_type: 'medication',
        due_date: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        pet_id: 'test-pet-1'
      },
      {
        id: 'event-grooming',
        title: '美容护理',
        event_type: 'grooming',
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        pet_id: 'test-pet-1'
      },
      {
        id: 'event-exercise',
        title: '运动时间',
        event_type: 'exercise',
        due_date: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        pet_id: 'test-pet-1'
      }
    ]

    await page.route('**/api/pets/*/events', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ events: mockEvents })
      })
    })

    await page.reload()

    // Check vaccination event styling
    const vaccinationEvent = page.locator('text=疫苗接种').locator('..')
    await expect(vaccinationEvent.locator('.event-icon')).toHaveClass(/vaccination/)
    
    // Check medication event styling  
    const medicationEvent = page.locator('text=用药提醒').locator('..')
    await expect(medicationEvent.locator('.event-icon')).toHaveClass(/medication/)
    
    // Check grooming event styling
    const groomingEvent = page.locator('text=美容护理').locator('..')
    await expect(groomingEvent.locator('.event-icon')).toHaveClass(/grooming/)
    
    // Check exercise event styling
    const exerciseEvent = page.locator('text=运动时间').locator('..')
    await expect(exerciseEvent.locator('.event-icon')).toHaveClass(/exercise/)
  })

  test('should display overdue events with warning styling', async ({ page }) => {
    const mockEvents = [
      {
        id: 'event-overdue',
        title: '过期疫苗',
        description: '疫苗已过期，需要尽快接种',
        due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        event_type: 'vaccination',
        pet_id: 'test-pet-1',
        is_completed: false,
        is_overdue: true
      }
    ]

    await page.route('**/api/pets/*/events', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ events: mockEvents })
      })
    })

    await page.reload()

    // Check overdue event styling
    const overdueEvent = page.locator('text=过期疫苗').locator('..')
    await expect(overdueEvent).toHaveClass(/overdue/)
    await expect(overdueEvent).toHaveClass(/bg-red-50|border-red/)
    
    // Check overdue indicator
    await expect(overdueEvent.locator('text=已过期')).toBeVisible()
    await expect(overdueEvent.locator('.overdue-indicator')).toBeVisible()
    
    // Check relative time shows "2天前"
    await expect(overdueEvent.locator('text=2天前')).toBeVisible()
  })

  test('should handle empty events state', async ({ page }) => {
    await page.route('**/api/pets/*/events', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ events: [] })
      })
    })

    await page.reload()

    // Check empty state message
    await expect(page.getByText('暂无即将到来的事件')).toBeVisible()
    await expect(page.getByText('所有事件都已完成或暂无安排的事件')).toBeVisible()
    
    // Should show suggestion to add events
    await expect(page.getByText('系统会自动为您的宠物安排常规护理事件')).toBeVisible()
  })

  test('should show event details in expandable format', async ({ page }) => {
    const mockEvents = [
      {
        id: 'event-detailed',
        title: '年度体检',
        description: '包括血液检查、心脏检查、牙齿检查等全面健康评估',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        event_type: 'health_check',
        pet_id: 'test-pet-1',
        notes: '去年体检发现轻微心脏杂音，需要重点关注',
        estimated_duration: '60分钟',
        recommended_clinic: '宠物医院推荐：爱心动物医院'
      }
    ]

    await page.route('**/api/pets/*/events', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ events: mockEvents })
      })
    })

    await page.reload()

    // Click to expand event details
    const eventItem = page.locator('text=年度体检').locator('..')
    await eventItem.click()

    // Check expanded details
    await expect(page.getByText('包括血液检查、心脏检查、牙齿检查')).toBeVisible()
    await expect(page.getByText('去年体检发现轻微心脏杂音')).toBeVisible()
    await expect(page.getByText('预计时长：60分钟')).toBeVisible()
    await expect(page.getByText('推荐医院：爱心动物医院')).toBeVisible()

    // Click again to collapse
    await eventItem.click()
    await expect(page.getByText('包括血液检查、心脏检查、牙齿检查')).not.toBeVisible()
  })

  test('should filter events by pet when multiple pets exist', async ({ page }) => {
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

    // Mock events for each pet
    await page.route('**/api/pets/pet-1/events', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          events: [{
            id: 'event-pet1',
            title: '小白的疫苗',
            pet_id: 'pet-1',
            due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          }]
        })
      })
    })

    await page.route('**/api/pets/pet-2/events', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          events: [{
            id: 'event-pet2',
            title: '小黑的体检',
            pet_id: 'pet-2',
            due_date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
          }]
        })
      })
    })

    await page.reload()

    // Initially should show first pet's events
    await expect(page.getByText('小白的疫苗')).toBeVisible()
    await expect(page.getByText('小黑的体检')).not.toBeVisible()

    // Switch to second pet
    await page.click('button:has-text("小黑")')

    // Should now show second pet's events
    await expect(page.getByText('小黑的体检')).toBeVisible()
    await expect(page.getByText('小白的疫苗')).not.toBeVisible()
  })

  test('should handle automated event creation based on pet profile', async ({ page }) => {
    // Mock automated event creation API
    await page.route('**/api/cron/create-scheduled-events', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Scheduled events created successfully',
          eventsCreated: 3
        })
      })
    })

    // Mock breed-specific event suggestions
    await page.route('**/api/pets/*/events/suggestions', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          suggestions: [
            {
              title: '金毛犬髋关节检查',
              description: '金毛犬容易患髋关节发育不良，建议定期检查',
              recommended_frequency: '每年一次',
              event_type: 'health_check'
            },
            {
              title: '毛发护理',
              description: '金毛犬需要定期梳毛和清洁',
              recommended_frequency: '每周两次',
              event_type: 'grooming'
            }
          ]
        })
      })
    })

    await page.goto('/dashboard')

    // Should show breed-specific event suggestions
    await expect(page.getByText('系统建议')).toBeVisible()
    await expect(page.getByText('金毛犬髋关节检查')).toBeVisible()
    await expect(page.getByText('毛发护理')).toBeVisible()

    // Should show frequency recommendations
    await expect(page.getByText('每年一次')).toBeVisible()
    await expect(page.getByText('每周两次')).toBeVisible()
  })

  test('should integrate with email notification preferences', async ({ page }) => {
    // Mock notification preferences API
    await page.route('**/api/user/notification-preferences', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            preferences: {
              email_notifications: true,
              advance_notice_days: 2,
              notification_types: ['vaccination', 'health_check', 'medication']
            }
          })
        })
      }
    })

    await page.goto('/dashboard')

    // Check notification settings indicator
    await expect(page.locator('[data-testid="notification-status"]')).toContainText('邮件通知已启用')

    // Should show advance notice information
    await expect(page.getByText('提前2天通知')).toBeVisible()

    // Test notification preference changes
    await page.click('button:has-text("通知设置")')

    const notificationModal = page.locator('[data-testid="notification-preferences-modal"]')
    await expect(notificationModal).toBeVisible()

    // Check current settings
    await expect(notificationModal.locator('input[type="checkbox"][checked]')).toHaveCount(3)

    // Test changing preferences
    await notificationModal.locator('input[value="grooming"]').check()
    await notificationModal.locator('select[name="advance_notice"]').selectOption('7')

    await page.click('button:has-text("保存设置")')

    // Should show updated preferences
    await expect(page.getByText('提前7天通知')).toBeVisible()
  })

  test('should display notification history and status', async ({ page }) => {
    // Mock notification history API
    await page.route('**/api/notifications/history', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          notifications: [
            {
              id: 'notif-1',
              event_id: 'event-1',
              sent_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              status: 'delivered',
              type: 'email',
              title: '疫苗接种提醒'
            },
            {
              id: 'notif-2',
              event_id: 'event-2',
              sent_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              status: 'failed',
              type: 'email',
              title: '用药提醒'
            }
          ]
        })
      })
    })

    await page.goto('/dashboard')

    // Navigate to notification history
    await page.click('button:has-text("通知历史")')

    // Check notification history displays
    await expect(page.getByText('通知记录')).toBeVisible()
    await expect(page.getByText('疫苗接种提醒')).toBeVisible()
    await expect(page.getByText('用药提醒')).toBeVisible()

    // Check status indicators
    await expect(page.locator('.notification-status.delivered')).toBeVisible()
    await expect(page.locator('.notification-status.failed')).toBeVisible()

    // Check timestamps
    await expect(page.getByText('1天前')).toBeVisible()
    await expect(page.getByText('2小时前')).toBeVisible()
  })

  test('should handle timezone considerations for event scheduling', async ({ page }) => {
    // Mock events with timezone information
    const mockEvents = [
      {
        id: 'event-tz',
        title: '定时用药',
        due_date: '2024-01-15T08:00:00+08:00', // UTC+8 timezone
        timezone: 'Asia/Shanghai',
        pet_id: 'test-pet-1'
      }
    ]

    await page.route('**/api/pets/*/events', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ events: mockEvents })
      })
    })

    await page.reload()

    // Should display time in user's local timezone
    await expect(page.getByText('定时用药')).toBeVisible()
    
    // Check that time display accounts for timezone
    const eventTime = page.locator('.event-time')
    await expect(eventTime).toBeVisible()
    
    // Should show timezone indicator
    await expect(page.getByText('UTC+8')).toBeVisible()
  })
})