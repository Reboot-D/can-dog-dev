/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';

// Mock the email service
jest.mock('@petcare-ai/services', () => ({
  EmailService: jest.fn().mockImplementation(() => ({
    sendEmailWithRetry: jest.fn()
  })),
  createTestEmailTemplate: jest.fn(),
  createNotificationEmailTemplate: jest.fn()
}));

// Mock Next.js cookies
const mockCookies = {
  getAll: jest.fn().mockReturnValue([]),
  set: jest.fn()
};
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => mockCookies)
}));

// Mock Supabase
const mockCreateClient = jest.fn();
jest.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient
}));

// Mock environment variables
const originalEnv = process.env;

describe('/api/email/send', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let POST: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let GET: any;
  let mockEmailService: {
    sendEmailWithRetry: jest.Mock;
  };
  let mockSupabase: {
    auth: { getUser: jest.Mock };
  };

  beforeEach(async () => {
    process.env = {
      ...originalEnv,
      RESEND_API_KEY: 're_test_key_123',
      DEFAULT_FROM_EMAIL: 'test@petcare-ai.com',
      DEFAULT_FROM_NAME: 'Test PetCare AI'
    };

    // Import route handlers after mocks are set up
    const routeModule = await import('../route');
    POST = routeModule.POST;
    GET = routeModule.GET;

    // Setup mocks
    const services = await import('@petcare-ai/services');
    const { EmailService, createTestEmailTemplate, createNotificationEmailTemplate } = services;

    mockEmailService = {
      sendEmailWithRetry: jest.fn()
    };
    (EmailService as jest.Mock).mockImplementation(() => mockEmailService);

    (createTestEmailTemplate as jest.Mock).mockReturnValue({
      subject: '🐾 宠物护理提醒 - 小白的疫苗接种',
      html: '<h1>测试邮件</h1>',
      text: '测试邮件内容'
    });

    (createNotificationEmailTemplate as jest.Mock).mockReturnValue({
      subject: '🔔 通知标题 - 小白',
      html: '<h1>通知邮件</h1>',
      text: '通知邮件内容'
    });

    mockSupabase = {
      auth: {
        getUser: jest.fn()
      }
    };
    mockCreateClient.mockResolvedValue(mockSupabase);
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return API information', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.service).toBe('Email API');
      expect(data.supportedTypes).toEqual(['test', 'notification']);
    });
  });

  describe('POST', () => {
    const createMockRequest = (body: Record<string, unknown>) => {
      return {
        json: jest.fn().mockResolvedValue(body)
      } as unknown as NextRequest;
    };

    it('should return 401 for unauthenticated requests', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      });

      const request = createMockRequest({
        type: 'test',
        to: { email: 'test@example.com' },
        data: { userName: 'Test', petName: 'Pet', eventType: 'Event', eventDate: '2024-01-01' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should send test email successfully', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'user@test.com' } },
        error: null
      });

      mockEmailService.sendEmailWithRetry.mockResolvedValue({
        success: true,
        messageId: 'email-123'
      });

      const request = createMockRequest({
        type: 'test',
        to: { email: 'test@example.com', name: 'Test User' },
        data: {
          userName: '测试用户',
          petName: '小白',
          eventType: '疫苗接种',
          eventDate: '2024年1月1日'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.messageId).toBe('email-123');
      expect(mockEmailService.sendEmailWithRetry).toHaveBeenCalledWith({
        from: {
          email: 'test@petcare-ai.com',
          name: 'Test PetCare AI'
        },
        to: [{ email: 'test@example.com', name: 'Test User' }],
        subject: '🐾 宠物护理提醒 - 小白的疫苗接种',
        html: '<h1>测试邮件</h1>',
        text: '测试邮件内容'
      });
    });

    it('should send notification email successfully', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'user@test.com' } },
        error: null
      });

      mockEmailService.sendEmailWithRetry.mockResolvedValue({
        success: true,
        messageId: 'email-456'
      });

      const request = createMockRequest({
        type: 'notification',
        to: { email: 'test@example.com' },
        data: {
          userName: '用户',
          petName: '小白',
          notificationTitle: '通知标题',
          notificationMessage: '通知消息',
          actionUrl: 'https://example.com/action'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.messageId).toBe('email-456');
    });

    it('should return 400 for invalid request data', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'user@test.com' } },
        error: null
      });

      const request = createMockRequest({
        type: 'invalid-type',
        to: { email: 'invalid-email' },
        data: {}
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request data');
    });

    it('should return 500 when email service fails', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'user@test.com' } },
        error: null
      });

      mockEmailService.sendEmailWithRetry.mockResolvedValue({
        success: false,
        error: 'SMTP server error'
      });

      const request = createMockRequest({
        type: 'test',
        to: { email: 'test@example.com' },
        data: {
          userName: 'Test',
          petName: 'Pet',
          eventType: 'Event',
          eventDate: '2024-01-01'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('SMTP server error');
    });

    it('should handle Chinese characters in request', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'user@test.com' } },
        error: null
      });

      mockEmailService.sendEmailWithRetry.mockResolvedValue({
        success: true,
        messageId: 'email-chinese'
      });

      const request = createMockRequest({
        type: 'test',
        to: { email: 'test@example.com', name: '测试用户' },
        data: {
          userName: '张三',
          petName: '小花',
          eventType: '体检',
          eventDate: '2024年1月15日'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockEmailService.sendEmailWithRetry).toHaveBeenCalledWith(
        expect.objectContaining({
          to: [{ email: 'test@example.com', name: '测试用户' }]
        })
      );
    });
  });
});