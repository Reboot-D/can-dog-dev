import { NextRequest, NextResponse } from 'next/server';
import { EmailService, createTestEmailTemplate } from '@petcare-ai/services';
import type { TestEmailTemplateData } from '@petcare-ai/services';

// Simple test endpoint without authentication for initial testing
export async function POST(request: NextRequest) {
  try {    
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
      userName: '测试用户',
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
          timestamp: new Date().toISOString(),
          encoding: 'UTF-8',
          features: [
            '中文字符支持 (Chinese character support)',
            '表情符号支持 (Emoji support)', 
            'HTML格式邮件 (HTML email format)',
            '文本格式备选 (Text format fallback)'
          ]
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
    console.error('[API] Simple test email error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'Simple Email Test API',
    version: '1.0.0',
    description: 'Send test emails with Chinese content (no auth required)',
    usage: 'POST with { "testEmail": "your@email.com" }',
    features: [
      'Chinese character validation',
      'UTF-8 encoding verification', 
      'HTML template rendering',
      'Text format fallback',
      'Emoji support testing'
    ]
  });
}