import { EmailTemplate, TestEmailTemplateData, NotificationEmailTemplateData, AINotificationTemplateData } from './email-types';
export declare function createTestEmailTemplate(data: TestEmailTemplateData): EmailTemplate;
export declare function createAINotificationEmailTemplate(data: AINotificationTemplateData): EmailTemplate;
export declare function createNotificationEmailTemplate(data: NotificationEmailTemplateData): EmailTemplate;
