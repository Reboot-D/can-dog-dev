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
    notificationWindowHours: number;
    supabaseUrl: string;
    supabaseServiceKey: string;
}
export declare class NotificationService {
    private supabase;
    private config;
    constructor(config: NotificationServiceConfig);
    /**
     * Get events that are due within the notification window and haven't been notified yet
     */
    getEventsForNotification(): Promise<Event[]>;
    /**
     * Mark an event as notified by setting the notification_sent_at timestamp
     */
    markEventAsNotified(eventId: string): Promise<boolean>;
    /**
     * Check if an event has already been notified
     */
    isEventNotified(eventId: string): Promise<boolean>;
    /**
     * Get notification statistics for monitoring
     */
    getNotificationStats(): Promise<{
        pendingNotifications: number;
        sentToday: number;
        totalEvents: number;
    }>;
}
