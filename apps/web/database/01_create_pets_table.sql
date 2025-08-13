-- Create pets table with proper schema for Story 1.4
-- This table stores pet profiles linked to users via user_id foreign key

-- Create pets table
CREATE TABLE public.pets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (length(name) > 0 AND length(name) <= 100),
    breed TEXT CHECK (length(breed) <= 100),
    date_of_birth DATE,
    photo_url TEXT,
    CONSTRAINT unique_user_pet_name UNIQUE (user_id, name)
);

-- Create index on user_id for efficient queries
CREATE INDEX idx_pets_user_id ON public.pets(user_id);

-- Create index on created_at for sorting
CREATE INDEX idx_pets_created_at ON public.pets(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Users can only access their own pets
CREATE POLICY "Users can view their own pets" ON public.pets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pets" ON public.pets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pets" ON public.pets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pets" ON public.pets
    FOR DELETE USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pets TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;