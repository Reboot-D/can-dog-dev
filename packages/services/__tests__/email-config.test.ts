import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { validateEmailConfig, EMAIL_SERVICE_CONFIG } from '../email-config';

const originalEnv = process.env;

describe('Email Configuration', () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('validateEmailConfig', () => {
    it('should validate correct configuration', () => {
      process.env.RESEND_API_KEY = 're_valid_key_123';
      process.env.DEFAULT_FROM_EMAIL = 'test@petcare.com';
      process.env.DEFAULT_FROM_NAME = 'Test PetCare';

      const config = validateEmailConfig();

      expect(config.resendApiKey).toBe('re_valid_key_123');
      expect(config.defaultFromEmail).toBe('test@petcare.com');
      expect(config.defaultFromName).toBe('Test PetCare');
    });

    it('should use default values for optional fields', () => {
      process.env.RESEND_API_KEY = 're_valid_key_123';
      delete process.env.DEFAULT_FROM_EMAIL;
      delete process.env.DEFAULT_FROM_NAME;

      const config = validateEmailConfig();

      expect(config.resendApiKey).toBe('re_valid_key_123');
      expect(config.defaultFromEmail).toBe('noreply@petcare-ai.com');
      expect(config.defaultFromName).toBe('PetCare AI');
    });

    it('should throw error for missing API key', () => {
      delete process.env.RESEND_API_KEY;

      expect(() => validateEmailConfig()).toThrow(
        'RESEND_API_KEY environment variable is required for email service'
      );
    });

    it('should throw error for invalid API key format', () => {
      process.env.RESEND_API_KEY = 'invalid_key_format';

      expect(() => validateEmailConfig()).toThrow(
        'RESEND_API_KEY must be a valid Resend API key (starts with "re_")'
      );
    });

    it('should accept API key with correct format', () => {
      process.env.RESEND_API_KEY = 're_test_123';

      expect(() => validateEmailConfig()).not.toThrow();
    });

    it('should reject empty API key', () => {
      process.env.RESEND_API_KEY = '';

      expect(() => validateEmailConfig()).toThrow(
        'RESEND_API_KEY environment variable is required for email service'
      );
    });
  });

  describe('EMAIL_SERVICE_CONFIG', () => {
    it('should have correct default values', () => {
      expect(EMAIL_SERVICE_CONFIG.retryAttempts).toBe(3);
      expect(EMAIL_SERVICE_CONFIG.retryDelay).toBe(1000);
      expect(EMAIL_SERVICE_CONFIG.timeout).toBe(30000);
    });

    it('should be immutable', () => {
      const originalRetryAttempts = EMAIL_SERVICE_CONFIG.retryAttempts;
      
      // Attempt to modify (this should not affect the original)
      (EMAIL_SERVICE_CONFIG as any).retryAttempts = 5;
      
      expect(EMAIL_SERVICE_CONFIG.retryAttempts).toBe(originalRetryAttempts);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle null API key', () => {
      process.env.RESEND_API_KEY = null as any;

      expect(() => validateEmailConfig()).toThrow(
        'RESEND_API_KEY environment variable is required for email service'
      );
    });

    it('should handle undefined API key', () => {
      process.env.RESEND_API_KEY = undefined as any;

      expect(() => validateEmailConfig()).toThrow(
        'RESEND_API_KEY environment variable is required for email service'
      );
    });

    it('should handle whitespace-only API key', () => {
      process.env.RESEND_API_KEY = '   ';

      expect(() => validateEmailConfig()).toThrow(
        'RESEND_API_KEY environment variable is required for email service'
      );
    });

    it('should handle API key with correct prefix but invalid format', () => {
      process.env.RESEND_API_KEY = 're_';

      // This should pass format validation but might fail at runtime
      expect(() => validateEmailConfig()).not.toThrow();
      
      const config = validateEmailConfig();
      expect(config.resendApiKey).toBe('re_');
    });
  });
});