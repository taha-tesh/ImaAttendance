-- Seed the admin user and create the verify_admin function.
-- This migration depends on pgcrypto.

CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- No policies: deny all direct anon/authenticated access.

INSERT INTO admins (username, password_hash)
SELECT 'admin', crypt('ima2026', gen_salt('bf', 10))
WHERE NOT EXISTS (SELECT 1 FROM admins WHERE username = 'admin');

CREATE OR REPLACE FUNCTION verify_admin(p_username text, p_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
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

  RETURN extensions.crypt(p_password, v_hash) = v_hash;
END;
$$;

GRANT EXECUTE ON FUNCTION verify_admin(text, text) TO anon, authenticated;
