import { GET, POST } from '../route';
import { 
  NotificationService, 
  AIContentService, 
  EmailService 
} from '@petcare-ai/services';

// Mock the services
jest.mock('@petcare-ai/services', () => ({
  NotificationService: jest.fn(),
  AIContentService: jest.fn(),
  EmailService: jest.fn(),
  createAINotificationEmailTemplate: jest.fn().mockReturnValue({
    subject: '测试主题',
    html: '<p>测试内容</p>',
    text: '测试内容'
  })
}));

// Mock environment variables
const originalEnv = process.env;

describe('/api/cron/check-notifications', () => {
  let mockNotificationService: jest.Mocked<NotificationService>;
  let mockAIContentService: jest.Mocked<AIContentService>;
  let mockEmailService: jest.Mocked<EmailService>;

  // Helper function to create mock request
  const createMockRequest = (headers: Record<string, string> = {}, method: string = 'GET') => {
    return {
      headers: {
        get: jest.fn((key: string) => headers[key] || null)
      },
      method
    } as unknown as Request;
  };

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      CRON_SECRET: 'test-secret',
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
      GEMINI_API_KEY: 'test-gemini-key',
      DEFAULT_FROM_EMAIL: 'test@example.com',
      DEFAULT_FROM_NAME: 'Test Service'
    };

    mockNotificationService = {
      getEventsForNotification: jest.fn(),
      markEventAsNotified: jest.fn(),
      getNotificationStats: jest.fn().mockResolvedValue({
        pendingNotifications: 0,
        sentToday: 1,
        totalEvents: 10
      })
    };

    mockAIContentService = {
      generateNotificationContent: jest.fn()
    };

    mockEmailService = {
      sendEmailWithRetry: jest.fn()
    };

    (NotificationService as jest.Mock).mockImplementation(() => mockNotificationService);
    (AIContentService as jest.Mock).mockImplementation(() => mockAIContentService);
    (EmailService as jest.Mock).mockImplementation(() => mockEmailService);
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should handle successful notification processing', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          pet: { name: '小白', breed: '金毛' },
          user: { email: 'user@example.com', full_name: '张三' },
          title: '疫苗接种',
          due_date: '2024-01-15'
        }
      ];

      const mockAIContent = {
        success: true,
        subject: '小白的疫苗接种提醒',
        friendlyReminder: '温馨提醒',
        careTip: '护理建议'
      };

      const mockEmailResponse = {
        success: true,
        messageId: 'msg-123'
      };

      mockNotificationService.getEventsForNotification.mockResolvedValue(mockEvents);
      mockAIContentService.generateNotificationContent.mockResolvedValue(mockAIContent);
      mockEmailService.sendEmailWithRetry.mockResolvedValue(mockEmailResponse);
      mockNotificationService.markEventAsNotified.mockResolvedValue(true);

      const request = createMockRequest({
        authorization: 'Bearer test-secret'
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.stats.notificationsSent).toBe(1);
      expect(data.stats.errors).toBe(0);
    });

    it('should handle no events to process', async () => {
      mockNotificationService.getEventsForNotification.mockResolvedValue([]);

      const request = createMockRequest({
        authorization: 'Bearer test-secret'
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('No notifications to send');
      expect(data.stats.eventsProcessed).toBe(0);
    });

    it('should handle unauthorized requests', async () => {
      const request = createMockRequest({
        authorization: 'Bearer wrong-secret'
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should handle AI content generation failures', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          pet: { name: '小白', breed: '金毛' },
          user: { email: 'user@example.com', full_name: '张三' },
          title: '疫苗接种',
          due_date: '2024-01-15'
        }
      ];

      mockNotificationService.getEventsForNotification.mockResolvedValue(mockEvents);
      mockAIContentService.generateNotificationContent.mockResolvedValue({
        success: false,
        error: 'AI service unavailable'
      });

      const request = createMockRequest({
        authorization: 'Bearer test-secret'
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.stats.errors).toBe(1);
      expect(data.stats.notificationsSent).toBe(0);
      expect(data.results[0].success).toBe(false);
      expect(data.results[0].error).toContain('AI content generation failed');
    });

    it('should handle email sending failures', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          pet: { name: '小白', breed: '金毛' },
          user: { email: 'user@example.com', full_name: '张三' },
          title: '疫苗接种',
          due_date: '2024-01-15'
        }
      ];

      const mockAIContent = {
        success: true,
        subject: '小白的疫苗接种提醒',
        friendlyReminder: '温馨提醒',
        careTip: '护理建议'
      };

      mockNotificationService.getEventsForNotification.mockResolvedValue(mockEvents);
      mockAIContentService.generateNotificationContent.mockResolvedValue(mockAIContent);
      mockEmailService.sendEmailWithRetry.mockResolvedValue({
        success: false,
        error: 'Email service unavailable'
      });

      const request = createMockRequest({
        authorization: 'Bearer test-secret'
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.stats.errors).toBe(1);
      expect(data.stats.notificationsSent).toBe(0);
      expect(data.results[0].success).toBe(false);
      expect(data.results[0].error).toContain('Email sending failed');
    });

    it('should limit notifications per run', async () => {
      // Create 60 mock events (more than MAX_NOTIFICATIONS_PER_RUN = 50)
      const mockEvents = Array.from({ length: 60 }, (_, i) => ({
        id: `event-${i}`,
        pet: { name: `宠物${i}`, breed: '金毛' },
        user: { email: `user${i}@example.com`, full_name: `用户${i}` },
        title: '疫苗接种',
        due_date: '2024-01-15'
      }));

      mockNotificationService.getEventsForNotification.mockResolvedValue(mockEvents);
      mockAIContentService.generateNotificationContent.mockResolvedValue({
        success: true,
        subject: '提醒',
        friendlyReminder: '温馨提醒',
        careTip: '护理建议'
      });
      mockEmailService.sendEmailWithRetry.mockResolvedValue({
        success: true,
        messageId: 'msg-123'
      });
      mockNotificationService.markEventAsNotified.mockResolvedValue(true);

      const request = createMockRequest({
        authorization: 'Bearer test-secret'
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.stats.eventsProcessed).toBe(50); // Should be limited to 50
      expect(data.stats.notificationsSent).toBe(50);
    });

    it('should handle service initialization errors', async () => {
      // Mock a constructor error
      (NotificationService as jest.Mock).mockImplementation(() => {
        throw new Error('Service initialization failed');
      });

      const request = createMockRequest({
        authorization: 'Bearer test-secret'
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Service initialization failed');
    });
  });

  describe('POST', () => {
    it('should delegate to GET method', async () => {
      mockNotificationService.getEventsForNotification.mockResolvedValue([]);

      const request = createMockRequest({
        authorization: 'Bearer test-secret'
      }, 'POST');

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('environment variable validation', () => {
    it('should handle missing environment variables', async () => {
      delete process.env.GEMINI_API_KEY;

      const request = createMockRequest({
        authorization: 'Bearer test-secret'
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });
});