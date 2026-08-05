-- Create pgcrypto extension if it is not already available.
-- This is required for gen_random_uuid() and bcrypt password hashing.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
