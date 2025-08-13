import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EmailService, createTestEmailTemplate, createNotificationEmailTemplate } from '@petcare-ai/services';
import type { TestEmailTemplateData, NotificationEmailTemplateData } from '@petcare-ai/services';
import { z } from 'zod';

const SendEmailRequestSchema = z.object({
  type: z.enum(['test', 'notification']),
  to: z.object({
    email: z.string().email(),
    name: z.string().optional(),
  }),
  data: z.union([
    z.object({
      userName: z.string(),
      petName: z.string(),
      eventType: z.string(),
      eventDate: z.string(),
    }),
    z.object({
      userName: z.string(),
      petName: z.string(),
      notificationTitle: z.string(),
      notificationMessage: z.string(),
      actionUrl: z.string().url().optional(),
    })
  ])
});

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required'
      }, { status: 401 });
    }
    
    const body = await request.json();
    
    // Validate request body
    const validatedRequest = SendEmailRequestSchema.parse(body);
    
    // Initialize email service
    const emailService = new EmailService();
    
    // Determine email template based on type
    let emailTemplate;
    const fromAddress = {
      email: process.env.DEFAULT_FROM_EMAIL || 'noreply@petcare-ai.com',
      name: process.env.DEFAULT_FROM_NAME || 'PetCare AI'
    };
    
    if (validatedRequest.type === 'test') {
      const testData = validatedRequest.data as TestEmailTemplateData;
      emailTemplate = createTestEmailTemplate(testData);
    } else {
      const notificationData = validatedRequest.data as NotificationEmailTemplateData;
      emailTemplate = createNotificationEmailTemplate(notificationData);
    }
    
    // Send email
    const response = await emailService.sendEmailWithRetry({
      from: fromAddress,
      to: [validatedRequest.to],
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });
    
    if (response.success) {
      return NextResponse.json({
        success: true,
        messageId: response.messageId,
        message: 'Email sent successfully'
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        error: response.error,
        message: 'Failed to send email'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('[API] Email send error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: error.issues,
        message: 'Request validation failed'
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'Email API',
    version: '1.0.0',
    endpoints: {
      'POST /api/email/send': 'Send email using templates'
    },
    supportedTypes: ['test', 'notification']
  });
}