import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { JournalHistory } from '../journal-history'
import { journalService } from '@/lib/journal/journal-service'
import { JournalEntry } from '@/types/supabase'

// Mock the journal service
jest.mock('@/lib/journal/journal-service', () => ({
  journalService: {
    getJournalEntries: jest.fn(),
    createJournalEntry: jest.fn()
  }
}))

const mockJournalService = journalService as jest.Mocked<typeof journalService>

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, string | number>) => {
    const translations: Record<string, unknown> = {
      'journal.history.title': '日记历史',
      'journal.history.aiAdvice': 'AI建议',
      'journal.history.entriesCount': (p: { count: number }) => `共${p.count}条日记`,
      'journal.history.empty.title': '暂无日记记录',
      'journal.history.empty.description': '还没有为这只宠物写过日记，开始记录它的点点滴滴吧！',
      'journal.history.errors.loadFailed': '加载日记历史失败，请重试',
      'journal.history.errors.petNotFound': '宠物档案未找到',
      'auth.invalidCredentials': '邮箱或密码不正确',
      'common.retry': '重试'
    }
    const translation = translations[key]
    if (typeof translation === 'function') {
      return translation(params)
    }
    return translation || key
  }
}))

const mockEntries: JournalEntry[] = [
  {
    id: '1',
    created_at: '2025-07-28T10:00:00.000Z',
    user_id: 'user1',
    pet_id: 'pet1',
    content: '今天小白很活泼，玩了很久的飞盘游戏。',
    ai_advice: null
  },
  {
    id: '2',
    created_at: '2025-07-27T15:30:00.000Z',
    user_id: 'user1',
    pet_id: 'pet1',
    content: '小白今天食欲不太好，只吃了一半的狗粮。需要观察一下。',
    ai_advice: '建议观察宠物是否有其他症状，如有异常及时就医。'
  }
]

describe('JournalHistory Component', () => {
  const defaultProps = {
    petId: 'pet1',
    petName: '小白'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Loading States', () => {
    it('displays loading skeleton while fetching entries', async () => {
      // Mock service to return a promise that doesn't resolve immediately
      mockJournalService.getJournalEntries.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve([]), 100))
      )

      render(<JournalHistory {...defaultProps} />)

      // Should show loading skeleton
      expect(screen.getByTestId('journal-history')).toBeInTheDocument()
      expect(screen.getByText('日记历史 - 小白')).toBeInTheDocument()
      
      // Should show animated loading placeholders
      const loadingElements = document.querySelectorAll('.animate-pulse')
      expect(loadingElements.length).toBeGreaterThan(0)

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText('.animate-pulse')).not.toBeInTheDocument()
      })
    })
  })

  describe('Empty State', () => {
    it('displays empty state message when no entries exist', async () => {
      mockJournalService.getJournalEntries.mockResolvedValue([])

      render(<JournalHistory {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('暂无日记记录')).toBeInTheDocument()
        expect(screen.getByText('还没有为这只宠物写过日记，开始记录它的点点滴滴吧！')).toBeInTheDocument()
      })

      // Should show empty state icon
      const svgElement = document.querySelector('svg')
      expect(svgElement).toBeInTheDocument()
    })
  })

  describe('Data Display', () => {
    it('displays journal entries with proper formatting', async () => {
      mockJournalService.getJournalEntries.mockResolvedValue(mockEntries)

      render(<JournalHistory {...defaultProps} />)

      await waitFor(() => {
        // Should display entries
        expect(screen.getByText('今天小白很活泼，玩了很久的飞盘游戏。')).toBeInTheDocument()
        expect(screen.getByText('小白今天食欲不太好，只吃了一半的狗粮。需要观察一下。')).toBeInTheDocument()
        
        // Should show entries count
        expect(screen.getByText('共2条日记')).toBeInTheDocument()
      })
    })

    it('displays AI advice when available', async () => {
      mockJournalService.getJournalEntries.mockResolvedValue(mockEntries)

      render(<JournalHistory {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('AI建议')).toBeInTheDocument()
        expect(screen.getByText('建议观察宠物是否有其他症状，如有异常及时就医。')).toBeInTheDocument()
      })
    })

    it('formats dates in Chinese locale', async () => {
      mockJournalService.getJournalEntries.mockResolvedValue(mockEntries)

      render(<JournalHistory {...defaultProps} />)

      await waitFor(() => {
        // Should format dates in Chinese format
        const dateElements = screen.getAllByText(/2025年.*月.*日/)
        expect(dateElements.length).toBeGreaterThan(0)
      })
    })

    it('truncates long content appropriately', async () => {
      const longContentEntry: JournalEntry = {
        id: '3',
        created_at: '2025-07-26T12:00:00.000Z',
        user_id: 'user1',
        pet_id: 'pet1',
        content: 'A'.repeat(250), // Content longer than 200 characters
        ai_advice: null
      }

      mockJournalService.getJournalEntries.mockResolvedValue([longContentEntry])

      render(<JournalHistory {...defaultProps} />)

      await waitFor(() => {
        // Should truncate and add ellipsis
        const truncatedText = screen.getByText(/A{200}\.\.\./)
        expect(truncatedText).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('displays error message when loading fails', async () => {
      const error = new Error('Network error')
      mockJournalService.getJournalEntries.mockRejectedValue(error)

      render(<JournalHistory {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('加载日记历史失败，请重试')).toBeInTheDocument()
        expect(screen.getByText('重试')).toBeInTheDocument()
      })
    })

    it('displays authentication error message', async () => {
      const error = new Error('User not authenticated')
      mockJournalService.getJournalEntries.mockRejectedValue(error)

      render(<JournalHistory {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('邮箱或密码不正确')).toBeInTheDocument()
      })
    })

    it('displays pet not found error message', async () => {
      const error = new Error('Pet not found')
      mockJournalService.getJournalEntries.mockRejectedValue(error)

      render(<JournalHistory {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('宠物档案未找到')).toBeInTheDocument()
      })
    })

    it('allows retry after error', async () => {
      const error = new Error('Network error')
      mockJournalService.getJournalEntries
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(mockEntries)

      render(<JournalHistory {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('加载日记历史失败，请重试')).toBeInTheDocument()
      })

      // Click retry button
      const retryButton = screen.getByText('重试')
      fireEvent.click(retryButton)

      await waitFor(() => {
        expect(screen.getByText('今天小白很活泼，玩了很久的飞盘游戏。')).toBeInTheDocument()
      })
    })
  })

  describe('Refresh Behavior', () => {
    it('refetches data when refreshTrigger changes', async () => {
      mockJournalService.getJournalEntries.mockResolvedValue(mockEntries)

      const { rerender } = render(<JournalHistory {...defaultProps} refreshTrigger={0} />)

      await waitFor(() => {
        expect(mockJournalService.getJournalEntries).toHaveBeenCalledTimes(1)
      })

      // Change refreshTrigger
      rerender(<JournalHistory {...defaultProps} refreshTrigger={1} />)

      await waitFor(() => {
        expect(mockJournalService.getJournalEntries).toHaveBeenCalledTimes(2)
      })
    })

    it('refetches data when petId changes', async () => {
      mockJournalService.getJournalEntries.mockResolvedValue(mockEntries)

      const { rerender } = render(<JournalHistory {...defaultProps} />)

      await waitFor(() => {
        expect(mockJournalService.getJournalEntries).toHaveBeenCalledWith('pet1')
      })

      // Change petId
      rerender(<JournalHistory petId="pet2" petName="小黑" />)

      await waitFor(() => {
        expect(mockJournalService.getJournalEntries).toHaveBeenCalledWith('pet2')
      })
    })
  })

  describe('Responsive Design', () => {
    it('applies proper CSS classes for mobile responsiveness', async () => {
      mockJournalService.getJournalEntries.mockResolvedValue(mockEntries)

      render(<JournalHistory {...defaultProps} />)

      await waitFor(() => {
        const historyContainer = screen.getByTestId('journal-history')
        expect(historyContainer).toHaveClass('bg-white', 'p-6', 'rounded-lg', 'shadow-sm', 'border')
      })
    })

    it('includes scrollable container for long lists', async () => {
      mockJournalService.getJournalEntries.mockResolvedValue(mockEntries)

      render(<JournalHistory {...defaultProps} />)

      await waitFor(() => {
        const scrollContainer = document.querySelector('.max-h-96.overflow-y-auto')
        expect(scrollContainer).toBeInTheDocument()
      })
    })
  })
})