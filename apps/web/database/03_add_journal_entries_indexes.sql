-- Migration: Add performance indexes for journal_entries table
-- Description: Adds database indexes for common query patterns to improve performance
-- Date: 2025-07-28

-- Index for querying journal entries by user (for user isolation via RLS)
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id 
ON journal_entries(user_id);

-- Index for querying journal entries by pet (most common use case)
CREATE INDEX IF NOT EXISTS idx_journal_entries_pet_id 
ON journal_entries(pet_id);

-- Composite index for querying journal entries by pet ordered by creation date
-- This covers the common query pattern: get journal entries for a pet, ordered by date
CREATE INDEX IF NOT EXISTS idx_journal_entries_pet_id_created_at 
ON journal_entries(pet_id, created_at DESC);

-- Composite index for user-pet-date queries (for advanced filtering in future features)
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_pet_created 
ON journal_entries(user_id, pet_id, created_at DESC);

-- Index for created_at for temporal queries (e.g., recent entries, date ranges)
CREATE INDEX IF NOT EXISTS idx_journal_entries_created_at 
ON journal_entries(created_at DESC);

-- Performance optimization: Add index for content text search (for future search features)
-- Using gin index for full-text search capabilities
CREATE INDEX IF NOT EXISTS idx_journal_entries_content_search 
ON journal_entries USING gin(to_tsvector('english', content));

-- Update table statistics to help query planner
ANALYZE journal_entries;