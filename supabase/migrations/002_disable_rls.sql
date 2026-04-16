-- Disable Row Level Security on all tables.
-- This is a personal single-user app with no auth, so RLS just blocks everything.
-- Run this in the Supabase SQL editor.

alter table exercises disable row level security;
alter table workout_templates disable row level security;
alter table warmups disable row level security;
alter table workout_sessions disable row level security;
alter table workout_sets disable row level security;
alter table bjj_sessions disable row level security;