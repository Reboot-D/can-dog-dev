/**
 * Unit tests for JournalEntryForm component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { JournalEntryForm } from '../journal-entry-form'
import { journalService } from '@/lib/journal/journal-service'

// Mock the journal service
jest.mock('@/lib/journal/journal-service', () => ({
  journalService: {
    createJournalEntry: jest.fn()
  }
}))

// Mock useTranslations to return actual translations
jest.mock('next-intl', () => ({
  ...jest.requireActual('next-intl'),
  useTranslations: () => {
    const messages = {
      journal: {
        form: {
          title: '写日记',
          contentLabel: '今天的日记',
          contentPlaceholder: '记录您宠物今天的状况、行为或特别的事情...',
          saveButton: '保存日记',
          saving: '保存中...',
          success: '日记保存成功！',
          errors: {
            contentRequired: '日记内容不能为空',
            contentTooLong: '日记内容不能超过10,000个字符',
            saveFailed: '保存日记失败，请重试',
            noPetSelected: '请先选择一个宠物'
          }
        },
        ai: {
          title: 'AI护理建议',
          analyzing: '正在分析日记内容...',
          analysisError: 'AI分析暂时不可用',
          retryAnalysis: '重新分析',
          errorMessages: {
            rateLimited: 'AI分析请求过于频繁，请稍后重试',
            serviceUnavailable: 'AI服务暂时不可用，请稍后重试',
            invalidResponse: 'AI分析未返回有效结果',
            generalError: 'AI分析暂时不可用，请稍后重试'
          }
        }
      },
      auth: {
        invalidCredentials: '邮箱或密码不正确'
      }
    }
    
    return (key: string) => {
      const keys = key.split('.')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let value: any = messages
      for (const k of keys) {
        value = value?.[k]
      }
      return value || key
    }
  }
}))

const mockJournalService = journalService as jest.Mocked<typeof journalService>

const renderWithIntl = (component: React.ReactElement) => {
  return render(component)
}

describe('JournalEntryForm', () => {
  const mockProps = {
    petId: 'pet-123',
    petName: '小白',
    onEntryCreated: jest.fn()
  }

  const mockJournalEntry = {
    id: 'journal-1',
    created_at: '2024-01-01T00:00:00Z',
    user_id: 'user-123',
    pet_id: 'pet-123',
    content: '今天小白很开心。',
    ai_advice: null
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the form with correct elements', () => {
    renderWithIntl(<JournalEntryForm {...mockProps} />)

    expect(screen.getByText('写日记 - 小白')).toBeInTheDocument()
    expect(screen.getByLabelText('今天的日记')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('记录您宠物今天的状况、行为或特别的事情...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '保存日记' })).toBeInTheDocument()
    expect(screen.getByText('0/10,000')).toBeInTheDocument()
  })

  it('should update character count as user types', () => {
    renderWithIntl(<JournalEntryForm {...mockProps} />)
    
    const textarea = screen.getByLabelText('今天的日记')
    fireEvent.change(textarea, { target: { value: '今天小白很开心' } })

    expect(screen.getByText('7/10,000')).toBeInTheDocument()
  })

  it('should disable submit button when content is empty', () => {
    renderWithIntl(<JournalEntryForm {...mockProps} />)
    
    const submitButton = screen.getByRole('button', { name: '保存日记' })
    expect(submitButton).toBeDisabled()
  })

  it('should enable submit button when content is entered', () => {
    renderWithIntl(<JournalEntryForm {...mockProps} />)
    
    const textarea = screen.getByLabelText('今天的日记')
    fireEvent.change(textarea, { target: { value: '今天小白很开心' } })
    
    const submitButton = screen.getByRole('button', { name: '保存日记' })
    expect(submitButton).not.toBeDisabled()
  })

  it('should successfully submit journal entry', async () => {
    mockJournalService.createJournalEntry.mockResolvedValue(mockJournalEntry)
    
    renderWithIntl(<JournalEntryForm {...mockProps} />)
    
    const textarea = screen.getByLabelText('今天的日记')
    const submitButton = screen.getByRole('button', { name: '保存日记' })
    
    fireEvent.change(textarea, { target: { value: '今天小白很开心' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockJournalService.createJournalEntry).toHaveBeenCalledWith('pet-123', '今天小白很开心')
    })

    await waitFor(() => {
      expect(screen.getByText('日记保存成功！')).toBeInTheDocument()
    })

    expect(mockProps.onEntryCreated).toHaveBeenCalledWith(mockJournalEntry)
    expect(textarea).toHaveValue('')
  })

  it('should show loading state during submission', async () => {
    // Mock a delayed response
    mockJournalService.createJournalEntry.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(mockJournalEntry), 100))
    )
    
    renderWithIntl(<JournalEntryForm {...mockProps} />)
    
    const textarea = screen.getByLabelText('今天的日记')
    const submitButton = screen.getByRole('button', { name: '保存日记' })
    
    fireEvent.change(textarea, { target: { value: '今天小白很开心' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('保存中...')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
      expect(textarea).toBeDisabled()
    })

    await waitFor(() => {
      expect(screen.getByText('日记保存成功！')).toBeInTheDocument()
    })
  })

  it('should show error message when submission fails', async () => {
    mockJournalService.createJournalEntry.mockRejectedValue(new Error('保存失败'))
    
    renderWithIntl(<JournalEntryForm {...mockProps} />)
    
    const textarea = screen.getByLabelText('今天的日记')
    const submitButton = screen.getByRole('button', { name: '保存日记' })
    
    fireEvent.change(textarea, { target: { value: '今天小白很开心' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('保存日记失败，请重试')).toBeInTheDocument()
    })

    expect(mockProps.onEntryCreated).not.toHaveBeenCalled()
  })

  it('should handle authentication error', async () => {
    mockJournalService.createJournalEntry.mockRejectedValue(new Error('not authenticated'))
    
    renderWithIntl(<JournalEntryForm {...mockProps} />)
    
    const textarea = screen.getByLabelText('今天的日记')
    const submitButton = screen.getByRole('button', { name: '保存日记' })
    
    fireEvent.change(textarea, { target: { value: '今天小白很开心' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('邮箱或密码不正确')).toBeInTheDocument()
    })
  })

  it('should handle pet not found error', async () => {
    mockJournalService.createJournalEntry.mockRejectedValue(new Error('Pet not found'))
    
    renderWithIntl(<JournalEntryForm {...mockProps} />)
    
    const textarea = screen.getByLabelText('今天的日记')
    const submitButton = screen.getByRole('button', { name: '保存日记' })
    
    fireEvent.change(textarea, { target: { value: '今天小白很开心' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('请先选择一个宠物')).toBeInTheDocument()
    })
  })

  it('should clear errors when user starts typing', async () => {
    mockJournalService.createJournalEntry.mockRejectedValue(new Error('保存失败'))
    
    renderWithIntl(<JournalEntryForm {...mockProps} />)
    
    const textarea = screen.getByLabelText('今天的日记')
    const submitButton = screen.getByRole('button', { name: '保存日记' })
    
    fireEvent.change(textarea, { target: { value: '今天小白很开心' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('保存日记失败，请重试')).toBeInTheDocument()
    })

    // Start typing again
    fireEvent.change(textarea, { target: { value: '今天小白很开心，玩了球' } })

    // Error should be cleared
    expect(screen.queryByText('保存日记失败，请重试')).not.toBeInTheDocument()
  })

  it('should hide success message after 3 seconds', async () => {
    jest.useFakeTimers()
    mockJournalService.createJournalEntry.mockResolvedValue(mockJournalEntry)
    
    renderWithIntl(<JournalEntryForm {...mockProps} />)
    
    const textarea = screen.getByLabelText('今天的日记')
    const submitButton = screen.getByRole('button', { name: '保存日记' })
    
    fireEvent.change(textarea, { target: { value: '今天小白很开心' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('日记保存成功！')).toBeInTheDocument()
    })

    // Fast-forward time by 3 seconds
    jest.advanceTimersByTime(3000)

    await waitFor(() => {
      expect(screen.queryByText('日记保存成功！')).not.toBeInTheDocument()
    })

    jest.useRealTimers()
  })

  describe('AI Analysis Functionality', () => {
    // Mock fetch for AI analysis API
    const mockFetch = jest.fn()
    global.fetch = mockFetch as jest.MockedFunction<typeof fetch>

    beforeEach(() => {
      jest.clearAllMocks()
      mockFetch.mockClear()
    })

    it('should trigger AI analysis after successful journal entry creation', async () => {
      mockJournalService.createJournalEntry.mockResolvedValue(mockJournalEntry)
      // Add a small delay to make the async behavior more realistic
      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ success: true, ai_advice: '这是AI的建议' })
        } as Response), 50))
      )

      renderWithIntl(<JournalEntryForm {...mockProps} />)
      
      const textarea = screen.getByLabelText('今天的日记')
      const submitButton = screen.getByRole('button', { name: '保存日记' })
      
      fireEvent.change(textarea, { target: { value: '今天小白很开心' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('日记保存成功！')).toBeInTheDocument()
      })

      // Should show AI analysis section and loading state
      await waitFor(() => {
        expect(screen.getByText('AI护理建议')).toBeInTheDocument()
      }, { timeout: 2000 })

      // Should show AI advice when analysis completes
      await waitFor(() => {
        expect(screen.getByText('这是AI的建议')).toBeInTheDocument()
      }, { timeout: 2000 })

      expect(mockFetch).toHaveBeenCalledWith('/api/pets/pet-123/journal/journal-1/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
    })

    it('should display AI analysis loading state', async () => {
      mockJournalService.createJournalEntry.mockResolvedValue(mockJournalEntry)
      // Mock fetch to delay
      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ success: true, ai_advice: '这是AI的建议' })
        } as Response), 100))
      )

      renderWithIntl(<JournalEntryForm {...mockProps} />)
      
      const textarea = screen.getByLabelText('今天的日记')
      const submitButton = screen.getByRole('button', { name: '保存日记' })
      
      fireEvent.change(textarea, { target: { value: '今天小白很开心' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('日记保存成功！')).toBeInTheDocument()
      })

      // Should show loading spinner and text
      await waitFor(() => {
        expect(screen.getByText('正在分析日记内容...')).toBeInTheDocument()
        const spinner = document.querySelector('.animate-spin')
        expect(spinner).toBeInTheDocument()
      })
    })

    it('should handle AI analysis rate limit error', async () => {
      mockJournalService.createJournalEntry.mockResolvedValue(mockJournalEntry)
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: 'Rate limited' })
      } as Response)

      renderWithIntl(<JournalEntryForm {...mockProps} />)
      
      const textarea = screen.getByLabelText('今天的日记')
      const submitButton = screen.getByRole('button', { name: '保存日记' })
      
      fireEvent.change(textarea, { target: { value: '今天小白很开心' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('日记保存成功！')).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByText(/AI分析暂时不可用：AI分析请求过于频繁/)).toBeInTheDocument()
      })
    })

    it('should handle AI service unavailable error', async () => {
      mockJournalService.createJournalEntry.mockResolvedValue(mockJournalEntry)
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' })
      } as Response)

      renderWithIntl(<JournalEntryForm {...mockProps} />)
      
      const textarea = screen.getByLabelText('今天的日记')
      const submitButton = screen.getByRole('button', { name: '保存日记' })
      
      fireEvent.change(textarea, { target: { value: '今天小白很开心' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('日记保存成功！')).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByText(/AI分析暂时不可用：AI服务暂时不可用/)).toBeInTheDocument()
      })
    })

    it('should display retry button for failed AI analysis', async () => {
      mockJournalService.createJournalEntry.mockResolvedValue(mockJournalEntry)
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' })
      } as Response)

      renderWithIntl(<JournalEntryForm {...mockProps} />)
      
      const textarea = screen.getByLabelText('今天的日记')
      const submitButton = screen.getByRole('button', { name: '保存日记' })
      
      fireEvent.change(textarea, { target: { value: '今天小白很开心' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('日记保存成功！')).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByText(/AI分析暂时不可用/)).toBeInTheDocument()
        expect(screen.getByText('重新分析')).toBeInTheDocument()
      })
    })

    it('should retry AI analysis when retry button is clicked', async () => {
      mockJournalService.createJournalEntry.mockResolvedValue(mockJournalEntry)
      
      // First call fails, second succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ error: 'Internal server error' })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, ai_advice: '重试后的AI建议' })
        } as Response)

      renderWithIntl(<JournalEntryForm {...mockProps} />)
      
      const textarea = screen.getByLabelText('今天的日记')
      const submitButton = screen.getByRole('button', { name: '保存日记' })
      
      fireEvent.change(textarea, { target: { value: '今天小白很开心' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('日记保存成功！')).toBeInTheDocument()
      })

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText(/AI分析暂时不可用/)).toBeInTheDocument()
      })

      // Click retry button
      const retryButton = screen.getByText('重新分析')
      fireEvent.click(retryButton)

      // Should show loading again
      await waitFor(() => {
        expect(screen.getByText('正在分析日记内容...')).toBeInTheDocument()
      })

      // Should show success result
      await waitFor(() => {
        expect(screen.getByText('重试后的AI建议')).toBeInTheDocument()
        expect(screen.queryByText('正在分析日记内容...')).not.toBeInTheDocument()
      })

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('should handle network errors gracefully', async () => {
      mockJournalService.createJournalEntry.mockResolvedValue(mockJournalEntry)
      mockFetch.mockRejectedValue(new Error('Network error'))

      renderWithIntl(<JournalEntryForm {...mockProps} />)
      
      const textarea = screen.getByLabelText('今天的日记')
      const submitButton = screen.getByRole('button', { name: '保存日记' })
      
      fireEvent.change(textarea, { target: { value: '今天小白很开心' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('日记保存成功！')).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByText(/AI分析暂时不可用：Network error/)).toBeInTheDocument()
      })
    })

    it('should display error state with proper styling', async () => {
      mockJournalService.createJournalEntry.mockResolvedValue(mockJournalEntry)
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' })
      } as Response)

      renderWithIntl(<JournalEntryForm {...mockProps} />)
      
      const textarea = screen.getByLabelText('今天的日记')
      const submitButton = screen.getByRole('button', { name: '保存日记' })
      
      fireEvent.change(textarea, { target: { value: '今天小白很开心' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('日记保存成功！')).toBeInTheDocument()
      })

      await waitFor(() => {
        const errorElement = screen.getByText(/AI分析暂时不可用/)
        expect(errorElement).toHaveClass('text-red-700', 'bg-red-50')
      })
    })

    it('should display success state with proper styling', async () => {
      mockJournalService.createJournalEntry.mockResolvedValue(mockJournalEntry)
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, ai_advice: '这是AI的建议' })
      } as Response)

      renderWithIntl(<JournalEntryForm {...mockProps} />)
      
      const textarea = screen.getByLabelText('今天的日记')
      const submitButton = screen.getByRole('button', { name: '保存日记' })
      
      fireEvent.change(textarea, { target: { value: '今天小白很开心' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('这是AI的建议')).toBeInTheDocument()
        const adviceElement = screen.getByText('这是AI的建议')
        expect(adviceElement).toHaveClass('text-blue-800')
      })
    })
  })
})