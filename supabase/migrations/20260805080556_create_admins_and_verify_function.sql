/*
# Custom admin login (username + password)

1. Overview
Replaces the email-based Supabase Auth admin login with a simple
username/password login. The admin logs in with username "admin" and
password "ima2026". The password is stored as a bcrypt hash in a new
`admins` table; the browser never reads the hash. A SECURITY DEFINER
function `verify_admin(username, password)` does the comparison server-side
and returns a boolean.

2. New Tables
- `admins`
  - `id` (uuid, primary key)
  - `username` (text, unique, not null)
  - `password_hash` (text, not null) — bcrypt hash
  - `created_at` (timestamptz, default now())

3. Security
- RLS enabled on `admins` with NO policies — the anon/authenticated roles
  cannot read or write the table at all. The password hash is invisible to
  the browser.
- `verify_admin(p_username, p_password)` is a SECURITY DEFINER function
  owned by the postgres role. It reads the `admins` table (bypassing RLS via
  the owner privilege) and compares the supplied password against the stored
  bcrypt hash using `crypt()`. Returns true on match, false otherwise.
- The function is executable by the `anon` role so the kiosk/login screen can
  call it, but it only ever returns a boolean — never the hash.

4. Seed
- Inserts one row: username "admin", password "ima2026" (bcrypt hashed).
*/

CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- No policies: deny all direct access from anon/authenticated.

-- Seed the default admin (bcrypt hash of "ima2026").
INSERT INTO admins (username, password_hash)
SELECT 'admin', crypt('ima2026', gen_salt('bf', 10))
WHERE NOT EXISTS (SELECT 1 FROM admins WHERE username = 'admin');

-- Verify function: callable by anon, returns boolean only.
CREATE OR REPLACE FUNCTION verify_admin(p_username text, p_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash text;
BEGIN
  SELECT password_hash INTO v_hash
  FROM admins
  WHERE username = p_username
  LIMIT 1;

  IF v_hash IS NULL THEN
    RETURN false;
  END IF;

  RETURN crypt(p_password, v_hash) = v_hash;
END;
$$;

GRANT EXECUTE ON FUNCTION verify_admin(text, text) TO anon, authenticated;
