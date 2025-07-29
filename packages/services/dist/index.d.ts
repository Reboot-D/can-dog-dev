export { CareScheduleService } from './care-schedule-service';
export { EmailService } from './email-service';
export { createTestEmailTemplate, createNotificationEmailTemplate, createAINotificationEmailTemplate } from './email-templates';
export type { EmailAddress, EmailTemplate, EmailSendRequest, EmailSendResponse, EmailConfig, EmailServiceOptions, TestEmailTemplateData, NotificationEmailTemplateData, AINotificationTemplateData } from './email-types';
export { NotificationService } from './notification-service';
export { AIContentService } from './ai-content-service';
export type { Event, NotificationServiceConfig } from './notification-service';
export type { PetEventContext, AINotificationContent, AIContentServiceConfig } from './ai-content-service';
