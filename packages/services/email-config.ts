import { EmailConfig } from './email-types';

export function validateEmailConfig(): EmailConfig {
  const resendApiKey = process.env.RESEND_API_KEY;
  
  if (!resendApiKey) {
    throw new Error(
      'RESEND_API_KEY environment variable is required for email service'
    );
  }

  if (!resendApiKey.startsWith('re_')) {
    throw new Error(
      'RESEND_API_KEY must be a valid Resend API key (starts with "re_")'
    );
  }

  return {
    resendApiKey,
    defaultFromEmail: process.env.DEFAULT_FROM_EMAIL || 'noreply@petcare-ai.com',
    defaultFromName: process.env.DEFAULT_FROM_NAME || 'PetCare AI',
  };
}

export const EMAIL_SERVICE_CONFIG = {
  retryAttempts: 3,
  retryDelay: 1000,
  timeout: 30000,
};