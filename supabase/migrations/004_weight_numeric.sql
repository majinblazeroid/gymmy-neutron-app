-- Fix weight column type: was created as integer in some environments,
-- should be numeric to support fractional weights like 12.5 kg.
alter table workout_sets
  alter column weight type numeric(8, 2) using weight::numeric;
