import { render, screen } from '@testing-library/react'
import { UpcomingEvent } from '../upcoming-event'
import { Event } from '@/types/event'

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'title': '即将到来的事件',
      'dueDate': '截止日期',
      'noEvents': '暂无即将到来的事件',
      'status': '状态',
      'statusValues.pending': '待处理',
      'statusValues.completed': '已完成',
      'statusValues.cancelled': '已取消',
    }
    return translations[key] || key
  },
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Calendar: ({ className }: { className?: string }) => <div data-testid="calendar-icon" className={className} />,
  Clock: ({ className }: { className?: string }) => <div data-testid="clock-icon" className={className} />,
}))

// Mock date-fns
jest.mock('date-fns', () => ({
  format: (date: Date) => date.toISOString().split('T')[0],
}))

jest.mock('date-fns/locale', () => ({
  zhCN: {},
}))

const mockEvent: Event = {
  id: '1',
  created_at: '2024-01-01T00:00:00Z',
  user_id: 'user-123',
  pet_id: 'pet-123',
  title: '疫苗接种 - 狂犬病疫苗',
  due_date: '2024-01-15T00:00:00Z',
  status: 'pending',
  source: 'system',
}

describe('UpcomingEvent', () => {
  it('renders loading state', () => {
    const { container } = render(<UpcomingEvent event={null} loading={true} />)
    
    // Check for animate-pulse class in loading state
    const animatedElements = container.querySelectorAll('.animate-pulse')
    expect(animatedElements.length).toBeGreaterThan(0)
    
    // Check for loading skeleton elements
    const skeletonElements = container.querySelectorAll('.bg-gray-200')
    expect(skeletonElements.length).toBeGreaterThan(0)
  })

  it('renders event with correct information', () => {
    render(<UpcomingEvent event={mockEvent} loading={false} />)
    
    // Check title
    expect(screen.getByText('即将到来的事件')).toBeInTheDocument()
    
    // Check event title
    expect(screen.getByText('疫苗接种 - 狂犬病疫苗')).toBeInTheDocument()
    
    // Check due date
    expect(screen.getByText(/截止日期/)).toBeInTheDocument()
    expect(screen.getByText(/2024-01-15/)).toBeInTheDocument()
    
    // Check status
    expect(screen.getByText('状态:')).toBeInTheDocument()
    expect(screen.getByText('待处理')).toBeInTheDocument()
    
    // Check icons
    expect(screen.getAllByTestId('calendar-icon')).toHaveLength(1)
    expect(screen.getByTestId('clock-icon')).toBeInTheDocument()
  })

  it('renders empty state when no event', () => {
    render(<UpcomingEvent event={null} loading={false} />)
    
    // Check title
    expect(screen.getByText('即将到来的事件')).toBeInTheDocument()
    
    // Check empty state message
    expect(screen.getByText('暂无即将到来的事件')).toBeInTheDocument()
    
    // Check empty state icon
    const calendarIcons = screen.getAllByTestId('calendar-icon')
    expect(calendarIcons[1]).toHaveClass('text-gray-300')
  })

  it('renders different event statuses correctly', () => {
    const completedEvent: Event = {
      ...mockEvent,
      status: 'completed',
    }
    
    const { rerender } = render(<UpcomingEvent event={completedEvent} loading={false} />)
    expect(screen.getByText('已完成')).toBeInTheDocument()
    
    const cancelledEvent: Event = {
      ...mockEvent,
      status: 'cancelled',
    }
    
    rerender(<UpcomingEvent event={cancelledEvent} loading={false} />)
    expect(screen.getByText('已取消')).toBeInTheDocument()
  })

  it('applies correct styling classes', () => {
    const { container } = render(<UpcomingEvent event={mockEvent} loading={false} />)
    
    // Check main container styling
    const mainContainer = container.firstChild
    expect(mainContainer).toHaveClass('bg-white rounded-lg shadow-sm border border-gray-200 p-6')
    
    // Check title styling
    const title = screen.getByText('即将到来的事件')
    expect(title).toHaveClass('text-lg font-semibold text-gray-900')
  })
})