create table if not exists run_sessions (
  id                   uuid primary key default gen_random_uuid(),
  date                 date not null,
  started_at           timestamptz,
  duration_seconds     integer,
  distance_meters      numeric,
  elevation_gain_meters numeric,
  avg_pace_sec_per_km  numeric,
  splits               jsonb default '[]'::jsonb,
  notes                text,
  route_points         jsonb default '[]'::jsonb,
  created_at           timestamptz not null default now()
);

create index if not exists run_sessions_date_idx on run_sessions (date desc);
