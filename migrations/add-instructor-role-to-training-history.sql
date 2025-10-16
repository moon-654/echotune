-- Add instructor_role column to training_history table
-- This migration adds support for tracking instructor/mentor roles in training history

ALTER TABLE training_history 
ADD COLUMN instructor_role TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN training_history.instructor_role IS 'Role in training: instructor (강사), mentor (멘토), or null (수강생)';

-- Update existing records to have null instructor_role (default for existing data)
UPDATE training_history 
SET instructor_role = NULL 
WHERE instructor_role IS NULL;
