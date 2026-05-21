-- Update existing exercises
UPDATE exercises SET suggested_sets = 4 WHERE name = 'RDL';
UPDATE exercises SET suggested_sets = 4, notes = 'Fresh — heaviest press of the day' WHERE name = 'Bench Press';
UPDATE exercises SET suggested_sets = 4, notes = 'Add weight once regularly hitting 10+' WHERE name = 'Pull Ups';
UPDATE exercises SET suggested_sets = 4, suggested_reps = '6-8', notes = 'First — fresh chest, load it heavy' WHERE name = 'Incline DB Bench';
UPDATE exercises SET notes = 'After incline — shoulder finisher' WHERE name = 'OHP';
UPDATE exercises SET suggested_sets = 4 WHERE name = 'Barbell Squat';
UPDATE exercises SET suggested_reps = '40s', notes = '10s per side. Weight is per side.' WHERE name = 'Front Rack Carry';

-- Add Bulgarian Split Squat (skip if already exists)
INSERT INTO exercises (name, type, default_unit, suggested_sets, suggested_reps, notes)
SELECT 'Bulgarian Split Squat', 'weighted', 'kg', 3, '8-12 per leg', 'Quad volume + single-leg balance.'
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Bulgarian Split Squat');

-- Rebuild Day A template
DELETE FROM workout_templates WHERE day = 'A';
INSERT INTO workout_templates (day, exercise_id, "order")
SELECT 'A', id, row_number() OVER ()
FROM exercises
WHERE name IN (
  'Back Extensions', 'Side Hyper Extensions', 'RDL', 'Bench Press',
  'Pull Ups', 'Bulgarian Split Squat', 'Front Rack Carry'
)
ORDER BY CASE name
  WHEN 'Back Extensions'        THEN 1
  WHEN 'Side Hyper Extensions'  THEN 2
  WHEN 'RDL'                    THEN 3
  WHEN 'Bench Press'            THEN 4
  WHEN 'Pull Ups'               THEN 5
  WHEN 'Bulgarian Split Squat'  THEN 6
  WHEN 'Front Rack Carry'       THEN 7
END;

-- Rebuild Day B template
DELETE FROM workout_templates WHERE day = 'B';
INSERT INTO workout_templates (day, exercise_id, "order")
SELECT 'B', id, row_number() OVER ()
FROM exercises
WHERE name IN (
  'Back Extensions', 'Side Hyper Extensions', 'Barbell Squat', 'Incline DB Bench',
  'OHP', 'Chest Supported Row', 'Dead Bug'
)
ORDER BY CASE name
  WHEN 'Back Extensions'        THEN 1
  WHEN 'Side Hyper Extensions'  THEN 2
  WHEN 'Barbell Squat'          THEN 3
  WHEN 'Incline DB Bench'       THEN 4
  WHEN 'OHP'                    THEN 5
  WHEN 'Chest Supported Row'    THEN 6
  WHEN 'Dead Bug'               THEN 7
END;
