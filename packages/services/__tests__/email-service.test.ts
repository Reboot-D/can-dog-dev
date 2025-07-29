import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { EmailService } from '../email-service';
import type { EmailSendRequest } from '../email-types';

// Mock Resend
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn()
    }
  }))
}));

// Mock environment variables
const originalEnv = process.env;

describe('EmailService', () => {
  let emailService: EmailService;
  let mockResendSend: jest.MockedFunction<any>;

  beforeEach(() => {
    // Reset environment variables
    process.env = {
      ...originalEnv,
      RESEND_API_KEY: 're_test_key_123',
      DEFAULT_FROM_EMAIL: 'test@petcare-ai.com',
      DEFAULT_FROM_NAME: 'Test PetCare AI'
    };

    // Create fresh service instance
    emailService = new EmailService();
    
    // Get mock function
    const { Resend } = require('resend');
    const mockResendInstance = new Resend();
    mockResendSend = mockResendInstance.emails.send;
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with valid config', () => {
      expect(() => new EmailService()).not.toThrow();
    });

    it('should throw error with invalid API key', () => {
      process.env.RESEND_API_KEY = 'invalid_key';
      expect(() => new EmailService()).toThrow('RESEND_API_KEY must be a valid Resend API key');
    });

    it('should throw error with missing API key', () => {
      delete process.env.RESEND_API_KEY;
      expect(() => new EmailService()).toThrow('RESEND_API_KEY environment variable is required');
    });
  });

  describe('sendEmail', () => {
    const mockRequest: EmailSendRequest = {
      from: { email: 'sender@test.com', name: 'Test Sender' },
      to: [{ email: 'recipient@test.com', name: 'Test Recipient' }],
      subject: 'Test Subject 🐾',
      html: '<h1>Test HTML Content</h1>',
      text: 'Test text content'
    };

    it('should send email successfully', async () => {
      mockResendSend.mockResolvedValue({
        data: { id: 'email-123' },
        error: null
      });

      const result = await emailService.sendEmail(mockRequest);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('email-123');
      expect(mockResendSend).toHaveBeenCalledWith({
        from: 'Test Sender <sender@test.com>',
        to: ['Test Recipient <recipient@test.com>'],
        subject: 'Test Subject 🐾',
        html: '<h1>Test HTML Content</h1>',
        text: 'Test text content'
      });
    });

    it('should handle Resend API error', async () => {
      mockResendSend.mockResolvedValue({
        data: null,
        error: { message: 'API key invalid' }
      });

      const result = await emailService.sendEmail(mockRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('API key invalid');
    });

    it('should handle network error', async () => {
      mockResendSend.mockRejectedValue(new Error('Network error'));

      const result = await emailService.sendEmail(mockRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should format email addresses correctly', async () => {
      mockResendSend.mockResolvedValue({
        data: { id: 'email-123' },
        error: null
      });

      const requestWithoutNames: EmailSendRequest = {
        from: { email: 'sender@test.com' },
        to: [{ email: 'recipient@test.com' }],
        subject: 'Test',
        text: 'Test'
      };

      await emailService.sendEmail(requestWithoutNames);

      expect(mockResendSend).toHaveBeenCalledWith({
        from: 'sender@test.com',
        to: ['recipient@test.com'],
        subject: 'Test',
        text: 'Test'
      });
    });

    it('should handle optional CC and BCC recipients', async () => {
      mockResendSend.mockResolvedValue({
        data: { id: 'email-123' },
        error: null
      });

      const requestWithCcBcc: EmailSendRequest = {
        ...mockRequest,
        cc: [{ email: 'cc@test.com', name: 'CC User' }],
        bcc: [{ email: 'bcc@test.com' }]
      };

      await emailService.sendEmail(requestWithCcBcc);

      expect(mockResendSend).toHaveBeenCalledWith(
        expect.objectContaining({
          cc: ['CC User <cc@test.com>'],
          bcc: ['bcc@test.com']
        })
      );
    });
  });

  describe('sendEmailWithRetry', () => {
    const mockRequest: EmailSendRequest = {
      from: { email: 'sender@test.com' },
      to: [{ email: 'recipient@test.com' }],
      subject: 'Test Subject',
      text: 'Test content'
    };

    it('should succeed on first attempt', async () => {
      mockResendSend.mockResolvedValue({
        data: { id: 'email-123' },
        error: null
      });

      const result = await emailService.sendEmailWithRetry(mockRequest);

      expect(result.success).toBe(true);
      expect(mockResendSend).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      mockResendSend
        .mockResolvedValueOnce({ data: null, error: { message: 'Temporary error' } })
        .mockResolvedValueOnce({ data: null, error: { message: 'Still failing' } })
        .mockResolvedValueOnce({ data: { id: 'email-123' }, error: null });

      const result = await emailService.sendEmailWithRetry(mockRequest);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('email-123');
      expect(mockResendSend).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      mockResendSend.mockResolvedValue({
        data: null,
        error: { message: 'Persistent error' }
      });

      const result = await emailService.sendEmailWithRetry(mockRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed after 3 attempts');
      expect(mockResendSend).toHaveBeenCalledTimes(3);
    });
  });

  describe('Chinese character support', () => {
    it('should handle Chinese characters in email content', async () => {
      mockResendSend.mockResolvedValue({
        data: { id: 'email-123' },
        error: null
      });

      const chineseRequest: EmailSendRequest = {
        from: { email: 'sender@test.com', name: '发送者' },
        to: [{ email: 'recipient@test.com', name: '接收者' }],
        subject: '🐾 宠物护理提醒 - 小白的疫苗接种',
        html: '<h1>您好！这是一封测试邮件。</h1><p>宠物：小白</p>',
        text: '您好！这是一封测试邮件。宠物：小白'
      };

      const result = await emailService.sendEmail(chineseRequest);

      expect(result.success).toBe(true);
      expect(mockResendSend).toHaveBeenCalledWith({
        from: '发送者 <sender@test.com>',
        to: ['接收者 <recipient@test.com>'],
        subject: '🐾 宠物护理提醒 - 小白的疫苗接种',
        html: '<h1>您好！这是一封测试邮件。</h1><p>宠物：小白</p>',
        text: '您好！这是一封测试邮件。宠物：小白'
      });
    });
  });
});