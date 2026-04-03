-- Migration 006: Add description_es column to error_codes for automatic Spanish translations
ALTER TABLE error_codes ADD COLUMN IF NOT EXISTS description_es TEXT;
