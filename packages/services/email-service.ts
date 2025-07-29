import { Resend } from 'resend';
import { 
  EmailSendRequest, 
  EmailSendResponse, 
  EmailConfig,
  EmailServiceOptions 
} from './email-types';
import { validateEmailConfig, EMAIL_SERVICE_CONFIG } from './email-config';

export class EmailService {
  private resend: Resend;
  private config: EmailConfig;
  private options: EmailServiceOptions;

  constructor(options: Partial<EmailServiceOptions> = {}) {
    this.config = validateEmailConfig();
    this.resend = new Resend(this.config.resendApiKey);
    this.options = { ...EMAIL_SERVICE_CONFIG, ...options };
  }

  async sendEmail(request: EmailSendRequest): Promise<EmailSendResponse> {
    try {
      this.logEmailSendAttempt(request);

      const emailPayload: any = {
        from: this.formatEmailAddress(request.from),
        to: request.to.map(addr => this.formatEmailAddress(addr)),
        subject: request.subject,
      };

      if (request.cc && request.cc.length > 0) {
        emailPayload.cc = request.cc.map(addr => this.formatEmailAddress(addr));
      }

      if (request.bcc && request.bcc.length > 0) {
        emailPayload.bcc = request.bcc.map(addr => this.formatEmailAddress(addr));
      }

      if (request.html) {
        emailPayload.html = request.html;
      }

      if (request.text) {
        emailPayload.text = request.text;
      }

      const { data, error } = await this.resend.emails.send(emailPayload);

      if (error) {
        this.logEmailError(request, error);
        return {
          success: false,
          error: error.message || 'Failed to send email',
        };
      }

      this.logEmailSuccess(request, data?.id);
      return {
        success: true,
        messageId: data?.id,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logEmailError(request, errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async sendEmailWithRetry(request: EmailSendRequest): Promise<EmailSendResponse> {
    let lastError: string = '';
    
    for (let attempt = 1; attempt <= this.options.retryAttempts; attempt++) {
      const response = await this.sendEmail(request);
      
      if (response.success) {
        return response;
      }
      
      lastError = response.error || 'Unknown error';
      
      if (attempt < this.options.retryAttempts) {
        await this.delay(this.options.retryDelay * attempt);
      }
    }
    
    return {
      success: false,
      error: `Failed after ${this.options.retryAttempts} attempts: ${lastError}`,
    };
  }

  private formatEmailAddress(address: { email: string; name?: string }): string {
    return address.name ? `${address.name} <${address.email}>` : address.email;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private logEmailSendAttempt(request: EmailSendRequest): void {
    console.log(`[EmailService] Sending email to: ${request.to.map(t => t.email).join(', ')}`);
    console.log(`[EmailService] Subject: ${request.subject}`);
  }

  private logEmailSuccess(request: EmailSendRequest, messageId?: string): void {
    console.log(`[EmailService] ✅ Email sent successfully`);
    if (messageId) {
      console.log(`[EmailService] Message ID: ${messageId}`);
    }
  }

  private logEmailError(request: EmailSendRequest, error: any): void {
    console.error(`[EmailService] ❌ Failed to send email:`, error);
    console.error(`[EmailService] Recipients: ${request.to.map(t => t.email).join(', ')}`);
  }
}