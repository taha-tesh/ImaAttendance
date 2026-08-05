/*
# Fix verify_admin to use schema-qualified pgcrypto functions

1. Overview
The pgcrypto extension is installed in the `extensions` schema, not `public`.
The previous `verify_admin` function called `crypt()` unqualified, which failed
with "function crypt(text, text) does not exist". This migration rewrites the
function to call `extensions.crypt` and `extensions.gen_salt` explicitly, and
re-seeds the admin password hash using the same qualified calls.

2. Changes
- Recreate `verify_admin(p_username, p_password)` using
  `extensions.crypt(p_password, v_hash)`.
- Update the stored password hash for username "admin" to a fresh bcrypt hash
  of "ima2026" generated via `extensions.gen_salt('bf', 10)`.
- No schema/table changes. No security policy changes.
*/

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

-- Re-seed the admin password hash with the qualified gen_salt.
UPDATE admins
SET password_hash = extensions.crypt('ima2026', extensions.gen_salt('bf', 10))
WHERE username = 'admin';
