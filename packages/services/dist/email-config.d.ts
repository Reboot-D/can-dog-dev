import { EmailConfig } from './email-types';
export declare function validateEmailConfig(): EmailConfig;
export declare const EMAIL_SERVICE_CONFIG: {
    retryAttempts: number;
    retryDelay: number;
    timeout: number;
};
