-- Create events table for Story 3.2
-- This table stores pet care events linked to users and pets

-- Create events table
CREATE TABLE public.events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (length(title) > 0 AND length(title) <= 200),
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    source TEXT CHECK (length(source) <= 200), -- References the care schedule rule id
    CONSTRAINT unique_event_per_pet_date_source UNIQUE (pet_id, due_date, source)
);

-- Create indexes for efficient queries
CREATE INDEX idx_events_user_id ON public.events(user_id);
CREATE INDEX idx_events_pet_id ON public.events(pet_id);
CREATE INDEX idx_events_due_date ON public.events(due_date);
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_source ON public.events(source);

-- Enable Row Level Security (RLS)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies: Users can only access their own pets' events
CREATE POLICY "Users can view their own pets' events" ON public.events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert events for their own pets" ON public.events
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.pets 
            WHERE pets.id = events.pet_id 
            AND pets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own pets' events" ON public.events
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pets' events" ON public.events
    FOR DELETE USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;