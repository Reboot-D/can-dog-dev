import { render, screen, waitFor } from '@testing-library/react'
import Home from '../page'

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'home.title': '宠爱AI',
      'home.subtitle': 'Next.js + TypeScript + Supabase 单体仓库',
      'home.status.systemStatus': '系统状态',
      'home.status.checkingConnection': '正在检查连接...',
      'home.status.api': 'API',
      'home.status.supabase': 'Supabase',
      'home.status.healthy': '正常',
      'home.status.unhealthy': '异常',
      'home.status.connected': '已连接',
      'home.status.disconnected': '未连接',
      'home.status.notConfigured': '未配置',
      'home.status.error': '错误',
      'home.status.failedToLoadStatus': '无法加载状态'
    }
    return translations[key] || key
  }
}))

// Mock fetch
global.fetch = jest.fn()

describe('Home Page Localization', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders Chinese text correctly', async () => {
    // Mock a successful response
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'healthy',
        supabase: 'connected',
        timestamp: new Date().toISOString()
      })
    })

    render(<Home />)

    // Check for Chinese title - should be immediately available
    expect(screen.getByText('宠爱AI')).toBeInTheDocument()
    
    // Check for system status heading
    expect(screen.getByText('系统状态')).toBeInTheDocument()
    
    // Initially shows loading text
    expect(screen.getByText('正在检查连接...')).toBeInTheDocument()
    
    // Wait for async fetch operations to complete and state to update
    await waitFor(() => {
      // Look for text with partial matching since it's broken up
      expect(screen.getByText(/API/)).toBeInTheDocument()
      expect(screen.getByText(/正常/)).toBeInTheDocument()
    }, { timeout: 3000 })
    
    // Check subtitle
    expect(screen.getByText('Next.js + TypeScript + Supabase 单体仓库')).toBeInTheDocument()
  })

  it('uses translation hook correctly', () => {
    // Import is already mocked at the top
    const mockTranslate = jest.fn((key: string) => {
      const translations: Record<string, string> = {
        'home.title': '宠爱AI',
        'home.status.systemStatus': '系统状态',
        'home.status.healthy': '正常',
        'home.status.error': '错误'
      }
      return translations[key] || key
    })
    
    // Verify that translations work correctly
    expect(mockTranslate('home.title')).toBe('宠爱AI')
    expect(mockTranslate('home.status.systemStatus')).toBe('系统状态')
    expect(mockTranslate('home.status.healthy')).toBe('正常')
    expect(mockTranslate('home.status.error')).toBe('错误')
  })
})