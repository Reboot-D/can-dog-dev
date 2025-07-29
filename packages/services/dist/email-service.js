import { Resend } from 'resend';
import { validateEmailConfig, EMAIL_SERVICE_CONFIG } from './email-config';
export class EmailService {
    constructor(options = {}) {
        this.config = validateEmailConfig();
        this.resend = new Resend(this.config.resendApiKey);
        this.options = { ...EMAIL_SERVICE_CONFIG, ...options };
    }
    async sendEmail(request) {
        try {
            this.logEmailSendAttempt(request);
            const emailPayload = {
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
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logEmailError(request, errorMessage);
            return {
                success: false,
                error: errorMessage,
            };
        }
    }
    async sendEmailWithRetry(request) {
        let lastError = '';
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
    formatEmailAddress(address) {
        return address.name ? `${address.name} <${address.email}>` : address.email;
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    logEmailSendAttempt(request) {
        console.log(`[EmailService] Sending email to: ${request.to.map(t => t.email).join(', ')}`);
        console.log(`[EmailService] Subject: ${request.subject}`);
    }
    logEmailSuccess(request, messageId) {
        console.log(`[EmailService] ✅ Email sent successfully`);
        if (messageId) {
            console.log(`[EmailService] Message ID: ${messageId}`);
        }
    }
    logEmailError(request, error) {
        console.error(`[EmailService] ❌ Failed to send email:`, error);
        console.error(`[EmailService] Recipients: ${request.to.map(t => t.email).join(', ')}`);
    }
}
