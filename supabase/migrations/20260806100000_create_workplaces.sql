-- Workplaces with daily working hours; employees may be assigned to a workplace.

CREATE TABLE IF NOT EXISTS workplaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  break_minutes integer NOT NULL DEFAULT 60,
  total_minutes integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT workplaces_break_nonneg CHECK (break_minutes >= 0),
  CONSTRAINT workplaces_total_positive CHECK (total_minutes > 0)
);

ALTER TABLE workplaces ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS read_workplaces ON workplaces;
CREATE POLICY read_workplaces ON workplaces FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS insert_workplaces ON workplaces;
CREATE POLICY insert_workplaces ON workplaces FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS update_workplaces ON workplaces;
CREATE POLICY update_workplaces ON workplaces FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS delete_workplaces ON workplaces;
CREATE POLICY delete_workplaces ON workplaces FOR DELETE TO authenticated USING (true);

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS workplace_id uuid REFERENCES workplaces(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_employees_workplace_id ON employees(workplace_id);
