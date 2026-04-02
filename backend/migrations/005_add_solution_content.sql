-- Migration 005: add solution_content to error_codes
-- Stores the fetched HTML text of the solution page so expired tokens don't
-- prevent users from accessing the content.
ALTER TABLE error_codes ADD COLUMN IF NOT EXISTS solution_content TEXT;
