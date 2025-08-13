import { NextRequest, NextResponse } from 'next/server';
import { 
  NotificationService, 
  AIContentService, 
  EmailService, 
  createAINotificationEmailTemplate,
  type PetEventContext,
  type AINotificationTemplateData
} from '@petcare-ai/services';

// Configuration for the notification system
const NOTIFICATION_WINDOW_HOURS = 48; // Check for events due within 48 hours
const MAX_NOTIFICATIONS_PER_RUN = 50; // Limit notifications per cron job execution

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  // Starting notification check

  try {
    // Verify cron job authorization (Vercel cron secret or internal request)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Unauthorized cron job access attempt
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    // Initialize services
    const notificationService = new NotificationService({
      notificationWindowHours: NOTIFICATION_WINDOW_HOURS,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
    });

    const aiContentService = new AIContentService({
      geminiApiKey: process.env.GEMINI_API_KEY!
    });

    const emailService = new EmailService();

    // Get events that need notifications
    // Fetching events for notification
    const events = await notificationService.getEventsForNotification();
    
    if (events.length === 0) {
      // No events require notifications
      return NextResponse.json({
        success: true,
        message: 'No notifications to send',
        stats: {
          eventsProcessed: 0,
          notificationsSent: 0,
          errors: 0,
          executionTimeMs: Date.now() - startTime
        }
      });
    }

    // Found ${events.length} events requiring notifications

    // Limit the number of notifications per run to avoid timeouts
    const eventsToProcess = events.slice(0, MAX_NOTIFICATIONS_PER_RUN);
    if (events.length > MAX_NOTIFICATIONS_PER_RUN) {
      // Limiting to ${MAX_NOTIFICATIONS_PER_RUN} notifications per run
    }

    // Process each event
    let notificationsSent = 0;
    let errors = 0;
    const processingResults: Array<{
      eventId: string;
      petName: string;
      success: boolean;
      error?: string;
    }> = [];

    for (const event of eventsToProcess) {
      try {
        // Processing event ${event.id} for pet ${event.pet.name}

        // Create context for AI content generation
        const aiContext: PetEventContext = {
          petName: event.pet.name,
          petBreed: event.pet.breed || undefined,
          eventTitle: event.title,
          eventDate: event.due_date,
          userName: event.user.full_name || undefined
        };

        // Generate AI content
        // Generating AI content for ${event.pet.name}
        const aiContent = await aiContentService.generateNotificationContent(aiContext);

        if (!aiContent.success) {
          console.error(`[NotificationCron] AI content generation failed for event ${event.id}:`, aiContent.error);
          processingResults.push({
            eventId: event.id,
            petName: event.pet.name,
            success: false,
            error: `AI content generation failed: ${aiContent.error}`
          });
          errors++;
          continue;
        }

        // Prepare email template data
        const templateData: AINotificationTemplateData = {
          subject: aiContent.subject,
          petName: event.pet.name,
          petBreed: event.pet.breed || undefined,
          eventTitle: event.title,
          eventDate: event.due_date,
          friendlyReminder: aiContent.friendlyReminder,
          careTip: aiContent.careTip
        };

        // Create email template
        const emailTemplate = createAINotificationEmailTemplate(templateData);

        // Send email
        // Sending notification email to ${event.user.email}
        const emailResponse = await emailService.sendEmailWithRetry({
          from: {
            email: process.env.DEFAULT_FROM_EMAIL || 'noreply@petcare-ai.com',
            name: process.env.DEFAULT_FROM_NAME || 'PetCare AI'
          },
          to: [{
            email: event.user.email,
            name: event.user.full_name || undefined
          }],
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text
        });

        if (!emailResponse.success) {
          console.error(`[NotificationCron] Email sending failed for event ${event.id}:`, emailResponse.error);
          processingResults.push({
            eventId: event.id,
            petName: event.pet.name,
            success: false,
            error: `Email sending failed: ${emailResponse.error}`
          });
          errors++;
          continue;
        }

        // Mark event as notified
        const notificationMarked = await notificationService.markEventAsNotified(event.id);
        if (!notificationMarked) {
          // Failed to mark event ${event.id} as notified, but email was sent
        }

        // Successfully sent notification for event ${event.id}
        processingResults.push({
          eventId: event.id,
          petName: event.pet.name,
          success: true
        });
        notificationsSent++;

      } catch (error) {
        console.error(`[NotificationCron] Unexpected error processing event ${event.id}:`, error);
        processingResults.push({
          eventId: event.id,
          petName: event.pet.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        errors++;
      }
    }

    // Get notification statistics
    const stats = await notificationService.getNotificationStats();
    const executionTime = Date.now() - startTime;

    // Completed: ${notificationsSent} sent, ${errors} errors, ${executionTime}ms

    return NextResponse.json({
      success: true,
      message: `Processed ${eventsToProcess.length} events`,
      stats: {
        eventsProcessed: eventsToProcess.length,
        notificationsSent,
        errors,
        executionTimeMs: executionTime,
        ...stats
      },
      results: processingResults
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('[NotificationCron] Fatal error in notification cron job:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Notification cron job failed',
      stats: {
        eventsProcessed: 0,
        notificationsSent: 0,
        errors: 1,
        executionTimeMs: executionTime
      }
    }, { status: 500 });
  }
}

// Support POST for manual triggering (with authentication)
export async function POST(request: NextRequest) {
  // Manual trigger requested
  return GET(request);
}

// Health check endpoint
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}