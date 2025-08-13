-- Add notification tracking to events table for Story 3.5
-- This adds the ability to track when notifications have been sent

-- Add notification_sent_at column to track when email notifications were sent
ALTER TABLE public.events 
ADD COLUMN notification_sent_at TIMESTAMP WITH TIME ZONE;

-- Add index for efficient querying of notification status
CREATE INDEX idx_events_notification_sent_at ON public.events(notification_sent_at);

-- Add comment to document the column
COMMENT ON COLUMN public.events.notification_sent_at IS 'Timestamp when email notification was sent for this event. NULL means no notification sent yet.';