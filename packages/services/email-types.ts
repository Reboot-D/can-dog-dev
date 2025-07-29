export interface EmailAddress {
  email: string;
  name?: string;
}

export interface EmailTemplate {
  subject: string;
  html?: string;
  text?: string;
}

export interface EmailSendRequest {
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  subject: string;
  html?: string;
  text?: string;
  template?: EmailTemplate;
}

export interface EmailSendResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailConfig {
  resendApiKey: string;
  defaultFromEmail: string;
  defaultFromName?: string;
}

export interface EmailServiceOptions {
  retryAttempts: number;
  retryDelay: number;
  timeout: number;
}

export interface TestEmailTemplateData {
  userName: string;
  petName: string;
  eventType: string;
  eventDate: string;
}

export interface NotificationEmailTemplateData {
  userName: string;
  petName: string;
  notificationTitle: string;
  notificationMessage: string;
  actionUrl?: string;
}

export interface AINotificationTemplateData {
  subject: string;
  petName: string;
  petBreed?: string;
  eventTitle: string;
  eventDate: string;
  friendlyReminder: string;
  careTip: string;
}