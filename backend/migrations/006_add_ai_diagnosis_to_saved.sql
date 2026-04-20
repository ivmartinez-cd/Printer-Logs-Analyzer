-- Migration 006: Add AI diagnosis result to saved analyses.
ALTER TABLE saved_analyses ADD COLUMN IF NOT EXISTS ai_diagnosis TEXT;
