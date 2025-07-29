import { createClient } from '@supabase/supabase-js';

export interface Event {
  id: string;
  created_at: string;
  user_id: string;
  pet_id: string;
  title: string;
  due_date: string;
  status: string;
  source: string | null;
  notification_sent_at: string | null;
  pet: {
    name: string;
    breed: string | null;
  };
  user: {
    email: string;
    full_name: string | null;
  };
}

export interface NotificationServiceConfig {
  notificationWindowHours: number; // How many hours ahead to check for events
  supabaseUrl: string;
  supabaseServiceKey: string;
}

export class NotificationService {
  private supabase;
  private config: NotificationServiceConfig;

  constructor(config: NotificationServiceConfig) {
    this.config = config;
    this.supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);
  }

  /**
   * Get events that are due within the notification window and haven't been notified yet
   */
  async getEventsForNotification(): Promise<Event[]> {
    const now = new Date();
    const notificationDeadline = new Date(now.getTime() + (this.config.notificationWindowHours * 60 * 60 * 1000));
    
    // Query events that:
    // 1. Are due within the notification window
    // 2. Haven't been notified yet (notification_sent_at is null)
    // 3. Are still pending (not completed or cancelled)
    const { data: events, error } = await this.supabase
      .from('events')
      .select(`
        id,
        created_at,
        user_id,
        pet_id,
        title,
        due_date,
        status,
        source,
        notification_sent_at,
        pet:pets(name, breed),
        user:profiles(email, full_name)
      `)
      .gte('due_date', now.toISOString().split('T')[0]) // Due date is today or later
      .lte('due_date', notificationDeadline.toISOString().split('T')[0]) // Due date is within notification window
      .is('notification_sent_at', null) // No notification sent yet
      .eq('status', 'pending'); // Only pending events

    if (error) {
      console.error('[NotificationService] Error fetching events for notification:', error);
      throw new Error(`Failed to fetch events for notification: ${error.message}`);
    }

    // Transform the data to match our interface
    const transformedEvents: Event[] = (events || []).map(event => ({
      id: event.id,
      created_at: event.created_at,
      user_id: event.user_id,
      pet_id: event.pet_id,
      title: event.title,
      due_date: event.due_date,
      status: event.status,
      source: event.source,
      notification_sent_at: event.notification_sent_at,
      pet: {
        name: (event as any).pet?.name || 'Unknown Pet',
        breed: (event as any).pet?.breed || null,
      },
      user: {
        email: (event as any).user?.email || '',
        full_name: (event as any).user?.full_name || null,
      }
    }));

    return transformedEvents;
  }

  /**
   * Mark an event as notified by setting the notification_sent_at timestamp
   */
  async markEventAsNotified(eventId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('events')
      .update({ 
        notification_sent_at: new Date().toISOString() 
      })
      .eq('id', eventId);

    if (error) {
      console.error('[NotificationService] Error marking event as notified:', error);
      return false;
    }

    console.log(`[NotificationService] ✅ Event ${eventId} marked as notified`);
    return true;
  }

  /**
   * Check if an event has already been notified
   */
  async isEventNotified(eventId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('events')
      .select('notification_sent_at')
      .eq('id', eventId)
      .single();

    if (error) {
      console.error('[NotificationService] Error checking notification status:', error);
      return false;
    }

    return data?.notification_sent_at !== null;
  }

  /**
   * Get notification statistics for monitoring
   */
  async getNotificationStats(): Promise<{
    pendingNotifications: number;
    sentToday: number;
    totalEvents: number;
  }> {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const notificationDeadline = new Date(now.getTime() + (this.config.notificationWindowHours * 60 * 60 * 1000));

    // Count pending notifications
    const { count: pendingCount } = await this.supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .gte('due_date', now.toISOString().split('T')[0])
      .lte('due_date', notificationDeadline.toISOString().split('T')[0])
      .is('notification_sent_at', null)
      .eq('status', 'pending');

    // Count notifications sent today
    const { count: sentTodayCount } = await this.supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .gte('notification_sent_at', today)
      .lt('notification_sent_at', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    // Count total events
    const { count: totalCount } = await this.supabase
      .from('events')
      .select('*', { count: 'exact', head: true });

    return {
      pendingNotifications: pendingCount || 0,
      sentToday: sentTodayCount || 0,
      totalEvents: totalCount || 0,
    };
  }
}