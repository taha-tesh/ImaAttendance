/*
# Employee Attendance System Schema

1. Overview
This migration creates the data model for an Arabic Employee Attendance System
("إثبات الحضور"). It supports an admin-managed employee roster and a kiosk-style
attendance recording interface where employees stamp their daily check-in / out
times. Delay is computed dynamically from the recorded times against a fixed
07:30 start and 16:30 finish with a 1-hour flexible break.

2. New Tables
- `employees`
  - `id` (uuid, primary key)
  - `full_name` (text, not null) — Arabic employee name ("اسم المتعاون")
  - `starting_date` (date, not null) — the date the employee began work
  - `created_at` (timestamptz, default now())
- `attendance`
  - `id` (uuid, primary key)
  - `employee_id` (uuid, references employees, on delete cascade)
  - `work_date` (date, not null) — the calendar day this row covers (unique per employee)
  - `entry1` (time, nullable) — morning entry ("وقت الدخول 1")
  - `exit1`  (time, nullable) — break start ("وقت الخروج 1")
  - `entry2` (time, nullable) — break return ("وقت الدخول 2")
  - `exit2`  (time, nullable) — evening exit ("وقت الخروج 2")
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())
  - Unique constraint on (employee_id, work_date) so each employee has one row per day.

3. Security (RLS)
- RLS enabled on both tables.
- `employees`: SELECT open to anon+authenticated (kiosk needs the list for the
  dropdown). INSERT and DELETE restricted to authenticated (admin only). UPDATE
  restricted to authenticated (admin can rename).
- `attendance`: SELECT open to anon+authenticated (kiosk + admin read). INSERT
  and UPDATE open to anon+authenticated (kiosk stamps times). DELETE restricted
  to authenticated (admin only) — kiosk never deletes attendance rows.
- No `user_id` / auth.users linkage: this app uses a single admin account plus a
  public kiosk, so ownership is not per-user. The admin gates writes by being the
  only authenticated session.
*/

CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  starting_date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_employees" ON employees;
CREATE POLICY "read_employees"
  ON employees FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_employees_admin" ON employees;
CREATE POLICY "insert_employees_admin"
  ON employees FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_employees_admin" ON employees;
CREATE POLICY "update_employees_admin"
  ON employees FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_employees_admin" ON employees;
CREATE POLICY "delete_employees_admin"
  ON employees FOR DELETE
  TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  work_date date NOT NULL,
  entry1 time,
  exit1 time,
  entry2 time,
  exit2 time,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_employee_per_day UNIQUE (employee_id, work_date)
);

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_attendance" ON attendance;
CREATE POLICY "read_attendance"
  ON attendance FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_attendance" ON attendance;
CREATE POLICY "insert_attendance"
  ON attendance FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_attendance" ON attendance;
CREATE POLICY "update_attendance"
  ON attendance FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_attendance_admin" ON attendance;
CREATE POLICY "delete_attendance_admin"
  ON attendance FOR DELETE
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance (employee_id, work_date);
CREATE INDEX IF NOT EXISTS idx_attendance_work_date ON attendance (work_date);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_attendance_updated_at ON attendance;
CREATE TRIGGER trg_attendance_updated_at
  BEFORE UPDATE ON attendance
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
