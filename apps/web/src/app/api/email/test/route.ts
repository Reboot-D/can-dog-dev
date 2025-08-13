import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EmailService, createTestEmailTemplate } from '@petcare-ai/services';
import type { TestEmailTemplateData } from '@petcare-ai/services';

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
    const { testEmail } = body;

    if (!testEmail || !testEmail.includes('@')) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email',
        message: 'Valid test email address is required'
      }, { status: 400 });
    }

    // Create test email data with Chinese content
    const testData: TestEmailTemplateData = {
      userName: user.email?.split('@')[0] || '用户',
      petName: '小白',
      eventType: '疫苗接种',
      eventDate: new Date().toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      })
    };

    // Initialize email service
    const emailService = new EmailService();
    
    // Create email template
    const emailTemplate = createTestEmailTemplate(testData);
    
    const fromAddress = {
      email: process.env.DEFAULT_FROM_EMAIL || 'noreply@petcare-ai.com',
      name: process.env.DEFAULT_FROM_NAME || 'PetCare AI'
    };

    // Send test email
    const response = await emailService.sendEmailWithRetry({
      from: fromAddress,
      to: [{ email: testEmail, name: testData.userName }],
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    if (response.success) {
      return NextResponse.json({
        success: true,
        messageId: response.messageId,
        message: `Test email with Chinese content sent successfully to ${testEmail}`,
        testData: {
          subject: emailTemplate.subject,
          recipient: testEmail,
          contentType: 'Chinese (Simplified)',
          timestamp: new Date().toISOString()
        }
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        error: response.error,
        message: 'Failed to send test email'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('[API] Test email error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'Email Test API',
    version: '1.0.0',
    description: 'Send test emails with Chinese content',
    usage: {
      method: 'POST',
      body: {
        testEmail: 'recipient@example.com'
      }
    },
    features: [
      'Chinese character support',
      'UTF-8 encoding',
      'HTML and text templates',
      'Authentication required'
    ]
  });
}