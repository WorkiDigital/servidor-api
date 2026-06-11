-- Migration 002: form capture rules per client
-- Execute this manually on existing VPS databases.

ALTER TABLE clients ADD COLUMN IF NOT EXISTS form_capture_rules JSONB DEFAULT '[]'::jsonb;
