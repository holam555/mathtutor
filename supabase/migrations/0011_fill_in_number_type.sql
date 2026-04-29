-- Allow fill_in_number as a valid question type.
-- Previously the constraint only allowed: multiple_choice | fill_in | calculation

ALTER TABLE questions
  DROP CONSTRAINT IF EXISTS questions_question_type_check;

ALTER TABLE questions
  ADD CONSTRAINT questions_question_type_check
  CHECK (question_type IN ('multiple_choice', 'fill_in', 'fill_in_number', 'calculation'));

-- Also update generated_questions to allow fill_in_number
ALTER TABLE generated_questions
  DROP CONSTRAINT IF EXISTS generated_questions_question_type_check;

ALTER TABLE generated_questions
  ADD CONSTRAINT generated_questions_question_type_check
  CHECK (question_type IN ('multiple_choice', 'fill_in', 'fill_in_number', 'calculation'));

-- Update variation_templates so future AI-generated questions for
-- numeric/fraction categories produce fill_in_number type instead of fill_in.
-- Categories with purely numeric or fraction answers:
UPDATE variation_templates
SET template_prompt = replace(template_prompt, '"question_type":"fill_in"', '"question_type":"fill_in_number"')
WHERE category_id IN (
  SELECT id FROM question_categories
  WHERE code IN (
    -- Number: HCF, LCM, Nth LCM, big numbers
    'A3','A4','A5','A6',
    -- Fractions (all operations produce numeric/fraction answers)
    'B1','B4','B5','B6','B7','B8','B9',
    -- Geometry & measurement (numeric answers)
    'D2','D3','D4','D5','D6','D7','D8','D9',
    -- Decimals
    'E1','E2','E4','E5',
    -- Fraction division
    'F1','F2',
    -- Equation solving (answer is a number)
    'G3',
    -- 3D shapes (numeric attributes)
    'H2','H3','H4',
    -- Mixed number conversion, capacity, time
    'I1','I3','I4'
  )
);
