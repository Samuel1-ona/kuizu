-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- Migration: Add level system (100 levels, difficulty 1–10)

-- 1. Add difficulty to questions (1–10 scale, levels 11+ reuse difficulty 10)
ALTER TABLE questions ADD COLUMN IF NOT EXISTS difficulty INTEGER NOT NULL DEFAULT 1 CHECK (difficulty >= 1 AND difficulty <= 10);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions (difficulty);

-- 2. Add level to game sessions
ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1;

-- 3. Player progress table
CREATE TABLE IF NOT EXISTS player_progress (
  wallet_address TEXT PRIMARY KEY,
  current_level INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Tag existing questions with difficulty based on category
UPDATE questions SET difficulty = 1 WHERE category IN ('Pop Culture', 'Sports', 'Music');
UPDATE questions SET difficulty = 2 WHERE category IN ('Geography', 'History', 'Nature');
UPDATE questions SET difficulty = 3 WHERE category IN ('Science', 'Math', 'Technology', 'Art');
UPDATE questions SET difficulty = 4 WHERE category IN ('Crypto', 'Language');
