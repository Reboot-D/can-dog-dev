import { EmailSendRequest, EmailSendResponse, EmailServiceOptions } from './email-types';
export declare class EmailService {
    private resend;
    private config;
    private options;
    constructor(options?: Partial<EmailServiceOptions>);
    sendEmail(request: EmailSendRequest): Promise<EmailSendResponse>;
    sendEmailWithRetry(request: EmailSendRequest): Promise<EmailSendResponse>;
    private formatEmailAddress;
    private delay;
    private logEmailSendAttempt;
    private logEmailSuccess;
    private logEmailError;
}
