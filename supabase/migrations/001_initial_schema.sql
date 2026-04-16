-- Enable UUID generation
create extension if not exists "pgcrypto";

-- Enums
create type exercise_type as enum ('weighted', 'bodyweight', 'timed', 'timed_carry', 'unilateral');
create type weight_unit as enum ('kg', 'lbs');
create type workout_day as enum ('A', 'B');
create type bjj_class_type as enum ('fundamentals', 'advanced');
create type set_side as enum ('left', 'right');

-- Exercises
create table exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type exercise_type not null,
  default_unit weight_unit,
  suggested_sets int not null default 3,
  suggested_reps text not null default '8-10',
  notes text,
  created_at timestamptz not null default now()
);

-- Workout templates (day -> exercise order)
create table workout_templates (
  id uuid primary key default gen_random_uuid(),
  day workout_day not null,
  exercise_id uuid not null references exercises(id) on delete cascade,
  "order" int not null
);

-- Warmups
create table warmups (
  id uuid primary key default gen_random_uuid(),
  day workout_day not null,
  name text not null,
  prescription text not null,
  "order" int not null
);

-- Workout sessions
create table workout_sessions (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  day workout_day not null,
  pre_feeling int check (pre_feeling between 1 and 5),
  pre_notes text,
  post_feeling int check (post_feeling between 1 and 5),
  post_notes text,
  warmup_completed boolean not null default false,
  created_at timestamptz not null default now()
);

-- Workout sets
create table workout_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references workout_sessions(id) on delete cascade,
  exercise_id uuid not null references exercises(id),
  set_number int not null,
  weight float,
  unit weight_unit,
  reps int,
  duration_seconds int,
  is_warmup boolean not null default false,
  side set_side,
  note text
);

-- BJJ sessions
create table bjj_sessions (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  class_type bjj_class_type not null,
  duration_minutes int not null default 60,
  techniques text,
  rounds int,
  round_duration int default 300,
  break_duration int default 60,
  intensity int check (intensity between 1 and 5),
  notes text,
  created_at timestamptz not null default now()
);

-- Indexes
create index on workout_sets(session_id);
create index on workout_sets(exercise_id);
create index on workout_sessions(date);
create index on bjj_sessions(date);
create index on workout_templates(day, "order");
